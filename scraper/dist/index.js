"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const djen_1 = require("./djen");
const ia_1 = require("./ia");
const telegram_1 = require("./telegram");
const db_1 = require("./db");
const crypto_1 = __importDefault(require("crypto"));
async function main() {
    console.log('=== Iniciando Orquestrador de Automação Diária DJEN ===');
    const startTime = new Date();
    // 1. Criar log (status: running)
    let logId = null;
    try {
        const { data: logData, error: logError } = await db_1.supabase
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
        }
        else {
            logId = logData?.id || null;
            console.log(`Log de execução criado com ID: ${logId}`);
        }
    }
    catch (err) {
        console.error('Erro inesperado ao criar log inicial:', err);
    }
    let rawPublications = [];
    let errorOccurred = null;
    // 2. Executar djen.ts → array de publicações brutas
    try {
        rawPublications = await (0, djen_1.scrapeDJEN)();
        console.log(`Playwright concluiu. Publicações encontradas: ${rawPublications.length}`);
    }
    catch (err) {
        console.error('Falha crítica na execução do Playwright:', err);
        errorOccurred = err.message || 'Erro desconhecido no Playwright';
    }
    let newCount = 0;
    // Se o Playwright obteve sucesso ou encontrou publicações, processamos
    if (!errorOccurred && rawPublications.length > 0) {
        for (const raw of rawPublications) {
            try {
                // a. Gerar hash SHA256 do content
                const rawHash = crypto_1.default.createHash('sha256').update(raw.content).digest('hex');
                // b. Verificar se hash já existe no banco (idempotência)
                const { data: existing, error: checkError } = await db_1.supabase
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
                const summary = await (0, ia_1.summarize)(raw.content);
                console.log(`Resumo IA gerado: "${summary}"`);
                const { error: insertError } = await db_1.supabase
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
                const alertSuccess = await (0, telegram_1.sendAlert)(alertMessage);
                if (!alertSuccess) {
                    console.warn('Falha ao enviar alerta no Telegram (não impediu salvamento no banco).');
                }
            }
            catch (pubErr) {
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
            await db_1.supabase
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
        }
        catch (logUpdateErr) {
            console.error('Erro ao atualizar log final de execução:', logUpdateErr);
        }
    }
    else {
        // Se não tinha logId, tenta criar um log final direto
        try {
            await db_1.supabase
                .from('execution_logs')
                .insert({
                status: finalStatus,
                publications_found: rawPublications.length,
                publications_new: newCount,
                error_message: errorOccurred,
                executed_at: new Date().toISOString(),
            });
            console.log('Log final de execução registrado no banco com sucesso.');
        }
        catch (logInsertErr) {
            console.error('Erro ao registrar log final de execução:', logInsertErr);
        }
    }
}
main().catch(err => {
    console.error('Erro não tratado no processo principal do scraper:', err);
    process.exit(1);
});
