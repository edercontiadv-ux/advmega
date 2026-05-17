# 🚀 Guia de Deploy Sem Custos (Vercel + Supabase + GitHub Actions)

Parabéns pela escolha da arquitetura! Esta estrutura é **100% segura, extremamente robusta, automatizada e totalmente gratuita**.

Abaixo estão os 3 passos simples que você precisa seguir para colocar todo o sistema no ar de forma profissional.

---

## 💻 PASSO 1: Enviar o Código para o seu GitHub

Abra o seu terminal do Git na pasta do seu projeto (`C:\Users\USUARIO\Desktop\Buscador de Publicações\Arquivos do Sistema`) e execute os comandos abaixo para subir os arquivos atualizados para o seu repositório:

```bash
# 1. Inicializar o repositório se necessário e adicionar o repositório remoto
git init
git remote add origin https://github.com/edercontiadv-ux/advmega.git

# 2. Adicionar todos os arquivos
git add .

# 3. Criar a versão de lançamento
git commit -m "feat: setup settings, multiple OABs and GitHub actions automation"

# 4. Enviar os dados
git branch -M main
git push -u origin main -f
```

---

## ☁️ PASSO 2: Publicar o Painel Web na Vercel

O deploy do site Next.js na Vercel leva apenas 2 minutos:

1. Acesse o site da **[Vercel](https://vercel.com)** e faça login com a sua conta do GitHub.
2. Clique no botão **`Add New...`** -> **`Project`**.
3. Selecione o repositório **`advmega`** da lista e clique em **`Import`**.
4. Na seção **Environment Variables** (Variáveis de Ambiente), adicione as duas credenciais do Supabase que estão no seu arquivo `.env` local:
   * ➕ **Nome**: `NEXT_PUBLIC_SUPABASE_URL` | **Valor**: `https://ntffjtszkhbktlqlirxc.supabase.co`
   * ➕ **Nome**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Valor**: *(Sua Anon Key que está no seu arquivo .env)*
5. Clique em **`Deploy`**. 
6. **Pronto!** A Vercel gerará um link público seguro (como `https://advmega.vercel.app`) para você e sua equipe acessarem o painel de publicações e configurações!

---

## 🤖 PASSO 3: Configurar a Automação Diária no GitHub

Para que o robô (Scraper) rode todos os dias às 06:00 da manhã sem que você precise deixar nenhum computador ligado ou pagar uma VPS:

1. Acesse o seu repositório no site do GitHub: `https://github.com/edercontiadv-ux/advmega.git`
2. Vá na aba ⚙️ **`Settings`** (Configurações do repositório) no menu superior.
3. No menu lateral esquerdo, clique em **`Secrets and variables`** ➡️ **`Actions`**.
4. Clique no botão **`New repository secret`** (Novo segredo do repositório) no canto superior direito para adicionar cada um destes dois segredos de forma segura:

   * 🔒 **Nome**: `SUPABASE_URL`
     * **Valor**: `https://ntffjtszkhbktlqlirxc.supabase.co`
   
   * 🔒 **Nome**: `SUPABASE_SERVICE_ROLE_KEY`
     * **Valor**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZmZqdHN6a2hia3RscWxpcnhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkwMTEwNCwiZXhwIjoyMDk0NDc3MTA0fQ.jpI7xkNQQ9piMTu1BnVnrwdf6C1xBvijfonSCFOttlA`
     *(Esta chave é privada e dá permissões administrativas ao robô para atualizar o banco de dados).*

### ⚡ Como testar a automação na hora?
Quando terminar de configurar as variáveis no GitHub:
1. Acesse a aba 🚀 **`Actions`** no menu superior do seu repositório no GitHub.
2. Selecione o workflow **`DJEN Publication Scraper`** no menu esquerdo.
3. Clique no botão cinza **`Run workflow`** ➡️ **`Run workflow`** à direita.
4. O GitHub Actions iniciará uma máquina virtual em tempo real, instalará o Playwright, varrerá as OABs dos advogados cadastrados e você poderá assistir a todo o processo ao vivo!

---

## 📁 Backup de Segurança Adicional
Para sua total segurança, realizamos um novo backup completo contendo os novos arquivos da esteira de automação em:
📂 `C:\Users\USUARIO\Desktop\Buscador de Publicações\Backcup's\backup_2026-05-16_23-52`
