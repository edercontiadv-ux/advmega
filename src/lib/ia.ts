import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function summarizePublication(content: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'Resumo indisponível (Chave da OpenAI não configurada).';
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente jurídico especializado em resumir publicações dos diários de justiça (DJEN) de forma clara, direta e objetiva para advogados. Foque no ponto principal da decisão, despacho ou ato, e prazos se houverem.',
        },
        {
          role: 'user',
          content: `Resuma a seguinte publicação jurídica em um parágrafo conciso:\n\n${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content?.trim() || 'Não foi possível gerar o resumo.';
  } catch (error) {
    console.error('Erro ao chamar OpenAI:', error);
    return 'Erro ao processar resumo com IA.';
  }
}
