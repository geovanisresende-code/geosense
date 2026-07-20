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
3. **Deployments** → **Redeploy**.

Pronto — o conteúdo cadastrado no painel fica no banco e aparece para todos os alunos,
em qualquer dispositivo.
