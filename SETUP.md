# Configuração do backend (Supabase)

A plataforma usa um banco de dados **Supabase** (Postgres + autenticação). Siga os passos
abaixo uma vez. Leva ~5 minutos, quase tudo é copiar e colar.

## 1) Criar o projeto no Supabase
1. Acesse https://supabase.com e crie uma conta (grátis).
2. **New project** → dê um nome (ex.: `geosense`), defina uma senha de banco e crie.
3. Espere ~1 min o projeto ficar pronto.

## 2) Criar as tabelas
1. No menu lateral do Supabase: **SQL Editor** → **New query**.
2. Abra o arquivo `supabase/schema.sql` deste projeto, copie **tudo** e cole no editor.
3. Clique em **Run**. Deve aparecer "Success". (Pode rodar de novo sem problema.)

## 3) Deixar o login instantâneo (recomendado)
1. **Authentication** → **Sign In / Providers** → **Email**.
2. Desligue **"Confirm email"** e salve. (Assim a conta entra na hora, sem e-mail de confirmação.)

## 4) Pegar as chaves de API
1. **Project Settings** (engrenagem) → **API**.
2. Copie dois valores:
   - **Project URL** → vai em `VITE_SUPABASE_URL`
   - **anon public** (Project API keys) → vai em `VITE_SUPABASE_ANON_KEY`
   > A chave "anon public" pode ficar exposta no frontend — é assim que o Supabase funciona.
   > **Nunca** use a chave `service_role` no frontend.

## 5) Rodar localmente
1. Na pasta do projeto, crie um arquivo `.env` (copie de `.env.example`) e preencha:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-public-key
   ```
2. `npm install` e `npm run dev`.

## 6) Criar o admin
1. Abra a plataforma e clique em **Criar conta** — cadastre-se com seu e-mail.
2. Volte ao Supabase → **SQL Editor** e rode (troque pelo seu e-mail):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'SEU_EMAIL@exemplo.com');
   ```
3. Saia e entre de novo — você verá o **Painel de Controle**.

## 7) Publicar na Vercel
1. No projeto da Vercel: **Settings** → **Environment Variables**.
2. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os mesmos valores.
3. Adicione também as variáveis do **Cloudflare R2** (upload de vídeo — ver seção 8 abaixo).
4. **Deployments** → **Redeploy**.

Pronto — o conteúdo cadastrado no painel fica no banco e aparece para todos os alunos,
em qualquer dispositivo.

## 8) Upload de vídeo (Cloudflare R2)

O botão "Enviar vídeo" do painel sobe o arquivo para o **Cloudflare R2** (armazenamento
sem o limite de 50MB do Supabase Storage no plano gratuito). O upload é feito via uma
função de servidor (`/api/presign-video-upload.js`, roda na Vercel) que gera uma URL
temporária — a chave secreta do R2 nunca é enviada ao navegador.

1. Crie uma conta grátis em **cloudflare.com** e ative o **R2 Object Storage** (pede
   cartão cadastrado, só cobra se passar dos 10GB grátis por mês).
2. Crie um bucket (ex.: `geosense-videos`).
3. No bucket → **Settings** → **Public access** → ative o **Public Development URL** (algo como `https://pub-xxxx.r2.dev`).
4. No mesmo bucket → **Settings** → **CORS Policy** → cole:
   ```json
   [{ "AllowedOrigins": ["*"], "AllowedMethods": ["GET", "PUT", "HEAD"], "AllowedHeaders": ["*"], "ExposeHeaders": ["ETag"], "MaxAgeSeconds": 3600 }]
   ```
5. Na página principal do R2 → **Account Details** → **API Tokens** → **Manage** → **Create Account API token**, permissão **Object Read & Write**, escopo no bucket criado.
6. Copie os 3 valores mostrados (só aparecem uma vez): **Access Key ID**, **Secret Access Key**, e o **Account ID** (está embutido no endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
7. Adicione ao `.env` local **e** às Environment Variables da Vercel (todas **sem** o prefixo `VITE_` — são usadas só no servidor, nunca no navegador):
   ```
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_ENDPOINT=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
   R2_BUCKET=geosense-videos
   R2_PUBLIC_URL=https://pub-xxxx.r2.dev
   ```
8. Redeploy na Vercel.

Custo: 10GB grátis por mês; depois disso, ~US$0,015/GB-mês (menos de R$0,10 por GB) e
**sem cobrança de banda** para assistir os vídeos, não importa quantos alunos.
