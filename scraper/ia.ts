import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function summarize(content: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY não configurada no .env do scraper. Pulando resumo.');
    return 'Resumo indisponível (Chave OpenAI não configurada).';
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente jurídico brasileiro. Analise esta publicação do Diário de Justiça e escreva um resumo objetivo em 3 linhas máximo, em português, destacando: o que foi determinado, quem deve agir e se há urgência.',
        },
        {
          role: 'user',
          content: `Publicação: ${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content?.trim() || 'Resumo não gerado pela IA.';
  } catch (error) {
    console.error('Erro na chamada à OpenAI no scraper:', error);
    return 'Falha ao gerar resumo com IA.';
  }
}
