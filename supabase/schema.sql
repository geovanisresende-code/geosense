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
  url text default '',
  description text default '',
  created_at timestamptz default now()
);

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
