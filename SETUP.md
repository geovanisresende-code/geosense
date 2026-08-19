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

## 9) Integração com a Shopify (produtos e pedidos)

O app conversa com a loja por três rotas de servidor, todas na Vercel:

| Rota | O que faz |
|---|---|
| `/api/auth` + `/api/auth/callback` | OAuth: instala o app na loja e grava o access token em `shopify_shops` |
| `/api/sync-products` | Puxa `products.json` da Shopify e faz upsert na tabela `products` |
| `/api/shopify-product` | `PUT` do produto editado no painel de volta para a loja |
| `/api/webhooks/order-paid` | Recebe o evento `orders/paid` e grava em `shopify_orders` |

### 9.1 Variáveis de ambiente (Vercel → Settings → Environment Variables)

```
SHOPIFY_API_KEY=...            # Partner Dashboard → App → Client ID
SHOPIFY_API_SECRET=...         # Client secret
SHOPIFY_STORE_DOMAIN=geosense.myshopify.com
SHOPIFY_SCOPES=read_products,write_products
SHOPIFY_API_VERSION=2026-07
SHOPIFY_WEBHOOK_SECRET=...     # Admin → Configurações → Notificações → Webhooks
APP_URL=https://geosense-app.vercel.app
SUPABASE_SERVICE_ROLE_KEY=...  # Supabase → Project Settings → API → service_role
VITE_SHOPIFY_STORE_DOMAIN=geosense.myshopify.com
```

> `SHOPIFY_SCOPES` **precisa** incluir `write_products` — sem isso a Shopify
> devolve 403 na hora de salvar a edição. Se o app já tinha sido instalado só
> com `read_products`, refaça a instalação (passo 9.2) para o merchant aprovar
> a permissão nova.

### 9.2 Instalar o app na loja

Abra uma vez no navegador:

```
https://geosense-app.vercel.app/api/auth?shop=geosense.myshopify.com
```

Aprove a instalação. Confira no **Supabase → Table Editor → `shopify_shops`**
que existe uma linha com `shop = geosense.myshopify.com` e `access_token`
preenchido.

### 9.3 Sincronizar e editar produtos

No painel de admin, aba **Produtos**:

- **Sincronizar com a Shopify** chama `/api/sync-products`, que percorre todas
  as páginas de `products.json` e faz upsert por `shopify_product_id`. Produtos
  apagados na loja também somem do espelho.
- A edição (título, preço, descrição, situação) salva no Supabase enquanto você
  digita. A loja só é alterada quando você clica em **Enviar para a Shopify** —
  de propósito, para não estourar o limite de ~2 requisições por segundo da
  Admin API a cada tecla digitada.

### 9.4 Webhook de pedido pago

Em **Shopify Admin → Configurações → Notificações → Webhooks → Criar webhook**:

- Evento: **Pagamento do pedido** (`orders/paid`)
- URL: `https://geosense-app.vercel.app/api/webhooks/order-paid`
- Formato: **JSON**

A tela mostra o segredo com que as entregas são assinadas — copie para
`SHOPIFY_WEBHOOK_SECRET` na Vercel. O endpoint confere o header
`X-Shopify-Hmac-Sha256` contra o corpo cru da requisição e devolve **401** se
não bater; requisição sem assinatura válida nunca chega ao banco.

Pedidos aceitos vão para a tabela `shopify_orders` (uma linha por
`shopify_order_id`, então reentregas da Shopify não duplicam). Se a gravação
falhar, o endpoint devolve 500 de propósito — assim a Shopify tenta de novo em
vez de o pedido se perder.

### 9.5 Liberar acesso ao curso após a compra

O vínculo é **1 produto da Shopify → 1 curso da plataforma**, escolhido no painel
em **Produtos → Acesso pago → Curso liberado por este produto**.

- Curso **sem** produto apontando para ele continua **aberto** a todo aluno logado.
- Curso **com** produto vinculado só abre para quem comprou.

O que acontece quando alguém compra:

1. A Shopify dispara `orders/paid` para `/api/webhooks/order-paid`.
2. O endpoint procura o e-mail da compra em `profiles`.
3. **Achou** → grava em `user_products` e o acesso vale na hora (o aluno só
   precisa recarregar a página).
4. **Não achou** (comprou antes de criar a conta) → grava em `pending_access`.
   Quando a pessoa se cadastrar com aquele mesmo e-mail, o trigger
   `handle_new_user` converte as linhas pendentes em `user_products`
   automaticamente.

O bloqueio é em dois níveis, de propósito:

- **Na tela**: o card do curso ganha o selo “Bloqueado” e a página do curso
  troca o player por uma vitrine com preço e botão de compra.
- **No banco**: a policy `lessons_read` chama `has_course_access()`, então as
  aulas de um curso não comprado **não saem do Postgres** — nem a URL do vídeo.
  Sem isso, a trava seria só visual e qualquer um leria o link no DevTools. Os
  módulos seguem legíveis para todos porque são o índice mostrado na vitrine.

Para conferir uma compra na mão:
**Supabase → Table Editor → `user_products`** (acesso liberado) ou
**`pending_access`** (comprou, ainda sem conta).

### 9.6 Login sem senha (link de acesso)

Na tela de login existe o botão **"Comprou um curso? Entre sem senha"**. O aluno
digita o e-mail da compra e recebe um link; o Supabase cria a conta se ela não
existir, o trigger `handle_new_user` resgata o que estava em `pending_access` e
o curso já aparece liberado. É o que liga a compra na Shopify ao acesso sem
pedir senha nem cadastro separado.

Duas configurações no Supabase, **fora do código**:

1. **Authentication → URL Configuration**
   - **Site URL:** `https://geosense-app.vercel.app`
   - **Redirect URLs:** `https://geosense-app.vercel.app/**` e
     `http://localhost:5173/**` (para o `npm run dev`)

   Sem isso o Supabase ignora o destino pedido pela aplicação e manda todo mundo
   para o Site URL — que por padrão vem apontando para localhost, e o link
   quebra em produção.

2. **Authentication → Emails → SMTP**: o mailer embutido do Supabase tem limite
   baixo no plano free (poucos e-mails por hora). Antes de vender de verdade,
   configure um SMTP próprio, senão os links travam em horário de pico.

> Pedido de teste da Shopify usa e-mail fictício (`jon@example.com`). Ele cai em
> `pending_access` e nunca vira acesso, porque não existe conta com esse
> endereço — é o comportamento correto, não um defeito. Para testar a liberação
> ponta a ponta, use um e-mail real no checkout.
