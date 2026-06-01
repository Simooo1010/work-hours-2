-- ====================================================================
-- SCRIPT DI CONFIGURAZIONE DATABASE PER WEB APP TRACCIAMENTO ORE
-- Da copiare ed eseguire nel "SQL Editor" del pannello Supabase.
-- ====================================================================

-- 1. Tabella PROFILES (Impostazioni Utente)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  hourly_rate numeric(10, 2) not null default 2.50,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Abilita RLS su profiles
alter table public.profiles enable row level security;

-- Politiche RLS per profiles
create policy "L'utente può vedere il proprio profilo"
  on public.profiles for select
  using (auth.uid() = id);

create policy "L'utente può modificare il proprio profilo"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Tabella SESSIONS (Sessioni di Lavoro)
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  duration_hours numeric(10, 4) not null,
  hourly_rate numeric(10, 2) not null,
  earnings numeric(10, 2) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Abilita RLS su sessions
alter table public.sessions enable row level security;

-- Politiche RLS per sessions
create policy "L'utente può inserire le proprie sessioni"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "L'utente può visualizzare le proprie sessioni"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "L'utente può modificare le proprie sessioni"
  on public.sessions for update
  using (auth.uid() = user_id);

create policy "L'utente può eliminare le proprie sessioni"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- 3. Trigger per creare automaticamente il profilo quando un utente si registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, hourly_rate)
  values (new.id, 2.50);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
