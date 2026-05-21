-- ══════════════════════════════════════════════
-- ArbitroCV — Schema Supabase
-- Ejecuta este SQL en: Supabase > SQL Editor
-- ══════════════════════════════════════════════

-- 1. PROFILES (extiende auth.users)
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  email       text,
  role        text default 'user',          -- 'user' | 'admin'
  status      text default 'pending',       -- 'pending' | 'active' | 'blocked'
  xp          integer default 0,
  created_at  timestamptz default now()
);

-- Auto-crear perfil al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. PREGUNTAS
create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  rule_number     integer not null,
  question        text not null,
  options         jsonb not null,           -- ["opcion A", "opcion B", "opcion C", "opcion D"]
  correct_option  integer not null,         -- 0-3
  explanation     text,
  created_at      timestamptz default now()
);

-- 3. RESULTADOS DE TESTS
create table public.test_results (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles on delete cascade,
  rule_number integer,                      -- null = aleatorio
  score       integer not null,
  total       integer not null,
  xp_earned   integer default 0,
  created_at  timestamptz default now()
);

-- 4. SITUACIONES DE PARTIDO
create table public.situations (
  id              uuid primary key default gen_random_uuid(),
  rule_ref        text not null,
  title           text not null,
  description     text,
  difficulty      text default 'med',       -- 'easy' | 'med' | 'hard'
  scene_text      text,
  scene_sub       text,
  question        text not null,
  options         jsonb not null,           -- [{"text": "...", "icon": "ti-check"}]
  correct_option  integer not null,
  explanation     text,
  video_url       text,                     -- YouTube / Drive / Cloudinary
  created_at      timestamptz default now()
);

-- 5. RESPUESTAS A SITUACIONES
create table public.situation_answers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles on delete cascade,
  situation_id    uuid references public.situations on delete cascade,
  selected_option integer,
  is_correct      boolean,
  created_at      timestamptz default now()
);

-- 6. INSIGNIAS DESBLOQUEADAS
create table public.user_badges (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles on delete cascade,
  badge_id    text not null,               -- coincide con BADGES_DEF[].id
  is_new      boolean default true,
  created_at  timestamptz default now(),
  unique(user_id, badge_id)
);

-- 7. CONTENIDO DEL TEMARIO (vídeos + texto por regla)
create table public.rule_content (
  rule_number integer primary key,
  video_url   text,
  description text,
  key_points  text,                        -- puntos separados por \n
  updated_at  timestamptz default now()
);

-- ══════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.test_results enable row level security;
alter table public.situations enable row level security;
alter table public.situation_answers enable row level security;
alter table public.user_badges enable row level security;
alter table public.rule_content enable row level security;

-- Profiles: cada usuario ve/edita el suyo; admin ve todos
create policy "own profile" on public.profiles for all using (auth.uid() = id);
create policy "admin all profiles" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Preguntas: todos las leen; solo admin escribe
create policy "read questions" on public.questions for select using (true);
create policy "admin write questions" on public.questions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Test results: cada usuario ve los suyos
create policy "own test results" on public.test_results for all using (auth.uid() = user_id);

-- Situaciones: todos las leen; solo admin escribe
create policy "read situations" on public.situations for select using (true);
create policy "admin write situations" on public.situations for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Situation answers: cada usuario ve los suyos
create policy "own situation answers" on public.situation_answers for all using (auth.uid() = user_id);

-- User badges: cada usuario ve los suyos; sistema escribe
create policy "own badges" on public.user_badges for select using (auth.uid() = user_id);
create policy "insert badges" on public.user_badges for insert with check (auth.uid() = user_id);

-- Rule content: todos leen; solo admin escribe
create policy "read rule content" on public.rule_content for select using (true);
create policy "admin write rule content" on public.rule_content for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ══════════════════════════════════════════════
-- SEED: SITUACIONES DE EJEMPLO
-- (Opcional — también se añaden desde el panel admin)
-- ══════════════════════════════════════════════

insert into public.situations (rule_ref, title, description, difficulty, scene_text, question, options, correct_option, explanation) values
(
  'Regla 12', '¿Falta o juego brusco?', 'Jugador cae al área tras contacto del defensor', 'med',
  'Minuto 67. El delantero penetra en el área por banda derecha. El defensor llega tarde y hace contacto en la pierna de apoyo. El atacante cae al suelo.',
  '¿Qué señalas?',
  '[{"text":"Penalti — falta dentro del área","icon":"ti-circle-dot"},{"text":"Tiro libre indirecto — juego peligroso","icon":"ti-arrows-right"},{"text":"Ventaja — continúa el juego","icon":"ti-player-play"},{"text":"No hay infracción — contacto fortuito","icon":"ti-x"}]',
  0, 'El contacto en la pierna de apoyo dentro del área es una falta directa que origina penalti (Regla 12 + Regla 14).'
),
(
  'Regla 11', '¿Fuera de juego activo?', 'Gol anulado: ¿estaba el delantero activo?', 'hard',
  'Un mediapunta remata a puerta. Un compañero en fuera de juego está a 8 metros del portero rival, en su línea de visión directa.',
  'El jugador en fuera de juego no toca el balón pero está a 8 m del portero. ¿Gol o fuera de juego?',
  '[{"text":"Gol válido — el delantero no interviene","icon":"ti-check"},{"text":"Fuera de juego — su presencia condiciona al portero","icon":"ti-flag"},{"text":"Revisar con VAR antes de decidir","icon":"ti-eye"},{"text":"Repetir como gol","icon":"ti-refresh"}]',
  1, 'Aunque no toca el balón, su posición a 8 m impide al portero moverse libremente. Esto constituye interferir con un rival (Regla 11).'
),
(
  'Regla 12', '¿DOGSO o amarilla?', 'Última oportunidad de gol frustrada por agarre', 'hard',
  'Delantero en carrera hacia portería vacía. El defensor lo agarra por la camiseta desde atrás. Falta clara, dirección de gol.',
  'El defensor frustra el gol con un agarre. ¿Cuál es la sanción?',
  '[{"text":"Tarjeta roja (DOGSO) + penalti","icon":"ti-card-fan"},{"text":"Tarjeta amarilla + tiro libre","icon":"ti-square"},{"text":"Penalti sin tarjeta","icon":"ti-circle-dot"},{"text":"Roja + tiro libre directo","icon":"ti-card-fan"}]',
  0, 'DOGSO dentro del área = roja + penalti. Los 4 criterios concurren: dirección de gol, último defensor, portero adelantado, control del balón.'
);
