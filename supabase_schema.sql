-- =============================================
-- BMF PANEL - Schema Supabase (v2 - membri permanenti)
-- Ruleaza asta in Supabase > SQL Editor
-- =============================================

-- Profiluri utilizatori (extinde auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  rank text not null,
  family text not null check (family in ('bmf', '50boys', 'afacere')),
  can_edit boolean default false,
  can_approve boolean default false,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Membri PERMANENTI (nu mai depind de saptamana)
create table public.members (
  id uuid default gen_random_uuid() primary key,
  family text not null check (family in ('bmf', '50boys', 'afacere')),
  nome text not null,
  rank text not null,
  created_at timestamptz default now()
);

-- Date saptamanale per membru (puncte, status, etc) - se creeaza on-demand
create table public.member_weeks (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  week_start date not null,
  score_razie_cayo int default 0,
  score_razie_zona int default 0,
  score_actiuni_ilegale int default 0,
  score_mina int default 0,
  score_cayo_locatie int default 0,
  score_patrule int default 0,
  score_livrare int default 0,
  status text default 'In lucru' check (status in ('In lucru', 'Indeplinit', 'Inactiv')),
  predat text default 'Nu' check (predat in ('Da', 'Nu')),
  task_saptamanal text default 'Neinceput',
  task_promovare text default 'Neinceput',
  created_at timestamptz default now(),
  unique(member_id, week_start)
);

-- Trezorerie
create table public.trezorerie (
  id uuid default gen_random_uuid() primary key,
  tip text not null check (tip in ('intrare', 'iesire')),
  descriere text not null,
  suma bigint not null,
  adaugat_de text not null,
  created_at timestamptz default now()
);

-- Misiuni
create table public.missions (
  id uuid default gen_random_uuid() primary key,
  titlu text not null,
  descriere text,
  familie text not null,
  deadline date,
  progres int default 0 check (progres >= 0 and progres <= 100),
  status text default 'In lucru',
  created_at timestamptz default now()
);

-- Invoiri
create table public.invoiri (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  nume text not null,
  familie text not null,
  data_inceput text not null,
  data_sfarsit text not null,
  motiv text not null,
  status text default 'In asteptare' check (status in ('In asteptare', 'Aprobat', 'Respins')),
  raspuns_de text,
  created_at timestamptz default now()
);

-- Jurnal activitate
create table public.jurnal (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  culoare text default 'gold',
  user_username text,
  created_at timestamptz default now()
);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.member_weeks enable row level security;
alter table public.trezorerie enable row level security;
alter table public.missions enable row level security;
alter table public.invoiri enable row level security;
alter table public.jurnal enable row level security;

create policy "Citire profiles" on public.profiles for select to authenticated using (true);
create policy "Citire members" on public.members for select to authenticated using (true);
create policy "Citire member_weeks" on public.member_weeks for select to authenticated using (true);
create policy "Citire trezorerie" on public.trezorerie for select to authenticated using (true);
create policy "Citire missions" on public.missions for select to authenticated using (true);
create policy "Citire invoiri" on public.invoiri for select to authenticated using (true);
create policy "Citire jurnal" on public.jurnal for select to authenticated using (true);

create policy "Scriere members" on public.members for all using (true) with check (true);
create policy "Scriere member_weeks" on public.member_weeks for all using (true) with check (true);
create policy "Scriere trezorerie" on public.trezorerie for all using (true) with check (true);
create policy "Scriere missions" on public.missions for all using (true) with check (true);
create policy "Scriere invoiri" on public.invoiri for all using (true) with check (true);
create policy "Scriere jurnal" on public.jurnal for all using (true) with check (true);
create policy "Scriere profiles" on public.profiles for all using (true) with check (true);

-- =============================================
-- DATE INITIALE - Contul lider
-- =============================================
-- Pasul 1: In Supabase > Authentication > Users > Add user
--          (pune email-ul tau si o parola)
-- Pasul 2: Copiaza UUID-ul userului creat
-- Pasul 3: Ruleaza (inlocuieste UUID_DIN_AUTH):
--
-- insert into public.profiles (id, username, rank, family, can_edit, is_admin)
-- values ('UUID_DIN_AUTH', 'lider', 'Lider', 'bmf', true, true);
