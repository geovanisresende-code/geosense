-- ============================================================================
-- GeoSense · Plataforma de Ensino — Schema do banco (Supabase / Postgres)
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
-- Pode rodar novamente sem problema (é idempotente).
-- ============================================================================

create extension if not exists pgcrypto;

-- ── PERFIS (liga-se aos usuários do Supabase Auth) ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz default now()
);

-- ── CONFIGURAÇÕES (linha única) ────────────────────────────────────────────
create table if not exists public.settings (
  id int primary key default 1,
  platform_name text default 'GeoSense',
  tagline text default 'Engenharia · Geotecnologia',
  constraint settings_singleton check (id = 1)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ── CATEGORIAS ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  position int default 0,
  created_at timestamptz default now()
);

-- ── CURSOS / MÓDULOS / AULAS ───────────────────────────────────────────────
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text default 'Novo curso',
  category_id uuid references public.categories on delete set null,
  modality text default 'online',
  hours text default '',
  description text default '',
  accent text default 'cap',
  position int default 0,
  created_at timestamptz default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses on delete cascade,
  title text default 'Novo módulo',
  position int default 0
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules on delete cascade,
  title text default 'Nova aula',
  duration text default '',
  video_url text default '',
  position int default 0
);

-- ── CALENDÁRIO ─────────────────────────────────────────────────────────────
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text default 'Novo evento',
  date date,
  "time" text default '',
  modality text default 'online',
  location text default '',
  description text default '',
  created_at timestamptz default now()
);

-- ── BIBLIOTECA ─────────────────────────────────────────────────────────────
create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  title text default 'Novo material',
  type text default 'pdf',
  category_id uuid references public.categories on delete set null,
  course_id uuid references public.courses on delete cascade,
  module_id uuid references public.modules on delete cascade,
  url text default '',
  description text default '',
  created_at timestamptz default now()
);
-- migração: adiciona as colunas em bancos já existentes
alter table public.library_items add column if not exists course_id uuid references public.courses on delete cascade;
alter table public.library_items add column if not exists module_id uuid references public.modules on delete cascade;

-- ── AVISOS / MENSAGENS (mural do admin) ────────────────────────────────────
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text default '',
  created_at timestamptz default now()
);

-- ── PROGRESSO DAS AULAS (base para certificados) ───────────────────────────
create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users on delete cascade,
  lesson_id uuid not null references public.lessons on delete cascade,
  completed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);

-- ============================================================================
-- Funções auxiliares
-- ============================================================================

-- Cria um perfil automaticamente quando um usuário se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Retorna true se o usuário logado é admin
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ============================================================================
-- Row Level Security (RLS)
-- Conteúdo: qualquer usuário logado LÊ; só admin ESCREVE.
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.settings        enable row level security;
alter table public.categories      enable row level security;
alter table public.courses         enable row level security;
alter table public.modules         enable row level security;
alter table public.lessons         enable row level security;
alter table public.events          enable row level security;
alter table public.library_items   enable row level security;
alter table public.announcements   enable row level security;
alter table public.lesson_progress enable row level security;

-- Conteúdo público (para usuários autenticados) + escrita só admin
do $$
declare t text;
begin
  foreach t in array array['settings','categories','courses','modules','lessons','events','library_items','announcements']
  loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('drop policy if exists %I_write on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- Perfis: cada um lê/edita o seu; admin vê/edita todos
drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_write on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_write on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

-- Progresso: cada usuário gerencia o seu
drop policy if exists progress_all on public.lesson_progress;
create policy progress_all on public.lesson_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- Categorias iniciais (áreas da GeoSense) — só insere se a tabela estiver vazia
-- ============================================================================
insert into public.categories (label, position)
select * from (values
  ('Topografia', 1), ('Drones', 2), ('Geoprocessamento', 3),
  ('Modelagem 3D', 4), ('Meio Ambiente', 5), ('Geotecnia', 6)
) as v(label, position)
where not exists (select 1 from public.categories);

-- ============================================================================
-- PARA TORNAR SEU USUÁRIO ADMIN (depois de se cadastrar na plataforma):
--   update public.profiles set role = 'admin' where id =
--     (select id from auth.users where email = 'SEU_EMAIL_AQUI');
-- ============================================================================

-- ============================================================================
-- STORAGE — upload de vídeo (.mp4) direto para as aulas
-- ============================================================================
insert into storage.buckets (id, name, public) values ('videos', 'videos', true)
on conflict (id) do nothing;

-- só admin pode enviar/apagar vídeos; a URL pública já funciona sozinha
-- (bucket público) sem precisar de policy de leitura.
drop policy if exists "videos_write" on storage.objects;
create policy "videos_write" on storage.objects for all to authenticated
  using (bucket_id = 'videos' and public.is_admin())
  with check (bucket_id = 'videos' and public.is_admin());

-- Tokens de instalação do Shopify (gravados por /api/auth/callback).
-- Sem policy de leitura: só a service role key acessa, nunca o navegador.
create table if not exists public.shopify_shops (
  shop          text primary key,
  access_token  text not null,
  scope         text,
  installed_at  timestamptz not null default now()
);
alter table public.shopify_shops enable row level security;

-- ── PRODUTOS DA SHOPIFY (espelho local, preenchido por /api/sync-products) ──
-- A fonte da verdade continua sendo a Shopify; esta tabela é o cache que o
-- painel lê e edita. Editar aqui e clicar em "Enviar para a Shopify" faz o PUT.
create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  shopify_product_id bigint not null unique,
  shopify_variant_id bigint,
  title              text default '',
  description        text default '',
  thumbnail_url      text default '',
  price              numeric(12,2),
  status             text default 'active',
  handle             text default '',
  synced_at          timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists products_read  on public.products;
drop policy if exists products_write on public.products;
create policy products_read  on public.products for select to authenticated using (true);
create policy products_write on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── PEDIDOS PAGOS (gravados pelo webhook orders/paid) ──────────────────────
-- Sem policy de leitura pública: só a service role key escreve/lê; o painel
-- ainda não expõe esses dados. shopify_order_id é único para o webhook poder
-- ser reentregue pela Shopify sem duplicar linha.
create table if not exists public.shopify_orders (
  id               uuid primary key default gen_random_uuid(),
  shopify_order_id bigint not null unique,
  shop             text,
  order_number     text,
  email            text,
  customer_name    text,
  total_price      numeric(12,2),
  currency         text,
  financial_status text,
  line_items       jsonb default '[]'::jsonb,
  raw              jsonb,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);
alter table public.shopify_orders enable row level security;

-- ============================================================================
-- ACESSO PAGO — quem comprou na Shopify libera o curso vinculado ao produto
-- ============================================================================

-- Qual curso cada produto libera. Sem vínculo, o curso segue aberto para todos
-- (só o que tem produto apontando para ele é que fica bloqueado).
alter table public.products add column if not exists course_id uuid references public.courses on delete set null;

-- O webhook recebe só o e-mail da compra; o auth.users não é visível pelo
-- PostgREST, então o e-mail é espelhado aqui para dar para achar o aluno.
alter table public.profiles add column if not exists email text;
update public.profiles p set email = u.email
  from auth.users u where u.id = p.id and p.email is distinct from u.email;
create unique index if not exists profiles_email_uniq on public.profiles (lower(email));

-- ── COMPRAS LIBERADAS ──────────────────────────────────────────────────────
-- A unicidade é o que deixa o webhook idempotente: a Shopify reentrega o mesmo
-- evento e o upsert não pode virar linha duplicada.
create table if not exists public.user_products (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade,
  shopify_product_id bigint not null,
  purchased_at       timestamptz not null default now(),
  unique (user_id, shopify_product_id)
);
alter table public.user_products enable row level security;
-- só leitura, e só do que é seu: quem libera acesso é o webhook (service role,
-- que ignora RLS). Sem policy de escrita ninguém se auto-matricula.
drop policy if exists user_products_read on public.user_products;
create policy user_products_read on public.user_products for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ── COMPRAS SEM CONTA AINDA ────────────────────────────────────────────────
-- Comprou na loja mas ainda não se cadastrou na plataforma: fica aqui até o
-- cadastro, e o trigger handle_new_user converte em user_products.
-- Sem policy nenhuma: só a service role enxerga.
create table if not exists public.pending_access (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  shopify_product_id bigint not null,
  purchased_at       timestamptz not null default now(),
  unique (email, shopify_product_id)
);
alter table public.pending_access enable row level security;

-- Cadastro novo: grava o e-mail no perfil e resgata as compras pendentes.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do update set email = excluded.email;

  insert into public.user_products (user_id, shopify_product_id, purchased_at)
  select new.id, pa.shopify_product_id, pa.purchased_at
    from public.pending_access pa
   where lower(pa.email) = lower(new.email)
  on conflict (user_id, shopify_product_id) do nothing;

  delete from public.pending_access where lower(email) = lower(new.email);
  return new;
end; $$;

-- Aluno tem acesso ao curso? Sem produto vinculado, o curso é aberto.
create or replace function public.has_course_access(cid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.products where course_id = cid)
      or exists (
        select 1
          from public.products p
          join public.user_products up on up.shopify_product_id = p.shopify_product_id
         where p.course_id = cid and up.user_id = auth.uid()
      );
$$;

-- Trancar de verdade é aqui, não só na tela: sem isso a URL do vídeo continua
-- vindo na resposta do PostgREST para qualquer aluno logado. Os módulos seguem
-- legíveis de propósito — é o índice que aparece na tela de bloqueio.
drop policy if exists lessons_read on public.lessons;
create policy lessons_read on public.lessons for select to authenticated using (
  public.is_admin()
  or public.has_course_access((select m.course_id from public.modules m where m.id = lessons.module_id))
);

-- ============================================================================
-- Trava de escalação de privilégio
-- profiles_write precisa deixar cada um editar o próprio perfil (nome), mas
-- "o próprio perfil" incluía a coluna role — então qualquer aluno logado podia
-- rodar `update profiles set role='admin'` pelo console do navegador e virar
-- admin de tudo, já que is_admin() alimenta as policies de escrita das outras
-- tabelas. A policy não consegue comparar o valor antigo com o novo, então a
-- trava é um trigger.
-- auth.uid() nulo = chamada da service role ou do SQL Editor: essas continuam
-- podendo promover alguém, que é como um admin é criado.
-- ============================================================================
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end; $$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();
