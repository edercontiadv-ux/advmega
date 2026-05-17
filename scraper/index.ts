import { scrapeDJEN, RawPublication } from './djen';
import { summarize } from './ia';
import { sendAlert } from './telegram';
import { supabase } from './db';
import crypto from 'crypto';

async function main() {
  console.log('=== Iniciando Orquestrador de Automação Diária DJEN ===');
  const startTime = new Date();

  // 1. Criar log (status: running)
  let logId: string | null = null;
  try {
    const { data: logData, error: logError } = await supabase
      .from('execution_logs')
      .insert({
        status: 'running',
        publications_found: 0,
        publications_new: 0,
        error_message: null,
      })
      .select()
      .single();

    if (logError) {
      console.error('Erro ao criar log inicial de execução:', logError);
    } else {
      logId = logData?.id || null;
      console.log(`Log de execução criado com ID: ${logId}`);
    }
  } catch (err) {
    console.error('Erro inesperado ao criar log inicial:', err);
  }

  // 1.5 Carregar configurações do banco de dados (tabela settings)
  let oabCredentialsList: { name: string; number: string; state: string }[] = [];
  
  try {
    console.log('Buscando credenciais do escritório no banco de dados...');
    const { data: dbSettings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (settingsError) {
      console.warn('Aviso: Não foi possível obter configurações do banco. Usando .env locais.', settingsError.message);
    } else if (dbSettings) {
      console.log('Credenciais do banco obtidas com sucesso! Aplicando...');
      if (dbSettings.openai_api_key) process.env.OPENAI_API_KEY = dbSettings.openai_api_key;
      if (dbSettings.telegram_bot_token) process.env.TELEGRAM_BOT_TOKEN = dbSettings.telegram_bot_token;
      if (dbSettings.telegram_chat_id) process.env.TELEGRAM_CHAT_ID = dbSettings.telegram_chat_id;
      
      // Armazena a lista de OABs dinâmicas (advogados) se existir e for válida
      if (dbSettings.oabs && Array.isArray(dbSettings.oabs) && dbSettings.oabs.length > 0) {
        oabCredentialsList = dbSettings.oabs;
        console.log(`Carregados ${oabCredentialsList.length} advogados para monitoramento dinâmico.`);
      } else {
        // Fallback para campos legados se a lista de OABs em JSONB estiver vazia
        if (dbSettings.oab_number && dbSettings.oab_state) {
          oabCredentialsList = [{ name: 'Advogado Principal', number: dbSettings.oab_number, state: dbSettings.oab_state }];
        }
      }
    }
  } catch (err) {
    console.error('Erro inesperado ao buscar configurações do banco:', err);
  }

  // Se a lista de OABs obtida ainda estiver vazia, tenta ler das variáveis de ambiente locais (.env)
  if (oabCredentialsList.length === 0) {
    const envOab = process.env.OAB_NUMBER;
    const envState = process.env.OAB_STATE;
    if (envOab && envState) {
      oabCredentialsList = [{ name: 'Advogado Local (.env)', number: envOab, state: envState }];
    }
  }

  let rawPublications: RawPublication[] = [];
  let errorOccurred: string | null = null;

  // 2. Executar djen.ts em loop → array de publicações brutas acumuladas de todos os advogados
  try {
    if (oabCredentialsList.length === 0) {
      throw new Error('Nenhuma credencial de OAB configurada para busca no banco de dados ou .env');
    }

    console.log(`Iniciando varredura sequencial para ${oabCredentialsList.length} advogado(s)...`);
    
    for (const cred of oabCredentialsList) {
      console.log(`\n>>> Buscando publicações do(a) ${cred.name} (OAB: ${cred.number}/${cred.state})...`);
      try {
        const oabPubs = await scrapeDJEN(cred.number, cred.state);
        console.log(`Sucesso: ${oabPubs.length} publicação(ões) capturada(s) para ${cred.name}.`);
        rawPublications.push(...oabPubs);
      } catch (err: any) {
        console.error(`Erro ao capturar dados para ${cred.name} (${cred.number}/${cred.state}):`, err.message || err);
        // Não interrompe o fluxo geral se houver falha em um advogado específico,
        // apenas registra o erro e continua para os demais.
      }
    }

    console.log(`\nVarredura finalizada. Total acumulado de publicações brutas: ${rawPublications.length}`);
  } catch (err: any) {
    console.error('Falha crítica na execução do ciclo de varredura:', err);
    errorOccurred = err.message || 'Erro desconhecido na execução do loop do Playwright';
  }


  let newCount = 0;

  // Se o Playwright obteve sucesso ou encontrou publicações, processamos
  if (!errorOccurred && rawPublications.length > 0) {
    for (const raw of rawPublications) {
      try {
        // a. Gerar hash SHA256 do content
        const rawHash = crypto.createHash('sha256').update(raw.content).digest('hex');

        // b. Verificar se hash já existe no banco (idempotência)
        const { data: existing, error: checkError } = await supabase
          .from('publications')
          .select('id')
          .eq('raw_hash', rawHash)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 é o código de não encontrado (0 rows)
          console.error(`Erro ao verificar existência do hash ${rawHash}:`, checkError);
          continue;
        }

        if (existing) {
          console.log(`Publicação já existe no banco (Processo: ${raw.processNumber}). Pulando...`);
          continue;
        }

        // c. Se novo: gerar resumo IA → salvar no banco
        console.log(`Nova publicação encontrada! Processo: ${raw.processNumber}. Gerando resumo com IA...`);
        const summary = await summarize(raw.content);
        console.log(`Resumo IA gerado: "${summary}"`);

        const { error: insertError } = await supabase
          .from('publications')
          .insert({
            process_number: raw.processNumber,
            parties: raw.parties,
            publication_date: raw.publicationDate,
            content: raw.content,
            summary: summary,
            is_read: false,
            raw_hash: rawHash,
          });

        if (insertError) {
          console.error(`Erro ao salvar publicação no banco (Processo: ${raw.processNumber}):`, insertError);
          continue; // Não incrementa newCount se falhou ao salvar
        }

        newCount++;

        // 4. Para cada publicação nova: Enviar alerta Telegram
        const [year, month, day] = raw.publicationDate.split('-');
        const formattedDate = `${day}/${month}/${year}`;

        const alertMessage = `📋 <b>Nova publicação</b>\n\n<b>Processo:</b> <code>${raw.processNumber}</code>\n<b>Partes:</b> ${raw.parties}\n<b>Data:</b> ${formattedDate}\n\n<b>Resumo:</b>\n${summary}`;
        
        console.log('Enviando alerta para o Telegram...');
        const alertSuccess = await sendAlert(alertMessage);
        if (!alertSuccess) {
          console.warn('Falha ao enviar alerta no Telegram (não impediu salvamento no banco).');
        }

      } catch (pubErr) {
        console.error(`Erro ao processar publicação individual (${raw.processNumber}):`, pubErr);
        // Cada etapa falha de forma independente
      }
    }
  }

  // 5. Atualizar log (success ou error)
  const finalStatus = errorOccurred ? 'error' : 'success';
  console.log(`=== Concluindo execução. Status: ${finalStatus} | Encontradas: ${rawPublications.length} | Novas: ${newCount} ===`);

  if (logId) {
    try {
      await supabase
        .from('execution_logs')
        .update({
          status: finalStatus,
          publications_found: rawPublications.length,
          publications_new: newCount,
          error_message: errorOccurred,
          executed_at: new Date().toISOString(),
        })
        .eq('id', logId);
      console.log('Log de execução atualizado no banco com sucesso.');
    } catch (logUpdateErr) {
      console.error('Erro ao atualizar log final de execução:', logUpdateErr);
    }
  } else {
    // Se não tinha logId, tenta criar um log final direto
    try {
      await supabase
        .from('execution_logs')
        .insert({
          status: finalStatus,
          publications_found: rawPublications.length,
          publications_new: newCount,
          error_message: errorOccurred,
          executed_at: new Date().toISOString(),
        });
      console.log('Log final de execução registrado no banco com sucesso.');
    } catch (logInsertErr) {
      console.error('Erro ao registrar log final de execução:', logInsertErr);
    }
  }
}

main().catch(err => {
  console.error('Erro não tratado no processo principal do scraper:', err);
  process.exit(1);
});
