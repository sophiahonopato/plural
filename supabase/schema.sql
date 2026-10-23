-- =====================================================================
-- Plural — banco de dados (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- Pode rodar de novo sem problema: ele recria funções e políticas.
-- =====================================================================

-- ---------- tabelas ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 30),
  handle text not null unique check (handle ~ '^[a-z0-9]{1,20}$'),
  mascot text not null check (mascot in ('tecnologia', 'politica', 'alimentacao', 'esportes', 'estudos', 'saudemental')),
  bio text not null default '' check (char_length(bio) <= 140),
  created_at timestamptz not null default now()
);

-- O progresso inteiro (missões, conquistas, recordes...) fica em `data`;
-- `xp` fica numa coluna própria pra o ranking ser rápido.
create table if not exists public.progress (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  data jsonb not null default '{}',
  day date not null default current_date,
  day_xp integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists progress_xp_idx on public.progress (xp desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  mascot text, -- posts oficiais dos mascotes não têm user_id
  topic text not null check (topic in ('tecnologia', 'politica', 'alimentacao', 'esportes', 'estudos', 'saudemental')),
  text text not null check (char_length(text) between 1 and 280),
  reply_to uuid references public.posts (id) on delete cascade,
  mission jsonb,
  created_at timestamptz not null default now(),
  check ((user_id is null) <> (mascot is null))
);
create index if not exists posts_created_idx on public.posts (created_at desc);

create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- E-mails com acesso à moderação. Adicione outros com:
--   insert into public.admins values ('outra@pessoa.com');
create table if not exists public.admins (email text primary key);
insert into public.admins values ('sophiahonoratodev@gmail.com') on conflict do nothing;

-- ---------- funções ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(auth.jwt() ->> 'email'));
$$;

-- Conta nova no Auth → cria perfil e progresso zerado.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}');
  base text := left(lower(regexp_replace(coalesce(meta ->> 'handle', ''), '[^a-zA-Z0-9]', '', 'g')), 14);
  h text;
  n int := 1;
  m text := meta ->> 'mascot';
begin
  if base = '' then base := 'jogador'; end if;
  h := base;
  while exists (select 1 from public.profiles where handle = h)
        or h in ('raposa', 'coruja', 'coala', 'leao', 'golfinho', 'polvo', 'removida') loop
    n := n + 1;
    h := base || n;
  end loop;
  if m is null or m not in ('tecnologia', 'politica', 'alimentacao', 'esportes', 'estudos', 'saudemental') then
    m := 'tecnologia';
  end if;
  insert into public.profiles (id, name, handle, mascot)
  values (new.id, left(coalesce(nullif(trim(meta ->> 'name'), ''), 'Jogador'), 30), h, m);
  insert into public.progress (user_id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Anti-trapaça: o XP só sobe, em passos pequenos, e com teto por dia.
create or replace function public.guard_progress() returns trigger
language plpgsql set search_path = public as $$
declare
  delta int := new.xp - old.xp;
begin
  new.user_id := old.user_id;
  new.updated_at := now();
  if public.is_admin() then return new; end if;
  if delta < 0 then raise exception 'O XP não pode diminuir.'; end if;
  if delta > 400 then raise exception 'Ganho de XP grande demais de uma vez.'; end if;
  if old.day <> current_date then
    new.day := current_date;
    new.day_xp := delta;
  else
    new.day := old.day;
    new.day_xp := old.day_xp + delta;
  end if;
  if new.day_xp > 2500 then raise exception 'Limite diário de XP atingido.'; end if;
  new.data := jsonb_set(new.data, '{xp}', to_jsonb(new.xp));
  return new;
end $$;

drop trigger if exists progress_guard on public.progress;
create trigger progress_guard before update on public.progress
  for each row execute function public.guard_progress();

-- Anti-spam: um post (ou resposta) a cada 3 segundos por pessoa.
create or replace function public.guard_post() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null and exists (
    select 1 from public.posts where user_id = new.user_id and created_at > now() - interval '3 seconds'
  ) then
    raise exception 'Calma! Espere alguns segundos antes de publicar de novo.';
  end if;
  new.created_at := now();
  return new;
end $$;

drop trigger if exists posts_guard on public.posts;
create trigger posts_guard before insert on public.posts
  for each row execute function public.guard_post();

-- ---------- segurança (RLS) ----------
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.admins enable row level security; -- sem políticas: ninguém lê pelo site

drop policy if exists "perfis visíveis" on public.profiles;
drop policy if exists "edita o próprio perfil" on public.profiles;
drop policy if exists "admin remove perfil" on public.profiles;
create policy "perfis visíveis" on public.profiles for select using (true);
create policy "edita o próprio perfil" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "admin remove perfil" on public.profiles for delete using (public.is_admin());

drop policy if exists "ranking visível" on public.progress;
drop policy if exists "atualiza o próprio progresso" on public.progress;
create policy "ranking visível" on public.progress for select using (true);
create policy "atualiza o próprio progresso" on public.progress for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "posts visíveis" on public.posts;
drop policy if exists "publica como si" on public.posts;
drop policy if exists "apaga o próprio post ou admin" on public.posts;
create policy "posts visíveis" on public.posts for select using (true);
create policy "publica como si" on public.posts for insert with check (user_id = auth.uid() and mascot is null);
create policy "apaga o próprio post ou admin" on public.posts for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "curtidas visíveis" on public.likes;
drop policy if exists "curte como si" on public.likes;
drop policy if exists "descurte o que curtiu" on public.likes;
create policy "curtidas visíveis" on public.likes for select using (true);
create policy "curte como si" on public.likes for insert with check (user_id = auth.uid());
create policy "descurte o que curtiu" on public.likes for delete using (user_id = auth.uid());

-- ---------- permissões da API ----------
-- Libera só o que o site usa (funciona com "Automatically expose new tables"
-- ligado ou desligado). As políticas acima decidem QUAIS linhas cada um vê/muda.
revoke all on public.profiles, public.progress, public.posts, public.likes, public.admins from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.progress, public.posts, public.likes to anon, authenticated;
grant update (name, bio, mascot) on public.profiles to authenticated;
grant delete on public.profiles to authenticated;
grant update (xp, data) on public.progress to authenticated;
grant insert (id, user_id, topic, text, reply_to, mission) on public.posts to authenticated;
grant delete on public.posts to authenticated;
grant insert (post_id, user_id), delete on public.likes to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- tempo real ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.posts; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.likes; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.progress; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
  end if;
end $$;

-- ---------- posts de boas-vindas dos mascotes (só na primeira vez) ----------
insert into public.posts (mascot, topic, text)
select v.mascot, v.mascot, v.text
from (values
  ('tecnologia', 'Bem-vindos ao mundo da Tecnologia! Qual app ou ferramenta mudou a sua rotina este ano? Conta aqui que eu quero testar.'),
  ('politica', 'Aqui a gente debate com respeito e com fonte. Qual assunto do noticiário você queria que alguém explicasse sem enrolação?'),
  ('alimentacao', 'Cozinha aberta! Qual é aquela receita rápida que salva o seu dia corrido? Vale até miojo turbinado.'),
  ('esportes', 'Bora se mexer! Me conta: qual esporte você pratica, ou qual você sempre quis começar?'),
  ('estudos', 'Reta final é em equipe. Qual técnica de estudo funciona de verdade pra você? Compartilha com a turma.'),
  ('saudemental', 'Respira. Este é um espaço seguro. O que te ajuda a desacelerar quando o dia pesa?')
) as v (mascot, text)
where not exists (select 1 from public.posts where mascot is not null);
