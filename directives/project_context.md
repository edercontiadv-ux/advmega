# Godoi, Santos & Conti Advogados - Internal Tool

## CONTEXTO
- Ferramenta interna para o escritório (NÃO é um SaaS).
- Até 5 usuários fixos (advogados do escritório).
- Um único escritório, sem multi-tenant.
- Objetivo: capturar publicações do DJEN diariamente, resumir com IA e exibir num dashboard simples.

## STACK
- Next.js 15 + TypeScript + TailwindCSS + shadcn/ui
- Supabase (auth + PostgreSQL)
- Playwright (scraper, roda em VPS separado)
- Telegram Bot API (alertas)
- OpenAI ou Claude (resumo IA)

## PRINCÍPIOS
- Simples antes de completo.
- Nenhuma abstração desnecessária.
- Sem multi-tenant, sem RLS complexo.
- Um arquivo por responsabilidade.
- Nunca use 'any' no TypeScript.
