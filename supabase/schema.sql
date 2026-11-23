-- =====================================================================
--  METSAKUNINGRIIK – andmebaas ja serveri loogika (Supabase / Postgres)
--  Käivita see kogu tekst Supabase'i SQL Editoris ("Run").
--  Skripti võib uuesti käivitada: olemasolevad andmed jäävad alles.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Mängijad ja kuningriigi salvestus
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Valitseja' check (char_length(name) between 1 and 20),
  kingdom text not null default 'Metsakuningriik' check (char_length(kingdom) between 1 and 24),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  level int not null default 1,
  fame int not null default 0,
  regions int not null default 1,
  treasures int not null default 0,
  updated_at timestamptz not null default now(),
  constraint save_size check (octet_length(data::text) < 2000000)
);

alter table public.profiles enable row level security;
alter table public.saves enable row level security;

drop policy if exists "oma profiil" on public.profiles;
create policy "oma profiil" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "oma salvestus lugemine" on public.saves;
create policy "oma salvestus lugemine" on public.saves for select to authenticated using (user_id = auth.uid());
-- salvestamine käib ainult serveri kontrolliga funktsiooni save_kingdom kaudu
drop policy if exists "oma salvestus lisamine" on public.saves;
drop policy if exists "oma salvestus kustutamine" on public.saves;
create policy "oma salvestus kustutamine" on public.saves for delete to authenticated using (user_id = auth.uid());
drop policy if exists "oma salvestus muutmine" on public.saves;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
revoke all on public.saves from anon, authenticated;
grant select, delete on public.saves to authenticated;

-- Serveri kinnitatud kuningriigi seis (edetabel näitab ainult neid numbreid)
create table if not exists public.kingdom_trust (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level int not null default 1, xp_total numeric not null default 0, fame numeric not null default 0,
  regions int not null default 1, treasures int not null default 0, gold numeric not null default 0, gtime numeric not null default 0,
  at timestamptz not null default now(), flags int not null default 0, last_flag text, last_flag_at timestamptz
);
alter table public.kingdom_trust enable row level security;
revoke all on public.kingdom_trust from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Kalapüügi andmed (kalad, kohad, õnged, söödad, saavutused)
--    Uue kala lisamiseks lisa rida tabelisse fish_species.
-- ---------------------------------------------------------------------
create table if not exists public.fish_spots (
  id text primary key, name text not null, descr text not null default '',
  min_level int not null, difficulty int not null, bonus numeric not null default 0, sort int not null default 0
);
create table if not exists public.fish_species (
  id text primary key, name text not null,
  rarity int not null check (rarity between 1 and 6),
  min_w numeric not null, max_w numeric not null,
  price int not null, xp int not null,
  spots text[] not null, min_level int not null default 1,
  night_only boolean not null default false, winter_only boolean not null default false,
  difficulty int not null default 3 check (difficulty between 1 and 10),
  look jsonb not null default '{}', descr text not null default '', sort int not null default 0
);
create table if not exists public.fish_rods (
  id text primary key, name text not null, price int not null, min_level int not null,
  strength numeric not null, catch_bonus numeric not null, reel_bonus numeric not null, sort int not null default 0
);
create table if not exists public.fish_baits (
  id text primary key, name text not null, price int not null, min_level int not null,
  wait_mult numeric not null, rarity_bonus numeric not null, consumable boolean not null default true,
  descr text not null default '', sort int not null default 0
);
create table if not exists public.fish_achievements (
  id text primary key, name text not null, descr text not null, title text,
  reward_gold int not null default 0, reward_xp int not null default 0, sort int not null default 0
);

-- Mängijate kalapüügi andmed (ainult serveri funktsioonid saavad muuta)
create table if not exists public.fishers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level int not null default 1, xp int not null default 0, gold int not null default 100,
  rod text not null default 'algaja', rods text[] not null default '{algaja}',
  bait text not null default 'leib', baits jsonb not null default '{"uss": 20}',
  rod_broken boolean not null default false, luck int not null default 0,
  total int not null default 0, rare int not null default 0, night int not null default 0,
  junk int not null default 0, chests int not null default 0, broken int not null default 0,
  lost int not null default 0, orders_done int not null default 0, comp_wins int not null default 0,
  biggest numeric not null default 0, biggest_species text,
  title text, titles text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists public.fish_casts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  spot text not null, bait text not null,
  kind text not null,               -- fish | junk | chest
  species text, junk text, weight numeric, giant boolean not null default false,
  bite_at timestamptz not null, hooked_at timestamptz,
  need_hits int, state text not null default 'waiting', -- waiting|hooked|landed|lost|broken
  created_at timestamptz not null default now()
);
create index if not exists fish_casts_user on public.fish_casts(user_id, state);
create table if not exists public.fish_catches (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  species text not null references public.fish_species(id),
  rarity int not null, weight numeric not null, spot text not null,
  giant boolean not null default false, night boolean not null default false,
  status text not null default 'kept', -- kept|trophy|sold|cooked|released|exchanged|delivered|cleaned|smoked
  caught_at timestamptz not null default now()
);
create index if not exists fish_catches_user on public.fish_catches(user_id, status);
create index if not exists fish_catches_time on public.fish_catches(caught_at);
create index if not exists fish_catches_spw on public.fish_catches(species, weight desc);
create index if not exists fish_catches_usp on public.fish_catches(user_id, species);
create table if not exists public.fish_unlocked (
  user_id uuid not null references auth.users(id) on delete cascade,
  ach text not null references public.fish_achievements(id),
  at timestamptz not null default now(), primary key (user_id, ach)
);
create table if not exists public.fish_orders (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null, idx int not null, species text not null references public.fish_species(id),
  qty int not null, reward_gold int not null, reward_xp int not null, reward_fame int not null,
  done boolean not null default false, primary key (user_id, day, idx)
);
create table if not exists public.fish_prizes (
  user_id uuid not null references auth.users(id) on delete cascade,
  comp text not null, period date not null, place int not null,
  at timestamptz not null default now(), primary key (user_id, comp, period)
);
create table if not exists public.fish_sales (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null, species text not null, qty int not null default 0,
  primary key (user_id, day, species)
);
-- Kuningriiki saadetud preemiad (kuld, toit, kaardid, kuulsus), mille mäng ühe korra kätte võtab
create table if not exists public.kingdom_inbox (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null, reason text not null default '', created_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['fish_spots','fish_species','fish_rods','fish_baits','fish_achievements',
    'fishers','fish_casts','fish_catches','fish_unlocked','fish_orders','fish_prizes','fish_sales','kingdom_inbox'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
  foreach t in array array['fish_spots','fish_species','fish_rods','fish_baits','fish_achievements'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('drop policy if exists "kõik loevad" on public.%I', t);
    execute format('create policy "kõik loevad" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2b. Laiendus 1: ilmakalad, esemed, ülesanded, uudised
-- ---------------------------------------------------------------------
alter table public.fish_species add column if not exists weather text[];
alter table public.fishers add column if not exists rods_broken text[] not null default '{}';
alter table public.fishers add column if not exists rod_repairs jsonb not null default '{}';
-- vana üldine katki-lipp -> praeguse õnge kohta
update public.fishers set rods_broken = array[rod] where rod_broken and not (rod = any(rods_broken));
alter table public.fish_catches add column if not exists weather text;
alter table public.fishers add column if not exists quests_done int not null default 0;
create table if not exists public.fish_items (
  id text primary key, name text not null, descr text not null default '', rarity int not null, price int not null, sort int not null default 0
);
create table if not exists public.fisher_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item text not null references public.fish_items(id), qty int not null default 0 check (qty >= 0),
  primary key (user_id, item)
);
create table if not exists public.fish_quests (
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period in ('d','w')), pstart date not null, idx int not null,
  kind text not null, param text, target numeric not null,
  reward_gold int not null, reward_xp int not null, reward_item text references public.fish_items(id), reward_qty int not null default 0,
  done boolean not null default false, primary key (user_id, period, pstart, idx)
);
create table if not exists public.fish_news (
  id bigserial primary key, at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade, kind text not null, data jsonb not null default '{}'
);
do $$ declare t text; begin
  foreach t in array array['fish_items','fisher_items','fish_quests','fish_news'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
  grant select on public.fish_items to anon, authenticated;
  drop policy if exists "kõik loevad" on public.fish_items;
  create policy "kõik loevad" on public.fish_items for select to anon, authenticated using (true);
end $$;

-- 2c. Laiendus 2: kalamaja ja akvaarium
alter table public.fishers add column if not exists house_level int not null default 0;
alter table public.fishers add column if not exists aq_at timestamptz not null default now();
alter table public.fishers add column if not exists aq_likes int not null default 0;
create table if not exists public.fish_house_levels (
  level int primary key, name text not null, descr text not null default '', gold int not null, min_fish_level int not null,
  items jsonb not null default '{}', sell_bonus numeric not null, xp_bonus numeric not null, bait_save numeric not null, slots int not null
);
create table if not exists public.fish_aq_likes (
  owner uuid not null references auth.users(id) on delete cascade, visitor uuid not null references auth.users(id) on delete cascade,
  day date not null, primary key (owner, visitor, day)
);
do $$ declare t text; begin
  foreach t in array array['fish_house_levels','fish_aq_likes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
  grant select on public.fish_house_levels to anon, authenticated;
  drop policy if exists "kõik loevad" on public.fish_house_levels;
  create policy "kõik loevad" on public.fish_house_levels for select to anon, authenticated using (true);
end $$;

-- 2d. Laiendus 3: õngede täiustamine, võlud, paadid ja merekohad
alter table public.fish_spots add column if not exists boat text;
alter table public.fishers add column if not exists boats text[] not null default '{}';
create table if not exists public.fish_enchants (
  id text primary key, name text not null, descr text not null, vals numeric[] not null, costs jsonb not null, sort int not null default 0
);
create table if not exists public.fish_boats (
  id text primary key, name text not null, descr text not null, price int not null, min_level int not null,
  items jsonb not null default '{}', wait_mult numeric not null, sort int not null default 0
);
create table if not exists public.fisher_rods (
  user_id uuid not null references auth.users(id) on delete cascade, rod text not null references public.fish_rods(id),
  upg int not null default 0 check (upg between 0 and 5), ench text references public.fish_enchants(id), ench_lvl int not null default 0 check (ench_lvl between 0 and 3),
  primary key (user_id, rod)
);
do $$ declare t text; begin
  foreach t in array array['fish_enchants','fish_boats','fisher_rods'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
  foreach t in array array['fish_enchants','fish_boats'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('drop policy if exists "kõik loevad" on public.%I', t);
    execute format('create policy "kõik loevad" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

-- 2e. Laiendus 4: kalaturg
alter table public.fish_catches add column if not exists bought boolean not null default false;
create table if not exists public.fish_market (
  id bigserial primary key, seller uuid not null references auth.users(id) on delete cascade,
  catch_id bigint not null references public.fish_catches(id) on delete cascade,
  species text not null, rarity int not null, weight numeric not null, giant boolean not null default false,
  price int not null check (price > 0), base int not null, fee int not null default 0,
  status text not null default 'open' check (status in ('open','sold','cancelled','expired')),
  buyer uuid references auth.users(id) on delete set null, new_catch bigint,
  created_at timestamptz not null default now(), closed_at timestamptz
);
create unique index if not exists fish_market_one_open on public.fish_market(catch_id) where status = 'open';
create index if not exists fish_market_open on public.fish_market(status, id desc);
alter table public.fish_market enable row level security;
revoke all on public.fish_market from anon, authenticated;

-- 2f. Kuningriikide koostöö
create table if not exists public.kingdom_gifts (
  sender uuid not null references auth.users(id) on delete cascade, receiver uuid not null references auth.users(id) on delete cascade,
  day date not null, created_at timestamptz not null default now(), primary key (sender, receiver, day)
);
create table if not exists public.kingdom_monument (
  stage int primary key, need jsonb, have jsonb not null default '{}', created_at timestamptz not null default now(), done_at timestamptz
);
create table if not exists public.kingdom_monument_contrib (
  user_id uuid not null references auth.users(id) on delete cascade, stage int not null, total int not null default 0, primary key (user_id, stage)
);
create table if not exists public.kingdom_contrib_day (
  user_id uuid not null references auth.users(id) on delete cascade, day date not null, amount int not null default 0, primary key (user_id, day)
);
do $$ declare t text; begin
  create table if not exists public.kingdom_contrib_resday (
    user_id uuid not null references auth.users(id) on delete cascade, day date not null, res text not null, amount int not null default 0, primary key (user_id, day, res)
  );
  foreach t in array array['kingdom_gifts','kingdom_monument','kingdom_monument_contrib','kingdom_contrib_day','kingdom_contrib_resday'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 2h. Etapp 6: prestiižitähed. Pärast 50. taset koguneb kogemus tähtedeks (★1, ★2, …).
--     Tase ei lähe tagasi ja midagi ei lukustu. Iga täht: kulda, ese ja +1% kalade müügihinda (kuni +30%).
alter table public.fishers add column if not exists prestige int not null default 0;
alter table public.fishers add column if not exists pxp int not null default 0;
alter table public.fishers add column if not exists prestige_last jsonb;

-- ---------------------------------------------------------------------
-- 3. Algandmed
-- ---------------------------------------------------------------------
insert into public.fish_spots (id,name,descr,min_level,difficulty,bonus,sort) values
 ('metsajarv','Metsajärv','Vaikne järv kuuskede vahel. Ideaalne koht alustamiseks.',1,1,0,1),
 ('jogi','Suur jõgi','Kiirevooluline jõgi, kus elavad forellid, harjused ja jõekuningas.',6,2,0.04,2),
 ('kuninglik','Kuninglik järv','Lossi kõrval asuv sügav järv, täis haruldasi ja suuri kalu.',12,3,0.08,3),
 ('meri','Mereäär','Tuuline rand. Merekalad, tuurad ja öised merevaimud.',18,3,0.10,4),
 ('jaa','Jäätunud järv','Igavese jää all elavad talvised kalad. Püüki tehakse jääaugust.',25,4,0.13,5),
 ('salajane','Salajane järv','Udu sees peidus järv, kus elavad legendaarsed ja müütilised olendid.',35,5,0.20,6)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, min_level=excluded.min_level,
  difficulty=excluded.difficulty, bonus=excluded.bonus, sort=excluded.sort;
insert into public.fish_boats (id,name,descr,price,min_level,items,wait_mult,sort) values
 ('paat','Puupaat','Tugev sõudepaat. Viib sind saarestikku ja kala võtab merel 5% kiiremini.',3000,18,'{"karp":10,"merevaik":2}',0.95,1),
 ('kaater','Mootorpaat','Kiire kaater avamere jaoks. Merel võtab kala 10% kiiremini.',15000,27,'{"ruun":3,"sormus":2}',0.90,2),
 ('laev','Kalalaev','Suur laev sügavikku püüdmiseks. Merel võtab kala 15% kiiremini.',45000,35,'{"kristall":2,"mustparl":2}',0.85,3)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, price=excluded.price, min_level=excluded.min_level,
  items=excluded.items, wait_mult=excluded.wait_mult, sort=excluded.sort;
insert into public.fish_spots (id,name,descr,min_level,difficulty,bonus,sort,boat) values
 ('saarestik','Saarestik','Kaljused laiud ja lahed. Siin elavad kammeljad, emakalad ja merihärjad. Vaja on paati.',20,4,0.12,7,'paat'),
 ('avameri','Avameri','Lõputu sinine meri, kus jahivad tuunid ja mõõkkalad. Vaja on mootorpaati.',28,5,0.16,8,'kaater'),
 ('sugavik','Sügavik','Pimedad sügavused, kuhu päike ei paista. Helendavad koletised ja müütiline draakon. Vaja on kalalaeva.',36,5,0.22,9,'laev')
on conflict (id) do update set name=excluded.name, descr=excluded.descr, min_level=excluded.min_level,
  difficulty=excluded.difficulty, bonus=excluded.bonus, sort=excluded.sort, boat=excluded.boat;
insert into public.fish_enchants (id,name,descr,vals,costs,sort) values
 ('onn','Õnnevõlu','Haruldasi kalu tuleb sagedamini.','{0.03,0.06,0.10}','[{"gold":300,"items":{"ruun":2}},{"gold":1500,"items":{"ruun":4,"parl":3}},{"gold":6000,"items":{"ruun":6,"soomus":1}}]',1),
 ('tugevus','Tugevusvõlu','Õng peab vastu palju raskemale kalale.','{0.15,0.30,0.50}','[{"gold":400,"items":{"sormus":1,"karp":5}},{"gold":2000,"items":{"sormus":3,"kristall":1}},{"gold":8000,"items":{"kristall":3,"soomus":1}}]',2),
 ('kiirus','Kiirusvõlu','Kala võtab kiiremini.','{0.08,0.15,0.22}','[{"gold":250,"items":{"merevaik":2}},{"gold":1200,"items":{"merevaik":4,"parl":2}},{"gold":5000,"items":{"merevaik":6,"kristall":1}}]',3),
 ('aare','Aardeleidja','Aardekirste tuleb tunduvalt sagedamini.','{1.6,2.2,3.0}','[{"gold":300,"items":{"parl":3}},{"gold":1500,"items":{"mustparl":1,"parl":4}},{"gold":6000,"items":{"mustparl":3,"soomus":1}}]',4),
 ('kuu','Kuuvalgus','Öösel tuleb palju rohkem haruldasi kalu.','{0.08,0.15,0.25}','[{"gold":300,"items":{"parl":2,"karp":4}},{"gold":1500,"items":{"mustparl":1,"ruun":2}},{"gold":6000,"items":{"mustparl":2,"kristall":2}}]',5),
 ('torm','Tormikutse','Ilmast sõltuvaid kalu tuleb sagedamini.','{0.70,0.85,1.00}','[{"gold":300,"items":{"merevaik":2,"karp":4}},{"gold":1500,"items":{"kristall":1,"ruun":2}},{"gold":6000,"items":{"kristall":3,"soomus":1}}]',6),
 ('hiid','Hiiglaste võlu','Rekordsuuri kalu tuleb sagedamini.','{1.6,2.2,3.0}','[{"gold":400,"items":{"sormus":1,"ruun":1}},{"gold":2000,"items":{"sormus":2,"mustparl":1}},{"gold":8000,"items":{"soomus":2}}]',7)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, vals=excluded.vals, costs=excluded.costs, sort=excluded.sort;

insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort) values
 ('ahven','Ahven',1,0.1,0.9,4,5,'{metsajarv,jogi,kuninglik}',1,false,false,1,'{"s":"n","c":["#9fb04a","#4a6a2a","#e8e0b0","#e2563a"],"st":6}','Triibuline ja ahne, võtab peaaegu iga söödaga.',10),
 ('sarg','Särg',1,0.1,0.6,3,4,'{metsajarv,jogi}',1,false,false,1,'{"s":"n","c":["#c9d2d6","#5f7680","#f2f4f2","#d9503a"]}','Hõbedane parvekala punaste uimedega.',11),
 ('roosarg','Roosärg',1,0.1,0.5,4,5,'{metsajarv}',1,false,false,1,'{"s":"n","c":["#d8c27a","#6a6a3a","#f2ecd0","#e8503a"]}','Kuldse läikega särje sugulane.',12),
 ('kiisk','Kiisk',1,0.05,0.25,3,4,'{metsajarv,jogi}',1,false,false,1,'{"s":"n","c":["#9a8a5a","#4a4a2a","#e0d8b0","#8a7a4a"],"sp":1}','Väike ja limane, aga torkiv.',13),
 ('teib','Teib',1,0.2,1.5,5,6,'{jogi}',6,false,false,2,'{"s":"n","c":["#b8c0b0","#4a5a4a","#eef0e8","#c8a060"]}','Jõgede lai ja tugev ujuja.',14),
 ('latikas','Latikas',1,0.5,4,7,7,'{metsajarv,kuninglik}',3,false,false,2,'{"s":"d","c":["#b9a26a","#6a5a3a","#e6dcbf","#7a6a4a"]}','Lai ja lapik põhjakala.',15),
 ('raim','Räim',1,0.05,0.3,3,5,'{meri,saarestik,avameri}',18,false,false,1,'{"s":"n","c":["#c8d8e2","#3a5a7a","#f6fafc","#9ab4c8"]}','Eesti rahvuskala. Väike, aga maitsev.',16),
 ('lest','Lest',1,0.2,1.8,8,7,'{meri,saarestik}',18,false,false,2,'{"s":"f","c":["#a08a6a","#6a5a42","#e8dcc0","#8a7a5a"],"sp":1}','Lame kala, kelle silmad on ühel küljel.',17),
 ('jaaahven','Jääahven',1,0.2,1.2,8,8,'{jaa}',25,false,false,2,'{"s":"n","c":["#a8c8c0","#4a6a6a","#eef6f2","#e2563a"],"st":6}','Talvise vee kange ahven.',18),
 ('tint','Tint',1,0.05,0.2,6,7,'{jaa}',25,false,false,1,'{"s":"n","c":["#d8e6ea","#7a9aaa","#ffffff","#a8c8d8"]}','Kurgi järgi lõhnav väike kala.',19),
 ('kuusarg','Kuuvalgusärg',1,0.2,1,15,12,'{salajane}',35,false,false,3,'{"s":"n","c":["#c8d0f0","#6a78b0","#f4f6ff","#9aa8e0"],"g":"#c8d8ff"}','Kuuvalgel helendav särg.',20),
 ('linask','Linask',2,0.4,2.5,12,12,'{metsajarv,kuninglik}',2,false,false,3,'{"s":"n","c":["#8a9a3a","#4a5a1a","#d8c870","#5a6a2a"]}','Rohekuldne ja aeglane, aga sitke.',30),
 ('haug','Haug',2,1,10,15,15,'{metsajarv,jogi,kuninglik}',4,false,false,4,'{"s":"l","c":["#7a9a5a","#3a5a2a","#e6e8c8","#9a7a3a"],"sp":1}','Järvede röövkala teravate hammastega.',31),
 ('sainas','Säinas',2,0.5,3,14,14,'{jogi}',6,false,false,3,'{"s":"n","c":["#c0b890","#5a5a40","#eeeadc","#d07a4a"]}','Kuldse kõhuga jõekala.',32),
 ('koha','Koha',2,1,8,18,16,'{jogi,kuninglik}',8,false,false,4,'{"s":"l","c":["#a9b49a","#4a5a4a","#eef0e2","#7a8a6a"],"st":7}','Klaasjate silmadega öine kiskja.',33),
 ('tursk','Tursk',2,1,10,16,15,'{meri,saarestik,avameri,sugavik}',18,false,false,4,'{"s":"n","c":["#a9a07a","#6a6a4a","#eee8d8","#8a8a6a"],"sp":1}','Mere ahne kala vurrudega lõual.',34),
 ('siig','Siig',2,0.5,3,16,16,'{jaa,kuninglik}',14,false,false,3,'{"s":"n","c":["#d0d8de","#7a8a94","#f6f8f8","#9aa8b0"]}','Hõbedane ja hinnatud kala.',35),
 ('raabis','Rääbis',2,0.1,0.4,12,14,'{jaa}',25,false,false,3,'{"s":"n","c":["#d8e2e8","#5a7a8a","#ffffff","#8aa8b8"]}','Peipsi järve kuulus väikekala.',36),
 ('kristallahven','Kristallahven',2,0.3,1.5,30,25,'{salajane}',35,false,false,5,'{"s":"n","c":["#b8f0ff","#5ab0d0","#f0ffff","#8ae0f0"],"st":5,"g":"#b8f0ff"}','Läbipaistvate soomustega ahven.',37),
 ('angerjas','Angerjas',3,0.5,3.5,35,30,'{metsajarv,jogi,kuninglik,meri}',10,true,false,5,'{"s":"e","c":["#5a5a3a","#2a2a1a","#c8b88a","#4a4a2a"]}','Ujub ainult öösel. Libe nagu seep.',50),
 ('luts','Luts',3,0.5,5,32,30,'{jogi,jaa}',10,false,true,5,'{"s":"e","c":["#7a6a4a","#3a2e1e","#d8c8a0","#5a4a32"],"sp":1}','Talvekala, kes armastab külma vett.',51),
 ('harjus','Harjus',3,0.3,1.5,34,30,'{jogi}',7,false,false,5,'{"s":"n","c":["#9aa0b8","#4a5070","#e8e8f2","#7a6ab0"],"b":"#b090e0"}','Suure purjekujulise seljauimega jõekala.',52),
 ('vikerforell','Vikerforell',3,0.5,4,38,32,'{jogi}',9,false,false,5,'{"s":"n","c":["#9ab4a4","#4a6a5a","#f2e8e0","#d97aa0"],"b":"#e86a8a","sp":1}','Vikerkaarevärviline tugev ujuja.',53),
 ('karpkala','Karpkala',3,2,15,40,35,'{kuninglik}',12,false,false,6,'{"s":"d","c":["#c8a040","#7a5a1a","#f0dca0","#b07a2a"],"sp":1}','Lossi tiikide uhke ja jõuline kala.',54),
 ('meriforell','Meriforell',3,1,8,42,36,'{meri,saarestik}',18,false,false,6,'{"s":"n","c":["#c8d0d8","#5a6878","#f6f6f6","#9aa8b8"],"sp":1}','Hõbedane rändaja mere ja jõe vahel.',55),
 ('lohe','Lõhe',3,2,16,45,38,'{meri,jogi,saarestik,avameri}',14,false,false,6,'{"s":"l","c":["#c0ccd4","#4a5a6a","#f6f2ee","#8a9aaa"],"sp":1}','Jõgede kuningas, kes hüppab üle kärestike.',56),
 ('paalia','Paalia',3,0.5,4,45,40,'{jaa}',26,false,false,6,'{"s":"n","c":["#5a7a8a","#2a3a4a","#f0a070","#e07040"],"sp":1}','Arktiline kala oranži kõhuga.',57),
 ('kuldahven','Kuldne ahven',4,0.5,2,80,65,'{metsajarv,jogi,kuninglik}',12,false,false,7,'{"s":"n","c":["#ffc84a","#c08010","#fff0b0","#ff7a2a"],"st":6,"g":"#ffd870"}','Muinasjutuline ahven puhtast kullast soomustega.',70),
 ('saga','Säga',4,5,60,90,70,'{kuninglik,jogi}',16,false,false,8,'{"s":"l","c":["#5a5a4a","#2a2a22","#b8b09a","#3a3a30"],"w":1}','Hiiglaslik vuntsidega põhjakala.',71),
 ('kuningkarp','Kuninglik karpkala',4,5,25,100,80,'{kuninglik}',17,false,false,7,'{"s":"d","c":["#f0e0c0","#c03a2a","#ffffff","#e04a3a"],"sp":1}','Kuninga lemmik, punase-valgekirju.',72),
 ('tuur','Tuur',4,10,80,110,85,'{meri,saarestik}',20,false,false,8,'{"s":"l","c":["#8a9098","#4a5058","#d8dce0","#6a7078"],"st":4}','Iidne kala, kes elas juba dinosauruste ajal.',73),
 ('virmaliskala','Virmaliskala',4,1,5,120,90,'{jaa}',28,false,false,8,'{"s":"n","c":["#7ae0b0","#3a6aa0","#e0fff0","#c070f0"],"b":"#7af0c0","g":"#90ffd0"}','Helendab nagu virmalised jää all.',74),
 ('udukala','Udukala',4,0.5,3,140,100,'{salajane}',36,true,false,8,'{"s":"n","c":["#d8dce8","#8a90a8","#ffffff","#b0b8d0"],"g":"#e8ecff"}','Ilmub ainult öösel udu seest.',75),
 ('kuuangerjas','Kuu-angerjas',5,1,5,300,200,'{salajane,kuninglik}',22,true,false,9,'{"s":"e","c":["#4a7ad8","#1a2a6a","#c8e0ff","#7ab0ff"],"g":"#8ab8ff"}','Öine legend, kes helendab nagu kuu.',90),
 ('joekuningas','Jõekuningas',5,8,40,280,190,'{jogi}',20,false,false,9,'{"s":"l","c":["#4a6a3a","#1a2a12","#d8c890","#c0a040"],"sp":1,"g":"#e8d080"}','Vana haug, kellest kalurid räägivad lugusid.',91),
 ('merivaim','Merivaim',5,2,10,330,220,'{meri,avameri}',24,true,false,9,'{"s":"l","c":["#a0e0e0","#2a6a7a","#f0ffff","#60c0d0"],"g":"#a0f0f0"}','Öise mere poolläbipaistev kala.',92),
 ('jaahaug','Jäähaug',5,5,25,320,220,'{jaa}',30,false,false,9,'{"s":"l","c":["#d0f0ff","#6aa0c0","#ffffff","#9ad0f0"],"sp":1,"g":"#d8f8ff"}','Igijää all elav valge haug.',93),
 ('haldjakala','Haldjakala',5,0.3,2,360,250,'{salajane}',38,false,false,9,'{"s":"d","c":["#d8a8f0","#7a5ab0","#f8eaff","#9ae8f0"],"g":"#e6b8ff","b":"#9ae8f0"}','Haldjate lemmik, sädeleb kõigis värvides.',94),
 ('kuldkala','Kuldkala',6,0.2,0.6,600,500,'{metsajarv,jogi,kuninglik,meri,jaa,salajane}',10,false,false,10,'{"s":"n","c":["#ffc23a","#e07a10","#ffe8a0","#ffa020"],"g":"#ffd060"}','Täidab soovi, kui ta vabaks lased.',110),
 ('igijaavaim','Igijää vaim',6,20,80,2200,1100,'{jaa}',32,false,false,10,'{"s":"l","c":["#ffffff","#a0d0f0","#ffffff","#c0e8ff"],"g":"#ffffff"}','Jäätunud järve süda ise.',111),
 ('leviaatan','Leviaatan',6,100,400,2500,1200,'{meri,avameri,sugavik}',30,false,false,10,'{"s":"l","c":["#3a5a6a","#0e1e2a","#a0b8c0","#2a4a5a"],"sp":1}','Mere sügavuste koletis. Vajab väga tugevat õnge.',112),
 ('jarvelohe','Järvelohe',6,50,200,3000,1500,'{salajane}',40,false,false,10,'{"s":"e","c":["#3aa070","#0a3a2a","#d0f0a0","#f0c040"],"g":"#80ffb0","sp":1}','Salajase järve müütiline valvur.',113)
on conflict (id) do update set name=excluded.name, rarity=excluded.rarity, min_w=excluded.min_w, max_w=excluded.max_w,
  price=excluded.price, xp=excluded.xp, spots=excluded.spots, min_level=excluded.min_level, night_only=excluded.night_only,
  winter_only=excluded.winter_only, difficulty=excluded.difficulty, look=excluded.look, descr=excluded.descr, sort=excluded.sort;

insert into public.fish_rods (id,name,price,min_level,strength,catch_bonus,reel_bonus,sort) values
 ('algaja','Algaja õng',0,1,3,0,0,1),
 ('puit','Puidust õng',120,3,6,0.02,0.02,2),
 ('tugev','Tugevdatud õng',450,7,12,0.04,0.04,3),
 ('teras','Terasõng',1300,12,22,0.06,0.06,4),
 ('kuld','Kuldõng',3200,17,35,0.09,0.08,5),
 ('kuninglik','Kuninglik õng',6800,22,55,0.12,0.10,6),
 ('maagiline','Maagiline õng',12500,28,85,0.16,0.12,7),
 ('draakon','Draakoniõng',23000,34,140,0.20,0.14,8),
 ('legend','Legendaarne õng',42000,41,260,0.25,0.16,9),
 ('muutiline','Müütiline õng',80000,48,500,0.32,0.19,10),
 ('virmalised','Virmaliste õng',150000,50,900,0.38,0.22,11)
on conflict (id) do update set name=excluded.name, price=excluded.price, min_level=excluded.min_level, strength=excluded.strength,
  catch_bonus=excluded.catch_bonus, reel_bonus=excluded.reel_bonus, sort=excluded.sort;

insert into public.fish_baits (id,name,price,min_level,wait_mult,rarity_bonus,consumable,descr,sort) values
 ('leib','Leivatükk',0,1,1.0,0,false,'Tasuta ja lõputu, aga kalad võtavad aeglaselt.',1),
 ('uss','Vihmauss',1,1,0.85,0.02,true,'Klassikaline sööt, kalad võtavad kiiremini.',2),
 ('vagel','Kärbsevagel',2,4,0.80,0.04,true,'Väikesed kalad ei suuda vastu panna.',3),
 ('mais','Magus mais',3,8,0.80,0.05,true,'Karpkalade ja latikate lemmik.',4),
 ('hobelant','Hõbelant',400,10,0.90,0.06,false,'Peibutis, mis ei kulu. Meelitab röövkalu.',5),
 ('krevett','Krevett',6,18,0.75,0.08,true,'Merekalade maiuspala.',6),
 ('kuldvobler','Kuldvobler',2500,20,0.80,0.10,false,'Kallis peibutis, mis ei kulu.',7),
 ('valgus','Helendav sööt',15,26,0.70,0.13,true,'Paistab pimedas vees kaugele.',8),
 ('haldjatolm','Haldjatolm',40,36,0.60,0.18,true,'Võlusööt, mis meelitab haruldasi olendeid.',9),
 ('draakonilant','Draakonilant',16000,44,0.70,0.22,false,'Legendaarne peibutis, mis ei kulu kunagi.',10)
on conflict (id) do update set name=excluded.name, price=excluded.price, min_level=excluded.min_level, wait_mult=excluded.wait_mult,
  rarity_bonus=excluded.rarity_bonus, consumable=excluded.consumable, descr=excluded.descr, sort=excluded.sort;

insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('esimene','Esimene kala','Püüa oma esimene kala','Algaja kalur',30,20,1),
 ('kala100','Sada kala','Püüa 100 kala','Kogenud kalur',400,200,2),
 ('kala1000','Tuhat kala','Püüa 1000 kala','Kalameister',4000,2000,3),
 ('haruldane','Esimene haruldane','Püüa haruldane või haruldasem kala',null,100,80,4),
 ('eepiline','Esimene eepiline','Püüa eepiline kala',null,300,200,5),
 ('legendaarne','Esimene legendaarne','Püüa legendaarne kala','Legendide püüdja',1000,600,6),
 ('muutiline','Esimene müütiline','Püüa müütiline kala','Müütide murdja',3000,1500,7),
 ('suur10','Suur kala','Püüa vähemalt 10 kg kala',null,150,100,8),
 ('suur50','Hiidkala','Püüa vähemalt 50 kg kala','Hiidkala taltsutaja',800,400,9),
 ('suur100','Koletis','Püüa vähemalt 100 kg kala','Koletiste kütt',2000,1000,10),
 ('hiiglane','Rekordiline','Püüa rekordiliselt suur kala',null,200,150,11),
 ('tavalised','Kõik tavalised','Püüa kõik tavalised kalaliigid',null,500,300,12),
 ('kohad','Rändkalur','Püüa kala kõigis kuues kohas','Rändkalur',1500,800,13),
 ('koik','Kalaraamat täis','Püüa kõik kalaliigid','Kalakuningas',10000,5000,14),
 ('tase10','Tase 10','Saavuta kalapüügi 10. tase',null,300,0,15),
 ('tase25','Tase 25','Saavuta kalapüügi 25. tase','Järvede isand',1500,0,16),
 ('tase50','Tase 50','Saavuta kalapüügi 50. tase','Kalapüügimeister',10000,0,17),
 ('oo','Öökalur','Püüa öösel 50 kala','Öökalur',600,300,18),
 ('prugi','Prügikoristaja','Leia 10 naljakat eset','Prügikoristaja',200,100,19),
 ('kirst','Veealune aardekütt','Leia 5 veealust aardekirstu','Aardekütt',800,400,20),
 ('kuldkala','Soovide täitja','Püüa kuldkala','Soovide täitja',500,300,21),
 ('tellimused','Kuninglik varustaja','Täida 20 kuningliku köögi tellimust','Kuninglik varustaja',1200,600,22),
 ('voitja','Võistluste võitja','Võida mõni kalapüügivõistlus','Võistluste võitja',1000,500,23),
 ('murdja','Õngemurdja','Murra 5 korda õng','Õngemurdja',100,50,24)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

-- Ilmast sõltuvad kalad (ilmuvad ainult kindla ilmaga)
insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort,weather) values
 ('pilvekala','Pilvekala',2,0.3,1.5,16,15,'{metsajarv,jaa}',3,false,false,3,'{"s":"n","c":["#d8e0e8","#8a98a8","#ffffff","#b0bcc8"]}','Hall ja vaikne, ujub ainult pilvise ilmaga.',38,'{pilves}'),
 ('paikesekarp','Päikesekarp',2,1,6,20,18,'{kuninglik,metsajarv}',5,false,false,4,'{"s":"d","c":["#ffd860","#e0901a","#fff4c0","#ff9a20"],"g":"#ffe890"}','Tuleb pinnale päikest võtma.',39,'{paike}'),
 ('vihmaforell','Vihmaforell',3,0.5,3,40,34,'{metsajarv,jogi}',6,false,false,5,'{"s":"n","c":["#8ab0c8","#3a5a7a","#e8f2f8","#6a9ac0"],"sp":1,"b":"#9ad0f0"}','Hüppab vihmapiiskade järele.',58,'{vihm}'),
 ('uduhobe','Uduhõbe',3,0.3,2,45,40,'{metsajarv,kuninglik,salajane}',9,false,false,6,'{"s":"n","c":["#e8eef2","#a0aab8","#ffffff","#c8d0dc"],"g":"#f0f4ff"}','Peaaegu nähtamatu kala, kes ilmub udus.',59,'{udu}'),
 ('vikerkaarekala','Vikerkaarekala',4,0.5,3,130,95,'{jogi,kuninglik,salajane}',14,false,false,8,'{"s":"n","c":["#ff9a6a","#7a5ac8","#fff0d8","#60c8f0"],"b":"#a0f080","g":"#ffd0f0"}','Kõigis värvides helkiv kala, mida nähakse vihmasajus.',76,'{vihm}'),
 ('tormihaug','Tormihaug',4,3,18,120,90,'{kuninglik,jogi,meri}',15,false,false,8,'{"s":"l","c":["#5a6a7a","#1a2a3a","#c8d0d8","#3a4a5a"],"sp":1}','Tormiga tõuseb ta sügavusest jahtima.',77,'{torm}'),
 ('valgukala','Välgukala',5,1,6,380,260,'{meri,salajane,avameri}',24,false,false,9,'{"s":"e","c":["#ffe860","#3a3a8a","#ffffd0","#ffd020"],"g":"#fff080"}','Sähvatab nagu välk. Püütav ainult tormiga.',95,'{torm}')
on conflict (id) do update set name=excluded.name, rarity=excluded.rarity, min_w=excluded.min_w, max_w=excluded.max_w,
  price=excluded.price, xp=excluded.xp, spots=excluded.spots, min_level=excluded.min_level, difficulty=excluded.difficulty,
  look=excluded.look, descr=excluded.descr, sort=excluded.sort, weather=excluded.weather;

-- Mere- ja sügavikukalad (3. laiendus)
insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort,weather) values
 ('tobias','Tobias',1,0.02,0.2,4,6,'{saarestik,avameri}',20,false,false,2,'{"s":"n","c":["#c8e0d8","#4a7a6a","#f2faf6","#a8c8c0"]}','Sale liivaangerjas, kes peitub parvedena liiva sisse.',13,null),
 ('laternkala','Laternkala',1,0.02,0.12,6,8,'{sugavik}',36,false,false,3,'{"s":"n","c":["#4a5a7a","#1a2238","#8a9ac0","#3a4a6a"],"g":"#7ad8ff"}','Pisike sügavikukala, kelle kõhul helendavad tuled.',14,null),
 ('emakala','Emakala',2,0.2,0.8,18,17,'{saarestik}',20,false,false,4,'{"s":"e","c":["#8a7a4a","#4a3a1e","#d8c890","#7a6a3a"],"sp":1}','Kummaline kala, kes sünnitab elusaid poegi.',40,null),
 ('merihark','Merihärg',2,0.1,0.6,20,18,'{saarestik}',21,false,false,4,'{"s":"n","c":["#a0603a","#4a2a1a","#e8c0a0","#c0603a"],"st":0}','Okkaline kivide vahel elav kala, kes kõht täis sööb.',41,null),
 ('makrell','Makrell',2,0.3,1.5,24,20,'{avameri,saarestik}',28,false,false,5,'{"s":"n","c":["#7ab0b8","#1a4a5a","#f4f8f8","#6a98a0"]}','Kiire triibulise seljaga merekala, kes ujub suurtes parvedes.',42,null),
 ('kammeljas','Kammeljas',3,2,12,80,60,'{saarestik,avameri}',22,false,false,6,'{"s":"f","c":["#8a7a5a","#4a3e28","#e8e0c8","#7a6a4a"],"sp":1}','Suur lapik kala, kelle mõlemad silmad on ühel küljel.',62,null),
 ('kirveskala','Kirveskala',3,0.05,0.3,90,70,'{sugavik}',36,false,false,6,'{"s":"d","c":["#d0d8e8","#4a5a7a","#f4f8ff","#a0b0c8"],"g":"#9ad8ff"}','Hõbedane kirvekujuline kala, kes helendab sügavuses.',63,null),
 ('tuun','Tuun',4,20,250,320,220,'{avameri}',28,false,false,9,'{"s":"l","c":["#4a6a9a","#0e2048","#e8eef4","#ffd040"]}','Ookeani kiireim ujuja. Väga tugev ja raske kala.',80,null),
 ('merikurat','Merikurat',4,5,40,280,200,'{sugavik}',36,false,false,8,'{"s":"d","c":["#5a4a3a","#2a1e14","#a08a6a","#4a3a2a"],"sp":1,"g":"#a0fff0"}','Hiiglasliku suuga sügavikukala, kes meelitab saaki helendava ridvaga.',81,null),
 ('mookkala','Mõõkkala',5,30,300,900,560,'{avameri}',30,false,false,10,'{"s":"l","c":["#5a6a9a","#1a2448","#e0e6f0","#7a5a9a"]}','Pika mõõgaga ookeani kuningas.',98,null),
 ('airukala','Airukala',5,20,150,850,540,'{sugavik}',36,false,false,10,'{"s":"e","c":["#d8dce8","#8a90a8","#ffffff","#ff4a3a"]}','Väga pikk hõbedane kala punase harjaga. Peetakse meremaoks.',99,null),
 ('sugavusedraakon','Sügavuse draakon',6,100,500,4000,2000,'{sugavik}',40,false,false,10,'{"s":"e","c":["#2a3a6a","#0a0e24","#7ad0ff","#3af0e0"],"g":"#40e0ff"}','Müütiline olend, kes ärkab vaid sügaviku kõige pimedamas osas.',118,null)
on conflict (id) do update set name=excluded.name, rarity=excluded.rarity, min_w=excluded.min_w, max_w=excluded.max_w,
  price=excluded.price, xp=excluded.xp, spots=excluded.spots, min_level=excluded.min_level, difficulty=excluded.difficulty,
  look=excluded.look, descr=excluded.descr, sort=excluded.sort, weather=excluded.weather;

-- Eesti päris kalaliigid (lisa)
insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort,weather) values
 ('viidikas','Viidikas',1,0.01,0.06,2,3,'{metsajarv,jogi,kuninglik}',1,false,false,1,'{"s":"n","c":["#d8e2e6","#6a8a98","#f8fafa","#c8d0d0"]}','Väike hõbedane pinnakala, keda on suvel suurte parvedena.',21,null),
 ('nurg','Nurg',1,0.1,0.6,4,5,'{metsajarv,kuninglik}',2,false,false,1,'{"s":"d","c":["#c8ccc0","#6a7060","#eef0e8","#d88a6a"]}','Latika moodi, aga väiksem ja punakate uimedega.',22,null),
 ('lepamaim','Lepamaim',1,0.01,0.03,2,3,'{jogi}',1,false,false,1,'{"s":"n","c":["#9aa078","#4a5034","#e8d8a0","#c86a3a"],"st":8}','Pisike kirju kala kiirevoolulistest ojadest.',23,null),
 ('luukarits','Luukarits',1,0.01,0.02,2,3,'{meri,saarestik,metsajarv}',1,false,false,1,'{"s":"n","c":["#7a9a7a","#2a4a3a","#e8eee0","#c84a3a"]}','Kolme seljaokkaga pisike kala. Kevadel on isasel punane kõht.',24,null),
 ('ogalik','Ogalik',1,0.01,0.02,2,3,'{metsajarv,jogi}',1,false,false,1,'{"s":"n","c":["#8a9060","#3a4028","#d8d8b0","#6a6a40"]}','Üheksa seljaokkaga, üks Eesti väikseimaid kalu.',25,null),
 ('trulling','Trulling',1,0.01,0.05,3,4,'{jogi}',3,false,false,2,'{"s":"e","c":["#a08a5a","#5a4a2a","#e0d0a0","#8a7448"],"sp":1}','Vurrudega põhjakala, kes peidab end kivide alla.',26,null),
 ('hink','Hink',1,0.01,0.03,3,4,'{jogi,metsajarv}',3,false,false,2,'{"s":"e","c":["#d8c8a0","#5a4a30","#f0e8d0","#9a8a60"],"sp":1}','Täpiline pisike põhjakala, kes kaevub liiva sisse.',27,null),
 ('voldas','Võldas',1,0.01,0.08,3,4,'{jogi}',3,false,false,2,'{"s":"n","c":["#8a7a5a","#3a3020","#d8c8a0","#6a5a3a"],"sp":1}','Suure peaga põhjakala puhastest ojadest.',28,null),
 ('kilu','Kilu',1,0.01,0.03,2,4,'{meri,saarestik,avameri}',18,false,false,1,'{"s":"n","c":["#b8d0e0","#2a4a6a","#f4f8fc","#8aa8c0"]}','Räime väike sugulane. Kiluvõileib on Eesti klassika!',29,null),
 ('mustmudil','Must mudil',1,0.02,0.15,4,5,'{meri,saarestik}',18,false,false,2,'{"s":"n","c":["#5a5040","#2a2418","#a89878","#3a3020"],"sp":1}','Võõrliik, kes on Läänemeres väga kiiresti levinud.',30,null),
 ('liivamudil','Liivamudil',1,0.01,0.02,2,3,'{meri,saarestik}',18,false,false,1,'{"s":"n","c":["#d8c8a0","#8a7a5a","#f4ecd8","#b0a080"],"sp":1}','Liivase põhja värvi pisike mudil.',31,null),
 ('vimb','Vimb',2,0.2,1.2,12,12,'{jogi,meri}',6,false,false,3,'{"s":"n","c":["#a8b4bc","#3a4650","#eef0f0","#d8a050"]}','Kevadel jõgedesse kudema tulev ninakas kala.',38,null),
 ('turb','Turb',2,0.3,2.5,14,13,'{jogi}',7,false,false,3,'{"s":"n","c":["#a8a890","#3a4038","#e8e8d8","#d8603a"]}','Laia peaga jõekala, kes sööb isegi konni.',39,null),
 ('koger','Koger',2,0.1,1.5,10,10,'{metsajarv,kuninglik}',3,false,false,2,'{"s":"d","c":["#b8a040","#5a4a1a","#ece0a0","#a07a2a"]}','Kuldne ja vastupidav, elab ka mudastes tiikides.',40,null),
 ('hobekoger','Hõbekoger',2,0.1,1.5,9,9,'{metsajarv,kuninglik,jogi}',3,false,false,2,'{"s":"d","c":["#c8ccc8","#5a6060","#f2f2f0","#9aa0a0"]}','Kogre hõbedane sugulane, kes levib kiiresti.',41,null),
 ('nokkhaug','Nokkhaug',2,0.2,1,18,16,'{meri,saarestik}',19,false,false,4,'{"s":"l","c":["#5a9a9a","#1a4a5a","#e8f4f4","#3ac0a0"]}','Pika nokaga merekala, kelle luud on rohelised.',42,null),
 ('merinoel','Merinõel',2,0.01,0.03,16,15,'{saarestik}',20,false,false,3,'{"s":"e","c":["#8a9a5a","#3a4a1a","#d8e0a0","#6a7a3a"]}','Peenike nagu nõel. Poegi kannab hoopis isane.',43,null),
 ('madunoel','Madunõel',2,0.01,0.02,16,15,'{saarestik,meri}',20,false,false,3,'{"s":"e","c":["#6a8a5a","#2a3a1a","#c8d8a0","#4a6a3a"]}','Meriheina vahel peituv ussi moodi kala.',44,null),
 ('peled','Peled',2,0.3,2,16,15,'{jaa,kuninglik}',14,false,false,3,'{"s":"n","c":["#d0d8e0","#6a7a88","#f6f8fa","#a0aab4"]}','Siia sugulane, kes toodi kunagi Siberist.',45,null),
 ('mudamaim','Mudamaim',2,0.01,0.04,14,13,'{metsajarv}',4,false,false,3,'{"s":"n","c":["#a8a070","#5a5430","#e0d8b0","#8a8050"],"sp":1}','Haruldane pisikala soiste veekogude mudasest veest.',46,null),
 ('vingerjas','Vingerjas',2,0.05,0.15,12,12,'{metsajarv,kuninglik}',4,false,false,3,'{"s":"e","c":["#8a6a3a","#3a2a14","#e0c890","#6a5030"],"st":3}','Ilma ennustav kala: enne äikest muutub rahutuks.',47,'{torm}'),
 ('ojasilm','Ojasilm',2,0.01,0.02,14,13,'{jogi}',6,false,false,3,'{"s":"e","c":["#9a8a6a","#4a3a2a","#e0d4b8","#7a6a4a"]}','Jõesilmu väike sugulane, kes elab ojades.',48,null),
 ('toogjas','Tõugjas',3,1,6,40,34,'{jogi}',10,false,false,6,'{"s":"n","c":["#a8b4c0","#3a4858","#eef2f4","#c8b8a0"]}','Ainus röövtoiduline karpkalaline. Ründab pinnal kalu kõva pritsmega.',58,null),
 ('joeforell','Jõeforell',3,0.2,3,40,34,'{jogi}',8,false,false,6,'{"s":"n","c":["#a89060","#4a3a1e","#f0e0b0","#d0603a"],"sp":1}','Punaste täppidega ojade kaunitar.',59,null),
 ('joesilm','Jõesilm',3,0.05,0.2,36,32,'{jogi}',10,true,false,5,'{"s":"e","c":["#8a90a0","#3a4050","#d8dce0","#6a7080"]}','Iidne lõugadeta kala, kes rändab öösiti jõest üles.',60,null),
 ('hobekarp','Hõbekarp',3,3,20,44,36,'{kuninglik}',12,false,false,6,'{"s":"d","c":["#c8d0d4","#5a6670","#f4f6f6","#a0aab0"]}','Suur hõbedane karpkala, kes hüppab ehmatades veest välja.',61,null),
 ('amuur','Amuur',3,3,25,46,38,'{kuninglik}',13,false,false,6,'{"s":"n","c":["#8a9a6a","#3a4a2a","#d8d8b0","#6a7a4a"]}','Taimtoiduline hiid, kes hoiab tiigid puhtana.',62,null)
on conflict (id) do update set name=excluded.name, rarity=excluded.rarity, min_w=excluded.min_w, max_w=excluded.max_w,
  price=excluded.price, xp=excluded.xp, spots=excluded.spots, min_level=excluded.min_level, night_only=excluded.night_only, difficulty=excluded.difficulty,
  look=excluded.look, descr=excluded.descr, sort=excluded.sort, weather=excluded.weather;

insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('paadimees','Paadimees','Osta oma esimene paat','Meremees',500,300,33),
 ('kapten','Kapten','Osta kõik kolm paati','Kapten',5000,3000,34),
 ('taiustaja','Meistri käsi','Täiusta mõni õng +5 tasemeni','Õngemeister',3000,1500,35),
 ('volur','Õngevõlur','Lisa õngele 3. astme võlu','Õngevõlur',4000,2000,36),
 ('suvamees','Sügavike uurija','Püüa kõik sügaviku kalad','Sügavike uurija',8000,4000,37)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

insert into public.fish_items (id,name,descr,rarity,price,sort) values
 ('karp','Merekarp','Ilus karp põhjamudast.',1,5,1),
 ('parl','Pärl','Läikiv valge pärl.',2,40,2),
 ('merevaik','Merevaik','Iidne kivistunud vaik, sees on väike putukas.',2,35,3),
 ('ruun','Iidne ruun','Kivi, millele on uuritud vanad märgid.',3,120,4),
 ('sormus','Kuldsõrmus','Keegi kaotas selle ammu järve.',3,150,5),
 ('mustparl','Must pärl','Väga haruldane tume pärl.',4,400,6),
 ('kristall','Veekristall','Kristall, milles hõljub järvevesi.',4,500,7),
 ('soomus','Draakonisoomus','Hiiglasliku olendi kuldne soomus.',5,1500,8)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, rarity=excluded.rarity, price=excluded.price, sort=excluded.sort;

insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('ilmakalur','Ilmatark','Püüa kõik ilmast sõltuvad kalad','Ilmatark',1500,800,25),
 ('kuldkirst','Kuldne kirst','Leia kuldne aardekirst',null,500,300,26),
 ('usin','Usin kalur','Täida 25 kalapüügiülesannet','Usin kalur',1000,500,27),
 ('kott','Kogujahing','Kogu kotti 30 eset',null,300,200,28)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

insert into public.fish_house_levels (level,name,descr,gold,min_fish_level,items,sell_bonus,xp_bonus,bait_save,slots) values
 (1,'Mahajäetud kalurihütt','Vana lagunenud hütt järve kaldal. Siia mahub esimene akvaarium.',300,3,'{}',0.02,0.03,0.04,3),
 (2,'Taastatud kalurihütt','Paigatud katus, uus uks ja soe ahi – hütt on jälle elamiskõlblik.',800,6,'{"karp":5}',0.04,0.06,0.08,4),
 (3,'Kalurimaja','Korralik palkmaja võrguriiuli ja suurema akvaariumiga.',1800,9,'{"karp":10,"parl":2}',0.06,0.09,0.12,5),
 (4,'Täiustatud kalurimaja','Maja oma paadisilla, suitsuahju ja tööruumiga.',3500,13,'{"parl":4,"merevaik":3}',0.08,0.12,0.16,6),
 (5,'Kaluritalu','Talu kõrvalhoonete, aia ja suure akvaariumiga.',6000,17,'{"merevaik":5,"ruun":2}',0.10,0.15,0.20,7),
 (6,'Kalurikompleks','Mitu hoonet: maja, ait, suitsukoda ja kalade kasvatuskoht.',10000,22,'{"ruun":3,"sormus":2}',0.12,0.18,0.24,8),
 (7,'Kalurimõis','Mõis, kuhu tullakse kaugelt kalu vaatama.',16000,27,'{"sormus":3,"mustparl":1}',0.14,0.21,0.28,9),
 (8,'Kuninglik kalandusmõis','Kuningas ise käib siin kala söömas ja akvaariumi imetlemas.',25000,33,'{"mustparl":2,"kristall":1}',0.16,0.24,0.32,10),
 (9,'Suur kalanduskeskus','Kuningriigi kalanduse süda – sadam, turuplats ja klaasseintega akvaariumid.',40000,40,'{"kristall":2,"soomus":1}',0.18,0.27,0.36,11),
 (10,'Kuninglik kalandusimpeerium','Legendaarne impeerium, mille akvaariumist ja kaladest räägib kogu kuningriik.',65000,46,'{"kristall":3,"soomus":2}',0.20,0.30,0.40,12)
on conflict (level) do update set name=excluded.name, descr=excluded.descr, gold=excluded.gold, min_fish_level=excluded.min_fish_level,
  items=excluded.items, sell_bonus=excluded.sell_bonus, xp_bonus=excluded.xp_bonus, bait_save=excluded.bait_save, slots=excluded.slots;

insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('maja1','Oma nurk','Ehita kalamaja',null,200,100,29),
 ('maja5','Suur kalamaja','Täienda kalamaja 5. tasemele','Majaperemees',1500,800,30),
 ('maja10','Kalandusimpeerium','Täienda oma kodu 10. tasemele','Veekuningas',10000,5000,31),
 ('akvaarium','Akvaarist','Pane akvaariumi 5 kala',null,300,150,32)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

-- Etapp 6: prestiižitähtede saavutused
insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('vana1','Vana kala','Püüa vana kala (oma liigi suuremate seast)',null,500,0,95),
 ('vana25','Vanade kalade tundja','Püüa 25 vana või legendaarset kala','Vanakalur',3000,0,96),
 ('legvana5','Aegade kalur','Püüa 5 legendaarse vanusega kala (hiiglast)','Aegade kalur',8000,0,97),
 ('taht1','Esimene täht','Teeni pärast 50. taset esimene prestiižitäht','Tähekalur',3000,0,90),
 ('taht5','Viis tähte','Teeni 5 prestiižitähte','Kuldtähe kalur',8000,0,91),
 ('taht10','Tähistaevas','Teeni 10 prestiižitähte','Tähtede valitseja',15000,0,92),
 ('taht25','Järvede legend','Teeni 25 prestiižitähte','Järvede legend',40000,0,93)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

-- ---------------------------------------------------------------------
-- 2i. Udukuninga saladus, 1. osa: Saladuste raamat, kaarditükid, salajased ülesanded, Kristallikoobas
--     Kõik leiud annab server. Iga saladus ja kaarditükk on igal mängijal ainult üks kord (primary key).
-- ---------------------------------------------------------------------
insert into public.fish_items (id,name,descr,rarity,price,sort) values
 ('koopakristall','Koopakristall','Helendav kristall Kristallikoopa sügavusest.',3,120,60)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, rarity=excluded.rarity, price=excluded.price, sort=excluded.sort;
create table if not exists public.secret_defs (
  id text primary key, name text not null, descr text not null, hint text not null,
  reward_gold int not null default 0, reward_item text references public.fish_items(id), reward_qty int not null default 0, sort int not null default 0
);
create table if not exists public.secret_found (
  user_id uuid not null references auth.users(id) on delete cascade,
  secret text not null references public.secret_defs(id), at timestamptz not null default now(), primary key (user_id, secret)
);
create table if not exists public.secret_pieces (
  user_id uuid not null references auth.users(id) on delete cascade,
  piece int not null check (piece between 1 and 7), source text not null, at timestamptz not null default now(), primary key (user_id, piece)
);
create table if not exists public.secret_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chest_tries int not null default 0, quest_tries int not null default 0,
  cave_day date, lanterns int not null default 0, run jsonb, best_depth int not null default 0, cave_runs int not null default 0
);
do $$ declare t text; begin
  foreach t in array array['secret_defs','secret_found','secret_pieces','secret_state'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
insert into public.secret_defs (id,name,descr,hint,reward_gold,reward_item,reward_qty,sort) values
 ('tormiangerjas','Tormi angerjas','Püüdsid tormi ajal angerja.','Kui taevas müristab, liigub vees libe vari.',800,'merevaik',1,1),
 ('keskoo','Südaöö kalur','Tõid kala välja kesköö esimese kümne minuti jooksul.','Kui kell lööb kaksteist, on järv kõige vaiksem.',600,'parl',2,2),
 ('udukalur','Udu sõber','Püüdsid ühel päeval udu ajal 5 kala.','Udu ei peida ainult kallast. Kes julgeb seal kaua püüda?',700,null,0,3),
 ('prugikuningas','Prügikuningas','Leidsid järjest kolm korda prügi.','Mõni toob järvest ainult saasta. Mõni teeb seda kolm korda järjest.',400,'karp',3,4),
 ('helde','Helde süda','Lasid kuldkala vabaks.','Kõige suurem aare on see, millest ise loobud.',2500,null,0,5),
 ('naaber','Hea naaber','Imetlesid ühel päeval kolme akvaariumi.','Käi naabrite juures külas. Mitme juures jõuad ühe päevaga?',600,null,0,6),
 ('koletis','Koletise saatus','Andsid Kalatunni bossikalale viimase löögi.','Kalatunni koletis langeb kord päevas. Kelle käe läbi?',2000,null,0,7),
 ('sada','Väsimatu','Püüdsid ühel päeval 100 kala.','Päikesetõusust loojanguni ja veel kauemgi – sada korda.',1500,null,0,8),
 ('kirstud','Aardeküti õnn','Leidsid ühel päeval 3 aardekirstu.','Õnn käib kolmekesi.',1200,null,0,9),
 ('sugavus','Sügavuste kuulaja','Jõudsid Kristallikoopas 15. sügavusele.','Kristallikoopa põhjas kuuleb vaikust.',2000,'koopakristall',3,10)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, hint=excluded.hint, reward_gold=excluded.reward_gold,
  reward_item=excluded.reward_item, reward_qty=excluded.reward_qty, sort=excluded.sort;

-- 2j. Udukuninga saladus, 2. osa: Udulinnus, Kuninga Vari ja müütilised esemed
alter table public.secret_state add column if not exists sea_tries int not null default 0;
alter table public.secret_state add column if not exists kt_tries int not null default 0;
create table if not exists public.secret_myths (
  id text primary key, name text not null, descr text not null, src text not null, sort int not null default 0
);
create table if not exists public.fisher_myth (
  user_id uuid not null references auth.users(id) on delete cascade,
  myth text not null references public.secret_myths(id), at timestamptz not null default now(), primary key (user_id, myth)
);
create table if not exists public.secret_castle (
  user_id uuid primary key references auth.users(id) on delete cascade,
  halls text[] not null default '{}', riddle int not null default floor(random() * 6)::int, riddle_wait timestamptz,
  atk_day date, atk_n int not null default 0
);
create table if not exists public.secret_boss (
  week date primary key, hp int not null, max_hp int not null, killed_at timestamptz, killer uuid references auth.users(id) on delete set null
);
create table if not exists public.secret_boss_dmg (
  week date not null, user_id uuid not null references auth.users(id) on delete cascade,
  dmg int not null default 0, hits int not null default 0, claimed boolean not null default false, primary key (week, user_id)
);
do $$ declare t text; begin
  foreach t in array array['secret_myths','fisher_myth','secret_castle','secret_boss','secret_boss_dmg'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
insert into public.secret_myths (id,name,descr,src,sort) values
 ('udukroon','Udukuninga kroon','Kalade müügihind +10%.','Väravasaal',1),
 ('hobesarv','Hõbesarv','Kalapüügist +10% rohkem kogemust.','Peeglisaal',2),
 ('varjuvork','Varjuvõrk','Kalad pääsevad õnge otsast poole harvem.','Raamatukogu',3),
 ('kristallsuda','Kristallsüda','Kristallikoopas on iga päev 4 laternat.','Kristallisaal',4),
 ('kuuong','Kuuõng','Haruldased kalad näkkavad sagedamini (nagu +1 kaluriõnn).','Troonisaal: Kuninga Vari',5)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, src=excluded.src, sort=excluded.sort;
insert into public.secret_defs (id,name,descr,hint,reward_gold,reward_item,reward_qty,sort) values
 ('varivoit','Varjude kütt','Andsid Kuninga Varjule viimase löögi.','Troonisaali vari langeb ainult ühe käe läbi.',3000,'koopakristall',3,11),
 ('nork','Nõrk koht','Lõid Kuninga Varju ilmaga, mida ta kardab.','Igal varjul on ilm, mida ta kardab.',1000,null,0,12),
 ('linnaisand','Udulinna isand','Avasid Udulinnas kõik neli saali.','Värav, peegel, raamatud ja kristallid – kõik peavad avanema.',5000,'soomus',1,13)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, hint=excluded.hint, reward_gold=excluded.reward_gold,
  reward_item=excluded.reward_item, reward_qty=excluded.reward_qty, sort=excluded.sort;

-- 2k. Udukuninga saladus, 3. osa: Kalurite kroonika, haruldased loomad, Pärija sõrmus
alter table public.secret_state add column if not exists animal text;
alter table public.secret_state add column if not exists animal_until timestamptz;
alter table public.secret_state add column if not exists gift_day date;
create table if not exists public.secret_chron (
  week date not null, user_id uuid not null references auth.users(id) on delete cascade,
  species text not null, weight numeric not null, at timestamptz not null default now(), primary key (week, user_id)
);
create table if not exists public.secret_animals (
  id text primary key, name text not null, descr text not null, wants jsonb not null, gift jsonb not null,
  gift_txt text not null, where_txt text not null, sort int not null default 0
);
create table if not exists public.fisher_animals (
  user_id uuid not null references auth.users(id) on delete cascade,
  animal text not null references public.secret_animals(id), at timestamptz not null default now(), primary key (user_id, animal)
);
do $$ declare t text; begin
  foreach t in array array['secret_chron','secret_animals','fisher_animals'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
insert into public.secret_myths (id,name,descr,src,sort) values
 ('hobesoomus','Hõbesoomus','Õng murdub raskete kalade all poole harvem.','Kalurite kroonika',6),
 ('parijasormus','Pärija sõrmus','Varjule 1 löök ja Kristallikoopas 1 latern päevas rohkem.','Kõik kuus teist müütilist eset',7)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, src=excluded.src, sort=excluded.sort;
insert into public.secret_animals (id,name,descr,wants,gift,gift_txt,where_txt,sort) values
 ('valgehirv','Valge hirv','Metsa kõige vanem ja uhkem olend. Kuningriik, kus ta elab, on kuulus.','{"merevaik":3}','{"fame":40}','+40 kuulsust päevas','Ilmub harva järve kaldale, kui püüad kala.',1),
 ('kuldrebane','Kuldne rebane','Kaval rebane, kes leiab alati läikivaid asju.','{"sormus":1}','{"gold":300}','+300 kulda kuningriiki päevas','Hiilib vahel kalurite ümber.',2),
 ('lendorav','Lendorav','Lendab puult puule ja märkab kaugeid paiku.','{"parl":2}','{"map":1}','1 aardekaart päevas','Hüppab puudelt alla, kui püüad kala.',3),
 ('kristallkonn','Kristallkonn','Pisike konn, kelle nahk särab nagu kristall.','{"koopakristall":3}','{"item":1}','1 juhuslik ese kalurikotti päevas','Elab ainult Kristallikoopas.',4),
 ('udukull','Udukull','Udulinna torni valvur, kes näeb läbi udu.','{"mustparl":1}','{"food":120}','+120 toitu päevas','Tiirleb Troonisaali kohal, kui võitled Varjuga.',5)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, wants=excluded.wants, gift=excluded.gift,
  gift_txt=excluded.gift_txt, where_txt=excluded.where_txt, sort=excluded.sort;
insert into public.secret_defs (id,name,descr,hint,reward_gold,reward_item,reward_qty,sort) values
 ('kroonik3','Kroonika kirjutaja','Lahendasid Kalurite kroonika kolmel nädalal.','Kroonika uus leht avaneb igal esmaspäeval.',3000,'mustparl',1,14),
 ('loomaisand','Metsa sõber','Kõik viis haruldast looma elavad sinu kuningriigis.','Hirv, rebane, orav, konn ja kull – kas nad kõik on sinu juures?',5000,'soomus',1,15)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, hint=excluded.hint, reward_gold=excluded.reward_gold,
  reward_item=excluded.reward_item, reward_qty=excluded.reward_qty, sort=excluded.sort;

-- 2l. Igapäevane sisselogimise jada (7 päeva ring). Preemia ainult üks kord päevas (Tallinna aeg).
create table if not exists public.daily_streak (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak int not null default 0, best int not null default 0, total int not null default 0, last_day date
);
alter table public.daily_streak enable row level security;
revoke all on public.daily_streak from anon, authenticated;
insert into public.secret_defs (id,name,descr,hint,reward_gold,reward_item,reward_qty,sort) values
 ('jarjekindel','Järjekindel kalur','Tulid mängu 30 päeva järjest.','Kes käib järve ääres iga päev, sellele avaldab järv oma saladused.',4000,'mustparl',1,16)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, hint=excluded.hint, reward_gold=excluded.reward_gold,
  reward_item=excluded.reward_item, reward_qty=excluded.reward_qty, sort=excluded.sort;
insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('parija','Udukuninga pärija','Pane sõrme Udukuninga Pärija sõrmus','Udukuninga pärija',20000,0,94)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;


-- Lemmiksööt ja parim aeg (hommik 5–10, päev 10–17, õhtu 17–21, öö 21–5). Uuel kalal võib need tühjaks jätta.
alter table public.fish_species add column if not exists baits text[] not null default '{}';
alter table public.fish_species add column if not exists times text[] not null default '{}';
update public.fish_species s set baits = v.b::text[], times = v.t::text[] from (values
 ('ahven','{uss,vagel,hobelant}','{hommik,päev}'),
 ('sarg','{vagel,leib,uss}','{hommik}'),
 ('roosarg','{leib,vagel}','{päev}'),
 ('tobias','{krevett,vagel}','{päev}'),
 ('kiisk','{uss}','{õhtu,öö}'),
 ('laternkala','{valgus}','{öö}'),
 ('teib','{vagel,leib}','{päev}'),
 ('latikas','{mais,uss}','{õhtu,öö}'),
 ('raim','{krevett,vagel}','{hommik}'),
 ('lest','{uss,krevett}','{päev}'),
 ('jaaahven','{vagel,uss,hobelant}','{päev}'),
 ('tint','{vagel}','{hommik}'),
 ('kuusarg','{valgus,leib}','{öö}'),
 ('viidikas','{leib,vagel}','{päev}'),
 ('nurg','{uss,vagel}','{hommik}'),
 ('lepamaim','{leib}','{päev}'),
 ('luukarits','{uss}','{päev}'),
 ('ogalik','{vagel}','{päev}'),
 ('trulling','{uss}','{õhtu}'),
 ('hink','{uss}','{öö}'),
 ('voldas','{vagel}','{hommik}'),
 ('kilu','{krevett}','{öö}'),
 ('mustmudil','{uss,krevett}','{päev}'),
 ('liivamudil','{uss}','{hommik}'),
 ('linask','{uss,mais}','{hommik,õhtu}'),
 ('haug','{hobelant,kuldvobler}','{hommik,õhtu}'),
 ('sainas','{mais,uss}','{hommik}'),
 ('koha','{hobelant,uss}','{õhtu,öö}'),
 ('tursk','{krevett,hobelant}','{päev}'),
 ('siig','{vagel}','{hommik}'),
 ('raabis','{vagel}','{päev}'),
 ('kristallahven','{valgus,haldjatolm}','{öö}'),
 ('vimb','{uss,mais}','{hommik}'),
 ('pilvekala','{leib,uss}','{päev}'),
 ('paikesekarp','{mais}','{päev}'),
 ('turb','{uss,vagel}','{hommik}'),
 ('koger','{mais,leib}','{päev}'),
 ('emakala','{krevett}','{öö}'),
 ('hobekoger','{mais}','{päev}'),
 ('merihark','{krevett,uss}','{õhtu}'),
 ('makrell','{hobelant,krevett}','{hommik}'),
 ('nokkhaug','{hobelant}','{päev}'),
 ('merinoel','{krevett}','{päev}'),
 ('madunoel','{krevett}','{õhtu}'),
 ('peled','{vagel}','{hommik}'),
 ('mudamaim','{uss}','{õhtu}'),
 ('vingerjas','{uss}','{öö}'),
 ('ojasilm','{uss}','{öö}'),
 ('angerjas','{uss,krevett}','{öö}'),
 ('luts','{uss,valgus}','{öö}'),
 ('harjus','{vagel}','{hommik}'),
 ('vikerforell','{hobelant,vagel}','{hommik}'),
 ('karpkala','{mais,uss}','{õhtu}'),
 ('meriforell','{hobelant,krevett}','{hommik,õhtu}'),
 ('lohe','{hobelant,kuldvobler}','{hommik}'),
 ('paalia','{vagel,hobelant}','{päev}'),
 ('vihmaforell','{uss}','{päev}'),
 ('toogjas','{hobelant,uss}','{õhtu}'),
 ('uduhobe','{valgus}','{hommik}'),
 ('joeforell','{vagel,hobelant}','{õhtu}'),
 ('joesilm','{valgus}','{öö}'),
 ('hobekarp','{mais}','{päev}'),
 ('kammeljas','{krevett}','{päev}'),
 ('amuur','{mais,leib}','{päev}'),
 ('kirveskala','{valgus}','{öö}'),
 ('kuldahven','{kuldvobler,uss}','{hommik}'),
 ('saga','{uss,valgus,kuldvobler}','{öö}'),
 ('kuningkarp','{mais,leib}','{õhtu}'),
 ('tuur','{krevett,uss}','{öö}'),
 ('virmaliskala','{valgus}','{öö}'),
 ('udukala','{valgus,haldjatolm}','{öö}'),
 ('vikerkaarekala','{haldjatolm,mais}','{päev}'),
 ('tormihaug','{kuldvobler,hobelant}','{õhtu}'),
 ('tuun','{kuldvobler,krevett}','{hommik}'),
 ('merikurat','{valgus}','{öö}'),
 ('kuuangerjas','{valgus,haldjatolm}','{öö}'),
 ('joekuningas','{kuldvobler,haldjatolm}','{hommik}'),
 ('merivaim','{haldjatolm,valgus}','{öö}'),
 ('jaahaug','{kuldvobler}','{päev}'),
 ('haldjakala','{haldjatolm}','{õhtu}'),
 ('valgukala','{valgus,draakonilant}','{õhtu}'),
 ('mookkala','{kuldvobler,draakonilant}','{päev}'),
 ('airukala','{valgus,draakonilant}','{öö}'),
 ('kuldkala','{haldjatolm,leib}','{hommik}'),
 ('igijaavaim','{haldjatolm,draakonilant}','{öö}'),
 ('leviaatan','{draakonilant}','{öö}'),
 ('jarvelohe','{draakonilant,haldjatolm}','{õhtu}'),
 ('sugavusedraakon','{draakonilant,valgus}','{öö}')
) as v(id, b, t) where s.id = v.id and (s.baits = '{}' or s.times = '{}');


-- Päris suurused (kaal kg ja pikkus cm suurima kaalu juures). Pikkus arvutatakse kaalust: L = max_len · (kaal / max_w)^(1/3).
-- Nagu teised algandmed, kehtestatakse need igal käivitusel uuesti (kalade sisestused ülal kasutavad mängu vanu kaale).
alter table public.fish_species add column if not exists max_len numeric;
alter table public.fish_species add column if not exists real boolean not null default true;
update public.fish_species s set min_w = v.mn, max_w = v.mx, max_len = v.ln, real = true from (values
 ('ahven',.05,1.5,43),
 ('sarg',.05,.8,36),
 ('roosarg',.05,.7,34),
 ('kiisk',.015,.12,20),
 ('tobias',.003,.02,20),
 ('laternkala',.002,.02,12),
 ('teib',.05,.4,30),
 ('latikas',.3,4,60),
 ('raim',.02,.12,27),
 ('lest',.1,1.2,42),
 ('tint',.01,.08,25),
 ('viidikas',.005,.04,17),
 ('nurg',.05,.5,30),
 ('lepamaim',.002,.015,11),
 ('luukarits',.001,.005,8),
 ('ogalik',.001,.004,7),
 ('trulling',.01,.06,17),
 ('hink',.003,.015,12),
 ('voldas',.005,.04,13),
 ('kilu',.005,.02,15),
 ('mustmudil',.01,.08,16),
 ('liivamudil',.001,.007,8),
 ('linask',.3,3,52),
 ('haug',.8,14,115),
 ('sainas',.3,3,60),
 ('koha',.8,9,90),
 ('tursk',.5,10,95),
 ('siig',.3,3,58),
 ('raabis',.03,.25,28),
 ('vimb',.2,1,42),
 ('turb',.3,3,58),
 ('koger',.1,1.2,38),
 ('emakala',.05,.4,45),
 ('merihark',.05,.4,32),
 ('hobekoger',.1,1.5,40),
 ('makrell',.2,1.5,48),
 ('nokkhaug',.2,1,85),
 ('merinoel',.002,.01,30),
 ('madunoel',.001,.005,28),
 ('peled',.3,2.5,55),
 ('mudamaim',.003,.015,11),
 ('vingerjas',.02,.1,28),
 ('ojasilm',.003,.01,18),
 ('angerjas',.2,3.5,110),
 ('luts',.4,6,85),
 ('harjus',.2,1.5,50),
 ('vikerforell',.4,5,72),
 ('karpkala',1,18,90),
 ('meriforell',1,10,90),
 ('lohe',2,18,110),
 ('paalia',.3,3,60),
 ('toogjas',.8,7,85),
 ('joeforell',.2,3,58),
 ('joesilm',.04,.15,45),
 ('hobekarp',2,20,100),
 ('kammeljas',1,10,75),
 ('amuur',3,22,115),
 ('kirveskala',.002,.01,9),
 ('saga',5,70,210),
 ('tuur',10,120,250),
 ('tuun',30,350,260),
 ('merikurat',3,35,135),
 ('mookkala',30,300,350),
 ('airukala',20,200,700)
) as v(id, mn, mx, ln) where s.id = v.id;
update public.fish_species s set max_len = v.ln, real = false from (values
 ('kuusarg',42),
 ('jaaahven',40),
 ('kristallahven',45),
 ('pilvekala',48),
 ('paikesekarp',65),
 ('vihmaforell',62),
 ('uduhobe',55),
 ('kuldahven',48),
 ('kuningkarp',100),
 ('virmaliskala',75),
 ('udukala',60),
 ('vikerkaarekala',62),
 ('tormihaug',130),
 ('kuuangerjas',140),
 ('joekuningas',170),
 ('merivaim',120),
 ('jaahaug',150),
 ('haldjakala',45),
 ('valgukala',80),
 ('kuldkala',28),
 ('igijaavaim',200),
 ('leviaatan',800),
 ('jarvelohe',600),
 ('sugavusedraakon',900)
) as v(id, ln) where s.id = v.id;

-- Kala eluiga aastates (päris kaladel ligikaudne päris eluiga). Vanus arvutatakse pikkusest kasvuvalemiga.
-- Vanuseklass kaalu järgi: noor < 30%, täiskasvanud < 75%, vana kuni max_w, legendaarne üle max_w (hiiglane).
alter table public.fish_species add column if not exists max_age int;
update public.fish_species s set max_age = v.a from (values ('ahven',22),('sarg',14),('roosarg',17),('kiisk',10),('tobias',7),('laternkala',4),('teib',16),('latikas',25),('raim',12),('lest',15),('tint',10),('viidikas',6),('nurg',15),('lepamaim',10),('luukarits',4),('ogalik',4),('trulling',8),('hink',5),('voldas',10),('kilu',6),('mustmudil',5),('liivamudil',2),('linask',20),('haug',30),('sainas',20),('koha',20),('tursk',25),('siig',20),('raabis',10),('vimb',15),('turb',20),('koger',10),('emakala',8),('merihark',15),('hobekoger',10),('makrell',17),('nokkhaug',18),('merinoel',5),('madunoel',5),('peled',15),('mudamaim',5),('vingerjas',10),('ojasilm',6),('angerjas',50),('luts',20),('harjus',14),('vikerforell',11),('karpkala',40),('meriforell',20),('lohe',13),('paalia',15),('toogjas',15),('joeforell',18),('joesilm',7),('hobekarp',20),('kammeljas',25),('amuur',20),('kirveskala',3),('saga',80),('tuur',100),('tuun',40),('merikurat',24),('mookkala',25),('airukala',20),('kuusarg',20),('jaaahven',25),('kristallahven',30),('pilvekala',20),('paikesekarp',30),('vihmaforell',15),('uduhobe',25),('kuldahven',40),('kuningkarp',60),('virmaliskala',50),('udukala',40),('vikerkaarekala',30),('tormihaug',50),('kuuangerjas',100),('joekuningas',150),('merivaim',200),('jaahaug',80),('haldjakala',300),('valgukala',60),('kuldkala',1000),('igijaavaim',1000),('leviaatan',3000),('jarvelohe',500),('sugavusedraakon',5000)) as v(id, a) where s.id = v.id;

-- Lantide parandused: ahven ja säga võtavad lanti, karpkala mitte (lisab/eemaldab, ei kirjuta muud üle)
update public.fish_species set baits = array_remove(baits, 'kuldvobler') where id = 'kuningkarp' and 'kuldvobler' = any(baits);
update public.fish_species s set baits = array_append(s.baits, v.b) from (values ('ahven','hobelant'),('jaaahven','hobelant'),('saga','kuldvobler'),('kuningkarp','leib')) as v(id, b)
  where s.id = v.id and not (v.b = any(s.baits));

-- Igal kalal vähemalt üks lemmiksööt, mis on olemas juba siis, kui kala avaneb (lisab, ei kirjuta üle)
update public.fish_species s set baits = array_append(s.baits, v.b) from (values
 ('haug','uss'),('joesilm','uss'),('kuuangerjas','uss'),('ogalik','uss'),('voldas','uss'),
 ('hobekoger','leib'),('paikesekarp','leib'),('uduhobe','vagel'),
 ('valgukala','krevett'),('merivaim','krevett'),('leviaatan','valgus'),('igijaavaim','valgus')
) as v(id, b) where s.id = v.id and not (v.b = any(s.baits));


-- ---------------------------------------------------------------------
-- 2m. Geneetikalabor: hübriidkalad, mutatsioonid, laboritasemed, hübriidiraamat, turg
--     Kõik arvutused ja auhinnad on serveris. Administraator saab muuta tabelit lab_config
--     (näiteks rarity_weights = [60,25,10,4,1]); seemne väärtused ei kirjuta muudetud väärtusi üle.
-- ---------------------------------------------------------------------
alter table public.fish_species add column if not exists element text;
alter table public.fish_species add column if not exists arch text;
alter table public.fish_species add column if not exists body text;
update public.fish_species s set arch = v.a, body = v.b from (values ('ahven','perch','ahven'),('airukala','serpent','angerjas'),('amuur','cypr','karp'),('angerjas','eel','angerjas'),('emakala','eel','angerjas'),('haldjakala','angel','karp'),('harjus','grayling','haug'),('haug','pike','haug'),('hink','burbot','angerjas'),('hobekarp','carp','karp'),('hobekoger','bream','karp'),('igijaavaim','salmon','haug'),('jaaahven','perch','ahven'),('jaahaug','pike','haug'),('jarvelohe','serpent','angerjas'),('joeforell','salmon','haug'),('joekuningas','pike','haug'),('joesilm','eel','angerjas'),('kammeljas','flat','karp'),('karpkala','carp','karp'),('kiisk','perch','ahven'),('kilu','herring','karp'),('kirveskala','bream','karp'),('koger','bream','karp'),('koha','zander','ahven'),('kristallahven','perch','ahven'),('kuldahven','perch','ahven'),('kuldkala','gold','karp'),('kuningkarp','carp','karp'),('kuuangerjas','eel','angerjas'),('kuusarg','cypr','karp'),('laternkala','herring','karp'),('latikas','bream','karp'),('lepamaim','cypr','karp'),('lest','flat','karp'),('leviaatan','monster','ahven'),('liivamudil','cod','haug'),('linask','tench','karp'),('lohe','salmon','haug'),('luts','burbot','angerjas'),('luukarits','perch','ahven'),('madunoel','eel','angerjas'),('makrell','tuna','ahven'),('meriforell','salmon','haug'),('merihark','perch','ahven'),('merikurat','angler','ahven'),('merinoel','eel','angerjas'),('merivaim','salmon','haug'),('mookkala','sword','ahven'),('mudamaim','cypr','karp'),('mustmudil','cod','haug'),('nokkhaug','sword','ahven'),('nurg','bream','karp'),('ogalik','perch','ahven'),('ojasilm','eel','angerjas'),('paalia','salmon','haug'),('paikesekarp','bream','karp'),('peled','salmon','haug'),('pilvekala','cypr','karp'),('raabis','salmon','haug'),('raim','herring','karp'),('roosarg','cypr','karp'),('saga','catfish','karp'),('sainas','cypr','karp'),('sarg','cypr','karp'),('siig','salmon','haug'),('sugavusedraakon','serpent','angerjas'),('teib','cypr','karp'),('tint','herring','karp'),('tobias','herring','karp'),('toogjas','cypr','karp'),('tormihaug','pike','haug'),('trulling','burbot','angerjas'),('turb','cypr','karp'),('tursk','cod','haug'),('tuun','tuna','ahven'),('tuur','sturgeon','haug'),('uduhobe','cypr','karp'),('udukala','cypr','karp'),('valgukala','eel','angerjas'),('vihmaforell','salmon','haug'),('viidikas','herring','karp'),('vikerforell','salmon','haug'),('vikerkaarekala','salmon','haug'),('vimb','cypr','karp'),('vingerjas','burbot','angerjas'),('virmaliskala','salmon','haug'),('voldas','cod','haug')) as v(id, a, b) where s.id = v.id;
update public.fish_species s set element = coalesce((select v.e from (values ('kuusarg','valgus'),('jaaahven','jää'),('kristallahven','jää'),('pilvekala','välk'),('paikesekarp','tuli'),('uduhobe','vari'),('vihmaforell','vesi'),('vikerkaarekala','valgus'),('kuldahven','tuli'),('kuningkarp','loodus'),('virmaliskala','valgus'),('udukala','vari'),('tormihaug','välk'),('jaahaug','jää'),('valgukala','välk'),('merivaim','vesi'),('kuuangerjas','vari'),('joekuningas','loodus'),('haldjakala','loodus'),('kuldkala','valgus'),('igijaavaim','jää'),('leviaatan','vesi'),('jarvelohe','tuli'),('sugavusedraakon','vari')) as v(id, e) where v.id = s.id),
  case when s.spots = '{jaa}' then 'jää' when s.night_only then 'vari' when s.baits && '{mais,leib}' then 'loodus' else 'vesi' end)
  where s.element is null;
update public.fish_species set body = 'karp', arch = 'cypr' where body is null;

create table if not exists public.lab_config (key text primary key, value jsonb not null, descr text);
insert into public.lab_config (key, value, descr) values
 ('rarity_weights', '[60,25,10,4,1]', 'Mutatsiooni harulduse tõenäosused protsentides: tavaline, ebatavaline, haruldane, eepiline, müütiline'),
 ('level_bonus', '0.08', 'Iga laboritase tõstab kõrgemate haruldusastmete kaalu selle võrra (astme kohta)'),
 ('mutation_chance', '0.05', 'Tõenäosus, et üks element muteerub juhuslikuks elemendiks (+0,01 iga laboritaseme kohta)'),
 ('daily_fusions', '[6,8,10,12,15]', 'Ühendamisi päevas laboritasemete 1–5 kaupa'),
 ('fee', '[150,200,250,300,400]', 'Ühendamise hind kullas laboritasemete 1–5 kaupa'),
 ('aura_cap', '0.15', 'Labori akvaariumi võimete ülempiir ühe võime kohta (0,15 = 15%)')
on conflict (key) do nothing;

create table if not exists public.lab_species (
  id text primary key, name text not null, e1 text not null, e2 text not null, body text not null,
  legend boolean not null default false, recipe text[], descr text not null, sort int not null default 0,
  first_by uuid references auth.users(id) on delete set null, first_at timestamptz
);
insert into public.lab_species (id, name, e1, e2, body, legend, recipe, descr, sort) values
 ('h_00_ahven','Leegiahven','tuli','tuli','ahven',false,null,'Puhtalt tuline hübriid. Kiire ja julge kiskja terava seljauimega.',1), ('h_00_karp','Leegikarp','tuli','tuli','karp',false,null,'Puhtalt tuline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',2), ('h_00_haug','Leegihaug','tuli','tuli','haug',false,null,'Puhtalt tuline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',3), ('h_00_angerjas','Leegiangerjas','tuli','tuli','angerjas',false,null,'Puhtalt tuline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',4),
('h_11_ahven','Pakaseahven','jää','jää','ahven',false,null,'Puhtalt jäine hübriid. Kiire ja julge kiskja terava seljauimega.',5), ('h_11_karp','Pakasekarp','jää','jää','karp',false,null,'Puhtalt jäine hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',6), ('h_11_haug','Pakasehaug','jää','jää','haug',false,null,'Puhtalt jäine hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',7), ('h_11_angerjas','Pakaseangerjas','jää','jää','angerjas',false,null,'Puhtalt jäine hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',8),
('h_22_ahven','Laineahven','vesi','vesi','ahven',false,null,'Puhtalt voogav hübriid. Kiire ja julge kiskja terava seljauimega.',9), ('h_22_karp','Lainekarp','vesi','vesi','karp',false,null,'Puhtalt voogav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',10), ('h_22_haug','Lainehaug','vesi','vesi','haug',false,null,'Puhtalt voogav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',11), ('h_22_angerjas','Laineangerjas','vesi','vesi','angerjas',false,null,'Puhtalt voogav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',12),
('h_33_ahven','Sädemeahven','välk','välk','ahven',false,null,'Puhtalt elektriline hübriid. Kiire ja julge kiskja terava seljauimega.',13), ('h_33_karp','Sädemekarp','välk','välk','karp',false,null,'Puhtalt elektriline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',14), ('h_33_haug','Sädemehaug','välk','välk','haug',false,null,'Puhtalt elektriline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',15), ('h_33_angerjas','Sädemeangerjas','välk','välk','angerjas',false,null,'Puhtalt elektriline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',16),
('h_44_ahven','Varjuahven','vari','vari','ahven',false,null,'Puhtalt varjuline hübriid. Kiire ja julge kiskja terava seljauimega.',17), ('h_44_karp','Varjukarp','vari','vari','karp',false,null,'Puhtalt varjuline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',18), ('h_44_haug','Varjuhaug','vari','vari','haug',false,null,'Puhtalt varjuline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',19), ('h_44_angerjas','Varjuangerjas','vari','vari','angerjas',false,null,'Puhtalt varjuline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',20),
('h_55_ahven','Helgiahven','valgus','valgus','ahven',false,null,'Puhtalt helendav hübriid. Kiire ja julge kiskja terava seljauimega.',21), ('h_55_karp','Helgikarp','valgus','valgus','karp',false,null,'Puhtalt helendav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',22), ('h_55_haug','Helgihaug','valgus','valgus','haug',false,null,'Puhtalt helendav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',23), ('h_55_angerjas','Helgiangerjas','valgus','valgus','angerjas',false,null,'Puhtalt helendav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',24),
('h_66_ahven','Samblaahven','loodus','loodus','ahven',false,null,'Puhtalt roheline hübriid. Kiire ja julge kiskja terava seljauimega.',25), ('h_66_karp','Samblakarp','loodus','loodus','karp',false,null,'Puhtalt roheline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',26), ('h_66_haug','Samblahaug','loodus','loodus','haug',false,null,'Puhtalt roheline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',27), ('h_66_angerjas','Samblaangerjas','loodus','loodus','angerjas',false,null,'Puhtalt roheline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',28),
('h_01_ahven','Jääleegiahven','tuli','jää','ahven',false,null,'Tuline ja jäine hübriid. Kiire ja julge kiskja terava seljauimega.',29), ('h_01_karp','Jääleegikarp','tuli','jää','karp',false,null,'Tuline ja jäine hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',30), ('h_01_haug','Jääleegihaug','tuli','jää','haug',false,null,'Tuline ja jäine hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',31), ('h_01_angerjas','Jääleegiangerjas','tuli','jää','angerjas',false,null,'Tuline ja jäine hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',32),
('h_02_ahven','Auruahven','tuli','vesi','ahven',false,null,'Tuline ja voogav hübriid. Kiire ja julge kiskja terava seljauimega.',33), ('h_02_karp','Aurukarp','tuli','vesi','karp',false,null,'Tuline ja voogav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',34), ('h_02_haug','Auruhaug','tuli','vesi','haug',false,null,'Tuline ja voogav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',35), ('h_02_angerjas','Auruangerjas','tuli','vesi','angerjas',false,null,'Tuline ja voogav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',36),
('h_03_ahven','Plasmaahven','tuli','välk','ahven',false,null,'Tuline ja elektriline hübriid. Kiire ja julge kiskja terava seljauimega.',37), ('h_03_karp','Plasmakarp','tuli','välk','karp',false,null,'Tuline ja elektriline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',38), ('h_03_haug','Plasmahaug','tuli','välk','haug',false,null,'Tuline ja elektriline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',39), ('h_03_angerjas','Plasmaangerjas','tuli','välk','angerjas',false,null,'Tuline ja elektriline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',40),
('h_04_ahven','Hõõgsöeahven','tuli','vari','ahven',false,null,'Tuline ja varjuline hübriid. Kiire ja julge kiskja terava seljauimega.',41), ('h_04_karp','Hõõgsöekarp','tuli','vari','karp',false,null,'Tuline ja varjuline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',42), ('h_04_haug','Hõõgsöehaug','tuli','vari','haug',false,null,'Tuline ja varjuline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',43), ('h_04_angerjas','Hõõgsöeangerjas','tuli','vari','angerjas',false,null,'Tuline ja varjuline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',44),
('h_05_ahven','Fööniksiahven','tuli','valgus','ahven',false,null,'Tuline ja helendav hübriid. Kiire ja julge kiskja terava seljauimega.',45), ('h_05_karp','Fööniksikarp','tuli','valgus','karp',false,null,'Tuline ja helendav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',46), ('h_05_haug','Fööniksihaug','tuli','valgus','haug',false,null,'Tuline ja helendav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',47), ('h_05_angerjas','Fööniksiangerjas','tuli','valgus','angerjas',false,null,'Tuline ja helendav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',48),
('h_06_ahven','Vulkaaniahven','tuli','loodus','ahven',false,null,'Tuline ja roheline hübriid. Kiire ja julge kiskja terava seljauimega.',49), ('h_06_karp','Vulkaanikarp','tuli','loodus','karp',false,null,'Tuline ja roheline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',50), ('h_06_haug','Vulkaanihaug','tuli','loodus','haug',false,null,'Tuline ja roheline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',51), ('h_06_angerjas','Vulkaaniangerjas','tuli','loodus','angerjas',false,null,'Tuline ja roheline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',52),
('h_12_ahven','Liustikuahven','jää','vesi','ahven',false,null,'Jäine ja voogav hübriid. Kiire ja julge kiskja terava seljauimega.',53), ('h_12_karp','Liustikukarp','jää','vesi','karp',false,null,'Jäine ja voogav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',54), ('h_12_haug','Liustikuhaug','jää','vesi','haug',false,null,'Jäine ja voogav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',55), ('h_12_angerjas','Liustikuangerjas','jää','vesi','angerjas',false,null,'Jäine ja voogav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',56),
('h_13_ahven','Polaartormiahven','jää','välk','ahven',false,null,'Jäine ja elektriline hübriid. Kiire ja julge kiskja terava seljauimega.',57), ('h_13_karp','Polaartormikarp','jää','välk','karp',false,null,'Jäine ja elektriline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',58), ('h_13_haug','Polaartormihaug','jää','välk','haug',false,null,'Jäine ja elektriline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',59), ('h_13_angerjas','Polaartormiangerjas','jää','välk','angerjas',false,null,'Jäine ja elektriline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',60),
('h_14_ahven','Talveööahven','jää','vari','ahven',false,null,'Jäine ja varjuline hübriid. Kiire ja julge kiskja terava seljauimega.',61), ('h_14_karp','Talveöökarp','jää','vari','karp',false,null,'Jäine ja varjuline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',62), ('h_14_haug','Talveööhaug','jää','vari','haug',false,null,'Jäine ja varjuline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',63), ('h_14_angerjas','Talveööangerjas','jää','vari','angerjas',false,null,'Jäine ja varjuline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',64),
('h_15_ahven','Teemandiahven','jää','valgus','ahven',false,null,'Jäine ja helendav hübriid. Kiire ja julge kiskja terava seljauimega.',65), ('h_15_karp','Teemandikarp','jää','valgus','karp',false,null,'Jäine ja helendav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',66), ('h_15_haug','Teemandihaug','jää','valgus','haug',false,null,'Jäine ja helendav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',67), ('h_15_angerjas','Teemandiangerjas','jää','valgus','angerjas',false,null,'Jäine ja helendav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',68),
('h_16_ahven','Härmaahven','jää','loodus','ahven',false,null,'Jäine ja roheline hübriid. Kiire ja julge kiskja terava seljauimega.',69), ('h_16_karp','Härmakarp','jää','loodus','karp',false,null,'Jäine ja roheline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',70), ('h_16_haug','Härmahaug','jää','loodus','haug',false,null,'Jäine ja roheline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',71), ('h_16_angerjas','Härmaangerjas','jää','loodus','angerjas',false,null,'Jäine ja roheline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',72),
('h_23_ahven','Elektriahven','vesi','välk','ahven',false,null,'Voogav ja elektriline hübriid. Kiire ja julge kiskja terava seljauimega.',73), ('h_23_karp','Elektrikarp','vesi','välk','karp',false,null,'Voogav ja elektriline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',74), ('h_23_haug','Elektrihaug','vesi','välk','haug',false,null,'Voogav ja elektriline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',75), ('h_23_angerjas','Elektriangerjas','vesi','välk','angerjas',false,null,'Voogav ja elektriline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',76),
('h_24_ahven','Süvaahven','vesi','vari','ahven',false,null,'Voogav ja varjuline hübriid. Kiire ja julge kiskja terava seljauimega.',77), ('h_24_karp','Süvakarp','vesi','vari','karp',false,null,'Voogav ja varjuline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',78), ('h_24_haug','Süvahaug','vesi','vari','haug',false,null,'Voogav ja varjuline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',79), ('h_24_angerjas','Süvaangerjas','vesi','vari','angerjas',false,null,'Voogav ja varjuline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',80),
('h_25_ahven','Pärliahven','vesi','valgus','ahven',false,null,'Voogav ja helendav hübriid. Kiire ja julge kiskja terava seljauimega.',81), ('h_25_karp','Pärlikarp','vesi','valgus','karp',false,null,'Voogav ja helendav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',82), ('h_25_haug','Pärlihaug','vesi','valgus','haug',false,null,'Voogav ja helendav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',83), ('h_25_angerjas','Pärliangerjas','vesi','valgus','angerjas',false,null,'Voogav ja helendav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',84),
('h_26_ahven','Vesiroosiahven','vesi','loodus','ahven',false,null,'Voogav ja roheline hübriid. Kiire ja julge kiskja terava seljauimega.',85), ('h_26_karp','Vesiroosikarp','vesi','loodus','karp',false,null,'Voogav ja roheline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',86), ('h_26_haug','Vesiroosihaug','vesi','loodus','haug',false,null,'Voogav ja roheline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',87), ('h_26_angerjas','Vesiroosiangerjas','vesi','loodus','angerjas',false,null,'Voogav ja roheline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',88),
('h_34_ahven','Äikeseahven','välk','vari','ahven',false,null,'Elektriline ja varjuline hübriid. Kiire ja julge kiskja terava seljauimega.',89), ('h_34_karp','Äikesekarp','välk','vari','karp',false,null,'Elektriline ja varjuline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',90), ('h_34_haug','Äikesehaug','välk','vari','haug',false,null,'Elektriline ja varjuline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',91), ('h_34_angerjas','Äikeseangerjas','välk','vari','angerjas',false,null,'Elektriline ja varjuline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',92),
('h_35_ahven','Taevatuleahven','välk','valgus','ahven',false,null,'Elektriline ja helendav hübriid. Kiire ja julge kiskja terava seljauimega.',93), ('h_35_karp','Taevatulekarp','välk','valgus','karp',false,null,'Elektriline ja helendav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',94), ('h_35_haug','Taevatulehaug','välk','valgus','haug',false,null,'Elektriline ja helendav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',95), ('h_35_angerjas','Taevatuleangerjas','välk','valgus','angerjas',false,null,'Elektriline ja helendav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',96),
('h_36_ahven','Pikseahven','välk','loodus','ahven',false,null,'Elektriline ja roheline hübriid. Kiire ja julge kiskja terava seljauimega.',97), ('h_36_karp','Piksekarp','välk','loodus','karp',false,null,'Elektriline ja roheline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',98), ('h_36_haug','Piksehaug','välk','loodus','haug',false,null,'Elektriline ja roheline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',99), ('h_36_angerjas','Pikseangerjas','välk','loodus','angerjas',false,null,'Elektriline ja roheline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',100),
('h_45_ahven','Videvikuahven','vari','valgus','ahven',false,null,'Varjuline ja helendav hübriid. Kiire ja julge kiskja terava seljauimega.',101), ('h_45_karp','Videvikukarp','vari','valgus','karp',false,null,'Varjuline ja helendav hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',102), ('h_45_haug','Videvikuhaug','vari','valgus','haug',false,null,'Varjuline ja helendav hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',103), ('h_45_angerjas','Videvikuangerjas','vari','valgus','angerjas',false,null,'Varjuline ja helendav hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',104),
('h_46_ahven','Nõiaahven','vari','loodus','ahven',false,null,'Varjuline ja roheline hübriid. Kiire ja julge kiskja terava seljauimega.',105), ('h_46_karp','Nõiakarp','vari','loodus','karp',false,null,'Varjuline ja roheline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',106), ('h_46_haug','Nõiahaug','vari','loodus','haug',false,null,'Varjuline ja roheline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',107), ('h_46_angerjas','Nõiaangerjas','vari','loodus','angerjas',false,null,'Varjuline ja roheline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',108),
('h_56_ahven','Haldjaahven','valgus','loodus','ahven',false,null,'Helendav ja roheline hübriid. Kiire ja julge kiskja terava seljauimega.',109), ('h_56_karp','Haldjakarp','valgus','loodus','karp',false,null,'Helendav ja roheline hübriid. Massiivne ja rahulik, kuid tohutu jõuga.',110), ('h_56_haug','Haldjahaug','valgus','loodus','haug',false,null,'Helendav ja roheline hübriid. Pikk ja võimas kiskja, kes ründab välgukiirusel.',111), ('h_56_angerjas','Haldjaangerjas','valgus','loodus','angerjas',false,null,'Helendav ja roheline hübriid. Pikk ja painduv, libiseb läbi vee nagu niit.',112),
('l_draakoniahven','Draakoniahven','tuli','tuli','ahven',true,'{kuldahven,jarvelohe}','Ahvena keha ja draakoni veri: väikesed draakonisoomused, kuldne hari seljal ja leegitsevad uimed.',200), ('l_kuldsuvahaug','Kuldne süvahaug','valgus','vari','haug',true,'{kuldahven,tormihaug}','Pikk ja võimas haugi keha kuldse helgiga soomustega. Hõõguvad oranžid silmad, läbipaistvad kuldsed uimed.',201), ('l_jaaleegimonarh','Jääleegi monarh','tuli','jää','karp',true,'{paikesekarp,igijaavaim}','Massiivne karbi keha: üks külg jääkristallides, teine tulise helgiga. Uimedest pudenevad jää- ja tuleosakesed.',202), ('l_tormilohe','Tormilohe','välk','vari','angerjas',true,'{sugavusedraakon,valgukala}','Musta ja elektrisinise mustriga sügavuste lohe, keha ümber tantsivad elektrikaared.',203),
('l_kuukuningas','Kuukuningas','vari','loodus','karp',true,'{kuningkarp,kuuangerjas}','Kuninglik karp, kelle soomustel peegeldub kuuvalgus. Ta ujub ainult täiskuu ajal.',204), ('l_soovihaldjas','Soovide haldjas','valgus','loodus','karp',true,'{kuldkala,haldjakala}','Kuldkala ja haldja laps. Öeldakse, et ta täidab soove – aga ainult neile, kes teda vabaks ei lase.',205), ('l_sugavusteisand','Sügavuste isand','vesi','vari','angerjas',true,'{leviaatan,sugavusedraakon}','Ookeanipõhja vanim valitseja. Tema silmad helendavad nagu kaks uppunud päikest.',206), ('l_taevalaotus','Taevalaotus','valgus','välk','haug',true,'{virmaliskala,vikerkaarekala}','Virmaliste ja vikerkaare laps, kelle keha voogab kõigis taevavärvides.',207)
on conflict (id) do update set name = excluded.name, e1 = excluded.e1, e2 = excluded.e2, body = excluded.body,
  legend = excluded.legend, recipe = excluded.recipe, descr = excluded.descr, sort = excluded.sort;

create table if not exists public.lab_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level int not null default 1, day date, fusions int not null default 0, req_day date
);
create table if not exists public.lab_fish (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  species text not null references public.lab_species(id), rarity int not null check (rarity between 1 and 5),
  weight numeric not null, length_cm numeric not null, genes jsonb not null, parents jsonb not null,
  value int not null, status text not null default 'kept', first_find boolean not null default false,
  bred_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists lab_fish_user on public.lab_fish(user_id, status);
create table if not exists public.lab_dex (
  user_id uuid not null references auth.users(id) on delete cascade, species text not null references public.lab_species(id),
  first_at timestamptz not null default now(), n int not null default 1, best int not null default 1,
  parents text[], primary key (user_id, species)
);
create table if not exists public.lab_market (
  id bigserial primary key, fish_id bigint not null references public.lab_fish(id) on delete cascade,
  seller uuid not null references auth.users(id) on delete cascade, price int not null check (price between 1 and 10000000),
  status text not null default 'open', buyer uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), closed_at timestamptz
);
create unique index if not exists lab_market_open on public.lab_market(fish_id) where status = 'open';
do $$ declare t text; begin
  foreach t in array array['lab_config','lab_species','lab_state','lab_fish','lab_dex','lab_market'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('lab1','Esimene mutatsioon','Loo geneetikalaboris esimene hübriidkala',null,300,0,100),
 ('lab10','Aretaja','Avasta 10 hübriidiliiki','Aretaja',3000,0,101),
 ('lab50','Suur geneetik','Avasta 50 hübriidiliiki','Geneetik',15000,0,102),
 ('labesma','Esmaavastaja','Avasta hübriidiliik esimesena kogu kuningriigis','Esmaavastaja',2000,0,103),
 ('labmyyt','Müütide looja','Loo müütiline hübriid','Müütide looja',8000,0,104),
 ('lablegend','Legendi sünd','Ava salajane legendaarne retsept','Legendide aretaja',10000,0,105)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;
create or replace function public.fx_lab_cfg(k text) returns jsonb language sql stable as
$$ select value from public.lab_config where key = k $$;
-- labori akvaariumi võime (tarkus / kuld / onn / kaitse) kokku, ülempiiriga
create or replace function public.fx_lab_aura(u uuid, typ text) returns numeric language sql stable as
$$ select least(coalesce((select (value #>> '{}')::numeric from public.lab_config where key = 'aura_cap'), 0.15),
     coalesce((select sum((genes ->> 'power')::numeric) from public.lab_fish where user_id = u and status = 'tank' and genes ->> 'ability' = typ), 0) / 100.0) $$;

-- ---------------------------------------------------------------------
-- 2n. Kalade uurimiskeskus: DNA proovid, geenid, salajaste retseptide tükid, uurimispuu
--     Kala antakse uurimiseks (kaob), analüüs võtab aega, tulemuse (DNA, uurimispunktid, retseptitükk) veeretab server.
-- ---------------------------------------------------------------------
create table if not exists public.lab_research (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rp int not null default 0 check (rp >= 0), rp_total int not null default 0,
  dna jsonb not null default '{}', skills jsonb not null default '{}', genes text[] not null default '{}',
  frags jsonb not null default '{}', scans_done int not null default 0
);
create table if not exists public.lab_scan (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, src_id bigint not null, species text not null, name text not null, rarity int not null, elements text[] not null,
  started_at timestamptz not null default now(), ready_at timestamptz not null, claimed boolean not null default false, result jsonb
);
create index if not exists lab_scan_user on public.lab_scan(user_id, claimed);
create table if not exists public.lab_genes (
  id text primary key, name text not null, ic text not null, el text, descr text not null,
  eff text not null, val numeric not null, dna int not null, rp int not null, sort int not null default 0
);
insert into public.lab_genes (id, name, ic, el, descr, eff, val, dna, rp, sort) values
 ('leegisuda','Leegisüda','❤️‍🔥','tuli','Tulise hübriidi süda lööb kiiremini: kala kasvab 25% raskemaks.','size',0.25,25,60,1),
 ('jaakristall','Jääkristall','💎','jää','Jääkristallid soomustes tugevdavad hübriidi võimet +3%.','power',3,25,60,2),
 ('suvanagemine','Süvanägemine','👁️','vesi','Süvaveest pärit geen: haruldasemad hübriidid tulevad sagedamini.','rare',0.2,25,60,3),
 ('tormisoomus','Tormisoomus','🌩️','välk','Välgust laetud soomused: hübriidi väärtus +20%.','value',0.2,25,60,4),
 ('kuuhobe','Kuuhõbe','🌙','vari','Kuuvalguses hõbetuv nahk: hübriidi väärtus +30%.','value',0.3,25,60,5),
 ('paikesekiir','Päikesekiir','☀️','valgus','Päikese geen: haruldasemad hübriidid tulevad palju sagedamini.','rare',0.3,25,60,6),
 ('eluvorse','Eluvõrse','🌱','loodus','Looduse elujõud: hübriidi võime +2% ja kala kasvab 10% suuremaks.','power',2,25,60,7),
 ('kuldgenoom','Kuldne genoom','👑',null,'Kõigi geenide ema: sobib igale hübriidile, väärtus +50% ja haruldused tulevad sagedamini.','gold',0.5,40,300,8)
on conflict (id) do update set name = excluded.name, ic = excluded.ic, el = excluded.el, descr = excluded.descr, eff = excluded.eff, val = excluded.val,
  dna = excluded.dna, rp = excluded.rp, sort = excluded.sort;
alter table public.lab_species add column if not exists hints text[];
update public.lab_species s set hints = v.h from (values
 ('l_draakoniahven', array['Üks vanem on kuldne ja tuline ahven, kes armastab päikest.','Teine vanem on järvede tuld purskav valitseja.']),
 ('l_kuldsuvahaug', array['Üks vanem on kuldse soomusega ahven.','Teine vanem on haug, kes ilmub ainult äikese ajal.']),
 ('l_jaaleegimonarh', array['Üks vanem on karp, kelle soomused hõõguvad nagu päike.','Teine vanem on igijää iidne vaim.']),
 ('l_tormilohe', array['Üks vanem on süvamere draakon.','Teine vanem on kala, kes kannab endas välgu sädet.']),
 ('l_kuukuningas', array['Üks vanem kannab krooni ja on karpide kuningas.','Teine vanem on angerjas, kes ujub kuuvalgel.']),
 ('l_soovihaldjas', array['Üks vanem täidab muinasjuttudes soove.','Teine vanem on metsajärve haldjate kala.']),
 ('l_sugavusteisand', array['Üks vanem on mere kõige suurem koletis.','Teine vanem on süvamere draakon.']),
 ('l_taevalaotus', array['Üks vanem hõõgub nagu virmalised talveööl.','Teine vanem kannab kõiki vikerkaare värve.'])) as v(id, h) where v.id = s.id;
do $$ declare t text; begin
  foreach t in array array['lab_research','lab_scan','lab_genes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('dna1','Esimene DNA','Lõpeta uurimiskeskuses esimene DNA analüüs',null,300,0,106),
 ('dna50','DNA uurija','Lõpeta 50 DNA analüüsi','Geeniuurija',5000,0,107),
 ('retsept','Retseptimeister','Ava uurimiskeskuses üks salajane retsept täielikult','Retseptimeister',4000,0,108),
 ('geenid','Geneetikateadlane','Avasta kõik 8 geeni','Geneetikateadlane',20000,0,109)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

-- ---------------------------------------------------------------------
-- 2o. Kalamehe varustus: kahv, söödakorv, ridvahoidja, kalasump, söödaämber (mõjuvad püügile)
--     ja püünised: nakkevõrk (vajab kalastuskaarti), mõrd, katiska, vähimõrd (töötavad ise, tühjendad hiljem).
-- ---------------------------------------------------------------------
create table if not exists public.fish_gear (
  id text primary key, kind text not null, tier int not null, name text not null, descr text not null,
  price int not null, min_level int not null, val numeric not null, val2 numeric not null default 0, sort int not null default 0
);
insert into public.fish_gear (id, kind, tier, name, descr, price, min_level, val, val2, sort) values
 ('kahv1','kahv',1,'Väike kahv','I tase: 10% väiksem kala pääsemise võimalus ja 35% väiksem õnge purunemise risk suure kala väljatoomisel.',150,2,0.10,0.35,1),
 ('kahv2','kahv',2,'Teleskoopkahv','II tase: pikk vars ulatub kaugele – 20% väiksem kala pääsemise võimalus ja 45% väiksem õnge purunemise risk.',900,8,0.20,0.45,2),
 ('kahv3','kahv',3,'Kummeeritud suurkahv','III tase: suur kummeeritud võrk ka hiidkaladele – 30% väiksem kala pääsemise võimalus ja 55% väiksem õnge purunemise risk.',3500,16,0.30,0.55,3),
 ('kahv4','kahv',4,'Meistri kahv','IV tase: süsinikvarre ja sügava võrguga – 40% väiksem kala pääsemise võimalus ja 65% väiksem õnge purunemise risk.',9000,24,0.40,0.65,27),
 ('kahv5','kahv',5,'Kuninglik kahv','V tase: kuldse raamiga meisterteos – 50% väiksem kala pääsemise võimalus ja 75% väiksem õnge purunemise risk.',22000,30,0.50,0.75,28),
 ('korv1','korv',1,'Söödakorv','I tase: puistab põhja peibutussööta – 5% kiirem näkkamine, latikat ja karpkala 1,2× rohkem.',200,3,0.05,1.2,4),
 ('korv2','korv',2,'Method-feeder','II tase: kokkupressitud peibutussööt konksu ümber – 10% kiirem näkkamine, latikat ja karpkala 1,4× rohkem.',1500,10,0.10,1.4,5),
 ('korv3','korv',3,'Pikaviskeline söödakorv','III tase: raskem korv viib sööda kaugele ja täpselt – 15% kiirem näkkamine, latikat ja karpkala 1,6× rohkem.',3500,16,0.15,1.6,6),
 ('korv4','korv',4,'Meistri söödakorv','IV tase: aeglaselt lahustuv meistrisegu – 20% kiirem näkkamine, latikat ja karpkala 1,8× rohkem.',8000,23,0.20,1.8,7),
 ('korv5','korv',5,'Kuninglik söödakorv','V tase: kuningliku köögi salasegu – 25% kiirem näkkamine, latikat ja karpkala 2× rohkem.',20000,30,0.25,2.0,8),
 ('hoidja1','hoidja',1,'Ridvahoidja','Teine õng on hoidjas vees: 7% juhtudest tuleb sinna samal ajal teine kala.',400,5,0.07,0,6),
 ('hoidja2','hoidja',2,'Kahe õnge alus','Kindel alus kelluke-signalisaatoriga: 13% juhtudest tuleb teise õnge otsa kala.',2500,14,0.13,0,7),
 ('sump1','sump',1,'Kalasump','Kala püsib vees elus ja värske: müües saad 5% parema hinna.',300,4,0.05,0,8),
 ('sump2','sump',2,'Suur võrksump','Pikk ja avar sump: kala püsib eriti värske, müües 10% parem hind.',2000,12,0.10,0,9),
 ('ammber1','ammber',1,'Söödaämber','1. tase: elussööt püsib ämbris elus – 20% võimalus sööta mitte kulutada.',120,2,0.20,0,10),
 ('ammber2','ammber',2,'Õhupumbaga söödaämber','2. tase: pump hoiab vee hapnikurikka – 40% võimalus sööta mitte kulutada.',1200,9,0.40,0,11),
 ('ammber3','ammber',3,'Jahutusega söödaämber','3. tase: jahe vesi hoiab sööda kaua värske – 60% võimalus sööta mitte kulutada.',3000,15,0.60,0,24),
 ('ammber4','ammber',4,'Meistri söödaämber','4. tase: kahe kambriga ämber pumba ja jahutusega – 80% võimalus sööta mitte kulutada.',7000,22,0.80,0,25),
 ('ammber5','ammber',5,'Kuninglik söödaämber','5. tase: elussööt ei kulu enam kunagi.',25000,30,1.00,0,26),
 ('vork1','vork',1,'Nakkevõrk 30 m','Pane järve või merre. 2 tunni pärast on võrgus kuni 5 kala. Vajab kalastuskaarti.',800,6,2,5,12),
 ('vork2','vork',2,'Nakkevõrk 60 m','Kaks korda pikem võrk: 1,5 tunniga kuni 8 kala. Vajab kalastuskaarti.',3000,15,1.5,8,13),
 ('mord1','mord',1,'Mõrd','Rõngastel võrkpüünis haugile, latikale, linaskile ja angerjale. 4 tunniga kuni 4 kala.',1200,8,4,4,14),
 ('mord2','mord',2,'Suur kalamõrd','Pikkade tiibadega mõrd: 3 tunniga kuni 6 kala, ka suuremaid.',4000,18,3,6,15),
 ('katiska1','katiska',1,'Katiska','Soome traatmõrd väikestele kaladele: ahven, särg, kiisk. 3 tunniga kuni 6 kala.',350,3,3,6,16),
 ('katiska2','katiska',2,'Kahekordne katiska','Kaks katiskat korraga: 2 tunniga kuni 9 kala.',1600,11,2,9,17),
 ('loks1','loks',1,'Vähimõrd','Püüab jõevähke. Pane järve või jõkke, 3 tunniga kuni 6 vähki.',500,4,3,6,18),
 ('loks2','loks',2,'Vähimõrrad (3 tk)','Kolm mõrda korraga: 2 tunniga kuni 10 vähki.',2200,13,2,10,19),
 ('vork3','vork',3,'Meisternakkevõrk 90 m','Meisterpüünis: peen ja pikk võrk. 1,5 tunniga kuni 11 kala, võimalus haruldasteks kaladeks ja erilisteks leidudeks. Vajab kalastuskaarti.',9000,24,1.5,11,20),
 ('mord3','mord',3,'Meistermõrd','Meisterpüünis: tugev suur mõrd kahe tiivaga. 2,5 tunniga kuni 8 kala, võimalus haruldasteks kaladeks ja erilisteks leidudeks.',11000,26,2.5,8,21),
 ('katiska3','katiska',3,'Meisterkatiska','Meisterpüünis: kolm katiskat ühes reas. 1,5 tunniga kuni 12 kala, võimalus haruldasteks kaladeks ja erilisteks leidudeks.',5000,20,1.5,12,22),
 ('loks3','loks',3,'Meistri vähimõrrad (5 tk)','Meisterpüünis: viis mõrda korraga. 1,5 tunniga kuni 14 vähki, vahel ka haruldane kala või eriline leid.',6000,22,1.5,14,23)
on conflict (id) do update set kind = excluded.kind, tier = excluded.tier, name = excluded.name, descr = excluded.descr, price = excluded.price,
  min_level = excluded.min_level, val = excluded.val, val2 = excluded.val2, sort = excluded.sort;
create table if not exists public.fisher_gear (
  user_id uuid not null references auth.users(id) on delete cascade, gear text not null references public.fish_gear(id),
  bought_at timestamptz not null default now(), primary key (user_id, gear)
);
create table if not exists public.fish_traps (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, gear text not null, spot text not null, set_at timestamptz not null default now(), ready_at timestamptz not null,
  status text not null default 'set', result jsonb
);
create unique index if not exists fish_traps_one on public.fish_traps(user_id, kind) where status = 'set';
alter table public.fishers add column if not exists license_until timestamptz;
alter table public.fish_catches add column if not exists trap text;
do $$ declare t text; begin
  foreach t in array array['fish_gear','fisher_gear','fish_traps'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
-- jõevähk: ei tule õngega (spots on tühi), ainult vähimõrraga
insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort)
values ('vahk','Jõevähk',2,0.03,0.2,24,10,'{}',4,false,false,2,'{"c":["#6a4a2e","#4a3020","#8a6a44","#5a3c24"]}',
  'Eesti jõgede ja järvede soomustatud elanik. Elab kivide all ja käib öösiti toitu otsimas. Püütakse vähimõrraga.',99)
on conflict (id) do update set name = excluded.name, descr = excluded.descr, spots = excluded.spots, look = excluded.look;
update public.fish_species set max_len = 17, real = true, max_age = 20, baits = '{}', times = '{öö}', element = 'vesi', arch = 'cypr', body = 'karp' where id = 'vahk';
insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('puunis1','Püünisemeister','Tühjenda esimene püünis',null,250,0,110),
 ('vahk25','Vähikuningas','Püüa 25 jõevähki','Vähikuningas',3000,0,111),
 ('varustus','Täisvarustus','Oma kahvi, söödakorvi, ridvahoidjat, sumpa ja söödaämbrit','Varustatud kalamees',2500,0,112)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

-- ---------------------------------------------------------------------
-- 2p. Kaluri riietus: iga ilm nõuab oma riideid. Õigesti riides kalur püüab paremini, märg ja külm kalur halvemini.
--     Sildid: sun (päike), rain (vihm), wind (torm), cold (öö/talv/jää), grip (haare), wade (kahlamine), polar (prillid), pockets (taskud)
-- ---------------------------------------------------------------------
create table if not exists public.fish_clothes (
  id text primary key, slot text not null, name text not null, tags text[] not null, descr text not null,
  price int not null, min_level int not null, colors text[] not null, sort int not null default 0
);
insert into public.fish_clothes (id, slot, name, tags, descr, price, min_level, colors, sort) values
 ('nokamuts','pea','Nokamüts','{sun}','Nokk varjab silmi päikese eest – kala ujukit on hea jälgida.',60,1,'{#2f5a8a,#c83a2a,#3a6a3a,#e8e2d0}',1),
 ('vihmakubar','pea','Vihmakübar','{rain}','Lai serv juhib vihmavee kraest mööda.',150,3,'{#e8c02a,#2f6a4a,#2a3a5a,#c86a2a}',2),
 ('kootud','pea','Villane kootud müts','{cold}','Soe müts öösse ja talve – pea ei külmeta.',180,4,'{#b83a3a,#3a4a6a,#e8e2d0,#5a7a3a}',3),
 ('prillid','silmad','Polariseeritud päikeseprillid','{sun,polar}','Lõikavad veepinna peegelduse: päikese ja pilvega näed vees kalade varje enne, kui nad näkkavad.',400,5,'{#1a1a1a,#6a4a2a,#2a4a6a,#8a2a2a}',4),
 ('vest','vest','Kalurivest','{pockets}','Kümme taskut – konksud, lipsud ja tangid käe-jala juures. Väljatoomisel on roheline ala laiem.',250,2,'{#5a6a3a,#3a4a5a,#8a6a3a,#2a2a2a}',5),
 ('vihmajope','keha','Vihmajope','{rain}','Kummeeritud kapuutsiga jope – vihm ei tule läbi.',300,3,'{#f2c02a,#e85a2a,#2a6a4a,#2a4a8a}',6),
 ('tormijope','keha','Membraanjope','{rain,wind,cold}','Vee- ja tuulekindel soe jope: sobib vihma, tormi ja külmaga.',1500,12,'{#2a4a7a,#3a5a3a,#a83a2a,#3a3a3a}',7),
 ('vpyksid','pyksid','Veekindlad kalurpüksid','{rain,wind}','Traksidega püksid, mis peavad vett ja tuult.',350,6,'{#3a5a3a,#2a3a5a,#e8c02a,#3a3a3a}',8),
 ('talvepyksid','pyksid','Soojad talvepüksid','{cold,wind}','Vooderdatud püksid jääpüügiks ja külmadeks öödeks.',600,9,'{#2a2a3a,#5a3a2a,#3a4a5a,#6a6a6a}',9),
 ('kummikud','jalad','Kummikud','{rain}','Kaldal ja porises jalad kuivad.',120,1,'{#2f6a3a,#1a1a1a,#c83a2a,#e8c02a}',10),
 ('kahlajad','jalad','Kahlajad','{rain,wade}','Rinnuni kahlajad – saad jõkke sisse minna. Suurel jõel tuleb rohkem forelli, harjust ja lõhet.',900,7,'{#4a5a3a,#5a4a3a,#3a4a5a,#2a2a2a}',11),
 ('talvesaapad','jalad','Talvesaapad','{cold,rain}','Karvavoodriga saapad – varbad ei külmu ka jääl.',700,9,'{#5a3a2a,#2a2a2a,#6a6a5a,#3a2a1a}',12),
 ('sormikud','kaed','Kaluri sõrmikud','{grip}','Kindel haare ka märja ja limase kalaga: kala libiseb harvem käest.',200,4,'{#3a3a3a,#5a6a3a,#c86a2a,#2a4a6a}',13),
 ('talvekindad','kaed','Soojad talvekindad','{cold,grip}','Soojad ja libisemiskindlad – sõrmed ei kangestu.',450,8,'{#8a2a2a,#2a3a5a,#3a3a3a,#e8e2d0}',14)
on conflict (id) do update set slot = excluded.slot, name = excluded.name, tags = excluded.tags, descr = excluded.descr, price = excluded.price,
  min_level = excluded.min_level, colors = excluded.colors, sort = excluded.sort;
create table if not exists public.fisher_clothes (
  user_id uuid not null references auth.users(id) on delete cascade, item text not null references public.fish_clothes(id),
  color text, bought_at timestamptz not null default now(), primary key (user_id, item)
);
alter table public.fishers add column if not exists outfit jsonb not null default '{}';
alter table public.fishers add column if not exists auto_dress boolean not null default false;
do $$ declare t text; begin
  foreach t in array array['fish_clothes','fisher_clothes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('riided','Tõeline kalamees','Oma riideid kõigisse 7 kohta: müts, prillid, vest, jope, püksid, jalanõud ja kindad','Tõeline kalamees',3000,0,113),
 ('ilmakindel','Ilmakindel','Püüa 50 kala nii, et oled täpselt ilma järgi riides','Ilmakindel',2500,0,114)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;
alter table public.fish_catches add column if not exists dressed boolean not null default false;

-- ---------------------------------------------------------------------
-- 2q. Erisündmused (Haide väljakutse, Sägaööd), kalastusretk ja kahevõitlused
--     Sündmus toimub iga nädalavahetuse (R 00:00 – P 24:00 Tallinna aja järgi): paarisnädalal haid, paaritul säga.
--     Tabelis fish_event_override saab admin sündmuse muul ajal käima panna (kind, starts, ends).
-- ---------------------------------------------------------------------
alter table public.fish_species add column if not exists event text;
insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort) values
 ('ogahai','Ogahai',3,1.2,9,60,40,'{meri,saarestik,avameri,sugavik}',18,false,false,7,'{"c":["#6a7a84","#4a5a64","#d8dee2","#5a6a74"]}',
  'Väike hai, kellel on mõlema seljauime ees mürgine oga. Satub vahel ka Läänemerre. Püütakse ainult Haide väljakutse ajal.',100),
 ('heeringahai','Heeringahai',5,40,250,30,300,'{saarestik,avameri,sugavik}',20,false,false,10,'{"c":["#3a4a5a","#2a3442","#e8ecef","#2e3a48"]}',
  'Võimas ja kiire hai, kes jahib heeringaid ja makrelli. Läänemerre jõuab harva. Püütakse ainult Haide väljakutse ajal.',101)
on conflict (id) do update set name = excluded.name, descr = excluded.descr, spots = excluded.spots, look = excluded.look, difficulty = excluded.difficulty,
  min_w = excluded.min_w, max_w = excluded.max_w, rarity = excluded.rarity, min_level = excluded.min_level;
update public.fish_species set event = 'hai', real = true, element = 'vesi', arch = 'pike', body = 'haug', baits = '{krevett,kuldvobler}', times = '{}',
  max_len = case id when 'ogahai' then 110 else 300 end, max_age = case id when 'ogahai' then 70 else 65 end where id in ('ogahai','heeringahai');
-- hinnaparandus: legendaarne 40–250 kg heeringahai maksis ekslikult vaid 30 kulda
update public.fish_species set price = 800 where id = 'heeringahai' and price < 800;
-- haug, koha ja tursk on suured kalad, kelle baashind oli liiga madal
update public.fish_species set price = 20 where id = 'haug' and price < 20;
update public.fish_species set price = 24 where id = 'koha' and price < 24;
update public.fish_species set price = 20 where id = 'tursk' and price < 20;
create table if not exists public.fish_event_override (id serial primary key, kind text not null check (kind in ('hai','saga')), starts timestamptz not null, ends timestamptz not null);
create table if not exists public.fish_event_prizes (user_id uuid not null references auth.users(id) on delete cascade, kind text not null, starts timestamptz not null, place int not null,
  primary key (user_id, kind, starts));
create table if not exists public.fish_event_q (user_id uuid not null references auth.users(id) on delete cascade, kind text not null, starts timestamptz not null, q int not null,
  primary key (user_id, kind, starts, q));
create table if not exists public.fish_journey (
  user_id uuid not null references auth.users(id) on delete cascade, week date not null, legs jsonb not null, leg int not null default 0,
  leg_at timestamptz not null default now(), finished boolean not null default false, primary key (user_id, week)
);
alter table public.fishers add column if not exists last_seen timestamptz;
create table if not exists public.fish_duels (
  id bigserial primary key, a uuid not null references auth.users(id) on delete cascade, b uuid not null references auth.users(id) on delete cascade,
  spot text not null, stake int not null check (stake >= 0), status text not null default 'invited',
  created_at timestamptz not null default now(), start_at timestamptz, end_at timestamptz, winner uuid, a_w numeric, b_w numeric
);
create index if not exists fish_duels_a on public.fish_duels(a, status);
create index if not exists fish_duels_b on public.fish_duels(b, status);
do $$ declare t text; begin
  foreach t in array array['fish_event_override','fish_event_prizes','fish_event_q','fish_journey','fish_duels'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('hai1','Esimene hai','Püüa Haide väljakutse ajal hai',null,1000,0,115),
 ('retk1','Retkeline','Läbi kalastusretk algusest lõpuni',null,1500,0,116),
 ('retk5','Rändkalur','Läbi 5 kalastusretke','Rändkalur',5000,0,117),
 ('duell1','Esimene võit','Võida kahevõitlus',null,800,0,118),
 ('duell10','Duellimeister','Võida 10 kahevõitlust','Duellimeister',6000,0,119)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

-- ---------------------------------------------------------------------
-- 2r. Ilmastik nagu päris elus: aastaaeg, õhu- ja veetemperatuur (Eesti keskmised), õhurõhk ja selle muutus.
--     Iga liik reageerib omamoodi: temp_pref (cold/cool/warm) ja wx_tags (pred, night, rain, dim, sun).
-- ---------------------------------------------------------------------
alter table public.fish_species add column if not exists temp_pref text not null default 'cool';
alter table public.fish_species add column if not exists wx_tags text[] not null default '{}';
update public.fish_species set temp_pref = case
  when id = any(array['luts','siig','raabis','peled','joeforell','vikerforell','harjus','lohe','meriforell','tursk','joesilm','ojasilm','merihark','tint','emakala','kilu','raim','ogahai']) then 'cold'
  when id = any(array['karpkala','linask','latikas','saga','koger','hobekoger','hobekarp','amuur','roosarg','vingerjas','nurg','hink','tuun']) then 'warm'
  else 'cool' end,
 wx_tags = array_remove(array[
  case when id = any(array['haug','ahven','koha','toogjas','tursk','meriforell','lohe','joeforell','vikerforell','nokkhaug','makrell','tuun','sainas','heeringahai','ogahai','merikurat']) then 'pred' end,
  case when id = any(array['angerjas','luts','saga','koha','vingerjas','emakala','joesilm']) then 'night' end,
  case when id = any(array['ahven','joeforell','vikerforell','sarg','teib','sainas','harjus','meriforell','turb','lohe']) then 'rain' end,
  case when id = any(array['koha','haug','toogjas','luts','angerjas']) then 'dim' end,
  case when id = any(array['karpkala','koger','hobekoger','hobekarp','roosarg','amuur','viidikas']) then 'sun' end], null)
where real;

-- ---------------------------------------------------------------------
-- 2s. Järve kalurid (botid): mängu tegelased, kes käivad ja püüavad nagu inimesed. Alati märgitud 🎣 „Järve kalur“.
--     Nad ei võta päris mängijatelt preemiaid ega tiitleid ega kauple turul.
-- ---------------------------------------------------------------------
create table if not exists public.fish_bots (
  id text primary key, name text not null, emoji text not null, descr text not null, base_level int not null, rate numeric not null,
  skill numeric not null, size numeric not null, spots text[] not null, hours jsonb not null, weekend jsonb not null default '[]',
  stake int not null default 0, storm boolean not null default false, start_date date not null default '2026-11-15', sort int not null default 0
);
insert into public.fish_bots (id, name, emoji, descr, base_level, rate, skill, size, spots, hours, weekend, stake, storm, sort) values
 ('ants','Vana Ants','🧓','Kalastanud viiskümmend aastat. Aeglane ja rahulik, aga tema konksu otsa tulevad suured haugid.',34,0.3,0.8,1.3,'{kuninglik,jogi,metsajarv}','[[5,9],[18,21]]','[[5,11],[17,21]]',250,false,1),
 ('kaia','Kiire Kaia','👧','Kooli kõrvalt alati vee ääres. Püüab palju väikseid kalu ja on kiire nagu välk.',14,1.2,1.35,0.8,'{metsajarv,jogi}','[[15,19]]','[[10,13],[15,19]]',100,false,2),
 ('toomas','Tormi-Toomas','🧔','Läheb merele siis, kui teised koju tõttavad. Tormiga on ta kõige õnnelikum.',26,0.6,1.0,1.1,'{meri,saarestik,jogi}','[[21,24],[0,2]]','[[20,24],[0,3]]',500,true,3),
 ('mariliis','Mari-Liis','👩','Lõunapausil ja õhtuti Kuninglikul järvel. Teab iga koha lemmiksööta.',20,0.8,1.1,1.0,'{kuninglik,metsajarv}','[[12,14],[19,23]]','[[11,15],[19,23]]',250,false,4),
 ('peeter','Kalur Peeter','👨','Paadimees, kes nädalavahetused veedab avamerel. Tal on suured panused ja suured kalad.',40,0.2,1.0,1.15,'{avameri,saarestik,meri}','[[19,21]]','[[9,17]]',1000,false,5),
 ('jaan','Jaan Jääpüüdja','🧑','Talvel jääaugu ääres, muul ajal jõel. Külm ei heiduta teda kunagi.',22,0.5,0.95,1.0,'{jaa,jogi}','[[7,10],[16,18]]','[[7,12],[16,18]]',100,false,6),
 ('liisu','Liisu','👧','Alles õpib, aga on väga innukas. Metsajärve kõige rõõmsam kalur.',8,1.5,0.9,0.9,'{metsajarv}','[[14,17],[18,20]]','[[10,12],[14,20]]',0,false,7),
 ('heino','Heino Paadimees','👴','Vana kaluri hommikud saarestikus. Räägib lugusid kaladest, kes ära läksid.',30,0.4,0.9,1.2,'{saarestik,meri,kuninglik}','[[6,11]]','[[6,12]]',500,false,8)
on conflict (id) do update set name = excluded.name, emoji = excluded.emoji, descr = excluded.descr, base_level = excluded.base_level, rate = excluded.rate,
  skill = excluded.skill, size = excluded.size, spots = excluded.spots, hours = excluded.hours, weekend = excluded.weekend, stake = excluded.stake,
  storm = excluded.storm, sort = excluded.sort;
create table if not exists public.fish_bot_catches (
  id bigserial primary key, bot text not null references public.fish_bots(id) on delete cascade, species text not null, rarity int not null,
  weight numeric not null, spot text not null, caught_at timestamptz not null
);
create index if not exists fish_bot_catches_at on public.fish_bot_catches(caught_at);
create table if not exists public.fish_bot_meta (k text primary key, v timestamptz not null);
-- Järve kalurid kasvavad nagu päris mängijad: kogemus tuleb nende enda püütud kaladest
alter table public.fish_bots add column if not exists lvl int;
alter table public.fish_bots add column if not exists xp int not null default 0;
update public.fish_bots set lvl = base_level where lvl is null;
alter table public.fish_news alter column user_id drop not null;
alter table public.fish_news add column if not exists bot text;
alter table public.fish_duels alter column b drop not null;
alter table public.fish_duels add column if not exists bot text;
alter table public.fish_duels add column if not exists bot_catch jsonb;
alter table public.fish_duels add column if not exists from_bot boolean not null default false;
alter table public.fish_duels add column if not exists bot_at timestamptz;
do $$ declare t text; begin
  foreach t in array array['fish_bots','fish_bot_catches','fish_bot_meta'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2z5b. Müütilised kalad (10 uut liiki, igaühel eriline välimus: look.fx)
--   Ilmuvad teemakohastes püügikohtades eritingimustel (ilm, öö, talv) ja Sadama piirkondades.
-- ---------------------------------------------------------------------
insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort,weather) values
 ('aikeseangerjas','Äikeseangerjas',5,1,6,360,250,'{jogi,kuninglik,meri}',22,false,false,9,'{"s":"e","c":["#3a4a8a","#141a3a","#c8d0ff","#ffe060"],"g":"#fff080","fx":"spark"}','Tormiga tõusev angerjas, kelle kehast käivad elektrisähvatused.',96,'{torm}'),
 ('vikerkaarekuningas','Vikerkaarekuningas',5,3,14,420,280,'{jogi,kuninglik,salajane}',26,false,false,9,'{"s":"n","c":["#ff8a6a","#6a4ac8","#fff4e0","#4ad0e8"],"b":"#a0f080","g":"#ffd0f0","fx":"rainbow"}','Kalade kuningas, kelle soomused muudavad pidevalt värvi.',97,'{vihm,paike}'),
 ('kummitusforell','Kummitusforell',4,0.5,4,160,120,'{metsajarv,jogi,udulaht}',14,true,false,7,'{"s":"n","c":["#d8e8f0","#8aa4b8","#ffffff","#b8d0e0"],"g":"#e0f0ff","fx":"ghost"}','Läbipaistva kehaga forell, keda näeb ainult öösiti.',85,null),
 ('rubiinahven','Rubiinahven',4,0.3,2,150,115,'{metsajarv,kuninglik}',12,false,false,7,'{"s":"n","c":["#d8303a","#7a0e1a","#ffd0d0","#ff6a6a"],"st":5,"g":"#ff5a6a","fx":"ruby"}','Ahven, kelle soomused on punased nagu vääriskivid.',86,'{paike}'),
 ('kuldnesaga','Kuldne säga',5,15,90,450,300,'{jogi,kuninglik,sugavik}',30,true,false,9,'{"s":"l","c":["#e8b84a","#8a5a10","#fff0c0","#d89a2a"],"g":"#ffe08a","fx":"goldw"}','Hiiglaslik säga, kelle vurrud on puhtast kullast.',98,null),
 ('tahehaug','Tähehaug',5,3,16,380,260,'{metsajarv,jogi,jaa}',24,true,false,9,'{"s":"l","c":["#2a3a6a","#0e1838","#a8b8e8","#4a5a9a"],"g":"#b8c8ff","fx":"stars"}','Öine haug, kelle täpid helendavad nagu tähed.',99,null),
 ('myrgikuningas','Mürgikuningas',5,2,10,400,270,'{udulaht,salajane,sugavik}',32,false,false,9,'{"s":"n","c":["#5a8a2a","#1a3a0e","#c8f08a","#3a6a1a"],"sp":1,"g":"#8aff4a","fx":"toxic"}','Soode ohtlik valitseja, keda ümbritseb roheline mürgiaura.',100,'{udu}'),
 ('ajakala','Ajakala',6,0.5,3,900,500,'{salajane,sugavik}',38,true,false,10,'{"s":"d","c":["#e8d8a8","#7a6a4a","#fff8e0","#c8b078"],"g":"#fff0b0","fx":"clock"}','Müstiline kala, kelle ümber keerlevad kellasümbolid. Öeldakse, et ta peatab hetkeks aja.',105,null),
 ('merihunt','Kuninglik merihunt',6,4,20,850,480,'{avameri,sugavik,meri}',34,false,false,10,'{"s":"n","c":["#4a6a9a","#1a2a4a","#c8d8f0","#2a4a7a"],"sp":1,"g":"#7ab0ff","fx":"crown"}','Mere valitseja, kelle pead ehib sinine kuninglik kroon.',106,null),
 ('kristallangerjas','Kristallangerjas',5,1,5,370,255,'{jaa,sugavik,salajane}',28,false,false,9,'{"s":"e","c":["#d8f4ff","#7ac0e0","#ffffff","#a8e0f8"],"g":"#c8f0ff","fx":"crystal"}','Läbipaistev angerjas, kelle keha on nagu kristall.',101,null)
on conflict (id) do update set name=excluded.name, rarity=excluded.rarity, min_w=excluded.min_w, max_w=excluded.max_w,
  price=excluded.price, xp=excluded.xp, spots=excluded.spots, min_level=excluded.min_level, night_only=excluded.night_only, difficulty=excluded.difficulty,
  look=excluded.look, descr=excluded.descr, sort=excluded.sort, weather=excluded.weather;
update public.fish_species s set baits = v.b::text[], times = v.t::text[], max_len = v.ln, max_age = v.ag, real = false, element = v.e, arch = v.a, body = v.bd from (values
 ('aikeseangerjas','{valgus,krevett}','{õhtu,öö}',150,40,'välk','eel','angerjas'),
 ('vikerkaarekuningas','{haldjatolm,valgus}','{päev}',120,50,'valgus','salmon','haug'),
 ('kummitusforell','{haldjatolm,vagel}','{öö}',70,25,'vari','salmon','haug'),
 ('rubiinahven','{hobelant,uss}','{päev}',50,30,'tuli','perch','ahven'),
 ('kuldnesaga','{kuldvobler,krevett}','{öö}',260,90,'valgus','catfish','angerjas'),
 ('tahehaug','{valgus,hobelant}','{öö}',140,40,'valgus','pike','haug'),
 ('myrgikuningas','{kalasoot,vagel}','{hommik,õhtu}',100,60,'loodus','monster','karp'),
 ('ajakala','{haldjatolm}','{öö}',60,999,'valgus','angel','karp'),
 ('merihunt','{krevett,kuldvobler}','{päev,õhtu}',160,120,'vesi','monster','karp'),
 ('kristallangerjas','{valgus,haldjatolm}','{öö}',130,80,'jää','eel','angerjas')
) as v(id, b, t, ln, ag, e, a, bd) where s.id = v.id;

-- ---------------------------------------------------------------------
-- 2z5c. Sügavuste Valitseja – müütiline olend, kes võib ilmuda igas veekogus
--   Tavalise püügi ajal teda ei tule (event = 'valitseja'). Ta tõuseb ainult ilmasündmuse
--   „Valitseja ärkab“ ajal (vt fx_wev_slot) – siis võib ta näkata igas püügikohas – või
--   kohtab teda Sadama laevastik retkel ükskõik millises piirkonnas.
-- ---------------------------------------------------------------------
insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort,weather,event) values
 ('sygavvalitseja','Sügavuste Valitseja',6,90,420,3200,1800,'{metsajarv,jogi,udulaht,kuninglik,meri,jaa,salajane,saarestik,avameri,sugavik,kuningatiik}',20,false,false,10,
  '{"s":"e","c":["#16344f","#06111d","#5fe0ff","#2a6a92"],"g":"#5fe0ff","fx":"abyss"}',
  'Müütiline sügavuste valitseja: tume madu, kelle kehal helendavad sinised spiraalmärgid. Ta tõuseb vaid siis, kui vesi kõikjal korraga tumeneb.',110,null,'valitseja')
on conflict (id) do update set name=excluded.name, rarity=excluded.rarity, min_w=excluded.min_w, max_w=excluded.max_w, price=excluded.price, xp=excluded.xp,
  spots=excluded.spots, min_level=excluded.min_level, difficulty=excluded.difficulty, look=excluded.look, descr=excluded.descr, sort=excluded.sort, event=excluded.event;
update public.fish_species set baits = '{valgus,haldjatolm,kuldvobler}', times = '{öö,õhtu,hommik,päev}', max_len = 1400, max_age = 999, real = false,
  element = 'vesi', arch = 'eel', body = 'angerjas' where id = 'sygavvalitseja';

-- ---------------------------------------------------------------------
-- 2z5d. Merikurat on nüüd müütiline süvamere-kuningas (uus välimus, harvem ja väärtuslikum)
-- ---------------------------------------------------------------------
update public.fish_species set rarity = 6, real = false, price = 1600, xp = 900, min_w = 8, max_w = 60, difficulty = 10,
  look = '{"s":"d","c":["#3b1f5e","#09050f","#c9a8ff","#1c0f2e"],"g":"#7cf0ff","fx":"angler2"}',
  descr = 'Müütiline süvamere-kuningas: kolm helendavat latrit, hõõguvad praod kehal ja klaasjad hambad. Jahib ainult öösel Sügavikus.',
  baits = '{valgus,haldjatolm,kuldvobler}', times = '{öö}', max_len = 240, max_age = 80, element = 'pimedus', g_k = 0.04, g_linf = null, g_cls = null
where id = 'merikurat';

-- ---------------------------------------------------------------------
-- 2z5e. Virmaliste õnge jaoks: raskemad kalad (üle 500 kg) ja uus lant Virmalislant
--   Nende raskeimad isendid murravad nõrgema õnge – vaja on Virmaliste õnge (tugevus 900).
-- ---------------------------------------------------------------------
insert into public.fish_baits (id,name,price,min_level,wait_mult,rarity_bonus,consumable,descr,sort) values
 ('virmalislant','Virmalislant',60000,48,0.62,0.26,false,'Virmaliste värvides helkiv lusiklant, mis ei kulu kunagi. Võtavad ainult röövkalad – ja põhjamere hiiglased.',10)
on conflict (id) do update set name=excluded.name, price=excluded.price, min_level=excluded.min_level, wait_mult=excluded.wait_mult,
  rarity_bonus=excluded.rarity_bonus, consumable=excluded.consumable, descr=excluded.descr, sort=excluded.sort;
insert into public.fish_species (id,name,rarity,min_w,max_w,price,xp,spots,min_level,night_only,winter_only,difficulty,look,descr,sort,weather) values
 ('tormituur','Tormituur',6,150,650,4600,2400,'{meri,saarestik,avameri}',46,false,false,10,'{"s":"l","c":["#2a3848","#0a1018","#9ad8ff","#3a4a5c"],"g":"#8ae0ff","fx":"storm"}',
  'Müütiline hiidtuur, kelle seljakilpides sähvivad välgud. Tõuseb põhjast ainult tormiga – või vahetult enne tormi, kui õhk on elektrit täis.',121,'{torm}'),
 ('hiidhai','Hiidhai',6,180,850,5200,2700,'{avameri,sugavik}',48,false,false,10,'{"s":"l","c":["#5a6a78","#1c242e","#e6ecf0","#3a4a58"]}',
  'Ürgne hiidhai, kelle hambad on peopesa suurused. Arvati ammu väljasurnuks.',122,null),
 ('virmalislohe','Virmalislõhe',6,140,720,4800,2500,'{jaa,salajane}',50,false,false,10,'{"s":"l","c":["#1a5a6a","#0a1e2a","#c8fff0","#8a6aff"],"g":"#7affc8","sp":1}',
  'Müütiline põhjala lõhe, kelle soomustel peegelduvad virmalised. Ujub välja vaid tähistaeva all.',123,null)
on conflict (id) do update set name=excluded.name, rarity=excluded.rarity, min_w=excluded.min_w, max_w=excluded.max_w, price=excluded.price, xp=excluded.xp,
  spots=excluded.spots, min_level=excluded.min_level, difficulty=excluded.difficulty, look=excluded.look, descr=excluded.descr, sort=excluded.sort, weather=excluded.weather;
update public.fish_species set baits = '{virmalislant,krevett}', times = '{öö,õhtu,hommik,päev}', max_len = 650, max_age = 150, real = false, element = 'välk', arch = 'sturgeon', body = 'haug', wx_tags = '{pred}' where id = 'tormituur';
update public.fish_species set baits = '{virmalislant,draakonilant}', times = '{öö,õhtu,hommik,päev}', max_len = 1600, max_age = 400, real = false, element = 'vesi', arch = 'tuna', body = 'haug', wx_tags = '{pred}' where id = 'hiidhai';
update public.fish_species set baits = '{virmalislant,haldjatolm}', times = '{öö}', max_len = 420, max_age = 600, real = false, element = 'jää', arch = 'salmon', body = 'haug', wx_tags = '{pred}' where id = 'virmalislohe';

-- lantide kirjeldused: lanti võtavad ainult röövkalad
update public.fish_baits set descr = v.d from (values
  ('hobelant','Peibutis, mis ei kulu. Võtavad ainult röövkalad (haug, ahven, koha, forell…).'),
  ('kuldvobler','Kallis peibutis, mis ei kulu. Võtavad ainult röövkalad.'),
  ('draakonilant','Legendaarne peibutis, mis ei kulu kunagi. Võtavad ainult röövkalad.'),
  ('soomuslant','Kalasoomustest läikiv lant – röövkalad ei suuda vastu panna, rahulikud kalad seda ei võta. Valmistatakse söödalaual.')) v(id, d)
where fish_baits.id = v.id;

-- ---------------------------------------------------------------------
-- 2z6. Kala vanus: liigipõhine kasvumudel (von Bertalanffy) ja iga kala individuaalne vanus
--   Igal liigil on oma kasvumudel fish_species veergudes (g_*). Tühjad väärtused täidetakse
--   liigi andmete põhjal (max_len, max_age); päris kaladel on kalateaduse põhised väärtused.
--     g_linf – asümptootiline pikkus (cm), mida kala kasvades lõpmatult läheneb
--     g_k    – kasvukiirus (1/aasta): suurem = kasvab kiiremini ja jõuab varem täispikkusse
--     g_t0   – teoreetiline vanus, mil pikkus oleks 0
--     g_b    – pikkuse ja kaalu seose aste (W = a·L^b; a arvutatakse max_len ja max_w järgi)
--     g_mat  – suguküpsuse vanus (aastat)
--     g_cls  – vanuseklasside piirid aastates: {noor, noor täiskasvanu, täiskasvanud, vana}, üle viimase = erakordselt vana
--   Vanus ja pikkus arvutatakse ÜKS kord, kala püüdmisel (trigger), ja salvestatakse fish_catches tabelisse.
--   Uue liigi lisamisel piisab, kui sellel on max_len ja max_age – või panna g_* väärtused ise.
-- ---------------------------------------------------------------------
alter table public.fish_species add column if not exists g_linf numeric;
alter table public.fish_species add column if not exists g_k numeric;
alter table public.fish_species add column if not exists g_t0 numeric;
alter table public.fish_species add column if not exists g_b numeric;
alter table public.fish_species add column if not exists g_mat numeric;
alter table public.fish_species add column if not exists g_cls numeric[];
-- päris kalade kasvuandmed (ligikaudsed, kalateaduslike uuringute põhjal): k, t0, suguküpsus, b
update public.fish_species s set g_k = coalesce(s.g_k, v.k), g_t0 = coalesce(s.g_t0, v.t0), g_mat = coalesce(s.g_mat, v.m), g_b = coalesce(s.g_b, v.b)
from (values ('ahven',.20,-.5,3,3.15),('sarg',.18,-.6,3,3.1),('roosarg',.17,-.6,3,3.1),('haug',.20,-.4,3,3.05),('koha',.17,-.5,4,3.1),('latikas',.12,-.8,6,3.2),
  ('angerjas',.08,-1,10,3.2),('lohe',.35,0,4,3.0),('meriforell',.25,-.2,4,3.0),('joeforell',.30,-.3,3,3.0),('vikerforell',.35,-.2,3,3.05),('raim',.35,-.5,2,3.15),
  ('kilu',.50,-.5,1.5,3.1),('tursk',.15,-.3,3,3.05),('lest',.25,-.4,3,3.15),('linask',.15,-.6,4,3.15),('luts',.17,-.5,3,3.05),('siig',.30,-.4,4,3.1),
  ('raabis',.50,-.3,2,3.1),('saga',.10,-.6,4,3.0),('tuur',.05,-1.5,15,3.1),('karpkala',.20,-.5,4,3.1),('harjus',.30,-.4,3,3.1),('sainas',.15,-.6,4,3.1),
  ('toogjas',.18,-.5,4,3.1),('turb',.15,-.5,4,3.1),('tuun',.10,-1,5,3.0),('makrell',.30,-1,2,3.2),('kiisk',.25,-.5,2,3.1),('tint',.40,-.3,2,3.1),
  ('viidikas',.40,-.3,2,3.1),('teib',.25,-.5,3,3.05),('koger',.20,-.5,3,3.2),('hobekoger',.25,-.5,2,3.2),('vimb',.20,-.5,4,3.1),('nurg',.18,-.6,4,3.15),
  ('nokkhaug',.30,-.5,2,3.0),('kammeljas',.20,-.5,4,3.2),('amuur',.20,-.5,5,3.0),('hobekarp',.20,-.5,4,3.0),('merikurat',.12,-.5,6,3.1),('mookkala',.18,-1,4,3.2),
  ('paalia',.18,-.5,5,3.05),('peled',.30,-.4,3,3.1),('vahk',.15,-.5,3,3.0)) as v(id, k, t0, m, b)
where s.id = v.id;
-- ülejäänud liigid (sh muinasjutulised): mudel liigi pikkuse ja eluea põhjal
update public.fish_species set g_b = 3 where g_b is null;
update public.fish_species set g_k = round(2.9 / greatest(1, max_age)::numeric, 4) where g_k is null and max_age is not null;
update public.fish_species set g_t0 = -0.3 where g_t0 is null;
update public.fish_species set g_mat = greatest(0.5, round(max_age * 0.15, 1)) where g_mat is null and max_age is not null;
update public.fish_species set g_linf = round(max_len * 1.12, 1) where g_linf is null and max_len is not null;
-- vanuseklasside piirid: noor < suguküpsus; noor täiskasvanu < küpsus + 25% ülejäänud elueast; täiskasvanud < 60% elueast; vana < 85%
update public.fish_species set g_cls = array[g_mat, round(g_mat + (max_age - g_mat) * 0.25, 1), round(greatest(g_mat + (max_age - g_mat) * 0.3, max_age * 0.6), 1), round(max_age * 0.85, 1)]
  where g_cls is null and max_age is not null and g_mat is not null;

alter table public.fish_catches add column if not exists length_cm numeric;
alter table public.fish_catches add column if not exists age numeric;
alter table public.fish_catches add column if not exists age_cls smallint;

-- vanuseklass aastate järgi (0 noor, 1 noor täiskasvanu, 2 täiskasvanud, 3 vana, 4 erakordselt vana)
create or replace function public.fx_age_cls(s public.fish_species, t numeric) returns smallint language sql immutable as $$
  select case when s.g_cls is null then null when t < s.g_cls[1] then 0 when t < s.g_cls[2] then 1 when t < s.g_cls[3] then 2 when t < s.g_cls[4] then 3 else 4 end::smallint $$;
-- ühe kala pikkus ja vanus: kaal → pikkus (liigi pikkuse-kaalu seos + kala toitumus), pikkus → vanus (liigi kasvukõver)
-- Juhuslik bioloogiline erinevus: toitumus ±12% (paks kala on lühem ja noorem), kasvukiirus ±15%, lõpp-pikkus ±8%
create or replace function public.fx_fish_bio(p_species text, p_w numeric) returns numeric[] language plpgsql volatile as $$
declare s public.fish_species; a numeric; cf numeric; l numeric; li numeric; ki numeric; t numeric; t97 numeric; mx numeric;
begin
  select * into s from public.fish_species where id = p_species;
  if s.id is null or s.max_len is null or s.max_w is null or s.g_k is null or coalesce(p_w, 0) <= 0 then return null; end if;
  a := s.max_w * 1000 / power(s.max_len, s.g_b);
  cf := 0.88 + random() * 0.24;
  l := power(p_w * 1000 / (a * cf), 1 / s.g_b);
  li := s.g_linf * (0.92 + random() * 0.16);
  ki := s.g_k * (0.85 + random() * 0.30);
  mx := greatest(1, s.max_age);
  t97 := s.g_t0 - ln(0.03) / ki;
  if l < li * 0.97 then t := s.g_t0 - ln(1 - l / li) / ki;
  else t := t97 + random() * greatest(0, mx * 1.1 - t97); -- täispikkuses kala võib olla väga erineva vanusega
  end if;
  t := greatest(0.2, least(mx * 1.15, t));
  t := case when t < 3 then round(t, 1) else round(t) end;
  return array[round(l, 1), t, public.fx_age_cls(s, t)];
end $$;
create or replace function public.fx_fish_bio_trg() returns trigger language plpgsql as $$
declare v numeric[];
begin
  if new.age is null and new.species is not null then
    v := public.fx_fish_bio(new.species, new.weight);
    if v is not null then new.length_cm := v[1]; new.age := v[2]; new.age_cls := v[3]::smallint; end if;
  end if;
  return new;
end $$;
drop trigger if exists fish_catches_bio on public.fish_catches;
create trigger fish_catches_bio before insert on public.fish_catches for each row execute function public.fx_fish_bio_trg();
-- varem püütud kalad saavad vanuse ühe korra (ainult need, kellel seda veel pole – olemasolevaid ei muudeta)
update public.fish_catches c set length_cm = v[1], age = v[2], age_cls = v[3]::smallint
  from (select id, public.fx_fish_bio(species, weight) v from public.fish_catches where age is null and species is not null) z
  where c.id = z.id and z.v is not null;

-- ---------------------------------------------------------------------
-- 2z7. Sadam: laevastik ja ekspeditsioonid
--   4 laevaklassi (6 näitajat), 7 täiustatavat osa (igaüks 0–5), meeskond (kapten, tüürimees, kalur),
--   5 järk-järgult avanevat piirkonda (3 avastatavat paika + boss), retked serveri taimeriga.
--   Saak läheb olemasolevasse kalade inventari (fish_catches), materjalid olemasolevatesse ladudesse.
-- ---------------------------------------------------------------------
create table if not exists public.fleet_ship_types (
  id text primary key, name text not null, descr text not null, rank int not null, price int not null, min_level int not null,
  spd int not null, vast int not null, cap int not null, avast int not null, kaitse int not null, pyuk int not null, sort int not null default 0
);
insert into public.fleet_ship_types (id,name,descr,rank,price,min_level,spd,vast,cap,avast,kaitse,pyuk,sort) values
 ('kaluripaat','Kaluripaat','Väike ühe mastiga purjepaat lähedaste vete jaoks. Hea esimene laev.',1,2500,8,10,30,8,10,5,15,1),
 ('avastaja','Avastajalaev','Kerge ja kiire kahe mastiga laev, mis leiab peidetud paiku.',2,12000,15,16,50,14,25,12,18,2),
 ('ekspeditsioon','Ekspeditsioonilaev','Tugev laev suure lastiruumi ja võrkudega pikkadeks retkedeks.',3,40000,25,14,80,28,30,25,30,4),
 ('kuninglik','Kuninglik laev','Kuninga uhke kolme mastiga sõjalaev. Julgeb minna ka Tulejärvele.',4,120000,35,20,120,45,40,45,40,6),
 ('draakonlaev','Draakonlaev','Pikk aerulaev draakonipeaga vööris ja kilpidega pardal. Aerud viivad edasi ka tuulevaikuses.',2,20000,18,19,55,12,20,20,16,3),
 ('kiirpurjekas','Kiirpurjekas','Sale kolme mastiga klipper – kuningriigi kiireim laev. Jõuab kohale enne, kui teised purjed heisanud.',3,65000,28,32,70,20,35,18,26,5),
 ('sojagaleon','Sõjagaleon','Kõrgete kastellide ja kahe kahurireaga raske galeon. Piraadid ja koletised mõtlevad kaks korda.',4,170000,38,15,160,40,30,66,30,7),
 ('kuldgaleon','Kuldne galeon','Legendaarne kuldsete purjede ja laternatega galeon. Kõiges tugev – ja kõige uhkem vaatepilt merel.',5,420000,45,26,150,55,50,60,50,8)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, rank=excluded.rank, price=excluded.price, min_level=excluded.min_level,
  spd=excluded.spd, vast=excluded.vast, cap=excluded.cap, avast=excluded.avast, kaitse=excluded.kaitse, pyuk=excluded.pyuk, sort=excluded.sort;

-- piirkonnad: kalaliigid on olemasolevad liigid (fish_species), uusi kalakirjeid ei looda
create table if not exists public.fleet_regions (
  id text primary key, name text not null, ord int not null, descr text not null, diff int not null, min_rank int not null,
  minutes int not null, food int not null, spot text not null, species text[] not null, res jsonb not null, sites jsonb not null, boss jsonb not null
);
insert into public.fleet_regions (id,name,ord,descr,diff,min_rank,minutes,food,spot,species,res,sites,boss) values
 ('metsajarv','Metsajärv',1,'Kodune metsajärv kuuskede vahel. Rahulik vesi, kuid sügavamal ujub vana kuningas.',1,1,10,10,'metsajarv',
  '{ahven,sarg,haug,latikas,kiisk,linask,koha,angerjas,kristallahven,kuldahven,rubiinahven,kummitusforell}',
  '{"mats":{"luu":[2,6],"soomus":[1,3]},"items":{"karp":0.5,"merevaik":0.15},"baits":{"mais":[3,8]}}',
  '[{"id":"pilliroog","name":"Pilliroo laht","descr":"Tihe pilliroog, kus haugid varitsevad.","find":{"gold":200,"items":{"karp":3}}},
    {"id":"vanapaat","name":"Uppunud kaluripaat","descr":"Vana paadi vrakk järve põhjas.","find":{"gold":350,"items":{"parl":1},"baits":{"soomuslant":5}}},
    {"id":"kuuskesaar","name":"Kuuskede saareke","descr":"Pisike saar keset järve, kus keegi pole käinud.","find":{"gold":500,"items":{"merevaik":2}}}]',
  '{"id":"vanahaug","name":"Metsajärve Vanahaug","descr":"Sajandivanune hiidhaug, kes on murdnud tuhat õnge.","hp":400,"atk":20,"fish":"joekuningas","reward":{"gold":3000,"items":{"ruun":2},"mats":{"kuldsoomus":2},"baits":{"haldjatolm":5}}}'),
 ('sugavjarv','Sügavjärv',2,'Tume ja külm järv, mille põhja pole keegi näinud. Sügavuses elavad suured kalad.',2,1,20,18,'kuninglik',
  '{latikas,koha,saga,luts,angerjas,siig,tuur,laternkala,kirveskala,kuldnesaga,merihunt}',
  '{"mats":{"luu":[4,10],"soomus":[2,5],"iidneluu":[0,1]},"items":{"parl":0.4,"merevaik":0.3,"koopakristall":0.1},"baits":{"valgus":[2,5]}}',
  '[{"id":"kaljusein","name":"Kaljune kallas","descr":"Järsk kalju, mille all algab sügavik.","find":{"gold":700,"items":{"koopakristall":1}}},
    {"id":"voorikoobas","name":"Veealune koobas","descr":"Koobas, kust paistab nõrk helendus.","find":{"gold":900,"items":{"parl":2},"baits":{"valgus":5}}},
    {"id":"sugavik","name":"Põhjatu auk","descr":"Järve sügavaim koht. Siit kostab kummalisi hääli.","find":{"gold":1200,"items":{"mustparl":1}}}]',
  '{"id":"sugavsaga","name":"Sügavuste Säga","descr":"Paadisuurune säga, kes elab järve sügavaimas augus.","hp":900,"atk":30,"fish":"saga","reward":{"gold":8000,"items":{"mustparl":2,"kristall":1},"mats":{"iidneluu":2},"baits":{"valgus":10}}}'),
 ('udusoo','Udusoo järv',3,'Soode keskel olev järv, mida katab alati udu. Siin elavad kalad, keda mujal ei näe.',3,2,35,28,'udulaht',
  '{linask,koger,vingerjas,mudamaim,hink,udukala,uduhobe,haldjakala,hallhaug,myrgikuningas,kummitusforell}',
  '{"mats":{"soomus":[3,7],"kuldsoomus":[0,1]},"items":{"ruun":0.25,"parl":0.4},"baits":{"haldjatolm":[1,3]}}',
  '[{"id":"turbasaar","name":"Õõtsuv turbasaar","descr":"Saar, mis kõigub jalge all.","find":{"gold":1500,"items":{"ruun":1}}},
    {"id":"virvatuli","name":"Virvatulede laht","descr":"Siin tantsivad öösel virvatuled.","find":{"gold":1800,"baits":{"haldjatolm":6}}},
    {"id":"nõiaonn","name":"Vana nõia onn","descr":"Kaldal seisab ammu mahajäetud onn täis kummalisi purke.","find":{"gold":2500,"items":{"kristall":1,"ruun":1}}}]',
  '{"id":"uduvaim","name":"Udusoo Vaim","descr":"Udust koosnev hiiglaslik kala, keda näeb vaid hetkeks.","hp":1600,"atk":40,"fish":"hallhaug","reward":{"gold":15000,"items":{"kristall":2,"ruun":3},"mats":{"kuldsoomus":4},"baits":{"haldjatolm":10}}}'),
 ('kulmajarv','Külmajärv',4,'Põhjas asuv jäine järv, kus ka suvel ujuvad jäätükid. Siin peab laev olema tugev.',4,3,55,40,'jaa',
  '{siig,raabis,paalia,luts,harjus,jaaahven,jaahaug,virmaliskala,igijaavaim,kristallangerjas,tahehaug}',
  '{"mats":{"kuldsoomus":[1,2],"iidneluu":[0,2]},"items":{"kristall":0.25,"koopakristall":0.4},"baits":{"kuldvobler":[0,1]}}',
  '[{"id":"jaamagi","name":"Jäämägi","descr":"Hiiglaslik jäämägi, mille sees on külmunud vanad asjad.","find":{"gold":3000,"items":{"koopakristall":3}}},
    {"id":"virmalisrand","name":"Virmaliste rand","descr":"Rand, mille kohal säravad iga öö virmalised.","find":{"gold":3500,"items":{"kristall":1}}},
    {"id":"jaapalee","name":"Jääpalee varemed","descr":"Ammu unustatud kuninga jääst palee.","find":{"gold":5000,"items":{"kristall":2,"sormus":1}}}]',
  '{"id":"jaakuningas","name":"Jääkuningas","descr":"Jäisest soomusest hiidkala, kelle hingeõhk külmutab vee.","hp":2600,"atk":55,"fish":"igijaavaim","reward":{"gold":25000,"items":{"soomus":1,"kristall":2},"mats":{"kuldsoomus":6},"baits":{"kuldvobler":1}}}'),
 ('tulejarv','Tulejärv',5,'Vulkaani kraatris olev kuum järv. Vesi auravad ja põhjas hõõgub laava.',5,4,80,60,'salajane',
  '{paikesekarp,kuldkala,valgukala,tormihaug,vikerkaarekala,jarvelohe,sugavusedraakon,aikeseangerjas,vikerkaarekuningas,ajakala}',
  '{"mats":{"kuldsoomus":[2,4],"iidneluu":[1,2]},"items":{"mustparl":0.3,"kristall":0.35,"soomus":0.05},"baits":{"draakonilant":[0,1]}}',
  '[{"id":"laavasild","name":"Laavasild","descr":"Jahtunud laavast kaar üle järve.","find":{"gold":8000,"items":{"mustparl":2}}},
    {"id":"tulesaar","name":"Tulesaar","descr":"Saar, kus kuumad allikad purskavad taevasse.","find":{"gold":10000,"items":{"kristall":2}}},
    {"id":"draakonikoobas","name":"Draakoni koobas","descr":"Koopas lebab kuldne kuhi – ja keegi valvab seda.","find":{"gold":15000,"items":{"soomus":1,"sormus":2}}}]',
  '{"id":"tuledraakon","name":"Tuledraakon","descr":"Laavast tõusev draakonkala – kõige ohtlikum olend kõigis vetes.","hp":4000,"atk":75,"fish":"sugavusedraakon","reward":{"gold":50000,"items":{"soomus":2,"mustparl":3},"mats":{"iidneluu":5},"baits":{"draakonilant":1}}}')
on conflict (id) do update set name=excluded.name, ord=excluded.ord, descr=excluded.descr, diff=excluded.diff, min_rank=excluded.min_rank, minutes=excluded.minutes,
  food=excluded.food, spot=excluded.spot, species=excluded.species, res=excluded.res, sites=excluded.sites, boss=excluded.boss;

create table if not exists public.fisher_fleet (
  user_id uuid primary key references auth.users(id) on delete cascade,
  crew jsonb not null default '{"kapten":1,"tuurimees":1,"kalur":1}', voyages int not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.fisher_ships (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, type text not null references public.fleet_ship_types(id),
  parts jsonb not null default '{}', cond int not null default 100 check (cond between 0 and 100), voyages int not null default 0,
  created_at timestamptz not null default now(), unique (user_id, type)
);
create table if not exists public.fisher_regions (
  user_id uuid not null references auth.users(id) on delete cascade, region text not null references public.fleet_regions(id),
  sites text[] not null default '{}', boss_hp int, boss_dead boolean not null default false, visits int not null default 0,
  opened_at timestamptz not null default now(), primary key (user_id, region)
);
create table if not exists public.fisher_voyages (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, ship_id bigint not null references public.fisher_ships(id) on delete cascade,
  region text not null references public.fleet_regions(id), kind text not null, started_at timestamptz not null default now(), ready_at timestamptz not null,
  status text not null default 'sea', result jsonb, taken_at timestamptz -- sea → (choice) → done
);
create unique index if not exists fisher_voyages_one on public.fisher_voyages(ship_id) where status in ('sea','choice');
create index if not exists fisher_voyages_user on public.fisher_voyages(user_id, status);
alter table public.fish_catches add column if not exists expedition text;
do $$ declare t text; begin
  foreach t in array array['fleet_ship_types','fleet_regions','fisher_fleet','fisher_ships','fisher_regions','fisher_voyages'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2t. Kes on mängus (online)
alter table public.profiles add column if not exists last_seen timestamptz;
alter table public.profiles add column if not exists last_where text;
create index if not exists profiles_last_seen_idx on public.profiles(last_seen);

-- 2u. Järve kalurid igal pool: oma kuningriik, akvaarium, turg, kalatund, monument, retk ja kingid
alter table public.fish_bots add column if not exists kname text;
alter table public.fish_bots add column if not exists k_level int;
alter table public.fish_bots add column if not exists k_fame numeric not null default 0;
alter table public.fish_bots add column if not exists k_at timestamptz;
alter table public.fish_bots add column if not exists aq_likes int not null default 0;
update public.fish_bots b set kname = v.kn, k_level = v.kl, k_fame = 12 * v.kl * v.kl, k_at = now()
  from (values ('ants','Haugiranna kuningriik',18), ('kaia','Kiirevoolu kuningriik',9), ('toomas','Tormilahe kuningriik',14), ('mariliis','Kuldjärve kuningriik',12),
               ('peeter','Avamere kuningriik',22), ('jaan','Jääkülma kuningriik',11), ('liisu','Päikesesaare kuningriik',4), ('heino','Saarte kuningriik',16)) v(id, kn, kl)
  where b.id = v.id and b.kname is null;
update public.fish_bots set kname = name || ' kuningriik', k_level = greatest(1, base_level / 2), k_fame = 12 * power(greatest(1, base_level / 2), 2), k_at = now() where kname is null;
create table if not exists public.bot_gifts (sender uuid not null references auth.users(id) on delete cascade, bot text not null, day date not null, primary key (sender, bot, day));
create table if not exists public.bot_gift_in (user_id uuid not null references auth.users(id) on delete cascade, day date not null, bot text not null, primary key (user_id, day));
create table if not exists public.bot_aq_likes (visitor uuid not null references auth.users(id) on delete cascade, bot text not null, day date not null, primary key (visitor, bot, day));
create table if not exists public.kingdom_monument_bot (stage int not null, bot text not null, total int not null default 0, primary key (stage, bot));
create table if not exists public.kalatund_bot_score (day date not null, bot text not null, pts int not null default 0, fish int not null default 0, dmg int not null default 0, primary key (day, bot));
alter table public.kalatund_boss add column if not exists killer_bot text;
-- Kalatunni koletis tuleb kaks korda: pärast esimest alistamist tõuseb ta uuesti (tugevamana)
alter table public.kalatund_boss add column if not exists max_hp2 int;
alter table public.kalatund_boss add column if not exists killed1_at timestamptz;
alter table public.kalatund_boss add column if not exists killer1 uuid;
alter table public.kalatund_boss add column if not exists killer1_bot text;
-- tänane koletis saab ka teise elu (kui ta oli juba alistatud, tõuseb ta uuesti)
update public.kalatund_boss set max_hp2 = round(max_hp * 1.5),
  killed1_at = killed_at, killer1 = killer, killer1_bot = killer_bot, killed_at = null, killer = null, killer_bot = null
where day = (now() at time zone 'Europe/Tallinn')::date and max_hp2 is null;
alter table public.fish_market alter column seller drop not null;
alter table public.fish_market alter column catch_id drop not null;
alter table public.fish_market add column if not exists bot text;
alter table public.fish_market add column if not exists buyer_bot text;
alter table public.fish_market add column if not exists bot_catch bigint;
alter table public.fish_market add column if not exists spot text;
alter table public.lab_market add column if not exists buyer_bot text;
do $$ declare t text; begin
  foreach t in array array['bot_gifts','bot_gift_in','bot_aq_likes','kingdom_monument_bot','kalatund_bot_score'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 2v. Kalurimaja ja Udulaht: vana kaluri Villemi maja, mida taastatakse tuba-toa haaval (kulla, kuningriigi puidu ja kiviga)
insert into public.fish_spots (id,name,descr,min_level,difficulty,bonus,sort) values
 ('udulaht','Udulaht','Udune roostikuline laht, mille kaldal seisab vana kaluri Villemi maja. Siin saab püüda, kui maja paadisild on korda tehtud.',10,3,0.07,3)
on conflict (id) do update set name = excluded.name, descr = excluded.descr, min_level = excluded.min_level, difficulty = excluded.difficulty, bonus = excluded.bonus, sort = excluded.sort;
update public.fish_species set spots = spots || '{udulaht}'::text[]
  where id in ('ahven','sarg','kiisk','latikas','roosarg','nurg','linask','koger','haug','vingerjas','mudamaim','koha','angerjas','uduhobe','kuldahven') and not ('udulaht' = any(spots));
-- legend: Villemi hallhaug (püütav ainult Udulahes, kui maja pööning on korras; udus ja öösel sagedamini)
insert into public.fish_species
select (jsonb_populate_record(null::public.fish_species, to_jsonb(h) || jsonb_build_object(
  'id', 'hallhaug', 'name', 'Villemi hallhaug', 'rarity', 5, 'min_w', 12, 'max_w', 24, 'price', 900, 'xp', 420, 'spots', '{udulaht}'::text[], 'min_level', 10,
  'difficulty', 9, 'look', '{"c":["#9aa4a8","#4a5458","#e2e6e6","#7a8488"],"s":"l","sp":1,"g":"#d8e4ea"}'::jsonb, 'sort', 120, 'event', 'kustas', 'real', false,
  'max_len', 140, 'weather', null, 'descr', 'Vana kaluri Villemi legend: hiiglaslik hall haug, kes on Udulahes elanud kauem, kui keegi mäletab. Võtab udus või öösel ja ainult sellelt, kes on lahe maja korda teinud.'))).*
from public.fish_species h where h.id = 'haug'
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, min_w = excluded.min_w, max_w = excluded.max_w, price = excluded.price, xp = excluded.xp,
  spots = excluded.spots, difficulty = excluded.difficulty, look = excluded.look, event = excluded.event, real = excluded.real, max_len = excluded.max_len, descr = excluded.descr;
create table if not exists public.fish_cabin_rooms (
  id text primary key, sort int not null, icon text not null, name text not null, descr text not null, bonus text not null,
  gold int not null, wood int not null, stone int not null, hours numeric not null, min_level int not null, page text not null
);
insert into public.fish_cabin_rooms (id, sort, icon, name, descr, bonus, gold, wood, stone, hours, min_level, page) values
 ('sild', 1, '🛶', 'Paadisild', 'Kõdunenud sild ja vana paat lahe kaldal.', 'Avab Udulahe püügikoha; seal näkkab 15% kiiremini.', 600, 120, 30, 1, 10,
  'Kevad. Parandasin silla. Paat on vana, aga peab veel vett. Udu tõuseb igal hommikul lahelt nagu hingeõhk. Isa ütles, et laht hingab, sest selle põhjas elab keegi.'),
 ('suitsukoda', 2, '🔥', 'Suitsuköök', 'Kivist suitsuahi ja lepapuu riit.', 'Kalade müügihind +8%.', 1400, 220, 120, 2, 11,
  'Suitsuahi töötab jälle. Kui lepapuud suitsu sisse panna, tulevad isegi naabrid küsima. Täna nägin vees varju – pikem kui mu paat. Ilmselt palk. Ilmselt.'),
 ('aidake', 3, '🪢', 'Võrguait', 'Ait, kus võrgud ja mõrrad kuivavad.', 'Püünised valmivad 25% kiiremini.', 2000, 280, 80, 3, 12,
  'Võrgud on paigas. Hommikul olid kaks võrku keskelt läbi rebitud, nagu oleks keegi neist lihtsalt läbi ujunud. Palk ei rebi võrku.'),
 ('laternatuba', 4, '🏮', 'Laternatuba', 'Tuba, mille aknast paistab latern üle lahe.', 'Öösel püütud kalad annavad 15% rohkem kogemust.', 3000, 200, 200, 4, 13,
  'Panin akna peale laterna. Öösel tuleb see vari valguse juurde. Hall nagu udu ise ja silmad nagu kaks vana hõbemünti. Haug. Kõige suurem haug, keda ma elus näinud olen.'),
 ('poonung', 5, '📜', 'Pööning', 'Tolmune pööning, kus on vana kirst.', 'Villemi päevik: Udulahes saab püüda legendaarset hallhaugi.', 4500, 350, 150, 5, 14,
  'Kirjutan selle pööningule, et keegi kunagi leiaks: hallhaug võtab ainult udus või öösel ja ainult sellelt, kes on lahe maja korda teinud. Ta tunneb ära, kes siin elab. Mina olen liiga vana. Võib-olla sina. — Villem'),
 ('majakas', 6, '🗼', 'Majakas', 'Väike kivimajakas kaljunukil.', 'Udulahes on haruldasi kalu rohkem (+6% õnne).', 7000, 300, 400, 8, 16,
  'Majakas põleb. Nüüd leiavad ka teised kalurid tee Udulahte. Kui näed udus halli varju – ära kiirusta. Ta on oodanud kaua.')
on conflict (id) do update set sort = excluded.sort, icon = excluded.icon, name = excluded.name, descr = excluded.descr, bonus = excluded.bonus, gold = excluded.gold,
  wood = excluded.wood, stone = excluded.stone, hours = excluded.hours, min_level = excluded.min_level, page = excluded.page;
create table if not exists public.fisher_cabin (
  user_id uuid not null references auth.users(id) on delete cascade, room text not null references public.fish_cabin_rooms(id),
  started_at timestamptz not null default now(), done_at timestamptz not null, primary key (user_id, room)
);
do $$ declare t text; begin
  foreach t in array array['fish_cabin_rooms','fisher_cabin'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 2w. Hooajakalad: oma aastaajal võtavad kolm korda paremini, väljaspool hooaega harva (aga mitte kunagi päris null)
alter table public.fish_species add column if not exists season text[];
update public.fish_species s set season = v.se from (values
 ('raim','{kevad}'::text[]), ('vimb','{kevad}'), ('sainas','{kevad}'), ('haug','{kevad}'), ('tint','{talv,kevad}'), ('luts','{talv}'), ('tursk','{talv}'),
 ('lohe','{sügis}'), ('meriforell','{sügis}'), ('siig','{sügis}'), ('angerjas','{suvi}'), ('linask','{suvi}'), ('karpkala','{suvi}'), ('latikas','{suvi}'), ('koha','{suvi,sügis}')
) v(id, se) where s.id = v.id;

-- 2x. Kaluri statistika: uued saavutused
insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('kirst10','Suur aardekütt','Leia 10 veealust aardekirstu',null,2000,800,90),
 ('oo100','Öö valitseja','Püüa öösel 100 kala','Öö valitseja',1500,700,91),
 ('voit10','Võistluste kuningas','Võida 10 kalapüügivõistlust','Võistluste kuningas',8000,3000,92),
 ('boss1','Koletise alistaja','Aita Kalatunnis järvekoletis alistada',null,1500,600,93)
on conflict (id) do update set name = excluded.name, descr = excluded.descr, title = excluded.title, reward_gold = excluded.reward_gold, reward_xp = excluded.reward_xp, sort = excluded.sort;

-- 2y. Kalastuskaardid: õigus püügiviisidele ja püügikohtadele (kehtivust kontrollib server oma kella järgi)
create table if not exists public.fish_license_types (
  id text primary key, sort int not null, icon text not null, name text not null, color text not null,
  days int not null, price int not null, min_level int not null default 1, need_total int not null default 0, need_ach int not null default 0,
  descr text not null, gives text not null
);
insert into public.fish_license_types (id, sort, icon, name, color, days, price, min_level, need_total, need_ach, descr, gives) values
 ('harrastus', 1, '🎣', 'Harrastuskaluri kaart', 'roheline', 30, 300, 1, 0, 0, 'Annab õiguse tavaliseks õngepüügiks. Võimaldab kasutada tavalisi püügikohti.', 'Õngepüük kõigis tavalistes püügikohtades. Ilma kaardita saab püüda ainult Metsajärves.'),
 ('vork', 2, '🕸️', 'Nakkevõrgu kaart', 'sinine', 7, 400, 4, 0, 0, 'Annab õiguse kasutada nakkevõrke. Võimaldab püüda suuremaid kalakoguseid.', 'Nakkevõrgu vettepanek.'),
 ('pyynis', 3, '🪤', 'Püüniste kaart', 'pruun', 7, 300, 3, 25, 0, 'Annab õiguse kasutada spetsiaalseid kalapüüniseid. Võimaldab püüda kala ka siis, kui mängija ise ei kalasta.', 'Mõrra, katiska ja vähimõrra vettepanek.'),
 ('sugavee', 4, '🚤', 'Süvaveekaluri kaart', 'lilla', 7, 2500, 28, 500, 0, 'Avab ligipääsu sügavamatele püügikohtadele. Võimaldab püüda spetsiaalseid süvaveekalu.', 'Püük Avamerel ja Sügavikus (lisaks on vaja ka paati).'),
 ('kuninglik', 5, '👑', 'Kuninglik kalastuskaart', 'kuldne', 30, 20000, 30, 1500, 10, 'Eriline kaart kogenud kaluritele. Annab ligipääsu kuningriigi eksklusiivsetele püügialadele ja erilistele kalastusüritustele.', 'Püük Kuninga tiigis ja osalemine Kuninglikul nädalavõistlusel.')
on conflict (id) do update set sort = excluded.sort, icon = excluded.icon, name = excluded.name, color = excluded.color, days = excluded.days, price = excluded.price,
  min_level = excluded.min_level, need_total = excluded.need_total, need_ach = excluded.need_ach, descr = excluded.descr, gives = excluded.gives;
create table if not exists public.fisher_licenses (
  user_id uuid not null references auth.users(id) on delete cascade, kind text not null references public.fish_license_types(id),
  until timestamptz not null, primary key (user_id, kind)
);
create table if not exists public.fish_license_log (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, kind text not null,
  at timestamptz not null default now(), price int not null, until timestamptz not null, what text not null
);
create index if not exists fish_license_log_user on public.fish_license_log(user_id, at desc);
alter table public.fisher_licenses enable row level security;
alter table public.fish_license_log enable row level security;
-- vana nakkevõrgu kalastuskaart kantakse uude süsteemi üle
insert into public.fisher_licenses(user_id, kind, until) select user_id, 'vork', license_until from public.fishers where license_until > now() on conflict do nothing;
-- Kuninga tiik: eksklusiivne püügiala kuningliku kalastuskaardiga
insert into public.fish_spots (id,name,descr,min_level,difficulty,bonus,sort) values
 ('kuningatiik','Kuninga tiik','Lossiaia kuldsete purskkaevudega tiik. Siin võivad püüda ainult kuningliku kalastuskaardi omanikud – ja siin elavad kalad, keda mujal ei leia.',30,4,0.18,10)
on conflict (id) do update set name = excluded.name, descr = excluded.descr, min_level = excluded.min_level, difficulty = excluded.difficulty, bonus = excluded.bonus, sort = excluded.sort;
update public.fish_species set spots = spots || '{kuningatiik}'::text[]
  where id in ('linask','latikas','karpkala','hobekarp','amuur','kuningkarp','kuldahven','vikerkaarekala','kuuangerjas','kuldkala') and not ('kuningatiik' = any(spots));
insert into public.fish_species
select (jsonb_populate_record(null::public.fish_species, to_jsonb(h) || x.j || jsonb_build_object('spots', '{kuningatiik}'::text[], 'real', false, 'season', null, 'event', null, 'weather', null, 'night_only', false, 'winter_only', false))).*
from (values
  ('ahven', jsonb_build_object('id','kroonahven','name','Kroonahven','rarity',3,'min_w',0.3,'min_level',30,'max_w',2.5,'price',60,'xp',45,'difficulty',6,'max_len',50,'sort',130,
     'look','{"c":["#e8c050","#6a3a8a","#fff2c0","#9a4ad0"],"s":"n","st":6,"g":"#ffe08a"}'::jsonb,'baits','{uss,vagel}'::text[],'times','{hommik,päev}'::text[],
     'descr','Lossiaia ahven, kelle triibud säravad kullast ja purpurist. Ujub parvedes purskkaevude all.')),
  ('karpkala', jsonb_build_object('id','lossikarp','name','Lossikarp','rarity',4,'min_w',4,'min_level',30,'max_w',28,'price',160,'xp',120,'difficulty',8,'max_len',110,'sort',131,
     'look','{"c":["#b88ae0","#4a2a7a","#f4e8ff","#ffd060"],"s":"d","sp":1,"g":"#e0c0ff"}'::jsonb,'baits','{mais,uss}'::text[],'times','{õhtu}'::text[],
     'descr','Kuninga lemmikkala: lilla soomus kuldsete äärtega. Lossi kokad hoiavad teda kõige suuremas aus.')),
  ('joeforell', jsonb_build_object('id','kroonforell','name','Kuninglik forell','rarity',4,'min_w',1,'min_level',30,'max_w',9,'price',170,'xp',125,'difficulty',8,'max_len',85,'sort',132,
     'look','{"c":["#f0d090","#7a4a1e","#fff6e0","#e04a6a"],"s":"n","sp":1,"g":"#ffd8a0"}'::jsonb,'baits','{vagel,hobelant}'::text[],'times','{hommik}'::text[],
     'descr','Kuldsete täppidega forell, kes kasvab ainult lossiaia puhtas allikavees.')),
  ('saga', jsonb_build_object('id','kuningasaga','name','Kuningasäga','rarity',5,'min_w',20,'min_level',30,'max_w',110,'price',950,'xp',600,'difficulty',10,'max_len',260,'sort',133,
     'look','{"c":["#4a3a6a","#1a1230","#c8b8e0","#ffd040"],"s":"l","w":1,"g":"#ffd870"}'::jsonb,'baits','{uss,valgus,kuldvobler}'::text[],'times','{öö}'::text[],
     'descr','Tiigi põhjas elav vana hiiglane, kelle vurrud on kullakarva. Legendi järgi on ta tiigis elanud sama kaua kui loss.')),
  ('haldjakala', jsonb_build_object('id','kroonkala','name','Kuninga kroonkala','rarity',6,'min_w',8,'min_level',30,'max_w',40,'price',3200,'xp',1600,'difficulty',10,'max_len',150,'sort',134,
     'look','{"c":["#ffd040","#a0600a","#fff4c0","#ff8a3a"],"b":"#ffe890","s":"d","g":"#ffe060"}'::jsonb,'baits','{kuldvobler}'::text[],'times','{õhtu}'::text[],
     'descr','Müütiline kala, kelle seljauim on kroonikujuline. Öeldakse, et kes ta püüab, see on kuninga silmis tõeline kalur.'))
) as x(tpl, j) join public.fish_species h on h.id = x.tpl
on conflict (id) do update set name = excluded.name, rarity = excluded.rarity, min_w = excluded.min_w, max_w = excluded.max_w, price = excluded.price, xp = excluded.xp,
  spots = excluded.spots, min_level = excluded.min_level, difficulty = excluded.difficulty, look = excluded.look, max_len = excluded.max_len, descr = excluded.descr,
  baits = excluded.baits, times = excluded.times, sort = excluded.sort;

-- 2z. Äraoleku kokkuvõte ja Järve kalurite tegevused mängija heaks
alter table public.profiles add column if not exists away_from timestamptz;
alter table public.fish_aq_likes add column if not exists at timestamptz;
alter table public.fish_aq_likes alter column at set default now();
alter table public.bot_gift_in add column if not exists at timestamptz;
alter table public.bot_gift_in alter column at set default now();
create table if not exists public.bot_aq_likes_in (
  owner uuid not null references auth.users(id) on delete cascade, bot text not null, day date not null, at timestamptz not null default now(),
  primary key (owner, bot, day)
);
alter table public.bot_aq_likes_in enable row level security;
create index if not exists fish_market_seller_closed on public.fish_market(seller, closed_at);
create index if not exists fish_news_at on public.fish_news(at);

-- 2z2. Loodus mängija äraolekul: tormikahjud Kalurimajas (boonus kaob, kuni ruum on parandatud)
alter table public.fisher_cabin add column if not exists damage boolean not null default false;
alter table public.fisher_cabin add column if not exists dmg_at timestamptz;
create table if not exists public.fish_cabin_damage (
  room text primary key references public.fish_cabin_rooms(id), what text not null, gold int not null, wood int not null, stone int not null
);
insert into public.fish_cabin_damage (room, what, gold, wood, stone) values
 ('sild', 'Tormilained lõhkusid paadisilla laudu – paadiga Udulahte ei pääse.', 120, 40, 0),
 ('suitsukoda', 'Tuul lükkas suitsuahju korstna viltu – ahi ei tõmba.', 200, 20, 40),
 ('aidake', 'Torm rebis võrguaida ukse hingedelt ja võrgud said märjaks.', 200, 50, 0),
 ('laternatuba', 'Aknaklaas purunes ja latern kustus.', 300, 15, 10),
 ('poonung', 'Katus hakkas lekkima – pööning ja Villemi päevik said märjaks.', 350, 60, 20),
 ('majakas', 'Välk tabas majakat ja tuli kustus.', 500, 0, 60)
on conflict (room) do update set what = excluded.what, gold = excluded.gold, wood = excluded.wood, stone = excluded.stone;

-- 2z3. Kalatöötlemine: kalapuhastus, materjalid, retseptid, töökoda, tööriistad, maine, tellimused ja värskus
alter table public.fish_catches add column if not exists fresh_at timestamptz;
alter table public.fish_catches alter column fresh_at set default now();
update public.fish_catches set fresh_at = now() where fresh_at is null and status = 'kept';
alter table public.fish_baits add column if not exists craft boolean not null default false;
insert into public.fish_baits (id,name,price,min_level,wait_mult,rarity_bonus,consumable,descr,sort,craft) values
 ('kalasoot','Kalasööt',2,1,0.80,0.05,true,'Isetehtud sööt kalajäätmetest. Valmistatakse Kalurimaja söödalaual.',11,true),
 ('soomuslant','Soomuslant',5,1,0.78,0.08,true,'Kalasoomustest läikiv lant – röövkalad ei suuda vastu panna. Valmistatakse söödalaual.',12,true),
 ('erisoot','Erisööt',12,1,0.70,0.13,true,'Meistri erisööt fileest ja marjadest – meelitab haruldasi kalu. Valmistatakse söödalaual.',13,true)
on conflict (id) do update set name=excluded.name, price=excluded.price, min_level=excluded.min_level, wait_mult=excluded.wait_mult,
  rarity_bonus=excluded.rarity_bonus, consumable=excluded.consumable, descr=excluded.descr, sort=excluded.sort, craft=excluded.craft;
create table if not exists public.fish_mats (
  id text primary key, sort int not null, name text not null, descr text not null, rarity int not null default 1, price int not null, kind text not null default 'mat'
);
insert into public.fish_mats (id, sort, name, descr, rarity, price, kind) values
 ('filee', 1, 'Kalafilee', 'Puhas valge filee. Sellest tehakse suitsukala, suppi ja erisööta – ja kõrts ostab seda alati.', 1, 6, 'mat'),
 ('filee_hea', 2, 'Esmaklassiline filee', 'Meistri käega lõigatud laitmatu filee. Sellest tuleb kuldne suitsufilee.', 2, 11, 'mat'),
 ('luu', 3, 'Kalaluud', 'Peened tugevad luud – neist meisterdatakse konkse, kaunistusi ja tööriistu.', 1, 2, 'mat'),
 ('jaatmed', 4, 'Kalajäätmed', 'Sisikond ja jäägid. Söödalaual saab neist kalasööta ja väetist.', 1, 1, 'mat'),
 ('soomus', 5, 'Kalasoomused', 'Läikivad soomused peibutiste, kaunistuste ja varustuse täiustamiseks.', 1, 3, 'mat'),
 ('kuldsoomus', 6, 'Kuldne soomus', 'Haruldase kala kuldselt helkiv soomus. Väga hinnatud meisterdamismaterjal.', 3, 60, 'mat'),
 ('iidneluu', 7, 'Iidne luu', 'Legendaarse kala luu, mis helendab vaikselt. Sellest sünnivad meistriteosed.', 5, 180, 'mat'),
 ('luukonks', 10, 'Luukonks', 'Käsitsi lihvitud konks kalaluust. Kõrts ja kalurid ostavad neid hea meelega.', 1, 9, 'prod'),
 ('suitsukala', 11, 'Suitsukala', 'Lepasuitsus kuldseks suitsutatud kala – ei rikne ja müüb kallilt.', 2, 30, 'prod'),
 ('kalasupp', 12, 'Kalasupp', 'Soe kalasupp marjadega. Saada kuningriigi kööki või müü kõrtsile.', 1, 18, 'prod'),
 ('kuldfilee', 13, 'Kuldne suitsufilee', 'Esmaklassilisest fileest pikalt suitsutatud delikatess.', 3, 55, 'prod'),
 ('soomuskaunistus', 14, 'Soomuskaunistus', 'Kuldsete soomustega kaunistus – kuningriigi majade uhkus.', 3, 160, 'prod'),
 ('kuningaamulett', 15, 'Kuninga amulett', 'Iidsest luust ja kuldsoomustest meistriteos. Kuninglik õukond maksab selle eest hästi.', 5, 900, 'prod')
on conflict (id) do update set sort = excluded.sort, name = excluded.name, descr = excluded.descr, rarity = excluded.rarity, price = excluded.price, kind = excluded.kind;
create table if not exists public.fish_recipes (
  id text primary key, sort int not null, station text not null, name text not null, descr text not null,
  out_kind text not null, out_id text not null, out_qty int not null, needs jsonb not null default '{}', res jsonb not null default '{}',
  skill int not null default 1, rep_need int not null default 0, ws int not null default 1, clicks int not null, xp int not null, rep int not null
);
insert into public.fish_recipes (id, sort, station, name, descr, out_kind, out_id, out_qty, needs, res, skill, rep_need, ws, clicks, xp, rep) values
 ('luukonks', 1, 'laud', 'Luukonks', 'Lihvi kolmest kalaluust tugev konks.', 'mat', 'luukonks', 1, '{"luu":3}', '{}', 1, 0, 1, 8, 6, 1),
 ('soomuskaunistus', 2, 'laud', 'Soomuskaunistus', 'Lao soomustest kuldse südamega kaunistus.', 'mat', 'soomuskaunistus', 1, '{"soomus":6,"kuldsoomus":1}', '{}', 8, 0, 1, 20, 30, 8),
 ('kuningaamulett', 3, 'laud', 'Kuninga amulett', 'Meistriteos iidsest luust, kuldsoomustest ja konksudest.', 'mat', 'kuningaamulett', 1, '{"iidneluu":1,"kuldsoomus":3,"luukonks":2}', '{}', 20, 1000, 1, 40, 150, 40),
 ('suitsukala', 4, 'ahi', 'Suitsukala', 'Suitsuta kolm fileed lepapuu suitsus.', 'mat', 'suitsukala', 1, '{"filee":3}', '{"wood":2}', 1, 0, 3, 12, 10, 2),
 ('kalasupp', 5, 'ahi', 'Kalasupp', 'Keeda fileest ja marjadest soe supp.', 'mat', 'kalasupp', 1, '{"filee":2}', '{"berries":1}', 3, 0, 3, 10, 8, 2),
 ('kuldfilee', 6, 'ahi', 'Kuldne suitsufilee', 'Suitsuta esmaklassilist fileed aeglaselt ja hoolikalt.', 'mat', 'kuldfilee', 1, '{"filee_hea":3}', '{"wood":3}', 12, 400, 3, 18, 28, 6),
 ('kalasoot', 7, 'soot', 'Kalasööt', 'Sega kalajäätmed toiduga – saad 4 kalasööta.', 'bait', 'kalasoot', 4, '{"jaatmed":2}', '{"food":1}', 1, 0, 4, 6, 5, 1),
 ('soomuslant', 8, 'soot', 'Soomuslant', 'Seo soomustest ja luust läikiv lant – saad 3 tükki.', 'bait', 'soomuslant', 3, '{"soomus":3,"luu":1}', '{}', 6, 0, 4, 10, 10, 2),
 ('erisoot', 9, 'soot', 'Erisööt', 'Meistri erisööt fileest ja marjadest – saad 3 tükki.', 'bait', 'erisoot', 3, '{"filee":2}', '{"berries":2}', 15, 100, 4, 14, 20, 4),
 ('vaetis', 10, 'soot', 'Kalaväetis', 'Viis jäätmeämbrit väetiseks – kuningriigi marjapõõsad kasvavad lopsakalt (+25 marja).', 'inbox', 'berries', 25, '{"jaatmed":5}', '{}', 2, 0, 4, 8, 6, 1)
on conflict (id) do update set sort = excluded.sort, station = excluded.station, name = excluded.name, descr = excluded.descr, out_kind = excluded.out_kind,
  out_id = excluded.out_id, out_qty = excluded.out_qty, needs = excluded.needs, res = excluded.res, skill = excluded.skill, rep_need = excluded.rep_need,
  ws = excluded.ws, clicks = excluded.clicks, xp = excluded.xp, rep = excluded.rep;
create table if not exists public.fisher_mats (
  user_id uuid not null references auth.users(id) on delete cascade, mat text not null references public.fish_mats(id), qty int not null default 0,
  primary key (user_id, mat)
);
create table if not exists public.fisher_proc (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0, ws int not null default 1, knife int not null default 1, kit int not null default 0, rarekit boolean not null default false,
  rep int not null default 0, stats jsonb not null default '{}'
);
create table if not exists public.fisher_proc_job (
  user_id uuid primary key references auth.users(id) on delete cascade, kind text not null, payload jsonb not null, clicks int not null, started_at timestamptz not null default now()
);
create table if not exists public.fisher_proc_orders (
  user_id uuid not null references auth.users(id) on delete cascade, day date not null, idx int not null,
  mat text not null, qty int not null, gold int not null, rep int not null, xp int not null, done boolean not null default false,
  primary key (user_id, day, idx)
);
create table if not exists public.fisher_proc_quests (
  user_id uuid not null references auth.users(id) on delete cascade, q text not null, at timestamptz not null default now(), primary key (user_id, q)
);
-- igapäevased kalatöötlemise ülesanded: 3 tükki päevas, edenemine = statistika muutus päeva algusest
create table if not exists public.fisher_proc_daily (
  user_id uuid not null references auth.users(id) on delete cascade, day date not null, base jsonb not null default '{}',
  picks text[] not null default '{}', claimed text[] not null default '{}', primary key (user_id, day)
);
do $$ declare t text; begin
  foreach t in array array['fish_mats','fish_recipes','fisher_mats','fisher_proc','fisher_proc_job','fisher_proc_orders','fisher_proc_quests','fisher_proc_daily'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 2z4. Äripartnerid: ettevõtted, usaldus, serveri loodud tellimused, erisündmused ja lepingud
create table if not exists public.fish_companies (
  id text primary key, sort int not null, name text not null, icon text not null, color text not null, descr text not null, likes text not null
);
insert into public.fish_companies (id, sort, name, icon, color, descr, likes) values
 ('restoran', 1, 'Kuninglik restoran', '🍽️', '#c8503a', 'Kuningriigi parim restoran. Peakokk tahab ainult värsket kala ja laitmatut fileed.', 'Värske söögikala, filee, suitsukala'),
 ('kalaturg', 2, 'Kalaturg', '🐟', '#2f8a9a', 'Lärmakas turuplats sadama ääres. Ostab palju ja kiiresti – peaasi, et kala oleks.', 'Tavalised kalad, filee'),
 ('loss', 3, 'Kuningaloss', '🏰', '#d8a63a', 'Kuninglik õukond tellib vaid erakordset: suuri ja haruldasi kalu ning meistriteoseid.', 'Haruldased ja suured kalad, kuninglikud tooted'),
 ('alkeemik', 4, 'Alkeemiku töökoda', '⚗️', '#8a5ad8', 'Salapärane alkeemik uurib muteerunud kalu ja maagilisi materjale.', 'Labori hübriidid, kuldsed soomused, iidsed luud'),
 ('tarbed', 5, 'Kalastustarvete ettevõte', '🎣', '#5a8a3a', 'Teeb konkse, lante ja sööta – vajab luid, soomuseid ja jäätmeid.', 'Luud, soomused, jäätmed, luukonksud'),
 ('akvaarium', 6, 'Kuninglik akvaarium', '🐠', '#2a7ad8', 'Kuningriigi suurim akvaarium. Võtab vastu ainult elusaid, väga värskeid ja ilusaid kalu.', 'Värsked haruldased kalad'),
 ('toostus', 7, 'Kalatööstus', '🏭', '#7a7a8a', 'Suur tehas, mis töötleb kala tonnide kaupa. Tellimused on suured, tasu kindel.', 'Suured kogused kala, filee, jäätmed'),
 ('gild', 8, 'Kaupmeeste gild', '⚖️', '#a8742a', 'Kaupmehed varustavad kõrtse ja laevu. Ostavad tooteid, mis säilivad.', 'Suitsukala, kalasupp, luukonksud, kaunistused')
on conflict (id) do update set sort = excluded.sort, name = excluded.name, icon = excluded.icon, color = excluded.color, descr = excluded.descr, likes = excluded.likes;
create table if not exists public.fisher_company (
  user_id uuid not null references auth.users(id) on delete cascade, company text not null references public.fish_companies(id),
  pts int not null default 0, done int not null default 0, failed int not null default 0, offer_day date,
  primary key (user_id, company)
);
create table if not exists public.fisher_biz (
  user_id uuid primary key references auth.users(id) on delete cascade, next_at timestamptz, made int not null default 0
);
create table if not exists public.fisher_biz_orders (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, company text not null references public.fish_companies(id),
  kind text not null default 'order', event text, title text not null, want jsonb not null, qty int not null, progress int not null default 0,
  gold int not null, rep int not null, trust int not null, bonus int not null default 0,
  created_at timestamptz not null default now(), offer_until timestamptz not null, hours numeric not null, deadline timestamptz,
  status text not null default 'open', closed_at timestamptz
);
create index if not exists fisher_biz_orders_user on public.fisher_biz_orders(user_id, status);
do $$ declare t text; begin
  foreach t in array array['fish_companies','fisher_company','fisher_biz','fisher_biz_orders'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- 2z5. Suitsuahi: 10 taset, suitsutamisviisid, küttepuud, maitseained, taimeriga tootmine serveris, suitsutooted
insert into public.fish_mats (id, sort, name, descr, rarity, price, kind) values
 ('kask', 20, 'Kasepuud', 'Kuiv kasepuu – annab ühtlase kuuma suitsu. Sobib iga suitsutamise jaoks.', 1, 1, 'fuel'),
 ('lepp', 21, 'Lepapuud', 'Klassikaline suitsupuu – kuumsuitsukala parim sõber.', 1, 2, 'fuel'),
 ('ounapuu', 22, 'Õunapuu', 'Magusa lõhnaga puu maitse- ja premiumsuitsuks.', 2, 4, 'fuel'),
 ('tamm', 23, 'Tammepuu', 'Tugev ja aeglane suits – külmsuitsu ja kuivatamise jaoks.', 2, 5, 'fuel'),
 ('sool', 30, 'Meresool', 'Ilma soolata pole külmsuitsu ega kuivatatud kala.', 1, 1, 'spice'),
 ('till', 31, 'Till', 'Värske till annab kalale suvise maitse.', 1, 1, 'spice'),
 ('kuuslauk', 32, 'Küüslauk', 'Tugev ja vürtsikas – kuningliku angerja saladus.', 1, 2, 'spice'),
 ('pipar', 33, 'Must pipar', 'Kaugelt toodud vürts, mis teeb suitsukala teravaks.', 2, 3, 'spice'),
 ('maitsetaim', 34, 'Maitsetaimed', 'Aia ja metsa ürdid maitsesuitsuks.', 1, 2, 'spice'),
 ('marinaad', 35, 'Erimarinaad', 'Meistri salamarinaad ürtidest, küüslaugust ja metsamarjadest.', 3, 12, 'spice')
on conflict (id) do update set sort = excluded.sort, name = excluded.name, descr = excluded.descr, rarity = excluded.rarity, price = excluded.price, kind = excluded.kind;
create table if not exists public.fish_smoke_products (
  id text primary key, grp text not null, method text not null, name text not null, price int not null, rarity int not null default 1,
  special boolean not null default false, min_lvl int not null default 1, wood text, spices jsonb not null default '{}', need_upg text, descr text not null default '', sort int not null default 0
);
-- tavatooted: 11 kalarühma × 5 suitsutamisviisi
insert into public.fish_smoke_products (id, grp, method, name, price, min_lvl, need_upg, spices, wood, sort)
select g.grp || ':' || m.id, g.grp, m.id, m.pre || g.nm, round(g.price * m.mult)::int, m.lvl, m.upg, m.sp::jsonb, m.wood, g.s * 10 + m.s
from (values ('sarg','särg',8,1),('raim','räim',6,2),('ahven','ahven',10,3),('latikas','latikas',18,4),('tuulehaug','tuulehaug',26,5),('haug','haug',30,6),
             ('koha','koha',34,7),('forell','forell',60,8),('angerjas','angerjas',70,9),('lohe','lõhe',80,10),('muu','kala',12,11)) g(grp, nm, price, s)
cross join (values ('kuum','Kuumsuitsu',1.0,1,null,'{}',null,1),('maitse','Maitsesuitsu',1.4,2,'riiul','{"maitse":2}',null,2),('kulm','Külmsuitsu',1.6,3,null,'{"sool":1}',null,3),
                   ('kuiv','Kuivatatud suitsu',1.8,5,null,'{"sool":2}','tamm',4),('premium','Premium suitsu',2.5,7,'premium','{"marinaad":1}',null,5)) m(id, pre, mult, lvl, upg, sp, wood, s)
on conflict (id) do update set name = excluded.name, price = excluded.price, min_lvl = excluded.min_lvl, need_upg = excluded.need_upg, spices = excluded.spices, wood = excluded.wood, sort = excluded.sort;
-- haruldased eritooted
insert into public.fish_smoke_products (id, grp, method, name, price, rarity, special, min_lvl, wood, spices, need_upg, descr, sort) values
 ('sp:marjaforell', 'forell', 'maitse', 'Metsamarjadega suitsuforell', 180, 3, true, 5, 'ounapuu', '{"maitsetaim":1,"berries":3}', 'riiul', 'Õunapuusuitsus forell metsamarjade ja ürtidega.', 1001),
 ('sp:kuldhaug', 'haug', 'kulm', 'Kuldne suitsuhaug', 160, 3, true, 6, 'tamm', '{"sool":1,"pipar":1}', null, 'Tammesuitsus päevi küpsenud kuldse koorikuga haug.', 1002),
 ('sp:kuningangerjas', 'angerjas', 'kuum', 'Kuninglik suitsuangerjas', 260, 4, true, 7, 'lepp', '{"sool":1,"till":1,"kuuslauk":1}', null, 'Kuninga lemmik – lepasuitsus angerjas tilli ja küüslauguga.', 1003),
 ('sp:meistrilohe', 'lohe', 'kulm', 'Vana meistri suitsulõhe', 360, 4, true, 8, 'tamm', '{"sool":1,"marinaad":1}', null, 'Vana suitsumeistri salaretsept: marineeritud ja aeglaselt külmsuitsutatud lõhe.', 1004),
 ('sp:legend', 'legend', 'premium', 'Legendaarne suitsukala', 1200, 5, true, 10, 'ounapuu', '{"marinaad":2,"pipar":1}', 'premium', 'Legendaarsest kalast valmistatud meistriteos, millest räägitakse kogu kuningriigis.', 1005)
on conflict (id) do update set grp = excluded.grp, method = excluded.method, name = excluded.name, price = excluded.price, rarity = excluded.rarity, special = excluded.special,
  min_lvl = excluded.min_lvl, wood = excluded.wood, spices = excluded.spices, need_upg = excluded.need_upg, descr = excluded.descr, sort = excluded.sort;
create table if not exists public.fisher_smoke (
  user_id uuid primary key references auth.users(id) on delete cascade, lvl int not null default 1, upg text[] not null default '{}'
);
-- algpakk: esimesel avamisel saab mängija tasuta küttepuid ja maitseaineid
alter table public.fisher_smoke add column if not exists starter_at timestamptz;
create table if not exists public.fisher_smoke_batch (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, product text not null references public.fish_smoke_products(id),
  qty int not null, fails int not null default 0, quality int not null, wood text not null, spices text[] not null default '{}',
  started_at timestamptz not null default now(), ready_at timestamptz not null, status text not null default 'run', taken_at timestamptz
);
create unique index if not exists fisher_smoke_batch_one on public.fisher_smoke_batch(user_id) where status = 'run';
-- suur kala annab rohkem suitsutooteid (out_qty); vanadel partiidel on see tühi ja kasutatakse qty-d
alter table public.fisher_smoke_batch add column if not exists out_qty int;
create table if not exists public.fisher_smoked (
  user_id uuid not null references auth.users(id) on delete cascade, product text not null references public.fish_smoke_products(id), quality int not null, qty int not null default 0,
  primary key (user_id, product, quality)
);
do $$ declare t text; begin
  foreach t in array array['fish_smoke_products','fisher_smoke','fisher_smoke_batch','fisher_smoked'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 2z7b. Sadam: vastased (merekoletised, piraadilaevad jm), keda retkel kohtab
--   region = null → võib tulla igas piirkonnas (jõud kasvab piirkonna raskusega: power + grow * diff)
--   loot: {"mats":{"soomus":[min,max]}, "items":{"karp":tõenäosus}}
-- ---------------------------------------------------------------------
create table if not exists public.fleet_foes (
  id text primary key, name text not null, region text, power int not null, grow int not null default 0, atk int not null,
  gold int not null, loot jsonb not null default '{}', icon text not null default 'skull', descr text not null default '', ord int not null default 0
);
insert into public.fleet_foes (id, name, region, power, grow, atk, gold, loot, icon, descr, ord) values
 ('hiidkrabi','Hiidkrabi',null,4,11,8,90,'{"mats":{"luu":[3,6]},"items":{"karp":0.4}}','bug','Kaljukarbi suurune krabi, kelle sõrad krõbistavad laevaplanke nagu piparkooki.',1),
 ('merimadu','Merimadu',null,6,12,10,120,'{"mats":{"soomus":[2,5]}}','waves','Pikk roheline madu, kes keerdub ümber laeva ja pigistab.',2),
 ('hiidkalmaar','Hiidkalmaar',null,10,13,16,160,'{"mats":{"soomus":[2,4]},"items":{"parl":0.4}}','monster','Kaheksa kombitsat ja kaks laternasuurust silma. Armastab kalurite saaki.',3),
 ('kummituslaev','Kummituslaev',null,12,13,14,200,'{"items":{"ruun":0.35,"sormus":0.25}}','ghost','Rebenenud purjedega laev, mille tekil tantsivad kahvatud meremehed.',4),
 ('hiidhaug','Hiidhaug','metsajarv',16,0,8,120,'{"mats":{"luu":[2,5]},"items":{"merevaik":0.3}}','fish','Metsajärve vanim haug – tema hambad on nagu saehambad.',10),
 ('vetevana','Vetevana','metsajarv',20,0,10,160,'{"items":{"karp":0.5}}','moon','Habemega vetehaldjas, kes tirib õngenööre ja naerab kurjalt.',11),
 ('elektriangerjas','Välguangerjas','sugavjarv',28,0,12,260,'{"items":{"koopakristall":0.3}}','zap','Sügavuse angerjas, kelle löök paneb laeva laternad sädelema.',20),
 ('kivikilpkonn','Kivikilpkonn','sugavjarv',33,0,10,300,'{"mats":{"iidneluu":[0,1]},"items":{"parl":0.4}}','shield','Kilpkonn, kelle selg on kaetud sammaldunud kividega. Vana ja tõre.',21),
 ('rabavaim','Rabavaim','udusoo',38,0,14,380,'{"items":{"ruun":0.4}}','sparkles','Udust kokku keerdunud vaim, kelle hääl kõlab nagu tuul roostikus.',30),
 ('sookoll','Sookoll','udusoo',44,0,16,450,'{"mats":{"kuldsoomus":[1,2]}}','skull','Mudast ja juurtest kogu, kes tõuseb soost ja haarab laeva põhjast.',31),
 ('jaauss','Jääuss','kulmajarv',50,0,18,600,'{"items":{"kristall":0.5}}','snowflake','Läbipaistev uss, kes kaevab jää alla tunneleid ja külmutab vee laeva ümber.',40),
 ('harmahai','Härmahai','kulmajarv',56,0,20,700,'{"mats":{"kuldsoomus":[1,3]}}','triangle-alert','Valge hai, kelle uimelt pudeneb härmatist. Ründab vaikselt ja kiirelt.',41),
 ('laavamadu','Laavamadu','tulejarv',64,0,22,900,'{"items":{"mustparl":0.35}}','flame','Hõõguv madu, kes ujub laavas sama kergelt nagu kala vees.',50),
 ('tuleraid','Tuleraid','tulejarv',72,0,25,1100,'{"mats":{"iidneluu":[1,3]},"items":{"kristall":0.5}}','flame','Tiibadega raikala, kelle uimed lõõmavad. Tulejärve kõige kardetum kütt.',51)
on conflict (id) do update set name=excluded.name, region=excluded.region, power=excluded.power, grow=excluded.grow, atk=excluded.atk, gold=excluded.gold,
  loot=excluded.loot, icon=excluded.icon, descr=excluded.descr, ord=excluded.ord;
alter table public.fisher_fleet add column if not exists foes jsonb not null default '{}';
alter table public.fleet_foes add column if not exists kind text not null default 'koletis';
insert into public.fleet_foes (id, name, region, power, grow, atk, gold, loot, icon, descr, ord, kind) values
 ('rannaroov','Rannaröövlid',null,3,10,7,140,'{"items":{"karp":0.5}}','skull','Paadiseltskond, kes varitseb rannikul aeglasi kalureid ja nõuab „sillamaksu“.',60,'piraat'),
 ('mustlipp','Musta lipu kaater',null,5,12,10,220,'{"items":{"sormus":0.3},"mats":{"luu":[2,4]}}','ship','Kiire kaater musta lipuga. Laseb kõigepealt ja küsib hiljem.',61,'piraat'),
 ('soolhabe','Kapten Soolhabe',null,9,13,14,320,'{"items":{"sormus":0.4,"merevaik":0.4}}','crown','Vana piraadikapten, kelle habe on mereveest valgeks kuivanud. Tal on alati üks aardekaart varuks.',62,'piraat'),
 ('kummituspiraadid','Kummituspiraadid',null,11,14,16,380,'{"items":{"ruun":0.4,"mustparl":0.15}}','ghost','Uppunud laeva meeskond, kes otsib endiselt oma kaotatud kulda.',63,'piraat'),
 ('merla','Piraadikuninganna Merla',null,15,15,20,600,'{"items":{"mustparl":0.35,"sormus":0.5},"mats":{"kuldsoomus":[1,2]}}','swords','Seitsme laeva kuninganna. Tema lipulaeval on verevärvi purjed.',64,'piraat')
on conflict (id) do update set name=excluded.name, power=excluded.power, grow=excluded.grow, atk=excluded.atk, gold=excluded.gold, loot=excluded.loot, icon=excluded.icon, descr=excluded.descr, ord=excluded.ord, kind=excluded.kind;
alter table public.fleet_foes enable row level security;
revoke all on public.fleet_foes from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2z8. Kalurimaja tasemed (1–3), uued ruumid (jääkelder, saun, trofeesein) ja uued äripartnerid
-- ---------------------------------------------------------------------
alter table public.fisher_cabin add column if not exists lvl int not null default 1;
alter table public.fisher_cabin add column if not exists up_at timestamptz;
alter table public.fisher_cabin add column if not exists saun_day date;
insert into public.fish_cabin_rooms (id, sort, icon, name, descr, bonus, gold, wood, stone, hours, min_level, page) values
 ('kelder', 7, '🧊', 'Jääkelder', 'Maa-alune kelder, kuhu talvel tassitakse järvejääd.', 'Kalad riknevad 25% aeglasemalt.', 9000, 300, 500, 6, 18,
  'Kaevasin keldri lõpuni. Talvel toon järvelt jääd ja saepuru sisse. Villem kirjutas, et vanasti hoiti siin kala terve kevade. Kelder lõhnab mulla ja külma järele.'),
 ('saun', 8, '🧖', 'Kaldasaun', 'Väike suitsusaun otse vee ääres.', 'Kord päevas saunaõhtu: kogemus ja erisöödad.', 12000, 600, 300, 8, 20,
  'Esimene leil! Pärast sauna hüppasin lahte ja udu oli nii paks, et ei näinud oma käsigi. Kuskil plartsatas midagi suurt. Saunas on hea mõelda.'),
 ('trofeesein', 9, '🏆', 'Trofeesein', 'Tamme puust sein, kuhu riputada oma parimad saagid.', 'Iga püütud kalaliik annab +0,2% müügihinda (kuni 8%).', 16000, 500, 600, 10, 22,
  'Riputasin seinale esimese trofee. Villemi vana haug ripub kõrval – kuivanud, aga uhke. Kui kõik seinad saavad täis, on see maja jälle kaluri maja.')
on conflict (id) do update set sort = excluded.sort, icon = excluded.icon, name = excluded.name, descr = excluded.descr, bonus = excluded.bonus, gold = excluded.gold,
  wood = excluded.wood, stone = excluded.stone, hours = excluded.hours, min_level = excluded.min_level, page = excluded.page;
insert into public.fish_cabin_damage (room, what, gold, wood, stone) values
 ('kelder', 'Kevadine suurvesi ujutas keldri üle ja jää sulas.', 400, 40, 60),
 ('saun', 'Tormituul viis saunakatuse ja kerise kivid kukkusid laiali.', 450, 80, 40),
 ('trofeesein', 'Torm raputas maja ja trofeed kukkusid seinalt.', 500, 60, 20)
on conflict (room) do update set what = excluded.what, gold = excluded.gold, wood = excluded.wood, stone = excluded.stone;
insert into public.fish_companies (id, sort, name, icon, color, descr, likes) values
 ('juveliir', 9, 'Kuninglik juveliir', '💍', '#b84a8a', 'Peen meister, kes teeb kuningannale ehteid. Ostab merest ja koobastest leitud aardeid.', 'Pärlid, merevaik, kristallid, ruunid'),
 ('muuseum', 10, 'Loodusmuuseum', '🏛️', '#4a7a5a', 'Teadlased koguvad näitusele erakordselt vanu ja pikki kalu. Mida vanem kala, seda parem.', 'Vanad ja legendaarse eaga kalad'),
 ('korts', 11, 'Sadamakõrts', '🍺', '#b8742a', 'Lärmakas kõrts sadama ääres. Meremehed tahavad iga päev suitsukala ja kalasuppi.', 'Suitsukala, kalasupp, värske väike kala')
on conflict (id) do update set sort = excluded.sort, name = excluded.name, icon = excluded.icon, color = excluded.color, descr = excluded.descr, likes = excluded.likes;

-- ---------------------------------------------------------------------
-- 3z-osk. Kaluri oskuste puu ja kalapüügidroon (tabelid)
-- ---------------------------------------------------------------------
create table if not exists public.fish_skill_defs (
  id text primary key, branch text not null, tier int not null, name text not null, descr text not null,
  max int not null default 5, per numeric not null, unit text not null default '%', icon text not null default '', sort int not null default 0);
insert into public.fish_skill_defs (id, branch, tier, name, descr, max, per, unit, icon, sort) values
 ('kiirnakk','vote',0,'Kiire näkk','Kala näkkab kiiremini',5,3,'%','⚡',1),
 ('kindelkasi','vote',1,'Kindel käsi','Õng murdub raske kala all harvemini',5,8,'%','✋',2),
 ('saastlik','vote',2,'Säästlik kalur','Võimalus, et sööt jääb alles',5,4,'%','🪱',3),
 ('meistriritv','vote',3,'Meistri ritv','Õnge tugevus suureneb',5,4,'%','🎣',4),
 ('kalatundja','tead',0,'Kalatundja','Püügist saad rohkem kogemust',5,3,'%','📖',5),
 ('onnekasi','tead',1,'Õnnelik käsi','Haruldaste kalade õnn suureneb',5,1,'%','🍀',6),
 ('hiiglased','tead',2,'Hiiglaste jälgija','Hiiglasliku isendi võimalus suureneb',5,10,'%','🐋',7),
 ('raskesaak','tead',3,'Raske saak','Kalad on raskemad',5,2,'%','⚖️',8),
 ('kaupmees','kaup',0,'Kaupmees','Kalade müügihind tõuseb',5,2,'%','🪙',9),
 ('aardekutt','kaup',1,'Aardekütt','Aardekirstudest tuleb rohkem kulda',5,8,'%','💰',10),
 ('topeltnakk','kaup',2,'Kaks ühe korraga','Võimalus saada korraga teine kala',5,0.6,'%','🐟',11),
 ('droonimeister','kaup',3,'Droonimeister','Droon püüab kiiremini',5,5,'%','🛸',12),
 ('haardemeister','vote',4,'Haardemeister','Kerimisel on kala kinni hoidmise ala laiem',3,2,'%','🪝',13),
 ('muudiuurija','tead',4,'Müütide uurija','Legendaarsete ja müütiliste kalade võimalus suureneb',3,10,'%','🐉',14),
 ('droonimehaanik','kaup',4,'Droonimehaanik','Drooni aku kestab kauem',3,10,'%','🔋',15)
on conflict (id) do update set branch = excluded.branch, tier = excluded.tier, name = excluded.name, descr = excluded.descr, max = excluded.max,
  per = excluded.per, unit = excluded.unit, icon = excluded.icon, sort = excluded.sort;
create table if not exists public.fisher_skills (
  user_id uuid primary key references auth.users(id) on delete cascade, ranks jsonb not null default '{}', resets int not null default 0);
create table if not exists public.fisher_drone (
  user_id uuid primary key references auth.users(id) on delete cascade, lvl int not null default 1, spot text, bait text,
  last_at timestamptz, total int not null default 0, bought_at timestamptz not null default now());
alter table public.fish_skill_defs enable row level security;
drop policy if exists "oskused loetavad" on public.fish_skill_defs;
create policy "oskused loetavad" on public.fish_skill_defs for select using (true);
alter table public.fisher_skills enable row level security;
alter table public.fisher_drone enable row level security;

-- ---------------------------------------------------------------------
-- 4. Abifunktsioonid (ei ole mängijale otse kättesaadavad)
-- ---------------------------------------------------------------------
create or replace function public.fx_uid() returns uuid language plpgsql stable as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Palun logi sisse' using errcode = '28000'; end if;
  return u;
end $$;

create or replace function public.fx_today() returns date language sql stable as
$$ select (now() at time zone 'Europe/Tallinn')::date $$;

create or replace function public.fx_is_night() returns boolean language sql stable as
$$ select extract(hour from now() at time zone 'Europe/Tallinn') >= 21 or extract(hour from now() at time zone 'Europe/Tallinn') < 5 $$;

create or replace function public.fx_is_winter() returns boolean language sql stable as
$$ select extract(month from now() at time zone 'Europe/Tallinn') in (12,1,2) $$;

-- Ilm vahetub iga 3 tunni järel ja on kõigile mängijatele sama
create or replace function public.fx_weather() returns text language sql stable as $$
  select case
    when h < 35 then 'paike' when h < 60 then 'pilves' when h < 80 then 'vihm' when h < 92 then 'udu' else 'torm' end
  from (select abs(hashtext('ilm' || floor(extract(epoch from now()) / 10800)::text)) % 100 as h) x
$$;
create or replace function public.fx_weather_bonus(w text) returns numeric language sql immutable as
$$ select case w when 'pilves' then 0.02 when 'vihm' then 0.05 when 'udu' then 0.04 when 'torm' then 0.10 else 0 end $$;
create or replace function public.fx_weather_wait(w text) returns numeric language sql immutable as
$$ select case w when 'paike' then 1.15 when 'vihm' then 0.85 when 'torm' then 0.9 else 1 end $$;

-- Päevaosa kalade parima aja jaoks
create or replace function public.fx_daypart() returns text language sql stable as $$
  select case when h >= 5 and h < 10 then 'hommik' when h >= 10 and h < 17 then 'päev' when h >= 17 and h < 21 then 'õhtu' else 'öö' end
  from (select extract(hour from now() at time zone 'Europe/Tallinn') as h) x $$;
-- Õhtukuma: iga päev kell 19–22 (Tallinna aeg) annab kalapüük topelt kogemust
create or replace function public.fx_kuma() returns boolean language sql stable as
$$ select extract(hour from now() at time zone 'Europe/Tallinn') between 19 and 21 $$;
create or replace function public.fx_xp_mult() returns int language sql stable as
$$ select case when public.fx_kuma() then 2 else 1 end $$;

create or replace function public.fx_xp_need(lvl int) returns int language sql immutable as
$$ select floor(25 * power(lvl, 1.5))::int + 10 $$;

create or replace function public.fx_fisher(u uuid) returns public.fishers language plpgsql as $$
declare f public.fishers;
begin
  insert into public.fishers(user_id) values (u) on conflict (user_id) do nothing;
  select * into f from public.fishers where user_id = u for update;
  if f.rod_repairs <> '{}'::jsonb and exists (select 1 from jsonb_each_text(f.rod_repairs) e where e.value::timestamptz <= now()) then
    update public.fishers x set
      rods_broken = array(select b from unnest(x.rods_broken) b where b not in (select e.key from jsonb_each_text(x.rod_repairs) e where e.value::timestamptz <= now())),
      rod_repairs = (select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) from jsonb_each(x.rod_repairs) e where (e.value #>> '{}')::timestamptz > now())
    where x.user_id = u;
    update public.fishers x set rod_broken = x.rod = any(x.rods_broken) where x.user_id = u;
    select * into f from public.fishers where user_id = u;
  end if;
  return f;
end $$;

-- Prestiižitähe jaoks vajalik kogemus (p = juba olemasolevate tähtede arv)
create or replace function public.fx_star_need(p int) returns int language sql immutable as
$$ select 15000 + 2500 * least(greatest(p, 0), 40) $$;
-- Tähtede püsiv müügiboonus: +1% iga tähe kohta, kokku kuni +30%
create or replace function public.fx_star_bonus(p int) returns numeric language sql immutable as
$$ select least(0.30, greatest(coalesce(p, 0), 0) * 0.01) $$;

create or replace function public.fx_add_xp(u uuid, amount int) returns int[] language plpgsql as $$
declare f public.fishers; gained int[] := '{}'; rest int := 0; g int; v_gold int := 0; v_items jsonb; v_last jsonb;
begin
  select * into f from public.fishers where user_id = u for update;
  if f.level < 50 then
    f.xp := f.xp + greatest(0, amount);
    while f.level < 50 and f.xp >= public.fx_xp_need(f.level) loop
      f.xp := f.xp - public.fx_xp_need(f.level);
      f.level := f.level + 1;
      gained := gained || f.level;
    end loop;
    if f.level >= 50 then rest := f.xp; f.xp := 0; end if;
  else
    rest := greatest(0, amount);
  end if;
  -- 50. tasemel läheb kogemus prestiižitähtedesse
  if f.level >= 50 and rest > 0 then
    f.pxp := f.pxp + rest;
    while f.pxp >= public.fx_star_need(f.prestige) loop
      f.pxp := f.pxp - public.fx_star_need(f.prestige);
      f.prestige := f.prestige + 1;
      g := 1500 + 250 * f.prestige;
      v_gold := v_gold + g;
      v_items := public.fx_give_random(u, least(5, 2 + f.prestige / 3), 1 + (f.prestige % 5 = 0)::int);
      v_last := jsonb_build_object('star', f.prestige, 'gold', g, 'items', v_items, 'at', now());
      perform public.fx_news(u, 'star', jsonb_build_object('star', f.prestige));
    end loop;
  end if;
  update public.fishers set xp = f.xp, level = f.level, pxp = f.pxp, prestige = f.prestige, gold = gold + v_gold,
    prestige_last = coalesce(v_last, prestige_last) where user_id = u;
  return gained;
end $$;

create or replace function public.fx_inbox(u uuid, p jsonb, why text) returns void language sql as
$$ insert into public.kingdom_inbox(user_id, payload, reason) values (u, p, why) $$;

-- kas Õnnetund käib praegu
create or replace function public.fx_onn_on() returns boolean language plpgsql stable as $$
declare e jsonb := public.fx_wev(now());
begin return coalesce(e ->> 'kind' = 'onn' and e ->> 'phase' = 'on', false); end $$;
-- Haruldusklasside tõenäosused (1..6) praeguste tingimuste jaoks, kokku alati 100
create or replace function public.fx_rarity_weights(u uuid, p_spot text, p_bait text) returns numeric[] language plpgsql stable as $$
declare
  f public.fishers; sp public.fish_spots; r public.fish_rods; b public.fish_baits;
  base numeric[] := array[50, 25, 15, 7, 2.5, 0.5];
  w numeric[] := array[0,0,0,0,0,0]; bonus numeric; i int; j int; avail boolean[] := array[false,false,false,false,false,false];
  night boolean := public.fx_is_night(); winter boolean := public.fx_is_winter(); tot numeric := 0; wthr text := public.fx_weather();
begin
  select * into f from public.fishers where user_id = u;
  select * into sp from public.fish_spots where id = p_spot;
  select * into r from public.fish_rods where id = coalesce(f.rod, 'algaja');
  select * into b from public.fish_baits where id = p_bait;
  bonus := case when p_spot = 'udulaht' then 0.06 * public.fx_room_mul(u, 'majakas') else 0 end + coalesce((public.fx_gear(u, p_spot) ->> 'catch')::numeric, coalesce(r.catch_bonus,0)) + coalesce(b.rarity_bonus,0) + coalesce(sp.bonus,0)
           + public.fx_weather_bonus(public.fx_weather()) + case when night then 0.05 else 0 end + 0.03 * coalesce(f.luck,0)
           + case when public.fx_myth(u, 'kuuong') then 0.03 else 0 end + public.fx_lab_aura(u, 'onn') * 0.2 + 0.01 * public.fx_sk(u, 'onnekasi');
  -- Õnnetund: mängija enda õnn (varustus, sööt, koht, ilm…) kolmekordne
  if bonus > 0 and public.fx_onn_on() then bonus := bonus * 3; end if;
  for i in 1..6 loop
    avail[i] := exists (select 1 from public.fish_species s where s.rarity = i and p_spot = any(s.spots) and s.event is null
                 and s.min_level <= coalesce(f.level,1) and (not s.night_only or night)
                 and (not s.winter_only or winter or p_spot = 'jaa') and (s.weather is null or wthr = any(s.weather)));
    w[i] := base[i] * power(1 + bonus, i - 1);
    if i >= 5 then w[i] := w[i] * (1 + 0.1 * public.fx_sk(u, 'muudiuurija')); end if; -- oskus: Müütide uurija
  end loop;
  -- kui mõnes klassis kala pole saadaval, liigub selle tõenäosus madalamasse klassi
  for i in reverse 6..2 loop
    if not avail[i] then
      j := i - 1;
      while j > 1 and not avail[j] loop j := j - 1; end loop;
      w[j] := w[j] + w[i]; w[i] := 0;
    end if;
  end loop;
  for i in 1..6 loop tot := tot + w[i]; end loop;
  for i in 1..6 loop w[i] := round(w[i] * 100 / tot, 3); end loop;
  return w;
end $$;

create or replace function public.fx_check_ach(u uuid) returns jsonb language plpgsql as $$
declare
  f public.fishers; got jsonb := '[]'; a record; ok boolean;
  ncommon int; ncommon_all int; nspots int; nall int; nall_total int; maxw numeric; maxr int; hasgold boolean; hasgiant boolean;
  nweather int; nweather_all int; goldchest boolean; nitems int;
begin
  select * into f from public.fishers where user_id = u;
  select coalesce(max(weight),0), coalesce(max(rarity),0), bool_or(species = 'kuldkala'), bool_or(giant), count(distinct spot)
    into maxw, maxr, hasgold, hasgiant, nspots from public.fish_catches where user_id = u and not bought;
  select count(distinct c.species) into ncommon from public.fish_catches c join public.fish_species s on s.id = c.species where c.user_id = u and not c.bought and s.rarity = 1;
  select count(*) into ncommon_all from public.fish_species where rarity = 1;
  select count(distinct species) into nall from public.fish_catches where user_id = u and not bought;
  select count(*) into nall_total from public.fish_species;
  select count(distinct c.species) into nweather from public.fish_catches c join public.fish_species s on s.id = c.species where c.user_id = u and not c.bought and s.weather is not null;
  select count(*) into nweather_all from public.fish_species where weather is not null;
  select exists (select 1 from public.fish_casts where user_id = u and kind = 'chest' and junk = 'kuld' and state = 'landed') into goldchest;
  select coalesce(sum(qty), 0) into nitems from public.fisher_items where user_id = u;
  for a in select * from public.fish_achievements where id not in (select ach from public.fish_unlocked where user_id = u) order by sort loop
    ok := case a.id
      when 'esimene' then f.total >= 1 when 'kala100' then f.total >= 100 when 'kala1000' then f.total >= 1000
      when 'haruldane' then maxr >= 3 when 'eepiline' then maxr >= 4 when 'legendaarne' then maxr >= 5 when 'muutiline' then maxr >= 6
      when 'suur10' then maxw >= 10 when 'suur50' then maxw >= 50 when 'suur100' then maxw >= 100 when 'hiiglane' then coalesce(hasgiant,false)
      when 'tavalised' then ncommon >= ncommon_all when 'kohad' then nspots >= 6 when 'koik' then nall >= nall_total
      when 'tase10' then f.level >= 10 when 'tase25' then f.level >= 25 when 'tase50' then f.level >= 50
      when 'lab1' then exists (select 1 from public.lab_fish where bred_by = u)
      when 'lab10' then (select count(distinct species) from public.lab_fish where bred_by = u) >= 10
      when 'lab50' then (select count(distinct species) from public.lab_fish where bred_by = u) >= 50
      when 'labesma' then exists (select 1 from public.lab_species where first_by = u)
      when 'labmyyt' then exists (select 1 from public.lab_fish where bred_by = u and rarity = 5)
      when 'lablegend' then exists (select 1 from public.lab_fish h join public.lab_species ls on ls.id = h.species where h.bred_by = u and ls.legend)
      when 'dna1' then exists (select 1 from public.lab_research where user_id = u and scans_done >= 1)
      when 'dna50' then exists (select 1 from public.lab_research where user_id = u and scans_done >= 50)
      when 'retsept' then exists (select 1 from public.lab_research r, jsonb_each_text(r.frags) x where r.user_id = u and x.value::int >= 3)
      when 'geenid' then exists (select 1 from public.lab_research where user_id = u and cardinality(genes) >= 8)
      when 'puunis1' then exists (select 1 from public.fish_traps where user_id = u and status = 'done')
      when 'vahk25' then (select count(*) from public.fish_catches where user_id = u and species = 'vahk') >= 25
      when 'riided' then (select count(distinct c.slot) from public.fisher_clothes fc join public.fish_clothes c on c.id = fc.item where fc.user_id = u) >= 7
      when 'ilmakindel' then (select count(*) from public.fish_catches where user_id = u and dressed) >= 50
      when 'hai1' then exists (select 1 from public.fish_catches where user_id = u and species in ('ogahai','heeringahai'))
      when 'retk1' then exists (select 1 from public.fish_journey where user_id = u and finished)
      when 'retk5' then (select count(*) from public.fish_journey where user_id = u and finished) >= 5
      when 'duell1' then exists (select 1 from public.fish_duels where winner = u)
      when 'duell10' then (select count(*) from public.fish_duels where winner = u) >= 10
      when 'varustus' then (select count(distinct g.kind) from public.fisher_gear fg join public.fish_gear g on g.id = fg.gear where fg.user_id = u and g.kind in ('kahv','korv','hoidja','sump','ammber')) >= 5
      when 'vana1' then (select count(*) from public.fish_catches c join public.fish_species fs on fs.id = c.species where c.user_id = u and not c.bought and c.weight >= fs.min_w + .75 * (fs.max_w - fs.min_w)) >= 1
      when 'vana25' then (select count(*) from public.fish_catches c join public.fish_species fs on fs.id = c.species where c.user_id = u and not c.bought and c.weight >= fs.min_w + .75 * (fs.max_w - fs.min_w)) >= 25
      when 'legvana5' then (select count(*) from public.fish_catches c join public.fish_species fs on fs.id = c.species where c.user_id = u and not c.bought and (c.giant or c.weight > fs.max_w)) >= 5
      when 'parija' then exists (select 1 from public.fisher_myth where user_id = u and myth = 'parijasormus')
      when 'taht1' then f.prestige >= 1 when 'taht5' then f.prestige >= 5 when 'taht10' then f.prestige >= 10 when 'taht25' then f.prestige >= 25
      when 'oo' then f.night >= 50 when 'prugi' then f.junk >= 10 when 'kirst' then f.chests >= 5
      when 'oo100' then f.night >= 100 when 'kirst10' then f.chests >= 10 when 'voit10' then f.comp_wins >= 10
      when 'boss1' then exists (select 1 from public.kalatund_score k join public.kalatund_boss b on b.day = k.day where k.user_id = u and k.dmg > 0 and b.killed_at is not null)
      when 'kuldkala' then coalesce(hasgold,false) when 'tellimused' then f.orders_done >= 20
      when 'voitja' then f.comp_wins >= 1 when 'murdja' then f.broken >= 5
      when 'ilmakalur' then nweather_all > 0 and nweather >= nweather_all when 'kuldkirst' then goldchest
      when 'usin' then f.quests_done >= 25 when 'kott' then nitems >= 30
      when 'maja1' then f.house_level >= 1 when 'maja5' then f.house_level >= 5 when 'maja10' then f.house_level >= 10
      when 'akvaarium' then (select count(*) from public.fish_catches where user_id = u and status = 'aquarium') >= 5
      when 'paadimees' then cardinality(f.boats) >= 1 when 'kapten' then cardinality(f.boats) >= 3
      when 'taiustaja' then exists (select 1 from public.fisher_rods where user_id = u and upg >= 5)
      when 'volur' then exists (select 1 from public.fisher_rods where user_id = u and ench_lvl >= 3)
      when 'suvamees' then not exists (select 1 from public.fish_species s where 'sugavik' = any(s.spots) and s.rarity >= 3 and s.event is null and not exists (select 1 from public.fish_catches c where c.user_id = u and not c.bought and c.species = s.id))
      else false end;
    if ok then
      insert into public.fish_unlocked(user_id, ach) values (u, a.id) on conflict do nothing;
      update public.fishers set gold = gold + a.reward_gold,
        titles = case when a.title is not null and not (a.title = any(titles)) then titles || a.title else titles end
        where user_id = u;
      perform public.fx_add_xp(u, a.reward_xp);
      got := got || jsonb_build_object('id', a.id, 'name', a.name, 'title', a.title, 'gold', a.reward_gold, 'xp', a.reward_xp);
    end if;
  end loop;
  return got;
end $$;

-- ---------------------------------------------------------------------
-- 5. Mängija funktsioonid (kutsutakse mängust)
-- ---------------------------------------------------------------------
create or replace function public.set_profile(p_name text, p_kingdom text, p_hidden boolean default null)
returns void language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  insert into profiles(id, name, kingdom, hidden)
  values (u, left(coalesce(nullif(trim(p_name),''),'Valitseja'),20), left(coalesce(nullif(trim(p_kingdom),''),'Metsakuningriik'),24), coalesce(p_hidden,false))
  on conflict (id) do update set name = excluded.name, kingdom = excluded.kingdom, hidden = coalesce(p_hidden, profiles.hidden);
end $$;

drop function if exists public.kingdom_leaderboard();
create or replace function public.kingdom_leaderboard()
returns table(id uuid, name text, kingdom text, level int, fame int, regions int, treasures int, me boolean)
language sql stable security definer set search_path = public as $$
  select t.user_id, p.name, p.kingdom, t.level, floor(t.fame)::int, t.regions, t.treasures, t.user_id = auth.uid()
  from kingdom_trust t join profiles p on p.id = t.user_id
  join saves s on s.user_id = t.user_id
  where not p.hidden or t.user_id = auth.uid()
  order by t.level desc, t.fame desc limit 50
$$;

-- Kuningriigi kogemuse koguhulk (sama valem nagu mängus: 30 * tase^1.5 + 20)
create or replace function public.fx_k_xp_total(lvl int) returns numeric language sql immutable as
$$ select coalesce(sum(round(30 * power(i, 1.5) + 20)), 0) from generate_series(1, greatest(lvl, 1) - 1) i $$;

-- Salvestus koos kontrolliga: andmed salvestatakse alati (keegi ei kaota arengut),
-- aga edetabelisse jõuavad ainult numbrid, mis on mõistliku kiirusega kasvanud.
create or replace function public.save_kingdom(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u uuid := fx_uid(); t kingdom_trust; first boolean := false; reasons text[] := '{}'; ok boolean;
  lvl int; xp numeric; xpt numeric; v_fame numeric; regs text[]; nreg int; tre int; v_gold numeric; gt numeric; dt numeric; r text; k text;
  req jsonb := '{"kodu":[1,0],"pime":[3,10],"jarv":[4,25],"maed":[5,50],"org":[7,120],"iidne":[9,250],"raba":[10,350],"meri":[12,500],"pohjala":[14,800],"haldja":[16,1200]}';
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' or jsonb_typeof(p_data -> 'res') <> 'object' or jsonb_typeof(p_data -> 'regions') <> 'object' then
    raise exception 'Vigane salvestus';
  end if;
  if octet_length(p_data::text) > 2000000 then raise exception 'Salvestus on liiga suur'; end if;
  if p_data ? 'uid' and p_data ->> 'uid' <> u::text then raise exception 'See kuningriik kuulub teisele kontole. Logi uuesti sisse.'; end if;
  begin
    lvl := coalesce((p_data ->> 'level')::int, 1); xp := coalesce((p_data ->> 'xp')::numeric, 0);
    v_fame := coalesce((p_data ->> 'fame')::numeric, 0); tre := coalesce((p_data -> 'st' ->> 'treasures')::int, 0);
    v_gold := coalesce((p_data -> 'res' ->> 'gold')::numeric, 0); gt := coalesce((p_data ->> 'time')::numeric, 0);
  exception when others then raise exception 'Vigane salvestus';
  end;
  select coalesce(array_agg(x), '{}') into regs from jsonb_object_keys(p_data -> 'regions') x;
  nreg := coalesce(array_length(regs, 1), 0);
  xpt := fx_k_xp_total(lvl) + xp;

  -- 1) väärtused, mis pole kunagi võimalikud
  if lvl < 1 or lvl > 200 or xp < 0 or v_fame < 0 or v_gold < 0 or tre < 0 or gt < 0 then reasons := reasons || 'võimatud väärtused'::text; end if;
  foreach k in array array['wood','stone','berries','food','water'] loop
    if coalesce((p_data -> 'res' ->> k)::numeric, 0) > 60000 or coalesce((p_data -> 'res' ->> k)::numeric, 0) < 0 then reasons := reasons || ('ladu üle piiri: ' || k); end if;
  end loop;
  foreach r in array regs loop
    if not (req ? r) then reasons := reasons || ('tundmatu piirkond: ' || r);
    elsif lvl < (req -> r ->> 0)::int or v_fame < (req -> r ->> 1)::numeric then reasons := reasons || ('piirkond avatud liiga vara: ' || r); end if;
  end loop;

  -- 2) kasvukiirus võrreldes viimase kinnitatud seisuga
  select * into t from kingdom_trust where user_id = u for update;
  if t.user_id is null then
    first := true;
    -- esimene salvestus (ka claude.ai mängust kolimine) võib olla kuni mõistliku suurusega
    if lvl > 35 or v_fame > 80000 or tre > 40 or v_gold > 300000 then reasons := reasons || 'esimene salvestus on liiga suur'::text; end if;
  else
    dt := greatest(0, extract(epoch from now() - t.at));
    if xpt > t.xp_total + 8000 + dt / 60 * 2500 then reasons := reasons || 'kogemus kasvas liiga kiiresti'::text; end if;
    if v_fame > t.fame + 5000 + dt / 60 * 1200 then reasons := reasons || 'kuulsus kasvas liiga kiiresti'::text; end if;
    if tre > t.treasures + 2 + floor(dt / 30) then reasons := reasons || 'aardeid tuli liiga kiiresti'::text; end if;
    if v_gold > t.gold + 60000 + dt / 60 * 8000 then reasons := reasons || 'kuld kasvas liiga kiiresti'::text; end if;
    if gt > t.gtime + dt + 600 then reasons := reasons || 'mänguaeg liikus kiiremini kui päris aeg'::text; end if;
  end if;
  ok := coalesce(array_length(reasons, 1), 0) = 0;

  insert into saves(user_id, data, level, fame, regions, treasures, updated_at)
  values (u, p_data, least(lvl, 100000), least(floor(v_fame), 2000000000)::int, nreg, least(tre, 100000), now())
  on conflict (user_id) do update set data = excluded.data, level = excluded.level, fame = excluded.fame,
    regions = excluded.regions, treasures = excluded.treasures, updated_at = now();

  if ok then
    insert into kingdom_trust(user_id, level, xp_total, fame, regions, treasures, gold, gtime, at)
    values (u, lvl, xpt, v_fame, nreg, tre, v_gold, gt, now())
    on conflict (user_id) do update set level = excluded.level, xp_total = excluded.xp_total, fame = excluded.fame,
      regions = excluded.regions, treasures = excluded.treasures, gold = excluded.gold, gtime = excluded.gtime, at = now();
  elsif first then
    insert into kingdom_trust(user_id, gold, at, flags, last_flag, last_flag_at)
    values (u, 120, now(), 1, array_to_string(reasons, ', '), now());
  else
    update kingdom_trust set flags = flags + 1, last_flag = array_to_string(reasons, ', '), last_flag_at = now() where user_id = u;
  end if;
  select * into t from kingdom_trust where user_id = u;
  return jsonb_build_object('trusted', ok, 'reason', case when ok then null else array_to_string(reasons, ', ') end,
    'level', t.level, 'fame', floor(t.fame), 'regions', t.regions, 'treasures', t.treasures);
end $$;

-- Kogu kalapüügi seis ühe päringuga
create or replace function public.fish_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; book jsonb; v_ach jsonb; byr jsonb; inv jsonb; inbox int; act jsonb; w text := fx_weather(); v_items jsonb; v_sb numeric;
begin
  f := fx_fisher(u); v_sb := fx_sell_bonus(u);
  perform fx_proc(u); perform fx_biz_tick(u); -- äripartnerite tellimused tekivad serveris
  -- vanad pooleli jäänud viskamised loetakse kaotatuks
  update fish_casts set state = 'lost' where user_id = u and state in ('waiting','hooked') and created_at < now() - interval '3 minutes';
  select coalesce(jsonb_object_agg(species, jsonb_build_object('n', n, 'max', mx, 'fa', fa, 'fs', fsp, 'ra', ra, 'rs', rsp, 'age', ag, 'len', ln)), '{}') into book
    from (select species, count(*) n, max(weight) mx, min(caught_at) fa, max(age) ag, max(length_cm) ln, (array_agg(spot order by caught_at))[1] fsp,
            (array_agg(caught_at order by weight desc, caught_at))[1] ra, (array_agg(spot order by weight desc, caught_at))[1] rsp
          from fish_catches where user_id = u and not bought group by species) x;
  select coalesce(jsonb_object_agg(ach, at), '{}') into v_ach from fish_unlocked where user_id = u;
  select coalesce(jsonb_object_agg(rarity, n), '{}') into byr from (select rarity, count(*) n from fish_catches where user_id = u and not bought group by rarity) x;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'species', species, 'rarity', rarity, 'weight', weight, 'spot', spot,
           'giant', giant, 'trophy', status = 'trophy', 'bought', bought, 'at', caught_at, 'trap', trap, 'fresh', round(fx_fresh(u, fish_catches), 2), 'age', age, 'len', length_cm, 'acls', age_cls, 'value', case when status = 'kept' then fx_sell_price(u, fish_catches, v_sb) end) order by status = 'trophy' desc, rarity desc, weight desc), '[]')
    into inv from fish_catches where user_id = u and status in ('kept','trophy');
  select count(*) into inbox from kingdom_inbox where user_id = u;
  select coalesce(jsonb_object_agg(item, qty), '{}') into v_items from fisher_items where user_id = u and qty > 0;
  select to_jsonb(c) - 'species' - 'junk' - 'weight' - 'kind' - 'user_id' into act from fish_casts c where user_id = u and state in ('waiting','hooked') order by id desc limit 1;
  return jsonb_build_object(
    'level', f.level, 'xp', f.xp, 'xp_need', case when f.level >= 50 then 0 else fx_xp_need(f.level) end, 'gold', f.gold,
    'rod', f.rod, 'rods', to_jsonb(f.rods), 'rods_broken', to_jsonb(f.rods_broken), 'rod_repairs', f.rod_repairs, 'bait', f.bait, 'baits', f.baits, 'rod_broken', f.rod_broken, 'luck', f.luck,
    'total', f.total, 'rare', f.rare, 'night', f.night, 'junk', f.junk, 'chests', f.chests, 'broken', f.broken, 'lost', f.lost,
    'orders_done', f.orders_done, 'comp_wins', f.comp_wins, 'biggest', f.biggest, 'biggest_species', f.biggest_species,
    'title', f.title, 'titles', to_jsonb(f.titles), 'book', book, 'ach', v_ach, 'by_rarity', byr, 'inventory', inv,
    'inbox', inbox, 'active', act, 'weather', w, 'wev', fx_wev_info(u), 'fleet_ready', (select count(*) from fisher_voyages v where v.user_id = u and v.status in ('sea','choice') and v.ready_at <= now()), 'is_night', fx_is_night(), 'is_winter', fx_is_winter(), 'today', fx_today(),
    'items', v_items, 'quests_done', f.quests_done, 'badges', fx_badges(u),
    'gear', fx_gear(u), 'boats', to_jsonb(f.boats),
    'rod_mods', (select coalesce(jsonb_object_agg(rod, jsonb_build_object('upg', upg, 'ench', ench, 'ench_lvl', ench_lvl)), '{}') from fisher_rods where user_id = u),
    'market_open', (select count(*) from fish_market where seller = u and status = 'open'),
    'house', f.house_level, 'aquarium', fx_aq_fish(u), 'aq_score', fx_aq_score(u), 'aq_pending', fx_aq_pending(u), 'aq_likes', f.aq_likes)
    || jsonb_build_object('cabin', (select coalesce(jsonb_agg(c.room), '[]') from fisher_cabin c where c.user_id = u and c.done_at <= now() and not c.damage), 'cabin_dmg', (select count(*) from fisher_cabin c where c.user_id = u and c.damage))
    || jsonb_build_object('lic', fx_lic_map(u))
    || jsonb_build_object('biz', fx_biz_summary(u))
    || jsonb_build_object('smoke', (select jsonb_build_object('ready', b.ready_at <= now(), 'at', b.ready_at) from fisher_smoke_batch b where b.user_id = u and b.status = 'run'))
    || jsonb_build_object('kuma', fx_kuma(), 'daypart', fx_daypart(), 'prestige', f.prestige, 'pxp', f.pxp, 'pxp_need', fx_star_need(f.prestige), 'star_bonus', fx_star_bonus(f.prestige), 'prestige_last', f.prestige_last);
end $$;

create or replace function public.fish_odds(p_spot text, p_bait text) returns numeric[] language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u);
  return fx_rarity_weights(u, p_spot, p_bait);
end $$;

-- 1) Viska õng
create or replace function public.fish_cast(p_spot text, p_bait text) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := fx_uid(); f fishers; sp fish_spots; b fish_baits; w numeric[]; roll numeric; acc numeric := 0; rar int := 1; i int;
  s fish_species; kind text := 'fish'; junk text; wt numeric; giant boolean := false; wait_ms int; cid bigint; cnt int;
  night boolean := fx_is_night(); winter boolean := fx_is_winter(); wthr text := fx_weather(); g jsonb; chm numeric; dp text := fx_daypart(); lure boolean; rr int;
  bsaved boolean := false; korv numeric; korv2 numeric; fit jsonb; wade boolean; peek numeric; ev text := fx_event(); evb boolean := false; lv int; wtemp numeric := fx_water(p_spot, now()); wpre boolean := fx_prestorm(); avgact numeric; att int; evs boolean;
begin
  f := fx_fisher(u);
  -- kahevõitluses on mõlemal samad kalad: arvestatakse madalama mängija taset
  select least(fa.level, fb.level) into lv from fish_duels d join fishers fa on fa.user_id = d.a join fishers fb on fb.user_id = d.b
    where (d.a = u or d.b = u) and d.status = 'live' and d.spot = p_spot and now() between d.start_at - interval '15 seconds' and d.end_at limit 1;
  if lv is null then perform fx_lic_check(u, p_spot); end if;
  lv := coalesce(lv, f.level);
  korv := fx_kit_v(u, 'korv'); korv2 := greatest(1, fx_kit_v(u, 'korv', true));
  if f.auto_dress then perform fx_dress_auto(u, p_spot); end if;
  fit := fx_fit(u, p_spot); wade := p_spot = 'jogi' and (fit -> 'worn') ? 'wade';
  select * into sp from fish_spots where id = p_spot;
  if sp.id is null then raise exception 'Tundmatu püügikoht'; end if;
  if f.level < sp.min_level then raise exception 'See püügikoht avaneb kalapüügi % tasemel', sp.min_level; end if;
  if sp.boat is not null and not (sp.boat = any(f.boats)) then raise exception 'Siia pääsemiseks on vaja paati: %', (select name from fish_boats where id = sp.boat); end if;
  if p_spot = 'udulaht' and not fx_room(u, 'sild') then raise exception 'Udulahes saab püüda, kui oled Kalurimaja paadisilla korda teinud'; end if;
  g := fx_gear(u, p_spot); chm := (g ->> 'chest')::numeric;
  if f.rod_broken then raise exception 'Õng on katki. Paranda see enne püüki.'; end if;
  select * into b from fish_baits where id = p_bait;
  if b.id is null then raise exception 'Tundmatu sööt'; end if;
  if b.consumable then
    cnt := coalesce((f.baits ->> b.id)::int, 0);
    if cnt < 1 then raise exception 'Sul pole seda sööta. Osta seda poest.'; end if;
    if random() >= coalesce((fx_house(u)).bait_save, 0) + 0.04 * fx_sk(u, 'saastlik') then
      if random() < fx_kit_v(u, 'ammber') then bsaved := true;
      else update fishers set baits = jsonb_set(baits, array[b.id], to_jsonb(cnt - 1)) where user_id = u; end if;
    end if;
  elsif b.price > 0 and not (f.baits ? b.id) then
    raise exception 'Sul pole seda peibutist.';
  end if;
  update fishers set bait = b.id where user_id = u;
  -- eelmine pooleli viske kaob
  update fish_casts set state = 'lost' where user_id = u and state in ('waiting','hooked');

  roll := random() * 100;
  if roll < 1.5 * chm then kind := 'chest';
    roll := random(); junk := case when roll < 0.05 then 'kuld' when roll < 0.30 then 'hobe' else 'puu' end;
  elsif roll < 1.5 * chm + 5 then kind := 'junk'; junk := (array['saabas','purk','kepp','pudel','karp','karp'])[1 + floor(random() * 6)::int];
  else
    -- erisündmused: haid merel (Haide väljakutse), säga öösel jõel ja Kuninglikul järvel (Sägaööd)
    if f.level >= 20 and public.fx_wev(now()) ->> 'kind' = 'valitseja' and public.fx_wev(now()) ->> 'phase' = 'on' and random() < 0.03 then
      -- Sügavuste Valitseja võib näkata igas püügikohas, kui ta on ärganud
      select * into s from fish_species where id = 'sygavvalitseja'; evb := true;
    elsif f.level >= 46 and p_spot = any(array['meri','saarestik','avameri']) and (wthr = 'torm' or wpre)
        and random() < (case when wthr = 'torm' then 0.05 else 0.025 end) * (case when p_bait = 'virmalislant' then 2 else 1 end) then
      -- Tormituur tõuseb tormiga (ja tormi eel) – Virmalislandiga kaks korda sagedamini
      select * into s from fish_species where id = 'tormituur'; evb := true;
    elsif ev = 'hai' and p_spot = any(array['meri','saarestik','avameri','sugavik']) and random() < 0.12 then
      select * into s from fish_species where id = case when p_spot <> 'meri' and f.level >= 20 and random() < 0.22 then 'heeringahai' else 'ogahai' end;
      if s.min_level > f.level then s := null; end if;
    elsif ev = 'saga' and p_spot = any(array['jogi','kuninglik']) and f.level >= 16 and random() < (case when night then 0.18 else 0.06 end) then
      select * into s from fish_species where id = 'saga'; evb := true;
    elsif p_spot = 'udulaht' and fx_room(u, 'poonung') and random() < (case when wthr = 'udu' then 0.035 when night then 0.022 else 0.006 end) * fx_room_mul(u, 'poonung') then
      select * into s from fish_species where id = 'hallhaug'; evb := true;
    end if;
    -- ilm ja vesi: loid kala jätab sageli näkkamata – siis proovib järgmine (kuni 3 korda)
    evs := s.id is not null;
    for att in 1..3 loop
      acc := 0; rar := 1;
      w := fx_rarity_weights(u, p_spot, p_bait);
      roll := random() * 100;
      for i in 1..6 loop acc := acc + w[i]; if roll <= acc then rar := i; exit; end if; rar := i; end loop;
      -- Lant (hõbelant, kuldvobler, draakonilant, soomuslant) võtavad AINULT röövkalad: kala, kelle söötade hulgas
      -- on lant või kes on röövkala. Rahulikud kalad (latikas, karpkala, särg…) lanti ei võta.
      lure := p_bait = any(array['hobelant','kuldvobler','draakonilant','soomuslant','virmalislant']);
      if s.id is null and lure then
        -- otsi alates veeretatud haruldusest allapoole; kui seal lanti võtvat kala pole (nt avamerel pole tavalisi röövkalu), siis ülespoole
        foreach rr in array (array(select generate_series(rar, 1, -1)) || array(select generate_series(rar + 1, 6))) loop
          select * into s from fish_species fs where fs.rarity = rr and p_spot = any(fs.spots) and fs.min_level <= lv and fs.event is null
            and (not fs.night_only or night) and (not fs.winter_only or winter or p_spot = 'jaa')
            and (fs.weather is null or wthr = any(fs.weather)) and (fs.baits && array['hobelant','kuldvobler','draakonilant','soomuslant','virmalislant'] or 'pred' = any(fs.wx_tags))
            order by -ln(greatest(random(), 1e-9)) / ((case when p_bait = any(fs.baits) then 4 else 1 end) * (case when dp = any(fs.times) then 2.5 else 1 end) * fx_season_k(fs.season) * fx_act(fs.temp_pref, fs.wx_tags, wthr, wtemp, wpre, dp)) limit 1;
          exit when s.id is not null;
        end loop;
        if s.id is null then raise exception 'Siin ei võta praegu ükski kala lanti – proovi elussööta (vihmauss, vagel, mais)'; end if;
      end if;
      while s.id is null and rar >= 1 loop
        select * into s from fish_species fs where fs.rarity = rar and p_spot = any(fs.spots) and fs.min_level <= lv and fs.event is null
          and (not fs.night_only or night) and (not fs.winter_only or winter or p_spot = 'jaa')
          and (fs.weather is null or wthr = any(fs.weather))
          order by case when fs.weather is not null and random() < (g ->> 'wpref')::numeric then 0 else 1 end,
            -ln(greatest(random(), 1e-9)) / ((case when p_bait = any(fs.baits) then 4 else 1 end) * (case when dp = any(fs.times) then 2.5 else 1 end)
              * (case when fs.baits && array['mais','leib'] or fs.id in ('latikas','karpkala') then korv2 else 1 end)
              * (case when wade and fs.id = any(array['harjus','joeforell','vikerforell','lohe','toogjas','teib','sainas','turb','vimb','koha']) then 1.6 else 1 end)
              * fx_season_k(fs.season) * fx_act(fs.temp_pref, fs.wx_tags, wthr, wtemp, wpre, dp)) limit 1;
        exit when s.id is not null;
        rar := rar - 1;
      end loop;
      exit when s.id is null or evs or att = 3 or random() < least(1, fx_act(s.temp_pref, s.wx_tags, wthr, wtemp, wpre, dp) / 1.15);
      s := null;
    end loop;
    if s.id is null then raise exception 'Siin pole praegu kalu'; end if;
    wt := s.min_w + (s.max_w - s.min_w) * power(random(), case when evb then 1.3 when fx_onn_on() then 0.63 else 2.2 end);
    wt := wt * (1 + 0.02 * fx_sk(u, 'raskesaak')); -- oskus: Raske saak
    -- Õnnetunnil on hiiglase võimalus (varustuse järgi) kahekordne
    if random() < 0.03 * (g ->> 'giant')::numeric * (case when fx_onn_on() then 2 else 1 end) * (1 + 0.1 * fx_sk(u, 'hiiglased')) then giant := true; wt := s.max_w * (1.25 + random() * 0.35); end if;
    wt := round(wt, case when wt < 1 then 3 else 2 end);
  end if;
  -- kalade üldine aktiivsus selles kohas mõjutab, kui kiiresti näkkab
  select avg(fx_act(fs.temp_pref, fs.wx_tags, wthr, wtemp, wpre, dp)) into avgact from fish_species fs where p_spot = any(fs.spots) and fs.min_level <= lv and fs.event is null;
  wait_ms := round((1800 + random() * 5200) * greatest(0.75, least(1.3, 1.25 - 0.25 * coalesce(avgact, 1))) * b.wait_mult * (case when p_spot = 'udulaht' then 1 - 0.15 * greatest(1, fx_room_mul(u, 'sild')) else 1 end) * fx_weather_wait(wthr) * fx_wev_wait(p_spot) * (g ->> 'wait')::numeric * (1 - korv) * (case when fit ->> 'tier' = 'hea' and (fit ->> 'need')::int > 0 then 0.9 else 1 end));
  wait_ms := round(wait_ms * (1 - 0.03 * fx_sk(u, 'kiirnakk'))); -- oskus: Kiire näkk
  if kind = 'fish' and (fit -> 'worn') ? 'polar' and wthr in ('paike','pilves') then peek := round(least(1, sqrt(wt / 15.0)), 2); end if;
  insert into fish_casts(user_id, spot, bait, kind, species, junk, weight, giant, bite_at)
  values (u, p_spot, b.id, kind, s.id, junk, wt, giant, now() + make_interval(secs => wait_ms / 1000.0))
  returning id into cid;
  return jsonb_build_object('cast_id', cid, 'wait_ms', wait_ms, 'weather', wthr, 'night', night, 'bait_saved', bsaved, 'fit', fit ->> 'tier', 'peek', peek, 'wade', wade);
end $$;

-- 2) Haagi (kala näkkas)
create or replace function public.fish_hook(p_cast bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); c fish_casts; s fish_species; r fish_rods; f fishers; sp fish_spots;
  need int; zone numeric; speed numeric; est numeric; diff int;
begin
  select * into c from fish_casts where id = p_cast and user_id = u for update;
  if c.id is null or c.state <> 'waiting' then return jsonb_build_object('ok', false, 'reason', 'gone'); end if;
  if now() < c.bite_at - interval '300 milliseconds' then
    update fish_casts set state = 'lost' where id = c.id; update fishers set lost = lost + 1 where user_id = u;
    return jsonb_build_object('ok', false, 'reason', 'early');
  end if;
  if now() > c.bite_at + interval '4 seconds' then -- varu aeglase mobiilühenduse jaoks (mängija näeb näkkamist 1,9 s)
    update fish_casts set state = 'lost' where id = c.id; update fishers set lost = lost + 1 where user_id = u;
    return jsonb_build_object('ok', false, 'reason', 'late');
  end if;
  select * into f from fishers where user_id = u;
  select * into r from fish_rods where id = f.rod;
  select * into sp from fish_spots where id = c.spot;
  r.reel_bonus := (fx_gear(u) ->> 'reel')::numeric + case when (fx_fit(u, c.spot) -> 'worn') ? 'pockets' then 0.03 else 0 end + 0.02 * fx_sk(u, 'haardemeister'); r.strength := (fx_gear(u) ->> 'strength')::numeric;
  if c.kind = 'fish' then
    select * into s from fish_species where id = c.species;
    diff := s.difficulty;
    need := 2 + (s.rarity >= 3)::int + (s.rarity >= 5)::int + (s.difficulty >= 9)::int;
    zone := greatest(0.08, 0.27 - s.rarity * 0.025 - sp.difficulty * 0.01 + r.reel_bonus);
    speed := 1.0 + s.difficulty * 0.12 + least(0.5, c.weight / 60);
    est := round(c.weight * (0.96 + random()::numeric * 0.08), case when c.weight >= 10 then 0 else 1 end);  -- silma järgi hinnang, viga kuni ±4%
  else
    diff := 2; need := 2; zone := 0.26 + r.reel_bonus; speed := 1.0; est := case when c.kind = 'chest' then round((6 + random() * 6)::numeric, 1) else round((0.3 + random())::numeric, 1) end;
  end if;
  update fish_casts set state = 'hooked', hooked_at = now(), need_hits = need where id = c.id;
  return jsonb_build_object('ok', true, 'need', need, 'zone', round(zone, 3), 'speed', round(speed, 2), 'est', est,
    'strength', r.strength, 'difficulty', diff, 'kahv', fx_kit_v(u, 'kahv', true));
end $$;

-- 3a) Kala pääses (mängija eksis liiga palju)
create or replace function public.fish_lose(p_cast bigint) returns void language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  update fish_casts set state = 'lost' where id = p_cast and user_id = u and state in ('waiting','hooked');
  if found then update fishers set lost = lost + 1 where user_id = u; end if;
end $$;

-- 3b) Too kala välja
create or replace function public.fish_land(p_cast bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); c fish_casts; f fishers; s fish_species; r fish_rods; sp fish_spots;
  chance numeric; wthr text := fx_weather(); v_night boolean := fx_is_night(); levels int[]; xp int; ach jsonb;
  newsp boolean; prevmax numeric; cid bigint; res jsonb; g int; items jsonb := '[]'; tier text; kt jsonb;
  roll numeric; netsave boolean := false; s2 fish_species; w2 numeric; second jsonb; cid2 bigint; fit jsonb; dressed boolean;
begin
  select * into c from fish_casts where id = p_cast and user_id = u for update;
  if c.id is null or c.state <> 'hooked' then return jsonb_build_object('ok', false, 'reason', 'gone'); end if;
  if now() < c.hooked_at + make_interval(secs => greatest(0.6, c.need_hits * 0.45 - 0.3)) then
    update fish_casts set state = 'lost' where id = c.id; update fishers set lost = lost + 1 where user_id = u;
    return jsonb_build_object('ok', false, 'reason', 'too_fast');
  end if;
  if now() > c.hooked_at + interval '90 seconds' then
    update fish_casts set state = 'lost' where id = c.id; update fishers set lost = lost + 1 where user_id = u;
    return jsonb_build_object('ok', false, 'reason', 'slow');
  end if;
  f := fx_fisher(u);
  select * into r from fish_rods where id = f.rod;
  r.strength := (fx_gear(u) ->> 'strength')::numeric;
  select * into sp from fish_spots where id = c.spot;

  if c.kind = 'junk' then
    update fish_casts set state = 'landed' where id = c.id;
    update fishers set junk = junk + 1, gold = gold + case when c.junk = 'purk' then 3 else 0 end where user_id = u;
    if c.junk = 'pudel' then perform fx_inbox(u, '{"map":1}', 'Pudelipost'); end if;
    if c.junk = 'karp' then
      items := fx_give_item(u, 'karp', 1);
      if random() < 0.25 then items := items || fx_give_item(u, 'parl', 1); end if;
    end if;
    levels := fx_add_xp(u, 8 * fx_xp_mult());
    ach := fx_check_ach(u);
    return jsonb_build_object('ok', true, 'kind', 'junk', 'junk', c.junk, 'xp', 8 * fx_xp_mult(), 'x2', fx_kuma(), 'levels', to_jsonb(levels), 'ach', ach,
      'gold', case when c.junk = 'purk' then 3 else 0 end, 'map', c.junk = 'pudel', 'items', items)
      || jsonb_build_object('sec', fx_secret_ev(u, 'junk', '{}'));
  elsif c.kind = 'chest' then
    tier := coalesce(nullif(c.junk, ''), 'puu');
    g := case tier when 'kuld' then 400 + f.level * 60 when 'hobe' then 150 + f.level * 30 else 60 + f.level * 15 end + floor(random() * 60)::int;
    g := round(g * (1 + 0.08 * fx_sk(u, 'aardekutt'))); -- oskus: Aardekütt
    update fish_casts set state = 'landed' where id = c.id;
    update fishers set chests = chests + 1, gold = gold + g where user_id = u;
    items := fx_give_random(u, case tier when 'kuld' then 5 when 'hobe' then 3 else 2 end, case tier when 'kuld' then 3 when 'hobe' then 2 else 1 end);
    if random() < (case tier when 'kuld' then 1 when 'hobe' then 0.4 else 0.15 end) then perform fx_inbox(u, '{"map":1}', 'Veealune aardekirst'); res := '{"map":true}'; else res := '{"map":false}'; end if;
    if tier = 'kuld' then perform fx_news(u, 'chest', jsonb_build_object('gold', g)); end if;
    levels := fx_add_xp(u, ((case tier when 'kuld' then 150 when 'hobe' then 60 else 30 end) + f.level * 2) * fx_xp_mult());
    ach := fx_check_ach(u);
    return jsonb_build_object('ok', true, 'kind', 'chest', 'tier', tier, 'gold', g, 'xp', ((case tier when 'kuld' then 150 when 'hobe' then 60 else 30 end) + f.level * 2) * fx_xp_mult(), 'x2', fx_kuma(),
      'levels', to_jsonb(levels), 'ach', ach, 'items', items) || res
      || jsonb_build_object('sec', fx_secret_ev(u, 'chest', jsonb_build_object('tier', tier)));
  end if;

  select * into s from fish_species where id = c.species;
  -- varustuse tugevus
  if c.weight > r.strength then
    chance := least(1, (c.weight / r.strength - 1) * 1.3) + case when wthr = 'torm' then 0.1 else 0 end;
    if fx_myth(u, 'hobesoomus') then chance := chance * 0.5; end if;
    chance := chance * (1 - fx_lab_aura(u, 'kaitse') * 2);
    chance := chance * (1 - 0.08 * fx_sk(u, 'kindelkasi')); -- oskus: Kindel käsi
    roll := random();
    if roll < chance and roll >= chance * (1 - fx_kit_v(u, 'kahv', true)) then netsave := true; end if;
    if roll < chance * (1 - fx_kit_v(u, 'kahv', true)) then
      update fish_casts set state = 'broken' where id = c.id;
      update fishers set rod_broken = true, broken = broken + 1, rods_broken = case when f.rod = any(rods_broken) then rods_broken else rods_broken || f.rod end where user_id = u;
      ach := fx_check_ach(u);
      return jsonb_build_object('ok', false, 'reason', 'broken', 'weight', c.weight, 'strength', r.strength, 'name', s.name, 'ach', ach, 'kahv', fx_kit_v(u, 'kahv', true),
        'risk', round(least(1, (c.weight / r.strength - 1) * 1.3) * (1 - fx_kit_v(u, 'kahv', true)) * 100));
    end if;
  end if;
  fit := fx_fit(u, c.spot); dressed := fit ->> 'tier' = 'hea' and (fit ->> 'need')::int > 0;
  chance := (case when wthr = 'torm' then 0.06 else 0.03 end) * (case when fx_myth(u, 'varjuvork') then 0.5 else 1 end)
    * (case when dressed then 0.8 else 1 end) * (case when (fit -> 'worn') ? 'grip' then 0.85 else 1 end);
  roll := random();
  if roll < chance and roll >= chance * (1 - fx_kit_v(u, 'kahv')) then netsave := true; end if;
  if roll < chance * (1 - fx_kit_v(u, 'kahv')) then
    update fish_casts set state = 'lost' where id = c.id; update fishers set lost = lost + 1 where user_id = u;
    return jsonb_build_object('ok', false, 'reason', 'escaped', 'name', s.name, 'rarity', s.rarity);
  end if;

  select max(weight) into prevmax from fish_catches where user_id = u and species = s.id and not bought;
  newsp := prevmax is null;
  update fish_casts set state = 'landed' where id = c.id;
  insert into fish_catches(user_id, species, rarity, weight, spot, giant, night, weather, dressed)
  values (u, s.id, s.rarity, c.weight, c.spot, c.giant, v_night, wthr, dressed) returning id into cid;
  -- uudised erakordsetest püükidest
  if s.rarity >= 3 and not exists (select 1 from fish_catches where species = s.id and id <> cid and not bought) then
    perform fx_news(u, 'first', jsonb_build_object('species', s.id, 'weight', c.weight, 'rarity', s.rarity));
  elsif s.rarity >= 5 then
    perform fx_news(u, 'catch', jsonb_build_object('species', s.id, 'weight', c.weight, 'rarity', s.rarity));
  elsif c.giant and s.rarity >= 3 then
    perform fx_news(u, 'giant', jsonb_build_object('species', s.id, 'weight', c.weight, 'rarity', s.rarity));
  elsif c.weight >= 1 and c.weight > coalesce((select max(weight) from fish_catches where species = s.id and id <> cid and not bought), c.weight) then
    -- uus mängurekord selle liigi kohta (kõigi mängijate peale)
    perform fx_news(u, 'grecord', jsonb_build_object('species', s.id, 'weight', c.weight, 'rarity', s.rarity));
  elsif c.weight >= 10 and c.weight > coalesce((select max(weight) from fish_catches where user_id = u and id <> cid and not bought), c.weight) then
    -- mängija kõigi aegade suurim kala
    perform fx_news(u, 'pbig', jsonb_build_object('species', s.id, 'weight', c.weight, 'rarity', s.rarity));
  end if;
  -- harva leiab kala kõhust midagi
  if random() < 0.04 then items := fx_give_random(u, least(5, s.rarity + 1), 1); end if;
  -- ridvahoidja: teise õnge otsa tuli samal ajal kala
  if random() < fx_kit_v(u, 'hoidja') + 0.006 * fx_sk(u, 'topeltnakk') then
    select fs.* into s2 from fish_species fs where fs.rarity <= 2 and c.spot = any(fs.spots) and fs.min_level <= f.level and fs.weather is null and fs.event is null
      and (not fs.night_only or v_night) and (not fs.winter_only or fx_is_winter() or c.spot = 'jaa') order by random() limit 1;
    if s2.id is not null then
      w2 := s2.min_w + (s2.max_w - s2.min_w) * power(random(), 2.2); w2 := round(w2, case when w2 < 1 then 3 else 2 end);
      insert into fish_catches(user_id, species, rarity, weight, spot, night, weather) values (u, s2.id, s2.rarity, w2, c.spot, v_night, wthr) returning id into cid2;
      update fishers set total = total + 1 where user_id = u;
      second := jsonb_build_object('catch_id', cid2, 'species', s2.id, 'name', s2.name, 'rarity', s2.rarity, 'weight', w2);
    end if;
  end if;
  update fishers set total = total + 1, rare = rare + (s.rarity >= 3)::int, night = fishers.night + v_night::int,
    biggest = greatest(biggest, c.weight),
    biggest_species = case when c.weight > biggest then s.id else biggest_species end
    where user_id = u;
  xp := round(s.xp * (1 + sp.difficulty * 0.1) * case when c.giant then 1.5 else 1 end * case when newsp then 2 else 1 end);
  xp := round(xp * (1 + coalesce((fx_house(u)).xp_bonus, 0) + case when fx_myth(u, 'hobesarv') then 0.10 else 0 end + fx_lab_aura(u, 'tarkus') + case when v_night then 0.15 * fx_room_mul(u, 'laternatuba') else 0 end + case when dressed then 0.10 else 0 end + 0.03 * fx_sk(u, 'kalatundja'))) * fx_xp_mult();
  levels := fx_add_xp(u, xp);
  if 50 = any(levels) or 25 = any(levels) then perform fx_news(u, 'level', jsonb_build_object('level', (select max(x) from unnest(levels) x))); end if;
  ach := fx_check_ach(u);
  kt := fx_kt_add(u, s.id, s.rarity, c.weight, c.giant);
  return coalesce((select jsonb_build_object('age', z.age, 'len', z.length_cm, 'acls', z.age_cls) from fish_catches z where z.id = cid), '{}')
    || jsonb_build_object('ok', true, 'kind', 'fish', 'kt', kt, 'catch_id', cid, 'items', items, 'species', s.id, 'name', s.name, 'rarity', s.rarity,
    'weight', c.weight, 'giant', c.giant, 'new_species', newsp, 'record', prevmax is not null and c.weight > prevmax,
    'xp', xp, 'x2', fx_kuma(), 'fav', c.bait = any(s.baits), 'best', fx_daypart() = any(s.times), 'levels', to_jsonb(levels), 'ach', ach)
    || jsonb_build_object('net', netsave, 'second', second, 'dressed', dressed)
    || jsonb_build_object('sec', fx_secret_ev(u, 'catch', jsonb_build_object('species', s.id, 'weather', wthr,
         'killed', coalesce((kt ->> 'killed')::boolean, false), 'boat', sp.boat is not null, 'kt', kt is not null,
         'spot', c.spot, 'night', v_night, 'weight', c.weight)));
end $$;

-- Turuhinnad (muutuvad iga päev, müües sama kala ühel päeval palju langeb hind)
-- Kala suurusekordaja hinnale: väikseim kala ×0,5, oma liigi suurim ×2,5, hiiglased veel rohkem (logaritmiline skaala,
-- sest liigi kaalud erinevad kümneid kordi – nt haug 0,8–14 kg)
create or replace function public.fx_size_mult(s public.fish_species, w numeric) returns numeric language sql immutable as $$
  select 0.5 + 2 * least(1.6, greatest(0, ln(greatest(w, s.min_w) / s.min_w) / ln(greatest(1.01, s.max_w / s.min_w)))) $$;
create or replace function public.fx_market_mult(p_species text, d date) returns numeric language sql immutable as
$$ select round((0.7 + (abs(hashtext('turg' || p_species || d::text)) % 600) / 1000.0)::numeric, 2) $$;

create or replace function public.fish_market() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today();
begin
  return (select coalesce(jsonb_object_agg(s.id, jsonb_build_object('mult', fx_market_mult(s.id, d), 'sold', coalesce(x.qty, 0))), '{}')
    from fish_species s left join fish_sales x on x.user_id = u and x.day = d and x.species = s.id);
end $$;

-- Müügihinna boonused (maja, prestiiž, müüdid, ruumid, labor) – üks kord mängija kohta
create or replace function public.fx_sell_bonus(u uuid) returns numeric language plpgsql as $$
begin
  return 1 + coalesce((fx_house(u)).sell_bonus, 0) + fx_star_bonus((select prestige from fishers where user_id = u))
    + case when fx_myth(u, 'udukroon') then 0.10 else 0 end + 0.08 * fx_room_mul(u, 'suitsukoda') + fx_trophy_bonus(u) + fx_lab_aura(u, 'kuld') + 0.02 * fx_sk(u, 'kaupmees');
end $$;
-- Ühe kala praegune müügihind (ei muuda midagi; sama arv näidatakse ka mängijale)
create or replace function public.fx_sell_price(u uuid, c fish_catches, p_bonus numeric default null) returns int language plpgsql as $$
declare s fish_species; d date := fx_today(); sold int; v numeric;
begin
  select * into s from fish_species where id = c.species;
  select coalesce(qty, 0) into sold from fish_sales where user_id = u and day = d and species = c.species;
  v := s.price * fx_market_mult(s.id, d) * fx_size_mult(s, c.weight) / (1 + coalesce(sold, 0) / 15.0)
       * (coalesce(p_bonus, fx_sell_bonus(u)) + case when c.bought then 0 else fx_kit_v(u, 'sump') end)
       * (case when c.bought then 0.6 else 1 end) * fx_fresh(u, c);
  return greatest(1, round(v));
end $$;
drop function if exists public.fx_sell_value(uuid, public.fish_catches);
create or replace function public.fx_sell_value(u uuid, c fish_catches, p_bonus numeric default null) returns int language plpgsql as $$
declare v int;
begin
  v := fx_sell_price(u, c, p_bonus);
  insert into fish_sales(user_id, day, species, qty) values (u, fx_today(), c.species, 1)
    on conflict (user_id, day, species) do update set qty = fish_sales.qty + 1;
  return v;
end $$;

-- Kalade kasutamine: müü / toiduks / vabaks / trofeeks / vaheta
create or replace function public.fish_use(p_ids bigint[], p_action text, p_choice text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); c fish_catches; s fish_species; v_gold int := 0; v_food int := 0; v_fame int := 0; v_xp int := 0; v_maps int := 0;
  n int := 0; levels int[] := '{}'; ntro int; f fishers; extra jsonb := '{}'; bb text; rel text[] := '{}'; v_sb numeric;
begin
  if p_action not in ('sell','cook','release','trophy','untrophy','exchange') then raise exception 'Tundmatu tegevus'; end if;
  f := fx_fisher(u);
  if p_action = 'sell' then v_sb := fx_sell_bonus(u); end if; -- müügiboonus arvutatakse üks kord, mitte iga kala jaoks
  if p_action = 'exchange' and coalesce(array_length(p_ids, 1), 0) <> 1 then raise exception 'Vaheta korraga üks kala'; end if;
  for c in select * from fish_catches where id = any(p_ids) and user_id = u
             and status = case when p_action = 'untrophy' then 'trophy' else 'kept' end for update loop
    select * into s from fish_species where id = c.species;
    if p_action = 'sell' then v_gold := v_gold + fx_sell_value(u, c, v_sb); update fish_catches set status = 'sold' where id = c.id;
    elsif p_action = 'cook' then v_food := v_food + greatest(2, round(c.weight * 4 + s.rarity * 3)); update fish_catches set status = 'cooked' where id = c.id;
    elsif p_action = 'release' then rel := rel || s.id; v_fame := v_fame + s.rarity * 2; v_xp := v_xp + ceil(s.xp * 0.3); update fish_catches set status = 'released' where id = c.id;
    elsif p_action = 'trophy' then
      select count(*) into ntro from fish_catches where user_id = u and status = 'trophy';
      if ntro >= 12 then raise exception 'Trofeeriiulil on ruumi 12 kalale'; end if;
      update fish_catches set status = 'trophy' where id = c.id;
    elsif p_action = 'untrophy' then update fish_catches set status = 'kept' where id = c.id;
    elsif p_action = 'exchange' then
      if s.rarity < 4 then raise exception 'Vahetada saab ainult eepilisi ja haruldasemaid kalu'; end if;
      if s.id = 'kuldkala' then
        if p_choice = 'rikkus' then v_gold := 3000 + f.level * 100;
        elsif p_choice = 'tarkus' then v_xp := 1500 + f.level * 100;
        elsif p_choice = 'onn' then
          if f.luck >= 5 then raise exception 'Kaluriõnn on juba maksimumis'; end if;
          update fishers set luck = luck + 1 where user_id = u; extra := '{"luck":1}';
        elsif p_choice = 'kuningriik' then perform fx_inbox(u, jsonb_build_object('gold', 4000 + f.level * 100), 'Kuldkala soov');
          extra := jsonb_build_object('kingdom_gold', 4000 + f.level * 100);
        else raise exception 'Vali soov'; end if;
      elsif p_choice = 'kaart' then v_maps := s.rarity - 3;
      elsif p_choice = 'kuulsus' then v_fame := s.rarity * s.rarity * 12;
      elsif p_choice = 'sööt' then
        select id into bb from fish_baits where consumable and min_level <= f.level order by sort desc limit 1;
        update fishers set baits = jsonb_set(baits, array[bb], to_jsonb(coalesce((baits ->> bb)::int, 0) + s.rarity * 6)) where user_id = u;
        extra := jsonb_build_object('bait', bb, 'qty', s.rarity * 6);
      else raise exception 'Vali vahetuse preemia'; end if;
      update fish_catches set status = 'exchanged' where id = c.id;
    end if;
    n := n + 1;
  end loop;
  if n = 0 then raise exception 'Valitud kalu ei leitud'; end if;
  if v_gold > 0 then update fishers set gold = fishers.gold + v_gold where user_id = u; end if;
  if v_xp > 0 then levels := fx_add_xp(u, v_xp); end if;
  if v_food > 0 or v_fame > 0 or v_maps > 0 then
    perform fx_inbox(u, jsonb_strip_nulls(jsonb_build_object('food', nullif(v_food,0), 'fame', nullif(v_fame,0), 'map', nullif(v_maps,0))),
      case p_action when 'cook' then 'Kalaroog' when 'release' then 'Vabaks lastud kalad' else 'Kalavahetus' end);
  end if;
  return jsonb_build_object('n', n, 'gold', v_gold, 'food', v_food, 'fame', v_fame, 'xp', v_xp, 'map', v_maps, 'levels', to_jsonb(levels),
    'ach', fx_check_ach(u)) || extra
    || jsonb_build_object('sec', case when p_action = 'release' then fx_secret_ev(u, 'release', jsonb_build_object('species', to_jsonb(rel))) end);
end $$;

create or replace function public.fish_sell_all(p_max_rarity int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); ids bigint[];
begin
  select array_agg(id) into ids from fish_catches where user_id = u and status = 'kept' and rarity <= least(p_max_rarity, 3);
  if ids is null then raise exception 'Pole midagi müüa'; end if;
  return fish_use(ids, 'sell');
end $$;

-- Pood
create or replace function public.fish_shop(p_kind text, p_id text, p_qty int default 1) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; r fish_rods; b fish_baits; cost int;
begin
  f := fx_fisher(u);
  if p_kind = 'rod' then
    select * into r from fish_rods where id = p_id;
    if r.id is null then raise exception 'Tundmatu õng'; end if;
    if f.rod_broken and not (f.rod = any(f.rods_broken)) then update fishers set rods_broken = rods_broken || f.rod where user_id = u; f.rods_broken := f.rods_broken || f.rod; end if;
    if r.id = any(f.rods) then update fishers set rod = r.id, rod_broken = r.id = any(rods_broken) where user_id = u; return jsonb_build_object('equipped', r.id); end if;
    if f.level < r.min_level then raise exception 'See õng avaneb % tasemel', r.min_level; end if;
    if f.gold < r.price then raise exception 'Kulda jääb puudu'; end if;
    update fishers set gold = gold - r.price, rods = rods || r.id, rod = r.id, rod_broken = r.id = any(rods_broken) where user_id = u;
    return jsonb_build_object('bought', r.id, 'cost', r.price);
  elsif p_kind = 'bait' then
    select * into b from fish_baits where id = p_id;
    if b.id is null then raise exception 'Tundmatu sööt'; end if;
    if b.craft then raise exception 'Seda sööta saab ainult ise valmistada Kalurimaja söödalaual'; end if;
    if f.level < b.min_level then raise exception 'See sööt avaneb % tasemel', b.min_level; end if;
    if not b.consumable then
      if b.price = 0 or f.baits ? b.id then update fishers set bait = b.id where user_id = u; return jsonb_build_object('equipped', b.id); end if;
      if f.gold < b.price then raise exception 'Kulda jääb puudu'; end if;
      update fishers set gold = gold - b.price, baits = baits || jsonb_build_object(b.id, 1), bait = b.id where user_id = u;
      return jsonb_build_object('bought', b.id, 'cost', b.price);
    end if;
    if p_qty not in (10, 50) then raise exception 'Vali kogus 10 või 50'; end if;
    cost := b.price * p_qty;
    if f.gold < cost then raise exception 'Kulda jääb puudu'; end if;
    update fishers set gold = gold - cost, bait = b.id,
      baits = jsonb_set(baits, array[b.id], to_jsonb(coalesce((baits ->> b.id)::int, 0) + p_qty)) where user_id = u;
    return jsonb_build_object('bought', b.id, 'qty', p_qty, 'cost', cost);
  elsif p_kind = 'equip_bait' then
    select * into b from fish_baits where id = p_id;
    if b.id is null then raise exception 'Tundmatu sööt'; end if;
    update fishers set bait = b.id where user_id = u; return jsonb_build_object('equipped', b.id);
  elsif p_kind = 'repair' then
    if not (f.rod = any(f.rods_broken)) then update fishers set rod_broken = false where user_id = u; return jsonb_build_object('repaired', false); end if;
    select * into r from fish_rods where id = f.rod;
    cost := greatest(10, round(r.price * 0.2));
    if f.gold < cost then raise exception 'Kiirparanduseks on vaja % kulda. Vii õng tasuta meistri juurde (2 tundi).', cost; end if;
    update fishers set gold = gold - cost, rod_broken = false, rods_broken = array_remove(rods_broken, f.rod), rod_repairs = rod_repairs - f.rod where user_id = u;
    return jsonb_build_object('repaired', true, 'cost', cost);
  elsif p_kind = 'repair_free' then
    if not (coalesce(p_id, f.rod) = any(f.rods_broken)) then raise exception 'See õng ei ole katki'; end if;
    if f.rod_repairs ? coalesce(p_id, f.rod) then raise exception 'See õng on juba meistri juures'; end if;
    update fishers set rod_repairs = rod_repairs || jsonb_build_object(coalesce(p_id, f.rod), now() + interval '2 hours') where user_id = u;
    return jsonb_build_object('repairing', coalesce(p_id, f.rod), 'ready', now() + interval '2 hours');
  elsif p_kind = 'title' then
    if p_id is not null and not (p_id = any(f.titles)) then raise exception 'Sul pole seda tiitlit'; end if;
    update fishers set title = p_id where user_id = u; return jsonb_build_object('title', p_id);
  elsif p_kind = 'transfer' then
    if p_qty < 1 or p_qty > f.gold then raise exception 'Vale summa'; end if;
    update fishers set gold = gold - p_qty where user_id = u;
    perform fx_inbox(u, jsonb_build_object('gold', p_qty), 'Kalurikassast');
    return jsonb_build_object('transferred', p_qty);
  end if;
  raise exception 'Tundmatu tegevus';
end $$;

-- Kuningliku köögi päevased tellimused
create or replace function public.fish_orders_today() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d date := fx_today(); cnt int; i int; s fish_species; maxr int; q int; have int;
begin
  f := fx_fisher(u);
  if not exists (select 1 from fish_orders where user_id = u and day = d) then
    cnt := 1 + (f.level >= 5)::int + (f.level >= 12)::int + (f.level >= 20)::int;
    for i in 1..cnt loop
      maxr := case when i = 4 then 4 else least(3, 1 + f.level / 10) end;
      select fs.* into s from fish_species fs
        where fs.rarity <= maxr and fs.min_level <= f.level and not fs.night_only and not fs.winter_only and fs.event is null
          and exists (select 1 from fish_spots p where p.id = any(fs.spots) and p.min_level <= f.level)
          and fs.id not in (select species from fish_orders where user_id = u and day = d)
          and fs.id <> 'kuldkala'
        order by case when i = 4 then -fs.rarity else 0 end, md5(u::text || d::text || i::text || fs.id) limit 1;
      if s.id is not null then
        q := case s.rarity when 1 then 3 + (abs(hashtext(u::text || d::text || i::text)) % 4) when 2 then 2 + (abs(hashtext(d::text || i::text)) % 2) else 1 end;
        insert into fish_orders(user_id, day, idx, species, qty, reward_gold, reward_xp, reward_fame)
        values (u, d, i, s.id, q, round(s.price * q * 1.7 + 25), round(s.xp * q * 1.6 + 10), s.rarity * 3 + q);
      end if;
    end loop;
  end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('idx', o.idx, 'species', o.species, 'qty', o.qty, 'gold', o.reward_gold,
      'xp', o.reward_xp, 'fame', o.reward_fame, 'done', o.done,
      'have', (select count(*) from fish_catches c where c.user_id = u and c.species = o.species and c.status = 'kept')) order by o.idx), '[]')
    from fish_orders o where o.user_id = u and o.day = d);
end $$;

create or replace function public.fish_order_deliver(p_idx int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); o fish_orders; ids bigint[]; levels int[];
begin
  select * into o from fish_orders where user_id = u and day = fx_today() and idx = p_idx for update;
  if o.user_id is null or o.done then raise exception 'Tellimust ei leitud'; end if;
  select array_agg(id) into ids from (select id from fish_catches where user_id = u and species = o.species and status = 'kept'
    order by weight asc limit o.qty) x;
  if coalesce(array_length(ids, 1), 0) < o.qty then raise exception 'Sul pole veel piisavalt neid kalu'; end if;
  update fish_catches set status = 'delivered' where id = any(ids);
  update fish_orders set done = true where user_id = u and day = o.day and idx = o.idx;
  update fishers set gold = gold + o.reward_gold, orders_done = orders_done + 1 where user_id = u;
  perform fx_inbox(u, jsonb_build_object('fame', o.reward_fame, 'food', o.qty * 4), 'Kuninglik köök');
  levels := fx_add_xp(u, o.reward_xp);
  return jsonb_build_object('gold', o.reward_gold, 'xp', o.reward_xp, 'fame', o.reward_fame, 'food', o.qty * 4, 'levels', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

-- Kuningriiki saadetud preemiad: mäng võtab need ühe korra ja need kustutatakse
create or replace function public.kingdom_claim() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); res jsonb;
begin
  with d as (delete from kingdom_inbox where user_id = u returning payload, reason, id)
  select coalesce(jsonb_agg(jsonb_build_object('p', payload, 'why', reason) order by id), '[]') into res from d;
  return res;
end $$;

-- ---------------------------------------------------------------------
-- 6. Võistlused ja edetabelid
-- ---------------------------------------------------------------------
create or replace function public.fx_comp_rank(p_comp text, p_from timestamptz, p_to timestamptz)
returns table(user_id uuid, place int, species text, weight numeric, rarity int, cnt int) language sql stable as $$
  with base as (
    select c.user_id, c.species, c.weight, c.rarity, c.caught_at,
           count(*) over (partition by c.user_id) as cnt,
           row_number() over (partition by c.user_id order by
             case when p_comp = 'rare' then c.rarity else 0 end desc, c.weight desc, c.caught_at asc) as rn
    from public.fish_catches c where c.caught_at >= p_from and c.caught_at < p_to and not c.bought and (p_comp <> 'royal' or c.spot = 'kuningatiik')
  ), best as (select * from base where rn = 1)
  select b.user_id,
         (row_number() over (order by
            case when p_comp = 'most' then b.cnt else 0 end desc,
            case when p_comp = 'rare' then b.rarity else 0 end desc,
            b.weight desc, b.caught_at asc))::int,
         b.species, b.weight, b.rarity, b.cnt::int
  from best b
$$;

create or replace function public.fx_period(p_comp text, d date) returns table(p_start date, p_from timestamptz, p_to timestamptz) language sql immutable as $$
  select s, (s::timestamp at time zone 'Europe/Tallinn'), ((s + case when p_comp = 'big' then 1 else 7 end)::timestamp at time zone 'Europe/Tallinn')
  from (select case when p_comp = 'big' then d else date_trunc('week', d)::date end as s) x
$$;

create or replace function public.fish_competitions() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today(); cmp text; per record; prev record; res jsonb := '{}'; top jsonb; mine jsonb; last jsonb; lb jsonb;
begin
  perform fx_fisher(u);
  perform fx_bots_tick();
  foreach cmp in array array['big','rare','most','royal'] loop
    select * into per from fx_period(cmp, d);
    select * into prev from fx_period(cmp, case when cmp = 'big' then d - 1 else d - 7 end);
    select coalesce(jsonb_agg(jsonb_build_object('place', r.place, 'name', p.name, 'title', f.title, 'species', r.species,
             'weight', r.weight, 'rarity', r.rarity, 'cnt', r.cnt, 'me', r.user_id = u) order by r.place), '[]')
      into top from fx_comp_rank(cmp, per.p_from, per.p_to) r join profiles p on p.id = r.user_id left join fishers f on f.user_id = r.user_id
      where r.place <= 10;
    select to_jsonb(x) - 'user_id' into mine from fx_comp_rank(cmp, per.p_from, per.p_to) x where x.user_id = u;
    select coalesce(jsonb_agg(jsonb_build_object('place', r.place, 'name', p.name, 'species', r.species, 'weight', r.weight,
             'rarity', r.rarity, 'cnt', r.cnt, 'me', r.user_id = u) order by r.place), '[]')
      into last from fx_comp_rank(cmp, prev.p_from, prev.p_to) r join profiles p on p.id = r.user_id where r.place <= 3;
    -- Järve kalurid näidatakse võrdluseks (ilma kohata – preemiad ainult päris mängijatele)
    select coalesce(jsonb_agg(x.j order by x.m desc), '[]') into top from (
      select e as j, case when cmp = 'most' then (e ->> 'cnt')::numeric when cmp = 'rare' then (e ->> 'rarity')::numeric * 100000 + (e ->> 'weight')::numeric else (e ->> 'weight')::numeric end as m from jsonb_array_elements(top) e
      union all
      select jsonb_build_object('place', null, 'bot', bb.id, 'emoji', bb.emoji, 'name', bb.name, 'title', 'Järve kalur', 'species', z.species, 'weight', z.weight, 'rarity', z.rarity, 'cnt', z.cnt, 'me', false),
        case when cmp = 'most' then z.cnt when cmp = 'rare' then z.rarity * 100000 + z.weight else z.weight end
      from (select distinct on (c.bot) c.bot, c.species, c.weight, c.rarity, count(*) over (partition by c.bot) as cnt from fish_bot_catches c
            where c.caught_at >= per.p_from and c.caught_at < per.p_to and (cmp <> 'royal' or c.spot = 'kuningatiik') order by c.bot, case when cmp = 'rare' then c.rarity else 0 end desc, c.weight desc) z
      join fish_bots bb on bb.id = z.bot) x;
    res := res || jsonb_build_object(cmp, jsonb_build_object('top', top, 'mine', mine, 'last', last,
             'ends', per.p_to, 'lic', cmp <> 'royal' or fx_lic_ok(u, 'kuninglik'), 'claimed', exists (select 1 from fish_prizes where user_id = u and fish_prizes.comp = cmp and period = prev.p_start)));
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('name', p.name, 'title', f.title, 'level', f.level, 'stars', f.prestige, 'total', f.total,
           'biggest', f.biggest, 'rare', f.rare, 'me', f.user_id = u) order by f.level desc, f.prestige desc, f.pxp desc, f.xp desc, f.total desc), '[]')
    into lb from (select * from fishers order by level desc, prestige desc, pxp desc, xp desc, total desc limit 30) f
    join profiles p on p.id = f.user_id where not p.hidden or f.user_id = u;
  select coalesce(jsonb_agg(x.j order by (x.j ->> 'level')::int desc, (x.j ->> 'total')::int desc), '[]') into lb from (
    select e as j from jsonb_array_elements(lb) e
    union all
    select jsonb_build_object('bot', b.id, 'emoji', b.emoji, 'name', b.name, 'title', 'Järve kalur', 'level', fx_bot_level(b), 'stars', 0,
      'total', (select count(*) from fish_bot_catches c where c.bot = b.id), 'biggest', (select max(weight) from fish_bot_catches c where c.bot = b.id), 'rare', 0, 'me', false)
    from fish_bots b) x;
  return res || jsonb_build_object('leaderboard', lb);
end $$;

-- Võidupreemiad (viimase 7 päeva ja 2 nädala lõppenud võistlused); iga preemiat saab võtta ühe korra
create or replace function public.fish_claim_prizes() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today(); cmp text; k int; per record; pl int; got jsonb := '[]';
  v_gold int; v_xp int; ttl text; levels int[] := '{}';
begin
  perform fx_fisher(u);
  perform fx_bots_tick();
  foreach cmp in array array['big','rare','most','royal'] loop
    for k in 1..(case when cmp = 'big' then 7 else 2 end) loop
      select * into per from fx_period(cmp, case when cmp = 'big' then d - k else d - 7 * k end);
      if exists (select 1 from fish_prizes where user_id = u and fish_prizes.comp = cmp and period = per.p_start) then continue; end if;
      select place into pl from fx_comp_rank(cmp, per.p_from, per.p_to) where user_id = u;
      if pl is null or pl > 3 then continue; end if;
      if cmp = 'big' then v_gold := (array[300,150,80])[pl]; v_xp := (array[150,80,40])[pl]; ttl := 'Päeva hiidkala püüdja';
      elsif cmp = 'rare' then v_gold := (array[1500,800,400])[pl]; v_xp := (array[600,300,150])[pl]; ttl := 'Haruldaste jahtija';
      elsif cmp = 'royal' then v_gold := (array[5000,2500,1200])[pl]; v_xp := (array[1500,800,400])[pl]; ttl := 'Kuninglik kalur';
      else v_gold := (array[1500,800,400])[pl]; v_xp := (array[600,300,150])[pl]; ttl := 'Nädala kalur'; end if;
      insert into fish_prizes(user_id, comp, period, place) values (u, cmp, per.p_start, pl);
      if pl <= 3 then perform fx_news(u, 'comp', jsonb_build_object('comp', cmp, 'period', per.p_start, 'place', pl)); end if;
      update fishers set gold = fishers.gold + v_gold, comp_wins = comp_wins + (pl = 1)::int,
        titles = case when pl = 1 and not (ttl = any(titles)) then titles || ttl else titles end where user_id = u;
      levels := levels || fx_add_xp(u, v_xp);
      got := got || jsonb_build_object('comp', cmp, 'period', per.p_start, 'place', pl, 'gold', v_gold, 'xp', v_xp, 'title', case when pl = 1 then ttl end);
    end loop;
  end loop;
  return jsonb_build_object('prizes', got, 'levels', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

-- ---------------------------------------------------------------------
-- 6b. Laiendus 1: esemed, ülesanded, märgid, uudised
-- ---------------------------------------------------------------------
create or replace function public.fx_give_item(u uuid, p_item text, p_qty int) returns jsonb language plpgsql as $$
begin
  insert into public.fisher_items(user_id, item, qty) values (u, p_item, p_qty)
  on conflict (user_id, item) do update set qty = fisher_items.qty + p_qty;
  return jsonb_build_array(jsonb_build_object('id', p_item, 'qty', p_qty));
end $$;

-- juhuslik ese: iga järgmine haruldusaste tuleb umbes poole harvem
create or replace function public.fx_give_random(u uuid, maxr int, n int) returns jsonb language plpgsql as $$
declare res jsonb := '[]'; i int; it text;
begin
  for i in 1..n loop
    select id into it from public.fish_items where rarity <= maxr and id <> 'koopakristall' order by -ln(greatest(random(), 1e-9)) * power(2, rarity) limit 1;
    if it is not null then res := res || public.fx_give_item(u, it, 1); end if;
  end loop;
  return res;
end $$;

create or replace function public.fx_news(u uuid, k text, d jsonb) returns void language sql as
$$ insert into public.fish_news(user_id, kind, data) values (u, k, d) $$;

create or replace function public.fx_badges(u uuid) returns jsonb language plpgsql stable as $$
declare f public.fishers; nsp int; nall int; res jsonb := '[]'; b record; v numeric; t int;
begin
  select * into f from public.fishers where user_id = u;
  if f.user_id is null then return '[]'; end if;
  select count(distinct species) into nsp from public.fish_catches where user_id = u and not bought;
  select count(*) into nall from public.fish_species;
  for b in select * from (values
      ('puudja','Püüdja','Püütud kalu', f.total::numeric, 50, 500, 5000),
      ('haruldased','Haruldaste küttija','Haruldasi kalu', f.rare::numeric, 10, 100, 1000),
      ('hiid','Hiidkala','Suurim kala (kg)', f.biggest, 10, 50, 200),
      ('koguja','Kollektsionäär','Liike kalaraamatus', nsp::numeric, 10, 25, nall),
      ('usin','Usin','Täidetud ülesandeid', f.quests_done::numeric, 10, 50, 250),
      ('aare','Aardekütt','Leitud aardekirste', f.chests::numeric, 3, 25, 100),
      ('oo','Öökull','Öösel püütud kalu', f.night::numeric, 25, 250, 1000),
      ('voitja','Võitja','Võistlusvõite', f.comp_wins::numeric, 1, 5, 25)
    ) as x(id, name, what, val, t1, t2, t3) loop
    v := coalesce(b.val, 0);
    t := case when v >= b.t3 then 3 when v >= b.t2 then 2 when v >= b.t1 then 1 else 0 end;
    res := res || jsonb_build_object('id', b.id, 'name', b.name, 'what', b.what, 'value', v, 'tier', t,
      'next', case t when 0 then b.t1 when 1 then b.t2 when 2 then b.t3 else null end);
  end loop;
  return res;
end $$;

create or replace function public.fish_item_sell(p_item text, p_qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); have int; it fish_items; v_gold int;
begin
  perform fx_fisher(u);
  select * into it from fish_items where id = p_item;
  if it.id is null or coalesce(p_qty, 0) < 1 or p_qty > 10000 then raise exception 'Vale ese või kogus'; end if;
  select qty into have from fisher_items where user_id = u and item = p_item for update;
  if coalesce(have, 0) < p_qty then raise exception 'Sul pole nii palju seda eset'; end if;
  update fisher_items set qty = qty - p_qty where user_id = u and item = p_item;
  v_gold := it.price * p_qty;
  update fishers set gold = gold + v_gold where user_id = u;
  return jsonb_build_object('gold', v_gold, 'qty', p_qty, 'item', p_item);
end $$;

-- Ülesannete edenemine arvutatakse serveris päris püükidest (klient ei saa seda mõjutada)
create or replace function public.fx_quest_progress(u uuid, k text, prm text, since timestamptz) returns numeric language sql stable as $$
  select (case k
    when 'count' then (select count(*) from public.fish_catches where user_id = u and not bought and trap is null and caught_at >= since)
    when 'rarity' then (select count(*) from public.fish_catches where user_id = u and not bought and trap is null and caught_at >= since and rarity >= prm::int)
    when 'spot' then (select count(*) from public.fish_catches where user_id = u and not bought and trap is null and caught_at >= since and spot = prm)
    when 'species' then (select count(*) from public.fish_catches where user_id = u and not bought and trap is null and caught_at >= since and species = prm)
    when 'weight' then (select coalesce(sum(weight), 0) from public.fish_catches where user_id = u and not bought and trap is null and caught_at >= since)
    when 'night' then (select count(*) from public.fish_catches where user_id = u and not bought and trap is null and caught_at >= since and night)
    when 'weather' then (select count(*) from public.fish_catches c join public.fish_species s on s.id = c.species where c.user_id = u and not c.bought and c.trap is null and c.caught_at >= since and s.weather is not null)
    when 'chest' then (select count(*) from public.fish_casts where user_id = u and created_at >= since and kind = 'chest' and state = 'landed')
    when 'junk' then (select count(*) from public.fish_casts where user_id = u and created_at >= since and kind = 'junk' and state = 'landed')
    when 'diverse' then (select count(distinct species) from public.fish_catches where user_id = u and not bought and trap is null and caught_at >= since)
    when 'big1' then (select coalesce(max(weight), 0) from public.fish_catches where user_id = u and not bought and trap is null and caught_at >= since)
    when 'favbait' then (select count(*) from public.fish_casts c join public.fish_species s on s.id = c.species
                         where c.user_id = u and c.created_at >= since and c.kind = 'fish' and c.state = 'landed' and c.bait = any(s.baits))
    when 'lab' then (select count(*) from public.lab_fish where bred_by = u and created_at >= since)
    when 'dna' then (select count(*) from public.lab_scan where user_id = u and started_at >= since)
    else 0 end)::numeric
$$;

create or replace function public.fx_gen_quests(u uuid, per text, ps date) returns void language plpgsql as $$
declare f public.fishers; lvl int; i int; k text; prm text; tgt numeric; pick int; sp text; spc text; ri text; used text[] := '{}'; pool text[];
begin
  select * into f from public.fishers where user_id = u; lvl := coalesce(f.level, 1);
  for i in 1..(case when per = 'd' then 6 else 3 end) loop
    prm := null; ri := null;
    if per = 'd' then
      if i = 1 then k := 'count'; tgt := 10 + least(20, lvl);
      elsif i = 2 then
        pick := floor(random() * 3)::int; spc := null;
        if pick = 0 then
          select fs.id into spc from public.fish_species fs where fs.rarity <= 2 and fs.min_level <= lvl and not fs.night_only and not fs.winter_only and fs.weather is null and fs.event is null and fs.spots <> '{}'
            and exists (select 1 from public.fish_spots p where p.id = any(fs.spots) and p.min_level <= lvl) order by random() limit 1;
        end if;
        if spc is not null then k := 'species'; prm := spc; tgt := 3;
        elsif pick = 1 then
          select id into sp from public.fish_spots where min_level <= lvl order by random() limit 1;
          k := 'spot'; prm := sp; tgt := 8;
        else k := 'weight'; tgt := round(5 + lvl * 1.5); end if;
      elsif i = 3 then
        if lvl >= 8 then k := 'rarity'; prm := '3'; tgt := 1 + lvl / 20; else k := 'rarity'; prm := '2'; tgt := 3; end if;
      else
        -- lisaülesanded 4–6: igaüks eri tüüpi
        pool := array['diverse','favbait','junk','big1'] || case when lvl >= 5 then array['lab','dna'] else '{}'::text[] end;
        select x into k from unnest(pool) x where x <> all(used) order by random() limit 1;
        used := used || k;
        tgt := case k when 'diverse' then 4 + least(4, lvl / 8) when 'favbait' then 5 when 'junk' then 2
          when 'big1' then round(greatest(0.5, lvl * 0.25)::numeric, 1) when 'lab' then 2 else 1 end;
      end if;
      if random() < 0.35 then ri := (array['karp','parl','merevaik'])[1 + floor(random() * 3)::int]; end if;
      insert into public.fish_quests(user_id, period, pstart, idx, kind, param, target, reward_gold, reward_xp, reward_item, reward_qty)
      values (u, per, ps, i, k, prm, tgt, 60 + lvl * 8, 40 + lvl * 6, ri, case when ri is null then 0 else 1 end)
      on conflict do nothing;
    else
      if i = 1 then k := 'count'; tgt := 80 + lvl * 4;
      elsif i = 2 then k := 'weight'; tgt := 60 + lvl * 10;
      else
        pick := floor(random() * 4)::int;
        if pick = 0 then k := 'chest'; tgt := 2;
        elsif pick = 1 then k := 'night'; tgt := 15 + lvl / 2;
        elsif pick = 2 then k := 'weather'; tgt := 3;
        elsif lvl >= 15 then k := 'rarity'; prm := '4'; tgt := 2;
        else k := 'rarity'; prm := '3'; tgt := 5; end if;
      end if;
      insert into public.fish_quests(user_id, period, pstart, idx, kind, param, target, reward_gold, reward_xp, reward_item, reward_qty)
      values (u, per, ps, i, k, prm, tgt, 400 + lvl * 40, 300 + lvl * 30, case i when 1 then 'merevaik' when 2 then 'ruun' else 'mustparl' end, 1)
      on conflict do nothing;
    end if;
  end loop;
end $$;

create or replace function public.fx_quest_list(u uuid, per text, ps date) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('idx', q.idx, 'kind', q.kind, 'param', q.param, 'target', q.target, 'done', q.done,
     'gold', q.reward_gold, 'xp', q.reward_xp, 'item', q.reward_item, 'qty', q.reward_qty,
     'progress', least(q.target, public.fx_quest_progress(u, q.kind, q.param, (ps::timestamp at time zone 'Europe/Tallinn')))) order by q.idx), '[]')
  from public.fish_quests q where q.user_id = u and q.period = per and q.pstart = ps
$$;

create or replace function public.fish_quests() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today(); wk date := date_trunc('week', fx_today())::date;
begin
  perform fx_fisher(u);
  if (select count(*) from fish_quests q where q.user_id = u and q.period = 'd' and q.pstart = d) < 6 then perform fx_gen_quests(u, 'd', d); end if;
  if not exists (select 1 from fish_quests q where q.user_id = u and q.period = 'w' and q.pstart = wk) then perform fx_gen_quests(u, 'w', wk); end if;
  return jsonb_build_object('daily', fx_quest_list(u, 'd', d), 'weekly', fx_quest_list(u, 'w', wk),
    'day_ends', ((d + 1)::timestamp at time zone 'Europe/Tallinn'), 'week_ends', ((wk + 7)::timestamp at time zone 'Europe/Tallinn'));
end $$;

create or replace function public.fish_quest_claim(p_period text, p_idx int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); q fish_quests; ps date; prog numeric; levels int[]; v_items jsonb := '[]';
begin
  ps := case when p_period = 'w' then date_trunc('week', fx_today())::date else fx_today() end;
  select * into q from fish_quests x where x.user_id = u and x.period = p_period and x.pstart = ps and x.idx = p_idx for update;
  if q.user_id is null or q.done then raise exception 'Ülesannet ei leitud või preemia on juba võetud'; end if;
  prog := fx_quest_progress(u, q.kind, q.param, (ps::timestamp at time zone 'Europe/Tallinn'));
  if prog < q.target then raise exception 'Ülesanne pole veel täidetud'; end if;
  update fish_quests x set done = true where x.user_id = u and x.period = q.period and x.pstart = q.pstart and x.idx = q.idx;
  update fishers set gold = gold + q.reward_gold, quests_done = quests_done + 1 where user_id = u;
  if q.reward_item is not null and q.reward_qty > 0 then v_items := fx_give_item(u, q.reward_item, q.reward_qty); end if;
  levels := fx_add_xp(u, q.reward_xp);
  return jsonb_build_object('gold', q.reward_gold, 'xp', q.reward_xp, 'items', v_items, 'levels', to_jsonb(levels), 'ach', fx_check_ach(u),
    'sec', fx_secret_ev(u, 'quest', '{}'));
end $$;

-- Kuningriigi uudised (näevad kõik sisseloginud mängijad; peidetud mängija on „Salapärane kalur“)
create or replace function public.kingdom_news(p_after bigint default 0) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.id desc), '[]') from (
    select n.id, n.at, n.kind, n.data, coalesce(n.user_id = auth.uid(), false) as me, n.bot, bt.emoji as bot_emoji,
      case when n.bot is not null then bt.name when p.hidden and n.user_id <> auth.uid() then 'Salapärane kalur' else coalesce(p.name, 'Kalur') end as name,
      case when n.bot is not null then 'Järve kalur' when p.hidden and n.user_id <> auth.uid() then null else f.title end as title
    from fish_news n left join profiles p on p.id = n.user_id left join fishers f on f.user_id = n.user_id left join fish_bots bt on bt.id = n.bot
    where n.id > coalesce(p_after, 0) order by n.id desc limit 40) x
$$;

-- ---------------------------------------------------------------------
-- 6c. Laiendus 2: kalamaja ja akvaarium
-- ---------------------------------------------------------------------
create or replace function public.fx_house(u uuid) returns public.fish_house_levels language sql stable as
$$ select h.* from public.fishers f join public.fish_house_levels h on h.level = f.house_level where f.user_id = u $$;

-- Akvaariumi ilu: haruldasemad ja rekordsuured kalad on ilusamad
create or replace function public.fx_aq_score(u uuid) returns int language sql stable as
$$ select coalesce(sum(rarity * rarity * 2 + case when giant then 10 else 0 end), 0)::int from public.fish_catches where user_id = u and status = 'aquarium' $$;

-- Külastajad toovad iga päev kulda (ilu × 3 päevas, kogub kuni 48 tundi)
create or replace function public.fx_aq_pending(u uuid) returns int language sql stable as $$
  select floor(public.fx_aq_score(u) * 3 * least(48, extract(epoch from (now() - f.aq_at)) / 3600) / 24)::int
  from public.fishers f where f.user_id = u
$$;

-- arvutab kogunenud kulla kassasse (enne igat akvaariumi muutust, et ilu ei saaks tagantjärele tõsta)
create or replace function public.fx_aq_settle(u uuid) returns int language plpgsql as $$
declare g int;
begin
  perform 1 from public.fishers where user_id = u for update;
  g := coalesce(public.fx_aq_pending(u), 0);
  update public.fishers set gold = gold + g, aq_at = now() where user_id = u;
  return g;
end $$;

create or replace function public.fish_house_upgrade() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; h fish_house_levels; it record; have int;
begin
  perform fx_fisher(u);
  select * into f from fishers where user_id = u for update;
  select * into h from fish_house_levels where level = f.house_level + 1;
  if h.level is null then raise exception 'Kalamaja on juba kõige kõrgemal tasemel'; end if;
  if f.level < h.min_fish_level then raise exception 'Selle ehitamiseks on vaja kalapüügi %. taset', h.min_fish_level; end if;
  if f.gold < h.gold then raise exception 'Kalurikassas pole piisavalt kulda (vaja %)', h.gold; end if;
  for it in select key, value::int as qty from jsonb_each_text(h.items) loop
    select qty into have from fisher_items where user_id = u and item = it.key for update;
    if coalesce(have, 0) < it.qty then raise exception 'Kotis pole piisavalt esemeid: %', (select name from fish_items where id = it.key); end if;
  end loop;
  for it in select key, value::int as qty from jsonb_each_text(h.items) loop
    update fisher_items set qty = qty - it.qty where user_id = u and item = it.key;
  end loop;
  perform fx_aq_settle(u);
  update fishers set gold = gold - h.gold, house_level = h.level where user_id = u;
  if h.level >= 5 then perform fx_news(u, 'house', jsonb_build_object('level', h.level, 'name', h.name)); end if;
  return jsonb_build_object('level', h.level, 'name', h.name, 'cost', h.gold, 'ach', fx_check_ach(u));
end $$;

create or replace function public.fish_aquarium_put(p_catch bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); h fish_house_levels; n int; c fish_catches; g int;
begin
  perform fx_fisher(u);
  g := fx_aq_settle(u);  -- lukustab ka mängija rea
  h := fx_house(u);
  if h.level is null then raise exception 'Akvaariumi jaoks ehita esmalt kalamaja'; end if;
  select * into c from fish_catches where id = p_catch and user_id = u and status in ('kept','trophy') for update;
  if c.id is null then raise exception 'Seda kala ei leitud sinu saagist'; end if;
  select count(*) into n from fish_catches where user_id = u and status = 'aquarium';
  if n >= h.slots then raise exception 'Akvaarium on täis (% kohta). Täienda kalamaja, et saada rohkem kohti.', h.slots; end if;
  update fish_catches set status = 'aquarium' where id = c.id;
  return jsonb_build_object('ok', true, 'collected', g, 'score', fx_aq_score(u), 'ach', fx_check_ach(u));
end $$;

create or replace function public.fish_aquarium_take(p_catch bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); g int;
begin
  perform fx_fisher(u);
  g := fx_aq_settle(u);
  update fish_catches set status = 'kept' where id = p_catch and user_id = u and status = 'aquarium';
  if not found then raise exception 'Seda kala pole sinu akvaariumis'; end if;
  return jsonb_build_object('ok', true, 'collected', g, 'score', fx_aq_score(u));
end $$;

create or replace function public.fish_aquarium_collect() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); g int;
begin
  perform fx_fisher(u);
  g := fx_aq_settle(u);
  return jsonb_build_object('gold', g);
end $$;

create or replace function public.fx_aq_fish(u uuid) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'species', species, 'rarity', rarity, 'weight', weight, 'giant', giant)
         order by rarity desc, weight desc), '[]') from public.fish_catches where user_id = u and status = 'aquarium'
$$;

create or replace function public.fish_aquarium_view(p_user uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare u uuid := fx_uid(); p profiles; f fishers; h fish_house_levels;
begin
  select * into p from profiles where id = p_user;
  select * into f from fishers where user_id = p_user;
  if f.user_id is null or (coalesce(p.hidden, false) and p_user <> u) then raise exception 'Seda akvaariumi ei saa vaadata'; end if;
  h := fx_house(p_user);
  return jsonb_build_object('user', p_user, 'name', coalesce(p.name, 'Kalur'), 'kingdom', p.kingdom, 'title', f.title, 'level', f.level,
    'house', f.house_level, 'house_name', h.name, 'slots', coalesce(h.slots, 0), 'score', fx_aq_score(p_user), 'likes', f.aq_likes,
    'liked', exists (select 1 from fish_aq_likes where owner = p_user and visitor = u and day = fx_today()),
    'me', p_user = u, 'fish', fx_aq_fish(p_user),
    'trophies', (select coalesce(jsonb_agg(jsonb_build_object('species', c.species, 'rarity', c.rarity, 'weight', c.weight, 'giant', c.giant) order by c.rarity desc, c.weight desc), '[]') from (select * from fish_catches where user_id = p_user and status = 'trophy' order by rarity desc, weight desc limit 12) c));
end $$;

create or replace function public.fish_aquariums() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x.score desc, x.likes desc), '[]') from (
    select f.user_id as id, coalesce(p.name, 'Kalur') as name, p.kingdom, f.title, f.house_level as house, f.aq_likes as likes,
      public.fx_aq_score(f.user_id) as score, (select count(*) from fish_catches c where c.user_id = f.user_id and c.status = 'aquarium') as n,
      f.user_id = auth.uid() as me
    from fishers f join profiles p on p.id = f.user_id
    where f.house_level > 0 and (not p.hidden or f.user_id = auth.uid())
    order by public.fx_aq_score(f.user_id) desc limit 30) x
  where x.n > 0 or x.me
$$;

-- Imetle teise mängija akvaariumi (1 kord päevas iga akvaariumi kohta). Omanik saab 15 kulda.
create or replace function public.fish_aquarium_like(p_user uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); p profiles;
begin
  perform fx_fisher(u);
  if p_user = u then raise exception 'Oma akvaariumi ei saa imetleda'; end if;
  select * into p from profiles where id = p_user;
  if p.id is null or p.hidden or not exists (select 1 from fishers where user_id = p_user and house_level > 0) then raise exception 'Seda akvaariumi ei leitud'; end if;
  insert into fish_aq_likes(owner, visitor, day) values (p_user, u, fx_today()) on conflict do nothing;
  if not found then raise exception 'Sa juba imetlesid seda akvaariumi täna'; end if;
  update fishers set aq_likes = aq_likes + 1, gold = gold + 15 where user_id = p_user;
  return jsonb_build_object('ok', true, 'sec', fx_secret_ev(u, 'like', '{}'));
end $$;

-- ---------------------------------------------------------------------
-- 6d. Laiendus 3: õngede täiustamine, võlumine ja paadid
-- ---------------------------------------------------------------------
-- Kõik õnge, võlu ja paadi mõjud arvutatakse siin ühes kohas
create or replace function public.fx_gear(u uuid, p_spot text default null) returns jsonb language plpgsql stable as $$
declare f public.fishers; r public.fish_rods; m public.fisher_rods; e public.fish_enchants; v numeric := 0; up int := 0;
  st numeric; cb numeric; rb numeric; wm numeric := 1; chest numeric := 1; giant numeric := 1; wpref numeric := .5; boatw numeric := 1;
begin
  select * into f from public.fishers where user_id = u;
  select * into r from public.fish_rods where id = coalesce(f.rod, 'algaja');
  select * into m from public.fisher_rods where user_id = u and rod = r.id;
  up := coalesce(m.upg, 0);
  if m.ench is not null and coalesce(m.ench_lvl, 0) > 0 then select * into e from public.fish_enchants where id = m.ench; v := e.vals[m.ench_lvl]; end if;
  st := r.strength * (1 + 0.1 * up) * (1 + 0.04 * public.fx_sk(u, 'meistriritv')); cb := r.catch_bonus + 0.01 * up; rb := r.reel_bonus + 0.02 * up;
  case e.id
    when 'tugevus' then st := st * (1 + v);
    when 'onn' then cb := cb + v;
    when 'kuu' then if public.fx_is_night() then cb := cb + v; end if;
    when 'kiirus' then wm := 1 - v;
    when 'aare' then chest := v;
    when 'hiid' then giant := v;
    when 'torm' then wpref := v;
    else null;
  end case;
  if p_spot in ('meri', 'saarestik', 'avameri', 'sugavik') then
    select coalesce(min(b.wait_mult), 1) into boatw from public.fish_boats b where b.id = any(coalesce(f.boats, '{}'));
  end if;
  return jsonb_build_object('rod', r.id, 'upg', up, 'ench', e.id, 'ench_lvl', case when e.id is null then 0 else m.ench_lvl end, 'ench_val', v,
    'strength', round(st, 1), 'catch', round(cb, 3), 'reel', round(rb, 3), 'wait', round(wm * boatw, 3), 'chest', chest, 'giant', giant, 'wpref', wpref, 'boat_wait', boatw);
end $$;

-- maksab esemetega (lukustab read, et ei saaks topelt kulutada)
create or replace function public.fx_pay_items(u uuid, p_items jsonb) returns void language plpgsql as $$
declare it record; have int;
begin
  for it in select key, value::int as qty from jsonb_each_text(coalesce(p_items, '{}')) loop
    select qty into have from public.fisher_items where user_id = u and item = it.key for update;
    if coalesce(have, 0) < it.qty then raise exception 'Kotis pole piisavalt esemeid: %', (select name from public.fish_items where id = it.key); end if;
  end loop;
  for it in select key, value::int as qty from jsonb_each_text(coalesce(p_items, '{}')) loop
    update public.fisher_items set qty = qty - it.qty where user_id = u and item = it.key;
  end loop;
end $$;

create or replace function public.fx_upg_cost(p_rod text, p_lvl int) returns jsonb language sql stable as $$
  select jsonb_build_object('gold', greatest(150, round(r.price * 0.25))::int * p_lvl,
    'items', (array['{"karp":3}','{"karp":5,"parl":1}','{"parl":2,"merevaik":2}','{"ruun":2,"sormus":1}','{"mustparl":1,"kristall":1}']::jsonb[])[p_lvl])
  from public.fish_rods r where r.id = p_rod
$$;

create or replace function public.fish_rod_upgrade(p_rod text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; m fisher_rods; cost jsonb; nl int;
begin
  perform fx_fisher(u);
  select * into f from fishers where user_id = u for update;
  if not (p_rod = any(f.rods)) then raise exception 'Sul pole seda õnge'; end if;
  insert into fisher_rods(user_id, rod) values (u, p_rod) on conflict do nothing;
  select * into m from fisher_rods where user_id = u and rod = p_rod for update;
  if m.upg >= 5 then raise exception 'See õng on juba täielikult täiustatud'; end if;
  nl := m.upg + 1; cost := fx_upg_cost(p_rod, nl);
  if f.gold < (cost ->> 'gold')::int then raise exception 'Kalurikassas pole piisavalt kulda (vaja %)', cost ->> 'gold'; end if;
  perform fx_pay_items(u, cost -> 'items');
  update fishers set gold = gold - (cost ->> 'gold')::int where user_id = u;
  update fisher_rods set upg = nl where user_id = u and rod = p_rod;
  return jsonb_build_object('rod', p_rod, 'upg', nl, 'cost', cost, 'gear', fx_gear(u), 'ach', fx_check_ach(u));
end $$;

create or replace function public.fish_enchant(p_rod text, p_ench text, p_tier int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; e fish_enchants; m fisher_rods; cost jsonb;
begin
  perform fx_fisher(u);
  select * into f from fishers where user_id = u for update;
  if not (p_rod = any(f.rods)) then raise exception 'Sul pole seda õnge'; end if;
  select * into e from fish_enchants where id = p_ench;
  if e.id is null or p_tier not between 1 and 3 then raise exception 'Tundmatu võlu'; end if;
  if f.level < (array[8, 18, 30])[p_tier] then raise exception 'Selle võlu jaoks on vaja kalapüügi %. taset', (array[8, 18, 30])[p_tier]; end if;
  insert into fisher_rods(user_id, rod) values (u, p_rod) on conflict do nothing;
  select * into m from fisher_rods where user_id = u and rod = p_rod for update;
  if m.ench = p_ench and m.ench_lvl >= p_tier then raise exception 'Õngel on see võlu juba olemas'; end if;
  cost := e.costs -> (p_tier - 1);
  if f.gold < (cost ->> 'gold')::int then raise exception 'Kalurikassas pole piisavalt kulda (vaja %)', cost ->> 'gold'; end if;
  perform fx_pay_items(u, cost -> 'items');
  update fishers set gold = gold - (cost ->> 'gold')::int where user_id = u;
  update fisher_rods set ench = p_ench, ench_lvl = p_tier where user_id = u and rod = p_rod;
  if p_tier = 3 then perform fx_news(u, 'enchant', jsonb_build_object('ench', e.name, 'rod', (select name from fish_rods where id = p_rod))); end if;
  return jsonb_build_object('rod', p_rod, 'ench', p_ench, 'tier', p_tier, 'name', e.name, 'gear', fx_gear(u), 'ach', fx_check_ach(u));
end $$;

create or replace function public.fish_boat_buy(p_boat text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; b fish_boats; prev text;
begin
  perform fx_fisher(u);
  select * into f from fishers where user_id = u for update;
  select * into b from fish_boats where id = p_boat;
  if b.id is null then raise exception 'Tundmatu paat'; end if;
  if b.id = any(f.boats) then raise exception 'See paat on sul juba olemas'; end if;
  select id into prev from fish_boats where sort < b.sort and not (id = any(f.boats)) order by sort limit 1;
  if prev is not null then raise exception 'Osta enne väiksem paat: %', (select name from fish_boats where id = prev); end if;
  if f.level < b.min_level then raise exception 'See paat avaneb kalapüügi %. tasemel', b.min_level; end if;
  if f.gold < b.price then raise exception 'Kalurikassas pole piisavalt kulda (vaja %)', b.price; end if;
  perform fx_pay_items(u, b.items);
  update fishers set gold = gold - b.price, boats = boats || b.id where user_id = u;
  perform fx_news(u, 'boat', jsonb_build_object('boat', b.name));
  return jsonb_build_object('boat', b.id, 'name', b.name, 'ach', fx_check_ach(u));
end $$;

-- ---------------------------------------------------------------------
-- 6e. Laiendus 4: mängijatevaheline kalaturg
-- ---------------------------------------------------------------------
-- Kala baasväärtus turu hinnapiiride jaoks (ei sõltu päeva müügist)
create or replace function public.fx_base_value(p_species text, p_weight numeric) returns int language sql stable as $$
  select greatest(1, round(s.price * public.fx_size_mult(s, p_weight)))::int from public.fish_species s where s.id = p_species
$$;

-- Aegunud kuulutused (72 h) lähevad tagasi müüjale
create or replace function public.fx_market_expire() returns void language plpgsql as $$
declare l record;
begin
  for l in select * from public.fish_market where status = 'open' and created_at < now() - interval '72 hours' for update skip locked loop
    update public.fish_market set status = 'expired', closed_at = now() where id = l.id;
    update public.fish_catches set status = 'kept' where id = l.catch_id and status = 'market';
  end loop;
end $$;

create or replace function public.fish_market_list(p_catch bigint, p_price int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); c fish_catches; v_base int; n int; lid bigint;
begin
  perform fx_fisher(u);
  perform 1 from fishers where user_id = u for update;
  select * into c from fish_catches where id = p_catch and user_id = u and status in ('kept','trophy') for update;
  if c.id is null then raise exception 'Seda kala ei leitud sinu saagist'; end if;
  select count(*) into n from fish_market where seller = u and status = 'open';
  if n >= 10 then raise exception 'Sul võib korraga olla turul kuni 10 kala'; end if;
  v_base := fx_base_value(c.species, c.weight);
  if p_price is null or p_price < greatest(1, ceil(v_base * 0.5)) or p_price > v_base * 5 then
    raise exception 'Hind peab olema vahemikus % kuni % kulda', greatest(1, ceil(v_base * 0.5))::int, v_base * 5;
  end if;
  update fish_catches set status = 'market' where id = c.id;
  insert into fish_market(seller, catch_id, species, rarity, weight, giant, price, base)
  values (u, c.id, c.species, c.rarity, c.weight, c.giant, p_price, v_base) returning id into lid;
  return jsonb_build_object('id', lid, 'price', p_price, 'base', v_base);
end $$;

create or replace function public.fish_market_cancel(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); l fish_market;
begin
  select * into l from fish_market where id = p_id and seller = u for update;
  if l.id is null or l.status <> 'open' then raise exception 'Kuulutust ei leitud või see on juba müüdud'; end if;
  update fish_market set status = 'cancelled', closed_at = now() where id = l.id;
  update fish_catches set status = 'kept' where id = l.catch_id and status = 'market';
  return jsonb_build_object('ok', true);
end $$;

-- Ost on üks tehing: kuulutus lukustatakse, raha ja kala liiguvad korraga või üldse mitte
create or replace function public.fish_market_buy(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); l fish_market; c fish_catches; v_fee int; bg int; nid bigint; nm text;
begin
  perform fx_fisher(u);
  perform fx_market_expire();
  select * into l from fish_market where id = p_id for update;
  if l.id is null or l.status <> 'open' then raise exception 'See kala on juba müüdud või turult eemaldatud'; end if;
  if l.seller = u then raise exception 'Oma kala ei saa osta'; end if;
  if l.bot is not null then
    -- Järve kaluri kala: raha läheb järvele tagasi, kala tuleb sulle
    perform 1 from fishers where user_id = u for update;
    select gold into bg from fishers where user_id = u;
    if bg < l.price then raise exception 'Kalurikassas pole piisavalt kulda (vaja %)', l.price; end if;
    update fishers set gold = gold - l.price where user_id = u;
    insert into fish_catches(user_id, species, rarity, weight, spot, giant, night, weather, status, bought)
    values (u, l.species, l.rarity, l.weight, coalesce(l.spot, 'metsajarv'), l.giant, false, null, 'kept', true) returning id into nid;
    update fish_market set status = 'sold', buyer = u, closed_at = now(), new_catch = nid where id = l.id;
    select name into nm from fish_species where id = l.species;
    return jsonb_build_object('ok', true, 'catch_id', nid, 'species', l.species, 'name', nm, 'price', l.price);
  end if;
  -- lukusta mõlema mängija read alati samas järjekorras
  perform 1 from fishers where user_id in (u, l.seller) order by user_id for update;
  select gold into bg from fishers where user_id = u;
  if bg < l.price then raise exception 'Kalurikassas pole piisavalt kulda (vaja %)', l.price; end if;
  select * into c from fish_catches where id = l.catch_id and user_id = l.seller and status = 'market' for update;
  if c.id is null then raise exception 'Kala pole enam saadaval'; end if;
  v_fee := ceil(l.price * 0.05);
  update fishers set gold = gold - l.price where user_id = u;
  update fishers set gold = gold + l.price - v_fee where user_id = l.seller;
  update fish_catches set status = 'traded' where id = c.id;
  insert into fish_catches(user_id, species, rarity, weight, spot, giant, night, weather, status, bought)
  values (u, c.species, c.rarity, c.weight, c.spot, c.giant, c.night, c.weather, 'kept', true) returning id into nid;
  update fish_market set status = 'sold', buyer = u, closed_at = now(), fee = v_fee, new_catch = nid where id = l.id;
  select name into nm from fish_species where id = c.species;
  if l.rarity >= 5 or l.price >= 10000 then perform fx_news(u, 'trade', jsonb_build_object('species', c.species, 'weight', c.weight, 'rarity', c.rarity, 'price', l.price)); end if;
  return jsonb_build_object('ok', true, 'catch_id', nid, 'species', c.species, 'name', nm, 'price', l.price);
end $$;

create or replace function public.fish_market_browse(p_rarity int default null, p_species text default null, p_sort text default 'new')
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); res jsonb;
begin
  perform fx_market_expire();
  select coalesce(jsonb_agg(x), '[]') into res from (
    select m.id, m.species, m.rarity, m.weight, m.giant, m.price, m.base, m.created_at as at, coalesce(m.seller = u, false) as mine,
      case when m.bot is not null then bb.name when p.hidden and m.seller <> u then 'Salapärane kalur' else coalesce(p.name, 'Kalur') end as seller,
      m.bot, bb.emoji as bot_emoji
    from fish_market m left join profiles p on p.id = m.seller left join fish_bots bb on bb.id = m.bot
    where m.status = 'open' and (p_rarity is null or m.rarity = p_rarity) and (p_species is null or m.species = p_species)
    order by case when p_sort = 'cheap' then m.price end asc nulls last,
             case when p_sort = 'value' then m.price::numeric / greatest(1, m.base) end asc nulls last,
             case when p_sort = 'rare' then m.rarity end desc nulls last,
             m.id desc
    limit 120) x;
  return res;
end $$;

create or replace function public.fish_market_mine() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_market_expire();
  return jsonb_build_object(
    'open', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'species', species, 'rarity', rarity, 'weight', weight, 'giant', giant, 'price', price, 'base', base, 'at', created_at) order by id desc)
       from fish_market where seller = u and status = 'open'), '[]'),
    'history', coalesce((select jsonb_agg(x order by x.at desc) from (
       select m.id, m.species, m.rarity, m.weight, m.price, m.fee, m.status, m.closed_at as at, case when m.seller = u then 'sold' else 'bought' end as side, (select name from fish_bots where id = m.buyer_bot) as bot_buyer
       from fish_market m where (m.seller = u or m.buyer = u) and m.status in ('sold','expired') order by m.closed_at desc limit 25) x), '[]'));
end $$;

-- ---------------------------------------------------------------------
-- 6f. Kuningriikide koostöö: külastused, sõprusekingid ja ühine monument
-- ---------------------------------------------------------------------
create or replace function public.kingdom_visit(p_user uuid) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare u uuid := fx_uid(); p profiles; sv saves; d jsonb;
begin
  select * into p from profiles where id = p_user;
  select * into sv from saves where user_id = p_user;
  if sv.user_id is null or (coalesce(p.hidden, false) and p_user <> u) then raise exception 'Seda kuningriiki ei saa külastada'; end if;
  d := sv.data;
  return jsonb_build_object('user', p_user, 'name', coalesce(p.name, d ->> 'name'), 'kingdom', coalesce(p.kingdom, d ->> 'kingdom'),
    'level', sv.level, 'fame', sv.fame, 'regions', sv.regions, 'rank', coalesce((d -> 'life' ->> 'rank')::int, 0),
    'tiles', d -> 'regions' -> 'kodu' -> 'tiles',
    'buildings', coalesce((select jsonb_agg(jsonb_build_object('type', b ->> 'type', 'x', (b ->> 'x')::int, 'y', (b ->> 'y')::int, 'lvl', (b ->> 'lvl')::int))
       from jsonb_array_elements(coalesce(d -> 'buildings', '[]')) b where b ->> 'region' = 'kodu'), '[]'),
    'tamed', d -> 'st' -> 'tamed', 'relics', (select count(*) from jsonb_object_keys(coalesce(d -> 'life' -> 'relics', '{}'))),
    'gifted', exists (select 1 from kingdom_gifts g where g.sender = u and g.receiver = p_user and g.day = fx_today()),
    'me', p_user = u);
end $$;

-- Sõprusekink: 3 kinki päevas, igale kuningriigile kord päevas. Kink tuleb kuningriigi varamust (serveri loodud), nii et midagi ei saa kopeerida.
create or replace function public.kingdom_gift_send(p_user uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); n int; p profiles; lvl int; sname text;
begin
  if p_user = u then raise exception 'Endale ei saa kinki saata'; end if;
  select * into p from profiles where id = p_user;
  if p.id is null or p.hidden or not exists (select 1 from saves where user_id = p_user) then raise exception 'Seda kuningriiki ei leitud'; end if;
  perform 1 from profiles where id = u for update;
  select count(*) into n from kingdom_gifts where sender = u and day = fx_today();
  n := n + (select count(*) from bot_gifts where sender = u and day = fx_today());
  if n >= 3 then raise exception 'Täna oled juba 3 kinki saatnud. Homme saad jälle!'; end if;
  insert into kingdom_gifts(sender, receiver, day) values (u, p_user, fx_today()) on conflict do nothing;
  if not found then raise exception 'Sellele kuningriigile oled täna juba kingi saatnud'; end if;
  select level into lvl from saves where user_id = p_user; select name into sname from profiles where id = u;
  perform fx_inbox(p_user, jsonb_build_object('gold', 40 + least(60, coalesce(lvl, 1)) * 6, 'berries', 30, 'food', 30, 'fame', 5), 'sõprusekink: ' || coalesce(sname, 'sõber'));
  perform fx_inbox(u, jsonb_build_object('fame', 4, 'xp', 15), 'heategu');
  return jsonb_build_object('ok', true, 'left', 2 - n);
end $$;

create or replace function public.fx_mon_need(p_stage int) returns jsonb language sql immutable as $$
  select (case ((p_stage - 1) % 5) + 1
    when 1 then '{"wood":3000,"stone":3000}'::jsonb
    when 2 then '{"stone":6000,"gold":4000}'::jsonb
    when 3 then '{"wood":6000,"stone":6000,"food":3000}'::jsonb
    when 4 then '{"stone":10000,"gold":10000,"food":5000}'::jsonb
    else '{"wood":8000,"stone":8000,"gold":20000,"food":8000}'::jsonb end)
$$;
create or replace function public.fx_mon_current() returns public.kingdom_monument language plpgsql as $$
declare m public.kingdom_monument;
begin
  select * into m from public.kingdom_monument where done_at is null order by stage limit 1;
  if m.stage is null then
    perform pg_advisory_xact_lock(hashtext('monument_new'));
    select * into m from public.kingdom_monument where done_at is null order by stage limit 1;
    if m.stage is not null then return m; end if;
    insert into public.kingdom_monument(stage, need) select coalesce(max(stage), 0) + 1, null from public.kingdom_monument returning * into m;
    update public.kingdom_monument set need = (select jsonb_object_agg(key, round(value::numeric * (1 + 0.5 * ((m.stage - 1) / 5)))) from jsonb_each_text(public.fx_mon_need(m.stage))) where stage = m.stage returning * into m;
  end if;
  return m;
end $$;

create or replace function public.monument_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); m kingdom_monument;
begin
  m := fx_mon_current();
  return jsonb_build_object('stage', m.stage, 'need', m.need, 'have', m.have, 'done', (select count(*) from kingdom_monument where done_at is not null),
    'top', coalesce((select jsonb_agg(x order by x.total desc) from (
        (select case when p.hidden and c.user_id <> u then 'Salapärane valitseja' else p.kingdom end as kingdom, c.total, c.user_id = u as me, null::text as bot, null::text as emoji
         from kingdom_monument_contrib c join profiles p on p.id = c.user_id where c.stage = m.stage order by c.total desc limit 10)
        union all
        (select bb.kname, k.total, false, bb.id, bb.emoji from kingdom_monument_bot k join fish_bots bb on bb.id = k.bot where k.stage = m.stage order by k.total desc limit 5)) x), '[]'),
    'mine', coalesce((select total from kingdom_monument_contrib where stage = m.stage and user_id = u), 0),
    'today', coalesce((select jsonb_object_agg(res, amount) from kingdom_contrib_resday where user_id = u and day = fx_today()), '{}'), 'cap', 2000,
    'contributors', (select count(*) from kingdom_monument_contrib where stage = m.stage) + (select count(*) from kingdom_monument_bot where stage = m.stage));
end $$;

-- Panus võetakse serveris hoitud salvestusest, nii et lisada saab ainult seda, mis kuningriigil päriselt on
create or replace function public.monument_contribute(p_res text, p_amt int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); m kingdom_monument; sv saves; v_have numeric; left_need numeric; got numeric; today int; amt int; c record; tot numeric; g int; f int;
begin
  if p_res not in ('wood','stone','food','gold') or p_amt is null or p_amt < 1 then raise exception 'Vale panus'; end if;
  perform pg_advisory_xact_lock(hashtext('monument'));
  m := fx_mon_current();
  if not (m.need ? p_res) then raise exception 'Sellel etapil seda ressurssi ei vajata'; end if;
  select * into sv from saves where user_id = u for update;
  if sv.user_id is null then raise exception 'Salvesta enne kuningriik (oota paar sekundit)'; end if;
  select coalesce(amount, 0) into today from kingdom_contrib_resday where user_id = u and day = fx_today() and res = p_res; today := coalesce(today, 0);
  v_have := coalesce((sv.data -> 'res' ->> p_res)::numeric, 0);
  left_need := (m.need ->> p_res)::numeric - coalesce((m.have ->> p_res)::numeric, 0);
  amt := least(p_amt, floor(v_have)::int, floor(left_need)::int, 2000 - today);
  if amt < 1 then raise exception '%', case when 2000 - today < 1 then 'Selle ressursi tänane panuse piir (2000) on täis. Homme saad jälle anda!' when left_need < 1 then 'Seda ressurssi on juba piisavalt' else 'Kuningriigil pole seda ressurssi piisavalt' end; end if;
  update saves set data = jsonb_set(data, array['res', p_res], to_jsonb(v_have - amt)) where user_id = u;
  insert into kingdom_contrib_resday(user_id, day, res, amount) values (u, fx_today(), p_res, amt) on conflict (user_id, day, res) do update set amount = kingdom_contrib_resday.amount + amt;
  insert into kingdom_monument_contrib(user_id, stage, total) values (u, m.stage, amt) on conflict (user_id, stage) do update set total = kingdom_monument_contrib.total + amt;
  update kingdom_monument km set have = jsonb_set(km.have, array[p_res], to_jsonb(coalesce((km.have ->> p_res)::numeric, 0) + amt)) where stage = m.stage returning * into m;
  -- etapp valmis?
  if not exists (select 1 from jsonb_each_text(m.need) n where coalesce((m.have ->> n.key)::numeric, 0) < n.value::numeric) then
    update kingdom_monument set done_at = now() where stage = m.stage;
    select sum(total) into tot from kingdom_monument_contrib where stage = m.stage;
    for c in select * from kingdom_monument_contrib where stage = m.stage loop
      g := round(200 * (((m.stage - 1) % 5) + 1) + c.total * 0.6)::int; f := 25 * (((m.stage - 1) % 5) + 1) + least(200, round(c.total / 50))::int;
      perform fx_inbox(c.user_id, jsonb_build_object('gold', g, 'fame', f, 'xp', 100 * (((m.stage - 1) % 5) + 1)), 'monumendi ' || m.stage || '. etapp valmis');
    end loop;
    perform fx_news(u, 'monument', jsonb_build_object('stage', m.stage));
  end if;
  return jsonb_build_object('ok', true, 'amount', amt, 'res', p_res, 'stage_done', m.done_at is not null or exists (select 1 from kingdom_monument where stage = m.stage and done_at is not null));
end $$;


-- ---------------------------------------------------------------------
-- 2g. Kalatund: iga päev kell 20–21 ühine püük + ühine bossikala
-- ---------------------------------------------------------------------
create table if not exists public.kalatund_score (
  day date not null, user_id uuid not null references auth.users(id) on delete cascade,
  pts int not null default 0, fish int not null default 0, dmg int not null default 0, best_rarity int not null default 0,
  primary key (day, user_id)
);
create table if not exists public.kalatund_boss (
  day date primary key, hp int not null, max_hp int not null, killed_at timestamptz, killer uuid
);
create table if not exists public.kalatund_prize (
  user_id uuid not null references auth.users(id) on delete cascade, day date not null, at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.kalatund_score enable row level security;
alter table public.kalatund_boss enable row level security;
alter table public.kalatund_prize enable row level security;
revoke all on public.kalatund_score, public.kalatund_boss, public.kalatund_prize from anon, authenticated;

create or replace function public.fx_kt_hour() returns int language sql immutable as $$ select 20 $$;
-- Kalatunni pikendus (nt kui server oli hõivatud): lisaminutid päeva kohta
create table if not exists public.kalatund_ext (day date primary key, mins int not null default 0, why text);
alter table public.kalatund_ext enable row level security;
revoke all on public.kalatund_ext from anon, authenticated;
insert into public.kalatund_ext(day, mins, why) values ('2026-11-22', 5, 'Vabandame – server oli Kalatunni ajal hõivatud. Kalatund kestab 5 minutit kauem!')
  on conflict (day) do nothing;
create or replace function public.fx_kt_win(d date) returns table(p_from timestamptz, p_to timestamptz) language sql stable as
$$ select (d::timestamp + make_interval(hours => fx_kt_hour())) at time zone 'Europe/Tallinn',
          (d::timestamp + make_interval(hours => fx_kt_hour() + 1, mins => coalesce((select mins from public.kalatund_ext where day = d), 0))) at time zone 'Europe/Tallinn' $$;
-- Bossi elu arvutatakse kõigi tehtud kahjude summast (kalatund_score + kalatund_bot_score).
-- Nii ei pea iga püütud kala bossi ühte rida lukustama – Kalatunnis, kui kõik püüavad korraga,
-- tekitas see järjekorra ja päringud aegusid ("statement timeout").
create or replace function public.fx_kt_dmg(d date) returns int language sql stable as $$
  select (coalesce((select sum(dmg) from public.kalatund_score where day = d), 0) + coalesce((select sum(dmg) from public.kalatund_bot_score where day = d), 0))::int $$;
create or replace function public.fx_kt_get(d date) returns kalatund_boss language plpgsql stable as $$
declare b kalatund_boss; dm int;
begin
  select * into b from kalatund_boss where day = d;
  if b.day is null then return b; end if;
  dm := fx_kt_dmg(d);
  if b.killed_at is not null then b.hp := 0; if b.max_hp2 is not null then b.max_hp := b.max_hp2; end if;
  elsif b.max_hp2 is null or dm < b.max_hp then b.hp := greatest(0, b.max_hp - dm);       -- 1. koletis
  else b.hp := greatest(0, b.max_hp + b.max_hp2 - dm); b.max_hp := b.max_hp2;              -- 2. koletis (tõusis uuesti)
  end if;
  return b;
end $$;
create or replace function public.fx_kt_boss(d date) returns kalatund_boss language plpgsql as $$
declare b kalatund_boss; n int;
begin
  select * into b from kalatund_boss where day = d;
  if b.day is null then
    select count(distinct user_id) into n from fish_catches where caught_at > now() - interval '7 days' and not bought;
    n := 1000 + 600 * greatest(1, n) + 250 * (select count(*) from fish_bots);
    insert into kalatund_boss(day, hp, max_hp, max_hp2) values (d, n, n, round(n * 1.5)) on conflict (day) do nothing;
  end if;
  return fx_kt_get(d);
end $$;
-- kutsutakse fish_land seest: lisab punktid ja teeb bossile kahju
create or replace function public.fx_kt_add(u uuid, p_species text, p_rarity int, p_w numeric, p_giant boolean) returns jsonb language plpgsql as $$
declare d date := fx_today(); w record; avgw numeric; v_pts int; b kalatund_boss; v_dmg int; killed boolean := false; rise boolean := false;
begin
  select * into w from fx_kt_win(d);
  if now() < w.p_from or now() >= w.p_to then return null; end if;
  select (min_w + max_w) / 2 into avgw from fish_species where id = p_species;
  v_pts := greatest(1, round((array[5,10,25,60,150,400])[least(6, greatest(1, p_rarity))] * (0.6 + 0.4 * least(3, p_w / greatest(avgw, 0.01))) * case when p_giant then 1.5 else 1 end));
  b := fx_kt_boss(d);
  -- kui koletis on lõplikult alistatud, siis punkte enam ei tule
  if b.killed_at is not null then return null; end if;
  v_dmg := greatest(0, least(b.hp, v_pts));
  insert into kalatund_score(day, user_id, pts, fish, dmg, best_rarity) values (d, u, v_pts, 1, v_dmg, p_rarity)
  on conflict (day, user_id) do update set pts = kalatund_score.pts + v_pts, fish = kalatund_score.fish + 1,
    dmg = kalatund_score.dmg + v_dmg, best_rarity = greatest(kalatund_score.best_rarity, p_rarity);
  if v_dmg > 0 and b.hp - v_dmg <= 0 then
    -- ainult üks saab viimase löögi (rida lukustatakse vaid sel ühel hetkel)
    if b.killed1_at is null and b.max_hp2 is not null and fx_kt_dmg(d) < b.max_hp + b.max_hp2 then
      update kalatund_boss set killed1_at = now(), killer1 = u where day = d and killed1_at is null;
      if found then rise := true; perform fx_news(u, 'boss', jsonb_build_object('day', d, 'stage', 1)); end if;
    else
      update kalatund_boss set killed_at = now(), killer = u, hp = 0, killed1_at = coalesce(killed1_at, now()), killer1 = coalesce(killer1, u) where day = d and killed_at is null;
      if found then killed := true;
        perform fx_news(u, 'boss', jsonb_build_object('day', d));
        perform fx_news(u, 'boss_team', fx_boss_team(d));
      end if;
    end if;
  end if;
  return jsonb_build_object('pts', v_pts, 'dmg', v_dmg, 'hp', greatest(0, b.hp - v_dmg), 'max_hp', b.max_hp, 'killed', killed, 'rise', rise);
end $$;

create or replace function public.fx_kt_top(d date, u uuid, lim int) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(q.j order by (q.j ->> 'pts')::int desc, q.j ->> 'name'), '[]') from (
    select jsonb_build_object('place', x.place, 'name', x.name, 'title', x.title, 'pts', x.pts, 'fish', x.fish, 'dmg', x.dmg, 'me', x.user_id = u) as j
    from (select k.user_id, p.name, f.title, k.pts, k.fish, k.dmg, (row_number() over (order by k.pts desc, k.fish desc, k.user_id))::int as place
          from kalatund_score k join profiles p on p.id = k.user_id left join fishers f on f.user_id = k.user_id where k.day = d) x
    where x.place <= lim or x.user_id = u
    union all
    select jsonb_build_object('place', null, 'bot', b.id, 'emoji', b.emoji, 'name', b.name, 'title', 'Järve kalur', 'pts', k.pts, 'fish', k.fish, 'dmg', k.dmg, 'me', false)
    from kalatund_bot_score k join fish_bots b on b.id = k.bot where k.day = d and k.pts > 0) q
$$;

create or replace function public.fish_kalatund() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today(); w record; b kalatund_boss; yb kalatund_boss; mine jsonb; unclaimed int; act boolean; nxt timestamptz; part int;
begin
  perform fx_fisher(u);
  select * into w from fx_kt_win(d);
  act := now() >= w.p_from and now() < w.p_to;
  nxt := case when now() < w.p_from then w.p_from else (select p_from from fx_kt_win(d + 1)) end;
  if act then b := fx_kt_boss(d); else b := fx_kt_get(d); end if;
  yb := fx_kt_get(d - 1);
  select to_jsonb(k) - 'user_id' - 'day' into mine from kalatund_score k where k.day = d and k.user_id = u;
  select count(*) into part from kalatund_score where day = d;
  select count(*) into unclaimed from kalatund_score k where k.user_id = u and k.day >= d - 7
    and (k.day < d or now() >= w.p_to) and not exists (select 1 from kalatund_prize z where z.user_id = u and z.day = k.day);
  return jsonb_build_object('now', now(), 'active', act, 'start', w.p_from, 'end', w.p_to, 'next', nxt, 'hour', fx_kt_hour(),
    'ext', (select jsonb_build_object('mins', mins, 'why', why) from kalatund_ext where day = d and mins > 0),
    'top', fx_kt_top(d, u, 10), 'mine', mine, 'players', part + (select count(*) from kalatund_bot_score where day = d), 'unclaimed', unclaimed,
    'boss', case when b.day is null then null else jsonb_build_object('hp', b.hp, 'max_hp', b.max_hp, 'killed_at', b.killed_at,
       'stage', case when b.killed_at is not null or b.killed1_at is not null or (b.max_hp2 is not null and fx_kt_dmg(d) >= (select max_hp from kalatund_boss where day = d)) then 2 else 1 end,
       'stages', case when b.max_hp2 is null then 1 else 2 end, 'killed1_at', b.killed1_at,
       'killer1', coalesce((select name from profiles where id = b.killer1), (select name from fish_bots where id = b.killer1_bot)),
       'killer', coalesce((select name from profiles where id = b.killer), (select name from fish_bots where id = b.killer_bot))) end,
    'yesterday', jsonb_build_object('top', (select coalesce(jsonb_agg(e) filter (where (e->>'place')::int <= 3), '[]') from jsonb_array_elements(fx_kt_top(d - 1, u, 3)) e),
       'boss', case when yb.day is null then null else jsonb_build_object('killed', yb.killed_at is not null, 'killer', coalesce((select name from profiles where id = yb.killer), (select name from fish_bots where id = yb.killer_bot))) end));
end $$;

create or replace function public.fish_kt_claim() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today(); w record; k record; pl int; b kalatund_boss; v_gold int; v_xp int; got jsonb := '[]';
  levels int[] := '{}'; items jsonb; topdmg uuid; f fishers; mats jsonb; nbait int; kills int;
begin
  select * into f from fx_fisher(u);
  select * into w from fx_kt_win(d);
  for k in select * from kalatund_score s where s.user_id = u and s.day >= d - 7 and (s.day < d or now() >= w.p_to)
           and not exists (select 1 from kalatund_prize z where z.user_id = u and z.day = s.day) order by s.day loop
    insert into kalatund_prize(user_id, day) values (u, k.day) on conflict do nothing;
    if not found then continue; end if;
    select place into pl from (select user_id, row_number() over (order by pts desc, fish desc, user_id) as place from kalatund_score where day = k.day) x where x.user_id = u;
    v_gold := 100 + case pl when 1 then 1500 when 2 then 800 when 3 then 400 else 0 end;
    v_xp := 60 + case pl when 1 then 500 when 2 then 250 when 3 then 120 else 0 end;
    items := '[]'; mats := '{}'; nbait := 0; kills := 0;
    select * into b from kalatund_boss where day = k.day;
    if (b.killed_at is not null or b.killed1_at is not null) and k.dmg > 0 then
      -- Järvekoletis on kord päevas – alistamine annab suure auhinna
      kills := case when b.max_hp2 is null then 1 when b.killed_at is not null then 2 else 1 end;
      v_gold := v_gold + 800 + f.level * 25; v_xp := v_xp + 400;
      items := fx_give_random(u, 4, 1);
      perform fx_mat_add(u, 'kuldsoomus', 2); mats := jsonb_build_object('kuldsoomus', 2); nbait := 5;
      if kills = 2 then -- teine, tugevam koletis ka alistatud
        v_gold := v_gold + 1500 + f.level * 40; v_xp := v_xp + 700;
        items := items || fx_give_random(u, 5, 1);
        perform fx_mat_add(u, 'kuldsoomus', 3); perform fx_mat_add(u, 'iidneluu', 1); mats := jsonb_build_object('kuldsoomus', 5, 'iidneluu', 1); nbait := 10;
      end if;
      -- viimase löögi andja saab lisaks
      if b.killer = u or b.killer1 = u then v_gold := v_gold + 500; end if;
      -- kahju järgi: mida rohkem koletist lõid, seda rohkem kulda (kuni +1500)
      v_gold := v_gold + least(1500, k.dmg);
      update fishers set baits = jsonb_set(baits, '{haldjatolm}', to_jsonb(coalesce((baits ->> 'haldjatolm')::int, 0) + nbait)) where user_id = u;
      select user_id into topdmg from kalatund_score where day = k.day order by dmg desc, pts desc limit 1;
      if topdmg = u then update fishers set titles = case when not ('Bossikala alistaja' = any(titles)) then titles || 'Bossikala alistaja'::text else titles end where user_id = u; end if;
    end if;
    update fishers set gold = gold + v_gold,
      titles = case when pl = 1 and not ('Kalatunni kuningas' = any(titles)) then titles || 'Kalatunni kuningas'::text else titles end where user_id = u;
    if pl = 1 then perform fx_news(u, 'kalatund', jsonb_build_object('day', k.day, 'pts', k.pts)); end if;
    levels := levels || fx_add_xp(u, v_xp);
    got := got || jsonb_build_object('day', k.day, 'place', pl, 'pts', k.pts, 'gold', v_gold, 'xp', v_xp, 'boss', kills > 0, 'kills', kills, 'items', items, 'mats', mats, 'bait', nbait, 'dmg', k.dmg);
  end loop;
  return jsonb_build_object('prizes', got, 'levels', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;


-- ---------------------------------------------------------------------
-- 6h. Udukuninga saladus, 1. osa
-- ---------------------------------------------------------------------
-- annab saladuse (ainult üks kord); tagastab preemia või null
create or replace function public.fx_secret_give(u uuid, p_id text) returns jsonb language plpgsql as $$
declare d secret_defs; v_items jsonb := '[]'; n int;
begin
  select * into d from secret_defs where id = p_id;
  if d.id is null then return null; end if;
  insert into secret_found(user_id, secret) values (u, p_id) on conflict do nothing;
  if not found then return null; end if;
  update fishers set gold = gold + d.reward_gold where user_id = u;
  if d.reward_item is not null and d.reward_qty > 0 then v_items := fx_give_item(u, d.reward_item, d.reward_qty); end if;
  select count(*) into n from secret_found where user_id = u;
  perform fx_news(u, 'secret', jsonb_build_object('n', n));
  return jsonb_build_object('id', d.id, 'name', d.name, 'descr', d.descr, 'gold', d.reward_gold, 'items', v_items);
end $$;

create or replace function public.fx_piece_give(u uuid, p_n int, p_src text) returns boolean language plpgsql as $$
begin
  insert into secret_pieces(user_id, piece, source) values (u, p_n, p_src) on conflict do nothing;
  return found;
end $$;

-- Kõikide sündmuste ühine kontroll: kas leiti saladus või kaarditükk
create or replace function public.fx_secret_ev(u uuid, ev text, d jsonb) returns jsonb language plpgsql as $$
declare st secret_state; cand text[] := '{}'; c text; x jsonb; v_found jsonb := '[]'; v_pieces int[] := '{}'; v_chron jsonb; v_animal text; ch jsonb;
  t0 timestamptz := (fx_today()::timestamp at time zone 'Europe/Tallinn'); loc timestamp := now() at time zone 'Europe/Tallinn';
  n int; dep int; chance numeric;
begin
  insert into secret_state(user_id) values (u) on conflict do nothing;
  select * into st from secret_state where user_id = u for update;
  if ev = 'catch' then
    if d ->> 'species' = 'angerjas' and d ->> 'weather' = 'torm' then cand := cand || 'tormiangerjas'::text; end if;
    if extract(hour from loc) = 0 and extract(minute from loc) < 10 then cand := cand || 'keskoo'::text; end if;
    if coalesce((d ->> 'killed')::boolean, false) then cand := cand || 'koletis'::text; end if;
    if not exists (select 1 from secret_found where user_id = u and secret = 'udukalur') and d ->> 'weather' = 'udu'
       and (select count(*) from fish_catches where user_id = u and not bought and weather = 'udu' and caught_at >= t0) >= 5 then cand := cand || 'udukalur'::text; end if;
    -- 2. osa: kaarditükk 6 merelt, kaarditükk 7 Kalatunnist
    if coalesce((d ->> 'boat')::boolean, false) and not exists (select 1 from secret_pieces where user_id = u and piece = 6) then
      if random() < 0.12 + 0.08 * st.sea_tries then
        if fx_piece_give(u, 6, 'Merepudeli kiri') then v_pieces := v_pieces || 6; end if;
      else update secret_state set sea_tries = sea_tries + 1 where user_id = u; end if;
    end if;
    if coalesce((d ->> 'kt')::boolean, false) and not exists (select 1 from secret_pieces where user_id = u and piece = 7) then
      if random() < 0.10 + 0.06 * st.kt_tries then
        if fx_piece_give(u, 7, 'Kalatunni koletise kõhust') then v_pieces := v_pieces || 7; end if;
      else update secret_state set kt_tries = kt_tries + 1 where user_id = u; end if;
    end if;
    -- 3. osa: Kalurite kroonika
    ch := fx_chron(fx_boss_week());
    if d ->> 'species' = ch ->> 'species' and d ->> 'spot' = ch ->> 'spot' and d ->> 'weather' = ch ->> 'weather'
       and coalesce((d ->> 'night')::boolean, false) = (ch ->> 'night')::boolean then
      insert into secret_chron(week, user_id, species, weight) values (fx_boss_week(), u, d ->> 'species', coalesce((d ->> 'weight')::numeric, 0)) on conflict do nothing;
      if found then
        update fishers set gold = gold + 2500 where user_id = u;
        v_chron := jsonb_build_object('gold', 2500, 'items', fx_give_item(u, 'koopakristall', 2), 'species', d ->> 'species', 'myth', false);
        if not fx_myth(u, 'hobesoomus') then
          insert into fisher_myth(user_id, myth) values (u, 'hobesoomus') on conflict do nothing;
          v_chron := v_chron || '{"myth":true}';
          perform fx_news(u, 'myth', jsonb_build_object('myth', 'Hõbesoomus'));
        end if;
        perform fx_news(u, 'kroonika', jsonb_build_object('species', d ->> 'species'));
        if (select count(*) from secret_chron where user_id = u) >= 3 then cand := cand || 'kroonik3'::text; end if;
      end if;
    end if;
    if random() < 0.006 then v_animal := (array['valgehirv','kuldrebane','lendorav'])[1 + floor(random() * 3)::int]; end if;
    if not exists (select 1 from secret_found where user_id = u and secret = 'sada')
       and (select count(*) from fish_catches where user_id = u and not bought and caught_at >= t0) >= 100 then cand := cand || 'sada'::text; end if;
  elsif ev = 'junk' then
    select count(*) into n from (select kind from fish_casts where user_id = u and state = 'landed' order by id desc limit 3) z where kind = 'junk';
    if n = 3 then cand := cand || 'prugikuningas'::text; end if;
  elsif ev = 'chest' then
    if (select count(*) from fish_casts where user_id = u and kind = 'chest' and state = 'landed' and created_at >= t0) >= 3 then cand := cand || 'kirstud'::text; end if;
    if not exists (select 1 from secret_pieces where user_id = u and piece = 1) then
      chance := (case d ->> 'tier' when 'kuld' then 1 when 'hobe' then 0.35 else 0.15 end) + 0.25 * st.chest_tries;
      if random() < chance then
        if fx_piece_give(u, 1, 'Aardekirst') then v_pieces := v_pieces || 1; end if;
      else update secret_state set chest_tries = chest_tries + 1 where user_id = u; end if;
    end if;
  elsif ev = 'quest' then
    if not exists (select 1 from secret_pieces where user_id = u and piece = 3) then
      if random() < 0.3 + 0.25 * st.quest_tries then
        if fx_piece_give(u, 3, 'Vana kaluri kingitus') then v_pieces := v_pieces || 3; end if;
      else update secret_state set quest_tries = quest_tries + 1 where user_id = u; end if;
    end if;
  elsif ev = 'release' then
    if d -> 'species' ? 'kuldkala' then cand := cand || 'helde'::text; end if;
  elsif ev = 'like' then
    if (select count(*) from fish_aq_likes where visitor = u and day = fx_today()) >= 3 then cand := cand || 'naaber'::text; end if;
  elsif ev = 'boss' then
    if random() < 0.04 then v_animal := 'udukull'; end if;
    if coalesce((d ->> 'killed')::boolean, false) then cand := cand || 'varivoit'::text; end if;
    if coalesce((d ->> 'weak')::boolean, false) then cand := cand || 'nork'::text; end if;
  elsif ev = 'hall' then
    if (select cardinality(halls) from secret_castle where user_id = u) >= 4 then cand := cand || 'linnaisand'::text; end if;
  elsif ev = 'cave' then
    dep := coalesce((d ->> 'depth')::int, 0);
    if random() < 0.04 then v_animal := 'kristallkonn'; end if;
    if dep >= 15 then cand := cand || 'sugavus'::text; end if;
    if dep >= 6 and not exists (select 1 from secret_pieces where user_id = u and piece = 4) and random() < 0.25 then
      if fx_piece_give(u, 4, 'Kristallikoopa salakäik') then v_pieces := v_pieces || 4; end if;
    elsif dep >= 12 and not exists (select 1 from secret_pieces where user_id = u and piece = 5) and random() < 0.25 then
      if fx_piece_give(u, 5, 'Kristallikoopa põhi') then v_pieces := v_pieces || 5; end if;
    end if;
  end if;
  foreach c in array cand loop
    x := fx_secret_give(u, c);
    if x is not null then v_found := v_found || x; end if;
  end loop;
  if jsonb_array_length(v_found) > 0 and (select count(*) from secret_found where user_id = u) >= 2 then
    if fx_piece_give(u, 2, 'Kahe saladuse võti') then v_pieces := v_pieces || 2; end if;
  end if;
  -- haruldane loom ilmub (ainult kui sul seda veel pole ja keegi teine ei oota)
  if v_animal is not null and (st.animal is null or st.animal_until < now())
     and not exists (select 1 from fisher_animals where user_id = u and animal = v_animal) then
    update secret_state set animal = v_animal, animal_until = now() + interval '48 hours' where user_id = u;
  else v_animal := null; end if;
  if jsonb_array_length(v_found) = 0 and cardinality(v_pieces) = 0 and v_chron is null and v_animal is null then return null; end if;
  return jsonb_build_object('found', v_found, 'pieces', to_jsonb(v_pieces), 'chron', v_chron,
    'animal', case when v_animal is not null then (select jsonb_build_object('id', id, 'name', name, 'wants', wants) from secret_animals where id = v_animal) end,
    'cave', (v_pieces && array[1, 2, 3]) and fx_cave_open(u),
    'castle', (v_pieces && array[1, 2, 3, 4, 5, 6, 7]) and (select count(*) from secret_pieces where user_id = u) = 7);
end $$;

create or replace function public.fx_cave_open(u uuid) returns boolean language sql stable as
$$ select (select count(*) from public.secret_pieces where user_id = u and piece <= 3) = 3 $$;
create or replace function public.fx_cave_doors() returns jsonb language sql volatile as
$$ select jsonb_agg((array['vesi','tuul','kristall'])[1 + floor(random() * 3)::int]) from generate_series(1, 3) $$;

-- Saladuste raamatu seis
create or replace function public.secret_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st secret_state;
begin
  perform fx_fisher(u);
  insert into secret_state(user_id) values (u) on conflict do nothing;
  select * into st from secret_state where user_id = u;
  return jsonb_build_object(
    'secrets', (select jsonb_agg(jsonb_build_object('id', d.id, 'hint', d.hint, 'found', f.at is not null, 'at', f.at,
                 'name', case when f.at is not null then d.name end, 'descr', case when f.at is not null then d.descr end,
                 'gold', d.reward_gold, 'item', d.reward_item, 'qty', d.reward_qty) order by d.sort)
                from secret_defs d left join secret_found f on f.secret = d.id and f.user_id = u),
    'pieces', (select coalesce(jsonb_agg(jsonb_build_object('n', piece, 'src', source, 'at', at) order by piece), '[]') from secret_pieces where user_id = u),
    'cave_open', fx_cave_open(u),
    'lanterns', fx_lanterns(u) - case when st.cave_day = fx_today() then st.lanterns else 0 end, 'lanterns_max', fx_lanterns(u),
    'run', st.run, 'best_depth', st.best_depth, 'cave_runs', st.cave_runs, 'castle', fx_castle_state(u)) || fx_part3_state(u);
end $$;

-- Kristallikoobas: iga päev 3 laternat. Iga samm on serveri veeretatud.
create or replace function public.secret_cave_start() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st secret_state;
begin
  perform fx_fisher(u);
  insert into secret_state(user_id) values (u) on conflict do nothing;
  select * into st from secret_state where user_id = u for update;
  if not fx_cave_open(u) then raise exception 'Kristallikoobas on veel peidus. Leia enne kolm esimest kaarditükki.'; end if;
  if st.run is not null then raise exception 'Sa oled juba koopas'; end if;
  if st.cave_day is distinct from fx_today() then st.lanterns := 0; end if;
  if st.lanterns >= fx_lanterns(u) then raise exception 'Tänased laternad on otsas. Uued laternad tulevad kesköösel.'; end if;
  update secret_state set cave_day = fx_today(), lanterns = st.lanterns + 1, cave_runs = cave_runs + 1,
    run = jsonb_build_object('depth', 0, 'gold', 0, 'items', '[]'::jsonb, 'doors', fx_cave_doors(), 'steps', 0)
    where user_id = u;
  return secret_state();
end $$;

create or replace function public.secret_cave_go(p_door int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st secret_state; r jsonb; k text; dep int; risk numeric; g int := 0; it text; half int; ev jsonb; sec jsonb;
begin
  select * into st from secret_state where user_id = u for update;
  if st.run is null then raise exception 'Sa ei ole koopas'; end if;
  if p_door not in (0, 1, 2) then raise exception 'Vali üks kolmest käigust'; end if;
  r := st.run; k := r -> 'doors' ->> p_door; dep := (r ->> 'depth')::int;
  risk := least(0.55, case k when 'tuul' then 0.10 + 0.03 * dep when 'kristall' then 0.07 + 0.025 * dep else 0.05 + 0.02 * dep end);
  if random() < risk then
    -- varing: pool kullast jääb alles, esemed jäävad koopasse
    half := ((r ->> 'gold')::int) / 2;
    update fishers set gold = gold + half where user_id = u;
    update secret_state set run = null, best_depth = greatest(best_depth, dep) where user_id = u;
    return secret_state() || jsonb_build_object('event', jsonb_build_object('type', 'collapse', 'kind', k, 'gold', half,
      'lost', jsonb_array_length(r -> 'items'), 'depth', dep));
  end if;
  dep := dep + case when k = 'tuul' then 2 else 1 end;
  if k = 'kristall' then
    g := 25 + 12 * dep;
    if random() < 0.35 then it := 'koopakristall'; end if;
  elsif k = 'vesi' then
    g := 10 + 4 * dep;
    if random() < 0.55 then
      select id into it from fish_items where rarity <= least(5, 1 + dep / 4) and id <> 'koopakristall'
        order by -ln(greatest(random(), 1e-9)) * power(2, rarity) limit 1;
    end if;
  else g := 8 + 3 * dep; end if;
  r := jsonb_set(jsonb_set(jsonb_set(r, '{depth}', to_jsonb(dep)), '{gold}', to_jsonb((r ->> 'gold')::int + g)), '{steps}', to_jsonb((r ->> 'steps')::int + 1));
  if it is not null then r := jsonb_set(r, '{items}', (r -> 'items') || to_jsonb(it)); end if;
  r := jsonb_set(r, '{doors}', fx_cave_doors());
  update secret_state set run = r, best_depth = greatest(best_depth, dep) where user_id = u;
  sec := fx_secret_ev(u, 'cave', jsonb_build_object('depth', dep));
  ev := jsonb_build_object('type', 'step', 'kind', k, 'gold', g, 'item', it, 'depth', dep);
  return secret_state() || jsonb_build_object('event', ev, 'sec', sec);
end $$;

create or replace function public.secret_cave_leave() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st secret_state; r jsonb; g int; it text; v_items jsonb := '[]'; xp int; levels int[];
begin
  select * into st from secret_state where user_id = u for update;
  if st.run is null then raise exception 'Sa ei ole koopas'; end if;
  r := st.run; g := (r ->> 'gold')::int; xp := ((r ->> 'depth')::int) * 12;
  update secret_state set run = null where user_id = u;
  update fishers set gold = gold + g where user_id = u;
  for it in select jsonb_array_elements_text(r -> 'items') loop v_items := v_items || fx_give_item(u, it, 1); end loop;
  levels := fx_add_xp(u, xp);
  return secret_state() || jsonb_build_object('event', jsonb_build_object('type', 'leave', 'gold', g, 'items', v_items, 'xp', xp, 'depth', (r ->> 'depth')::int),
    'levels', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;


-- ---------------------------------------------------------------------
-- 6i. Udukuninga saladus, 2. osa: Udulinnus, Kuninga Vari, müütilised esemed
-- ---------------------------------------------------------------------
create or replace function public.fx_myth(u uuid, p_id text) returns boolean language sql stable as
$$ select exists (select 1 from public.fisher_myth where user_id = u and myth = p_id) $$;
create or replace function public.fx_lanterns(u uuid) returns int language sql stable as
$$ select 3 + case when public.fx_myth(u, 'kristallsuda') then 1 else 0 end + case when public.fx_myth(u, 'parijasormus') then 1 else 0 end $$;
create or replace function public.fx_boss_hits(u uuid) returns int language sql stable as
$$ select 5 + case when public.fx_myth(u, 'parijasormus') then 1 else 0 end $$;
create or replace function public.fx_castle_open(u uuid) returns boolean language sql stable as
$$ select (select count(*) from public.secret_pieces where user_id = u) = 7
     and coalesce((select cardinality(boats) from public.fishers where user_id = u), 0) >= 1 $$;
-- Peeglisaali mõistatused (vastus ainult serveris)
create or replace function public.fx_riddle(i int) returns jsonb language sql immutable as $$
  select (array[
    '{"q":"Mida rohkem sellest ära võtad, seda suuremaks see läheb.","o":["Auk","Järv","Vari","Mägi"],"a":0}',
    '{"q":"Mul on suu, aga ma ei räägi. Mul on säng, aga ma ei maga.","o":["Kala","Jõgi","Loss","Paat"],"a":1}',
    '{"q":"Mida rohkem mind on, seda vähem sa näed.","o":["Vesi","Kuld","Pimedus","Tuul"],"a":2}',
    '{"q":"Ma rändan ilma jalgadeta ja nutan ilma silmadeta.","o":["Kell","Kala","Vari","Pilv"],"a":3}',
    '{"q":"Mis läheb ainult üles, aga ei tule kunagi alla?","o":["Vanus","Kivi","Lind","Vihm"],"a":0}',
    '{"q":"Mul on võtmed, aga ühtegi ust ma ei ava.","o":["Vang","Klaver","Kirst","Kuningas"],"a":1}'
  ])[1 + ((i % 6) + 6) % 6]::jsonb $$;
create or replace function public.fx_boss_week() returns date language sql stable as
$$ select date_trunc('week', public.fx_today())::date $$;
-- Iga nädal on Kuninga Vari natuke erinev: tal on ilm, mida ta kardab (siis teevad löögid topelt kahju)
create or replace function public.fx_boss_form(w date) returns jsonb language sql immutable as $$
  select (array[
    '{"name":"Udune Vari","weak":"udu","descr":"Ta peidab end udu sisse – aga udus on ta ise nähtav."}',
    '{"name":"Vihmavari","weak":"vihm","descr":"Vihmapiisad paljastavad ta kuju."}',
    '{"name":"Pilvede Vari","weak":"pilves","descr":"Pilvise taevaga kaotab ta oma varju."}',
    '{"name":"Kesköö Vari","weak":"paike","descr":"Ta kardab päikesevalgust üle kõige."}'
  ])[1 + (extract(week from w)::int % 4)]::jsonb $$;
create or replace function public.fx_boss(w date) returns public.secret_boss language plpgsql as $$
declare b secret_boss; n int;
begin
  select * into b from secret_boss where week = w;
  if b.week is null then
    select count(*) into n from secret_boss_dmg where week = w - 7 and dmg > 0;
    insert into secret_boss(week, hp, max_hp) values (w, greatest(15000, 8000 * n), greatest(15000, 8000 * n)) on conflict do nothing;
    select * into b from secret_boss where week = w;
  end if;
  return b;
end $$;

create or replace function public.fx_castle_state(u uuid) returns jsonb language plpgsql stable as $$
declare cs secret_castle; w date := fx_boss_week(); b secret_boss; frm jsonb := fx_boss_form(fx_boss_week()); me secret_boss_dmg; rd jsonb; open boolean := fx_castle_open(u); n7 int;
begin
  select * into cs from secret_castle where user_id = u;
  select count(*) into n7 from secret_pieces where user_id = u;
  select * into b from secret_boss where week = w;
  select * into me from secret_boss_dmg where week = w and user_id = u;
  rd := fx_riddle(coalesce(cs.riddle, 0));
  return jsonb_build_object(
    'open', open, 'need_boat', n7 = 7 and not open,
    'halls', to_jsonb(coalesce(cs.halls, '{}')),
    'riddle', case when open and not ('peegel' = any(coalesce(cs.halls, '{}'))) then jsonb_build_object('q', rd -> 'q', 'o', rd -> 'o') end,
    'riddle_wait', case when cs.riddle_wait > now() then cs.riddle_wait end,
    'myths', (select coalesce(jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name, 'descr', m.descr, 'src', m.src, 'own', f.at is not null) order by m.sort), '[]')
              from secret_myths m left join fisher_myth f on f.myth = m.id and f.user_id = u),
    'boss', jsonb_build_object('week', w, 'ends', ((w + 7)::timestamp at time zone 'Europe/Tallinn'), 'name', frm -> 'name', 'weak', frm -> 'weak', 'descr', frm -> 'descr',
      'hp', coalesce(b.hp, greatest(15000, 8000 * (select count(*) from secret_boss_dmg where week = w - 7 and dmg > 0))),
      'max_hp', coalesce(b.max_hp, greatest(15000, 8000 * (select count(*) from secret_boss_dmg where week = w - 7 and dmg > 0))),
      'killed', b.killed_at is not null, 'killer', (select name from profiles where id = b.killer),
      'my_dmg', coalesce(me.dmg, 0), 'my_hits', coalesce(me.hits, 0),
      'left', fx_boss_hits(u) - case when cs.atk_day = fx_today() then cs.atk_n else 0 end, 'hits_max', fx_boss_hits(u),
      'top', (select coalesce(jsonb_agg(jsonb_build_object('name', case when p.hidden and x.user_id <> u then 'Salapärane kalur' else p.name end, 'dmg', x.dmg, 'me', x.user_id = u) order by x.dmg desc), '[]')
              from (select * from secret_boss_dmg where week = w and dmg > 0 order by dmg desc limit 5) x join profiles p on p.id = x.user_id),
      'claim', (select count(*) from secret_boss_dmg d left join secret_boss bb on bb.week = d.week
                where d.user_id = u and d.dmg > 0 and not d.claimed and (d.week < w or bb.killed_at is not null))));
end $$;

-- Udulinna saalid. Iga saal annab ühe müütilise eseme (ainult üks kord).
create or replace function public.secret_castle_hall(p_hall text, p_answer int default null) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; cs secret_castle; v_myth text; ids bigint[]; rd jsonb; sec jsonb;
begin
  f := fx_fisher(u);
  if not fx_castle_open(u) then raise exception 'Udulinn on veel udu sees. Vaja on kõiki seitset kaarditükki ja paati.'; end if;
  insert into secret_castle(user_id) values (u) on conflict do nothing;
  select * into cs from secret_castle where user_id = u for update;
  if p_hall = any(cs.halls) then raise exception 'See saal on juba avatud'; end if;
  if p_hall = 'varav' then
    if f.gold < 3000 then raise exception 'Värava avamiseks on kalurikassas vaja 3000 kulda'; end if;
    perform fx_pay_items(u, '{"koopakristall":5}');
    update fishers set gold = gold - 3000 where user_id = u;
    v_myth := 'udukroon';
  elsif p_hall = 'peegel' then
    if cs.riddle_wait > now() then raise exception 'Peegel on veel tume. Uus mõistatus ilmub tunni aja pärast vale vastusest.'; end if;
    if p_answer is null then raise exception 'Vali vastus'; end if;
    rd := fx_riddle(cs.riddle);
    if p_answer <> (rd ->> 'a')::int then
      update secret_castle set riddle_wait = now() + interval '1 hour', riddle = (cs.riddle + 1 + floor(random() * 5)::int) % 6 where user_id = u;
      return secret_state() || jsonb_build_object('hall_result', jsonb_build_object('ok', false, 'hall', 'peegel'));
    end if;
    v_myth := 'hobesarv';
  elsif p_hall = 'raamatukogu' then
    select array_agg(id) into ids from (select distinct on (rarity) id from fish_catches
      where user_id = u and status = 'kept' and rarity between 1 and 5 order by rarity, weight) z;
    if coalesce(array_length(ids, 1), 0) < 5 then
      raise exception 'Raamatukoguhoidja vajab saagist ühte kala igast haruldusest: tavaline, ebatavaline, haruldane, eepiline ja legendaarne.';
    end if;
    update fish_catches set status = 'exchanged' where id = any(ids) and user_id = u;
    v_myth := 'varjuvork';
  elsif p_hall = 'kristall' then
    if coalesce((select best_depth from secret_state where user_id = u), 0) < 12 then
      raise exception 'Kristallisaali uks avaneb ainult neile, kes on käinud Kristallikoopas vähemalt 12. sügavusel.';
    end if;
    perform fx_pay_items(u, '{"koopakristall":10}');
    v_myth := 'kristallsuda';
  else raise exception 'Tundmatu saal'; end if;
  update secret_castle set halls = halls || p_hall where user_id = u;
  insert into fisher_myth(user_id, myth) values (u, v_myth) on conflict do nothing;
  perform fx_news(u, 'myth', jsonb_build_object('myth', (select name from secret_myths where id = v_myth)));
  sec := fx_secret_ev(u, 'hall', '{}');
  return secret_state() || jsonb_build_object('hall_result', jsonb_build_object('ok', true, 'hall', p_hall, 'myth', v_myth), 'sec', sec);
end $$;

-- Kuninga Vari: ühine nädala boss. 5 lööki päevas, kahju arvutab server.
create or replace function public.secret_boss_attack() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; cs secret_castle; w date := fx_boss_week(); b secret_boss; frm jsonb := fx_boss_form(fx_boss_week());
  v_dmg int; weak boolean; killed boolean := false; wthr text := fx_weather(); sec jsonb;
begin
  f := fx_fisher(u);
  if not fx_castle_open(u) then raise exception 'Troonisaali pääseb ainult Udulinnast'; end if;
  insert into secret_castle(user_id) values (u) on conflict do nothing;
  select * into cs from secret_castle where user_id = u for update;
  if cs.atk_day is distinct from fx_today() then cs.atk_n := 0; end if;
  if cs.atk_n >= fx_boss_hits(u) then raise exception 'Sinu tänased löögid on tehtud. Uued löögid tulevad kesköösel.'; end if;
  perform pg_advisory_xact_lock(hashtext('kuningavari' || w::text));
  b := fx_boss(w);
  if b.killed_at is not null then raise exception 'Kuninga Vari on sel nädalal juba alistatud. Võta oma preemia!'; end if;
  weak := wthr = frm ->> 'weak';
  v_dmg := 80 + f.level * 6 + least(f.prestige, 40) * 15 + (select count(*) from fisher_myth where user_id = u)::int * 60 + floor(random() * 81)::int;
  v_dmg := round(v_dmg * case when weak then 2 else 1 end * case when wthr = 'torm' then 1.5 else 1 end);
  v_dmg := least(v_dmg, b.hp);
  update secret_boss set hp = hp - v_dmg where week = w returning * into b;
  if b.hp <= 0 then
    update secret_boss set killed_at = now(), killer = u where week = w; killed := true;
    perform fx_news(u, 'vari', jsonb_build_object('name', frm ->> 'name'));
  end if;
  insert into secret_boss_dmg(week, user_id, dmg, hits) values (w, u, v_dmg, 1)
    on conflict (week, user_id) do update set dmg = secret_boss_dmg.dmg + v_dmg, hits = secret_boss_dmg.hits + 1;
  update secret_castle set atk_day = fx_today(), atk_n = cs.atk_n + 1 where user_id = u;
  sec := fx_secret_ev(u, 'boss', jsonb_build_object('killed', killed, 'weak', weak));
  return secret_state() || jsonb_build_object('attack', jsonb_build_object('dmg', v_dmg, 'weak', weak, 'storm', wthr = 'torm', 'killed', killed), 'sec', sec);
end $$;

-- Preemiad: kui Vari on alistatud (või nädal läbi), saab iga lööja preemia ühe korra
create or replace function public.secret_boss_claim() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); w date := fx_boss_week(); r record; place int; g int; v_items jsonb; res jsonb := '[]'; got_myth boolean := false; levels int[] := '{}';
begin
  perform fx_fisher(u);
  for r in select d.*, bb.killed_at from secret_boss_dmg d left join secret_boss bb on bb.week = d.week
           where d.user_id = u and d.dmg > 0 and not d.claimed and (d.week < w or bb.killed_at is not null) order by d.week for update of d loop
    select count(*) + 1 into place from secret_boss_dmg where week = r.week and dmg > r.dmg;
    v_items := '[]';
    if r.killed_at is not null then
      g := 1500 + least(3000, r.dmg / 5) + case place when 1 then 1500 when 2 then 900 when 3 then 500 else 0 end;
      v_items := fx_give_item(u, 'koopakristall', 2) || fx_give_random(u, 5, 1);
      if not fx_myth(u, 'kuuong') then
        insert into fisher_myth(user_id, myth) values (u, 'kuuong') on conflict do nothing; got_myth := true;
        perform fx_news(u, 'myth', jsonb_build_object('myth', 'Kuuõng'));
      end if;
      levels := levels || fx_add_xp(u, 600);
    else
      g := 400 + least(1000, r.dmg / 10);
      levels := levels || fx_add_xp(u, 150);
    end if;
    update fishers set gold = gold + g where user_id = u;
    update secret_boss_dmg set claimed = true where week = r.week and user_id = u;
    res := res || jsonb_build_object('week', r.week, 'place', place, 'killed', r.killed_at is not null, 'gold', g, 'items', v_items, 'dmg', r.dmg);
  end loop;
  return secret_state() || jsonb_build_object('prizes', res, 'myth', got_myth, 'levels', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;


-- ---------------------------------------------------------------------
-- 6j. Udukuninga saladus, 3. osa: Kalurite kroonika, haruldased loomad, Pärija sõrmus
-- ---------------------------------------------------------------------
-- Nädala kroonikakala: kõigile sama, valitakse nädala järgi (haruldane või eepiline kala, kindel koht, ilm ja aeg)
create or replace function public.fx_chron(w date) returns jsonb language plpgsql stable as $$
declare sp fish_species; v_spot text; v_w text; v_night boolean;
begin
  -- kala ja koht valitakse koos: koht peab olema kättesaadav 30. tasemel ja tavalise paadiga
  select s.id, x.spot into v_w, v_spot from fish_species s cross join lateral unnest(s.spots) as x(spot) join fish_spots f on f.id = x.spot
    where s.rarity in (3, 4) and not s.night_only and not s.winter_only and s.weather is null and s.event is null and s.min_level <= 30
      and f.min_level <= 30 and coalesce(f.boat, 'paat') = 'paat'
    order by md5(s.id || x.spot || w::text) limit 1;
  select * into sp from fish_species where id = v_w;
  v_w := (array['paike','pilves','vihm','udu'])[1 + abs(hashtext('kroonika-ilm' || w::text)) % 4];
  v_night := abs(hashtext('kroonika-oo' || w::text)) % 2 = 1;
  return jsonb_build_object('species', sp.id, 'name', sp.name, 'rarity', sp.rarity, 'spot', v_spot, 'spot_name', (select name from fish_spots where id = v_spot),
    'weather', v_w, 'night', v_night);
end $$;

create or replace function public.fx_part3_state(u uuid) returns jsonb language plpgsql stable as $$
declare w date := fx_boss_week(); ch jsonb := fx_chron(fx_boss_week()); stage int; st secret_state; me secret_chron; hints jsonb;
begin
  select * into st from secret_state where user_id = u;
  select * into me from secret_chron where week = w and user_id = u;
  stage := case when fx_today() - w >= 4 then 3 when fx_today() - w >= 2 then 2 else 1 end;
  if me.user_id is not null then stage := 3; end if;
  hints := jsonb_build_array(
    (case ch ->> 'weather' when 'paike' then 'Kui päike paistab' when 'pilves' then 'Kui pilved katavad taeva' when 'vihm' then 'Kui vihm trummeldab vett' else 'Kui udu lamab vee kohal' end)
      || case when (ch ->> 'night')::boolean then ' ja öö on pime,' else ' ja päev on valge,' end);
  if stage >= 2 then hints := hints || to_jsonb('ujub paigas nimega „' || (ch ->> 'spot_name') || '“ kala, keda kroonika ootab.'); end if;
  if stage >= 3 then hints := hints || to_jsonb('Tema nimi algab tähega „' || upper(left(ch ->> 'name', 1)) || '“ ja on ' || length(ch ->> 'name') || ' tähte pikk. Ta on '
       || case when (ch ->> 'rarity')::int = 4 then 'eepiline' else 'haruldane' end || '.'); end if;
  return jsonb_build_object(
    'chron', jsonb_build_object('week', w, 'hints', hints, 'stage', stage, 'done', me.user_id is not null,
       'answer', case when me.user_id is not null then jsonb_build_object('species', ch -> 'species', 'name', ch -> 'name', 'spot', ch -> 'spot_name', 'weight', me.weight) end,
       'weeks', (select count(*) from secret_chron where user_id = u),
       'solvers', (select count(*) from secret_chron where week = w)),
    'animals', (select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'descr', a.descr, 'wants', a.wants, 'gift', a.gift_txt, 'where', a.where_txt,
                 'own', f.at is not null) order by a.sort), '[]') from secret_animals a left join fisher_animals f on f.animal = a.id and f.user_id = u),
    'visitor', case when st.animal is not null and st.animal_until > now() then jsonb_build_object('id', st.animal, 'until', st.animal_until) end,
    'gift_ready', exists (select 1 from fisher_animals where user_id = u) and st.gift_day is distinct from fx_today(),
    'ring_ready', not fx_myth(u, 'parijasormus') and (select count(*) from fisher_myth where user_id = u and myth <> 'parijasormus') >= 6);
end $$;

-- Taltsuta külla tulnud loom (anna talle see, mida ta tahab)
create or replace function public.secret_animal_tame() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st secret_state; a secret_animals; sec jsonb;
begin
  perform fx_fisher(u);
  select * into st from secret_state where user_id = u for update;
  if st.animal is null or st.animal_until < now() then raise exception 'Ükski loom ei oota sind praegu.'; end if;
  select * into a from secret_animals where id = st.animal;
  perform fx_pay_items(u, a.wants);
  insert into fisher_animals(user_id, animal) values (u, a.id) on conflict do nothing;
  update secret_state set animal = null, animal_until = null where user_id = u;
  perform fx_news(u, 'animal', jsonb_build_object('name', a.name));
  if (select count(*) from fisher_animals where user_id = u) >= (select count(*) from secret_animals) then
    sec := fx_secret_give(u, 'loomaisand');
    if sec is not null then sec := jsonb_build_object('found', jsonb_build_array(sec), 'pieces', '[]'::jsonb); end if;
  end if;
  return secret_state() || jsonb_build_object('tamed', jsonb_build_object('id', a.id, 'name', a.name), 'sec', sec);
end $$;

-- Loomade päevased kingitused (üks kord päevas): kuld, toit, kuulsus ja kaardid lähevad kuningriiki
create or replace function public.secret_animal_gifts() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st secret_state; a record; pk jsonb := '{}'; v_items jsonb := '[]'; k text; v int;
begin
  perform fx_fisher(u);
  select * into st from secret_state where user_id = u for update;
  if not exists (select 1 from fisher_animals where user_id = u) then raise exception 'Sul pole veel ühtegi looma.'; end if;
  if st.gift_day = fx_today() then raise exception 'Loomad on täna juba kingitused toonud. Homme toovad uued!'; end if;
  for a in select s.* from fisher_animals f join secret_animals s on s.id = f.animal where f.user_id = u loop
    for k, v in select key, value::int from jsonb_each_text(a.gift) loop
      if k = 'item' then v_items := v_items || fx_give_random(u, 3, v);
      else pk := jsonb_set(pk, array[k], to_jsonb(coalesce((pk ->> k)::int, 0) + v)); end if;
    end loop;
  end loop;
  if pk <> '{}' then perform fx_inbox(u, pk, 'Loomade kingitused'); end if;
  update secret_state set gift_day = fx_today() where user_id = u;
  return secret_state() || jsonb_build_object('gifts', jsonb_build_object('kingdom', pk, 'items', v_items));
end $$;

-- Pärija sõrmus: kui kuus müütilist eset on koos
create or replace function public.secret_ring() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u);
  if fx_myth(u, 'parijasormus') then raise exception 'Sõrmus on juba sinu sõrmes.'; end if;
  if (select count(*) from fisher_myth where user_id = u and myth <> 'parijasormus') < 6 then raise exception 'Sõrmus ärkab alles siis, kui kõik kuus teist müütilist eset on koos.'; end if;
  insert into fisher_myth(user_id, myth) values (u, 'parijasormus') on conflict do nothing;
  perform fx_inbox(u, '{"gold":20000,"fame":500}', 'Udukuninga pärand');
  perform fx_news(u, 'parija', '{}');
  return secret_state() || jsonb_build_object('ring', true, 'ach', fx_check_ach(u));
end $$;


-- ---------------------------------------------------------------------
-- 6k. Igapäevane sisselogimise jada
-- ---------------------------------------------------------------------
create or replace function public.daily_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); r daily_streak; d date := fx_today(); cur int; can boolean;
begin
  perform fx_fisher(u);
  select * into r from daily_streak where user_id = u;
  can := r.last_day is distinct from d;
  -- jada kehtib, kui eile või täna on preemia võetud; muidu algab uuesti
  cur := case when r.last_day = d or r.last_day = d - 1 then r.streak else 0 end;
  return jsonb_build_object('streak', cur, 'best', coalesce(r.best, 0), 'total', coalesce(r.total, 0), 'can', can,
    'day', case when can then (cur % 7) + 1 else ((cur - 1) % 7) + 1 end, 'today', d,
    'broken', r.last_day is not null and r.last_day < d - 1 and coalesce(r.streak, 0) > 1);
end $$;

create or replace function public.daily_claim() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; r daily_streak; d date := fx_today(); n int; day int; g int := 0; v_items jsonb := '[]'; bb text; kd jsonb := '{}'; sec jsonb; x jsonb; bq int := 0;
begin
  f := fx_fisher(u);
  insert into daily_streak(user_id) values (u) on conflict do nothing;
  select * into r from daily_streak where user_id = u for update;
  if r.last_day = d then raise exception 'Tänane preemia on juba võetud. Uus preemia tuleb kesköösel.'; end if;
  n := case when r.last_day = d - 1 then r.streak + 1 else 1 end;
  day := ((n - 1) % 7) + 1;
  if day = 1 then g := 200;
  elsif day = 2 then
    select id into bb from fish_baits where consumable and min_level <= f.level order by sort desc limit 1;
    if bb is not null then bq := 10; update fishers set baits = jsonb_set(baits, array[bb], to_jsonb(coalesce((baits ->> bb)::int, 0) + 10)) where user_id = u; end if;
  elsif day = 3 then v_items := fx_give_random(u, 3, 1);
  elsif day = 4 then g := 500;
  elsif day = 5 then v_items := fx_give_item(u, 'koopakristall', 1);
  elsif day = 6 then kd := '{"map":1}';
  else
    g := 1500 + 50 * f.level;
    v_items := fx_give_random(u, 5, 2) || fx_give_item(u, 'koopakristall', 2);
    kd := '{"fame":100}';
  end if;
  if g > 0 then update fishers set gold = gold + g where user_id = u; end if;
  if kd <> '{}' then perform fx_inbox(u, kd, 'Päeva preemia'); end if;
  update daily_streak set streak = n, best = greatest(best, n), total = total + 1, last_day = d where user_id = u;
  if n = 30 or n = 100 then perform fx_news(u, 'streak', jsonb_build_object('n', n)); end if;
  if n >= 30 then
    x := fx_secret_give(u, 'jarjekindel');
    if x is not null then sec := jsonb_build_object('found', jsonb_build_array(x), 'pieces', '[]'::jsonb); end if;
  end if;
  return daily_state() || jsonb_build_object('claimed', jsonb_build_object('day', day, 'streak', n, 'gold', g, 'items', v_items,
    'bait', bb, 'bait_qty', bq, 'kingdom', kd), 'sec', sec);
end $$;


-- ---------------------------------------------------------------------
-- 6l. Geneetikalabor
-- ---------------------------------------------------------------------
create or replace function public.fx_lab_levels() returns jsonb language sql immutable as $$ select '[
 {"lvl":1,"name":"Algaja labor","tanks":1,"req":5,"gold":0,"items":{},"unlock":"Kahe eri liiki kala ühendamine · 1 labori akvaarium"},
 {"lvl":2,"name":"Täiustatud akvaarium","tanks":2,"req":10,"gold":3000,"items":{},"unlock":"Hübriidide ühendamine omavahel · 2 labori akvaariumi"},
 {"lvl":3,"name":"Geneetiline analüsaator","tanks":3,"req":18,"gold":8000,"items":{"parl":5},"unlock":"Peidetud geenid muutuvad nähtavaks · 3 akvaariumi"},
 {"lvl":4,"name":"Haruldaste mutatsioonide uurimine","tanks":4,"req":26,"gold":20000,"items":{"merevaik":5,"parl":10},"unlock":"Salajased legendaarsed retseptid · sagedasemad mutatsioonid · 4 akvaariumi"},
 {"lvl":5,"name":"Müütiliste kalade labor","tanks":6,"req":34,"gold":50000,"items":{"mustparl":2,"merevaik":10},"unlock":"Parimad haruldused · müütilised valgusefektid · 6 akvaariumi"}
]'::jsonb $$;

-- vanema geenid saagist
create or replace function public.fx_lab_genes_c(c public.fish_catches) returns jsonb language plpgsql as $$
declare s fish_species; p numeric; spd int;
begin
  select * into s from fish_species where id = c.species;
  p := greatest(0, least(1, (c.weight - s.min_w) / greatest(0.0001, s.max_w - s.min_w)));
  spd := case when s.arch in ('tuna','sword','pike','salmon','grayling','zander') then 7 when s.arch in ('eel','serpent','perch','herring','monster') then 6
              when s.arch in ('carp','catfish','bream','tench','sturgeon','angler','flat','gold') then 3 else 5 end + floor(random() * 3)::int - 1;
  return jsonb_build_object('elements', jsonb_build_array(s.element), 'arch', s.arch, 'body', s.body, 'col', coalesce(s.look -> 'c', '["#9fb4bc","#4a6a7a","#eef4f6","#7a9aaa"]'),
    'size', greatest(1, least(10, round(2 + p * 6 + s.rarity * 0.4))), 'speed', greatest(1, least(10, spd)), 'strength', greatest(1, least(10, coalesce(s.difficulty, 3))),
    'name', s.name, 'species', s.id, 'rarity', s.rarity, 'weight', c.weight,
    'value', round(s.price * fx_size_mult(s, c.weight)));
end $$;
create or replace function public.fx_lab_genes_h(h public.lab_fish) returns jsonb language sql stable as $$
  select h.genes || jsonb_build_object('name', ls.name, 'species', ls.id, 'rarity', h.rarity, 'weight', h.weight, 'value', h.value, 'elements', jsonb_build_array(ls.e1, ls.e2))
  from public.lab_species ls where ls.id = h.species $$;
-- vali vanemalt pärandatav element (peidetud retsessiivne element võib välja tulla)
create or replace function public.fx_lab_pick(g jsonb) returns text language plpgsql as $$
declare n int := jsonb_array_length(g -> 'elements');
begin
  if g #>> '{hidden,id}' = 'retsessiivne' and random() < 0.25 then return g #>> '{hidden,el}'; end if;
  if n > 1 and random() < 0.35 then return g -> 'elements' ->> 1; end if;
  return g -> 'elements' ->> 0;
end $$;

-- hübriidi andmed mängijale (peidetud geen on näha alates 3. laboritasemest)
create or replace function public.fx_lab_fish_json(h public.lab_fish, lvl int) returns jsonb language sql stable as $$
  select jsonb_build_object('id', h.id, 'species', h.species, 'name', ls.name, 'e1', ls.e1, 'e2', ls.e2, 'body', ls.body, 'legend', ls.legend,
    'rarity', h.rarity, 'weight', h.weight, 'length', h.length_cm, 'value', h.value, 'status', h.status, 'first', h.first_find, 'at', h.created_at,
    'parents', h.parents, 'descr', ls.descr,
    'genes', case when lvl >= 3 or h.genes -> 'hidden' is null then h.genes else jsonb_set(h.genes, '{hidden}', '{"id":"?"}') end,
    'listing', (select jsonb_build_object('id', m.id, 'price', m.price) from public.lab_market m where m.fish_id = h.id and m.status = 'open'))
  from public.lab_species ls where ls.id = h.species $$;

-- tänane labori tellimus (igal mängijal oma, muutub iga päev)
create or replace function public.fx_lab_req(u uuid) returns jsonb language sql stable as $$
  select jsonb_build_object('element', (array['tuli','jää','vesi','välk','vari','valgus','loodus'])[1 + abs(hashtext(u::text || public.fx_today()::text)) % 7],
    'minr', 1 + abs(hashtext(public.fx_today()::text || u::text)) % 3,
    'gold', 300 + 250 * (1 + abs(hashtext(public.fx_today()::text || u::text)) % 3),
    'xp', 120 * (1 + abs(hashtext(public.fx_today()::text || u::text)) % 3)) $$;

create or replace function public.lab_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; st lab_state; lvl int; w numeric[]; lb numeric; tot numeric := 0; odds jsonb := '[]'; i int; lv jsonb := fx_lab_levels();
begin
  f := fx_fisher(u);
  insert into lab_state(user_id) values (u) on conflict do nothing;
  select * into st from lab_state where user_id = u;
  lvl := st.level;
  select array_agg(x::numeric) into w from jsonb_array_elements_text(fx_lab_cfg('rarity_weights')) x;
  lb := (fx_lab_cfg('level_bonus') #>> '{}')::numeric * (lvl - 1);
  for i in 2..5 loop w[i] := w[i] * (1 + lb * (i - 1)); end loop;
  for i in 1..5 loop tot := tot + w[i]; end loop;
  for i in 1..5 loop odds := odds || to_jsonb(round(w[i] / tot * 100, 1)); end loop;
  return jsonb_build_object(
    'level', lvl, 'levels', lv, 'unlocked', f.level >= 5, 'fish_level', f.level, 'gold', f.gold,
    'fusions', case when st.day = fx_today() then st.fusions else 0 end,
    'cap', (fx_lab_cfg('daily_fusions') ->> (lvl - 1))::int, 'fee', (fx_lab_cfg('fee') ->> (lvl - 1))::int, 'odds', odds,
    'tanks', (lv -> (lvl - 1) ->> 'tanks')::int,
    'aura', jsonb_build_object('tarkus', fx_lab_aura(u, 'tarkus'), 'kuld', fx_lab_aura(u, 'kuld'), 'onn', fx_lab_aura(u, 'onn'), 'kaitse', fx_lab_aura(u, 'kaitse')),
    'fish', (select coalesce(jsonb_agg(fx_lab_fish_json(h, lvl) order by h.rarity desc, h.created_at desc), '[]') from (select * from lab_fish where user_id = u and status in ('kept','tank','listed') order by created_at desc limit 300) h),
    'dex', (select jsonb_agg(jsonb_build_object('id', ls.id, 'body', ls.body, 'legend', ls.legend, 'sort', ls.sort,
              'name', case when d.user_id is not null then ls.name end, 'e1', case when d.user_id is not null then ls.e1 end, 'e2', case when d.user_id is not null then ls.e2 end,
              'descr', case when d.user_id is not null then ls.descr end,
              'hint', case when d.user_id is null and not ls.legend and fx_rs_skill(u, 'genoom') > 0 then jsonb_build_array(ls.e1, ls.e2) end,
              'mine', case when d.user_id is not null then jsonb_build_object('at', d.first_at, 'n', d.n, 'best', d.best, 'parents', to_jsonb(d.parents)) end,
              'first_name', case when p.hidden and ls.first_by <> u then 'Salapärane kalur' else p.name end, 'first_at', ls.first_at) order by ls.sort)
            from lab_species ls left join lab_dex d on d.species = ls.id and d.user_id = u left join profiles p on p.id = ls.first_by),
    'market', (select coalesce(jsonb_agg(x order by (x ->> 'mine')::boolean desc, (x ->> 'at') desc), '[]') from (
              select fx_lab_fish_json(h, 0) || jsonb_build_object('listing_id', m.id, 'price', m.price, 'seller', case when p.hidden then 'Salapärane kalur' else p.name end, 'mine', m.seller = u, 'listed_at', m.created_at) x
              from lab_market m join lab_fish h on h.id = m.fish_id left join profiles p on p.id = m.seller where m.status = 'open' order by m.created_at desc limit 60) z),
    'req', fx_lab_req(u) || jsonb_build_object('done', st.req_day = fx_today()));
end $$;

create or replace function public.lab_fuse(p_a_kind text, p_a bigint, p_b_kind text, p_b bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; st lab_state; lvl int; cap int; fee int; ca fish_catches; cb fish_catches; ha lab_fish; hb lab_fish; ga jsonb; gb jsonb;
  els text[] := array['tuli','jää','vesi','välk','vari','valgus','loodus']; ea text; eb text; tmp text; mut boolean := false; dom jsonb; oth jsonb;
  sp lab_species; w numeric[]; lb numeric; pb numeric; tot numeric := 0; roll numeric; acc numeric := 0; rar int := 1; i int;
  hid jsonb; abil text; pw int; genes jsonb; weight numeric; len numeric; val int; nid bigint; isnew boolean; first boolean := false; levels int[]; h lab_fish; v_arch text; v_body text; rs lab_research; tg lab_genes;
begin
  f := fx_fisher(u);
  perform pg_advisory_xact_lock(hashtext('lab:' || u::text));
  if f.level < 5 then raise exception 'Geneetikalabor avaneb kalapüügi 5. tasemel'; end if;
  insert into lab_state(user_id) values (u) on conflict do nothing;
  select * into st from lab_state where user_id = u for update;
  if st.day is distinct from fx_today() then st.fusions := 0; end if;
  lvl := st.level; cap := (fx_lab_cfg('daily_fusions') ->> (lvl - 1))::int; fee := (fx_lab_cfg('fee') ->> (lvl - 1))::int;
  if st.fusions >= cap then raise exception 'Tänased % ühendamist on tehtud. Uued tulevad kesköösel.', cap; end if;
  if f.gold < fee then raise exception 'Ühendamiseks on kalurikassas vaja % kulda', fee; end if;
  if p_a_kind = p_b_kind and p_a = p_b then raise exception 'Vali kaks erinevat kala'; end if;
  if p_a_kind not in ('c','h') or p_b_kind not in ('c','h') then raise exception 'Tundmatu kala'; end if;
  if (p_a_kind = 'h' or p_b_kind = 'h') and lvl < 2 then raise exception 'Hübriide saab omavahel ühendada alates labori 2. tasemest'; end if;
  -- vanemad lukustatakse: sama kala ei saa korraga kaks korda kasutada
  if p_a_kind = 'c' then
    select * into ca from fish_catches where id = p_a and user_id = u and status = 'kept' for update;
    if ca.id is null then raise exception 'Esimest kala pole enam sinu saagis'; end if; if ca.species = 'vahk' then raise exception 'Vähki ei saa kalaga ühendada'; end if; ga := fx_lab_genes_c(ca);
  else
    select * into ha from lab_fish where id = p_a and user_id = u and status = 'kept' for update;
    if ha.id is null then raise exception 'Esimest hübriidi pole enam sinu laboris'; end if; ga := fx_lab_genes_h(ha);
  end if;
  if p_b_kind = 'c' then
    select * into cb from fish_catches where id = p_b and user_id = u and status = 'kept' for update;
    if cb.id is null then raise exception 'Teist kala pole enam sinu saagis'; end if; if cb.species = 'vahk' then raise exception 'Vähki ei saa kalaga ühendada'; end if; gb := fx_lab_genes_c(cb);
  else
    select * into hb from lab_fish where id = p_b and user_id = u and status = 'kept' for update;
    if hb.id is null then raise exception 'Teist hübriidi pole enam sinu laboris'; end if; gb := fx_lab_genes_h(hb);
  end if;
  if p_a_kind = 'c' and p_b_kind = 'c' and ca.species = cb.species then raise exception 'Vali kaks eri liiki kala'; end if;

  -- elemendid ja mutatsioon
  ea := fx_lab_pick(ga); eb := fx_lab_pick(gb);
  rs := fx_rs(u);
  if random() < (fx_lab_cfg('mutation_chance') #>> '{}')::numeric + 0.01 * lvl + 0.01 * coalesce((rs.skills ->> 'mutatsioon')::int, 0) then
    mut := true;
    if random() < 0.5 then ea := els[1 + floor(random() * 7)::int]; else eb := els[1 + floor(random() * 7)::int]; end if;
  end if;
  if array_position(els, ea) > array_position(els, eb) then tmp := ea; ea := eb; eb := tmp; end if;
  -- keha pärineb ühelt vanemalt (tugevam vanem pärandab sagedamini)
  if random() < (ga ->> 'strength')::numeric / greatest(1, (ga ->> 'strength')::numeric + (gb ->> 'strength')::numeric) then dom := ga; oth := gb; else dom := gb; oth := ga; end if;
  v_body := dom ->> 'body'; v_arch := dom ->> 'arch';
  -- salajane legend (labori 4. tase, kindlad vanemad)
  if lvl >= 4 and p_a_kind = 'c' and p_b_kind = 'c' then
    select * into sp from lab_species where legend and recipe @> array[ca.species, cb.species] limit 1;
  end if;
  if sp.id is not null then
    ea := sp.e1; eb := sp.e2; v_body := sp.body;
    v_arch := case sp.id when 'l_draakoniahven' then 'perch' when 'l_kuldsuvahaug' then 'pike' when 'l_jaaleegimonarh' then 'carp' when 'l_tormilohe' then 'serpent'
      when 'l_kuukuningas' then 'carp' when 'l_soovihaldjas' then 'angel' when 'l_sugavusteisand' then 'serpent' else 'grayling' end;
  else
    select * into sp from lab_species where not legend and e1 = ea and e2 = eb and body = v_body;
  end if;
  if sp.id is null then raise exception 'Mutatsioon ebaõnnestus'; end if;

  -- uurimiskeskuse geen (avastatud geen, mis sobib hübriidi elemendiga, võib kanduda hübriidile)
  if random() < 0.4 + 0.15 * coalesce((rs.skills ->> 'parilikkus')::int, 0) then
    select * into tg from lab_genes g where g.id = any(rs.genes) and (g.el is null or g.el in (ea, eb)) order by random() limit 1;
  end if;
  -- haruldus (serveris, lab_config.rarity_weights)
  select array_agg(x::numeric) into w from jsonb_array_elements_text(fx_lab_cfg('rarity_weights')) x;
  lb := (fx_lab_cfg('level_bonus') #>> '{}')::numeric * (lvl - 1);
  pb := greatest(0, ((ga ->> 'rarity')::numeric + (gb ->> 'rarity')::numeric) / 2 - 2) * 0.05;
  if tg.eff = 'rare' then pb := pb + tg.val; elsif tg.eff = 'gold' then pb := pb + 0.2; end if;
  for i in 2..5 loop w[i] := w[i] * (1 + (lb + pb) * (i - 1)); end loop;
  for i in 1..5 loop tot := tot + w[i]; end loop;
  roll := random() * tot;
  for i in 1..5 loop acc := acc + w[i]; rar := i; exit when roll < acc; end loop;
  if sp.legend then rar := greatest(rar, 4); end if;

  -- geenid
  if random() < 0.4 then
    hid := (array['{"id":"retsessiivne"}','{"id":"kiirkasv"}','{"id":"kuldsoomus"}','{"id":"helendus"}','{"id":"vastupidav"}'])[1 + floor(random() * 5)::int]::jsonb;
    if hid ->> 'id' = 'retsessiivne' then hid := hid || jsonb_build_object('el', els[1 + floor(random() * 7)::int]); end if;
  end if;
  abil := case (case when random() < 0.5 then ea else eb end) when 'tuli' then 'tarkus' when 'välk' then 'tarkus' when 'valgus' then 'kuld' when 'vari' then 'kuld'
            when 'loodus' then 'onn' when 'vesi' then 'onn' else 'kaitse' end;
  pw := (array[1,2,3,5,8])[rar] + case when hid ->> 'id' = 'vastupidav' then 1 else 0 end;
  genes := jsonb_build_object('arch', v_arch, 'body', v_body, 'col', dom -> 'col', 'col2', oth -> 'col',
    'size', greatest(1, least(10, round(((ga ->> 'size')::numeric + (gb ->> 'size')::numeric) / 2 + random()::numeric * 2 - 0.5 + (rar - 1) * 0.5))),
    'speed', greatest(1, least(10, round(((ga ->> 'speed')::numeric + (gb ->> 'speed')::numeric) / 2 + random()::numeric * 2 - 0.5 + (rar - 1) * 0.4))),
    'strength', greatest(1, least(10, round(((ga ->> 'strength')::numeric + (gb ->> 'strength')::numeric) / 2 + random()::numeric * 2 - 0.5 + (rar - 1) * 0.5))),
    'ability', abil, 'power', pw, 'mutated', mut, 'seed', floor(random() * 1000000)::int);
  if hid is not null then genes := genes || jsonb_build_object('hidden', hid); end if;
  if tg.id is not null then
    genes := genes || jsonb_build_object('trait', tg.id);
    if tg.eff = 'power' then genes := jsonb_set(genes, '{power}', to_jsonb(pw + tg.val::int)); end if;
  end if;
  weight := greatest(0.01, round(((ga ->> 'weight')::numeric + (gb ->> 'weight')::numeric) / 2 * (0.85 + random()::numeric * 0.3) * (array[1, 1.12, 1.3, 1.55, 2])[rar]
              * case when hid ->> 'id' = 'kiirkasv' then 1.2 else 1 end * case when tg.eff = 'size' then 1 + tg.val when tg.id = 'eluvorse' then 1.1 else 1 end, 3));
  len := round((case v_body when 'ahven' then 37 when 'karp' then 38 when 'haug' then 52 else 85 end) * cbrt(weight)::numeric * case when sp.legend then 1.1 else 1 end, 1);
  val := round(((ga ->> 'value')::numeric + (gb ->> 'value')::numeric) * (array[0.75, 1.05, 1.5, 2.4, 4.5])[rar]
              * case when hid ->> 'id' = 'kuldsoomus' then 1.25 else 1 end * case when tg.eff in ('value','gold') then 1 + tg.val else 1 end + 20);

  insert into lab_fish(user_id, species, rarity, weight, length_cm, genes, parents, value, bred_by)
    values (u, sp.id, rar, weight, len, genes,
      jsonb_build_array(jsonb_build_object('kind', p_a_kind, 'name', ga ->> 'name', 'rarity', ga -> 'rarity'), jsonb_build_object('kind', p_b_kind, 'name', gb ->> 'name', 'rarity', gb -> 'rarity')),
      val, u) returning * into h;
  if p_a_kind = 'c' then update fish_catches set status = 'lab' where id = ca.id; else update lab_fish set status = 'parent' where id = ha.id; end if;
  if p_b_kind = 'c' then update fish_catches set status = 'lab' where id = cb.id; else update lab_fish set status = 'parent' where id = hb.id; end if;

  -- hübriidiraamat ja esmaavastaja
  insert into lab_dex(user_id, species, best, parents) values (u, sp.id, rar, array[ga ->> 'name', gb ->> 'name']) on conflict do nothing;
  isnew := found;
  if not isnew then update lab_dex set n = n + 1, best = greatest(best, rar) where user_id = u and species = sp.id; end if;
  update lab_species set first_by = u, first_at = now() where id = sp.id and first_by is null;
  first := found;
  if first then
    update lab_fish set first_find = true where id = h.id; h.first_find := true;
    perform fx_news(u, 'lab_first', jsonb_build_object('name', sp.name));
  end if;
  if rar = 5 then perform fx_news(u, 'lab_myyt', jsonb_build_object('name', sp.name)); end if;
  if sp.legend and isnew then perform fx_news(u, 'lab_legend', jsonb_build_object('name', sp.name)); end if;

  update fishers set gold = gold - fee where user_id = u;
  update lab_state set day = fx_today(), fusions = st.fusions + 1 where user_id = u;
  levels := fx_add_xp(u, 15 + 15 * rar);
  return lab_state() || jsonb_build_object('result', fx_lab_fish_json(h, lvl), 'new', isnew, 'first_find', first, 'lvlup', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

create or replace function public.lab_upgrade() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; st lab_state; nx jsonb;
begin
  f := fx_fisher(u);
  insert into lab_state(user_id) values (u) on conflict do nothing;
  select * into st from lab_state where user_id = u for update;
  if st.level >= 5 then raise exception 'Labor on juba kõrgeimal tasemel'; end if;
  nx := fx_lab_levels() -> st.level;
  if f.level < (nx ->> 'req')::int then raise exception 'Selleks on vaja kalapüügi % taset', nx ->> 'req'; end if;
  if f.gold < (nx ->> 'gold')::int then raise exception 'Selleks on kalurikassas vaja % kulda', nx ->> 'gold'; end if;
  if nx -> 'items' <> '{}' then perform fx_pay_items(u, nx -> 'items'); end if;
  update fishers set gold = gold - (nx ->> 'gold')::int where user_id = u;
  update lab_state set level = level + 1 where user_id = u;
  perform fx_news(u, 'lab_level', jsonb_build_object('level', st.level + 1, 'name', nx ->> 'name'));
  return lab_state() || jsonb_build_object('upgraded', st.level + 1);
end $$;

create or replace function public.lab_tank(p_id bigint, p_on boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st lab_state; n int;
begin
  perform pg_advisory_xact_lock(hashtext('lab:' || u::text));
  select * into st from lab_state where user_id = u;
  if p_on then
    select count(*) into n from lab_fish where user_id = u and status = 'tank';
    if n >= (fx_lab_levels() -> (coalesce(st.level, 1) - 1) ->> 'tanks')::int then raise exception 'Kõik labori akvaariumid on täis. Võta mõni kala enne välja või arenda laborit.'; end if;
    update lab_fish set status = 'tank' where id = p_id and user_id = u and status = 'kept';
  else
    update lab_fish set status = 'kept' where id = p_id and user_id = u and status = 'tank';
  end if;
  if not found then raise exception 'Seda kala ei saa praegu liigutada'; end if;
  return lab_state();
end $$;

create or replace function public.lab_sell(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); h lab_fish;
begin
  select * into h from lab_fish where id = p_id and user_id = u and status in ('kept','tank') for update;
  if h.id is null then raise exception 'Seda hübriidi ei saa müüa'; end if;
  update lab_fish set status = 'sold' where id = h.id;
  update fishers set gold = gold + h.value where user_id = u;
  return lab_state() || jsonb_build_object('sold', h.value);
end $$;

create or replace function public.lab_list(p_id bigint, p_price int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); h lab_fish;
begin
  if p_price is null or p_price < 1 or p_price > 10000000 then raise exception 'Hind peab olema 1 kuni 10 000 000 kulda'; end if;
  if (select count(*) from lab_market where seller = u and status = 'open') >= 10 then raise exception 'Turul võib korraga olla 10 sinu hübriidi'; end if;
  select * into h from lab_fish where id = p_id and user_id = u and status = 'kept' for update;
  if h.id is null then raise exception 'Seda hübriidi ei saa turule panna'; end if;
  update lab_fish set status = 'listed' where id = h.id;
  insert into lab_market(fish_id, seller, price) values (h.id, u, p_price);
  return lab_state();
end $$;

create or replace function public.lab_unlist(p_listing bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); m lab_market;
begin
  select * into m from lab_market where id = p_listing and seller = u and status = 'open' for update;
  if m.id is null then raise exception 'Seda pakkumist pole enam turul'; end if;
  update lab_market set status = 'cancelled', closed_at = now() where id = m.id;
  update lab_fish set status = 'kept' where id = m.fish_id and status = 'listed';
  return lab_state();
end $$;

create or replace function public.lab_buy(p_listing bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; m lab_market; h lab_fish;
begin
  f := fx_fisher(u);
  select * into m from lab_market where id = p_listing for update;
  if m.id is null or m.status <> 'open' then raise exception 'Keegi jõudis selle hübriidi juba ära osta'; end if;
  if m.seller = u then raise exception 'Oma hübriidi ei saa ise osta'; end if;
  select * into f from fishers where user_id = u for update;
  if f.gold < m.price then raise exception 'Ostmiseks on kalurikassas vaja % kulda', m.price; end if;
  select * into h from lab_fish where id = m.fish_id for update;
  update fishers set gold = gold - m.price where user_id = u;
  update fishers set gold = gold + round(m.price * 0.95) where user_id = m.seller;
  update lab_fish set user_id = u, status = 'kept' where id = h.id;
  update lab_market set status = 'sold', buyer = u, closed_at = now() where id = m.id;
  insert into lab_dex(user_id, species, best) values (u, h.species, h.rarity)
    on conflict (user_id, species) do update set n = lab_dex.n + 1, best = greatest(lab_dex.best, excluded.best);
  return lab_state() || jsonb_build_object('bought', fx_lab_fish_json(h, 0), 'ach', fx_check_ach(u));
end $$;

create or replace function public.lab_deliver(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st lab_state; r jsonb := fx_lab_req(fx_uid()); h lab_fish; ls lab_species; levels int[]; v_items jsonb;
begin
  perform fx_fisher(u);
  insert into lab_state(user_id) values (u) on conflict do nothing;
  select * into st from lab_state where user_id = u for update;
  if st.req_day = fx_today() then raise exception 'Tänane labori tellimus on juba täidetud. Uus tuleb kesköösel.'; end if;
  select * into h from lab_fish where id = p_id and user_id = u and status in ('kept','tank') for update;
  if h.id is null then raise exception 'Seda hübriidi ei saa ära anda'; end if;
  select * into ls from lab_species where id = h.species;
  if r ->> 'element' not in (ls.e1, ls.e2) then raise exception 'Tellija soovib kala, millel on element %', r ->> 'element'; end if;
  if h.rarity < (r ->> 'minr')::int then raise exception 'Tellija soovib haruldasemat kala'; end if;
  update lab_fish set status = 'delivered' where id = h.id;
  update lab_state set req_day = fx_today() where user_id = u;
  update fishers set gold = gold + (r ->> 'gold')::int where user_id = u;
  v_items := fx_give_random(u, 2 + (r ->> 'minr')::int, 1);
  levels := fx_add_xp(u, (r ->> 'xp')::int);
  return lab_state() || jsonb_build_object('delivered', jsonb_build_object('gold', r -> 'gold', 'xp', r -> 'xp', 'items', v_items), 'lvlup', to_jsonb(levels));
end $$;

-- ---------------------------------------------------------------------
-- 6m. Kalade uurimiskeskus (jaotis 2n)
-- ---------------------------------------------------------------------
create or replace function public.fx_rs_skills() returns jsonb language sql immutable as $$ select '[
 {"id":"kiirus","name":"Kiire analüüs","ic":"⏱️","descr":"Analüüs käib 15% kiiremini (iga tase).","cost":[40,90,160]},
 {"id":"saak","name":"Puhtam proov","ic":"🧪","descr":"Igast proovist +1 DNA rohkem (iga tase).","cost":[50,110,200]},
 {"id":"mikroskoop","name":"Teine mikroskoop","ic":"🔬","descr":"Üks analüüs korraga rohkem (iga tase).","cost":[150,400]},
 {"id":"parilikkus","name":"Pärilikkus","ic":"🧬","descr":"Avastatud geenid kanduvad hübriidile 15% sagedamini (iga tase).","cost":[100,240]},
 {"id":"mutatsioon","name":"Mutageen","ic":"⚗️","descr":"Elemendi mutatsiooni võimalus +1% (iga tase).","cost":[60,130,220]},
 {"id":"genoom","name":"Täielik genoom","ic":"📜","descr":"Hübriidiraamatus näed avastamata liikide elemente.","cost":[250]}
]'::jsonb $$;
create or replace function public.fx_rs(u uuid) returns public.lab_research language plpgsql as $$
declare r public.lab_research;
begin
  insert into public.lab_research(user_id) values (u) on conflict do nothing;
  select * into r from public.lab_research where user_id = u;
  return r;
end $$;
create or replace function public.fx_rs_skill(u uuid, k text) returns int language sql stable as $$
  select coalesce((select (skills ->> k)::int from public.lab_research where user_id = u), 0) $$;
-- analüüsi kestus minutites
create or replace function public.fx_rs_minutes(u uuid, kind text, rar int) returns int language sql stable as $$
  select greatest(5, round((case when kind = 'h' then (array[60,90,120,180,240])[least(rar,5)] else (array[20,40,60,90,120,180])[least(rar,6)] end)
    * (1 - 0.15 * public.fx_rs_skill(u, 'kiirus'))))::int $$;

create or replace function public.research_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; r lab_research;
begin
  f := fx_fisher(u); r := fx_rs(u);
  return jsonb_build_object('rp', r.rp, 'rp_total', r.rp_total, 'dna', r.dna, 'skills', r.skills, 'scans_done', r.scans_done, 'gold', f.gold,
    'unlocked', f.level >= 5, 'slots', 1 + coalesce((r.skills ->> 'mikroskoop')::int, 0), 'now', now(),
    'skill_list', fx_rs_skills(),
    'genes', (select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'ic', g.ic, 'el', g.el, 'descr', g.descr, 'dna', g.dna, 'rp', g.rp, 'own', g.id = any(r.genes)) order by g.sort) from lab_genes g),
    'recipes', (select jsonb_agg(jsonb_build_object('id', ls.id, 'e1', ls.e1, 'e2', ls.e2, 'body', ls.body, 'sort', ls.sort,
              'n', coalesce((r.frags ->> ls.id)::int, 0),
              'hints', to_jsonb(ls.hints[1:least(2, coalesce((r.frags ->> ls.id)::int, 0))]),
              'recipe', case when coalesce((r.frags ->> ls.id)::int, 0) >= 3 or d.user_id is not null then to_jsonb(ls.recipe) end,
              'name', case when coalesce((r.frags ->> ls.id)::int, 0) >= 3 or d.user_id is not null then ls.name end,
              'found', d.user_id is not null) order by ls.sort)
            from lab_species ls left join lab_dex d on d.user_id = u and d.species = ls.id where ls.legend),
    'scans', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'kind', s.kind, 'species', s.species, 'name', s.name, 'rarity', s.rarity, 'elements', to_jsonb(s.elements),
              'started_at', s.started_at, 'ready_at', s.ready_at, 'ready', s.ready_at <= now(),
              'rush', greatest(20, ceil(extract(epoch from (s.ready_at - now())) / 60.0 * 8))::int) order by s.ready_at), '[]') from lab_scan s where s.user_id = u and not s.claimed));
end $$;

create or replace function public.research_start(p_kind text, p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; r lab_research; c fish_catches; h lab_fish; s fish_species; ls lab_species; n int; mins int;
begin
  f := fx_fisher(u);
  if f.level < 5 then raise exception 'Uurimiskeskus avaneb kalapüügi 5. tasemel'; end if;
  perform pg_advisory_xact_lock(hashtext('lab:' || u::text));
  r := fx_rs(u);
  select count(*) into n from lab_scan where user_id = u and not claimed;
  if n >= 1 + coalesce((r.skills ->> 'mikroskoop')::int, 0) then raise exception 'Kõik mikroskoobid on hõivatud. Võta enne valmis analüüs välja.'; end if;
  if p_kind = 'c' then
    select * into c from fish_catches where id = p_id and user_id = u and status = 'kept' for update;
    if c.id is null then raise exception 'Seda kala pole enam sinu saagis'; end if;
    select * into s from fish_species where id = c.species;
    mins := fx_rs_minutes(u, 'c', c.rarity);
    insert into lab_scan(user_id, kind, src_id, species, name, rarity, elements, ready_at)
      values (u, 'c', c.id, s.id, s.name, c.rarity, array[s.element], now() + make_interval(mins => mins));
    update fish_catches set status = 'dna' where id = c.id;
  elsif p_kind = 'h' then
    select * into h from lab_fish where id = p_id and user_id = u and status = 'kept' for update;
    if h.id is null then raise exception 'Seda hübriidi pole enam sinu laboris'; end if;
    select * into ls from lab_species where id = h.species;
    mins := fx_rs_minutes(u, 'h', h.rarity);
    insert into lab_scan(user_id, kind, src_id, species, name, rarity, elements, ready_at)
      values (u, 'h', h.id, ls.id, ls.name, h.rarity, array[ls.e1, ls.e2], now() + make_interval(mins => mins));
    update lab_fish set status = 'dna' where id = h.id;
  else raise exception 'Tundmatu proov'; end if;
  return research_state();
end $$;

create or replace function public.research_rush(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; s lab_scan; cost int;
begin
  f := fx_fisher(u);
  select * into s from lab_scan where id = p_id and user_id = u and not claimed for update;
  if s.id is null then raise exception 'Analüüsi ei leitud'; end if;
  if s.ready_at <= now() then return research_state(); end if;
  cost := greatest(20, ceil(extract(epoch from (s.ready_at - now())) / 60.0 * 8))::int;
  if f.gold < cost then raise exception 'Kiirendamiseks on vaja % kulda', cost; end if;
  update fishers set gold = gold - cost where user_id = u;
  update lab_scan set ready_at = now() where id = s.id;
  return research_state();
end $$;

create or replace function public.research_claim(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; r lab_research; s lab_scan; e text; amt int; v_rp int; v_dna jsonb; got jsonb := '{}'; leg text; n int; fr jsonb := null; ch numeric; levels int[];
begin
  f := fx_fisher(u);
  perform pg_advisory_xact_lock(hashtext('lab:' || u::text));
  r := fx_rs(u);
  select * into s from lab_scan where id = p_id and user_id = u and not claimed for update;
  if s.id is null then raise exception 'Analüüsi ei leitud või see on juba välja võetud'; end if;
  if s.ready_at > now() then raise exception 'Analüüs pole veel valmis'; end if;
  -- DNA ja uurimispunktid
  amt := case when s.kind = 'h' then 2 * s.rarity + 1 else (array[1,2,3,5,8,12])[least(s.rarity,6)] end + coalesce((r.skills ->> 'saak')::int, 0);
  v_rp := case when s.kind = 'h' then 8 else 5 end * s.rarity + floor(random() * 4)::int;
  v_dna := r.dna;
  foreach e in array (select array_agg(distinct x) from unnest(s.elements) x) loop
    v_dna := jsonb_set(v_dna, array[e], to_jsonb(coalesce((v_dna ->> e)::int, 0) + amt));
    got := got || jsonb_build_object(e, amt);
  end loop;
  -- retseptitükk: kala, mis on mõne legendi vanem, annab tüki sageli; teised harva
  if s.kind = 'c' then
    select ls.id into leg from lab_species ls where ls.legend and s.species = any(ls.recipe) and coalesce((r.frags ->> ls.id)::int, 0) < 3
      and not exists (select 1 from lab_dex d where d.user_id = u and d.species = ls.id) order by random() limit 1;
    ch := case when leg is not null then 0.5 else 0 end;
  end if;
  if leg is null then
    select ls.id into leg from lab_species ls where ls.legend and coalesce((r.frags ->> ls.id)::int, 0) < 3
      and not exists (select 1 from lab_dex d where d.user_id = u and d.species = ls.id) order by random() limit 1;
    ch := case when s.kind = 'h' then 0.06 * s.rarity else 0.025 * s.rarity end;
  end if;
  if leg is not null and random() < ch then
    n := coalesce((r.frags ->> leg)::int, 0) + 1;
    update lab_research set frags = jsonb_set(frags, array[leg], to_jsonb(n)) where user_id = u;
    select jsonb_build_object('id', l.id, 'n', n, 'hint', case when n <= 2 then l.hints[n] end, 'recipe', case when n >= 3 then to_jsonb(l.recipe) end,
      'name', case when n >= 3 then l.name end) into fr from lab_species l where l.id = leg;
  end if;
  update lab_research set dna = v_dna, rp = rp + v_rp, rp_total = rp_total + v_rp, scans_done = scans_done + 1 where user_id = u;
  update lab_scan set claimed = true, result = jsonb_build_object('dna', got, 'rp', v_rp, 'frag', fr) where id = s.id;
  levels := fx_add_xp(u, 10 + 10 * s.rarity);
  return research_state() || jsonb_build_object('claimed', jsonb_build_object('name', s.name, 'species', s.species, 'kind', s.kind, 'rarity', s.rarity, 'dna', got, 'rp', v_rp, 'frag', fr),
    'lvlup', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

create or replace function public.research_gene(p_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); r lab_research; g lab_genes; e text; v_dna jsonb;
begin
  perform fx_fisher(u);
  perform pg_advisory_xact_lock(hashtext('lab:' || u::text));
  r := fx_rs(u);
  select * into g from lab_genes where id = p_id;
  if g.id is null then raise exception 'Tundmatu geen'; end if;
  if g.id = any(r.genes) then raise exception 'See geen on juba avastatud'; end if;
  if r.rp < g.rp then raise exception 'Vaja on % uurimispunkti', g.rp; end if;
  v_dna := r.dna;
  if g.el is null then
    if cardinality(r.genes) < 7 then raise exception 'Kuldse genoomi jaoks avasta enne kõik 7 elemendi geeni'; end if;
    foreach e in array array['tuli','jää','vesi','välk','vari','valgus','loodus'] loop
      if coalesce((v_dna ->> e)::int, 0) < g.dna then raise exception 'Vaja on % DNA-d igast elemendist', g.dna; end if;
      v_dna := jsonb_set(v_dna, array[e], to_jsonb((v_dna ->> e)::int - g.dna));
    end loop;
  else
    if coalesce((v_dna ->> g.el)::int, 0) < g.dna then raise exception 'Vaja on % DNA-d (%)', g.dna, g.el; end if;
    v_dna := jsonb_set(v_dna, array[g.el], to_jsonb((v_dna ->> g.el)::int - g.dna));
  end if;
  update lab_research set dna = v_dna, rp = rp - g.rp, genes = array_append(genes, g.id) where user_id = u;
  return research_state() || jsonb_build_object('gene', g.id, 'ach', fx_check_ach(u));
end $$;

create or replace function public.research_skill(p_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); r lab_research; sk jsonb; lv int; cost int;
begin
  perform fx_fisher(u);
  perform pg_advisory_xact_lock(hashtext('lab:' || u::text));
  r := fx_rs(u);
  select x into sk from jsonb_array_elements(fx_rs_skills()) x where x ->> 'id' = p_id;
  if sk is null then raise exception 'Tundmatu uurimissuund'; end if;
  lv := coalesce((r.skills ->> p_id)::int, 0);
  if lv >= jsonb_array_length(sk -> 'cost') then raise exception 'See on juba kõrgeimal tasemel'; end if;
  cost := (sk -> 'cost' ->> lv)::int;
  if r.rp < cost then raise exception 'Vaja on % uurimispunkti', cost; end if;
  update lab_research set rp = rp - cost, skills = jsonb_set(skills, array[p_id], to_jsonb(lv + 1)) where user_id = u;
  return research_state() || jsonb_build_object('skill', p_id);
end $$;

-- ---------------------------------------------------------------------
-- 6n. Kalamehe varustus ja püünised (jaotis 2o)
-- ---------------------------------------------------------------------
-- parim omatud ese iga liigi kohta
create or replace function public.fx_kit(u uuid) returns jsonb language sql stable as $$
  select coalesce(jsonb_object_agg(x.kind, jsonb_build_object('id', x.id, 'tier', x.tier, 'val', x.val, 'val2', x.val2)), '{}')
  from (select distinct on (g.kind) g.* from public.fisher_gear fg join public.fish_gear g on g.id = fg.gear where fg.user_id = u order by g.kind, g.tier desc) x $$;
create or replace function public.fx_kit_v(u uuid, k text, two boolean default false) returns numeric language sql stable as $$
  select coalesce((select case when two then g.val2 else g.val end from public.fisher_gear fg join public.fish_gear g on g.id = fg.gear
    where fg.user_id = u and g.kind = k order by g.tier desc limit 1), 0) $$;
-- kuhu iga püünist panna saab
create or replace function public.fx_trap_spots(k text) returns text[] language sql immutable as $$
  select case k when 'vork' then array['metsajarv','jogi','kuninglik','meri','jaa'] when 'mord' then array['metsajarv','jogi','kuninglik','meri']
    else array['metsajarv','jogi','kuninglik'] end $$;

create or replace function public.gear_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers;
begin
  f := fx_fisher(u);
  return jsonb_build_object('gold', f.gold, 'level', f.level, 'now', now(), 'license_until', (select until from fisher_licenses where user_id = u and kind = 'vork'), 'license_price', 400,
    'lic', fx_lic_map(u),
    'kit', fx_kit(u),
    'gear', (select jsonb_agg(jsonb_build_object('id', g.id, 'kind', g.kind, 'tier', g.tier, 'name', g.name, 'descr', g.descr, 'price', g.price,
               'min_level', g.min_level, 'val', g.val, 'val2', g.val2, 'own', fg.user_id is not null) order by g.sort)
             from fish_gear g left join fisher_gear fg on fg.gear = g.id and fg.user_id = u),
    'spots', jsonb_build_object('vork', fx_trap_spots('vork'), 'mord', fx_trap_spots('mord'), 'katiska', fx_trap_spots('katiska'), 'loks', fx_trap_spots('loks')),
    'traps', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'kind', t.kind, 'gear', t.gear, 'spot', t.spot, 'set_at', t.set_at, 'ready_at', t.ready_at,
               'ready', t.ready_at <= now()) order by t.set_at), '[]') from fish_traps t where t.user_id = u and t.status = 'set'),
    'vahk', (select count(*) from fish_catches where user_id = u and species = 'vahk'));
end $$;

create or replace function public.gear_buy(p_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; g fish_gear;
begin
  f := fx_fisher(u);
  select * into g from fish_gear where id = p_id;
  if g.id is null then raise exception 'Tundmatu ese'; end if;
  if exists (select 1 from fisher_gear where user_id = u and gear = g.id) then raise exception 'See on sul juba olemas'; end if;
  if f.level < g.min_level then raise exception 'See avaneb kalapüügi % tasemel', g.min_level; end if;
  if f.gold < g.price then raise exception 'Kulda jääb puudu'; end if;
  update fishers set gold = gold - g.price where user_id = u;
  insert into fisher_gear(user_id, gear) values (u, g.id);
  return gear_state() || jsonb_build_object('bought', g.id, 'ach', fx_check_ach(u));
end $$;

create or replace function public.license_buy() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers;
begin
  f := fx_fisher(u);
  perform license_buy2('vork');
  return gear_state() || jsonb_build_object('license', true);
end $$;

create or replace function public.trap_set(p_kind text, p_spot text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; sp fish_spots; g fish_gear;
begin
  f := fx_fisher(u);
  select g2.* into g from fisher_gear fg join fish_gear g2 on g2.id = fg.gear where fg.user_id = u and g2.kind = p_kind order by g2.tier desc limit 1;
  if g.id is null or p_kind not in ('vork','mord','katiska','loks') then raise exception 'Sul pole seda püünist. Osta see poest.'; end if;
  select * into sp from fish_spots where id = p_spot;
  if sp.id is null or not (p_spot = any(fx_trap_spots(p_kind))) then raise exception 'Seda püünist ei saa siia panna'; end if;
  if f.level < sp.min_level then raise exception 'See püügikoht avaneb % tasemel', sp.min_level; end if;
  if p_kind = 'vork' and not fx_lic_ok(u, 'vork') then raise exception 'Nakkevõrgu kasutamiseks on vaja kehtivat Nakkevõrgu kaarti. Osta see Kalastuskaartide alt.'; end if;
  if p_kind <> 'vork' and not fx_lic_ok(u, 'pyynis') then raise exception 'Püüniste kasutamiseks on vaja kehtivat Püüniste kaarti. Osta see Kalastuskaartide alt.'; end if;
  perform pg_advisory_xact_lock(hashtext('trap:' || u::text));
  if exists (select 1 from fish_traps where user_id = u and kind = p_kind and status = 'set') then raise exception 'See püünis on juba vees'; end if;
  insert into fish_traps(user_id, kind, gear, spot, ready_at) values (u, p_kind, g.id, p_spot, now() + make_interval(mins => round(g.val * 60 * (1 - 0.25 * fx_room_mul(u, 'aidake')))::int));
  return gear_state() || jsonb_build_object('set', p_kind);
end $$;

create or replace function public.trap_lift(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u);
  update fish_traps set status = 'lifted' where id = p_id and user_id = u and status = 'set' and ready_at > now();
  if not found then raise exception 'Püünist ei leitud või see on juba valmis – tühjenda see'; end if;
  return gear_state();
end $$;

create or replace function public.trap_collect(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; t fish_traps; g fish_gear; n int; i int; s fish_species; wt numeric; pw numeric; got jsonb := '[]'; xp int; levels int[];
  lst text[]; wthr text := fx_weather(); winter boolean := fx_is_winter(); cid bigint; items jsonb := '[]';
begin
  f := fx_fisher(u);
  select * into t from fish_traps where id = p_id and user_id = u and status = 'set' for update;
  if t.id is null then raise exception 'Püünist ei leitud või see on juba tühjendatud'; end if;
  if t.ready_at > now() then raise exception 'Püünis pole veel valmis'; end if;
  select * into g from fish_gear where id = t.gear;
  n := ceil(g.val2 / 2.0)::int + floor(random() * (g.val2 - ceil(g.val2 / 2.0) + 1))::int;
  lst := case t.kind
    when 'mord' then array['haug','latikas','linask','koger','hobekoger','ahven','sarg','roosarg','angerjas','luts','karpkala','sainas','vingerjas','nurg','raim','lest','vimb','siig','tursk']
    when 'katiska' then array['ahven','sarg','kiisk','roosarg','viidikas','nurg','ogalik','mudamaim','lepamaim','hink','trulling','voldas','teib','luukarits']
    else null end;
  pw := case t.kind when 'mord' then 1.6 when 'katiska' then 2.8 else 2.0 end;
  for i in 1..n loop
    s := null;
    -- meisterpüünis: vahel haruldane kala (sellest kohast, päris liik)
    if g.tier >= 3 and random() < 0.15 then
      select fs.* into s from fish_species fs where t.spot = any(fs.spots) and fs.min_level <= f.level and fs.weather is null and fs.event is null and fs.real
        and fs.rarity between 3 and 4 and (not fs.winter_only or winter or t.spot = 'jaa') order by -ln(greatest(random(), 1e-9)) * fs.rarity limit 1;
    end if;
    if s.id is not null then null;
    elsif t.kind = 'loks' and random() < 0.85 then
      select * into s from fish_species where id = 'vahk';
    else
      select fs.* into s from fish_species fs where t.spot = any(fs.spots) and fs.min_level <= f.level and fs.weather is null and fs.event is null
        and (not fs.winter_only or winter or t.spot = 'jaa') and fs.real
        and case when t.kind = 'vork' then fs.rarity <= 3 and fs.max_w >= 0.2
                 when t.kind = 'loks' then fs.id = any(array['ahven','sarg','kiisk','roosarg','viidikas','nurg','ogalik','mudamaim','lepamaim','hink','trulling','voldas','teib','luukarits'])
                 else fs.id = any(lst) or (g.tier >= 2 and fs.rarity <= 2 and (t.kind <> 'katiska' or fs.max_w <= 2)) end
        order by -ln(greatest(random(), 1e-9)) * fs.rarity limit 1;
    end if;
    continue when s.id is null;
    wt := s.min_w + (case when t.kind in ('katiska','loks') and s.id <> 'vahk' and s.rarity <= 2 then least(s.max_w, 0.4) else s.max_w end - s.min_w) * power(random(), pw);
    wt := round(greatest(wt, s.min_w), case when wt < 1 then 3 else 2 end);
    insert into fish_catches(user_id, species, rarity, weight, spot, night, weather, trap) values (u, s.id, s.rarity, wt, t.spot, false, wthr, t.kind) returning id into cid;
    got := got || jsonb_build_array(jsonb_build_object('id', cid, 'species', s.id, 'name', s.name, 'rarity', s.rarity, 'weight', wt));
  end loop;
  -- meisterpüünis: eriline leid (haruldane ese) 25% juhtudest
  if g.tier >= 3 and random() < 0.25 then items := fx_give_random(u, 4, 1); end if;
  xp := (6 + 4 * jsonb_array_length(got)) * fx_xp_mult();
  levels := fx_add_xp(u, xp);
  update fish_traps set status = 'done', result = jsonb_build_object('fish', got, 'xp', xp, 'items', items) where id = t.id;
  return gear_state() || jsonb_build_object('collected', jsonb_build_object('kind', t.kind, 'gear', t.gear, 'spot', t.spot, 'fish', got, 'xp', xp, 'items', items, 'tier', g.tier),
    'lvlup', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

-- ---------------------------------------------------------------------
-- 6o. Kaluri riietus (jaotis 2p)
-- ---------------------------------------------------------------------
-- praegused tingimused: ilm + külm (öö, talv või jäätunud järv)
create or replace function public.fx_conds(p_spot text) returns text[] language sql stable as $$
  select array[fx_weather()] || case when fx_is_night() or fx_is_winter() or p_spot = 'jaa' then array['kylm'] else '{}'::text[] end $$;
-- mida iga tingimus nõuab: koht → sobivad sildid (sobib, kui riideesemel on vähemalt üks neist)
create or replace function public.fx_outfit_req(conds text[]) returns jsonb language plpgsql immutable as $$
declare r jsonb := '{}'; c text; add jsonb;
begin
  foreach c in array conds loop
    add := case c
      when 'paike' then '{"pea":["sun"],"silmad":["sun"]}'
      when 'vihm' then '{"pea":["rain"],"keha":["rain"],"jalad":["rain"]}'
      when 'udu' then '{"keha":["rain"],"jalad":["rain"]}'
      when 'torm' then '{"keha":["wind"],"pyksid":["wind"],"jalad":["rain"],"kaed":["grip"]}'
      when 'kylm' then '{"pea":["cold"],"kaed":["cold"],"pyksid":["cold"]}'
      else '{}' end;
    select coalesce(jsonb_object_agg(k, (select jsonb_agg(distinct x) from jsonb_array_elements_text(coalesce(r -> k, '[]') || coalesce(add -> k, '[]')) x)), '{}')
      into r from (select jsonb_object_keys(r) k union select jsonb_object_keys(add)) ks;
  end loop;
  return r;
end $$;
-- kui hästi kalur on ilma järgi riides
create or replace function public.fx_fit(u uuid, p_spot text) returns jsonb language plpgsql stable as $$
declare f fishers; conds text[] := fx_conds(p_spot); req jsonb; k text; tags text[]; ok jsonb := '{}'; n int := 0; m int := 0; worn text[] := '{}'; it text;
begin
  select * into f from fishers where user_id = u;
  req := fx_outfit_req(conds);
  for k in select jsonb_object_keys(req) loop
    it := f.outfit ->> k;
    select c.tags into tags from fish_clothes c where c.id = it and exists (select 1 from fisher_clothes fc where fc.user_id = u and fc.item = c.id);
    n := n + 1;
    if tags && array(select jsonb_array_elements_text(req -> k)) then m := m + 1; ok := ok || jsonb_build_object(k, true); else ok := ok || jsonb_build_object(k, false); end if;
  end loop;
  select coalesce(array_agg(t), '{}') into worn from fish_clothes c, unnest(c.tags) t
    where c.id in (select value from jsonb_each_text(f.outfit)) and exists (select 1 from fisher_clothes fc where fc.user_id = u and fc.item = c.id);
  return jsonb_build_object('conds', to_jsonb(conds), 'req', req, 'ok', ok, 'need', n, 'met', m,
    'pct', case when n = 0 then 1 else round(m::numeric / n, 2) end,
    'tier', case when n = 0 then 'ok' when m = n then 'hea' when m::numeric / n < 0.5 then 'halb' else 'ok' end,
    'worn', to_jsonb(worn));
end $$;

create or replace function public.wear_state(p_spot text default 'metsajarv') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers;
begin
  f := fx_fisher(u);
  if f.auto_dress then perform fx_dress_auto(u, coalesce(p_spot, 'metsajarv')); select * into f from fishers where user_id = u; end if;
  return jsonb_build_object('gold', f.gold, 'level', f.level, 'outfit', f.outfit, 'auto_dress', f.auto_dress, 'weather', fx_weather(), 'fit', fx_fit(u, coalesce(p_spot, 'metsajarv')),
    'items', (select jsonb_agg(jsonb_build_object('id', c.id, 'slot', c.slot, 'name', c.name, 'tags', to_jsonb(c.tags), 'descr', c.descr, 'price', c.price,
               'min_level', c.min_level, 'colors', to_jsonb(c.colors), 'own', fc.user_id is not null, 'color', coalesce(fc.color, c.colors[1])) order by c.sort)
             from fish_clothes c left join fisher_clothes fc on fc.item = c.id and fc.user_id = u),
    'dressed', (select count(*) from fish_catches where user_id = u and dressed));
end $$;

create or replace function public.clothes_buy(p_id text, p_spot text default 'metsajarv') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; c fish_clothes;
begin
  f := fx_fisher(u);
  select * into c from fish_clothes where id = p_id;
  if c.id is null then raise exception 'Tundmatu riideese'; end if;
  if exists (select 1 from fisher_clothes where user_id = u and item = c.id) then raise exception 'See on sul juba olemas'; end if;
  if f.level < c.min_level then raise exception 'See avaneb kalapüügi % tasemel', c.min_level; end if;
  if f.gold < c.price then raise exception 'Kulda jääb puudu'; end if;
  update fishers set gold = gold - c.price, outfit = outfit || jsonb_build_object(c.slot, c.id) where user_id = u;
  insert into fisher_clothes(user_id, item, color) values (u, c.id, c.colors[1]);
  return wear_state(p_spot) || jsonb_build_object('bought', c.id, 'ach', fx_check_ach(u));
end $$;

create or replace function public.clothes_wear(p_slot text, p_id text, p_spot text default 'metsajarv') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u);
  if p_id is null then update fishers set outfit = outfit - p_slot where user_id = u;
  else
    if not exists (select 1 from fisher_clothes fc join fish_clothes c on c.id = fc.item where fc.user_id = u and c.id = p_id and c.slot = p_slot) then raise exception 'Sul pole seda riideeset'; end if;
    update fishers set outfit = outfit || jsonb_build_object(p_slot, p_id) where user_id = u;
  end if;
  return wear_state(p_spot);
end $$;

-- riietu ilma järgi: iga nõutud koha jaoks parim omatud ese (kõige rohkem sobivaid silte); muud kohad jäävad, tühjad täidetakse
create or replace function public.fx_dress_auto(u uuid, p_spot text) returns void language plpgsql as $$
declare req jsonb; k text; best text; o jsonb;
begin
  req := fx_outfit_req(fx_conds(p_spot));
  select outfit into o from fishers where user_id = u;
  for k in select distinct c.slot from fisher_clothes fc join fish_clothes c on c.id = fc.item where fc.user_id = u loop
    select c.id into best from fisher_clothes fc join fish_clothes c on c.id = fc.item where fc.user_id = u and c.slot = k
      order by (select count(*) from unnest(c.tags) t where t = any(array(select jsonb_array_elements_text(coalesce(req -> k, '[]'))))) desc,
        (c.tags && array['wade','grip','polar','pockets']) desc, c.price desc limit 1;
    if req ? k or not (o ? k) then o := o || jsonb_build_object(k, best); end if;
  end loop;
  update fishers set outfit = o where user_id = u and outfit is distinct from o;
end $$;
create or replace function public.clothes_auto(p_spot text default 'metsajarv') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u); perform fx_dress_auto(u, p_spot);
  return wear_state(p_spot) || jsonb_build_object('auto', true);
end $$;
create or replace function public.clothes_autoset(p_on boolean, p_spot text default 'metsajarv') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u);
  update fishers set auto_dress = p_on where user_id = u;
  if p_on then perform fx_dress_auto(u, p_spot); end if;
  return wear_state(p_spot);
end $$;

create or replace function public.clothes_color(p_id text, p_color text, p_spot text default 'metsajarv') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u);
  update fisher_clothes fc set color = p_color from fish_clothes c where c.id = fc.item and fc.user_id = u and fc.item = p_id and p_color = any(c.colors);
  if not found then raise exception 'Seda värvi pole'; end if;
  return wear_state(p_spot);
end $$;

-- ---------------------------------------------------------------------
-- 6p. Erisündmused, kalastusretk, kahevõitlused (jaotis 2q)
-- ---------------------------------------------------------------------
-- sündmus antud hetkel: (kind, starts, ends) või null
create or replace function public.fx_event_at(ts timestamptz, out kind text, out starts timestamptz, out ends timestamptz) language plpgsql stable as $$
declare loc timestamp := ts at time zone 'Europe/Tallinn'; mon timestamp := date_trunc('week', loc);
begin
  select o.kind, o.starts, o.ends into kind, starts, ends from public.fish_event_override o where ts >= o.starts and ts < o.ends order by o.starts desc limit 1;
  if kind is not null then return; end if;
  if extract(isodow from loc) >= 5 then
    kind := case when extract(week from loc)::int % 2 = 0 then 'hai' else 'saga' end;
    starts := (mon + interval '4 days') at time zone 'Europe/Tallinn'; ends := (mon + interval '7 days') at time zone 'Europe/Tallinn';
  end if;
end $$;
create or replace function public.fx_event() returns text language sql stable as $$ select (public.fx_event_at(now())).kind $$;
-- järgmine sündmus (kui praegu pole)
create or replace function public.fx_event_next(out kind text, out starts timestamptz, out ends timestamptz) language plpgsql stable as $$
declare loc timestamp := now() at time zone 'Europe/Tallinn'; fri timestamp := date_trunc('week', loc) + interval '4 days';
begin
  select o.kind, o.starts, o.ends into kind, starts, ends from public.fish_event_override o where o.starts > now() order by o.starts limit 1;
  if fri <= loc then fri := fri + interval '7 days'; end if;
  if kind is null or starts > fri at time zone 'Europe/Tallinn' then
    kind := case when extract(week from fri)::int % 2 = 0 then 'hai' else 'saga' end;
    starts := fri at time zone 'Europe/Tallinn'; ends := (fri + interval '3 days') at time zone 'Europe/Tallinn';
  end if;
end $$;
create or replace function public.fx_event_species(k text) returns text[] language sql immutable as $$
  select case k when 'hai' then array['ogahai','heeringahai'] else array['saga'] end $$;
-- edetabel: iga mängija suurim sündmuse kala
create or replace function public.fx_event_rank(k text, s timestamptz, e timestamptz)
returns table(user_id uuid, place int, species text, weight numeric) language sql stable as $$
  select x.user_id, (row_number() over (order by x.weight desc, x.caught_at))::int, x.species, x.weight from (
    select distinct on (c.user_id) c.user_id, c.species, c.weight, c.caught_at from public.fish_catches c
    where c.species = any(public.fx_event_species(k)) and c.caught_at >= s and c.caught_at < e and not c.bought and c.trap is null
    order by c.user_id, c.weight desc, c.caught_at) x $$;
-- sündmuse eriülesanded: (pealkiri, eesmärk, edenemine)
create or replace function public.fx_event_quests(u uuid, k text, s timestamptz, e timestamptz) returns jsonb language plpgsql stable as $$
declare base text := 'not bought and trap is null and caught_at >= $2 and caught_at < $3 and user_id = $1'; r jsonb := '[]'; v numeric;
begin
  if k = 'hai' then
    execute 'select count(*) from fish_catches where species in (''ogahai'',''heeringahai'') and ' || base into v using u, s, e;
    r := r || jsonb_build_object('q', 1, 'text', 'Püüa üks hai', 'target', 1, 'progress', v, 'gold', 500, 'xp', 200);
    execute 'select coalesce(max(weight),0) from fish_catches where species = ''ogahai'' and ' || base into v using u, s, e;
    r := r || jsonb_build_object('q', 2, 'text', 'Püüa ogahai, mis kaalub üle 5 kg', 'target', 5, 'progress', v, 'gold', 900, 'xp', 350, 'kg', true);
    execute 'select count(*) from fish_catches where species = ''heeringahai'' and ' || base into v using u, s, e;
    r := r || jsonb_build_object('q', 3, 'text', 'Püüa heeringahai', 'target', 1, 'progress', v, 'gold', 2500, 'xp', 900);
  else
    execute 'select count(*) from fish_catches where species = ''saga'' and ' || base into v using u, s, e;
    r := r || jsonb_build_object('q', 1, 'text', 'Püüa 2 säga', 'target', 2, 'progress', v, 'gold', 600, 'xp', 250);
    execute 'select coalesce(max(weight),0) from fish_catches where species = ''saga'' and ' || base into v using u, s, e;
    r := r || jsonb_build_object('q', 2, 'text', 'Püüa säga, mis kaalub üle 25 kg', 'target', 25, 'progress', v, 'gold', 1200, 'xp', 450, 'kg', true);
    execute 'select count(*) from fish_catches where species = ''saga'' and extract(hour from caught_at at time zone ''Europe/Tallinn'') < 3 and ' || base into v using u, s, e;
    r := r || jsonb_build_object('q', 3, 'text', 'Püüa säga südaööl (kell 0–3)', 'target', 1, 'progress', v, 'gold', 1500, 'xp', 500);
  end if;
  return (select jsonb_agg(x || jsonb_build_object('claimed', exists (select 1 from fish_event_q q where q.user_id = u and q.kind = k and q.starts = s and q.q = (x ->> 'q')::int))) from jsonb_array_elements(r) x);
end $$;

-- kalastusretk: 4–6 peatust kohtades, kuhu mängija pääseb; igas püüa N kala ühest liigist
create or replace function public.fx_journey(u uuid) returns public.fish_journey language plpgsql as $$
declare f fishers; wk date := date_trunc('week', now() at time zone 'Europe/Tallinn')::date; j fish_journey; legs jsonb := '[]'; sp text; s fish_species; spots text[]; i int := 0;
begin
  select * into j from fish_journey where user_id = u and week = wk;
  if j.user_id is not null then return j; end if;
  select * into f from fishers where user_id = u;
  select array_agg(p.id order by p.min_level) into spots from fish_spots p where p.min_level <= f.level and (p.boat is null or p.boat = any(f.boats))
    and p.id = any(array['metsajarv','jogi','kuninglik','meri','saarestik','jaa','avameri','salajane','sugavik'])
    and (p.id = 'metsajarv' or fx_lic_ok(u, 'harrastus')) and (p.id not in ('avameri','sugavik') or fx_lic_ok(u, 'sugavee'));
  spots := spots[greatest(1, cardinality(spots) - 5):cardinality(spots)];
  while cardinality(spots) < 4 loop spots := spots || spots[1 + (cardinality(spots) % greatest(1, cardinality(spots)))]; end loop;
  foreach sp in array spots loop
    i := i + 1;
    select fs.* into s from fish_species fs where sp = any(fs.spots) and fs.rarity <= 2 and fs.min_level <= f.level and not fs.night_only
      and (not fs.winter_only or sp = 'jaa') and fs.weather is null and fs.event is null
      and not (fs.id = any(array(select x ->> 'species' from jsonb_array_elements(legs) x)))
      -- eelistame kalu, kes praegusel aastaajal ja ilmaga hästi võtavad (muidu võib retk jääda toppama)
      order by fx_act(fs.temp_pref, fs.wx_tags, fx_weather_at(now()), fx_water(sp, now()), false, 'päev') / fs.rarity
               * (0.75 + 0.25 * ('x' || substr(md5(u::text || wk::text || fs.id), 1, 6))::bit(24)::int / 16777215.0) desc limit 1;
    if s.id is null then select fs.* into s from fish_species fs where sp = any(fs.spots) and fs.rarity <= 2 and fs.event is null order by md5(u::text || fs.id) limit 1; end if;
    legs := legs || jsonb_build_object('spot', sp, 'species', s.id, 'n', case when s.rarity = 1 then 3 else 2 end, 'gold', 150 + i * 75, 'xp', 60 + i * 30);
  end loop;
  insert into fish_journey(user_id, week, legs) values (u, wk, legs) returning * into j;
  return j;
end $$;
create or replace function public.fx_journey_json(u uuid, j fish_journey) returns jsonb language plpgsql stable as $$
declare cur jsonb := j.legs -> j.leg; prog int := 0;
begin
  if not j.finished and cur is not null then
    select count(*) into prog from fish_catches where user_id = u and species = cur ->> 'species' and spot = cur ->> 'spot' and caught_at >= j.leg_at and not bought and trap is null;
  end if;
  return jsonb_build_object('week', j.week, 'legs', j.legs, 'leg', j.leg, 'progress', least(prog, coalesce((cur ->> 'n')::int, 0)), 'finished', j.finished,
    'ends', ((j.week + 7)::timestamp at time zone 'Europe/Tallinn'),
    'done_total', (select count(*) from fish_journey where user_id = u and finished));
end $$;

create or replace function public.event_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; ev record; nx record; pv record; top jsonb; mine jsonb; prize jsonb := null; k int; pl int;
begin
  f := fx_fisher(u);
  perform fx_bots_tick();
  select * into ev from fx_event_at(now());
  select * into nx from fx_event_next();
  if ev.kind is not null then
    select coalesce(jsonb_agg(jsonb_build_object('place', r.place, 'name', p.name, 'species', r.species, 'weight', r.weight, 'me', r.user_id = u) order by r.place), '[]')
      into top from fx_event_rank(ev.kind, ev.starts, ev.ends) r join profiles p on p.id = r.user_id where r.place <= 10;
    select jsonb_build_object('place', r.place, 'species', r.species, 'weight', r.weight) into mine from fx_event_rank(ev.kind, ev.starts, ev.ends) r where r.user_id = u;
    select coalesce(jsonb_agg(x.j order by (x.j ->> 'weight')::numeric desc), '[]') into top from (
      select e as j from jsonb_array_elements(top) e
      union all
      select jsonb_build_object('place', null, 'bot', bb.id, 'emoji', bb.emoji, 'name', bb.name, 'species', z.species, 'weight', z.weight, 'me', false)
      from (select distinct on (c.bot) c.bot, c.species, c.weight from fish_bot_catches c where c.species = any(fx_event_species(ev.kind))
            and c.caught_at >= ev.starts and c.caught_at < ev.ends order by c.bot, c.weight desc) z join fish_bots bb on bb.id = z.bot) x;
  end if;
  -- lõppenud sündmuste preemiad (2 viimast nädalavahetust + üle kirjutatud sündmused viimase 14 päeva jooksul)
  for k in 1..14 loop
    select * into pv from fx_event_at(now() - make_interval(days => k));
    continue when pv.kind is null or pv.ends > now();
    continue when exists (select 1 from fish_event_prizes where user_id = u and kind = pv.kind and starts = pv.starts);
    select r.place into pl from fx_event_rank(pv.kind, pv.starts, pv.ends) r where r.user_id = u;
    if pl is not null and pl <= 10 then prize := jsonb_build_object('kind', pv.kind, 'starts', pv.starts, 'place', pl); exit; end if;
  end loop;
  return jsonb_build_object('now', now(), 'level', f.level, 'gold', f.gold, 'boats', to_jsonb(f.boats),
    'event', case when ev.kind is not null then jsonb_build_object('kind', ev.kind, 'starts', ev.starts, 'ends', ev.ends, 'top', top, 'mine', mine,
       'quests', fx_event_quests(u, ev.kind, ev.starts, ev.ends)) end,
    'next', jsonb_build_object('kind', nx.kind, 'starts', nx.starts, 'ends', nx.ends),
    'prize', prize, 'journey', fx_journey_json(u, fx_journey(u)));
end $$;

create or replace function public.event_quest_claim(p_q int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); ev record; q jsonb; levels int[];
begin
  perform fx_fisher(u);
  select * into ev from fx_event_at(now());
  if ev.kind is null then raise exception 'Praegu sündmust pole'; end if;
  select x into q from jsonb_array_elements(fx_event_quests(u, ev.kind, ev.starts, ev.ends)) x where (x ->> 'q')::int = p_q;
  if q is null then raise exception 'Tundmatu ülesanne'; end if;
  if (q ->> 'claimed')::boolean then raise exception 'Preemia on juba võetud'; end if;
  if (q ->> 'progress')::numeric < (q ->> 'target')::numeric then raise exception 'Ülesanne pole veel tehtud'; end if;
  insert into fish_event_q(user_id, kind, starts, q) values (u, ev.kind, ev.starts, p_q);
  update fishers set gold = gold + (q ->> 'gold')::int where user_id = u;
  levels := fx_add_xp(u, (q ->> 'xp')::int);
  return event_state() || jsonb_build_object('claimed', jsonb_build_object('gold', (q ->> 'gold')::int, 'xp', (q ->> 'xp')::int, 'text', q ->> 'text'), 'lvlup', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

create or replace function public.event_prize_claim() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); st jsonb; p jsonb; pl int; g int; ttl text; items jsonb := '[]'; levels int[];
begin
  perform fx_fisher(u);
  st := event_state(); p := st -> 'prize';
  if p is null or p = 'null'::jsonb then raise exception 'Võtmata preemiat pole'; end if;
  pl := (p ->> 'place')::int; g := case pl when 1 then 5000 when 2 then 3000 when 3 then 2000 else 600 end;
  ttl := case when pl <= 3 then case p ->> 'kind' when 'hai' then 'Haikütt' else 'Sägakuningas' end end;
  insert into fish_event_prizes(user_id, kind, starts, place) values (u, p ->> 'kind', (p ->> 'starts')::timestamptz, pl) on conflict do nothing;
  if not found then raise exception 'Preemia on juba võetud'; end if;
  update fishers set gold = gold + g, titles = case when ttl is not null and not (ttl = any(titles)) then titles || ttl else titles end where user_id = u;
  if pl <= 3 then items := fx_give_random(u, 5 - pl, 2); end if;
  levels := fx_add_xp(u, (array[1200,800,600,300,300,300,300,300,300,300])[pl]);
  if pl = 1 then perform fx_news(u, 'event_win', jsonb_build_object('kind', p ->> 'kind')); end if;
  return event_state() || jsonb_build_object('won', jsonb_build_object('place', pl, 'gold', g, 'title', ttl, 'items', items, 'kind', p ->> 'kind'), 'lvlup', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

create or replace function public.journey_advance() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); j fish_journey; js jsonb; cur jsonb; items jsonb := '[]'; levels int[]; fin boolean := false;
begin
  perform fx_fisher(u);
  j := fx_journey(u);
  select * into j from fish_journey where user_id = u and week = j.week for update;
  if j.finished then raise exception 'Retk on juba läbitud'; end if;
  js := fx_journey_json(u, j); cur := j.legs -> j.leg;
  if (js ->> 'progress')::int < (cur ->> 'n')::int then raise exception 'Selle peatuse ülesanne pole veel tehtud'; end if;
  fin := j.leg + 1 >= jsonb_array_length(j.legs);
  update fish_journey set leg = leg + 1, leg_at = now(), finished = fin where user_id = u and week = j.week;
  update fishers set gold = gold + (cur ->> 'gold')::int + case when fin then 2000 else 0 end where user_id = u;
  levels := fx_add_xp(u, (cur ->> 'xp')::int + case when fin then 600 else 0 end);
  if fin then items := fx_give_random(u, 4, 2); perform fx_news(u, 'retk', '{}'); end if;
  return event_state() || jsonb_build_object('advanced', jsonb_build_object('gold', (cur ->> 'gold')::int + case when fin then 2000 else 0 end, 'xp', (cur ->> 'xp')::int, 'finished', fin, 'items', items),
    'lvlup', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

-- ---------- kahevõitlus (mõlemad mängus korraga, 5 minutit samas kohas, suurem kogukaal võidab) ----------
-- kahevõitluse punktid: kui suur kala on oma liigi kohta (suurim tavaline isend = 100 punkti, hiiglane kuni 160)
create or replace function public.fx_duel_pts(sp text, w numeric) returns int language sql stable as $$
  select least(160, greatest(1, round(100 * w / nullif((select max_w from public.fish_species where id = sp), 0))))::int $$;
create or replace function public.fx_duel_json(d fish_duels, u uuid) returns jsonb language plpgsql stable as $$
declare ca jsonb; cb jsonb; bn text; be text;
begin
  if d.start_at is not null then
    select coalesce(jsonb_agg(jsonb_build_object('species', c.species, 'weight', c.weight, 'at', c.caught_at, 'pts', fx_duel_pts(c.species, c.weight)) order by c.caught_at), '[]') into ca from fish_catches c
      where c.user_id = d.a and spot = d.spot and caught_at >= d.start_at and caught_at < d.end_at and not bought and trap is null;
    if d.bot is not null then
      select coalesce(jsonb_agg(x order by (x ->> 'at')::timestamptz), '[]') into cb from jsonb_array_elements(coalesce(d.bot_catch, '[]')) x where d.status = 'done' or (x ->> 'at')::timestamptz <= now();
    else
      select coalesce(jsonb_agg(jsonb_build_object('species', c.species, 'weight', c.weight, 'at', c.caught_at, 'pts', fx_duel_pts(c.species, c.weight)) order by c.caught_at), '[]') into cb from fish_catches c
        where c.user_id = d.b and spot = d.spot and caught_at >= d.start_at and caught_at < d.end_at and not bought and trap is null;
    end if;
  end if;
  if d.bot is not null then select name, emoji into bn, be from fish_bots where id = d.bot; end if;
  return jsonb_build_object('id', d.id, 'status', d.status, 'spot', d.spot, 'stake', d.stake, 'created_at', d.created_at, 'start_at', d.start_at, 'end_at', d.end_at,
    'me_a', d.a = u and not d.from_bot, 'from_bot', d.from_bot, 'bot', d.bot, 'bot_emoji', be,
    'a_name', case when d.from_bot then bn else (select name from profiles where id = d.a) end,
    'b_name', case when d.bot is not null and not d.from_bot then bn when d.from_bot then (select name from profiles where id = d.a) else (select name from profiles where id = d.b) end,
    'a_catch', case when d.from_bot then coalesce(cb, '[]') else coalesce(ca, '[]') end, 'b_catch', case when d.from_bot then coalesce(ca, '[]') else coalesce(cb, '[]') end,
    'winner', case when d.status <> 'done' then null when d.winner = u then 'me' when d.winner is null and d.a_w is not null and d.a_w = d.b_w then null
                   when d.bot is not null and d.winner is null and d.a_w <> d.b_w then 'them' when d.winner is null then null else 'them' end,
    'a_w', case when d.from_bot then d.b_w else d.a_w end, 'b_w', case when d.from_bot then d.a_w else d.b_w end);
end $$;
-- aegunud kutsed, tegelaste vastused ja lõppenud võitlused korda (kutsutakse igal duel_ping'il)
create or replace function public.fx_duel_tidy(u uuid) returns void language plpgsql as $$
declare d fish_duels; wa numeric; wb numeric; lv int; bl int;
begin
  for d in select * from fish_duels where (a = u or b = u) and (
      (status = 'invited' and created_at < now() - interval '2 minutes')
      or (status = 'invited' and bot is not null and not from_bot and bot_at <= now())
      or (status = 'live' and end_at < now())) for update skip locked loop
    if d.status = 'invited' and d.bot is not null and not d.from_bot and d.created_at >= now() - interval '2 minutes' then
      -- tegelane mõtles ja vastab
      if random() < 0.12 then
        update fish_duels set status = 'declined' where id = d.id; update fishers set gold = gold + d.stake where user_id = d.a;
      else
        select fx_bot_level(b) into bl from fish_bots b where b.id = d.bot;
        select least(level, bl) into lv from fishers where user_id = d.a;
        update fish_duels set status = 'live', start_at = now() + interval '10 seconds', end_at = now() + interval '310 seconds',
          bot_catch = fx_bot_duel_catches(d.bot, d.spot, lv, now() + interval '10 seconds', now() + interval '310 seconds') where id = d.id;
      end if;
    elsif d.status = 'invited' then
      update fish_duels set status = 'expired' where id = d.id;
      if not d.from_bot then update fishers set gold = gold + d.stake where user_id = d.a; end if;
    else
      select coalesce(sum(fx_duel_pts(species, weight)), 0) into wa from fish_catches where user_id = d.a and spot = d.spot and caught_at >= d.start_at and caught_at < d.end_at and not bought and trap is null;
      if d.bot is not null then select coalesce(sum((x ->> 'pts')::int), 0) into wb from jsonb_array_elements(coalesce(d.bot_catch, '[]')) x;
      else select coalesce(sum(fx_duel_pts(species, weight)), 0) into wb from fish_catches where user_id = d.b and spot = d.spot and caught_at >= d.start_at and caught_at < d.end_at and not bought and trap is null; end if;
      if wa > wb then update fishers set gold = gold + d.stake * 2 where user_id = d.a;
      elsif wb > wa then if d.bot is null then update fishers set gold = gold + d.stake * 2 where user_id = d.b; end if;
      else update fishers set gold = gold + d.stake where user_id = d.a; if d.bot is null then update fishers set gold = gold + d.stake where user_id = d.b; end if; end if;
      update fish_duels set status = 'done', a_w = wa, b_w = wb, winner = case when wa > wb then d.a when wb > wa then d.b end where id = d.id;
      if wa > wb then perform fx_news(d.a, 'duel', jsonb_build_object('vs', coalesce((select name from fish_bots where id = d.bot), (select name from profiles where id = d.b)), 'stake', d.stake, 'bot', d.bot is not null));
      elsif wb > wa and d.bot is null then perform fx_news(d.b, 'duel', jsonb_build_object('vs', (select name from profiles where id = d.a), 'stake', d.stake)); end if;
    end if;
  end loop;
end $$;
create or replace function public.duel_ping() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; act fish_duels; fin fish_duels; lsp text; vb fish_bots;
begin
  f := fx_fisher(u);
  update fishers set last_seen = now() where user_id = u;
  perform fx_bots_tick();
  perform fx_duel_tidy(u);
  select * into act from fish_duels where (a = u or b = u) and status in ('invited','live') order by id desc limit 1;
  -- vahel kutsub mõni Järve kalur ise (kõige rohkem kord 20 minuti jooksul)
  if act.id is null and random() < 0.04 and not exists (select 1 from fish_duels where (a = u or b = u) and created_at > now() - interval '20 minutes') then
    select spot into lsp from fish_casts where user_id = u and created_at > now() - interval '15 minutes' order by id desc limit 1;
    if lsp is not null then
      select bb.* into vb from fish_bots bb join fish_spots p on p.id = lsp where fx_bot_online(bb, now()) and fx_bot_level(bb) >= p.min_level order by random() limit 1;
      if vb.id is not null then
        insert into fish_duels(a, b, bot, spot, stake, from_bot) values (u, null, vb.id, lsp, least(vb.stake, (f.gold / 4 / 50) * 50), true) returning * into act;
      end if;
    end if;
  end if;
  select * into fin from fish_duels where (a = u or b = u) and status = 'done' and end_at > now() - interval '2 minutes' order by id desc limit 1;
  return jsonb_build_object('now', now(), 'gold', f.gold,
    'active', case when act.id is not null then fx_duel_json(act, u) end,
    'finished', case when fin.id is not null then fx_duel_json(fin, u) end,
    'online', (select coalesce(jsonb_agg(jsonb_build_object('id', x.user_id, 'name', p.name, 'level', x.level, 'title', x.title, 'boats', to_jsonb(x.boats),
                 'busy', exists (select 1 from fish_duels d where (d.a = x.user_id or d.b = x.user_id) and d.status in ('invited','live'))) order by x.level desc), '[]')
               from fishers x join profiles p on p.id = x.user_id where x.user_id <> u and x.last_seen > now() - interval '90 seconds' and not p.hidden),
    'bots', fx_bots_online(),
    'record', jsonb_build_object('won', (select count(*) from fish_duels where winner = u), 'played', (select count(*) from fish_duels where (a = u or b = u) and status = 'done')));
end $$;
create or replace function public.duel_invite(p_target uuid, p_spot text, p_stake int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; t fishers; sp fish_spots;
begin
  f := fx_fisher(u);
  perform pg_advisory_xact_lock(hashtext('duel'));
  perform fx_duel_tidy(u);
  select * into t from fishers where user_id = p_target;
  if t.user_id is null or p_target = u then raise exception 'Mängijat ei leitud'; end if;
  if t.last_seen is null or t.last_seen < now() - interval '90 seconds' then raise exception 'See mängija pole praegu mängus'; end if;
  select * into sp from fish_spots where id = p_spot;
  if sp.id is null then raise exception 'Tundmatu koht'; end if;
  if f.level < sp.min_level or t.level < sp.min_level or (sp.boat is not null and (not sp.boat = any(f.boats) or not sp.boat = any(t.boats))) then raise exception 'Mõlemad peavad sinna kohta pääsema'; end if;
  if p_stake < 0 or p_stake > 5000 then raise exception 'Panus võib olla 0 kuni 5000 kulda'; end if;
  if f.gold < p_stake then raise exception 'Panuse jaoks pole piisavalt kulda'; end if;
  if exists (select 1 from fish_duels where status in ('invited','live') and (a in (u, p_target) or b in (u, p_target))) then raise exception 'Sinul või temal käib juba kahevõitlus'; end if;
  update fishers set gold = gold - p_stake, last_seen = now() where user_id = u;
  insert into fish_duels(a, b, spot, stake) values (u, p_target, p_spot, p_stake);
  return duel_ping();
end $$;
create or replace function public.duel_answer(p_id bigint, p_accept boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fish_duels; lv int; bl int;
begin
  f := fx_fisher(u);
  select * into d from fish_duels where id = p_id for update;
  if d.id is null or d.status <> 'invited' or d.created_at < now() - interval '2 minutes' then raise exception 'Kutse on aegunud'; end if;
  if d.from_bot then
    -- Järve kaluri kutse mängijale
    if d.a <> u then raise exception 'See kutse pole sulle'; end if;
    if p_accept then
      if f.gold < d.stake then raise exception 'Panuse jaoks pole piisavalt kulda'; end if;
      select fx_bot_level(b) into bl from fish_bots b where b.id = d.bot; lv := least(f.level, bl);
      update fishers set gold = gold - d.stake where user_id = u;
      update fish_duels set status = 'live', start_at = now() + interval '10 seconds', end_at = now() + interval '310 seconds',
        bot_catch = fx_bot_duel_catches(d.bot, d.spot, lv, now() + interval '10 seconds', now() + interval '310 seconds') where id = d.id;
    else update fish_duels set status = 'declined' where id = d.id; end if;
  elsif p_accept then
    if d.bot is not null or d.b <> u then raise exception 'See kutse pole sulle'; end if;
    if f.gold < d.stake then raise exception 'Panuse jaoks pole piisavalt kulda'; end if;
    update fishers set gold = gold - d.stake where user_id = u;
    update fish_duels set status = 'live', start_at = now() + interval '10 seconds', end_at = now() + interval '310 seconds' where id = d.id;
  else
    if u <> d.a and u is distinct from d.b then raise exception 'See kutse pole sulle'; end if;
    update fish_duels set status = case when u = d.a then 'cancelled' else 'declined' end where id = d.id;
    update fishers set gold = gold + d.stake where user_id = d.a;
  end if;
  return duel_ping();
end $$;

-- ---------------------------------------------------------------------
-- 6q. Ilmastik (jaotis 2r)
-- ---------------------------------------------------------------------
-- ilm antud hetkel (3-tunnised plokid, kõigile sama)
create or replace function public.fx_weather_at(ts timestamptz) returns text language sql immutable as $$
  select case when h < 35 then 'paike' when h < 60 then 'pilves' when h < 80 then 'vihm' when h < 92 then 'udu' else 'torm' end
  from (select abs(hashtext('ilm' || floor(extract(epoch from ts) / 10800)::text)) % 100 as h) x $$;
create or replace function public.fx_season(ts timestamptz default now()) returns text language sql stable as $$
  select case when m in (12,1,2) then 'talv' when m in (3,4,5) then 'kevad' when m in (6,7,8) then 'suvi' else 'sügis' end
  from (select extract(month from ts at time zone 'Europe/Tallinn')::int m) x $$;
-- kuu keskmistest sujuvalt (päev aastas), Tallinna kliima
create or replace function public.fx_clim(ts timestamptz, kind text) returns numeric language plpgsql immutable as $$
declare loc timestamp := ts at time zone 'Europe/Tallinn'; doy numeric := extract(doy from loc) + extract(hour from loc) / 24.0;
  air numeric[] := array[-3.5,-4,-0.8,5,11,15,18,17,12,7,2.5,-1]; wat numeric[] := array[1,0.5,1,4,10,16,19,18,14,9,5,2];
  v numeric[]; m numeric; i int; j int; f numeric;
begin
  v := case when kind = 'air' then air else wat end;
  m := (doy - 15.5) / 30.44; i := floor(m)::int; f := m - i; j := i + 1;
  i := ((i % 12) + 12) % 12 + 1; j := ((j % 12) + 12) % 12 + 1;
  return v[i] * (1 - f) + v[j] * f;
end $$;
create or replace function public.fx_pressure(ts timestamptz) returns numeric language sql immutable as $$
  select (case w when 'paike' then 1022 when 'pilves' then 1013 when 'vihm' then 1004 when 'udu' then 1016 else 992 end)
    + (abs(hashtext('rohk' || floor(extract(epoch from ts) / 10800)::text)) % 9) - 4
  from (select public.fx_weather_at(ts) w) x $$;
create or replace function public.fx_air(ts timestamptz) returns numeric language plpgsql immutable as $$
declare loc timestamp := ts at time zone 'Europe/Tallinn'; h numeric := extract(hour from loc) + extract(minute from loc) / 60.0; w text := public.fx_weather_at(ts);
  amp numeric := case when extract(month from loc) between 5 and 8 then 5 when extract(month from loc) in (11,12,1,2) then 2 else 3.5 end;
begin
  return round(public.fx_clim(ts, 'air') + amp * cos((h - 15) / 24 * 2 * pi())::numeric
    + case w when 'paike' then case when h between 9 and 18 then 2.5 else -2 end when 'vihm' then -1.5 when 'udu' then -1 when 'torm' then -2.5 else 0 end, 1);
end $$;
create or replace function public.fx_water(p_spot text, ts timestamptz) returns numeric language plpgsql immutable as $$
declare loc timestamp := ts at time zone 'Europe/Tallinn'; h numeric := extract(hour from loc); base numeric := public.fx_clim(ts, 'water');
begin
  if p_spot = 'jaa' then return 1.0; end if;
  if p_spot = 'sugavik' then return round(4 + base * 0.15, 1); end if;
  return round(greatest(0.2, base + 0.6 * cos((h - 17) / 24 * 2 * pi())::numeric
    + case when p_spot in ('meri','saarestik','avameri') then case when base > 10 then -1.5 else 1 end when p_spot = 'jogi' then case when base > 10 then -1 else 0.3 end else 0 end), 1);
end $$;
-- kas torm on tulekul (järgmine plokk on torm, praegu mitte) – rõhk langeb ja kalad söövad ahnelt
create or replace function public.fx_prestorm(ts timestamptz default now()) returns boolean language sql immutable as $$
  select public.fx_weather_at(ts) <> 'torm' and public.fx_weather_at(ts + interval '3 hours') = 'torm' $$;
-- liigi aktiivsus 0,25–1,9 (1 = tavaline)
create or replace function public.fx_act(pref text, tags text[], wthr text, water numeric, pre boolean, dp text) returns numeric language sql immutable as $$
  select least(1.9, greatest(0.25,
    (0.35 + 0.95 * exp(-power((water - case pref when 'cold' then 6 when 'warm' then 22 else 14 end) / case pref when 'cold' then 8 when 'warm' then 7 else 11 end, 2)))
    * case wthr when 'paike' then case when 'sun' = any(tags) then 1.15 else 0.82 end
                when 'pilves' then case when 'dim' = any(tags) then 1.2 else 1 end
                when 'vihm' then case when 'rain' = any(tags) then 1.35 else 1.05 end
                when 'udu' then case when 'dim' = any(tags) then 1.3 else 0.95 end
                else case when 'pred' = any(tags) then 1.05 else 0.85 end end
    * case when pre then 1.4 else 1 end
    * case dp when 'hommik' then case when 'pred' = any(tags) then 1.25 else 1.05 end
              when 'õhtu' then case when 'pred' = any(tags) then 1.25 else 1.05 end
              when 'öö' then case when 'night' = any(tags) then 1.45 else 0.9 end
              else case when 'sun' = any(tags) then 1.1 when 'pred' = any(tags) then 0.88 else 0.95 end end))::numeric $$;

create or replace function public.weather_state(p_spot text default 'metsajarv') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; wthr text := fx_weather(); water numeric := fx_water(p_spot, now()); pre boolean := fx_prestorm(); dp text := fx_daypart();
  blk timestamptz := to_timestamp(floor(extract(epoch from now()) / 10800) * 10800); fc jsonb := '[]'; i int;
begin
  f := fx_fisher(u);
  for i in 1..4 loop
    fc := fc || jsonb_build_object('at', blk + make_interval(hours => 3 * i), 'weather', fx_weather_at(blk + make_interval(hours => 3 * i)),
      'air', fx_air(blk + make_interval(hours => 3 * i) + interval '90 minutes'), 'pressure', fx_pressure(blk + make_interval(hours => 3 * i)));
  end loop;
  return jsonb_build_object('now', now(), 'spot', p_spot, 'season', fx_season(), 'weather', wthr, 'daypart', dp, 'night', fx_is_night(),
    'air', fx_air(now()), 'water', water, 'pressure', fx_pressure(now()), 'trend', fx_pressure(blk + interval '3 hours') - fx_pressure(now()), 'prestorm', pre,
    'block_end', blk + interval '3 hours', 'forecast', fc,
    'species', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'pref', s.temp_pref, 'tags', to_jsonb(s.wx_tags),
                  'act', round(fx_act(s.temp_pref, s.wx_tags, wthr, water, pre, dp), 2)) order by fx_act(s.temp_pref, s.wx_tags, wthr, water, pre, dp) desc), '[]')
                from fish_species s where p_spot = any(s.spots) and s.min_level <= f.level and s.event is null
                  and (not s.night_only or fx_is_night()) and (not s.winter_only or fx_is_winter() or p_spot = 'jaa') and (s.weather is null or wthr = any(s.weather))));
end $$;

-- ---------------------------------------------------------------------
-- 6r. Järve kalurid (jaotis 2s)
-- ---------------------------------------------------------------------
create or replace function public.fx_bot_level(b public.fish_bots) returns int language sql stable as $$
  select least(50, coalesce(b.lvl, b.base_level)) $$;
-- kogemus tegelasele (sama tasemekõver mis mängijal); tõusu korral uudis
create or replace function public.fx_bot_xp(p_bot text, p_species text, p_spot text, at2 timestamptz) returns void language plpgsql as $$
declare b public.fish_bots; s public.fish_species; sp public.fish_spots; gain int; lv int; x int;
begin
  select * into b from public.fish_bots where id = p_bot for update;
  select * into s from public.fish_species where id = p_species; select * into sp from public.fish_spots where id = p_spot;
  if b.id is null or s.id is null then return; end if;
  lv := coalesce(b.lvl, b.base_level); if lv >= 50 then return; end if;
  gain := greatest(1, round(s.xp * (1 + coalesce(sp.difficulty, 0) * 0.1) * 0.6));
  x := b.xp + gain;
  while lv < 50 and x >= public.fx_xp_need(lv) loop
    x := x - public.fx_xp_need(lv); lv := lv + 1;
    insert into public.fish_news(at, user_id, bot, kind, data) values (at2, null, b.id, 'bot_level', jsonb_build_object('level', lv));
  end loop;
  if lv >= 50 then x := 0; end if;
  update public.fish_bots set lvl = lv, xp = x where id = b.id;
end $$;
-- kas tegelane on antud hetkel vee ääres (päevakava, puhkepäevad, pausid; Tormi-Toomas tuleb tormiga alati)
create or replace function public.fx_bot_online(b public.fish_bots, ts timestamptz) returns boolean language plpgsql stable as $$
declare loc timestamp := ts at time zone 'Europe/Tallinn'; h int := extract(hour from loc); win jsonb; x jsonb; ok boolean := false;
begin
  if abs(hashtext(b.id || loc::date::text)) % 100 < 12 then return false; end if;
  if b.storm and public.fx_weather_at(ts) = 'torm' then return true; end if;
  win := case when extract(isodow from loc) >= 6 then b.weekend else b.hours end;
  for x in select * from jsonb_array_elements(win) loop
    if h >= (x ->> 0)::int and h < (x ->> 1)::int then ok := true; end if;
  end loop;
  if ok and abs(hashtext(b.id || floor(extract(epoch from ts) / 900)::text)) % 100 < 15 then ok := false; end if;
  return ok;
end $$;
create or replace function public.fx_bot_spot(b public.fish_bots, ts timestamptz) returns text language plpgsql stable as $$
declare lst text[];
begin
  select array_agg(s order by ord) into lst from unnest(b.spots) with ordinality u(s, ord) join public.fish_spots p on p.id = u.s where p.min_level <= public.fx_bot_level(b);
  if lst is null then return 'metsajarv'; end if;
  return lst[1 + abs(hashtext(b.id || floor(extract(epoch from ts) / 3600)::text)) % cardinality(lst)];
end $$;
-- tegelase saak: samad reeglid mis mängijal (koht, tase, ilm, vesi, kellaaeg, kalade aktiivsus)
create or replace function public.fx_bot_pick(p_spot text, lvl int, ts timestamptz, sizeb numeric) returns jsonb language plpgsql volatile as $$
declare loc timestamp := ts at time zone 'Europe/Tallinn'; h int := extract(hour from loc); night boolean := h >= 21 or h < 5;
  dp text := case when h >= 5 and h < 10 then 'hommik' when h >= 10 and h < 17 then 'päev' when h >= 17 and h < 21 then 'õhtu' else 'öö' end;
  wthr text := public.fx_weather_at(ts); wat numeric := public.fx_water(p_spot, ts); pre boolean := public.fx_prestorm(ts); ev text := (public.fx_event_at(ts)).kind;
  roll numeric := random() * 100; rar int; s public.fish_species; wt numeric;
begin
  rar := case when roll < 62 then 1 when roll < 86 then 2 when roll < 96 then 3 when roll < 99.5 then 4 else 5 end;
  while s.id is null and rar >= 1 loop
    select fs.* into s from public.fish_species fs where fs.rarity = rar and p_spot = any(fs.spots) and fs.min_level <= lvl
      and (fs.event is null or fs.event = ev) and (not fs.night_only or night) and (not fs.winter_only or public.fx_is_winter() or p_spot = 'jaa')
      and (fs.weather is null or wthr = any(fs.weather))
      order by -ln(greatest(random(), 1e-9)) / public.fx_act(fs.temp_pref, fs.wx_tags, wthr, wat, pre, dp) limit 1;
    rar := rar - 1;
  end loop;
  if s.id is null then return null; end if;
  wt := s.min_w + (s.max_w - s.min_w) * power(random(), 2.2 / sizeb);
  wt := round(wt, case when wt < 1 then 3 else 2 end);
  return jsonb_build_object('species', s.id, 'rarity', s.rarity, 'weight', wt, 'max_w', s.max_w);
end $$;
-- elu edasi: kuni 3 tundi tagasi, 3-minutiliste sammudega (käivitub kuni kord minutis)
create or replace function public.fx_bots_tick() returns void language plpgsql as $$
declare last timestamptz; t timestamptz; b public.fish_bots; p jsonb; at2 timestamptz;
begin
  if not pg_try_advisory_xact_lock(hashtext('bots-tick')) then return; end if;
  select v into last from public.fish_bot_meta where k = 'tick';
  if last is not null and last > now() - interval '60 seconds' then return; end if;
  t := greatest(coalesce(last, now() - interval '3 hours'), now() - interval '3 hours');
  while t < now() loop
    for b in select * from public.fish_bots loop
      if public.fx_bot_online(b, t) and random() < b.skill * 0.75 then
        at2 := least(now(), t + random() * interval '3 minutes');
        p := public.fx_bot_pick(public.fx_bot_spot(b, at2), public.fx_bot_level(b), at2, b.size);
        if p is not null then
          insert into public.fish_bot_catches(bot, species, rarity, weight, spot, caught_at) values (b.id, p ->> 'species', (p ->> 'rarity')::int, (p ->> 'weight')::numeric, public.fx_bot_spot(b, at2), at2);
          perform public.fx_bot_xp(b.id, p ->> 'species', public.fx_bot_spot(b, at2), at2);
          perform public.fx_bot_kt(b.id, p ->> 'species', (p ->> 'rarity')::int, (p ->> 'weight')::numeric, at2);
          if ((p ->> 'rarity')::int >= 4 or ((p ->> 'rarity')::int >= 3 and (p ->> 'weight')::numeric >= (p ->> 'max_w')::numeric * 0.8))
             and not exists (select 1 from public.fish_news where bot = b.id and kind = 'bot_catch' and at > now() - interval '3 hours') then
            insert into public.fish_news(at, user_id, bot, kind, data) values (at2, null, b.id, 'bot_catch', jsonb_build_object('species', p ->> 'species', 'weight', p ->> 'weight', 'spot', public.fx_bot_spot(b, at2)));
          end if;
        end if;
      end if;
    end loop;
    t := t + interval '3 minutes';
  end loop;
  perform public.fx_bots_life();
  delete from public.fish_bot_catches where caught_at < now() - interval '21 days';
  insert into public.fish_bot_meta(k, v) values ('tick', now()) on conflict (k) do update set v = excluded.v;
end $$;
create or replace function public.fx_bots_online() returns jsonb language sql volatile as $$
  select coalesce(jsonb_agg(jsonb_build_object('bot', b.id, 'name', b.name, 'emoji', b.emoji, 'level', public.fx_bot_level(b), 'xp', b.xp, 'xp_need', case when public.fx_bot_level(b) >= 50 then 0 else public.fx_xp_need(public.fx_bot_level(b)) end, 'descr', b.descr,
    'spot', public.fx_bot_spot(b, now()), 'stake', b.stake) order by b.sort), '[]') from public.fish_bots b where public.fx_bot_online(b, now()) $$;
-- kahevõitluse saak tegelasele (arvutatakse ette, näidatakse jooksvalt)
create or replace function public.fx_bot_duel_catches(p_bot text, p_spot text, lvl int, st timestamptz, en timestamptz) returns jsonb language plpgsql volatile as $$
declare b public.fish_bots; n int; i int; at2 timestamptz; p jsonb; r jsonb := '[]';
begin
  select * into b from public.fish_bots where id = p_bot;
  n := greatest(2, round(b.skill * (4 + random() * 4)));
  for i in 1..n loop
    at2 := st + interval '12 seconds' + random() * (en - st - interval '20 seconds');
    p := public.fx_bot_pick(p_spot, lvl, at2, b.size);
    if p is not null then r := r || jsonb_build_object('species', p ->> 'species', 'weight', (p ->> 'weight')::numeric, 'at', at2, 'pts', public.fx_duel_pts(p ->> 'species', (p ->> 'weight')::numeric)); end if;
  end loop;
  return (select coalesce(jsonb_agg(x order by (x ->> 'at')::timestamptz), '[]') from jsonb_array_elements(r) x);
end $$;
create or replace function public.duel_invite_bot(p_bot text, p_spot text, p_stake int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; vb fish_bots; sp fish_spots;
begin
  f := fx_fisher(u);
  perform pg_advisory_xact_lock(hashtext('duel'));
  perform fx_duel_tidy(u);
  select * into vb from fish_bots where id = p_bot;
  if vb.id is null then raise exception 'Kalurit ei leitud'; end if;
  if not fx_bot_online(vb, now()) then raise exception '% läks just koju', vb.name; end if;
  select * into sp from fish_spots where id = p_spot;
  if sp.id is null or f.level < sp.min_level or fx_bot_level(vb) < sp.min_level or (sp.boat is not null and not sp.boat = any(f.boats)) then raise exception 'Sinna kohta ei pääse mõlemad'; end if;
  if p_stake < 0 or p_stake > 5000 then raise exception 'Panus võib olla 0 kuni 5000 kulda'; end if;
  if f.gold < p_stake then raise exception 'Panuse jaoks pole piisavalt kulda'; end if;
  if exists (select 1 from fish_duels where status in ('invited','live') and (a = u or b = u)) then raise exception 'Sul käib juba kahevõitlus'; end if;
  update fishers set gold = gold - p_stake, last_seen = now() where user_id = u;
  insert into fish_duels(a, b, bot, spot, stake, bot_at) values (u, null, vb.id, p_spot, p_stake, now() + make_interval(secs => 3 + random() * 5));
  return duel_ping();
end $$;

-- ---------------------------------------------------------------------
-- 6z7. Ilmasündmused: lühikesed ühised sündmused kõigile mängijatele (torm, udu, kalaparv)
--   Ajakava tuleb kellaajast (iga 30 min plokk saab räsi järgi oma sündmuse või mitte),
--   nii et server ei pea midagi taustal käivitama ja kõik näevad sama sündmust samal ajal.
--   torm: 2 min hoiatus (kalad söövad ahnelt, näkkab kiiremini) + 3 min torm (ilm = torm)
--   udu:  2 min (ilm = udu, udukalad)
--   parv: 90 s ühes püügikohas (näkkab 2× kiiremini)
-- ---------------------------------------------------------------------
create or replace function public.fx_wev_slot(n bigint) returns jsonb language plpgsql immutable as $$
declare h int := abs(hashtext('wev' || n::text)) % 100; o int := 240 + abs(hashtext('wevo' || n::text)) % 1200;
  t0 timestamptz := to_timestamp(n * 1800); k text; sp text;
begin
  k := case when h < 20 then 'torm' when h < 38 then 'udu' when h < 68 then 'parv' when h < 72 then 'valitseja' when h < 76 then 'onn' else null end;
  if k is null then return null; end if;
  -- Õnnetund (umbes 2 korda ööpäevas): 2 min ette teada, siis 10 min kõigil 3× õnn ja 2× suuremad kalad (iga mängija oma varustuse järgi)
  if k = 'onn' then
    o := 120 + o % 900;
    return jsonb_build_object('id', 'onn-' || n, 'kind', 'onn', 'warn', t0 + make_interval(secs => o), 'start', t0 + make_interval(secs => o + 120), 'end', t0 + make_interval(secs => o + 720));
  end if;
  -- Sügavuste Valitseja ärkab (harva, umbes 2 korda ööpäevas): 2 min vesi tumeneb, siis 4 min võib ta näkata igas püügikohas
  if k = 'valitseja' then
    return jsonb_build_object('id', 'valitseja-' || n, 'kind', 'valitseja', 'warn', t0 + make_interval(secs => o), 'start', t0 + make_interval(secs => o + 120), 'end', t0 + make_interval(secs => o + 360));
  end if;
  -- kui suur ilm on niigi torm/udu, siis sama sündmust ei korrata – tuleb kalaparv
  if (k = 'torm' and public.fx_weather_at(t0) = 'torm') or (k = 'udu' and public.fx_weather_at(t0) = 'udu') then k := 'parv'; end if;
  if k = 'torm' then
    return jsonb_build_object('id', 'torm-' || n, 'kind', 'torm', 'warn', t0 + make_interval(secs => o), 'start', t0 + make_interval(secs => o + 120), 'end', t0 + make_interval(secs => o + 300));
  elsif k = 'udu' then
    return jsonb_build_object('id', 'udu-' || n, 'kind', 'udu', 'warn', t0 + make_interval(secs => o), 'start', t0 + make_interval(secs => o), 'end', t0 + make_interval(secs => o + 120));
  end if;
  sp := (array['metsajarv','jogi','kuninglik','meri','saarestik','metsajarv'])[1 + abs(hashtext('wevs' || n::text)) % 6];
  return jsonb_build_object('id', 'parv-' || n, 'kind', 'parv', 'spot', sp, 'warn', t0 + make_interval(secs => o), 'start', t0 + make_interval(secs => o), 'end', t0 + make_interval(secs => o + 90));
end $$;
-- sündmus, mis antud hetkel käib (hoiatus või tegelik osa), või null
create or replace function public.fx_wev(ts timestamptz default now()) returns jsonb language plpgsql stable as $$
declare e jsonb := public.fx_wev_slot(floor(extract(epoch from ts) / 1800)::bigint);
begin
  if e is not null and ts >= (e ->> 'warn')::timestamptz and ts < (e ->> 'end')::timestamptz then
    return e || jsonb_build_object('phase', case when ts < (e ->> 'start')::timestamptz then 'warn' else 'on' end);
  end if;
  return null;
end $$;
-- sündmused ajavahemikus (tulemas)
create or replace function public.fx_wev_list(p_from timestamptz, p_to timestamptz) returns jsonb language plpgsql stable as $$
declare n bigint; e jsonb; res jsonb := '[]';
begin
  for n in floor(extract(epoch from p_from) / 1800)::bigint .. floor(extract(epoch from p_to) / 1800)::bigint loop
    e := public.fx_wev_slot(n);
    if e is not null and (e ->> 'end')::timestamptz > p_from and (e ->> 'warn')::timestamptz < p_to then res := res || jsonb_build_array(e); end if;
  end loop;
  return res;
end $$;
-- ilm koos ilmasündmusega (kõik püügiloogika kasutab seda)
create or replace function public.fx_weather() returns text language plpgsql stable as $$
declare e jsonb := public.fx_wev(now());
begin
  if e is not null and e ->> 'phase' = 'on' and e ->> 'kind' in ('torm', 'udu') then return e ->> 'kind'; end if;
  return public.fx_weather_at(now());
end $$;
-- ootamise kordaja: enne tormi söövad kalad ahnelt, kalaparve juures näkkab kaks korda kiiremini
create or replace function public.fx_wev_wait(p_spot text) returns numeric language plpgsql stable as $$
declare e jsonb := public.fx_wev(now());
begin
  if e is null then return 1; end if;
  if e ->> 'kind' = 'torm' and e ->> 'phase' = 'warn' then return 0.7; end if;
  if e ->> 'kind' = 'parv' and e ->> 'spot' = p_spot then return 0.5; end if;
  return 1;
end $$;
-- mängijale: praegune sündmus, tulemas (järgmine tund) ja just lõppenud sündmuse kokkuvõte
create or replace function public.fx_wev_info(u uuid) returns jsonb language plpgsql stable as $$
declare cur jsonb := public.fx_wev(now()); lst jsonb; e jsonb; n int; best jsonb;
begin
  -- viimased 10 minutit lõppenud sündmus
  for e in select x from jsonb_array_elements(public.fx_wev_list(now() - interval '40 minutes', now())) x loop
    if (e ->> 'end')::timestamptz <= now() and (e ->> 'end')::timestamptz > now() - interval '10 minutes' then lst := e; end if;
  end loop;
  if lst is not null then
    select count(*), (select jsonb_build_object('species', c2.species, 'weight', c2.weight) from fish_catches c2 where c2.user_id = u and not c2.bought
        and c2.caught_at >= (lst ->> 'start')::timestamptz and c2.caught_at < (lst ->> 'end')::timestamptz + interval '20 seconds' order by c2.rarity desc, c2.weight desc limit 1)
      into n, best from fish_catches c where c.user_id = u and not c.bought and c.caught_at >= (lst ->> 'start')::timestamptz and c.caught_at < (lst ->> 'end')::timestamptz + interval '20 seconds'
        and (lst ->> 'kind' <> 'parv' or c.spot = lst ->> 'spot');
    lst := lst || jsonb_build_object('n', n, 'best', best);
  end if;
  return jsonb_build_object('now', now(), 'cur', cur, 'next', (select coalesce(jsonb_agg(x), '[]') from jsonb_array_elements(public.fx_wev_list(now(), now() + interval '75 minutes')) x
      where (x ->> 'warn')::timestamptz > now()), 'last', lst);
end $$;

-- ---------------------------------------------------------------------
-- 6z8. Sadam: laevastik, laevatöökoda, meeskond, retked, sündmused ja bossid
-- ---------------------------------------------------------------------
create or replace function public.fx_fleet(u uuid) returns public.fisher_fleet language plpgsql as $$
declare f public.fisher_fleet;
begin
  insert into public.fisher_fleet(user_id) values (u) on conflict do nothing;
  insert into public.fisher_regions(user_id, region) values (u, 'metsajarv') on conflict do nothing;
  select * into f from public.fisher_fleet where user_id = u; return f;
end $$;
-- laevatöökoja 7 osa: mis näitajat tõstab ja kui palju ühe taseme kohta
create or replace function public.fx_fl_parts() returns jsonb language sql immutable as $$ select '[
  {"id":"puri","name":"Puri","descr":"Suurem ja tugevam puri – laev liigub kiiremini.","stat":"spd","per":2},
  {"id":"kere","name":"Laevakere","descr":"Paksemad plangud ja raudvööd – laev peab tormidele vastu.","stat":"vast","per":15},
  {"id":"mootor","name":"Liikumissüsteem","descr":"Aerud, siis aurumasin ja sõukruvi – palju kiirem, aga vajab küttepuid.","stat":"spd","per":3},
  {"id":"lastiruum","name":"Lastiruum","descr":"Suurem lastiruum – rohkem kala ühe retkega.","stat":"cap","per":3},
  {"id":"kompass","name":"Kompass","descr":"Täpsem kompass ja kaardid – leiad peidetud paiku kergemini.","stat":"avast","per":6},
  {"id":"vorgud","name":"Kalastusvõrgud","descr":"Tihedamad ja tugevamad võrgud – rohkem ja haruldasemat kala.","stat":"pyuk","per":5},
  {"id":"kaitse","name":"Kaitsesüsteem","descr":"Kilbid, harpuunid ja kahurid – kaitse koletiste ja bosside vastu.","stat":"kaitse","per":8}]'::jsonb $$;
create or replace function public.fx_fl_part_cost(t public.fleet_ship_types, p text, l int) returns jsonb language plpgsql immutable as $$
declare c jsonb := jsonb_build_object('gold', greatest(300, round(t.price * 0.08 * power(l, 1.6))::int));
begin
  case p
    when 'puri' then c := c || jsonb_build_object('mats', jsonb_build_object('luu', 4 * l * t.rank));
    when 'kere' then c := c || jsonb_build_object('wood', 25 * l * t.rank);
    when 'mootor' then c := c || jsonb_build_object('wood', 15 * l * t.rank) || case when l >= 3 then jsonb_build_object('items', jsonb_build_object('ruun', l - 2)) else '{}' end;
    when 'lastiruum' then c := c || jsonb_build_object('wood', 20 * l * t.rank);
    when 'kompass' then c := c || jsonb_build_object('items', jsonb_build_object('merevaik', l));
    when 'vorgud' then c := c || jsonb_build_object('mats', jsonb_build_object('soomus', 3 * l * t.rank));
    when 'kaitse' then c := c || jsonb_build_object('items', case when l >= 5 then jsonb_build_object('parl', l, 'kristall', 1) else jsonb_build_object('parl', l) end);
    else raise exception 'Tundmatu laevaosa';
  end case;
  return c;
end $$;
-- laeva näitajad: klassi alus + osad + meeskond
create or replace function public.fx_fl_stats(s public.fisher_ships, crew jsonb) returns jsonb language plpgsql stable as $$
declare t public.fleet_ship_types; p jsonb; r jsonb; k text; kap numeric := coalesce((crew ->> 'kapten')::int, 1) - 1;
  tu numeric := coalesce((crew ->> 'tuurimees')::int, 1) - 1; ka numeric := coalesce((crew ->> 'kalur')::int, 1) - 1;
begin
  select * into t from public.fleet_ship_types where id = s.type;
  r := jsonb_build_object('spd', t.spd, 'vast', t.vast, 'cap', t.cap, 'avast', t.avast, 'kaitse', t.kaitse, 'pyuk', t.pyuk);
  for p in select x from jsonb_array_elements(public.fx_fl_parts()) x loop
    k := p ->> 'stat';
    r := jsonb_set(r, array[k], to_jsonb((r ->> k)::numeric + coalesce((s.parts ->> (p ->> 'id'))::int, 0) * (p ->> 'per')::numeric
      * case when p ->> 'id' = 'lastiruum' then t.rank else 1 end));
  end loop;
  return jsonb_build_object(
    'spd', round((r ->> 'spd')::numeric * (1 + 0.04 * tu)), 'vast', round((r ->> 'vast')::numeric * (1 + 0.03 * kap)),
    'cap', round((r ->> 'cap')::numeric * (1 + 0.03 * ka)), 'avast', round((r ->> 'avast')::numeric * (1 + 0.04 * tu)),
    'kaitse', round((r ->> 'kaitse')::numeric * (1 + 0.04 * kap)), 'pyuk', round((r ->> 'pyuk')::numeric * (1 + 0.05 * ka)));
end $$;
-- maksmine: kuld, kuningriigi toit/puit/kivi, töökoja materjalid, esemed
create or replace function public.fx_fl_pay(u uuid, c jsonb) returns void language plpgsql as $$
declare f fishers; sv saves; k text; have numeric; n int;
  rn jsonb := '{"wood":"Puitu","food":"Toitu (proviant)","stone":"Kivi"}';
begin
  select * into f from fishers where user_id = u for update;
  if f.gold < coalesce((c ->> 'gold')::int, 0) then raise exception 'Kulda jääb puudu (vaja %)', c ->> 'gold'; end if;
  for k in select jsonb_object_keys(coalesce(c -> 'mats', '{}')) loop
    if coalesce((select qty from fisher_mats where user_id = u and mat = k), 0) < (c -> 'mats' ->> k)::int then
      raise exception '„%“ jääb puudu (vaja %)', (select name from fish_mats where id = k), c -> 'mats' ->> k; end if;
  end loop;
  for k in select jsonb_object_keys(coalesce(c -> 'items', '{}')) loop
    if coalesce((select qty from fisher_items where user_id = u and item = k), 0) < (c -> 'items' ->> k)::int then
      raise exception '„%“ jääb puudu (vaja %)', (select name from fish_items where id = k), c -> 'items' ->> k; end if;
  end loop;
  if c ? 'wood' or c ? 'food' or c ? 'stone' then
    select * into sv from saves where user_id = u for update;
    if sv.user_id is null then raise exception 'Kuningriik pole veel salvestatud – oota paar sekundit'; end if;
    foreach k in array array['wood','food','stone'] loop
      n := coalesce((c ->> k)::int, 0); if n = 0 then continue; end if;
      have := coalesce((sv.data -> 'res' ->> k)::numeric, 0);
      if have < n then raise exception '% on vaja % (kuningriigis on %)', rn ->> k, n, floor(have); end if;
      sv.data := jsonb_set(sv.data, array['res', k], to_jsonb(have - n));
    end loop;
    update saves set data = sv.data where user_id = u;
  end if;
  for k in select jsonb_object_keys(coalesce(c -> 'mats', '{}')) loop update fisher_mats set qty = qty - (c -> 'mats' ->> k)::int where user_id = u and mat = k; end loop;
  for k in select jsonb_object_keys(coalesce(c -> 'items', '{}')) loop update fisher_items set qty = qty - (c -> 'items' ->> k)::int where user_id = u and item = k; end loop;
  update fishers set gold = gold - coalesce((c ->> 'gold')::int, 0) where user_id = u;
end $$;
create or replace function public.fx_fl_open(u uuid, r public.fleet_regions) returns boolean language sql stable as $$
  select r.ord = 1 or exists (select 1 from public.fisher_regions x join public.fleet_regions p on p.id = x.region where x.user_id = u and p.ord = r.ord - 1 and x.boss_dead) $$;
create or replace function public.fx_fl_minutes(r public.fleet_regions, k text, st jsonb) returns int language sql immutable as $$
  select greatest(3, round(r.minutes * (case k when 'pyuk' then 1.2 when 'boss' then 0.8 when 'aare' then 1.1 when 'kaup' then 1.1 when 'paaste' then 0.9 else 1 end) * 16.0 / greatest(5, (st ->> 'spd')::numeric)))::int $$;
create or replace function public.fx_fl_crew_cost(l int) returns int language sql immutable as $$ select round(400 * power(l, 1.7))::int $$;

create or replace function public.fleet_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; fl fisher_fleet; sv saves;
begin
  f := fx_fisher(u); fl := fx_fleet(u);
  -- avatud piirkonnad saavad oma rea
  insert into fisher_regions(user_id, region) select u, r.id from fleet_regions r where fx_fl_open(u, r) on conflict do nothing;
  select * into sv from saves where user_id = u;
  return jsonb_build_object('now', now(), 'level', f.level, 'gold', f.gold, 'min_level', 8,
    'res', jsonb_build_object('wood', floor(coalesce((sv.data -> 'res' ->> 'wood')::numeric, 0)), 'food', floor(coalesce((sv.data -> 'res' ->> 'food')::numeric, 0))),
    'stock', jsonb_build_object('mats', (select coalesce(jsonb_object_agg(mat, qty), '{}') from fisher_mats where user_id = u and mat in ('luu','soomus','kuldsoomus','iidneluu','kask')),
      'items', (select coalesce(jsonb_object_agg(item, qty), '{}') from fisher_items where user_id = u)),
    'names', jsonb_build_object('mats', (select jsonb_object_agg(id, name) from fish_mats), 'items', (select jsonb_object_agg(id, name) from fish_items), 'baits', (select jsonb_object_agg(id, name) from fish_baits)),
    'crew', fl.crew, 'voyages', fl.voyages, 'myfoes', coalesce(fl.foes, '{}'),
    'foes', (select jsonb_agg(jsonb_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'region', o.region, 'power', o.power, 'grow', o.grow, 'icon', o.icon, 'descr', o.descr, 'gold', o.gold, 'loot', o.loot) order by o.ord) from fleet_foes o),
    'crew_cost', jsonb_build_object('kapten', fx_fl_crew_cost((fl.crew ->> 'kapten')::int), 'tuurimees', fx_fl_crew_cost((fl.crew ->> 'tuurimees')::int), 'kalur', fx_fl_crew_cost((fl.crew ->> 'kalur')::int)),
    'types', (select jsonb_agg(to_jsonb(t) order by t.sort) from fleet_ship_types t),
    'parts', fx_fl_parts(),
    'ships', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'type', s.type, 'parts', s.parts, 'cond', s.cond, 'voyages', s.voyages,
        'stats', fx_fl_stats(s, fl.crew), 'repair', (100 - s.cond) * t.rank * 8,
        'costs', (select jsonb_object_agg(p ->> 'id', case when coalesce((s.parts ->> (p ->> 'id'))::int, 0) >= 5 then null else fx_fl_part_cost(t, p ->> 'id', coalesce((s.parts ->> (p ->> 'id'))::int, 0) + 1) end)
          from jsonb_array_elements(fx_fl_parts()) p),
        'voyage', (select to_jsonb(v) - 'result' || jsonb_build_object('choice', v.result -> 'choice') from fisher_voyages v where v.ship_id = s.id and v.status in ('sea','choice'))
      ) order by t.sort), '[]') from fisher_ships s join fleet_ship_types t on t.id = s.type where s.user_id = u),
    'regions', (select jsonb_agg(jsonb_build_object('id', r.id, 'name', r.name, 'ord', r.ord, 'descr', r.descr, 'diff', r.diff, 'min_rank', r.min_rank,
        'minutes', r.minutes, 'food', r.food, 'species', r.species, 'res', r.res, 'sites', r.sites, 'boss', r.boss - 'reward' || jsonb_build_object('reward', r.boss -> 'reward'),
        'open', x.region is not null, 'found', coalesce(to_jsonb(x.sites), '[]'), 'boss_hp', coalesce(x.boss_hp, (r.boss ->> 'hp')::int), 'boss_dead', coalesce(x.boss_dead, false),
        'visits', coalesce(x.visits, 0)) order by r.ord)
      from fleet_regions r left join fisher_regions x on x.user_id = u and x.region = r.id),
    'spnames', (select jsonb_object_agg(id, jsonb_build_object('name', name, 'rarity', rarity)) from fish_species where id in (select unnest(species) from fleet_regions) or id in (select boss ->> 'fish' from fleet_regions)),
    'log', (select coalesce(jsonb_agg(z order by z.taken_at desc), '[]') from (select v.id, v.region, v.kind, v.taken_at, v.result -> 'log' as log, v.result -> 'sum' as sum, v.result -> 'items' as items, v.result -> 'mats' as mats, v.result -> 'baits' as baits, v.ship_id
      from fisher_voyages v where v.user_id = u and v.status = 'done' order by v.taken_at desc limit 8) z));
end $$;

create or replace function public.fleet_buy(p_type text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; t fleet_ship_types;
begin
  f := fx_fisher(u); perform fx_fleet(u);
  select * into t from fleet_ship_types where id = p_type; if t.id is null then raise exception 'Tundmatu laev'; end if;
  if f.level < t.min_level then raise exception '% avaneb kalapüügi % tasemel', t.name, t.min_level; end if;
  if exists (select 1 from fisher_ships where user_id = u and type = p_type) then raise exception 'See laev on sul juba olemas'; end if;
  perform fx_fl_pay(u, jsonb_build_object('gold', t.price));
  insert into fisher_ships(user_id, type) values (u, p_type);
  return fleet_state() || jsonb_build_object('built', t.name);
end $$;

create or replace function public.fleet_upgrade(p_ship bigint, p_part text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); s fisher_ships; t fleet_ship_types; l int; c jsonb;
begin
  perform fx_fleet(u);
  select * into s from fisher_ships where id = p_ship and user_id = u for update; if s.id is null then raise exception 'Laeva ei leitud'; end if;
  if exists (select 1 from fisher_voyages where ship_id = s.id and status in ('sea','choice')) then raise exception 'Laev on retkel – täiusta, kui ta on sadamas'; end if;
  if not exists (select 1 from jsonb_array_elements(fx_fl_parts()) p where p ->> 'id' = p_part) then raise exception 'Tundmatu laevaosa'; end if;
  select * into t from fleet_ship_types where id = s.type;
  l := coalesce((s.parts ->> p_part)::int, 0) + 1; if l > 5 then raise exception 'See osa on juba parim'; end if;
  c := fx_fl_part_cost(t, p_part, l); perform fx_fl_pay(u, c);
  update fisher_ships set parts = jsonb_set(parts, array[p_part], to_jsonb(l)) where id = s.id;
  return fleet_state() || jsonb_build_object('upgraded', jsonb_build_object('ship', s.id, 'part', p_part, 'lvl', l), 'spent', c);
end $$;

create or replace function public.fleet_repair(p_ship bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); s fisher_ships; t fleet_ship_types; c int;
begin
  select * into s from fisher_ships where id = p_ship and user_id = u for update; if s.id is null then raise exception 'Laeva ei leitud'; end if;
  if exists (select 1 from fisher_voyages where ship_id = s.id and status in ('sea','choice')) then raise exception 'Laev on retkel'; end if;
  if s.cond >= 100 then raise exception 'Laev on juba korras'; end if;
  select * into t from fleet_ship_types where id = s.type; c := (100 - s.cond) * t.rank * 8;
  perform fx_fl_pay(u, jsonb_build_object('gold', c));
  update fisher_ships set cond = 100 where id = s.id;
  return fleet_state() || jsonb_build_object('repaired', c);
end $$;

create or replace function public.fleet_crew(p_role text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); fl fisher_fleet; l int;
begin
  fl := fx_fleet(u);
  if p_role not in ('kapten','tuurimees','kalur') then raise exception 'Tundmatu ametikoht'; end if;
  l := coalesce((fl.crew ->> p_role)::int, 1);
  if l >= 10 then raise exception 'See meeskonnaliige on juba meister'; end if;
  if fl.voyages < l * 2 then raise exception 'Meeskond vajab kogemust: veel % retke', l * 2 - fl.voyages; end if;
  perform fx_fl_pay(u, jsonb_build_object('gold', fx_fl_crew_cost(l)));
  update fisher_fleet set crew = jsonb_set(crew, array[p_role], to_jsonb(l + 1)) where user_id = u;
  return fleet_state() || jsonb_build_object('trained', p_role);
end $$;

create or replace function public.fleet_send(p_ship bigint, p_region text, p_kind text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); fl fisher_fleet; s fisher_ships; t fleet_ship_types; r fleet_regions; x fisher_regions; st jsonb; m int; c jsonb;
begin
  fl := fx_fleet(u);
  select * into s from fisher_ships where id = p_ship and user_id = u for update; if s.id is null then raise exception 'Laeva ei leitud'; end if;
  if exists (select 1 from fisher_voyages where ship_id = s.id and status in ('sea','choice')) then raise exception 'See laev on juba retkel'; end if;
  if s.cond < 25 then raise exception 'Laev on liiga katki – remondi see enne merele minekut'; end if;
  select * into r from fleet_regions where id = p_region; if r.id is null then raise exception 'Tundmatu piirkond'; end if;
  if not fx_fl_open(u, r) then raise exception '% on veel suletud – võida enne eelmise piirkonna boss', r.name; end if;
  select * into t from fleet_ship_types where id = s.type;
  if t.rank < r.min_rank then raise exception '%-sse saab ainult tugevama laevaga (vaja vähemalt: %)', r.name, (select name from fleet_ship_types where rank = r.min_rank); end if;
  select * into x from fisher_regions where user_id = u and region = r.id;
  if p_kind = 'avasta' and coalesce(cardinality(x.sites), 0) >= jsonb_array_length(r.sites) then raise exception 'Kõik % paigad on juba avastatud', r.name; end if;
  if p_kind = 'boss' and (coalesce(cardinality(x.sites), 0) < jsonb_array_length(r.sites) or coalesce(x.boss_dead, false)) then
    raise exception '%', case when coalesce(x.boss_dead, false) then 'See boss on juba võidetud' else 'Bossi pesa leiad, kui oled kõik piirkonna paigad avastanud' end; end if;
  if p_kind not in ('avasta','pyuk','boss','jaht','aare','piraat','kaup','paaste') then raise exception 'Tundmatu retk'; end if;
  if p_kind = 'aare' and coalesce(cardinality(x.sites), 0) < 1 then raise exception 'Aardejahiks avasta enne vähemalt üks paik'; end if;
  st := fx_fl_stats(s, fl.crew); m := fx_fl_minutes(r, p_kind, st);
  c := jsonb_build_object('food', round(r.food * case when p_kind = 'boss' then 1.5 when p_kind in ('jaht', 'piraat') then 1.2 else 1 end)::int);
  if coalesce((s.parts ->> 'mootor')::int, 0) >= 1 then c := c || jsonb_build_object('mats', jsonb_build_object('kask', r.ord * 2)); end if;
  perform fx_fl_pay(u, c);
  insert into fisher_voyages(user_id, ship_id, region, kind, ready_at) values (u, s.id, r.id, p_kind, now() + make_interval(mins => m));
  return fleet_state() || jsonb_build_object('sent', jsonb_build_object('minutes', m, 'region', r.name, 'kind', p_kind, 'cost', c));
end $$;

-- juhuslik kala piirkonnast (haruldasemad harvem; võrgud tõstavad haruldaste võimalust)
create or replace function public.fx_fl_fish(r public.fleet_regions, pyuk numeric, minr int default 1) returns jsonb language sql volatile as $$
  select jsonb_build_object('species', s.id, 'rarity', s.rarity, 'weight', round((s.min_w + (s.max_w - s.min_w) * power(random(), 1.6))::numeric, 3))
  from public.fish_species s where s.id = any(r.species) and s.rarity >= minr
  order by power(random(), 1.0 / ((case s.rarity when 1 then 60 when 2 then 30 when 3 then 12 when 4 then 4 when 5 then 1.2 else 0.4 end)
    * case when s.rarity >= 3 then 1 + pyuk / 60 else 1 end)) desc limit 1 $$;
create or replace function public.fx_fl_add(a jsonb, k text, id text, q numeric) returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(a, '{}'), array[k], coalesce(a -> k, '{}') || jsonb_build_object(id, coalesce((a -> k ->> id)::numeric, 0) + q)) $$;
create or replace function public.fx_fl_log(a jsonb, ic text, t text, tone text default '') returns jsonb language sql immutable as $$
  select jsonb_set(a, '{log}', coalesce(a -> 'log', '[]') || jsonb_build_array(jsonb_build_object('ic', ic, 't', t, 'tone', tone))) $$;
create or replace function public.fx_fl_lose_fish(a jsonb, share numeric) returns jsonb language plpgsql immutable as $$
declare n int := jsonb_array_length(coalesce(a -> 'fish', '[]')); k int;
begin
  k := floor(n * share); if k <= 0 then return a; end if;
  return jsonb_set(a, '{fish}', (select coalesce(jsonb_agg(x), '[]') from (select x from jsonb_array_elements(a -> 'fish') with ordinality e(x, i) where i <= n - k) z))
    || jsonb_build_object('lost', coalesce((a ->> 'lost')::int, 0) + k);
end $$;

-- retke tulemuse veeretamine (ühe korra, kui laev on tagasi)
-- vastase valimine piirkonnast (piirkonna omad 2× sagedamini) ja tema jõud
drop function if exists public.fx_fl_foe(public.fleet_regions);
create or replace function public.fx_fl_foe(r public.fleet_regions, k text default null) returns public.fleet_foes language sql volatile as $$
  select f from public.fleet_foes f where (f.region = r.id or f.region is null) and (k is null or f.kind = k)
  order by random() * case when f.region is null then 1 else 0.5 end limit 1 $$;
create or replace function public.fx_fl_foe_pw(f public.fleet_foes, diff int) returns int language sql immutable as $$ select f.power + f.grow * diff $$;
-- laeva võitlusjõud (kaitse, püük ja kiirus)
create or replace function public.fx_fl_fight(st jsonb) returns numeric language sql immutable as $$
  select (st ->> 'kaitse')::numeric * 1.3 + (st ->> 'pyuk')::numeric * 0.3 + (st ->> 'spd')::numeric * 0.5 $$;
-- vastaste raamat: kohtumised ja võidud
create or replace function public.fx_fl_foe_mark(u uuid, fid text, k text) returns void language sql volatile as $$
  update public.fisher_fleet set foes = jsonb_set(coalesce(foes, '{}'), array[fid], coalesce(foes -> fid, '{}') || jsonb_build_object(k, coalesce((foes -> fid ->> k)::int, 0) + 1))
  where user_id = u $$;
-- vastasega kohtumise valik
drop function if exists public.fx_fl_foe_choice(uuid, public.fleet_regions, jsonb, numeric);
create or replace function public.fx_fl_foe_choice(u uuid, r public.fleet_regions, st jsonb, boost numeric, k text default null) returns jsonb language plpgsql volatile as $$
declare f fleet_foes; pw int;
begin
  f := fx_fl_foe(r, k); if f.id is null then return null; end if;
  pw := round(fx_fl_foe_pw(f, r.diff) * case when boost > 1 then 1.1 else 1 end)::int;
  perform fx_fl_foe_mark(u, f.id, 'seen');
  return jsonb_build_object('ev', 'vastane', 'foe', f.id, 'icon', f.icon, 'pw', pw, 'my', round(fx_fl_fight(st)), 'boost', boost,
    'title', f.name || '!', 'text', f.descr,
    'opts', jsonb_build_array(
      jsonb_build_object('id', 'voitle', 't', 'Võitle', 'd', format('Vastase jõud %s, sinu laeval %s. Võit annab kulda ja haruldasi leide', pw, round(fx_fl_fight(st)))),
      case when f.kind = 'piraat' then jsonb_build_object('id', 'peibuta', 't', 'Maksa lunaraha', 'd', 'Pool saagist läheb piraatidele, aga laev jääb terveks')
        else jsonb_build_object('id', 'peibuta', 't', 'Viska talle kala', 'd', 'Pool saagist läheb, aga laev jääb terveks') end,
      jsonb_build_object('id', 'pogene', 't', 'Põgene', 'd', 'Kiire laev pääseb, aeglane saab pihta')));
end $$;
create or replace function public.fx_fl_roll(u uuid, v public.fisher_voyages) returns jsonb language plpgsql volatile as $$
declare s fisher_ships; fl fisher_fleet; r fleet_regions; x fisher_regions; st jsonb; a jsonb := '{"log":[],"fish":[],"gold":0,"cond":0}';
  n int; i int; k text; sp jsonb; site jsonb; ev text; evs text[] := '{}'; pool text[]; ch boolean := false; hp int; dmg int; fr jsonb;
  diff int; pyuk numeric; avast numeric; vast numeric; kaitse numeric; cap numeric; rng jsonb;
begin
  select * into s from fisher_ships where id = v.ship_id; fl := fx_fleet(u);
  select * into r from fleet_regions where id = v.region; select * into x from fisher_regions where user_id = u and region = r.id;
  st := fx_fl_stats(s, fl.crew); diff := r.diff;
  pyuk := (st ->> 'pyuk')::numeric; avast := (st ->> 'avast')::numeric; vast := (st ->> 'vast')::numeric; kaitse := (st ->> 'kaitse')::numeric; cap := (st ->> 'cap')::numeric;
  a := fx_fl_log(a, 'anchor', format('Laev lahkus sadamast. Siht: %s.', r.name));
  -- peamine eesmärk
  if v.kind = 'avasta' then
    site := (select e from jsonb_array_elements(r.sites) e where not (e ->> 'id' = any(coalesce(x.sites, '{}'))) limit 1);
    if site is not null and random() < least(0.95, 0.55 + avast / 150 - diff * 0.03) then
      a := a || jsonb_build_object('site', site ->> 'id');
      a := fx_fl_log(a, 'map-pin', format('Avastasite uue paiga: %s! %s', site ->> 'name', site ->> 'descr'), 'good');
      a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + coalesce((site -> 'find' ->> 'gold')::int, 0)));
      for k in select jsonb_object_keys(coalesce(site -> 'find' -> 'items', '{}')) loop a := fx_fl_add(a, 'items', k, (site -> 'find' -> 'items' ->> k)::int); end loop;
      for k in select jsonb_object_keys(coalesce(site -> 'find' -> 'baits', '{}')) loop a := fx_fl_add(a, 'baits', k, (site -> 'find' -> 'baits' ->> k)::int); end loop;
    else
      a := fx_fl_log(a, 'cloud', 'Udu ja tuul ajasid laeva kursilt kõrvale – uut paika seekord ei leitud. Parem kompass aitaks.', 'bad');
    end if;
    n := floor(random() * 3)::int;
  elsif v.kind = 'pyuk' then
    n := least(cap, greatest(1, round(cap * (0.5 + 0.5 * random()) * (0.75 + pyuk / 120))))::int;
  elsif v.kind in ('jaht', 'piraat', 'paaste') then
    n := greatest(0, round(cap * 0.3 * random()))::int;
  elsif v.kind = 'kaup' then
    n := least(cap, greatest(1, round(cap * (0.4 + 0.4 * random()) * (0.75 + pyuk / 120))))::int;
  elsif v.kind = 'aare' then
    if random() < least(0.9, 0.45 + avast / 120 - diff * 0.03) then
      i := round(220 * diff * (1 + random() * 1.5))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      for k in select key from jsonb_each(r.res -> 'items') order by random() limit (1 + floor(random() * 2))::int loop a := fx_fl_add(a, 'items', k, 1); end loop;
      if random() < 0.35 then k := (select key from jsonb_each(r.res -> 'baits') limit 1); if k is not null then a := fx_fl_add(a, 'baits', k, 2 + diff); end if; end if;
      a := fx_fl_log(a, 'gem', format('Vana kaardi rist viis kaljuõõnde. Seal oli aardekirst: %s kulda, %s!', i,
        coalesce((select string_agg(lower(it.name), ', ') from jsonb_each_text(a -> 'items') e join fish_items it on it.id = e.key), 'vanad mündid')
        || coalesce(' ja erisöödad (' || (select string_agg(lower(b.name) || ' × ' || e.value, ', ') from jsonb_each_text(a -> 'baits') e join fish_baits b on b.id = e.key) || ')', '')), 'epic');
    else
      i := 6 + diff * 2; a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + i));
      a := fx_fl_log(a, 'triangle-alert', format('Aare oli lõks! Varisev kalju kriimustas laeva (−%s%%). Parem avastamisoskus aitaks õige koha leida.', i), 'bad');
    end if;
    n := floor(random() * 2)::int;
  else
    n := 0;
  end if;
  for i in 1 .. n loop sp := fx_fl_fish(r, pyuk); if sp is not null then a := jsonb_set(a, '{fish}', (a -> 'fish') || jsonb_build_array(sp)); end if; end loop;
  if n > 0 then a := fx_fl_log(a, 'fish', format('Võrkudesse tuli %s kala.', jsonb_array_length(a -> 'fish'))); end if;
  -- ressursid
  if v.kind <> 'boss' then
    for k in select jsonb_object_keys(coalesce(r.res -> 'mats', '{}')) loop
      rng := r.res -> 'mats' -> k; i := round(((rng ->> 0)::int + random() * ((rng ->> 1)::int - (rng ->> 0)::int)) * case when v.kind = 'pyuk' then 1 else 0.6 end)::int;
      if i > 0 then a := fx_fl_add(a, 'mats', k, i); end if;
    end loop;
    for k in select jsonb_object_keys(coalesce(r.res -> 'items', '{}')) loop
      if random() < (r.res -> 'items' ->> k)::numeric then a := fx_fl_add(a, 'items', k, 1); end if;
    end loop;
    for k in select jsonb_object_keys(coalesce(r.res -> 'baits', '{}')) loop
      rng := r.res -> 'baits' -> k; i := round((rng ->> 0)::int + random() * ((rng ->> 1)::int - (rng ->> 0)::int))::int;
      if i > 0 then a := fx_fl_add(a, 'baits', k, i); end if;
    end loop;
  end if;
  -- boss
  if v.kind = 'boss' then
    hp := coalesce(x.boss_hp, (r.boss ->> 'hp')::int);
    dmg := round((kaitse * 2.5 + pyuk * 1.2 + (st ->> 'spd')::numeric * 0.5) * (0.8 + 0.4 * random()))::int;
    a := fx_fl_log(a, 'swords', format('%s tõusis sügavusest! Meeskond ründas harpuunide ja võrkudega: %s kahju.', r.boss ->> 'name', dmg), 'boss');
    a := a || jsonb_build_object('boss_dmg', dmg, 'boss_hp', greatest(0, hp - dmg), 'boss_max', (r.boss ->> 'hp')::int);
    i := round((r.boss ->> 'atk')::numeric * (0.7 + 0.6 * random()) * (1 - least(0.6, vast / 400)))::int;
    a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + i));
    a := fx_fl_log(a, 'shield', format('Boss lõi vastu – laev sai kahjustada (−%s%%).', i), 'bad');
    if hp - dmg <= 0 then
      a := a || jsonb_build_object('boss_dead', true);
      a := fx_fl_log(a, 'crown', format('%s on alistatud! Kogu kuningriik räägib sinu meeskonnast.', r.boss ->> 'name'), 'epic');
      a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + (r.boss -> 'reward' ->> 'gold')::int));
      for k in select jsonb_object_keys(coalesce(r.boss -> 'reward' -> 'items', '{}')) loop a := fx_fl_add(a, 'items', k, (r.boss -> 'reward' -> 'items' ->> k)::int); end loop;
      for k in select jsonb_object_keys(coalesce(r.boss -> 'reward' -> 'mats', '{}')) loop a := fx_fl_add(a, 'mats', k, (r.boss -> 'reward' -> 'mats' ->> k)::int); end loop;
      for k in select jsonb_object_keys(coalesce(r.boss -> 'reward' -> 'baits', '{}')) loop a := fx_fl_add(a, 'baits', k, (r.boss -> 'reward' -> 'baits' ->> k)::int); end loop;
      select jsonb_build_object('species', fs.id, 'rarity', fs.rarity, 'weight', round((fs.max_w * (1.25 + random() * 0.25))::numeric, 3), 'boss', true) into sp from fish_species fs where fs.id = r.boss ->> 'fish';
      if sp is not null then a := jsonb_set(a, '{fish}', (a -> 'fish') || jsonb_build_array(sp)); end if;
      if exists (select 1 from fleet_regions where ord = r.ord + 1) then
        a := fx_fl_log(a, 'map', format('Bossi pesast leiti kaart: avaneb uus piirkond – %s!', (select name from fleet_regions where ord = r.ord + 1)), 'epic');
      end if;
    else
      a := fx_fl_log(a, 'timer', format('Boss põgenes sügavusse. Tal on alles %s / %s elu – tule tagasi!', hp - dmg, r.boss ->> 'hp'));
    end if;
  end if;
  -- väga harva: Sügavuste Valitseja tõuseb laeva kõrvale (igas piirkonnas)
  if v.kind <> 'boss' and random() < 0.04 then
    ch := true; evs := evs || 'valitseja'::text;
    a := a || jsonb_build_object('choice', jsonb_build_object('ev', 'valitseja', 'title', 'Sügavuste Valitseja!',
      'text', 'Vesi muutus mustaks ja laeva kõrvale tõusis hiiglaslik madu, kelle kehal helendavad sinised märgid. Ta vaatab kaptenit ja ootab.',
      'opts', jsonb_build_array(
        jsonb_build_object('id', 'austa', 't', 'Anna talle andam', 'd', 'Ta võtab osa saagist ja võib vastu kinkida midagi haruldast'),
        jsonb_build_object('id', 'voitle', 't', 'Esita väljakutse', 'd', 'Väga ohtlik! Ainult tugeva kaitsega laev võib ta võita'),
        jsonb_build_object('id', 'pogene', 't', 'Pööra laev ümber', 'd', 'Osa saagist kukub kiirustades üle parda'))));
    a := fx_fl_log(a, 'crown', 'Sügavuste Valitseja tõusis veest! Kapten ootab sinu otsust.', 'choice');
  end if;
  -- koletisejaht: vastane tuleb kindlasti (tugevam, aga auhinnad 1,6×)
  if v.kind = 'jaht' and not ch then
    fr := fx_fl_foe_choice(u, r, st, 1.6, 'koletis');
    if fr is not null then ch := true; evs := evs || 'vastane'::text; a := a || jsonb_build_object('choice', fr);
      a := fx_fl_log(a, fr ->> 'icon', format('Jäljed viisid pesani. Vastu tuli %s!', fr ->> 'title'), 'choice'); end if;
  end if;
  -- piraadijaht: ainult piraadid (auhinnad 1,6×)
  if v.kind = 'piraat' and not ch then
    fr := fx_fl_foe_choice(u, r, st, 1.6, 'piraat');
    if fr is not null then ch := true; evs := evs || 'vastane'::text; a := a || jsonb_build_object('choice', fr);
      a := fx_fl_log(a, fr ->> 'icon', format('Silmapiiril must lipp! Vastu tuli %s.', fr ->> 'title'), 'choice'); end if;
  end if;
  -- kaubareis: kaupmees tuleb kindlasti ja maksab paremini
  if v.kind = 'kaup' and not ch then
    ch := true; evs := evs || 'kaupmees'::text;
    a := a || jsonb_build_object('choice', jsonb_build_object('ev', 'kaupmees', 'mult', 1.6, 'title', 'Kaubasadam!', 'text', 'Laev jõudis kirevasse kaubasadamasse. Kaupmehed tunglevad: „Ostame kala ja müüme haruldasi asju!“',
      'opts', jsonb_build_array(jsonb_build_object('id', 'myy', 't', 'Müü pool saagist', 'd', 'Kaupmehed maksavad kala eest 60% rohkem kui turg'),
        jsonb_build_object('id', 'osta', 't', format('Osta haruldasi asju (%s kulda)', 150 * diff), 'd', 'Erisöödad ja võib-olla mõni haruldane ese'),
        jsonb_build_object('id', 'jata', 't', 'Sõida tagasi', 'd', 'Midagi ei muutu'))));
    a := fx_fl_log(a, 'coins', 'Kaubasadam! Kapten ootab sinu otsust.', 'choice');
  end if;
  -- päästeretk: hädasolijad leitakse kindlasti ja nad on peaaegu alati tänulikud
  if v.kind = 'paaste' and not ch then
    ch := true; evs := evs || 'merehada'::text;
    a := a || jsonb_build_object('choice', jsonb_build_object('ev', 'merehada', 'sure', true, 'title', 'Meremehed parvel!', 'text', 'Pärast pikka otsimist leidis laev parve, millel lehvitavad vrakist pääsenud meremehed.',
      'opts', jsonb_build_array(jsonb_build_object('id', 'paasta', 't', 'Päästa nad', 'd', 'Tänulikud meremehed annavad kulda või näitavad peidetud paika'),
        jsonb_build_object('id', 'jata', 't', 'Sõida mööda', 'd', 'Midagi ei muutu'))));
    a := fx_fl_log(a, 'users', 'Meremehed leitud! Kapten ootab sinu otsust.', 'choice');
  end if;
  -- juhuslikud sündmused (1–2, kõige rohkem üks valikuga)
  pool := array['torm','torm','kirst','vrakk','saar','koletis','haruldane','kaart','parv','linnud','vaikus','kaupmees','piraadid','merehada','nakk','vastane','vastane']
    || case r.id when 'metsajarv' then array['kobras','kobras'] when 'sugavjarv' then array['keeris','keeris'] when 'udusoo' then array['virvatuli','virvatuli']
                 when 'kulmajarv' then array['jaamagi','virmalised'] when 'tulejarv' then array['vulkaan','vulkaan'] else '{}'::text[] end;
  for i in 1 .. (1 + case when random() < 0.55 then 1 else 0 end) loop
    ev := pool[1 + floor(random() * array_length(pool, 1))::int];
    if ev = any(evs) or (ev in ('vrakk','saar','koletis','kaupmees','piraadid','merehada','nakk','virvatuli','vastane') and ch) or v.kind = 'boss' and ev in ('koletis','parv','linnud','kaupmees','piraadid','merehada','nakk','virvatuli','vastane') then continue; end if;
    evs := evs || ev;
    if ev = 'torm' then
      k := round((6 + diff * 3) * (1 - least(0.6, vast / 250)) * (0.6 + random() * 0.8))::text;
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + k::int));
      a := fx_fl_log(a, 'cloud-lightning', format('Torm! Lained peksid üle teki, laev sai kahjustada (−%s%%).', k), 'bad');
      if jsonb_array_length(a -> 'fish') > 3 and random() < 0.3 - least(0.2, vast / 1000) then a := fx_fl_lose_fish(a, 0.2); a := fx_fl_log(a, 'fish', 'Osa saagist uhtus üle parda.', 'bad'); end if;
    elsif ev = 'kirst' then
      i := round(100 * diff * (1 + random() * 2))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      k := (select key from jsonb_each(r.res -> 'items') order by random() limit 1);
      if k is not null and random() < 0.5 then a := fx_fl_add(a, 'items', k, 1); end if;
      a := fx_fl_log(a, 'gem', format('Võrku jäi vana aardekirst! Sees oli %s kulda%s.', i, case when k is not null and a -> 'items' ? k then ' ja midagi säravat' else '' end), 'good');
    elsif ev = 'haruldane' then
      sp := fx_fl_fish(r, pyuk + 60, 3);
      if sp is not null then a := jsonb_set(a, '{fish}', (a -> 'fish') || jsonb_build_array(sp || '{"rare":true}'));
        a := fx_fl_log(a, 'sparkles', format('Haruldane leid! Võrku sattus %s.', (select lower(name) from fish_species where id = sp ->> 'species')), 'epic'); end if;
    elsif ev = 'kaart' then
      site := (select e from jsonb_array_elements(r.sites) e where not (e ->> 'id' = any(coalesce(x.sites, '{}'))) and e ->> 'id' is distinct from a ->> 'site' limit 1);
      if site is not null then a := a || jsonb_build_object('site2', site ->> 'id');
        a := fx_fl_log(a, 'map', format('Pudelist leiti kadunud kaart! See näitab teed paika „%s“ – see on nüüd avastatud.', site ->> 'name'), 'good');
      else i := 150 * diff; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i)); a := fx_fl_log(a, 'map', format('Pudelist leiti vana kaart. Kaardikoguja ostis selle %s kulla eest.', i), 'good'); end if;
    elsif ev = 'parv' then
      k := (1 + floor(random() * 3))::int::text;
      for n in 1 .. k::int loop sp := fx_fl_fish(r, pyuk); if sp is not null then a := jsonb_set(a, '{fish}', (a -> 'fish') || jsonb_build_array(sp)); end if; end loop;
      a := fx_fl_log(a, 'fish', format('Kalaparv järgnes laevale! Võrku tuli veel %s kala.', k), 'good');
    elsif ev = 'linnud' then
      sp := fx_fl_fish(r, pyuk + 30, case when random() < 0.25 then 2 else 1 end);
      if sp is not null then a := jsonb_set(a, '{fish}', (a -> 'fish') || jsonb_build_array(sp)); end if;
      i := round(30 * diff * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      a := fx_fl_log(a, 'wind', format('Kajakad tiirlesid ühe koha kohal – seal oli kala! Lisaks leiti vee pealt hulpimas kukkur %s kullaga.', i), 'good');
    elsif ev = 'vaikus' then
      i := 4 + floor(random() * 5)::int; a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int - i));
      a := fx_fl_log(a, 'wrench', format('Täielik tuulevaikus. Meeskond kasutas aega ja lappis laeva (+%s%%).', i), 'good');
    elsif ev = 'kobras' then
      i := round(60 + random() * 120)::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i)); a := fx_fl_add(a, 'items', 'karp', 1);
      a := fx_fl_log(a, 'tree-pine', format('Kopratammi vahelt leiti vana kalurikarp ja %s kulda. Kobras vaatas pahaselt pealt.', i), 'good');
    elsif ev = 'keeris' then
      if (st ->> 'spd')::numeric * (0.5 + random()) >= 14 then
        sp := fx_fl_fish(r, pyuk + 50, 3);
        if sp is not null then a := jsonb_set(a, '{fish}', (a -> 'fish') || jsonb_build_array(sp || '{"rare":true}')); end if;
        a := fx_fl_log(a, 'waves', 'Laev sattus keerisesse, kuid kiire laev pääses välja – ja keeris paiskas pardale haruldase süvakala!', 'epic');
      else
        i := 8 + floor(random() * 7)::int; a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + i));
        a := fx_fl_log(a, 'waves', format('Keeris haaras laeva ja keerutas seda tükk aega (−%s%%). Kiirem laev pääseks välja.', i), 'bad');
      end if;
    elsif ev = 'jaamagi' then
      i := round((8 + diff * 2) * (1 - least(0.6, vast / 250)) * (0.6 + random() * 0.8))::int; a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + i));
      if random() < 0.5 then a := fx_fl_add(a, 'items', 'kristall', 1); end if;
      a := fx_fl_log(a, 'triangle-alert', format('Jäämägi kriipis laeva külge (−%s%%).%s', i, case when a -> 'items' ? 'kristall' then ' Meeskond murdis jääst lahti sädeleva kristalli!' else '' end), 'bad');
    elsif ev = 'virmalised' then
      a := a || jsonb_build_object('xpmul', 2);
      a := fx_fl_log(a, 'sparkles', 'Taevas lõid põlema virmalised. Meeskond jäi neid imetlema ja sai uut jõudu – selle retke kogemus on kahekordne!', 'epic');
    elsif ev = 'vulkaan' then
      i := 6 + floor(random() * 7)::int; a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + i));
      a := fx_fl_add(a, 'mats', 'kuldsoomus', 1 + floor(random() * 2)::int); if random() < 0.5 then a := fx_fl_add(a, 'mats', 'iidneluu', 1); end if;
      a := fx_fl_log(a, 'flame', format('Veealune vulkaan purskas! Kuum vesi kõrvetas laeva (−%s%%), aga laavast kerkisid kuldsed soomused.', i));
    elsif ev = 'vastane' then
      fr := fx_fl_foe_choice(u, r, st, 1);
      if fr is not null then ch := true; a := a || jsonb_build_object('choice', fr);
        a := fx_fl_log(a, fr ->> 'icon', format('%s Kapten ootab sinu otsust.', fr ->> 'title'), 'choice'); end if;
    elsif ev in ('kaupmees','piraadid','merehada','nakk','virvatuli') then
      ch := true;
      a := a || jsonb_build_object('choice', case ev
        when 'kaupmees' then jsonb_build_object('ev', 'kaupmees', 'title', 'Kaupmehe laev!', 'text', 'Kõrvale sõitis värviliste purjedega kaubalaev. Kaupmees hõikab: „Ostan kala ja müün haruldasi asju!“',
          'opts', jsonb_build_array(jsonb_build_object('id', 'myy', 't', 'Müü pool saagist', 'd', 'Kaupmees maksab kala eest 30% rohkem kui turg'),
            jsonb_build_object('id', 'osta', 't', format('Osta haruldasi asju (%s kulda)', 150 * diff), 'd', 'Erisöödad ja võib-olla mõni haruldane ese'),
            jsonb_build_object('id', 'jata', 't', 'Sõida edasi', 'd', 'Midagi ei muutu')))
        when 'piraadid' then jsonb_build_object('ev', 'piraadid', 'title', 'Piraadid!', 'text', 'Musta lipuga laev lõikab tee ette. Piraatide kapten nõuab osa saagist.',
          'opts', jsonb_build_array(jsonb_build_object('id', 'voitle', 't', 'Võitle', 'd', 'Kaitse ja kiirus aitavad – võit annab piraatide aarde'),
            jsonb_build_object('id', 'maksa', 't', 'Anna osa saagist', 'd', 'Piraadid võtavad umbes kolmandiku kaladest'),
            jsonb_build_object('id', 'pogene', 't', 'Põgene', 'd', 'Kiire laev pääseb, aeglane saab pihta')))
        when 'merehada' then jsonb_build_object('ev', 'merehada', 'title', 'Meremehed parvel!', 'text', 'Lainetel hulbib parv, millel lehvitavad vrakist pääsenud meremehed.',
          'opts', jsonb_build_array(jsonb_build_object('id', 'paasta', 't', 'Päästa nad', 'd', 'Tänulikud meremehed võivad midagi vastu anda'),
            jsonb_build_object('id', 'jata', 't', 'Sõida mööda', 'd', 'Midagi ei muutu')))
        when 'nakk' then jsonb_build_object('ev', 'nakk', 'title', 'Näkineiu laul!', 'text', 'Kaljult kostab imeilus laul. Meeskond hakkab laeva tahtmatult kaljude poole juhtima.',
          'opts', jsonb_build_array(jsonb_build_object('id', 'kuula', 't', 'Lase laul lõpuni kõlada', 'd', 'Näkk võib kinkida pärleid – või juhtida laeva kaljudele'),
            jsonb_build_object('id', 'vaha', 't', 'Pane meeskonnale vaha kõrvu', 'd', 'Ohutu')))
        else jsonb_build_object('ev', 'virvatuli', 'title', 'Virvatuli!', 'text', 'Udu sees hõljub sinine tuluke, nagu kutsuks see kuhugi.',
          'opts', jsonb_build_array(jsonb_build_object('id', 'jargne', 't', 'Järgne tulukesele', 'd', 'See võib viia peidetud paika – või soosse'),
            jsonb_build_object('id', 'jata', 't', 'Ära järgne', 'd', 'Ohutu')))
        end);
      a := fx_fl_log(a, case ev when 'kaupmees' then 'coins' when 'piraadid' then 'skull' when 'merehada' then 'users' when 'nakk' then 'moon' else 'sparkles' end, (a -> 'choice' ->> 'title') || ' Kapten ootab sinu otsust.', 'choice');
    else
      ch := true;
      a := a || jsonb_build_object('choice', case ev
        when 'vrakk' then jsonb_build_object('ev', 'vrakk', 'title', 'Laevavrakk!', 'text', 'Madalikul lebab vana laevavrakk. Selle lastiruumis võib olla aardeid – või võib see kokku variseda.',
          'opts', jsonb_build_array(jsonb_build_object('id', 'uuri', 't', 'Uuri vrakki', 'd', 'Võimalik aare, aga laev võib kahjustada saada'), jsonb_build_object('id', 'jata', 't', 'Sõida mööda', 'd', 'Ohutu')))
        when 'saar' then jsonb_build_object('ev', 'saar', 'title', 'Salajane saar!', 'text', 'Udust kerkis saar, mida pole üheski kaardis. Kas maabute?',
          'opts', jsonb_build_array(jsonb_build_object('id', 'maabu', 't', 'Maabu saarel', 'd', 'Leiud ja erisöödad, kuid saarel võib keegi elada'), jsonb_build_object('id', 'jatka', 't', 'Jätka teekonda', 'd', 'Ohutu')))
        else jsonb_build_object('ev', 'koletis', 'title', 'Merekoletis ründab!', 'text', 'Vesi laeva ümber hakkab keema ja sügavusest tõuseb hiiglaslik kombits.',
          'opts', jsonb_build_array(jsonb_build_object('id', 'voitle', 't', 'Võitle', 'd', 'Võit annab haruldasi materjale – kaitsevõime aitab'), jsonb_build_object('id', 'pogene', 't', 'Põgene', 'd', 'Osa saagist läheb kaotsi')))
        end);
      a := fx_fl_log(a, case ev when 'vrakk' then 'anchor' when 'saar' then 'tree-pine' else 'triangle-alert' end, (a -> 'choice' ->> 'title') || ' Kapten ootab sinu otsust.', 'choice');
    end if;
  end loop;
  -- tavaline kulumine
  a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + round((2 + diff * 2) * (0.6 + random() * 0.8) * (1 - least(0.5, vast / 300)))::int));
  a := a || jsonb_build_object('xp', round(10 * diff * case v.kind when 'boss' then 3 when 'avasta' then 2 else 1 end * coalesce((a ->> 'xpmul')::numeric, 1))::int);
  return a;
end $$;
create or replace function public.fx_fl_choose(u uuid, v public.fisher_voyages, a jsonb, c text) returns jsonb language plpgsql volatile as $$
declare s fisher_ships; fl fisher_fleet; r fleet_regions; x fisher_regions; st jsonb; ev text := a -> 'choice' ->> 'ev'; i int; k text; site jsonb; m int; cost int; fo fleet_foes; pw int; bo numeric;
begin
  if not exists (select 1 from jsonb_array_elements(a -> 'choice' -> 'opts') o where o ->> 'id' = c) then raise exception 'Vali üks pakutud võimalustest'; end if;
  select * into s from fisher_ships where id = v.ship_id; fl := fx_fleet(u); st := fx_fl_stats(s, fl.crew);
  select * into r from fleet_regions where id = v.region; select * into x from fisher_regions where user_id = u and region = r.id;
  a := a || jsonb_build_object('chose', c);
  if ev = 'vrakk' and c = 'uuri' then
    if random() < 0.55 + (st ->> 'avast')::numeric / 200 then
      i := round(300 * r.diff * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      k := (array['parl','sormus','merevaik','koopakristall'])[1 + floor(random() * 4)::int]; a := fx_fl_add(a, 'items', k, 1);
      a := fx_fl_log(a, 'gem', format('Sukelduja tõi vrakist välja %s kulda ja eseme: %s!', i, (select name from fish_items where id = k)), 'epic');
    else
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 12)); a := fx_fl_log(a, 'triangle-alert', 'Vrakk varises kokku ja kriimustas laeva (−12%). Seekord jäi aare leidmata.', 'bad');
    end if;
  elsif ev = 'saar' and c = 'maabu' then
    if random() < 0.7 then
      k := (select key from jsonb_each(r.res -> 'baits') order by random() limit 1);
      if k is not null then a := fx_fl_add(a, 'baits', k, 2 + r.diff); end if;
      a := fx_fl_add(a, 'mats', 'soomus', 2 + r.diff);
      site := (select e from jsonb_array_elements(r.sites) e where not (e ->> 'id' = any(coalesce(x.sites, '{}'))) and e ->> 'id' is distinct from a ->> 'site' and e ->> 'id' is distinct from a ->> 'site2' limit 1);
      if site is not null and random() < 0.5 then a := a || jsonb_build_object('site3', site ->> 'id'); end if;
      a := fx_fl_log(a, 'tree-pine', format('Saarelt leiti erisööta ja kalasoomuseid%s.', case when site is not null and a ? 'site3' then format(' ning vana rada, mis viis paika „%s“', site ->> 'name') else '' end), 'good');
    else
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 10)); a := fx_fl_log(a, 'triangle-alert', 'Saarel elas tige hiidkrabi – meeskond põgenes paati tagasi (−10%).', 'bad');
    end if;
  elsif ev = 'koletis' and c = 'voitle' then
    if (st ->> 'kaitse')::numeric * (0.6 + random() * 0.8) >= 5 * r.diff + 2 then
      i := round(200 * r.diff * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      a := fx_fl_add(a, 'mats', 'kuldsoomus', 1 + floor(random() * 2)::int);
      a := fx_fl_log(a, 'swords', format('Võit! Koletis taganes ja jättis maha kuldseid soomuseid. Lisaks leiti %s kulda.', i), 'epic');
    else
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 18 + r.diff * 4)); a := fx_fl_lose_fish(a, 0.3);
      a := fx_fl_log(a, 'triangle-alert', 'Koletis oli liiga tugev. Laev sai pihta ja osa saagist läks kaotsi. Parem kaitsesüsteem aitaks.', 'bad');
    end if;
  elsif ev = 'valitseja' and c = 'austa' then
    a := fx_fl_lose_fish(a, 0.4);
    i := round(400 * r.diff * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
    a := fx_fl_add(a, 'items', 'mustparl', 1); a := fx_fl_add(a, 'baits', 'valgus', 3 + r.diff);
    a := fx_fl_log(a, 'crown', format('Valitseja võttis andami vastu ja vajus vaikselt sügavusse. Laeva kõrvale jäi ujuma %s kulda, must pärl ja helendavad söödad.', i), 'epic');
  elsif ev = 'valitseja' and c = 'voitle' then
    if (st ->> 'kaitse')::numeric * (0.6 + random() * 0.8) >= 34 + 2 * r.diff then
      i := round(1500 * r.diff * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      a := fx_fl_add(a, 'mats', 'kuldsoomus', 3); a := fx_fl_add(a, 'items', 'mustparl', 2);
      if random() < 0.5 then
        a := jsonb_set(a, '{fish}', (a -> 'fish') || jsonb_build_array(jsonb_build_object('species', 'sygavvalitseja', 'rarity', 6, 'weight', round((90 + random() * 330)::numeric, 2), 'boss', true)));
        a := fx_fl_log(a, 'crown', format('Uskumatu! Meeskond võitis Sügavuste Valitseja ja vedas ta pardale! Lisaks %s kulda ja kuldseid soomuseid.', i), 'epic');
      else
        a := fx_fl_log(a, 'swords', format('Võit! Valitseja taganes sügavusse ja jättis maha %s kulda, kuldseid soomuseid ja mustad pärlid.', i), 'epic');
      end if;
    else
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 30)); a := fx_fl_lose_fish(a, 0.5);
      a := fx_fl_log(a, 'triangle-alert', 'Valitseja oli liiga võimas. Tema saba tabas laeva (−30%) ja pool saagist läks kaotsi. Tugevam kaitse aitaks.', 'bad');
    end if;
  elsif ev = 'valitseja' then
    a := fx_fl_lose_fish(a, 0.15); a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 6));
    a := fx_fl_log(a, 'wind', 'Laev pööras ümber ja põgenes. Valitseja vaatas järele, aga ei järgnenud.');
  elsif ev = 'koletis' then
    a := fx_fl_lose_fish(a, 0.3); a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 4));
    a := fx_fl_log(a, 'wind', 'Laev põgenes täispurjes. Kiirustades kukkus osa saagist üle parda.');
  elsif ev = 'kaupmees' and c = 'myy' then
    m := jsonb_array_length(a -> 'fish') / 2;
    if m < 1 then a := fx_fl_log(a, 'coins', 'Võrgud olid veel tühjad – kaupmehele polnud midagi müüa.');
    else
      select coalesce(round(sum(fs.price * greatest(0.5, (q.e ->> 'weight')::numeric / greatest(0.01, fs.max_w)) * 1.3)), 0)::int into i
        from jsonb_array_elements(a -> 'fish') with ordinality q(e, o) join fish_species fs on fs.id = q.e ->> 'species' where q.o <= m and not coalesce((q.e ->> 'boss')::boolean, false);
      i := round(i / 1.3 * coalesce((a -> 'choice' ->> 'mult')::numeric, 1.3))::int;
      a := jsonb_set(a, '{fish}', coalesce((select jsonb_agg(q.e order by q.o) from jsonb_array_elements(a -> 'fish') with ordinality q(e, o) where q.o > m or coalesce((q.e ->> 'boss')::boolean, false)), '[]'::jsonb));
      a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      a := fx_fl_log(a, 'coins', format('Kaupmees ostis pool saagist ja maksis %s kulda.', i), 'good');
    end if;
  elsif ev = 'kaupmees' and c = 'osta' then
    cost := 150 * r.diff;
    update fishers set gold = gold - cost where user_id = u and gold >= cost;
    if found then
      k := (select key from jsonb_each(r.res -> 'baits') limit 1); if k is not null then a := fx_fl_add(a, 'baits', k, 3 + r.diff); end if;
      i := 0; if random() < 0.45 then k := (select key from jsonb_each(r.res -> 'items') order by random() limit 1); if k is not null then a := fx_fl_add(a, 'items', k, 1); i := 1; end if; end if;
      a := fx_fl_log(a, 'shopping-bag', format('Ostsid kaupmehelt %s kulla eest erisöötasid%s.', cost, case when i = 1 then ' ja haruldase eseme' else '' end), 'good');
    else
      a := fx_fl_log(a, 'coins', 'Kalurikassas polnud piisavalt raha. Kaupmees kehitas õlgu ja sõitis edasi.', 'bad');
    end if;
  elsif ev = 'piraadid' and c = 'voitle' then
    if (st ->> 'kaitse')::numeric * (0.6 + random() * 0.8) + (st ->> 'spd')::numeric * 0.3 >= 12 + 6 * r.diff then
      i := round(250 * r.diff * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      if random() < 0.4 then a := fx_fl_add(a, 'items', 'sormus', 1); end if;
      a := fx_fl_log(a, 'swords', format('Võit! Piraadid põgenesid ja jätsid maha oma aardekasti: %s kulda%s.', i, case when a -> 'items' ? 'sormus' then ' ja kuldsõrmuse' else '' end), 'epic');
    else
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 18)); a := fx_fl_lose_fish(a, 0.4);
      a := fx_fl_log(a, 'skull', 'Piraadid olid tugevamad. Laev sai pihta (−18%) ja nad viisid suure osa saagist. Tugevam kaitse aitaks.', 'bad');
    end if;
  elsif ev = 'piraadid' and c = 'maksa' then
    a := fx_fl_lose_fish(a, 0.35);
    a := fx_fl_log(a, 'skull', 'Piraadid võtsid osa saagist ja lasid laeva rahus edasi sõita.');
  elsif ev = 'piraadid' then
    if (st ->> 'spd')::numeric * (0.5 + random()) >= 10 + 4 * r.diff then
      a := fx_fl_log(a, 'wind', 'Täispurjes! Kiire laev jättis piraadid kaugele maha.', 'good');
    else
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 10)); a := fx_fl_lose_fish(a, 0.2);
      a := fx_fl_log(a, 'skull', 'Piraadid jõudsid järele ja tulistasid laeva (−10%). Osa saagist kukkus üle parda.', 'bad');
    end if;
  elsif ev = 'merehada' and c = 'paasta' then
    if random() < (case when (a -> 'choice' ->> 'sure')::boolean then 0.95 else 0.8 end) then
      site := (select e from jsonb_array_elements(r.sites) e where not (e ->> 'id' = any(coalesce(x.sites, '{}'))) and e ->> 'id' is distinct from a ->> 'site' limit 1);
      if site is not null and random() < (case when (a -> 'choice' ->> 'sure')::boolean then 0.7 else 0.5 end) then
        a := a || jsonb_build_object('site2', site ->> 'id');
        a := fx_fl_log(a, 'map', format('Tänulikud meremehed näitasid teed paika „%s“ – see on nüüd avastatud!', site ->> 'name'), 'epic');
      else
        i := round(120 * r.diff * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
        a := fx_fl_log(a, 'heart', format('Meremehed tänasid ja andsid oma viimase kulla: %s. Meeskond tundis end hästi.', i), 'good');
      end if;
    else
      a := fx_fl_lose_fish(a, 0.25);
      a := fx_fl_log(a, 'skull', 'Need olid hoopis maskeerunud piraadid! Öösel viisid nad osa saagist ja kadusid.', 'bad');
    end if;
  elsif ev = 'nakk' and c = 'kuula' then
    if random() < 0.5 then
      a := fx_fl_add(a, 'items', case when random() < 0.25 then 'mustparl' else 'parl' end, 1);
      i := round(80 * r.diff * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
      a := fx_fl_log(a, 'gem', format('Näkk lõpetas laulu ja viskas laevale pärli ning %s kulda. „Ilusat teed, kalurid!“', i), 'epic');
    else
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 20));
      a := fx_fl_log(a, 'triangle-alert', 'Laul oli nii ilus, et keegi ei märganud kaljusid. Laev sai tugevasti pihta (−20%).', 'bad');
    end if;
  elsif ev = 'nakk' then
    a := fx_fl_log(a, 'shield', 'Meeskond pani vaha kõrvu ja sõitis kaljudest ohutult mööda.');
  elsif ev = 'virvatuli' and c = 'jargne' then
    if random() < 0.6 then
      site := (select e from jsonb_array_elements(r.sites) e where not (e ->> 'id' = any(coalesce(x.sites, '{}'))) and e ->> 'id' is distinct from a ->> 'site' limit 1);
      if site is not null then a := a || jsonb_build_object('site2', site ->> 'id');
        a := fx_fl_log(a, 'sparkles', format('Virvatuli viis peidetud paika „%s“ – see on nüüd avastatud!', site ->> 'name'), 'epic');
      else a := fx_fl_add(a, 'items', 'ruun', 1);
        a := fx_fl_log(a, 'sparkles', 'Virvatuli kustus vana kivi kohal. Kivi alt leiti iidne ruun!', 'epic'); end if;
    else
      a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + 12)); a := fx_fl_lose_fish(a, 0.15);
      a := fx_fl_log(a, 'triangle-alert', 'Tuluke kadus ja laev sõitis mutta kinni (−12%). Välja pääsemiseks tuli osa lasti maha visata.', 'bad');
    end if;
  elsif ev = 'vastane' then
    select * into fo from fleet_foes where id = a -> 'choice' ->> 'foe';
    pw := coalesce((a -> 'choice' ->> 'pw')::int, 20); bo := coalesce((a -> 'choice' ->> 'boost')::numeric, 1);
    if c = 'peibuta' and jsonb_array_length(a -> 'fish') = 0 then c := 'pogene'; a := fx_fl_log(a, 'fish', 'Võrgud olid tühjad – polnud midagi visata! Tuli põgeneda.'); end if;
    if c = 'voitle' then
      if fx_fl_fight(st) * (0.6 + random() * 0.8) >= pw then
        i := round(fo.gold * case when fo.region is null then r.diff else 1 end * bo * (1 + random()))::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
        for k in select jsonb_object_keys(coalesce(fo.loot -> 'mats', '{}')) loop
          m := round(((fo.loot -> 'mats' -> k ->> 0)::int + random() * ((fo.loot -> 'mats' -> k ->> 1)::int - (fo.loot -> 'mats' -> k ->> 0)::int)) * bo)::int;
          if m > 0 then a := fx_fl_add(a, 'mats', k, m); end if;
        end loop;
        for k in select jsonb_object_keys(coalesce(fo.loot -> 'items', '{}')) loop
          if random() < least(1, (fo.loot -> 'items' ->> k)::numeric * bo) then a := fx_fl_add(a, 'items', k, 1); end if;
        end loop;
        if random() < 0.2 * bo then site := fx_fl_fish(r, (st ->> 'pyuk')::numeric + 80, 3); if site is not null then a := jsonb_set(a, '{fish}', (a -> 'fish') || jsonb_build_array(site || '{"rare":true}')); end if; end if;
        perform fx_fl_foe_mark(u, fo.id, 'won');
        a := fx_fl_log(a, 'swords', format('Võit! %s on alistatud. Saak: %s kulda ja trofeed%s.', fo.name, i, case when site is not null then case when fo.kind = 'piraat' then ' – piraatide trümmist leiti ka haruldane kala' else ' – pesast leiti ka haruldane kala' end else '' end), 'epic');
      else
        i := fo.atk + case when fo.region is null then 2 * r.diff else 0 end; a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + i)); a := fx_fl_lose_fish(a, 0.3);
        a := fx_fl_log(a, 'triangle-alert', format('%s oli tugevam. Laev sai pihta (−%s%%) ja osa saagist läks kaotsi. Tugevam kaitse aitaks.', fo.name, i), 'bad');
      end if;
    elsif c = 'peibuta' then
      a := fx_fl_lose_fish(a, 0.5);
      if random() < 0.3 then i := round(fo.gold * 0.3)::int; a := jsonb_set(a, '{gold}', to_jsonb((a ->> 'gold')::int + i));
        a := fx_fl_log(a, 'fish', format('%s haaras kalad ja kadus. Tema pesast kerkis pinnale %s kulda!', fo.name, i), 'good');
      else a := fx_fl_log(a, 'fish', format('Meeskond viskas pool saagist üle parda. %s sööstis kaladele järele ja laev pääses.', fo.name)); end if;
    else
      if (st ->> 'spd')::numeric * (0.5 + random()) >= pw * 0.35 then
        a := fx_fl_log(a, 'wind', format('Täispurjes minema! %s jäi maha.', fo.name), 'good');
      else
        i := ceil((fo.atk + case when fo.region is null then 2 * r.diff else 0 end) / 2.0)::int; a := jsonb_set(a, '{cond}', to_jsonb((a ->> 'cond')::int + i));
        a := fx_fl_log(a, 'triangle-alert', format('%s jõudis järele ja ründas (−%s%%). Kiirem laev pääseks.', fo.name, i), 'bad');
      end if;
    end if;
  elsif ev in ('kaupmees','merehada','virvatuli') then
    a := fx_fl_log(a, 'compass', 'Kapten otsustas edasi sõita.');
  else
    a := fx_fl_log(a, 'compass', 'Kapten otsustas ohutult edasi sõita.');
  end if;
  return a;
end $$;
-- auhinnad välja (üks kord)
create or replace function public.fx_fl_grant(u uuid, v public.fisher_voyages, a jsonb) returns jsonb language plpgsql volatile as $$
declare r fleet_regions; sp jsonb; k text; s fisher_ships; nc int; v_sites text[] := '{}'; sm jsonb;
begin
  select * into r from fleet_regions where id = v.region; select * into s from fisher_ships where id = v.ship_id for update;
  for sp in select x from jsonb_array_elements(coalesce(a -> 'fish', '[]')) x loop
    insert into fish_catches(user_id, species, rarity, weight, spot, expedition) values (u, sp ->> 'species', (sp ->> 'rarity')::int, (sp ->> 'weight')::numeric, r.spot, r.id);
  end loop;
  if (a ->> 'gold')::int > 0 then update fishers set gold = gold + (a ->> 'gold')::int where user_id = u; end if;
  for k in select jsonb_object_keys(coalesce(a -> 'items', '{}')) loop perform fx_give_item(u, k, (a -> 'items' ->> k)::int); end loop;
  for k in select jsonb_object_keys(coalesce(a -> 'mats', '{}')) loop perform fx_mat_add(u, k, (a -> 'mats' ->> k)::int); end loop;
  for k in select jsonb_object_keys(coalesce(a -> 'baits', '{}')) loop
    update fishers set baits = jsonb_set(coalesce(baits, '{}'), array[k], to_jsonb(coalesce((baits ->> k)::int, 0) + (a -> 'baits' ->> k)::int)) where user_id = u;
  end loop;
  perform fx_add_xp(u, (a ->> 'xp')::int + jsonb_array_length(coalesce(a -> 'fish', '[]')) * 2);
  nc := least(100, greatest(0, s.cond - (a ->> 'cond')::int));
  update fisher_ships set cond = nc, voyages = voyages + 1 where id = s.id;
  update fisher_fleet set voyages = voyages + 1 where user_id = u;
  if a ? 'site' then v_sites := v_sites || (a ->> 'site'); end if;
  if a ? 'site2' then v_sites := v_sites || (a ->> 'site2'); end if;
  if a ? 'site3' then v_sites := v_sites || (a ->> 'site3'); end if;
  update fisher_regions set visits = visits + 1, sites = array(select distinct z from unnest(fisher_regions.sites || v_sites) z),
    boss_hp = case when a ? 'boss_hp' then (a ->> 'boss_hp')::int else boss_hp end, boss_dead = boss_dead or coalesce((a ->> 'boss_dead')::boolean, false)
    where user_id = u and region = r.id;
  sm := jsonb_build_object('fish', jsonb_array_length(coalesce(a -> 'fish', '[]')), 'gold', (a ->> 'gold')::int, 'xp', (a ->> 'xp')::int + jsonb_array_length(coalesce(a -> 'fish', '[]')) * 2,
    'cond', nc, 'cond_loss', (a ->> 'cond')::int, 'sites', to_jsonb(v_sites));
  return a || jsonb_build_object('sum', sm);
end $$;
create or replace function public.fleet_collect(p_voyage bigint, p_choice text default null) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); v fisher_voyages; a jsonb;
begin
  select * into v from fisher_voyages where id = p_voyage and user_id = u for update; if v.id is null then raise exception 'Retke ei leitud'; end if;
  if v.status = 'done' then raise exception 'See retk on juba lõpetatud'; end if;
  if now() < v.ready_at then raise exception 'Laev pole veel tagasi'; end if;
  if v.status = 'sea' then
    a := fx_fl_roll(u, v);
    if a ? 'choice' then
      update fisher_voyages set status = 'choice', result = a where id = v.id;
      return fleet_state() || jsonb_build_object('voyage', jsonb_build_object('id', v.id, 'region', v.region, 'kind', v.kind, 'result', a));
    end if;
  else
    if p_choice is null then
      return fleet_state() || jsonb_build_object('voyage', jsonb_build_object('id', v.id, 'region', v.region, 'kind', v.kind, 'result', v.result));
    end if;
    a := fx_fl_choose(u, v, v.result, p_choice);
  end if;
  a := fx_fl_grant(u, v, a);
  update fisher_voyages set status = 'done', result = a, taken_at = now() where id = v.id;
  return fleet_state() || jsonb_build_object('voyage', jsonb_build_object('id', v.id, 'region', v.region, 'kind', v.kind, 'result', a, 'done', true));
end $$;

-- ---------------------------------------------------------------------
-- 6s. Kes on mängus: mängija annab märku, et ta on mängus, ja saab nimekirja teistest
create or replace function public.presence_ping(p_where text default 'kuningriik') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); w text := case when p_where ~ '^[a-z]{1,12}$' then p_where else 'kuningriik' end; vb fish_bots; gift text; lvl int;
begin
  if u is null then raise exception 'Logi sisse'; end if;
  -- kui mängija oli üle 30 minuti eemal, jäetakse äraoleku algus meelde (kokkuvõtte jaoks)
  update profiles set away_from = coalesce(away_from, last_seen) where id = u and last_seen < now() - interval '30 minutes';
  update profiles set last_seen = now(), last_where = w where id = u;
  if w <> 'kuningriik' then update fishers set last_seen = now() where user_id = u; end if;
  perform fx_bots_tick();
  -- vahel saadab mõni Järve kalur sõprusekingi (kõige rohkem 1 päevas)
  if random() < 0.05 and exists (select 1 from saves where user_id = u) and not exists (select 1 from bot_gift_in where user_id = u and day = fx_today()) then
    select bb.* into vb from fish_bots bb where fx_bot_online(bb, now()) order by random() limit 1;
    if vb.id is not null then
      insert into bot_gift_in(user_id, day, bot) values (u, fx_today(), vb.id) on conflict do nothing;
      if found then
        select level into lvl from saves where user_id = u;
        perform fx_inbox(u, jsonb_build_object('gold', 30 + least(60, coalesce(lvl, 1)) * 3, 'berries', 20, 'food', 20, 'fame', 3), 'sõprusekink: ' || vb.name);
        gift := vb.emoji || ' ' || vb.name;
      end if;
    end if;
  end if;
  return jsonb_build_object('now', now(), 'gift', gift,
    'players', (select coalesce(jsonb_agg(x order by (x ->> 'ago')::int, x ->> 'name'), '[]') from (
      select jsonb_build_object('id', p.id, 'name', p.name, 'kingdom', p.kingdom, 'level', coalesce(sv.level, 1),
        'flevel', f.level, 'title', f.title, 'where', p.last_where,
        'ago', extract(epoch from now() - p.last_seen)::int,
        'spot', (select c.spot from fish_casts c where c.user_id = p.id and c.created_at > now() - interval '8 minutes' order by c.id desc limit 1),
        'busy', exists (select 1 from fish_duels d where (d.a = p.id or d.b = p.id) and d.status in ('invited','live'))) x
      from profiles p left join saves sv on sv.user_id = p.id left join fishers f on f.user_id = p.id
      where p.id <> u and not p.hidden and p.last_seen > now() - interval '75 seconds') q),
    'bots', fx_bots_online());
end $$;

-- 6t. Järve kalurid igal pool: kalatund, turg, labor, monument, kuningriik, akvaarium, retk, kingid
-- kalatunni punktid tegelasele (samad punktid mis mängijal, preemiaid nad ei võta)
create or replace function public.fx_bot_kt(p_bot text, p_species text, p_rarity int, p_w numeric, at2 timestamptz) returns void language plpgsql as $$
declare d date := (at2 at time zone 'Europe/Tallinn')::date; w record; avgw numeric; v_pts int; b public.kalatund_boss; v_dmg int;
begin
  select * into w from public.fx_kt_win(d);
  if w.p_from is null or at2 < w.p_from or at2 >= w.p_to or now() < w.p_from then return; end if;
  select (min_w + max_w) / 2 into avgw from public.fish_species where id = p_species;
  v_pts := greatest(1, round((array[5,10,25,60,150,400])[least(6, greatest(1, p_rarity))] * (0.6 + 0.4 * least(3, p_w / greatest(coalesce(avgw, 1), 0.01)))));
  b := public.fx_kt_boss(d);
  if b.killed_at is not null then return; end if;
  v_dmg := greatest(0, least(b.hp, v_pts));
  insert into public.kalatund_bot_score(day, bot, pts, fish, dmg) values (d, p_bot, v_pts, 1, v_dmg)
  on conflict (day, bot) do update set pts = kalatund_bot_score.pts + v_pts, fish = kalatund_bot_score.fish + 1, dmg = kalatund_bot_score.dmg + v_dmg;
  if v_dmg > 0 and b.hp - v_dmg <= 0 then
    if b.killed1_at is null and b.max_hp2 is not null and public.fx_kt_dmg(d) < b.max_hp + b.max_hp2 then
      update public.kalatund_boss set killed1_at = now(), killer1_bot = p_bot where day = d and killed1_at is null;
    else
      update public.kalatund_boss set killed_at = now(), killer = null, killer_bot = p_bot, hp = 0, killed1_at = coalesce(killed1_at, now()) where day = d and killed_at is null;
      if found then insert into public.fish_news(at, user_id, bot, kind, data) values (now(), null, p_bot, 'boss_team', public.fx_boss_team(d)); end if;
    end if;
  end if;
end $$;
-- tegelaste elu väljaspool vett (kord tiksu kohta): kuningriigid kasvavad, turul müüakse ja ostetakse, monumenti ehitatakse
create or replace function public.fx_bots_life() returns void language plpgsql as $$
declare b public.fish_bots; hrs numeric; l record; lm record; bc record; v_mon public.kingdom_monument; r text; amt int; lft numeric; v_base int; v_fee int;
  v_last timestamptz; v_n int; v_i int; v_owner uuid;
begin
  for b in select * from public.fish_bots loop
    hrs := least(72, extract(epoch from now() - coalesce(b.k_at, now())) / 3600);
    if hrs >= 0.05 then
      b.k_fame := b.k_fame + hrs * (4 + coalesce(b.k_level, 1) * 0.9) * (0.7 + b.skill * 0.3);
      while b.k_level < 60 and b.k_fame >= 12 * power(b.k_level + 1, 2) loop b.k_level := b.k_level + 1; end loop;
      update public.fish_bots set k_fame = b.k_fame, k_level = b.k_level, k_at = now() where id = b.id;
    end if;
  end loop;
  -- turg: tegelased panevad oma kalu müüki (kuni 3 päeva, nagu mängijadki)
  update public.fish_market set status = 'expired', closed_at = now() where status = 'open' and bot is not null and created_at < now() - interval '72 hours';
  -- tegelased tegutsevad ka siis, kui keegi ei mängi: iga ~6 möödunud minuti kohta üks tegevusring (kuni 120)
  select v into v_last from public.fish_bot_meta where k = 'life';
  v_n := greatest(1, least(120, floor(extract(epoch from now() - coalesce(v_last, now() - interval '6 minutes')) / 360)::int));
  insert into public.fish_bot_meta(k, v) values ('life', now()) on conflict (k) do update set v = excluded.v;
  for v_i in 1..v_n loop
  if random() < 0.35 and (select count(*) from public.fish_market where status = 'open' and bot is not null) < 20 then
    select c.* into bc from public.fish_bot_catches c where c.caught_at > now() - interval '8 hours' and c.caught_at <= now() and c.rarity >= 2
      and not exists (select 1 from public.fish_market m where m.bot_catch = c.id) order by random() limit 1;
    if bc.id is not null then
      v_base := public.fx_base_value(bc.species, bc.weight);
      insert into public.fish_market(seller, catch_id, species, rarity, weight, giant, price, base, bot, bot_catch, spot)
      values (null, null, bc.species, bc.rarity, bc.weight, false, greatest(1, round(v_base * (0.85 + random() * 0.5))), v_base, bc.bot, bc.id, bc.spot);
    end if;
  end if;
  -- turg: tegelane ostab mängija kala, kui hind on aus (kuni 130% tavahinnast)
  if random() < 0.22 then
    select m.* into l from public.fish_market m where m.status = 'open' and m.seller is not null and m.created_at < now() - interval '5 minutes'
      and m.price <= m.base * 1.3 order by random() limit 1 for update skip locked;
    if l.id is not null then
      select bb.* into b from public.fish_bots bb order by public.fx_bot_online(bb, now()) desc, random() limit 1;
      v_fee := ceil(l.price * 0.05);
      update public.fishers set gold = gold + l.price - v_fee where user_id = l.seller;
      update public.fish_catches set status = 'traded' where id = l.catch_id and status = 'market';
      update public.fish_market set status = 'sold', buyer = null, buyer_bot = b.id, closed_at = now(), fee = v_fee where id = l.id;
    end if;
  end if;
  -- turg elab: tegelased ostavad ka üksteise kalu
  if random() < 0.15 then
    select m.* into l from public.fish_market m where m.status = 'open' and m.bot is not null and m.created_at < now() - interval '2 hours' order by m.created_at limit 1 for update skip locked;
    if l.id is not null then
      select bb.* into b from public.fish_bots bb where bb.id <> l.bot order by public.fx_bot_online(bb, now()) desc, random() limit 1;
      update public.fish_market set status = 'sold', buyer = null, buyer_bot = b.id, closed_at = now(), fee = ceil(l.price * 0.05) where id = l.id;
    end if;
  end if;
  -- akvaariumid: tegelane käib mängija akvaariumi imetlemas (omanik saab 15 kulda, nagu päris mängijalt)
  if random() < 0.07 then
    select f.user_id into v_owner from public.fishers f join public.profiles p on p.id = f.user_id
      where f.house_level > 0 and not coalesce(p.hidden, false) and p.last_seen > now() - interval '14 days' order by random() limit 1;
    if v_owner is not null then
      select bb.* into b from public.fish_bots bb where public.fx_bot_online(bb, now())
        and not exists (select 1 from public.bot_aq_likes_in z where z.owner = v_owner and z.bot = bb.id and z.day = public.fx_today()) order by random() limit 1;
      if b.id is not null then
        insert into public.bot_aq_likes_in(owner, bot, day) values (v_owner, b.id, public.fx_today()) on conflict do nothing;
        if found then update public.fishers set aq_likes = aq_likes + 1, gold = gold + 15 where user_id = v_owner; end if;
      end if;
    end if;
  end if;
  -- geenilabori turg: tegelane ostab hübriidi, kui hind on aus (kuni 140% väärtusest)
  if random() < 0.12 then
    select m.id, m.fish_id, m.seller, m.price into lm from public.lab_market m join public.lab_fish h on h.id = m.fish_id
      where m.status = 'open' and m.created_at < now() - interval '10 minutes' and m.price <= h.value * 1.4 order by random() limit 1 for update of m skip locked;
    if lm.id is not null then
      select bb.* into b from public.fish_bots bb order by public.fx_bot_online(bb, now()) desc, random() limit 1;
      update public.fishers set gold = gold + round(lm.price * 0.95) where user_id = lm.seller;
      update public.lab_fish set status = 'sold' where id = lm.fish_id;
      update public.lab_market set status = 'sold', buyer = null, buyer_bot = b.id, closed_at = now() where id = lm.id;
    end if;
  end if;
  -- sõpruse monument: tegelased toovad materjali (kuni 90% igast vajadusest – viimase osa toovad päris mängijad)
  if random() < 0.15 and pg_try_advisory_xact_lock(hashtext('monument')) then
    v_mon := public.fx_mon_current();
    select n.key into r from jsonb_each_text(v_mon.need) n where coalesce((v_mon.have ->> n.key)::numeric, 0) < n.value::numeric * 0.9 order by random() limit 1;
    if r is not null then
      select bb.* into b from public.fish_bots bb where public.fx_bot_online(bb, now()) order by random() limit 1;
      if b.id is not null then
        lft := (v_mon.need ->> r)::numeric * 0.9 - coalesce((v_mon.have ->> r)::numeric, 0);
        amt := least(floor(lft)::int, 40 + floor(random() * (60 + b.k_level * 8))::int);
        if amt > 0 then
          update public.kingdom_monument km set have = jsonb_set(km.have, array[r], to_jsonb(coalesce((km.have ->> r)::numeric, 0) + amt)) where stage = v_mon.stage;
          insert into public.kingdom_monument_bot(stage, bot, total) values (v_mon.stage, b.id, amt) on conflict (stage, bot) do update set total = kingdom_monument_bot.total + amt;
        end if;
      end if;
    end if;
  end if;
  end loop;
end $$;
-- nädala retk: kui kaugele tegelane on jõudnud (5 peatust)
create or replace function public.fx_bot_journey(b public.fish_bots) returns jsonb language sql stable as $$
  select jsonb_build_object('done', least(5, floor(greatest(0, extract(epoch from now() - (date_trunc('week', now() at time zone 'Europe/Tallinn') at time zone 'Europe/Tallinn')) / 86400.0)
    * (0.45 + b.skill * 0.35) + (abs(hashtext(b.id || date_trunc('week', now() at time zone 'Europe/Tallinn')::text)) % 100) / 100.0)::int), 'of', 5) $$;
-- kõik tegelased koos nende kuningriigi, akvaariumi ja retkega
create or replace function public.bots_world() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_bots_tick();
  return (select coalesce(jsonb_agg(q.j order by q.srt), '[]') from (
    select b.sort as srt, jsonb_build_object('bot', b.id, 'name', b.name, 'emoji', b.emoji, 'descr', b.descr, 'level', fx_bot_level(b),
      'xp', b.xp, 'xp_need', case when fx_bot_level(b) >= 50 then 0 else fx_xp_need(fx_bot_level(b)) end,
      'online', fx_bot_online(b, now()), 'spot', fx_bot_spot(b, now()),
      'kingdom', b.kname, 'k_level', b.k_level, 'k_fame', floor(b.k_fame)::int, 'k_regions', least(6, 1 + b.k_level / 6), 'k_treasures', b.k_level / 4,
      'house', coalesce(h.level, 0), 'house_name', h.name, 'slots', coalesce(h.slots, 3), 'aq_likes', b.aq_likes,
      'aq', a.fish, 'aq_score', a.score,
      'liked', exists (select 1 from bot_aq_likes z where z.bot = b.id and z.visitor = u and z.day = fx_today()),
      'gifted', exists (select 1 from bot_gifts z where z.bot = b.id and z.sender = u and z.day = fx_today()),
      'journey', fx_bot_journey(b)) as j
    from fish_bots b
    left join lateral (select * from fish_house_levels hl where hl.min_fish_level <= fx_bot_level(b) order by hl.level desc limit 1) h on true
    left join lateral (select coalesce(jsonb_agg(jsonb_build_object('id', z.id, 'species', z.species, 'rarity', z.rarity, 'weight', z.weight, 'giant', false) order by z.rarity desc, z.weight desc), '[]') as fish,
        coalesce(sum(z.rarity * z.rarity * 2), 0)::int as score
      from (select * from (select distinct on (c.species) c.* from fish_bot_catches c where c.bot = b.id and c.caught_at <= now() order by c.species, c.rarity desc, c.weight desc) d
            order by d.rarity desc, d.weight desc limit coalesce(h.slots, 3)) z) a on true) q);
end $$;
create or replace function public.bot_gift_send(p_bot text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); n int; vb fish_bots;
begin
  select * into vb from fish_bots where id = p_bot;
  if vb.id is null then raise exception 'Seda kuningriiki ei leitud'; end if;
  perform 1 from profiles where id = u for update;
  n := (select count(*) from kingdom_gifts where sender = u and day = fx_today()) + (select count(*) from bot_gifts where sender = u and day = fx_today());
  if n >= 3 then raise exception 'Täna oled juba 3 kinki saatnud. Homme saad jälle!'; end if;
  insert into bot_gifts(sender, bot, day) values (u, p_bot, fx_today()) on conflict do nothing;
  if not found then raise exception 'Sellele kuningriigile oled täna juba kingi saatnud'; end if;
  update fish_bots set k_fame = k_fame + 5 where id = p_bot;
  perform fx_inbox(u, jsonb_build_object('fame', 4, 'xp', 15), 'heategu');
  perform fx_inbox(u, jsonb_build_object('gold', 20 + coalesce(vb.k_level, 1) * 2, 'berries', 15), 'vastukink: ' || vb.name);
  return jsonb_build_object('ok', true, 'left', 2 - n, 'thanks', vb.name);
end $$;
create or replace function public.bot_aquarium_like(p_bot text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u);
  if not exists (select 1 from fish_bots where id = p_bot) then raise exception 'Seda akvaariumi ei leitud'; end if;
  insert into bot_aq_likes(visitor, bot, day) values (u, p_bot, fx_today()) on conflict do nothing;
  if not found then raise exception 'Seda akvaariumi oled täna juba imetlenud'; end if;
  update fish_bots set aq_likes = aq_likes + 1 where id = p_bot;
  return jsonb_build_object('ok', true);
end $$;

-- retke peatuse kala vahetamine (üks kord peatuse kohta): uus kala on selles kohas praegu kõige paremini võttev tavaline kala
create or replace function public.journey_swap() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); j fish_journey; cur jsonb; f fishers; s fish_species; wthr text := fx_weather_at(now()); dp text := fx_daypart();
begin
  f := fx_fisher(u);
  j := fx_journey(u);
  select * into j from fish_journey where user_id = u and week = j.week for update;
  if j.finished then raise exception 'Retk on juba läbitud'; end if;
  cur := j.legs -> j.leg;
  if coalesce((cur ->> 'swapped')::boolean, false) then raise exception 'Selle peatuse kala oled juba korra vahetanud'; end if;
  select fs.* into s from fish_species fs where (cur ->> 'spot') = any(fs.spots) and fs.rarity = 1 and fs.min_level <= f.level and not fs.night_only
    and (not fs.winter_only or fx_is_winter() or cur ->> 'spot' = 'jaa') and fs.weather is null and fs.event is null and fs.id <> cur ->> 'species'
    order by fx_act(fs.temp_pref, fs.wx_tags, wthr, fx_water(cur ->> 'spot', now()), fx_prestorm(now()), dp) desc, random() limit 1;
  if s.id is null then raise exception 'Selles kohas pole teist sobivat kala'; end if;
  update fish_journey set legs = jsonb_set(legs, array[j.leg::text], cur || jsonb_build_object('species', s.id, 'n', 3, 'swapped', true)) where user_id = u and week = j.week;
  return event_state() || jsonb_build_object('swapped', jsonb_build_object('from', cur ->> 'species', 'to', s.id));
end $$;

-- 6u. Kalurimaja: taastamine ja toa boonused
create or replace function public.fx_room(u uuid, r text) returns boolean language sql stable as $$
  select exists (select 1 from public.fisher_cabin c where c.user_id = u and c.room = r and c.done_at <= now() and not c.damage) $$;
-- ruumi tase (0 = pole valmis või on katki); lõppenud uuendus loetakse kohe
create or replace function public.fx_room_lvl(u uuid, r text) returns int language sql stable as $$
  select coalesce((select case when c.up_at is not null and c.up_at <= now() then c.lvl + 1 else c.lvl end from public.fisher_cabin c
    where c.user_id = u and c.room = r and c.done_at <= now() and not c.damage), 0) $$;
-- boonuse kordaja tasemest: 1 → 1×, 2 → 1,6×, 3 → 2,2×
create or replace function public.fx_room_mul(u uuid, r text) returns numeric language sql stable as $$
  select case public.fx_room_lvl(u, r) when 0 then 0 when 1 then 1 when 2 then 1.6 else 2.2 end $$;
-- trofeeseina boonus: iga püütud liik +0,2% (kuni 8% / 11% / 14%)
create or replace function public.fx_trophy_bonus(u uuid) returns numeric language sql stable as $$
  select case when public.fx_room_lvl(u, 'trofeesein') = 0 then 0 else
    least(0.08 + 0.03 * (public.fx_room_lvl(u, 'trofeesein') - 1), 0.002 * (select count(*) from public.fish_species s where exists (select 1 from public.fish_catches c where c.user_id = u and c.species = s.id))) end $$;
create or replace function public.fx_cabin_fin(u uuid) returns void language sql as $$
  update public.fisher_cabin set lvl = lvl + 1, up_at = null where user_id = u and up_at is not null and up_at <= now() $$;
create or replace function public.cabin_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; sv saves;
begin
  f := fx_fisher(u); perform fx_cabin_fin(u);
  select * into sv from saves where user_id = u;
  return jsonb_build_object('now', now(), 'gold', f.gold, 'level', f.level,
    'saun', jsonb_build_object('lvl', fx_room_lvl(u, 'saun'), 'ok', fx_room_lvl(u, 'saun') > 0 and coalesce((select saun_day from fisher_cabin where user_id = u and room = 'saun'), '2000-01-01') < fx_today()),
    'trophy', jsonb_build_object('species', (select count(distinct species) from fish_catches where user_id = u), 'bonus', fx_trophy_bonus(u)),
    'wood', floor(coalesce((sv.data -> 'res' ->> 'wood')::numeric, 0)), 'stone', floor(coalesce((sv.data -> 'res' ->> 'stone')::numeric, 0)), 'kingdom', sv.user_id is not null,
    'legend', (select count(*) from fish_catches where user_id = u and species = 'hallhaug'),
    'rooms', (select jsonb_agg(jsonb_build_object('id', r.id, 'icon', r.icon, 'name', r.name, 'descr', r.descr, 'bonus', r.bonus, 'gold', r.gold, 'wood', r.wood, 'stone', r.stone,
        'hours', r.hours, 'min_level', r.min_level, 'started_at', c.started_at, 'done_at', c.done_at, 'done', c.done_at is not null and c.done_at <= now(),
        'page', case when c.done_at is not null and c.done_at <= now() then r.page end,
        'lvl', coalesce(c.lvl, 0), 'up_at', c.up_at, 'up_cost', case when c.lvl < 3 then fx_cabin_upcost(r, c.lvl) end,
        'damage', case when coalesce(c.damage, false) then jsonb_build_object('what', d.what, 'gold', d.gold, 'wood', d.wood, 'stone', d.stone, 'at', c.dmg_at) end) order by r.sort)
      from fish_cabin_rooms r left join fisher_cabin c on c.user_id = u and c.room = r.id left join fish_cabin_damage d on d.room = r.id));
end $$;
-- taastamine: kuld kalurikassast, puit ja kivi serveris hoitud kuningriigi salvestusest (nagu monumendi puhul)
create or replace function public.cabin_build(p_room text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; r fish_cabin_rooms; sv saves; w numeric; st numeric;
begin
  f := fx_fisher(u);
  select * into r from fish_cabin_rooms where id = p_room;
  if r.id is null then raise exception 'Tundmatu ruum'; end if;
  if exists (select 1 from fisher_cabin where user_id = u and room = r.id) then raise exception 'See ruum on juba taastatud või pooleli'; end if;
  if exists (select 1 from fisher_cabin where user_id = u and (done_at > now() or up_at > now())) then raise exception 'Üks töö on juba pooleli. Oota, kuni see valmib.'; end if;
  if exists (select 1 from fish_cabin_rooms p where p.sort < r.sort and not exists (select 1 from fisher_cabin c where c.user_id = u and c.room = p.id and c.done_at <= now())) then
    raise exception 'Taasta enne eelmised ruumid'; end if;
  if f.level < r.min_level then raise exception 'Selleks on vaja kalapüügi % taset', r.min_level; end if;
  perform 1 from fishers where user_id = u for update;
  select gold into f.gold from fishers where user_id = u;
  if f.gold < r.gold then raise exception 'Kalurikassas pole piisavalt kulda (vaja %)', r.gold; end if;
  select * into sv from saves where user_id = u for update;
  if sv.user_id is null then raise exception 'Kuningriik pole veel salvestatud – oota paar sekundit'; end if;
  w := coalesce((sv.data -> 'res' ->> 'wood')::numeric, 0); st := coalesce((sv.data -> 'res' ->> 'stone')::numeric, 0);
  if w < r.wood then raise exception 'Puitu on vaja % (sul on %). Raiu puid Udulahe kaldal või kuningriigis.', r.wood, floor(w); end if;
  if st < r.stone then raise exception 'Kivi on vaja % (sul on %). Korja kive Udulahe kaldal või kuningriigis.', r.stone, floor(st); end if;
  update saves set data = jsonb_set(jsonb_set(data, '{res,wood}', to_jsonb(w - r.wood)), '{res,stone}', to_jsonb(st - r.stone)) where user_id = u;
  update fishers set gold = gold - r.gold where user_id = u;
  insert into fisher_cabin(user_id, room, done_at) values (u, r.id, now() + make_interval(secs => round(r.hours * 3600)::int));
  return cabin_state() || jsonb_build_object('spent', jsonb_build_object('gold', r.gold, 'wood', r.wood, 'stone', r.stone), 'built', r.id);
end $$;
-- kiirusta kullaga (40 kulda minuti kohta, vähemalt 100)
create or replace function public.cabin_rush() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; c fisher_cabin; cost int;
begin
  f := fx_fisher(u);
  select * into c from fisher_cabin where user_id = u and (done_at > now() or up_at > now()) for update;
  if c.user_id is null then raise exception 'Midagi pole pooleli'; end if;
  cost := greatest(100, ceil(extract(epoch from (greatest(c.done_at, coalesce(c.up_at, c.done_at)) - now())) / 60.0 * 40))::int;
  if f.gold < cost then raise exception 'Kiirendamiseks on vaja % kulda', cost; end if;
  update fishers set gold = gold - cost where user_id = u;
  update fisher_cabin set done_at = least(done_at, now()), up_at = case when up_at is not null then now() end where user_id = u and room = c.room;
  perform fx_cabin_fin(u);
  return cabin_state() || jsonb_build_object('rushed', cost);
end $$;

-- 6v. Hooajakalad, püügipäevik ja trofeesein
create or replace function public.fx_season_k(se text[]) returns numeric language sql stable as $$
  select case when se is null then 1 when public.fx_season() = any(se) then 3 else 0.4 end $$;
-- püügipäevik: iga päeva kokkuvõte (viimased 30 püügipäeva)
create or replace function public.fish_diary() returns jsonb language plpgsql stable security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  return (select coalesce(jsonb_agg(j order by day desc), '[]') from (
    select x.day, jsonb_build_object('day', x.day, 'n', x.n, 'kg', round(x.kg, 2), 'night', x.nn,
      'big', (select jsonb_build_object('species', c.species, 'weight', c.weight, 'rarity', c.rarity) from fish_catches c where c.user_id = u and not c.bought and (c.caught_at at time zone 'Europe/Tallinn')::date = x.day order by c.weight desc limit 1),
      'rare', (select jsonb_build_object('species', c.species, 'weight', c.weight, 'rarity', c.rarity) from fish_catches c where c.user_id = u and not c.bought and (c.caught_at at time zone 'Europe/Tallinn')::date = x.day order by c.rarity desc, c.weight desc limit 1),
      'new', (select count(*) from (select species, min(caught_at) m from fish_catches where user_id = u and not bought group by species) f where (f.m at time zone 'Europe/Tallinn')::date = x.day),
      'species', (select count(distinct species) from fish_catches c where c.user_id = u and not c.bought and (c.caught_at at time zone 'Europe/Tallinn')::date = x.day),
      'spots', (select coalesce(jsonb_agg(distinct c.spot), '[]') from fish_catches c where c.user_id = u and not c.bought and (c.caught_at at time zone 'Europe/Tallinn')::date = x.day),
      'weather', (select c.weather from fish_catches c where c.user_id = u and not c.bought and c.weather is not null and (c.caught_at at time zone 'Europe/Tallinn')::date = x.day group by c.weather order by count(*) desc limit 1),
      'sold', coalesce((select sum(qty) from fish_sales s where s.user_id = u and s.day = x.day), 0),
      'season', fx_season((x.day + 1)::timestamp at time zone 'Europe/Tallinn' - interval '12 hours')) as j
    from (select (caught_at at time zone 'Europe/Tallinn')::date as day, count(*) n, sum(weight) kg, count(*) filter (where night) nn
          from fish_catches where user_id = u and not bought group by 1 order by 1 desc limit 30) x) q);
end $$;

-- 6w. Kaluri statistika: kõik numbrid tulevad mängija enda päris püükidest
create or replace function public.fish_stats() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; fish jsonb; byr jsonb; rec jsonb := '{}'; x record; fast numeric; streak int; boss jsonb; newach jsonb;
begin
  select * into f from fishers where user_id = u;
  if f.user_id is null then return jsonb_build_object('empty', true); end if;
  -- kui mõni saavutus on juba täis, aga pole veel avatud (nt uued saavutused vanadele mängijatele), avatakse see kohe koos auhinnaga
  newach := fx_check_ach(u);
  select * into f from fishers where user_id = u;
  select coalesce(jsonb_object_agg(rarity, n), '{}') into byr from (select rarity, count(*) n from fish_catches where user_id = u and not bought and species is not null group by rarity) q;
  -- isiklikud rekordid
  select species, weight, rarity, caught_at, spot into x from fish_catches where user_id = u and not bought order by weight desc limit 1;
  if x.species is not null then rec := rec || jsonb_build_object('big', jsonb_build_object('species', x.species, 'weight', x.weight, 'rarity', x.rarity, 'at', x.caught_at, 'spot', x.spot)); end if;
  select c.species, c.weight, c.rarity, fx_base_value(c.species, c.weight) v into x from fish_catches c where c.user_id = u and not c.bought order by 4 desc limit 1;
  if x.species is not null then rec := rec || jsonb_build_object('value', jsonb_build_object('species', x.species, 'weight', x.weight, 'rarity', x.rarity, 'v', x.v)); end if;
  select c.species, c.weight, c.rarity, fx_duel_pts(c.species, c.weight) p into x from fish_catches c where c.user_id = u and not c.bought order by 4 desc, c.weight desc limit 1;
  if x.species is not null then rec := rec || jsonb_build_object('pts', jsonb_build_object('species', x.species, 'weight', x.weight, 'rarity', x.rarity, 'p', x.p)); end if;
  select c.species, c.weight, c.rarity, c.spot into x from fish_catches c join fish_spots sp on sp.id = c.spot where c.user_id = u and not c.bought order by sp.difficulty desc, sp.min_level desc, c.weight desc limit 1;
  if x.species is not null then rec := rec || jsonb_build_object('deep', jsonb_build_object('species', x.species, 'weight', x.weight, 'rarity', x.rarity, 'spot', x.spot)); end if;
  select c.species, c.weight, c.rarity into x from fish_catches c where c.user_id = u and not c.bought order by c.rarity desc, c.weight desc limit 1;
  if x.species is not null then rec := rec || jsonb_build_object('rare', jsonb_build_object('species', x.species, 'weight', x.weight, 'rarity', x.rarity)); end if;
  -- vanuse ja pikkuse rekordid
  select c.species, c.weight, c.rarity, c.age, c.length_cm, c.caught_at, c.spot into x from fish_catches c where c.user_id = u and not c.bought and c.age is not null order by c.age desc, c.weight desc limit 1;
  if x.species is not null then rec := rec || jsonb_build_object('old', jsonb_build_object('species', x.species, 'weight', x.weight, 'rarity', x.rarity, 'age', x.age, 'len', x.length_cm, 'at', x.caught_at, 'spot', x.spot)); end if;
  select c.species, c.weight, c.rarity, c.age, s.max_age into x from fish_catches c join fish_species s on s.id = c.species where c.user_id = u and not c.bought and c.age is not null and s.max_age > 0 order by c.age / s.max_age desc, c.age desc limit 1;
  if x.species is not null then rec := rec || jsonb_build_object('oldrel', jsonb_build_object('species', x.species, 'weight', x.weight, 'rarity', x.rarity, 'age', x.age, 'max_age', x.max_age)); end if;
  select c.species, c.weight, c.rarity, c.length_cm, c.age into x from fish_catches c where c.user_id = u and not c.bought and c.length_cm is not null order by c.length_cm desc limit 1;
  if x.species is not null then rec := rec || jsonb_build_object('long', jsonb_build_object('species', x.species, 'weight', x.weight, 'rarity', x.rarity, 'len', x.length_cm, 'age', x.age)); end if;
  rec := rec || jsonb_build_object('oldfish', (select jsonb_build_object('n', count(*), 'list', coalesce(jsonb_agg(jsonb_build_object('species', z.species, 'age', z.age, 'weight', z.weight, 'rarity', z.rarity) order by z.age desc) filter (where z.rn <= 6), '[]'))
    from (select c.*, row_number() over (order by c.age desc) rn from fish_catches c where c.user_id = u and not c.bought and c.age_cls = 4) z));
  select min(extract(epoch from hooked_at - bite_at)) into fast from fish_casts where user_id = u and state = 'landed' and kind = 'fish' and hooked_at is not null and hooked_at >= bite_at;
  if fast is not null then rec := rec || jsonb_build_object('fast', round(fast, 2)); end if;
  -- pikim järjestikuste püügipäevade seeria
  select coalesce(max(n), 0) into streak from (select count(*) n from (select d, d - (row_number() over (order by d))::int g from (select distinct (caught_at at time zone 'Europe/Tallinn')::date d from fish_catches where user_id = u and not bought) a) b group by g) z;
  if streak > 0 then rec := rec || jsonb_build_object('streak', streak); end if;
  select max(pts) into fast from kalatund_score where user_id = u;
  if fast is not null and fast > 0 then rec := rec || jsonb_build_object('comp', fast); end if;
  -- bossid (Kalatunni järvekoletis)
  select jsonb_build_object(
    'killed', count(*) filter (where b.killed_at is not null and k.dmg > 0), 'dmg', coalesce(sum(k.dmg), 0), 'best', coalesce(max(k.dmg), 0), 'joined', count(*),
    'prizes', (select count(*) from kalatund_prize z join kalatund_boss b2 on b2.day = z.day join kalatund_score k2 on k2.day = z.day and k2.user_id = u where z.user_id = u and b2.killed_at is not null and k2.dmg > 0),
    'strongest', max(b.max_hp) filter (where b.killed_at is not null and k.dmg > 0)) into boss
  from kalatund_score k left join kalatund_boss b on b.day = k.day where k.user_id = u;
  return jsonb_build_object('ach', newach, 'total', f.total, 'level', f.level, 'title', f.title, 'by_rarity', byr,
    'night', f.night, 'junk', f.junk, 'chests', f.chests, 'lost', f.lost, 'broken', f.broken, 'orders', f.orders_done, 'quests', coalesce(f.quests_done, 0), 'wins', f.comp_wins,
    'records', rec, 'boss', boss,
    'species', (select count(distinct species) from fish_catches where user_id = u and not bought and species is not null), 'species_all', (select count(*) from fish_species));
end $$;

-- 6x. Kuningriigi uudised: bossi alistajad ja vanemate uudiste lehitsemine
create or replace function public.fx_boss_team(d date) returns jsonb language sql stable as $$
  select jsonb_build_object('day', d, 'n', (select count(*) from public.kalatund_score where day = d and dmg > 0) + (select count(*) from public.kalatund_bot_score where day = d and dmg > 0),
    'names', coalesce((select jsonb_agg(z.nm order by z.dmg desc) from (
        select case when p.hidden then 'Salapärane kalur' else p.name end nm, k.dmg from public.kalatund_score k join public.profiles p on p.id = k.user_id where k.day = d and k.dmg > 0
        union all select b.name || ' 🎣', k.dmg from public.kalatund_bot_score k join public.fish_bots b on b.id = k.bot where k.day = d and k.dmg > 0
        order by 2 desc limit 8) z), '[]')) $$;
create or replace function public.kingdom_news_older(p_before bigint) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.id desc), '[]') from (
    select n.id, n.at, n.kind, n.data, coalesce(n.user_id = auth.uid(), false) as me, n.bot, bt.emoji as bot_emoji,
      case when n.bot is not null then bt.name when p.hidden and n.user_id <> auth.uid() then 'Salapärane kalur' else coalesce(p.name, 'Kalur') end as name,
      case when n.bot is not null then 'Järve kalur' when p.hidden and n.user_id <> auth.uid() then null else f.title end as title
    from fish_news n left join profiles p on p.id = n.user_id left join fishers f on f.user_id = n.user_id left join fish_bots bt on bt.id = n.bot
    where n.id < p_before order by n.id desc limit 30) x
$$;

-- 6y. Kalastuskaardid
create or replace function public.fx_lic_ok(u uuid, k text) returns boolean language plpgsql as $$
declare n int;
begin
  -- esimene harrastuskaluri kaart on kingitus
  if k = 'harrastus' then
    insert into public.fisher_licenses(user_id, kind, until) values (u, 'harrastus', now() + interval '30 days') on conflict do nothing;
    get diagnostics n = row_count;
    if n > 0 then insert into public.fish_license_log(user_id, kind, price, until, what) values (u, 'harrastus', 0, now() + interval '30 days', 'Tervituskingitus'); end if;
  end if;
  return exists (select 1 from public.fisher_licenses where user_id = u and kind = k and until > now());
end $$;
create or replace function public.fx_lic_need(p_spot text) returns text[] language sql immutable as $$
  select case when p_spot = 'metsajarv' then '{}'::text[] when p_spot in ('avameri','sugavik') then array['harrastus','sugavee']
    when p_spot = 'kuningatiik' then array['harrastus','kuninglik'] else array['harrastus'] end $$;
create or replace function public.fx_lic_check(u uuid, p_spot text) returns void language plpgsql as $$
declare k text;
begin
  foreach k in array public.fx_lic_need(p_spot) loop
    if not public.fx_lic_ok(u, k) then
      raise exception 'Selles kohas püüdmiseks on vaja kehtivat kaarti: %. Osta või pikenda see Kalastuskaartide alt.', (select name from public.fish_license_types where id = k);
    end if;
  end loop;
end $$;
create or replace function public.fx_lic_map(u uuid) returns jsonb language plpgsql as $$
begin
  perform public.fx_lic_ok(u, 'harrastus');
  return (select coalesce(jsonb_object_agg(kind, until), '{}') from public.fisher_licenses where user_id = u);
end $$;

create or replace function public.license_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; nach int;
begin
  f := fx_fisher(u);
  perform fx_lic_ok(u, 'harrastus');
  select count(*) into nach from fish_unlocked where user_id = u;
  return jsonb_build_object('now', now(), 'gold', f.gold, 'level', f.level, 'total', f.total, 'ach', nach,
    'name', (select name from profiles where id = u),
    'types', (select jsonb_agg(jsonb_build_object('id', t.id, 'icon', t.icon, 'name', t.name, 'color', t.color, 'days', t.days, 'price', t.price,
        'min_level', t.min_level, 'need_total', t.need_total, 'need_ach', t.need_ach, 'descr', t.descr, 'gives', t.gives,
        'until', l.until, 'since', (select min(g.at) from fish_license_log g where g.user_id = u and g.kind = t.id),
        'can', f.level >= t.min_level and f.total >= t.need_total and nach >= t.need_ach) order by t.sort)
      from fish_license_types t left join fisher_licenses l on l.user_id = u and l.kind = t.id),
    'log', (select coalesce(jsonb_agg(jsonb_build_object('kind', g.kind, 'at', g.at, 'price', g.price, 'until', g.until, 'what', g.what) order by g.at desc), '[]')
      from (select * from fish_license_log where user_id = u order by at desc limit 12) g));
end $$;

create or replace function public.license_buy2(p_kind text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; t fish_license_types; cur timestamptz; nu timestamptz; nach int;
begin
  f := fx_fisher(u);
  select * into t from fish_license_types where id = p_kind;
  if t.id is null then raise exception 'Tundmatu kalastuskaart'; end if;
  perform pg_advisory_xact_lock(hashtext('lic:' || u::text));
  select count(*) into nach from fish_unlocked where user_id = u;
  if f.level < t.min_level then raise exception 'Kaart „%“ avaneb kalapüügi % tasemel', t.name, t.min_level; end if;
  if f.total < t.need_total then raise exception 'Kaardi „%“ jaoks pead olema püüdnud vähemalt % kala', t.name, t.need_total; end if;
  if nach < t.need_ach then raise exception 'Kaardi „%“ jaoks on vaja vähemalt % saavutust', t.name, t.need_ach; end if;
  select until into cur from fisher_licenses where user_id = u and kind = t.id;
  if cur is not null and cur > now() + make_interval(days => t.days * 2) then raise exception 'Kaart kehtib veel kaua. Pikendada saab, kui jäänud on kuni % päeva.', t.days * 2; end if;
  if f.gold < t.price then raise exception '% maksab % kulda', t.name, t.price; end if;
  -- pikendamisel lisatakse uus periood olemasolevale aegumiskuupäevale
  nu := greatest(coalesce(cur, now()), now()) + make_interval(days => t.days);
  update fishers set gold = gold - t.price, license_until = case when t.id = 'vork' then nu else license_until end where user_id = u;
  insert into fisher_licenses(user_id, kind, until) values (u, t.id, nu) on conflict (user_id, kind) do update set until = excluded.until;
  insert into fish_license_log(user_id, kind, price, until, what) values (u, t.id, t.price, nu, case when cur > now() then 'Pikendamine' when cur is not null then 'Uuendamine' else 'Ost' end);
  return license_state() || jsonb_build_object('bought', t.id, 'until', nu, 'ext', cur > now());
end $$;

-- 6z2. Ilm mängija äraolekul. Ilm vahetub iga 3 tunni järel (fx_weather) ja on igaks ajaks kindlalt määratud,
-- nii et siin vaadatakse, mis ilm päriselt oli, ja selle põhjal juhtub midagi.
create or replace function public.fx_nature(u uuid, since timestamptz) returns jsonb language plpgsql as $$
declare k bigint; k0 bigint; k1 bigint; w text; t timestamptz; nt int := 0; nv int := 0; nd int := 0; np int := 0; first_storm timestamptz;
  dmg jsonb := '[]'; rm record; wood int := 0; amber int := 0; worms int := 0; berries int := 0; fog jsonb := '[]';
begin
  since := greatest(since, now() - interval '72 hours');
  if now() - since < interval '2 hours' then return null; end if;
  k0 := floor(extract(epoch from since) / 10800); k1 := floor(extract(epoch from now()) / 10800) - 1; -- ainult täielikult möödunud 3-tunnised ilmad
  for k in k0 + 1 .. k1 loop
    t := to_timestamp(k * 10800); w := public.fx_weather_at(t);
    if w = 'torm' then nt := nt + 1; first_storm := coalesce(first_storm, t);
      -- torm võib Kalurimajas midagi lõhkuda (kokku kõige rohkem 2 kahju korraga)
      if jsonb_array_length(dmg) < 2 and random() < 0.5 then
        select c.room, r.name, r.icon, d.what into rm from public.fisher_cabin c join public.fish_cabin_rooms r on r.id = c.room join public.fish_cabin_damage d on d.room = c.room
          where c.user_id = u and c.done_at <= t and not c.damage order by random() limit 1;
        if rm.room is not null then
          update public.fisher_cabin set damage = true, dmg_at = t where user_id = u and room = rm.room;
          dmg := dmg || jsonb_build_object('room', rm.room, 'name', rm.name, 'icon', rm.icon, 'what', rm.what, 'at', t);
        end if;
      end if;
      wood := wood + 10 + floor(random() * 11)::int;
      if random() < 0.3 then amber := amber + 1; end if;
    elsif w = 'vihm' then nv := nv + 1; worms := worms + 5; berries := berries + 8;
    elsif w = 'udu' then nd := nd + 1;
      if jsonb_array_length(fog) = 0 and public.fx_room(u, 'sild') and random() < 0.35 then fog := public.fx_give_random(u, 3, 1); end if;
    elsif w = 'paike' then np := np + 1; berries := berries + 5;
    end if;
  end loop;
  wood := least(wood, 80); worms := least(worms, 30); berries := least(berries, 60);
  if wood > 0 or berries > 0 then perform public.fx_inbox(u, jsonb_strip_nulls(jsonb_build_object('wood', nullif(wood, 0), 'berries', nullif(berries, 0))), 'ilm sinu äraolekul'); end if;
  if amber > 0 then perform public.fx_give_item(u, 'merevaik', amber); end if;
  if worms > 0 then update public.fishers set baits = jsonb_set(baits, '{uss}', to_jsonb(coalesce((baits ->> 'uss')::int, 0) + worms)) where user_id = u; end if;
  if nt + nv + nd + np = 0 then return null; end if;
  return jsonb_build_object('storm', nt, 'rain', nv, 'fog', nd, 'sun', np, 'storm_at', first_storm, 'damage', dmg,
    'wood', wood, 'amber', amber, 'worms', worms, 'berries', berries, 'fog_item', fog);
end $$;
-- tormikahju parandamine: puit ja kivi kuningriigi salvestusest (nagu taastamisel) ning kuld kalurikassast
create or replace function public.cabin_repair(p_room text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fish_cabin_damage; sv saves; w numeric; st numeric;
begin
  f := fx_fisher(u);
  if not exists (select 1 from fisher_cabin where user_id = u and room = p_room and damage) then raise exception 'See ruum on terve'; end if;
  select * into d from fish_cabin_damage where room = p_room;
  perform 1 from fishers where user_id = u for update;
  select gold into f.gold from fishers where user_id = u;
  if f.gold < d.gold then raise exception 'Parandamiseks on vaja % kulda', d.gold; end if;
  select * into sv from saves where user_id = u for update;
  if sv.user_id is null then raise exception 'Kuningriik pole veel salvestatud – oota paar sekundit'; end if;
  w := coalesce((sv.data -> 'res' ->> 'wood')::numeric, 0); st := coalesce((sv.data -> 'res' ->> 'stone')::numeric, 0);
  if w < d.wood then raise exception 'Puitu on vaja % (sul on %). Raiu puid Kalurimaja juures.', d.wood, floor(w); end if;
  if st < d.stone then raise exception 'Kivi on vaja % (sul on %). Korja kive Kalurimaja juures.', d.stone, floor(st); end if;
  update saves set data = jsonb_set(jsonb_set(data, '{res,wood}', to_jsonb(w - d.wood)), '{res,stone}', to_jsonb(st - d.stone)) where user_id = u;
  update fishers set gold = gold - d.gold where user_id = u;
  update fisher_cabin set damage = false, dmg_at = null where user_id = u and room = p_room;
  return cabin_state() || jsonb_build_object('spent', jsonb_build_object('gold', d.gold, 'wood', d.wood, 'stone', d.stone), 'repaired', p_room);
end $$;

-- 6z. Äraoleku kokkuvõte: mis juhtus päriselt sel ajal, kui mängija eemal oli
create or replace function public.away_digest() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); since timestamptz; res jsonb;
begin
  if u is null then return jsonb_build_object('show', false); end if;
  select away_from into since from profiles where id = u;
  if since is null or since > now() - interval '30 minutes' then return jsonb_build_object('show', false); end if;
  update profiles set away_from = null where id = u;
  res := jsonb_build_object('show', true, 'since', since, 'now', now(), 'nature', fx_nature(u, since),
    'market', (select jsonb_build_object('n', count(*), 'gold', coalesce(sum(m.price - m.fee), 0),
        'list', coalesce((select jsonb_agg(x order by x.price desc) from (select m2.species, m2.weight, m2.rarity, m2.price - m2.fee as price,
          coalesce(bt.emoji || ' ' || bt.name, case when bp.hidden then 'Salapärane kalur' else bp.name end, 'Kalur') as who
          from fish_market m2 left join fish_bots bt on bt.id = m2.buyer_bot left join profiles bp on bp.id = m2.buyer
          where m2.seller = u and m2.status = 'sold' and m2.closed_at > since order by m2.price desc limit 5) x), '[]'))
      from fish_market m where m.seller = u and m.status = 'sold' and m.closed_at > since),
    'lab', (select jsonb_build_object('n', count(*), 'gold', coalesce(sum(round(price * 0.95)), 0)) from lab_market where seller = u and status = 'sold' and closed_at > since),
    'likes', (select count(*) from fish_aq_likes where owner = u and at > since) + (select count(*) from bot_aq_likes_in where owner = u and at > since),
    'likers', coalesce((select jsonb_agg(distinct q.n) from (select case when p.hidden then 'Salapärane kalur' else p.name end n from fish_aq_likes l join profiles p on p.id = l.visitor where l.owner = u and l.at > since
        union all select b.emoji || ' ' || b.name from bot_aq_likes_in l join fish_bots b on b.id = l.bot where l.owner = u and l.at > since limit 6) q), '[]'),
    'gift', (select b.emoji || ' ' || b.name from bot_gift_in g join fish_bots b on b.id = g.bot where g.user_id = u and g.at > since order by g.at desc limit 1),
    'traps', (select count(*) from fish_traps where user_id = u and status = 'set' and ready_at <= now()),
    'cabin', coalesce((select jsonb_agg(r.name) from fisher_cabin c join fish_cabin_rooms r on r.id = c.room where c.user_id = u and c.done_at > since and c.done_at <= now()), '[]'),
    'duels', (select count(*) from fish_duels where b = u and created_at > since and status <> 'live' and status <> 'done'),
    'boss', (select jsonb_build_object('killer', coalesce(bt.emoji || ' ' || bt.name, case when kp.hidden then 'Salapärane kalur' else kp.name end), 'me', k.killer = u)
      from kalatund_boss k left join profiles kp on kp.id = k.killer left join fish_bots bt on bt.id = k.killer_bot where k.killed_at > since order by k.killed_at desc limit 1),
    'bots', (select jsonb_build_object('n', count(*), 'best', (select jsonb_build_object('species', c2.species, 'weight', c2.weight, 'rarity', c2.rarity, 'who', b2.emoji || ' ' || b2.name)
        from fish_bot_catches c2 join fish_bots b2 on b2.id = c2.bot where c2.caught_at > since and c2.caught_at <= now() order by c2.rarity desc, c2.weight desc limit 1))
      from fish_bot_catches where caught_at > since and caught_at <= now()),
    'news_n', (select count(*) from fish_news where at > since),
    'news', coalesce((select jsonb_agg(to_jsonb(x) order by x.id desc) from (
      select n.id, n.at, n.kind, n.data, coalesce(n.user_id = u, false) as me, n.bot,
        case when n.bot is not null then bt.emoji || ' ' || bt.name when p.hidden and n.user_id <> u then 'Salapärane kalur' else coalesce(p.name, 'Kalur') end as name, null::text as title
      from fish_news n left join profiles p on p.id = n.user_id left join fish_bots bt on bt.id = n.bot
      where n.at > since and n.kind in ('first','catch','giant','grecord','pbig','chest','comp','boss_team','kalatund','bot_catch')
      order by case n.kind when 'catch' then 1 when 'grecord' then 2 when 'first' then 3 when 'boss_team' then 4 else 5 end, n.id desc limit 3) x), '[]'));
  return res;
end $$;

-- 6z3. Kalatöötlemine
-- töötlemise tase kogemusest (tase 30 on maksimum)
create or replace function public.fx_proc_lvl(x int) returns int language sql immutable as $$ select least(30, floor(sqrt(greatest(x, 0) / 40.0))::int + 1) $$;
create or replace function public.fx_proc_need(l int) returns int language sql immutable as $$ select 40 * l * l $$;
create or replace function public.fx_rep_tier(r int) returns int language sql immutable as $$
  select case when r >= 2500 then 4 when r >= 1000 then 3 when r >= 400 then 2 when r >= 100 then 1 else 0 end $$;
create or replace function public.fx_proc(u uuid) returns public.fisher_proc language plpgsql as $$
declare p public.fisher_proc;
begin
  insert into public.fisher_proc(user_id) values (u) on conflict do nothing;
  select * into p from public.fisher_proc where user_id = u;
  return p;
end $$;
-- värskus: esimesed 24 tundi täiesti värske, siis −10% päevas (suure töökojaga −5%), mitte alla 50%
create or replace function public.fx_fresh(u uuid, c public.fish_catches) returns numeric language sql stable as $$
  select case when c.status <> 'kept' or c.fresh_at is null then 1 else
    greatest(0.5, least(1, 1 - (case when coalesce((select ws from public.fisher_proc where user_id = u), 1) >= 6 then 0.05 else 0.10 end)
      * (1 - coalesce((select 0.25 + 0.15 * (case when k.up_at is not null and k.up_at <= now() then k.lvl else k.lvl - 1 end) from public.fisher_cabin k
          where k.user_id = u and k.room = 'kelder' and k.done_at <= now() and not k.damage), 0))
      * greatest(0, extract(epoch from now() - c.fresh_at) / 3600 - 24) / 24)) end $$;
create or replace function public.fx_mat_add(u uuid, m text, q int) returns void language sql as $$
  insert into public.fisher_mats(user_id, mat, qty) values (u, m, q) on conflict (user_id, mat) do update set qty = public.fisher_mats.qty + q $$;
drop function if exists public.fx_proc_stat(uuid, text, int);
create or replace function public.fx_proc_stat(u uuid, k text, n int) returns void language plpgsql as $$
begin
  -- päeva ülesannete algseis salvestatakse enne esimest tänast tegevust
  if not exists (select 1 from public.fisher_proc_daily where user_id = u and day = public.fx_today()) then
    perform public.fx_proc_daily(u, (select p from public.fisher_proc p where p.user_id = u));
  end if;
  update public.fisher_proc set stats = jsonb_set(stats, array[k], to_jsonb(coalesce((stats ->> k)::int, 0) + n)) where user_id = u;
end $$;
-- puhastamiseks vajalikud klikid ühe kala kohta
create or replace function public.fx_clean_clicks(w numeric, r int) returns int language sql immutable as $$
  select least(45, greatest(4, round(5 + sqrt(w) * 2.2 + r * 1.5)))::int $$;
create or replace function public.fx_click_mult(p public.fisher_proc) returns numeric language sql immutable as $$
  select (1 - 0.12 * (p.knife - 1)) * case when public.fx_proc_lvl(p.xp) >= 5 then 0.85 else 1 end * case when p.ws >= 2 then 0.9 else 1 end $$;
-- ülesanded (kasutavad töötlemise statistikat)
create or replace function public.fx_proc_quests() returns jsonb language sql immutable as $$ select '[
  {"id":"ahven","name":"Ahvenafileed","descr":"Valmista 10 ahvenafileed (puhasta ahvenaid).","stat":"filee_ahven","goal":10,"gold":300,"xp":60,"rep":10},
  {"id":"rare","name":"Haruldane saak laual","descr":"Püüa haruldane kala ja töötle see.","stat":"rare","goal":1,"gold":800,"xp":120,"rep":20,"mats":{"kuldsoomus":1}},
  {"id":"konks","name":"Konksumeister","descr":"Meisterda 10 luukonksu.","stat":"luukonks","goal":10,"gold":600,"xp":100,"rep":15},
  {"id":"soot","name":"Söödakokk","descr":"Valmista 15 ühikut kalasööta.","stat":"kalasoot","goal":15,"gold":500,"xp":80,"rep":10},
  {"id":"suits","name":"Suitsumeister","descr":"Valmista 20 suitsukala.","stat":"suitsukala","goal":20,"gold":1500,"xp":200,"rep":30,"mats":{"kuldsoomus":2}},
  {"id":"korts","name":"Kõrtsi varustaja","descr":"Müü äripartneritele tellimuste kaudu kokku 30 kalafileed.","stat":"order_filee","goal":30,"gold":2000,"xp":250,"rep":50},
  {"id":"meister","name":"Meistri käsi","descr":"Puhasta kala vähemalt meisterliku kvaliteediga.","stat":"q4","goal":1,"gold":1500,"xp":200,"rep":40},
  {"id":"sada","name":"Sada kala laual","descr":"Puhasta kokku 100 kala.","stat":"cleaned","goal":100,"gold":3000,"xp":400,"rep":60},
  {"id":"tase10","name":"Kogenud töötleja","descr":"Jõua kalatöötlemise 10. tasemele.","stat":"_lvl","goal":10,"gold":2500,"xp":0,"rep":50}
]'::jsonb $$;
-- igapäevaste ülesannete valik (goal ja preemia kasvavad töökoja tasemega; %s = eesmärk)
create or replace function public.fx_proc_daily_pool() returns jsonb language sql immutable as $$ select '[
  {"id":"puhasta","name":"Päeva puhastus","descr":"Puhasta täna %s kala.","stat":"cleaned","goal":8,"ws":1,"gold":250,"xp":50,"rep":6},
  {"id":"ahven","name":"Ahvenapäev","descr":"Valmista täna %s ahvenafileed.","stat":"filee_ahven","goal":5,"ws":1,"gold":200,"xp":40,"rep":5},
  {"id":"konks","name":"Konksutund","descr":"Meisterda täna %s luukonksu.","stat":"luukonks","goal":3,"ws":1,"gold":300,"xp":60,"rep":6},
  {"id":"kaunistus","name":"Soomuskunst","descr":"Meisterda täna %s soomuskaunistust.","stat":"soomuskaunistus","goal":2,"ws":1,"gold":300,"xp":60,"rep":6},
  {"id":"rare","name":"Haruldus laual","descr":"Töötle täna üks haruldane kala.","stat":"rare","goal":1,"fixed":true,"ws":1,"gold":600,"xp":100,"rep":12},
  {"id":"partner","name":"Partnerite päev","descr":"Täida täna %s äripartneri tellimust.","stat":"biz_done","goal":2,"fixed":true,"ws":1,"gold":500,"xp":90,"rep":10},
  {"id":"meister","name":"Meistri puudutus","descr":"Puhasta täna üks kala meisterliku kvaliteediga.","stat":"q4","goal":1,"fixed":true,"ws":2,"gold":500,"xp":90,"rep":10},
  {"id":"filee","name":"Fileetarne","descr":"Anna täna partneritele %s fileed.","stat":"order_filee","goal":8,"ws":2,"gold":450,"xp":80,"rep":9},
  {"id":"suits","name":"Suitsupäev","descr":"Valmista täna %s suitsukala.","stat":"suitsukala","goal":4,"ws":3,"gold":400,"xp":80,"rep":8},
  {"id":"supp","name":"Supipott","descr":"Keeda täna %s kalasuppi.","stat":"kalasupp","goal":3,"ws":3,"gold":400,"xp":80,"rep":8},
  {"id":"soot","name":"Söödakeetja","descr":"Valmista täna %s kalasööta.","stat":"kalasoot","goal":8,"ws":4,"gold":350,"xp":70,"rep":7}
]'::jsonb $$;
create or replace function public.fx_proc_daily(u uuid, p public.fisher_proc) returns jsonb language plpgsql as $$
declare d fisher_proc_daily; lv int := greatest(1, coalesce(p.ws, 1)); m numeric; g numeric;
begin
  select * into d from fisher_proc_daily where user_id = u and day = fx_today();
  if d.user_id is null then
    insert into fisher_proc_daily(user_id, day, base, picks)
      values (u, fx_today(), coalesce(p.stats, '{}'), (select array_agg(x ->> 'id') from (select x from jsonb_array_elements(fx_proc_daily_pool()) x where (x ->> 'ws')::int <= lv order by random() limit 3) z))
      on conflict do nothing;
    select * into d from fisher_proc_daily where user_id = u and day = fx_today();
  end if;
  m := 1 + 0.25 * (lv - 1); g := 1 + 0.3 * (lv - 1);
  return jsonb_build_object('day', d.day, 'bonus', cardinality(d.claimed) >= 3, 'list', (select jsonb_agg(jsonb_build_object(
      'id', x ->> 'id', 'name', x ->> 'name',
      'goal', case when (x ->> 'fixed')::boolean then (x ->> 'goal')::int else ceil((x ->> 'goal')::int * m)::int end,
      'descr', replace(x ->> 'descr', '%s', (case when (x ->> 'fixed')::boolean then (x ->> 'goal')::int else ceil((x ->> 'goal')::int * m)::int end)::text),
      'have', greatest(0, coalesce((p.stats ->> (x ->> 'stat'))::int, 0) - coalesce((d.base ->> (x ->> 'stat'))::int, 0)),
      'gold', round((x ->> 'gold')::int * g), 'xp', round((x ->> 'xp')::int * g), 'rep', round((x ->> 'rep')::int * g),
      'claimed', (x ->> 'id') = any(d.claimed)) order by array_position(d.picks, x ->> 'id'))
    from jsonb_array_elements(fx_proc_daily_pool()) x where (x ->> 'id') = any(d.picks)));
end $$;
create or replace function public.fx_ws_cost(l int) returns jsonb language sql immutable as $$
  select (array['{}','{"gold":800,"wood":60,"stone":20}','{"gold":2000,"wood":120,"stone":60}','{"gold":3500,"wood":150,"stone":100}','{"gold":6000,"wood":200,"stone":150}','{"gold":12000,"wood":300,"stone":300}']::jsonb[])[l] $$;
create or replace function public.fx_tool_cost(t text, l int) returns jsonb language sql immutable as $$
  select case t
    when 'knife' then (array[null,'{"gold":300,"mats":{"luu":10}}','{"gold":1500,"mats":{"luukonks":5}}','{"gold":5000,"mats":{"luukonks":20,"kuldsoomus":5}}','{"gold":15000,"mats":{"iidneluu":3,"kuldsoomus":10}}']::jsonb[])[l]
    when 'kit' then (array['{"gold":2000,"mats":{"soomus":20}}','{"gold":6000,"mats":{"kuldsoomus":10}}','{"gold":12000,"mats":{"kuldsoomus":15,"iidneluu":2}}']::jsonb[])[l]
    when 'rarekit' then '{"gold":8000,"mats":{"kuldsoomus":5,"iidneluu":1}}'::jsonb end $$;

create or replace function public.fx_proc_orders(u uuid, p public.fisher_proc) returns void language plpgsql as $$
declare d date := public.fx_today(); n int; i int; pool text[]; m text; q int; pr int; tier int := public.fx_rep_tier(p.rep);
begin
  return; -- kõrtsi tellimused on nüüd Äripartnerite (Kaupmeeste gild) all
  if p.ws < 5 or exists (select 1 from public.fisher_proc_orders where user_id = u and day = d) then return; end if;
  n := 3 + case when tier >= 2 then 1 else 0 end + case when tier >= 4 then 1 else 0 end;
  pool := array['filee','filee','luukonks','suitsukala','kalasupp'] || case when tier >= 2 then array['kuldfilee','soomuskaunistus'] else '{}'::text[] end;
  for i in 1..n loop
    m := pool[1 + floor(random() * array_length(pool, 1))::int];
    q := case m when 'filee' then 10 + floor(random() * 21) when 'luukonks' then 3 + floor(random() * 6) when 'suitsukala' then 3 + floor(random() * 8)
      when 'kalasupp' then 3 + floor(random() * 6) when 'kuldfilee' then 2 + floor(random() * 4) else 1 + floor(random() * 2) end;
    select price into pr from public.fish_mats where id = m;
    insert into public.fisher_proc_orders(user_id, day, idx, mat, qty, gold, rep, xp)
      values (u, d, i, m, q, round(q * pr * 1.6 * (1 + 0.1 * tier)), ceil(q * pr / 20.0) + 3, ceil(q * pr / 10.0)) on conflict do nothing;
  end loop;
end $$;

create or replace function public.proc_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; p fisher_proc; sv saves; lv int; j fisher_proc_job;
begin
  f := fx_fisher(u); p := fx_proc(u); lv := fx_proc_lvl(p.xp);
  perform fx_proc_orders(u, p);
  select * into sv from saves where user_id = u;
  select * into j from fisher_proc_job where user_id = u;
  return jsonb_build_object('now', now(), 'gold', f.gold, 'name', (select name from profiles where id = u),
    'proc', jsonb_build_object('xp', p.xp, 'lvl', lv, 'cur', fx_proc_need(lv - 1), 'next', case when lv < 30 then fx_proc_need(lv) end, 'ws', p.ws, 'knife', p.knife, 'kit', p.kit,
      'rarekit', p.rarekit, 'rep', p.rep, 'tier', fx_rep_tier(p.rep), 'stats', p.stats, 'cmult', fx_click_mult(p)),
    'res', jsonb_build_object('wood', floor(coalesce((sv.data -> 'res' ->> 'wood')::numeric, 0)), 'stone', floor(coalesce((sv.data -> 'res' ->> 'stone')::numeric, 0)),
      'berries', floor(coalesce((sv.data -> 'res' ->> 'berries')::numeric, 0)), 'food', floor(coalesce((sv.data -> 'res' ->> 'food')::numeric, 0)), 'kingdom', sv.user_id is not null),
    'mats', (select coalesce(jsonb_object_agg(mat, qty), '{}') from fisher_mats where user_id = u and qty > 0),
    'catalog', (select jsonb_agg(to_jsonb(m) order by m.sort) from fish_mats m),
    'recipes', (select jsonb_agg(to_jsonb(r) order by r.sort) from fish_recipes r),
    'fish', (select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'species', c.species, 'rarity', c.rarity, 'weight', c.weight, 'fresh', round(fx_fresh(u, c), 2),
        'age', c.age, 'len', c.length_cm, 'acls', c.age_cls, 'clicks', fx_clean_clicks(c.weight, c.rarity)) order by c.species, c.weight desc), '[]') from fish_catches c where c.user_id = u and c.status = 'kept'),
    'orders', (select coalesce(jsonb_agg(to_jsonb(o) - 'user_id' order by o.idx), '[]') from fisher_proc_orders o where o.user_id = u and o.day = fx_today()),
    'daily', fx_proc_daily(u, p),
    'quests', (select jsonb_agg(qq || jsonb_build_object('have', case when qq ->> 'stat' = '_lvl' then lv else coalesce((p.stats ->> (qq ->> 'stat'))::int, 0) end,
        'claimed', exists (select 1 from fisher_proc_quests z where z.user_id = u and z.q = qq ->> 'id'))) from jsonb_array_elements(fx_proc_quests()) qq),
    'ws_cost', (select jsonb_agg(fx_ws_cost(l) order by l) from generate_series(1, 6) l),
    'tools', jsonb_build_object('knife', case when p.knife < 5 then fx_tool_cost('knife', p.knife + 1) end, 'kit', case when p.kit < 3 then fx_tool_cost('kit', p.kit + 1) end,
      'rarekit', case when not p.rarekit then fx_tool_cost('rarekit', 1) end),
    'job', case when j.user_id is not null then jsonb_build_object('kind', j.kind, 'payload', j.payload, 'clicks', j.clicks) end);
end $$;

-- töö algus: server arvutab vajalikud klikid ja jätab alguse aja meelde
create or replace function public.proc_start(p_kind text, p_ids bigint[] default null, p_recipe text default null, p_times int default 1) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); p fisher_proc; lv int; n int := 0; cl numeric := 0; c fish_catches; r fish_recipes; k text; sv saves; have numeric;
begin
  perform fx_fisher(u); p := fx_proc(u); lv := fx_proc_lvl(p.xp);
  if p_kind = 'clean' then
    if coalesce(array_length(p_ids, 1), 0) = 0 or array_length(p_ids, 1) > 10 then raise exception 'Vali puhastamiseks 1–10 kala'; end if;
    for c in select * from fish_catches where id = any(p_ids) and user_id = u and status = 'kept' loop
      if c.rarity >= 5 and lv < 30 then raise exception 'Legendaarseid ja müütilisi kalu saab töödelda alles töötlemise 30. tasemel'; end if;
      if c.rarity = 4 and lv < 15 then raise exception 'Eepilisi kalu saab töödelda alates töötlemise 15. tasemest'; end if;
      n := n + 1; cl := cl + fx_clean_clicks(c.weight, c.rarity);
    end loop;
    if n <> array_length(p_ids, 1) then raise exception 'Mõnda valitud kala enam pole'; end if;
    cl := greatest(3, round(cl * fx_click_mult(p)));
    insert into fisher_proc_job(user_id, kind, payload, clicks, started_at) values (u, 'clean', jsonb_build_object('ids', to_jsonb(p_ids)), cl, now())
      on conflict (user_id) do update set kind = excluded.kind, payload = excluded.payload, clicks = excluded.clicks, started_at = excluded.started_at;
  elsif p_kind = 'craft' then
    select * into r from fish_recipes where id = p_recipe;
    if r.id is null then raise exception 'Tundmatu retsept'; end if;
    p_times := greatest(1, least(10, coalesce(p_times, 1)));
    if p.ws < r.ws then raise exception 'Selleks on vaja Kalurimaja töökoja % taset', r.ws; end if;
    if lv < r.skill then raise exception 'Selleks on vaja kalatöötlemise % taset', r.skill; end if;
    if p.rep < r.rep_need then raise exception 'Selleks on vaja % mainet', r.rep_need; end if;
    for k in select jsonb_object_keys(r.needs) loop
      if coalesce((select qty from fisher_mats where user_id = u and mat = k), 0) < (r.needs ->> k)::int * p_times then
        raise exception 'Materjali „%“ jääb puudu', (select name from fish_mats where id = k); end if;
    end loop;
    if r.res <> '{}'::jsonb then
      select * into sv from saves where user_id = u;
      if sv.user_id is null then raise exception 'Kuningriik pole veel salvestatud – oota paar sekundit'; end if;
      for k in select jsonb_object_keys(r.res) loop
        have := coalesce((sv.data -> 'res' ->> k)::numeric, 0);
        if have < (r.res ->> k)::int * p_times then raise exception 'Kuningriigi varudes jääb puudu: % (vaja %, sul on %)',
          case k when 'wood' then 'puitu' when 'berries' then 'marju' when 'food' then 'toitu' else k end, (r.res ->> k)::int * p_times, floor(have); end if;
      end loop;
    end if;
    cl := greatest(3, round(r.clicks * p_times * case when lv >= 5 then 0.85 else 1 end * case when p.ws >= 2 then 0.9 else 1 end));
    insert into fisher_proc_job(user_id, kind, payload, clicks, started_at) values (u, 'craft', jsonb_build_object('recipe', r.id, 'times', p_times), cl, now())
      on conflict (user_id) do update set kind = excluded.kind, payload = excluded.payload, clicks = excluded.clicks, started_at = excluded.started_at;
  else raise exception 'Tundmatu töö'; end if;
  return jsonb_build_object('clicks', cl, 'kind', p_kind);
end $$;

-- töö lõpp: server kontrollib, et klikke on piisavalt ja et need ei tulnud inimvõimetult kiiresti
drop function if exists public.proc_finish(int, int);
-- p_stages: iga tööetapi täpsus (soomustamine, rookimine, pea ja uimed, fileerimine) – mõjutab vastava materjali saaki
create or replace function public.proc_finish(p_clicks int, p_precise int, p_stages numeric[] default null) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); p fisher_proc; lv int; j fisher_proc_job; c fish_catches; s fish_species; r fish_recipes; acc numeric; fr numeric; v numeric;
  sc numeric; qt int; mult numeric; fil int; hea int; luu int; jae int; soo int; ks int; il int; got jsonb := '{}'; qs int[] := '{}'; v_xp int := 0; v_rep int := 0;
  k text; sv saves; have numeric; times int; levels int[]; lv2 int; nrare int := 0; nahv int := 0; best int := 0; outq int;
  a1 numeric; a2 numeric; a3 numeric; a4 numeric; gall boolean := false;
begin
  perform fx_fisher(u); p := fx_proc(u); lv := fx_proc_lvl(p.xp);
  select * into j from fisher_proc_job where user_id = u for update;
  if j.user_id is null then raise exception 'Pooleliolevat tööd pole'; end if;
  if coalesce(p_clicks, 0) < j.clicks then raise exception 'Töö pole veel valmis'; end if;
  if extract(epoch from now() - j.started_at) < j.clicks / 16.0 then raise exception 'Nii kiiresti ei jõua keegi klikkida – proovi uuesti'; end if;
  acc := least(1, greatest(0, coalesce(p_precise, 0)::numeric / greatest(1, p_clicks)));
  -- etappide täpsus ei saa olla parem kui kogutäpsus lubab (keskmine ei tohi ületada üldist täpsust)
  a1 := least(1, greatest(0, coalesce(p_stages[1], acc))); a2 := least(1, greatest(0, coalesce(p_stages[2], acc)));
  a3 := least(1, greatest(0, coalesce(p_stages[3], acc))); a4 := least(1, greatest(0, coalesce(p_stages[4], acc)));
  if (a1 + a2 + a3 + a4) / 4 > acc + 0.15 then a1 := acc; a2 := acc; a3 := acc; a4 := acc; end if;
  delete from fisher_proc_job where user_id = u;
  if j.kind = 'clean' then
    for c in select * from fish_catches where id in (select (jsonb_array_elements_text(j.payload -> 'ids'))::bigint) and user_id = u and status = 'kept' for update loop
      select * into s from fish_species where id = c.species;
      fr := fx_fresh(u, c);
      v := s.price * least(2, 0.6 + 0.4 * c.weight / ((s.min_w + s.max_w) / 2)) * fr;
      -- kvaliteet sõltub oskusest, tööriistadest, täpsusest ja värskusest (juhus on ainult väike osa)
      sc := lv * 1.5 + p.knife * 6 + p.kit * 4 + acc * 30 + fr * 15 + random() * 10 + case when p.rarekit and c.rarity >= 4 then 10 else 0 end + case when lv >= 20 then 8 else 0 end;
      qt := case when sc >= 80 then 5 when sc >= 65 then 4 when sc >= 50 then 3 when sc >= 35 then 2 else 1 end;
      mult := (array[1, 1.1, 1.25, 1.4, 1.6])[qt] * case when lv >= 10 then 1.2 else 1 end * case when p.ws >= 6 then 1.15 else 1 end;
      -- iga etapi täpsus mõjutab oma materjali: soomustamine → soomused, rookimine → jäätmed, pea ja uimed → luud, fileerimine → filee
      fil := greatest(1, floor(v * 0.55 / 6 * mult * (0.8 + 0.4 * a4) + random())::int);
      luu := floor(v * 0.12 / 2 * mult * (0.7 + 0.6 * a3) + random())::int; jae := greatest(1, floor(v * 0.13 * mult * (0.7 + 0.6 * a2) + random())::int);
      soo := floor(v * 0.10 / 3 * mult * (0.7 + 0.6 * a1) + random())::int;
      -- hooletu rookimine: sapipõis lõhkes ja osa fileest läks raisku
      if a2 < 0.25 and random() < 0.6 then fil := greatest(1, round(fil * 0.85)::int); gall := true; end if;
      hea := case when qt >= 3 then floor(fil * least(0.9, (array[0, 0, 0.3, 0.5, 0.7])[qt] + case when a4 >= 0.8 then 0.15 else 0 end))::int
        when qt = 2 and a4 >= 0.8 then floor(fil * 0.15)::int else 0 end; fil := fil - hea;
      if random() < p.kit * 0.1 then soo := soo + greatest(1, soo / 2); end if;
      ks := 0; il := 0;
      if c.rarity >= 3 then ks := floor(0.25 * (c.rarity - 2) * case when lv >= 15 then 1.5 else 1 end + random())::int; end if;
      if p.kit > 0 and c.rarity >= 3 and random() < p.kit * 0.1 then ks := ks + 1; end if;
      if qt = 5 then ks := ks + 1; end if;
      if c.rarity >= 5 then il := 1 + case when qt >= 4 then 1 else 0 end; end if;
      perform fx_mat_add(u, 'filee', fil); if hea > 0 then perform fx_mat_add(u, 'filee_hea', hea); end if;
      if luu > 0 then perform fx_mat_add(u, 'luu', luu); end if; perform fx_mat_add(u, 'jaatmed', jae); if soo > 0 then perform fx_mat_add(u, 'soomus', soo); end if;
      if ks > 0 then perform fx_mat_add(u, 'kuldsoomus', ks); end if; if il > 0 then perform fx_mat_add(u, 'iidneluu', il); end if;
      got := jsonb_build_object('filee', coalesce((got ->> 'filee')::int, 0) + fil, 'filee_hea', coalesce((got ->> 'filee_hea')::int, 0) + hea,
        'luu', coalesce((got ->> 'luu')::int, 0) + luu, 'jaatmed', coalesce((got ->> 'jaatmed')::int, 0) + jae, 'soomus', coalesce((got ->> 'soomus')::int, 0) + soo,
        'kuldsoomus', coalesce((got ->> 'kuldsoomus')::int, 0) + ks, 'iidneluu', coalesce((got ->> 'iidneluu')::int, 0) + il);
      qs := qs || qt; best := greatest(best, qt);
      v_xp := v_xp + 4 + c.rarity * 4 + round(sqrt(c.weight))::int; v_rep := v_rep + 1 + c.rarity;
      if c.rarity >= 3 then nrare := nrare + 1; end if;
      if c.species = 'ahven' then nahv := nahv + fil + hea; end if;
      update fish_catches set status = 'cleaned' where id = c.id;
    end loop;
    if array_length(qs, 1) is null then raise exception 'Kalu enam pole – keegi on need juba ära kasutanud'; end if;
    perform fx_proc_stat(u, 'cleaned', array_length(qs, 1));
    if nrare > 0 then perform fx_proc_stat(u, 'rare', nrare); end if;
    if nahv > 0 then perform fx_proc_stat(u, 'filee_ahven', nahv); end if;
    if best >= 4 then perform fx_proc_stat(u, 'q4', 1); end if;
  else
    select * into r from fish_recipes where id = j.payload ->> 'recipe';
    times := (j.payload ->> 'times')::int;
    -- materjalid võetakse alles nüüd, kui töö on edukalt tehtud
    for k in select jsonb_object_keys(r.needs) loop
      update fisher_mats set qty = qty - (r.needs ->> k)::int * times where user_id = u and mat = k and qty >= (r.needs ->> k)::int * times;
      if not found then raise exception 'Materjali „%“ jääb puudu', (select name from fish_mats where id = k); end if;
    end loop;
    if r.res <> '{}'::jsonb then
      select * into sv from saves where user_id = u for update;
      for k in select jsonb_object_keys(r.res) loop
        have := coalesce((sv.data -> 'res' ->> k)::numeric, 0);
        if have < (r.res ->> k)::int * times then raise exception 'Kuningriigi varudes jääb puudu'; end if;
        sv.data := jsonb_set(sv.data, array['res', k], to_jsonb(have - (r.res ->> k)::int * times));
      end loop;
      update saves set data = sv.data where user_id = u;
    end if;
    outq := r.out_qty * times;
    if r.out_kind = 'mat' then perform fx_mat_add(u, r.out_id, outq);
    elsif r.out_kind = 'bait' then update fishers set baits = jsonb_set(baits, array[r.out_id], to_jsonb(coalesce((baits ->> r.out_id)::int, 0) + outq)) where user_id = u;
    elsif r.out_kind = 'inbox' then perform fx_inbox(u, jsonb_build_object(r.out_id, outq), r.name);
    end if;
    got := jsonb_build_object(r.out_id, outq);
    v_xp := r.xp * times; v_rep := r.rep * times;
    perform fx_proc_stat(u, r.out_id, outq);
  end if;
  update fisher_proc set xp = fisher_proc.xp + v_xp, rep = fisher_proc.rep + v_rep where user_id = u;
  lv2 := fx_proc_lvl(p.xp + v_xp);
  return proc_state() || jsonb_build_object('result', jsonb_build_object('kind', j.kind, 'got', got, 'q', to_jsonb(qs), 'best', best, 'xp', v_xp, 'rep', v_rep, 'acc', round(acc, 2),
    'stages', case when j.kind = 'clean' then jsonb_build_array(round(a1, 2), round(a2, 2), round(a3, 2), round(a4, 2)) end, 'gall', gall,
    'lvlup', case when lv2 > lv then lv2 end, 'recipe', r.id, 'out_kind', r.out_kind, 'res', case when j.kind = 'craft' then r.res end, 'times', times));
end $$;
create or replace function public.proc_cancel() returns jsonb language plpgsql security definer set search_path = public as $$
begin delete from fisher_proc_job where user_id = fx_uid(); return jsonb_build_object('ok', true); end $$;

-- töökoja ja tööriistade täiustamine
create or replace function public.proc_upgrade(p_what text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; p fisher_proc; cost jsonb; k text; sv saves; have numeric;
begin
  f := fx_fisher(u); p := fx_proc(u);
  perform 1 from fisher_proc where user_id = u for update;
  cost := case p_what when 'ws' then case when p.ws < 6 then fx_ws_cost(p.ws + 1) end when 'knife' then case when p.knife < 5 then fx_tool_cost('knife', p.knife + 1) end
    when 'kit' then case when p.kit < 3 then fx_tool_cost('kit', p.kit + 1) end when 'rarekit' then case when not p.rarekit then fx_tool_cost('rarekit', 1) end end;
  if cost is null then raise exception 'See on juba maksimumis'; end if;
  if f.gold < coalesce((cost ->> 'gold')::int, 0) then raise exception 'Kulda jääb puudu (vaja %)', cost ->> 'gold'; end if;
  for k in select jsonb_object_keys(coalesce(cost -> 'mats', '{}')) loop
    if coalesce((select qty from fisher_mats where user_id = u and mat = k), 0) < (cost -> 'mats' ->> k)::int then
      raise exception 'Materjali „%“ jääb puudu (vaja %)', (select name from fish_mats where id = k), cost -> 'mats' ->> k; end if;
  end loop;
  if cost ? 'wood' or cost ? 'stone' then
    select * into sv from saves where user_id = u for update;
    if sv.user_id is null then raise exception 'Kuningriik pole veel salvestatud – oota paar sekundit'; end if;
    for k in select unnest(array['wood','stone']) loop
      have := coalesce((sv.data -> 'res' ->> k)::numeric, 0);
      if have < coalesce((cost ->> k)::int, 0) then raise exception '% on vaja % (sul on %). Korja seda Kalurimaja juures.', case k when 'wood' then 'Puitu' else 'Kivi' end, cost ->> k, floor(have); end if;
      sv.data := jsonb_set(sv.data, array['res', k], to_jsonb(have - coalesce((cost ->> k)::int, 0)));
    end loop;
    update saves set data = sv.data where user_id = u;
  end if;
  for k in select jsonb_object_keys(coalesce(cost -> 'mats', '{}')) loop
    update fisher_mats set qty = qty - (cost -> 'mats' ->> k)::int where user_id = u and mat = k;
  end loop;
  update fishers set gold = gold - coalesce((cost ->> 'gold')::int, 0) where user_id = u;
  if p_what = 'ws' then update fisher_proc set ws = ws + 1 where user_id = u;
  elsif p_what = 'knife' then update fisher_proc set knife = knife + 1 where user_id = u;
  elsif p_what = 'kit' then update fisher_proc set kit = kit + 1 where user_id = u;
  else update fisher_proc set rarekit = true where user_id = u; end if;
  return proc_state() || jsonb_build_object('upgraded', p_what, 'spent', cost);
end $$;

-- kalalett: toodete ja materjalide müük (töökoja 5. tasemest)
create or replace function public.proc_sell(p_mat text, p_qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); p fisher_proc; m fish_mats; g int;
begin
  perform fx_fisher(u); p := fx_proc(u);
  if p.ws < 5 then raise exception 'Kalalett avaneb Kalurimaja töökoja 5. tasemel'; end if;
  select * into m from fish_mats where id = p_mat;
  if m.id is null or coalesce(p_qty, 0) < 1 then raise exception 'Vali, mida müüa'; end if;
  update fisher_mats set qty = qty - p_qty where user_id = u and mat = p_mat and qty >= p_qty;
  if not found then raise exception 'Sul pole nii palju'; end if;
  g := round(m.price * p_qty * (1 + 0.05 * fx_rep_tier(p.rep)));
  update fishers set gold = gold + g where user_id = u;
  update fisher_proc set rep = rep + g / 100 where user_id = u;
  return proc_state() || jsonb_build_object('sold', jsonb_build_object('mat', p_mat, 'qty', p_qty, 'gold', g));
end $$;
-- kõrtsi tellimuse täitmine
create or replace function public.proc_order(p_idx int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); o fisher_proc_orders;
begin
  perform fx_fisher(u); perform fx_proc(u);
  select * into o from fisher_proc_orders where user_id = u and day = fx_today() and idx = p_idx for update;
  if o.user_id is null or o.done then raise exception 'Tellimust pole või see on juba täidetud'; end if;
  update fisher_mats set qty = qty - o.qty where user_id = u and mat = o.mat and qty >= o.qty;
  if not found then raise exception 'Tellimuse jaoks jääb kaupa puudu'; end if;
  update fisher_proc_orders set done = true where user_id = u and day = o.day and idx = o.idx;
  update fishers set gold = gold + o.gold where user_id = u;
  update fisher_proc set rep = rep + o.rep, xp = xp + o.xp where user_id = u;
  perform fx_proc_stat(u, 'orders', 1);
  if o.mat in ('filee', 'filee_hea') then perform fx_proc_stat(u, 'order_filee', o.qty); end if;
  return proc_state() || jsonb_build_object('delivered', to_jsonb(o) - 'user_id');
end $$;
-- ülesande preemia
create or replace function public.proc_quest(p_q text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); p fisher_proc; q jsonb; have int; k text;
begin
  perform fx_fisher(u); p := fx_proc(u);
  select x into q from jsonb_array_elements(fx_proc_quests()) x where x ->> 'id' = p_q;
  if q is null then raise exception 'Tundmatu ülesanne'; end if;
  have := case when q ->> 'stat' = '_lvl' then fx_proc_lvl(p.xp) else coalesce((p.stats ->> (q ->> 'stat'))::int, 0) end;
  if have < (q ->> 'goal')::int then raise exception 'Ülesanne pole veel täidetud'; end if;
  insert into fisher_proc_quests(user_id, q) values (u, p_q) on conflict do nothing;
  if not found then raise exception 'Preemia on juba kätte saadud'; end if;
  update fishers set gold = gold + (q ->> 'gold')::int where user_id = u;
  update fisher_proc set xp = xp + (q ->> 'xp')::int, rep = rep + (q ->> 'rep')::int where user_id = u;
  for k in select jsonb_object_keys(coalesce(q -> 'mats', '{}')) loop perform fx_mat_add(u, k, (q -> 'mats' ->> k)::int); end loop;
  return proc_state() || jsonb_build_object('claimed', q);
end $$;
-- igapäevase ülesande preemia; kõigi kolme täitmisel lisaks päeva boonus
create or replace function public.proc_daily_claim(p_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); p fisher_proc; dl jsonb; q jsonb; n int; bonus jsonb := null;
begin
  perform fx_fisher(u); p := fx_proc(u); dl := fx_proc_daily(u, p);
  select x into q from jsonb_array_elements(dl -> 'list') x where x ->> 'id' = p_id;
  if q is null then raise exception 'Seda ülesannet täna pole'; end if;
  if (q ->> 'claimed')::boolean then raise exception 'Preemia on juba kätte saadud'; end if;
  if (q ->> 'have')::int < (q ->> 'goal')::int then raise exception 'Ülesanne pole veel täidetud'; end if;
  update fisher_proc_daily set claimed = claimed || p_id where user_id = u and day = fx_today() and not (p_id = any(claimed)) returning cardinality(claimed) into n;
  if n is null then raise exception 'Preemia on juba kätte saadud'; end if;
  update fishers set gold = gold + (q ->> 'gold')::int where user_id = u;
  update fisher_proc set xp = xp + (q ->> 'xp')::int, rep = rep + (q ->> 'rep')::int where user_id = u;
  if n >= 3 then
    bonus := jsonb_build_object('gold', 300 + 200 * greatest(1, p.ws), 'mat', case when random() < 0.5 then 'kuldsoomus' else 'luukonks' end, 'qty', case when random() < 0.5 then 1 else 3 end);
    update fishers set gold = gold + (bonus ->> 'gold')::int where user_id = u;
    perform fx_mat_add(u, bonus ->> 'mat', (bonus ->> 'qty')::int);
  end if;
  return proc_state() || jsonb_build_object('dclaimed', q, 'dbonus', bonus);
end $$;
-- kalasupp kuningriigi kööki (toit)
create or replace function public.proc_feed(p_qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  perform fx_fisher(u); perform fx_proc(u);
  if coalesce(p_qty, 0) < 1 then raise exception 'Vali kogus'; end if;
  update fisher_mats set qty = qty - p_qty where user_id = u and mat = 'kalasupp' and qty >= p_qty;
  if not found then raise exception 'Kalasuppi pole nii palju'; end if;
  perform fx_inbox(u, jsonb_build_object('food', p_qty * 20), 'Kalasupp kuningriigi köögile');
  update fisher_proc set rep = rep + p_qty where user_id = u;
  return proc_state() || jsonb_build_object('fed', p_qty * 20);
end $$;

-- 6z5. Suitsuahi
create or replace function public.fx_smoke_grp(sp text) returns text language sql immutable as $$
  select case when sp = 'ahven' then 'ahven' when sp = 'haug' then 'haug' when sp = 'koha' then 'koha' when sp = 'latikas' then 'latikas'
    when sp in ('joeforell','vihmaforell','vikerforell','meriforell','kroonforell') then 'forell' when sp = 'lohe' then 'lohe'
    when sp in ('angerjas','kuuangerjas') then 'angerjas' when sp in ('raim','kilu') then 'raim' when sp in ('sarg','roosarg','kuusarg') then 'sarg'
    when sp = 'nokkhaug' then 'tuulehaug' else 'muu' end $$;
create or replace function public.fx_smoke_lvl_cost(l int) returns jsonb language sql immutable as $$
  select (array[null,'{"gold":400,"wood":40,"stone":20}','{"gold":900,"wood":60,"stone":40}','{"gold":1600,"wood":90,"stone":70}','{"gold":2600,"wood":120,"stone":100}',
    '{"gold":4000,"wood":160,"stone":140}','{"gold":6000,"wood":200,"stone":200}','{"gold":9000,"wood":260,"stone":260}','{"gold":13000,"wood":320,"stone":320}','{"gold":20000,"wood":400,"stone":400}']::jsonb[])[l] $$;
create or replace function public.fx_smoke_upgs() returns jsonb language sql immutable as $$ select '[
  {"id":"riiul","name":"Maitseainete riiul","descr":"Avab maitsesuitsu, erimarinaadi valmistamise ja metsamarjadega forelli.","lvl":2,"gold":800,"mats":{"luu":30}},
  {"id":"kytte","name":"Parem küttekamber","descr":"Suitsutamine on 20% kiirem.","lvl":2,"gold":1200,"mats":{"luu":20,"soomus":10}},
  {"id":"kamber","name":"Suurem suitsukamber","descr":"Korraga mahub 50% rohkem kalu.","lvl":3,"gold":2500,"mats":{"lepp":30}},
  {"id":"temp","name":"Temperatuuriregulaator","descr":"Ühtlane kuumus – parem kvaliteet.","lvl":4,"gold":3500,"mats":{"kuldsoomus":5}},
  {"id":"filter","name":"Suitsufilter","descr":"Tootmisvigu (kõrbenud kalu) on palju vähem.","lvl":4,"gold":2000,"mats":{"soomus":20}},
  {"id":"auto","name":"Automaatne taimer","descr":"Valmis toodang liigub ise lattu, ka siis, kui oled eemal.","lvl":5,"gold":3000,"mats":{"luukonks":5}},
  {"id":"premium","name":"Premium suitsukamber","descr":"Avab premium-suitsu ja legendaarse suitsukala.","lvl":7,"gold":10000,"mats":{"iidneluu":3,"kuldsoomus":5}}]'::jsonb $$;
create or replace function public.fx_smoke(u uuid) returns public.fisher_smoke language plpgsql as $$
declare s public.fisher_smoke;
begin
  insert into public.fisher_smoke(user_id) values (u) on conflict do nothing;
  update public.fisher_smoke set starter_at = now() where user_id = u and starter_at is null returning * into s;
  if found then
    perform public.fx_mat_add(u, 'lepp', 15); perform public.fx_mat_add(u, 'kask', 10);
    perform public.fx_mat_add(u, 'sool', 10); perform public.fx_mat_add(u, 'till', 5);
  end if;
  select * into s from public.fisher_smoke where user_id = u; return s;
end $$;
create or replace function public.fx_smoke_cap(s public.fisher_smoke) returns int language sql immutable as $$
  select floor((3 + 2 * (s.lvl - 1)) * case when 'kamber' = any(s.upg) then 1.5 else 1 end)::int $$;
-- kalad, mis sobivad selle toote jaoks
create or replace function public.fx_smoke_fish(u uuid, pr public.fish_smoke_products) returns setof public.fish_catches language sql stable as $$
  select c.* from public.fish_catches c where c.user_id = u and c.status = 'kept'
    and case when pr.grp = 'legend' then c.rarity >= 5 else public.fx_smoke_grp(c.species) = pr.grp end
  order by public.fx_fresh(u, c) asc, c.weight asc $$;
create or replace function public.fx_smoke_collect(u uuid) returns jsonb language plpgsql as $$
declare b public.fisher_smoke_batch; pr public.fish_smoke_products; n int;
begin
  select * into b from public.fisher_smoke_batch where user_id = u and status = 'run' and ready_at <= now() for update;
  if b.id is null then return null; end if;
  select * into pr from public.fish_smoke_products where id = b.product;
  n := coalesce(b.out_qty, b.qty) - b.fails;
  if n > 0 then insert into public.fisher_smoked(user_id, product, quality, qty) values (u, b.product, b.quality, n)
    on conflict (user_id, product, quality) do update set qty = public.fisher_smoked.qty + n; end if;
  update public.fisher_smoke_batch set status = 'taken', taken_at = now() where id = b.id;
  perform public.fx_proc(u);
  update public.fisher_proc set xp = xp + n * (3 + pr.rarity * 3), rep = rep + n * pr.rarity where user_id = u;
  perform public.fx_proc_stat(u, 'suitsukala', n); perform public.fx_proc_stat(u, 'smoked', n);
  return jsonb_build_object('product', b.product, 'name', pr.name, 'qty', n, 'fails', b.fails, 'quality', b.quality, 'special', pr.special, 'rarity', pr.rarity, 'xp', n * (3 + pr.rarity * 3), 'rep', n * pr.rarity);
end $$;
create or replace function public.fx_smoke_value(pr public.fish_smoke_products, q int) returns int language sql immutable as $$
  select round(pr.price * (array[1, 1.15, 1.3, 1.5, 1.8])[q])::int $$;

create or replace function public.smoke_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; p fisher_proc; s fisher_smoke; sv saves; got jsonb;
begin
  f := fx_fisher(u); p := fx_proc(u); s := fx_smoke(u);
  if 'auto' = any(s.upg) then got := fx_smoke_collect(u); end if;
  select * into sv from saves where user_id = u;
  return jsonb_build_object('now', now(), 'gift', s.starter_at = now(), 'gold', f.gold, 'ws', p.ws, 'lvl', s.lvl, 'upg', to_jsonb(s.upg), 'cap', fx_smoke_cap(s), 'auto_got', got,
    'next', case when s.lvl < 10 then fx_smoke_lvl_cost(s.lvl) end, 'upgs', fx_smoke_upgs(),
    'res', jsonb_build_object('wood', floor(coalesce((sv.data -> 'res' ->> 'wood')::numeric, 0)), 'stone', floor(coalesce((sv.data -> 'res' ->> 'stone')::numeric, 0)),
      'berries', floor(coalesce((sv.data -> 'res' ->> 'berries')::numeric, 0)), 'kingdom', sv.user_id is not null),
    'stock', (select coalesce(jsonb_object_agg(mat, qty), '{}') from fisher_mats where user_id = u and qty > 0 and mat in ('kask','lepp','ounapuu','tamm','sool','till','kuuslauk','pipar','maitsetaim','marinaad','luu','soomus','kuldsoomus','luukonks','iidneluu')),
    'products', (select jsonb_agg(to_jsonb(x) order by x.sort) from fish_smoke_products x),
    'fish', (select coalesce(jsonb_object_agg(g, jsonb_build_object('n', n, 'fresh', fr, 'amin', amin, 'amax', amax)), '{}') from (
        select fx_smoke_grp(c.species) g, count(*) n, round(avg(fx_fresh(u, c)), 2) fr, min(c.age) amin, max(c.age) amax from fish_catches c where c.user_id = u and c.status = 'kept' group by 1) z),
    'legend_n', (select count(*) from fish_catches c where c.user_id = u and c.status = 'kept' and c.rarity >= 5),
    'smoked', (select coalesce(jsonb_agg(jsonb_build_object('product', z.product, 'quality', z.quality, 'qty', z.qty, 'value', fx_smoke_value(pr, z.quality)) order by pr.sort, z.quality desc), '[]')
      from fisher_smoked z join fish_smoke_products pr on pr.id = z.product where z.user_id = u and z.qty > 0),
    'batch', (select to_jsonb(b) - 'user_id' from fisher_smoke_batch b where b.user_id = u and b.status = 'run'));
end $$;

-- suitsutamise käivitamine: kõik kontrollid ja tooraine eemaldamine toimuvad korraga, alles siis algab taimer
create or replace function public.smoke_start(p_product text, p_qty int, p_wood text, p_spices text[] default '{}') returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; p fisher_proc; s fisher_smoke; pr fish_smoke_products; n int; ids bigint[]; fr numeric; sc numeric; q int; fails int := 0;
  v_out int; mins numeric; k text; need int; sp text[]; sv saves; have numeric; flav text[] := array['till','kuuslauk','pipar','maitsetaim'];
begin
  f := fx_fisher(u); p := fx_proc(u); s := fx_smoke(u);
  perform 1 from fisher_smoke where user_id = u for update;
  if p.ws < 3 then raise exception 'Suitsuahi avaneb Kalurimaja töökoja 3. tasemel'; end if;
  if exists (select 1 from fisher_smoke_batch where user_id = u and status = 'run') then raise exception 'Ahjus on juba kala – oota, kuni see valmib, ja võta toodang välja'; end if;
  select * into pr from fish_smoke_products where id = p_product;
  if pr.id is null then raise exception 'Tundmatu retsept'; end if;
  if s.lvl < pr.min_lvl then raise exception '„%“ avaneb suitsuahju % tasemel', pr.name, pr.min_lvl; end if;
  if pr.need_upg is not null and not (pr.need_upg = any(s.upg)) then raise exception 'Selleks on vaja täiustust: %', (select x ->> 'name' from jsonb_array_elements(fx_smoke_upgs()) x where x ->> 'id' = pr.need_upg); end if;
  if p_wood not in ('kask','lepp','ounapuu','tamm') then raise exception 'Vali küttepuu'; end if;
  if pr.wood is not null and p_wood <> pr.wood then raise exception 'See retsept vajab puud: %', (select name from fish_mats where id = pr.wood); end if;
  n := greatest(1, least(coalesce(p_qty, 1), fx_smoke_cap(s)));
  sp := array(select distinct x from unnest(coalesce(p_spices, '{}')) x where x in ('sool','till','kuuslauk','pipar','maitsetaim','marinaad'));
  -- nõutud maitseained
  for k in select jsonb_object_keys(pr.spices) loop
    if k = 'maitse' then if (select count(*) from unnest(sp) x where x = any(flav)) < 2 then raise exception 'Maitsesuits vajab vähemalt 2 maitseainet (till, küüslauk, pipar või maitsetaimed)'; end if;
    elsif k <> 'berries' and not (k = any(sp)) then raise exception 'See retsept vajab maitseainet: %', (select name from fish_mats where id = k); end if;
  end loop;
  -- kalad
  select array_agg(z.id), avg(z.f2), sum(z.o) into ids, fr, v_out from (select c.id, fx_fresh(u, c) f2,
      (select greatest(1, round(fx_size_mult(sp0, c.weight) * 0.8))::int from fish_species sp0 where sp0.id = c.species) o from fx_smoke_fish(u, pr) c limit n) z;
  if coalesce(array_length(ids, 1), 0) < n then raise exception 'Sobivaid kalu on ainult %', coalesce(array_length(ids, 1), 0); end if;
  -- küttepuud: 1 puu iga 3 kala kohta; maitseained: 1 iga 5 kala kohta (retsepti nõutud kogus korda)
  need := ceil(n / 3.0);
  update fisher_mats set qty = qty - need where user_id = u and mat = p_wood and qty >= need;
  if not found then raise exception 'Küttepuid jääb puudu: vaja % × %', need, (select name from fish_mats where id = p_wood); end if;
  foreach k in array sp loop
    need := ceil(n / 5.0) * coalesce(case when pr.spices ? k then (pr.spices ->> k)::int end, 1);
    update fisher_mats set qty = qty - need where user_id = u and mat = k and qty >= need;
    if not found then raise exception 'Maitseainet „%“ jääb puudu (vaja %)', (select name from fish_mats where id = k), need; end if;
  end loop;
  if pr.spices ? 'berries' then
    select * into sv from saves where user_id = u for update;
    have := coalesce((sv.data -> 'res' ->> 'berries')::numeric, 0); need := (pr.spices ->> 'berries')::int * n;
    if sv.user_id is null or have < need then raise exception 'Kuningriigi varudes on vaja % marja', need; end if;
    update saves set data = jsonb_set(data, '{res,berries}', to_jsonb(have - need)) where user_id = u;
  end if;
  update fish_catches set status = 'smoked' where id = any(ids);
  -- kvaliteet: ahju tase, täiustused, õige puu, maitseained, kala värskus ja natuke juhust
  sc := s.lvl * 3 + case when 'temp' = any(s.upg) then 10 else 0 end
    + case when (pr.method = 'kuum' and p_wood = 'lepp') or (pr.method in ('kulm','kuiv') and p_wood = 'tamm') or (pr.method in ('maitse','premium') and p_wood = 'ounapuu') then 8 else 0 end
    + coalesce(array_length(sp, 1), 0) * 3 + coalesce(fr, 1) * 15 + random() * 15 + case when pr.special then 5 else 0 end;
  q := case when sc >= 70 then 5 when sc >= 55 then 4 when sc >= 40 then 3 when sc >= 25 then 2 else 1 end;
  if random() < (case when 'filter' = any(s.upg) then 0.02 else 0.12 end) then fails := greatest(1, floor(v_out * 0.25)::int); end if;
  mins := (case pr.method when 'kuum' then 15 when 'maitse' then 40 when 'kulm' then 120 when 'kuiv' then 180 else 240 end)
    * (1 + 0.04 * (n - 1)) * (1 - 0.05 * (s.lvl - 1)) * case when 'kytte' = any(s.upg) then 0.8 else 1 end;
  insert into fisher_smoke_batch(user_id, product, qty, out_qty, fails, quality, wood, spices, ready_at) values (u, pr.id, n, v_out, fails, q, p_wood, sp, now() + make_interval(secs => round(mins * 60)::int));
  return smoke_state() || jsonb_build_object('started', jsonb_build_object('name', pr.name, 'qty', n, 'out', v_out, 'minutes', round(mins)));
end $$;
create or replace function public.smoke_take() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); got jsonb;
begin
  perform fx_fisher(u); perform fx_smoke(u);
  got := fx_smoke_collect(u);
  if got is null then raise exception 'Toodang pole veel valmis'; end if;
  return smoke_state() || jsonb_build_object('taken', got);
end $$;
-- ahju taseme ja täiustuste ostmine
create or replace function public.smoke_upgrade(p_what text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; p fisher_proc; s fisher_smoke; cost jsonb; k text; sv saves; have numeric; up jsonb;
begin
  f := fx_fisher(u); p := fx_proc(u); s := fx_smoke(u);
  perform 1 from fisher_smoke where user_id = u for update;
  if p.ws < 3 then raise exception 'Suitsuahi avaneb Kalurimaja töökoja 3. tasemel'; end if;
  if p_what = 'lvl' then
    if s.lvl >= 10 then raise exception 'Suitsuahi on juba legendaarne'; end if;
    cost := fx_smoke_lvl_cost(s.lvl + 1);
  else
    select x into up from jsonb_array_elements(fx_smoke_upgs()) x where x ->> 'id' = p_what;
    if up is null then raise exception 'Tundmatu täiustus'; end if;
    if p_what = any(s.upg) then raise exception 'See täiustus on juba olemas'; end if;
    if s.lvl < (up ->> 'lvl')::int then raise exception 'Vajab suitsuahju % taset', up ->> 'lvl'; end if;
    cost := up;
  end if;
  if f.gold < coalesce((cost ->> 'gold')::int, 0) then raise exception 'Kulda jääb puudu (vaja %)', cost ->> 'gold'; end if;
  for k in select jsonb_object_keys(coalesce(cost -> 'mats', '{}')) loop
    if coalesce((select qty from fisher_mats where user_id = u and mat = k), 0) < (cost -> 'mats' ->> k)::int then
      raise exception 'Materjali „%“ jääb puudu (vaja %)', (select name from fish_mats where id = k), cost -> 'mats' ->> k; end if;
  end loop;
  if cost ? 'wood' then
    select * into sv from saves where user_id = u for update;
    if sv.user_id is null then raise exception 'Kuningriik pole veel salvestatud – oota paar sekundit'; end if;
    foreach k in array array['wood','stone'] loop
      have := coalesce((sv.data -> 'res' ->> k)::numeric, 0);
      if have < coalesce((cost ->> k)::int, 0) then raise exception '% on vaja % (sul on %)', case k when 'wood' then 'Puitu' else 'Kivi' end, cost ->> k, floor(have); end if;
      sv.data := jsonb_set(sv.data, array['res', k], to_jsonb(have - coalesce((cost ->> k)::int, 0)));
    end loop;
    update saves set data = sv.data where user_id = u;
  end if;
  for k in select jsonb_object_keys(coalesce(cost -> 'mats', '{}')) loop update fisher_mats set qty = qty - (cost -> 'mats' ->> k)::int where user_id = u and mat = k; end loop;
  update fishers set gold = gold - coalesce((cost ->> 'gold')::int, 0) where user_id = u;
  if p_what = 'lvl' then update fisher_smoke set lvl = lvl + 1 where user_id = u; else update fisher_smoke set upg = array_append(upg, p_what) where user_id = u; end if;
  return smoke_state() || jsonb_build_object('upgraded', p_what, 'spent', cost,
    'unlocked', (select coalesce(jsonb_agg(name order by sort), '[]') from fish_smoke_products where p_what = 'lvl' and min_lvl = s.lvl + 1 and (special or grp = 'ahven')));
end $$;
-- küttepuude ja maitseainete ost, puude lõhkumine kuningriigi puidust ja erimarinaadi valmistamine
create or replace function public.smoke_buy(p_item text, p_qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; s fisher_smoke; pr int; n int := greatest(1, least(500, coalesce(p_qty, 1))); sv saves; have numeric; b numeric;
begin
  f := fx_fisher(u); s := fx_smoke(u);
  if p_item = 'lohu' then
    -- 2 kuningriigi puitu → 1 lepapuu ja 1 kasepuu
    select * into sv from saves where user_id = u for update;
    have := coalesce((sv.data -> 'res' ->> 'wood')::numeric, 0);
    if sv.user_id is null or have < n * 2 then raise exception 'Kuningriigi puitu on vaja % (sul on %)', n * 2, floor(coalesce(have, 0)); end if;
    update saves set data = jsonb_set(data, '{res,wood}', to_jsonb(have - n * 2)) where user_id = u;
    perform fx_mat_add(u, 'lepp', n); perform fx_mat_add(u, 'kask', n);
    return smoke_state() || jsonb_build_object('bought', jsonb_build_object('item', 'lohu', 'qty', n));
  elsif p_item = 'marinaad' then
    if not ('riiul' = any(s.upg)) then raise exception 'Erimarinaadi jaoks on vaja maitseainete riiulit'; end if;
    update fisher_mats set qty = qty - 2 * n where user_id = u and mat = 'maitsetaim' and qty >= 2 * n; if not found then raise exception 'Vaja % maitsetaime', 2 * n; end if;
    update fisher_mats set qty = qty - n where user_id = u and mat = 'kuuslauk' and qty >= n; if not found then raise exception 'Vaja % küüslauku', n; end if;
    select * into sv from saves where user_id = u for update;
    b := coalesce((sv.data -> 'res' ->> 'berries')::numeric, 0);
    if sv.user_id is null or b < 3 * n then raise exception 'Kuningriigi varudes on vaja % marja', 3 * n; end if;
    update saves set data = jsonb_set(data, '{res,berries}', to_jsonb(b - 3 * n)) where user_id = u;
    perform fx_mat_add(u, 'marinaad', n);
    return smoke_state() || jsonb_build_object('bought', jsonb_build_object('item', 'marinaad', 'qty', n));
  end if;
  pr := case p_item when 'kask' then 3 when 'lepp' then 4 when 'ounapuu' then 8 when 'tamm' then 10 when 'sool' then 2 when 'till' then 3 when 'kuuslauk' then 4 when 'pipar' then 6 when 'maitsetaim' then 5 end;
  if pr is null then raise exception 'Seda ei saa osta'; end if;
  if f.gold < pr * n then raise exception 'Kulda jääb puudu (vaja %)', pr * n; end if;
  update fishers set gold = gold - pr * n where user_id = u;
  perform fx_mat_add(u, p_item, n);
  return smoke_state() || jsonb_build_object('bought', jsonb_build_object('item', p_item, 'qty', n, 'gold', pr * n));
end $$;
-- suitsutoodete müük kalaletis
create or replace function public.smoke_sell(p_product text, p_quality int, p_qty int) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); p fisher_proc; pr fish_smoke_products; g int;
begin
  perform fx_fisher(u); p := fx_proc(u);
  if p.ws < 5 then raise exception 'Kalalett avaneb Kalurimaja töökoja 5. tasemel'; end if;
  select * into pr from fish_smoke_products where id = p_product;
  update fisher_smoked set qty = qty - p_qty where user_id = u and product = p_product and quality = p_quality and qty >= p_qty and p_qty > 0;
  if not found then raise exception 'Sul pole nii palju'; end if;
  g := round(fx_smoke_value(pr, p_quality) * p_qty * (1 + 0.05 * fx_rep_tier(p.rep)));
  update fishers set gold = gold + g where user_id = u;
  update fisher_proc set rep = rep + g / 100 where user_id = u;
  return smoke_state() || jsonb_build_object('sold', jsonb_build_object('name', pr.name, 'qty', p_qty, 'gold', g));
end $$;

-- 6z4. Äripartnerid
create or replace function public.fx_trust(pts int) returns int language sql immutable as $$
  select 1 + (select count(*)::int from unnest(array[3,7,12,18,26,36,48,62,80]) t where pts >= t) $$;
create or replace function public.fx_trust_need(l int) returns int language sql immutable as $$
  select (array[0,3,7,12,18,26,36,48,62,80])[least(10, greatest(1, l))] $$;
-- kui palju sobivat kaupa mängijal on
create or replace function public.fx_biz_have(u uuid, w jsonb) returns int language sql stable as $$
  select case w ->> 'type'
    when 'fish' then (select count(*)::int from public.fish_catches c where c.user_id = u and c.status = 'kept'
      and (w ->> 'species' is null or c.species = w ->> 'species') and c.rarity >= coalesce((w ->> 'rmin')::int, 1)
      and c.weight >= coalesce((w ->> 'minw')::numeric, 0) and coalesce(c.age_cls, 0) >= coalesce((w ->> 'amin')::int, 0) and public.fx_fresh(u, c) >= coalesce((w ->> 'fresh')::numeric, 0))
    when 'item' then coalesce((select qty from public.fisher_items where user_id = u and item = w ->> 'item'), 0)
    when 'mat' then coalesce((select qty from public.fisher_mats where user_id = u and mat = w ->> 'mat'), 0)
    when 'smoked' then (select coalesce(sum(z.qty), 0)::int from public.fisher_smoked z join public.fish_smoke_products pr on pr.id = z.product where z.user_id = u
      and (w ->> 'grp' is null or pr.grp = w ->> 'grp') and (w ->> 'method' is null or pr.method = w ->> 'method') and (w ->> 'product' is null or pr.id = w ->> 'product')
      and z.quality >= coalesce((w ->> 'qmin')::int, 1))
    when 'hybrid' then (select count(*)::int from public.lab_fish h where h.user_id = u and h.status = 'kept' and h.rarity >= coalesce((w ->> 'rmin')::int, 1)
      and not exists (select 1 from public.lab_market lm where lm.fish_id = h.id and lm.status = 'open'))
    else 0 end $$;
create or replace function public.fx_biz_species(u uuid, lvl int, rlo int, rhi int) returns public.fish_species language sql volatile as $$
  select s.* from public.fish_species s where s.event is null and s.min_level <= lvl and s.rarity between rlo and rhi
    and exists (select 1 from public.fish_spots sp where sp.id = any(s.spots) and sp.min_level <= lvl and sp.boat is null and sp.id not in ('udulaht', 'kuningatiik'))
  order by random() limit 1 $$;
-- ühe tellimuse loomine (ettevõtte eelistuste, mängija taseme ja usalduse järgi)
create or replace function public.fx_biz_make(u uuid, comp text, p_kind text default 'order', p_ev text default null) returns void language plpgsql as $$
declare f public.fishers; p public.fisher_proc; tr int; m numeric; w jsonb; q int; est numeric; sp public.fish_species; ttl text; hrs numeric; off interval;
  mats text[]; mt text; pr int; bonus int := 0; trp int := 1; gm numeric := 1.6; rmax int; haslab boolean; k text := p_kind; ev text := p_ev;
begin
  select * into f from public.fishers where user_id = u; p := public.fx_proc(u);
  tr := public.fx_trust(coalesce((select pts from public.fisher_company where user_id = u and company = comp), 0));
  m := 1 + 0.08 * (tr - 1);
  rmax := case when f.level >= 30 then 5 when f.level >= 18 then 4 when f.level >= 8 then 3 else 2 end;
  haslab := exists (select 1 from public.lab_fish where user_id = u);
  -- erisündmused
  if k = 'event' then
    if ev = 'double' then sp := public.fx_biz_species(u, f.level, 1, 2); q := 3 + floor(random() * 6)::int; w := jsonb_build_object('type', 'fish', 'species', sp.id); est := sp.price * q * 1.2 + 30; gm := 2.4; ttl := 'Topelthinnaga kalaost';
    elsif ev = 'rare' then q := 1; w := jsonb_build_object('type', 'fish', 'rmin', least(rmax, 4)); est := (array[10,25,80,250,700])[least(rmax, 4)] + 100; gm := 3; bonus := 3; trp := 2; ttl := 'Haruldase kala otsing';
    elsif ev = 'royal' then sp := public.fx_biz_species(u, f.level, 3, rmax); if sp.id is null then sp := public.fx_biz_species(u, f.level, 2, 3); end if;
      q := 1 + floor(random() * 2)::int; w := jsonb_build_object('type', 'fish', 'species', sp.id, 'minw', round(((sp.min_w + sp.max_w) / 2 * 1.1)::numeric, 3));
      est := sp.price * q * 1.6 + 150; gm := 3; bonus := 4; trp := 3; ttl := 'Kuninglik eritellimus';
    elsif ev = 'mutant' then q := 1; w := jsonb_build_object('type', 'hybrid', 'rmin', 2); est := 600; gm := 2.5; bonus := 3; trp := 2; ttl := 'Muteerunud kala ostupakkumine';
    elsif ev = 'bulk' then sp := public.fx_biz_species(u, f.level, 1, 1); q := 18 + floor(random() * 15)::int; w := jsonb_build_object('type', 'fish', 'species', sp.id); est := sp.price * q * 1.2 + 80; gm := 2; trp := 2; ttl := 'Suure koguse tellimus';
    else ev := 'record'; sp := public.fx_biz_species(u, f.level, 1, least(rmax, 3)); q := 1; w := jsonb_build_object('type', 'fish', 'species', sp.id, 'minw', round((sp.max_w * 0.85)::numeric, 3));
      est := sp.price * 3 + 200; gm := 3.5; bonus := 4; trp := 3; ttl := 'Rekordkala otsing';
    end if;
    hrs := 1 + floor(random() * 2); off := make_interval(mins => 45 + floor(random() * 60)::int);
  else
    -- suitsutooted (kui mängijal on suitsuahi)
    if comp in ('restoran','kalaturg','loss','gild','toostus','akvaarium','korts') and p.ws >= 3 and exists (select 1 from public.fisher_smoke where user_id = u) and random() < 0.35 then
      declare g text; cand text[]; mt text := 'kuum'; qm int := 1; gnm text; gp int;
      begin
        cand := case comp when 'restoran' then array['ahven','koha','haug','forell'] when 'kalaturg' then array['sarg','ahven','latikas','raim'] when 'loss' then array['lohe','forell','koha']
          when 'gild' then array['angerjas','raim','haug'] when 'toostus' then array['raim','sarg','latikas'] when 'korts' then array['raim','ahven','angerjas','sarg'] else array['ahven','sarg'] end;
        cand := array(select x from unnest(cand) x where f.level >= case x when 'latikas' then 3 when 'haug' then 4 when 'koha' then 8 when 'forell' then 8 when 'angerjas' then 10 when 'lohe' then 14 when 'raim' then 18 when 'tuulehaug' then 19 else 1 end);
        if array_length(cand, 1) is null then cand := array['ahven']; end if;
        g := cand[1 + floor(random() * array_length(cand, 1))::int];
        if comp = 'loss' then mt := case when (select lvl from public.fisher_smoke where user_id = u) >= 3 then 'kulm' else 'kuum' end; qm := 3; end if;
        q := case comp when 'toostus' then 15 + floor(random() * 11) when 'loss' then 2 + floor(random() * 3) when 'gild' then 3 + floor(random() * 4) else 4 + floor(random() * 7) end;
        q := greatest(1, round(q * (1 + 0.08 * (tr - 1))))::int;
        select name, price into gnm, gp from public.fish_smoke_products where id = g || ':' || mt;
        w := jsonb_build_object('type', 'smoked', 'grp', g, 'method', mt, 'product', g || ':' || mt) || case when qm > 1 then jsonb_build_object('qmin', qm) else '{}' end;
        est := gp * q * case when qm > 1 then 1.4 else 1.1 end + 20; ttl := gnm;
      end;
    end if;
    -- tavaline tellimus ettevõtte maitse järgi
    if w is not null then null;
    elsif comp = 'restoran' then
      if random() < 0.5 then mats := array['filee','filee','filee_hea'] || case when p.ws >= 3 then array['suitsukala'] else '{}' end || case when p.ws >= 3 and p.rep >= 400 then array['kuldfilee'] else '{}' end;
      else sp := public.fx_biz_species(u, f.level, 1, 2); q := 2 + floor(random() * 3)::int + tr / 3; w := jsonb_build_object('type', 'fish', 'species', sp.id, 'fresh', 0.8); ttl := 'Värske kala köögile'; end if;
    elsif comp = 'kalaturg' then
      if random() < 0.3 then mats := array['filee'];
      else sp := public.fx_biz_species(u, f.level, 1, 2); q := 4 + floor(random() * 7)::int + tr; w := jsonb_build_object('type', 'fish', 'species', sp.id); ttl := 'Turule kala'; end if;
    elsif comp = 'loss' then
      if p.ws >= 3 and random() < 0.35 then mats := array['kuldfilee','soomuskaunistus'];
      else sp := public.fx_biz_species(u, f.level, least(3, rmax), rmax); q := 1 + case when tr >= 6 then 1 else 0 end;
        w := jsonb_build_object('type', 'fish', 'species', sp.id, 'minw', round(((sp.min_w + sp.max_w) / 2)::numeric, 3)); ttl := 'Õukonna laud'; end if;
    elsif comp = 'alkeemik' then
      if haslab and random() < 0.6 then q := 1 + floor(random() * 2)::int; w := jsonb_build_object('type', 'hybrid', 'rmin', least(3, 1 + tr / 3)); ttl := 'Muteerunud kalad uurimiseks';
      else mats := array['kuldsoomus','jaatmed'] || case when tr >= 5 then array['iidneluu'] else '{}' end; end if;
    elsif comp = 'tarbed' then mats := array['luu','soomus','jaatmed','luukonks'];
    elsif comp = 'juveliir' then
      if random() < 0.25 then mats := array['kuldsoomus'];
      else
        declare it text; ip int; inm text;
        begin
          it := (array['parl','parl','merevaik','merevaik','koopakristall','ruun','sormus','mustparl','kristall'])[1 + floor(random() * case when tr >= 6 then 9 when tr >= 3 then 7 else 4 end)::int];
          select price, name into ip, inm from public.fish_items where id = it;
          q := greatest(1, round((case when ip >= 400 then 1 when ip >= 100 then 1 + random() * 2 else 2 + random() * 3 end) * (1 + 0.08 * (tr - 1))))::int;
          w := jsonb_build_object('type', 'item', 'item', it); est := ip * q * 1.5 + 40; ttl := 'Ehtemeistrile: ' || lower(inm);
        end;
      end if;
    elsif comp = 'muuseum' then
      if random() < 0.35 then q := 1; w := jsonb_build_object('type', 'fish', 'amin', 4); est := 900 + 60 * tr; ttl := 'Legendaarse eaga kala näitusele';
      else sp := public.fx_biz_species(u, f.level, 1, least(rmax, 3)); q := 1 + case when tr >= 5 and random() < 0.5 then 1 else 0 end;
        w := jsonb_build_object('type', 'fish', 'species', sp.id, 'amin', 3); est := sp.price * q * 4 + 180; ttl := 'Vana kala näitusele'; end if;
    elsif comp = 'korts' then
      if p.ws >= 3 and random() < 0.4 then mats := array['kalasupp','suitsukala'];
      else sp := public.fx_biz_species(u, f.level, 1, 1); q := 5 + floor(random() * 6)::int + tr / 2; w := jsonb_build_object('type', 'fish', 'species', sp.id, 'fresh', 0.7); ttl := 'Meremeeste õhtusöök'; end if;
    elsif comp = 'akvaarium' then sp := public.fx_biz_species(u, f.level, 2, least(3, rmax)); q := 1 + floor(random() * 2)::int; w := jsonb_build_object('type', 'fish', 'species', sp.id, 'fresh', 0.95); ttl := 'Elus kala akvaariumisse';
    elsif comp = 'toostus' then
      if random() < 0.5 then sp := public.fx_biz_species(u, f.level, 1, 2); q := 8 + floor(random() * 9)::int + tr; w := jsonb_build_object('type', 'fish', 'species', sp.id); ttl := 'Tehasele toorkala';
      else mats := array['filee','jaatmed']; end if;
    else mats := array['luukonks','filee'] || case when p.ws >= 3 then array['suitsukala','kalasupp'] else '{}' end || case when p.ws >= 3 then array['soomuskaunistus'] else '{}' end;
    end if;
    if w is null then
      mt := mats[1 + floor(random() * array_length(mats, 1))::int];
      q := greatest(1, round((case mt when 'filee' then 10 + random() * 15 when 'filee_hea' then 3 + random() * 5 when 'jaatmed' then 12 + random() * 18 when 'luu' then 10 + random() * 15
        when 'soomus' then 8 + random() * 10 when 'luukonks' then 3 + random() * 6 when 'suitsukala' then 3 + random() * 5 when 'kalasupp' then 3 + random() * 4
        when 'kuldfilee' then 2 + random() * 3 when 'soomuskaunistus' then 1 + random() * 1.5 when 'kuldsoomus' then 1 + random() * 2 when 'iidneluu' then 1 else 5 end) * (1 + 0.1 * (tr - 1)))::int);
      if comp = 'toostus' then q := q * 2; end if;
      w := jsonb_build_object('type', 'mat', 'mat', mt);
      ttl := case mt when 'filee' then 'Fileetellimus' when 'filee_hea' then 'Esmaklassiline filee' when 'suitsukala' then 'Suitsukala tellimus' when 'kalasupp' then 'Kalasupp' when 'kuldfilee' then 'Delikatessid'
        when 'soomuskaunistus' then 'Kaunistused' when 'luukonks' then 'Konksud' when 'kuldsoomus' then 'Kuldsed soomused' when 'iidneluu' then 'Iidne luu'
        when 'jaatmed' then 'Kalajäätmed' when 'luu' then 'Kalaluud' when 'soomus' then 'Kalasoomused' else 'Materjalid' end;
      select price into pr from public.fish_mats where id = mt; est := pr * q + 20;
    elsif w ->> 'type' = 'hybrid' then est := (array[300,500,900,1400,2000])[(w ->> 'rmin')::int] * q;
    elsif w ->> 'type' = 'smoked' or w ->> 'type' = 'item' or w ? 'amin' then null; -- hind on juba arvutatud
    else est := sp.price * q * case when w ? 'minw' then 1.5 else 1 end * case when w ? 'fresh' then 1.2 else 1 end + 20;
    end if;
    hrs := 2 + floor(random() * 5); off := make_interval(hours => 3 + floor(random() * 6)::int);
    if tr >= 4 and random() < 0.25 then bonus := least(4, 2 + tr / 4); end if;
  end if;
  -- pikaajaline leping (usaldus 5+: 24 tundi, usaldus 8+: 7 päeva)
  if k = 'contract' then
    if tr >= 8 and random() < 0.5 then q := q * 12; est := est * 12; gm := gm * 1.25; hrs := 168; trp := 10; bonus := 5; ttl := '7 päeva leping: ' || ttl;
    else q := q * 4; est := est * 4; gm := gm * 1.15; hrs := 24; trp := 4; bonus := 4; ttl := '24 tunni leping: ' || ttl; end if;
    off := interval '6 hours';
  end if;
  if w is null or (w ->> 'type' = 'fish' and w ? 'species' and w ->> 'species' is null) then return; end if;
  insert into public.fisher_biz_orders(user_id, company, kind, event, title, want, qty, gold, rep, trust, bonus, offer_until, hours)
    values (u, comp, k, ev, ttl, w, q, round(est * gm * m)::int, greatest(2, round(est * gm * m / 40))::int, trp, bonus, now() + off, hrs);
end $$;
-- server haldab tellimusi: aegunud pakkumised kaovad, tähtaja ületanud tellimused ebaõnnestuvad, uued tekivad juhuslikel aegadel
create or replace function public.fx_biz_tick(u uuid) returns void language plpgsql as $$
declare b public.fisher_biz; o record; cap int; n int := 0; c text; tr int; lv int; r numeric; i int; ev text;
begin
  insert into public.fisher_biz(user_id) values (u) on conflict do nothing;
  select * into b from public.fisher_biz where user_id = u for update;
  update public.fisher_biz_orders set status = 'gone', closed_at = now() where user_id = u and status = 'open' and offer_until < now();
  for o in select * from public.fisher_biz_orders where user_id = u and status = 'active' and deadline < now() for update loop
    update public.fisher_biz_orders set status = 'failed', closed_at = now() where id = o.id;
    insert into public.fisher_company(user_id, company) values (u, o.company) on conflict do nothing;
    update public.fisher_company set pts = greatest(0, pts - case when o.kind = 'contract' then 8 else 3 end), failed = failed + 1 where user_id = u and company = o.company;
  end loop;
  if b.next_at is not null and b.next_at > now() then return; end if;
  select coalesce(level, 1) into lv from public.fishers where user_id = u;
  cap := least(7, 4 + lv / 15);
  -- mitu uut pakkumist: esimesel korral 3, hiljem 1 + lisaks iga ~45 möödunud minuti kohta (mängija äraolekul)
  n := case when b.next_at is null then 3 else 1 + least(4, floor(extract(epoch from now() - b.next_at) / 2700)::int) end;
  for i in 1..n loop
    exit when (select count(*) from public.fisher_biz_orders where user_id = u and status = 'open') >= cap;
    c := (array['restoran','kalaturg','loss','alkeemik','tarbed','akvaarium','toostus','gild','juveliir','muuseum','korts'])[1 + floor(random() * 11)::int];
    tr := public.fx_trust(coalesce((select pts from public.fisher_company where user_id = u and company = c), 0));
    r := random();
    if tr >= 5 and r < 0.12 and not exists (select 1 from public.fisher_biz_orders where user_id = u and kind = 'contract' and status in ('open','active')) then
      perform public.fx_biz_make(u, c, 'contract');
    elsif r < 0.25 and b.next_at is not null then
      ev := (array['double','rare','royal','mutant','bulk','record'])[1 + floor(random() * 6)::int];
      if ev = 'mutant' and not exists (select 1 from public.lab_fish where user_id = u) then ev := 'bulk'; end if;
      perform public.fx_biz_make(u, case ev when 'double' then 'kalaturg' when 'rare' then 'akvaarium' when 'royal' then 'loss' when 'mutant' then 'alkeemik' when 'bulk' then 'toostus' else 'loss' end, 'event', ev);
    else perform public.fx_biz_make(u, c, 'order'); end if;
  end loop;
  update public.fisher_biz set next_at = now() + make_interval(mins => 20 + floor(random() * 50)::int), made = made + n where user_id = u;
end $$;
create or replace function public.fx_biz_summary(u uuid) returns jsonb language sql stable as $$
  select jsonb_build_object('open', count(*) filter (where status = 'open'), 'max', coalesce(max(id) filter (where status = 'open'), 0),
    'ready', count(*) filter (where status = 'active' and public.fx_biz_have(u, want) >= qty - progress),
    'soon', min(deadline) filter (where status = 'active'))
  from public.fisher_biz_orders where user_id = u and status in ('open', 'active') $$;

create or replace function public.biz_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers;
begin
  f := fx_fisher(u); perform fx_proc(u); perform fx_biz_tick(u);
  return jsonb_build_object('now', now(), 'gold', f.gold, 'level', f.level, 'rep', (select rep from fisher_proc where user_id = u),
    'companies', (select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'icon', c.icon, 'color', c.color, 'descr', c.descr, 'likes', c.likes,
        'pts', coalesce(fc.pts, 0), 'trust', fx_trust(coalesce(fc.pts, 0)), 'cur', fx_trust_need(fx_trust(coalesce(fc.pts, 0))),
        'next', case when fx_trust(coalesce(fc.pts, 0)) < 10 then fx_trust_need(fx_trust(coalesce(fc.pts, 0)) + 1) end,
        'done', coalesce(fc.done, 0), 'failed', coalesce(fc.failed, 0), 'offer_ok', coalesce(fc.offer_day, '2000-01-01') < fx_today()) order by c.sort)
      from fish_companies c left join fisher_company fc on fc.user_id = u and fc.company = c.id),
    'orders', (select coalesce(jsonb_agg(to_jsonb(o) - 'user_id' || jsonb_build_object('have', fx_biz_have(u, o.want)) order by o.status = 'open', o.id desc), '[]')
      from fisher_biz_orders o where o.user_id = u and o.status in ('open', 'active')),
    'recent', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'company', x.company, 'title', x.title, 'status', x.status, 'gold', x.gold, 'at', x.closed_at) order by x.closed_at desc), '[]')
      from (select * from fisher_biz_orders where user_id = u and status in ('done', 'failed') order by closed_at desc limit 6) x),
    'active_n', (select count(*) from fisher_biz_orders where user_id = u and status = 'active' and kind <> 'contract'),
    'next_at', (select next_at from fisher_biz where user_id = u),
    'mats', (select jsonb_object_agg(id, name) from fish_mats),
    'smoked_names', (select jsonb_object_agg(id, name) from fish_smoke_products));
end $$;
create or replace function public.biz_accept(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); o fisher_biz_orders;
begin
  perform fx_fisher(u);
  select * into o from fisher_biz_orders where id = p_id and user_id = u for update;
  if o.id is null or o.status <> 'open' or o.offer_until < now() then raise exception 'Seda pakkumist enam pole'; end if;
  if o.kind <> 'contract' and (select count(*) from fisher_biz_orders where user_id = u and status = 'active' and kind <> 'contract') >= 3 then
    raise exception 'Sul on juba 3 pooleliolevat tellimust – täida mõni enne uue võtmist'; end if;
  update fisher_biz_orders set status = 'active', deadline = now() + make_interval(mins => round(hours * 60)::int) where id = o.id;
  return biz_state();
end $$;
create or replace function public.biz_decline(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid();
begin
  update fisher_biz_orders set status = 'declined', closed_at = now() where id = p_id and user_id = u and status = 'open';
  return biz_state();
end $$;
-- kauba üleandmine: server valib ise sobivad kalad (kõige väiksemad, mis nõuetele vastavad) ja kontrollib kõike
create or replace function public.biz_deliver(p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); o fisher_biz_orders; w jsonb; need int; take int; ids bigint[]; tr0 int; tr1 int; items jsonb := '[]'; done boolean := false;
begin
  perform fx_fisher(u); perform fx_proc(u);
  select * into o from fisher_biz_orders where id = p_id and user_id = u for update;
  if o.id is null or o.status not in ('open', 'active') then raise exception 'Seda tellimust enam pole või see on juba täidetud'; end if;
  if o.status = 'open' and o.offer_until < now() then raise exception 'Pakkumine on aegunud'; end if;
  if o.status = 'active' and o.deadline < now() then raise exception 'Tähtaeg on möödas'; end if;
  if o.status = 'open' and o.kind <> 'contract' and (select count(*) from fisher_biz_orders where user_id = u and status = 'active' and kind <> 'contract') >= 3 then
    raise exception 'Sul on juba 3 pooleliolevat tellimust'; end if;
  w := o.want; need := o.qty - o.progress;
  take := least(need, fx_biz_have(u, w));
  if o.kind <> 'contract' and take < need then raise exception 'Kaupa jääb puudu: sul on % / %', take, need; end if;
  if take <= 0 then raise exception 'Sul pole veel sobivat kaupa'; end if;
  if w ->> 'type' = 'fish' then
    select array_agg(id) into ids from (select c.id from fish_catches c where c.user_id = u and c.status = 'kept'
      and (w ->> 'species' is null or c.species = w ->> 'species') and c.rarity >= coalesce((w ->> 'rmin')::int, 1)
      and c.weight >= coalesce((w ->> 'minw')::numeric, 0) and coalesce(c.age_cls, 0) >= coalesce((w ->> 'amin')::int, 0) and fx_fresh(u, c) >= coalesce((w ->> 'fresh')::numeric, 0)
      order by c.weight asc limit take for update) x;
    update fish_catches set status = 'delivered' where id = any(ids);
  elsif w ->> 'type' = 'smoked' then
    declare z record; left_n int := take; d int;
    begin
      for z in select x.product, x.quality, x.qty from fisher_smoked x join fish_smoke_products pr on pr.id = x.product where x.user_id = u and x.qty > 0
          and (w ->> 'grp' is null or pr.grp = w ->> 'grp') and (w ->> 'method' is null or pr.method = w ->> 'method') and (w ->> 'product' is null or pr.id = w ->> 'product')
          and x.quality >= coalesce((w ->> 'qmin')::int, 1) order by x.quality asc for update of x loop
        exit when left_n <= 0; d := least(left_n, z.qty);
        update fisher_smoked set qty = qty - d where user_id = u and product = z.product and quality = z.quality; left_n := left_n - d;
      end loop;
      if left_n > 0 then raise exception 'Kaupa jääb puudu'; end if;
    end;
  elsif w ->> 'type' = 'item' then
    update fisher_items set qty = qty - take where user_id = u and item = w ->> 'item' and qty >= take;
    if not found then raise exception 'Kaupa jääb puudu'; end if;
  elsif w ->> 'type' = 'mat' then
    update fisher_mats set qty = qty - take where user_id = u and mat = w ->> 'mat' and qty >= take;
    if not found then raise exception 'Kaupa jääb puudu'; end if;
    if w ->> 'mat' in ('filee', 'filee_hea') then perform fx_proc_stat(u, 'order_filee', take); end if;
  else
    select array_agg(id) into ids from (select h.id from lab_fish h where h.user_id = u and h.status = 'kept' and h.rarity >= coalesce((w ->> 'rmin')::int, 1)
      and not exists (select 1 from lab_market lm where lm.fish_id = h.id and lm.status = 'open') order by h.value asc limit take for update) x;
    update lab_fish set status = 'delivered' where id = any(ids);
  end if;
  update fisher_biz_orders set progress = progress + take,
    status = case when progress + take >= qty then 'done' else 'active' end,
    deadline = coalesce(deadline, now() + make_interval(mins => round(hours * 60)::int)),
    closed_at = case when progress + take >= qty then now() end where id = o.id;
  if o.progress + take >= o.qty then
    done := true;
    insert into fisher_company(user_id, company) values (u, o.company) on conflict do nothing;
    select fx_trust(pts) into tr0 from fisher_company where user_id = u and company = o.company;
    update fisher_company set pts = pts + o.trust, done = fisher_company.done + 1 where user_id = u and company = o.company;
    select fx_trust(pts) into tr1 from fisher_company where user_id = u and company = o.company;
    update fishers set gold = gold + o.gold where user_id = u;
    update fisher_proc set rep = rep + o.rep where user_id = u;
    if o.bonus > 0 then items := fx_give_random(u, o.bonus, 1); end if;
    perform fx_proc_stat(u, 'biz_done', 1);
  end if;
  return biz_state() || jsonb_build_object('delivered', jsonb_build_object('id', o.id, 'title', o.title, 'company', o.company, 'took', take, 'done', done,
    'gold', case when done then o.gold end, 'rep', case when done then o.rep end, 'items', items, 'trust_up', case when done and tr1 > tr0 then tr1 end));
end $$;
-- ettevõtte eripakkumine (usaldus 6+, kord päevas)
create or replace function public.biz_offer(p_company text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; fc fisher_company; tr int; price int; items jsonb := '[]'; what text;
begin
  f := fx_fisher(u); perform fx_proc(u);
  select * into fc from fisher_company where user_id = u and company = p_company for update;
  tr := fx_trust(coalesce(fc.pts, 0));
  if tr < 6 then raise exception 'Eripakkumised avanevad usaldustasemel 6'; end if;
  if fc.offer_day = fx_today() then raise exception 'Tänane eripakkumine on juba kasutatud'; end if;
  price := case when tr >= 10 then 1500 when tr >= 8 then 900 else 400 end;
  if f.gold < price then raise exception 'Eripakkumine maksab % kulda', price; end if;
  update fishers set gold = gold - price where user_id = u;
  update fisher_company set offer_day = fx_today() where user_id = u and company = p_company;
  if p_company = 'tarbed' then update fishers set baits = jsonb_set(baits, '{erisoot}', to_jsonb(coalesce((baits ->> 'erisoot')::int, 0) + 6 + tr)) where user_id = u; what := (6 + tr) || ' × Erisööt';
  elsif p_company = 'alkeemik' then perform fx_mat_add(u, 'kuldsoomus', 2 + tr / 3); what := (2 + tr / 3) || ' × Kuldne soomus';
  elsif p_company = 'gild' then perform fx_mat_add(u, 'iidneluu', 1); what := '1 × Iidne luu';
  elsif p_company = 'korts' then update fishers set baits = jsonb_set(baits, '{erisoot}', to_jsonb(coalesce((baits ->> 'erisoot')::int, 0) + 4 + tr)) where user_id = u; perform fx_add_xp(u, 100 * tr); what := (4 + tr) || ' × Erisööt ja meremeeste lood (' || 100 * tr || ' kogemust)';
  elsif p_company = 'muuseum' then update fisher_proc set rep = rep + 60 * tr where user_id = u; perform fx_add_xp(u, 150 * tr); what := 'Muuseumi tänukiri: ' || 60 * tr || ' mainet ja ' || 150 * tr || ' kogemust';
  else items := fx_give_random(u, case when tr >= 10 then 5 when tr >= 8 then 4 else 3 end, 1); what := 'haruldane ese'; end if;
  return biz_state() || jsonb_build_object('offer', jsonb_build_object('company', p_company, 'price', price, 'what', what, 'items', items));
end $$;

-- ---------------------------------------------------------------------
-- 6z9. Kalurimaja ruumide uuendamine (tase 2 ja 3) ning saunaõhtu
create or replace function public.fx_cabin_upcost(r public.fish_cabin_rooms, l int) returns jsonb language sql immutable as $$
  select jsonb_build_object('gold', round(r.gold * 1.5 * l)::int, 'wood', round(r.wood * 1.2 * l)::int, 'stone', round(r.stone * 1.2 * l)::int, 'hours', r.hours * l) $$;
create or replace function public.cabin_upgrade(p_room text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; r fish_cabin_rooms; c fisher_cabin; sv saves; w numeric; st numeric; k jsonb;
begin
  f := fx_fisher(u); perform fx_cabin_fin(u);
  select * into r from fish_cabin_rooms where id = p_room; if r.id is null then raise exception 'Tundmatu ruum'; end if;
  select * into c from fisher_cabin where user_id = u and room = r.id for update;
  if c.user_id is null or c.done_at > now() then raise exception 'Taasta ruum enne uuendamist'; end if;
  if c.damage then raise exception 'Paranda ruum enne uuendamist'; end if;
  if c.lvl >= 3 then raise exception 'See ruum on juba kõrgeimal tasemel'; end if;
  if exists (select 1 from fisher_cabin where user_id = u and (done_at > now() or up_at > now())) then raise exception 'Üks töö on juba pooleli. Oota, kuni see valmib.'; end if;
  k := fx_cabin_upcost(r, c.lvl);
  if f.level < r.min_level + 4 * c.lvl then raise exception 'Uuendamiseks on vaja kalapüügi % taset', r.min_level + 4 * c.lvl; end if;
  perform 1 from fishers where user_id = u for update;
  select gold into f.gold from fishers where user_id = u;
  if f.gold < (k ->> 'gold')::int then raise exception 'Kalurikassas pole piisavalt kulda (vaja %)', k ->> 'gold'; end if;
  select * into sv from saves where user_id = u for update;
  if sv.user_id is null then raise exception 'Kuningriik pole veel salvestatud – oota paar sekundit'; end if;
  w := coalesce((sv.data -> 'res' ->> 'wood')::numeric, 0); st := coalesce((sv.data -> 'res' ->> 'stone')::numeric, 0);
  if w < (k ->> 'wood')::int then raise exception 'Puitu on vaja % (sul on %)', k ->> 'wood', floor(w); end if;
  if st < (k ->> 'stone')::int then raise exception 'Kivi on vaja % (sul on %)', k ->> 'stone', floor(st); end if;
  update saves set data = jsonb_set(jsonb_set(data, '{res,wood}', to_jsonb(w - (k ->> 'wood')::int)), '{res,stone}', to_jsonb(st - (k ->> 'stone')::int)) where user_id = u;
  update fishers set gold = gold - (k ->> 'gold')::int where user_id = u;
  update fisher_cabin set up_at = now() + make_interval(secs => round((k ->> 'hours')::numeric * 3600)::int) where user_id = u and room = r.id;
  return cabin_state() || jsonb_build_object('spent', k, 'upgrading', r.id);
end $$;
-- saunaõhtu: kord päevas kogemus ja erisöödad (rohkem kõrgema saunaga)
create or replace function public.cabin_saun() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; l int; xp int; b int;
begin
  f := fx_fisher(u); perform fx_cabin_fin(u); l := fx_room_lvl(u, 'saun');
  if l = 0 then raise exception 'Saun pole veel valmis'; end if;
  update fisher_cabin set saun_day = fx_today() where user_id = u and room = 'saun' and coalesce(saun_day, '2000-01-01') < fx_today();
  if not found then raise exception 'Täna on juba saunas käidud – tule homme tagasi'; end if;
  xp := round((60 + f.level * 12) * (case l when 1 then 1 when 2 then 1.6 else 2.2 end))::int; b := 2 + 2 * l;
  perform fx_add_xp(u, xp);
  update fishers set baits = jsonb_set(baits, '{erisoot}', to_jsonb(coalesce((baits ->> 'erisoot')::int, 0) + b)) where user_id = u;
  return cabin_state() || jsonb_build_object('saun', jsonb_build_object('xp', xp, 'bait', b));
end $$;

-- ---------------------------------------------------------------------
-- 6z-osk. Kaluri oskuste puu
--   1 oskuspunkt iga kalapüügi taseme eest (alates 2. tasemest). 3 haru × 4 oskust × 5 astet.
--   Haru järgmine oskus avaneb, kui sellesse harusse on pandud 3 punkti rohkem (0 / 3 / 6 / 9).
-- ---------------------------------------------------------------------
create or replace function public.fx_sk(u uuid, k text) returns int language sql stable as $$
  select coalesce((select (ranks ->> k)::int from public.fisher_skills where user_id = u), 0) $$;
create or replace function public.skills_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; rk jsonb; rs int; spent int;
begin
  f := fx_fisher(u);
  select ranks, resets into rk, rs from fisher_skills where user_id = u;
  rk := coalesce(rk, '{}'); rs := coalesce(rs, 0);
  select coalesce(sum(value::int), 0) into spent from jsonb_each_text(rk);
  return jsonb_build_object('defs', (select jsonb_agg(to_jsonb(d) order by d.sort) from fish_skill_defs d), 'ranks', rk,
    'points', greatest(0, f.level - 1), 'spent', spent, 'free', greatest(0, f.level - 1 - spent), 'level', f.level,
    'reset_cost', case when rs = 0 then 0 else 300 * f.level end, 'gold', f.gold);
end $$;
create or replace function public.skill_up(p_id text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fish_skill_defs; rk jsonb; spent int; inb int; cur int;
begin
  f := fx_fisher(u);
  select * into d from fish_skill_defs where id = p_id;
  if d.id is null then raise exception 'Tundmatu oskus'; end if;
  insert into fisher_skills(user_id) values (u) on conflict do nothing;
  select ranks into rk from fisher_skills where user_id = u for update;
  cur := coalesce((rk ->> d.id)::int, 0);
  if cur >= d.max then raise exception 'See oskus on juba täiesti arendatud'; end if;
  select coalesce(sum(value::int), 0) into spent from jsonb_each_text(rk);
  if spent >= f.level - 1 then raise exception 'Sul pole vabu oskuspunkte. Uus punkt tuleb järgmisel kalapüügi tasemel.'; end if;
  select coalesce(sum((rk ->> x.id)::int), 0) into inb from fish_skill_defs x where x.branch = d.branch;
  if inb < d.tier * 3 then raise exception 'Selle oskuse avamiseks pane sellesse harusse veel % punkti', d.tier * 3 - inb; end if;
  update fisher_skills set ranks = jsonb_set(ranks, array[d.id], to_jsonb(cur + 1)) where user_id = u;
  return skills_state() || jsonb_build_object('up', d.id);
end $$;
create or replace function public.skills_reset() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; rs int; cost int;
begin
  f := fx_fisher(u);
  select resets into rs from fisher_skills where user_id = u for update;
  if rs is null then raise exception 'Sul pole veel ühtegi oskust'; end if;
  cost := case when rs = 0 then 0 else 300 * f.level end;
  if f.gold < cost then raise exception 'Oskuste ümberjagamine maksab % kulda', cost; end if;
  update fishers set gold = gold - cost where user_id = u;
  update fisher_skills set ranks = '{}', resets = resets + 1 where user_id = u;
  return skills_state() || jsonb_build_object('reset', true, 'paid', cost);
end $$;

-- ---------------------------------------------------------------------
-- 6z-droon. Kalapüügidroon: püüab valitud kohas sinu söödaga ka siis, kui oled eemal
--   Droon toob iga paari minuti järel kala korvi. Igale kalale kulub akut; kui aku on tühi,
--   korv täis või sööt otsas, jääb droon ootama. Sadamas (tagasi kutsutuna) laeb aku end 40 minutiga täis,
--   kiirlaadimine maksab kulda. Autopiloodiga lendab droon ise koju laadima ja tühjendab korvi laohoonesse.
--   Müütilisi kalu droon ei püüa, legendaarseid ainult kõige parem droon.
-- ---------------------------------------------------------------------
alter table public.fisher_drone add column if not exists bat numeric not null default 100;
alter table public.fisher_drone add column if not exists dock_at timestamptz;
alter table public.fisher_drone add column if not exists parts jsonb not null default '{}';
alter table public.fisher_drone add column if not exists auto boolean not null default false;
-- drooni osad: iga osa tase kuni drooni enda tasemeni (max 5)
create or replace function public.fx_drone_part(u uuid, k text) returns int language sql stable as $$
  select coalesce((select (parts ->> k)::int from public.fisher_drone where user_id = u), 0) $$;
create or replace function public.fx_drone_parts_def() returns jsonb language sql immutable as $$
  select '{"aku":{"name":"Suurem aku","base":4000,"per":15,"txt":"Aku kestab kauem"},
           "mootor":{"name":"Kiired propellerid","base":5000,"per":6,"txt":"Üks kala tuleb kiiremini"},
           "korv":{"name":"Suurem korv","base":3000,"per":20,"txt":"Korvi mahub rohkem kala"},
           "sonar":{"name":"Kalasonar","base":6000,"per":4,"txt":"Võimalus, et droon leiab haruldasema kala"},
           "soodur":{"name":"Söödasäästja","base":3500,"per":8,"txt":"Võimalus, et sööt jääb alles"},
           "haarats":{"name":"Aardehaarats","base":7000,"per":1.5,"txt":"Võimalus, et droon toob vee alt ka mõne eseme"}}'::jsonb $$;
create or replace function public.fx_drone_cfg(l int) returns jsonb language sql immutable as $$
  select (case l
    when 1 then '{"lvl":1,"min":4,"cap":12,"fly":60,"maxr":2,"cost":20000,"need":10,"name":"Kärbes"}'
    when 2 then '{"lvl":2,"min":3.5,"cap":18,"fly":80,"maxr":3,"cost":45000,"need":20,"name":"Kiil"}'
    when 3 then '{"lvl":3,"min":3,"cap":25,"fly":100,"maxr":3,"cost":90000,"need":30,"name":"Kajakas"}'
    when 4 then '{"lvl":4,"min":2.5,"cap":35,"fly":120,"maxr":4,"cost":150000,"need":40,"name":"Merikotkas"}'
    when 5 then '{"lvl":5,"min":2,"cap":50,"fly":150,"maxr":4,"cost":240000,"need":50,"name":"Tormilind"}'
    when 6 then '{"lvl":6,"min":1.7,"cap":65,"fly":180,"maxr":4,"cost":380000,"need":60,"name":"Virmalisvalvur"}'
    when 7 then '{"lvl":7,"min":1.5,"cap":80,"fly":210,"maxr":5,"cost":600000,"need":70,"name":"Fööniks"}'
    else null end)::jsonb $$;
create or replace function public.fx_drone_cap(u uuid, l int) returns int language sql stable as $$
  select round((public.fx_drone_cfg(l) ->> 'cap')::numeric * (1 + 0.2 * public.fx_drone_part(u, 'korv')))::int $$;
-- mitu sekundit kulub droonil ühe kala püüdmiseks
create or replace function public.fx_drone_sec(u uuid, l int) returns numeric language sql stable as $$
  select (public.fx_drone_cfg(l) ->> 'min')::numeric * 60 * (1 - 0.05 * public.fx_sk(u, 'droonimeister')) * (1 - 0.06 * public.fx_drone_part(u, 'mootor')) $$;
-- aku protsent ühe kala kohta
create or replace function public.fx_drone_drain(u uuid, l int) returns numeric language sql stable as $$
  select public.fx_drone_sec(u, l) / ((public.fx_drone_cfg(l) ->> 'fly')::numeric * 60 * (1 + 0.15 * public.fx_drone_part(u, 'aku')) * (1 + 0.1 * public.fx_sk(u, 'droonimehaanik'))) * 100 $$;
-- drooni püük ajas: mitu kala on toodud, aku praegu, kas laeb, mitu sekundit järgmise kalani.
--   Autopiloodiga: kui aku tühjeneb, lendab droon koju, laeb (40 min täis) ja lendab tagasi; laohoonesse mahub 4 korvitäit.
create or replace function public.fx_drone_sim(u uuid) returns jsonb language plpgsql stable as $$
declare d fisher_drone; sec numeric; drain numeric; el numeric; f0 int; ff int; t numeric; n int := 0; bat numeric; chg boolean := false; nxt numeric;
  chg0 numeric; cyc numeric; fl int; k int; hold int; b fish_baits; cnt int;
begin
  select * into d from fisher_drone where user_id = u;
  if d.user_id is null or d.spot is null or d.last_at is null then return jsonb_build_object('n', 0, 'bat', coalesce(d.bat, 0), 'chg', false); end if;
  sec := fx_drone_sec(u, d.lvl); drain := fx_drone_drain(u, d.lvl); el := extract(epoch from now() - d.last_at);
  f0 := floor(d.bat / drain + 1e-6)::int; hold := fx_drone_cap(u, d.lvl);
  if not d.auto then
    n := least(floor(el / sec)::int, f0); bat := d.bat - n * drain;
    nxt := case when n < f0 then sec * (n + 1) - el end;
  else
    hold := hold * 4; ff := floor(100 / drain + 1e-6)::int;
    if el < f0 * sec then n := floor(el / sec)::int; bat := d.bat - n * drain; nxt := sec * (n + 1) - el;
    else
      n := f0; t := el - f0 * sec; bat := d.bat - f0 * drain; chg0 := (100 - bat) / 100 * 2400;
      if t < chg0 then bat := bat + t / 2400 * 100; chg := true; nxt := chg0 - t + sec;
      else
        t := t - chg0; cyc := ff * sec + ff * drain / 100 * 2400; fl := floor(t / cyc)::int; n := n + fl * ff; t := t - fl * cyc;
        if t < ff * sec then k := floor(t / sec)::int; n := n + k; bat := 100 - k * drain; nxt := sec * (k + 1) - t;
        else n := n + ff; bat := 100 - ff * drain + (t - ff * sec) / 2400 * 100; chg := true; nxt := ff * drain / 100 * 2400 - (t - ff * sec) + sec; end if;
      end if;
    end if;
  end if;
  if n >= hold then n := hold; nxt := null; end if;
  select * into b from fish_baits where id = d.bait;
  if b.consumable then select coalesce((baits ->> d.bait)::int, 0) into cnt from fishers where user_id = u; if n >= cnt then n := cnt; nxt := null; end if; end if;
  return jsonb_build_object('n', greatest(0, n), 'bat', round(least(100, greatest(0, bat)), 2), 'chg', chg, 'nxt', round(nxt), 'hold', hold);
end $$;
create or replace function public.fx_drone_ready(u uuid) returns int language sql stable as $$
  select (public.fx_drone_sim(u) ->> 'n')::int $$;
-- aku praegu (sadamas laeb, püügil kulub iga toodud kalaga)
create or replace function public.fx_drone_bat(u uuid) returns numeric language plpgsql stable as $$
declare d fisher_drone;
begin
  select * into d from fisher_drone where user_id = u;
  if d.user_id is null then return 0; end if;
  if d.spot is null then return least(100, d.bat + coalesce(extract(epoch from now() - d.dock_at), 0) / (40 * 60) * 100); end if;
  return (fx_drone_sim(u) ->> 'bat')::numeric;
end $$;
create or replace function public.drone_state() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fisher_drone; cfg jsonb; sec numeric; rdy int; b fish_baits; left_b int; cap int; el numeric; v_bat numeric; drain numeric; why text; sm jsonb;
begin
  f := fx_fisher(u);
  select * into d from fisher_drone where user_id = u;
  if d.user_id is null then
    return jsonb_build_object('have', false, 'next', fx_drone_cfg(1), 'level', f.level, 'gold', f.gold);
  end if;
  cfg := fx_drone_cfg(d.lvl); sec := fx_drone_sec(u, d.lvl); sm := fx_drone_sim(u); rdy := (sm ->> 'n')::int;
  cap := case when d.spot is not null then coalesce((sm ->> 'hold')::int, fx_drone_cap(u, d.lvl)) else fx_drone_cap(u, d.lvl) * (case when d.auto then 4 else 1 end) end;
  drain := fx_drone_drain(u, d.lvl); v_bat := fx_drone_bat(u);
  select * into b from fish_baits where id = d.bait;
  left_b := case when b.consumable then coalesce((f.baits ->> d.bait)::int, 0) end;
  el := case when d.last_at is not null then extract(epoch from now() - d.last_at) end;
  why := case when d.spot is null then null when rdy >= cap then 'full' when left_b is not null and rdy >= left_b then 'bait' when not d.auto and v_bat < drain - 1e-6 then 'bat' end;
  return jsonb_build_object('have', true, 'lvl', d.lvl, 'cfg', cfg, 'next', fx_drone_cfg(d.lvl + 1), 'spot', d.spot, 'bait', d.bait,
    'ready', rdy, 'sec', round(sec), 'total', d.total, 'level', f.level, 'gold', f.gold, 'baits_left', left_b,
    'bat', round(v_bat, 1), 'drain', round(drain, 2), 'why', why, 'stuck', why is not null,
    'charge_cost', ceil(100 - v_bat)::int * 15 * d.lvl, 'cap', cap, 'basket', fx_drone_cap(u, d.lvl), 'auto', d.auto, 'charging', d.spot is not null and (sm ->> 'chg')::boolean,
    'auto_cost', 60000, 'auto_need', 3, 'fly', round(sec / (drain / 100) / 60), 'parts', d.parts, 'pdef', fx_drone_parts_def(),
    'full_at', case when d.spot is null and v_bat < 100 then now() + make_interval(secs => (100 - v_bat) / 100 * 40 * 60) end,
    'next_at', case when why is null and d.spot is not null and sm ->> 'nxt' is not null then now() + make_interval(secs => (sm ->> 'nxt')::numeric) end);
end $$;
create or replace function public.drone_buy() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fisher_drone; nx jsonb;
begin
  f := fx_fisher(u);
  select * into d from fisher_drone where user_id = u for update;
  nx := fx_drone_cfg(coalesce(d.lvl, 0) + 1);
  if nx is null then raise exception 'Droon on juba kõige parem'; end if;
  if f.level < (nx ->> 'need')::int then raise exception 'Selleks on vaja kalapüügi % taset', nx ->> 'need'; end if;
  if f.gold < (nx ->> 'cost')::int then raise exception 'Kulda ei jätku (vaja %)', nx ->> 'cost'; end if;
  if d.user_id is not null and fx_drone_ready(u) > 0 then perform drone_collect(); end if; -- senine saak korjatakse enne kokku
  update fishers set gold = gold - (nx ->> 'cost')::int where user_id = u;
  if d.user_id is null then insert into fisher_drone(user_id, bat, dock_at) values (u, 100, now());
  else update fisher_drone set lvl = lvl + 1, last_at = case when spot is not null then now() end where user_id = u; end if;
  return drone_state() || jsonb_build_object('bought', nx);
end $$;
create or replace function public.drone_send(p_spot text, p_bait text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fisher_drone; sp fish_spots; b fish_baits; v_bat numeric;
begin
  f := fx_fisher(u);
  select * into d from fisher_drone where user_id = u for update;
  if d.user_id is null then raise exception 'Sul pole veel drooni'; end if;
  select * into sp from fish_spots where id = p_spot;
  if sp.id is null then raise exception 'Tundmatu püügikoht'; end if;
  if f.level < sp.min_level then raise exception 'See püügikoht avaneb kalapüügi % tasemel', sp.min_level; end if;
  if sp.boat is not null and not (sp.boat = any(f.boats)) then raise exception 'Sinna pääsemiseks on vaja paati'; end if;
  if p_spot = 'udulaht' and not fx_room(u, 'sild') then raise exception 'Udulahte pääseb, kui Kalurimaja paadisild on korras'; end if;
  perform fx_lic_check(u, p_spot);
  select * into b from fish_baits where id = p_bait;
  if b.id is null then raise exception 'Tundmatu sööt'; end if;
  if b.consumable and coalesce((f.baits ->> b.id)::int, 0) < 1 then raise exception 'Sul pole seda sööta'; end if;
  if not b.consumable and b.price > 0 and not (f.baits ? b.id) then raise exception 'Sul pole seda lanti'; end if;
  if fx_drone_ready(u) > 0 then perform drone_collect(); end if;
  v_bat := fx_drone_bat(u);
  if not d.auto and v_bat < fx_drone_drain(u, d.lvl) then raise exception 'Drooni aku on tühi – lase sel sadamas laadida või kasuta kiirlaadimist'; end if;
  update fisher_drone set spot = p_spot, bait = p_bait, last_at = now(), bat = v_bat, dock_at = null where user_id = u;
  return drone_state() || jsonb_build_object('sent', p_spot);
end $$;
create or replace function public.drone_recall() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); r jsonb := '{}';
begin
  if fx_drone_ready(u) > 0 then r := drone_collect(); end if;
  update fisher_drone set spot = null, last_at = null, dock_at = now() where user_id = u and spot is not null;
  return drone_state() || jsonb_build_object('recalled', true, 'collected', r -> 'collected');
end $$;
-- drooni osa uuendus: hind = alus × (tase+1)², osa tase ei saa olla kõrgem kui drooni tase
create or replace function public.drone_part_up(p_part text) returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fisher_drone; def jsonb := fx_drone_parts_def() -> p_part; cur int; cost int;
begin
  f := fx_fisher(u);
  select * into d from fisher_drone where user_id = u for update;
  if d.user_id is null then raise exception 'Sul pole veel drooni'; end if;
  if def is null then raise exception 'Tundmatu osa'; end if;
  cur := coalesce((d.parts ->> p_part)::int, 0);
  if cur >= 7 then raise exception 'See osa on juba parim'; end if;
  if cur >= d.lvl then raise exception 'Osa saab uuendada drooni tasemeni – uuenda enne drooni ennast'; end if;
  cost := (def ->> 'base')::int * (cur + 1) * (cur + 1);
  if f.gold < cost then raise exception 'Kulda ei jätku (vaja %)', cost; end if;
  if d.spot is not null and fx_drone_ready(u) > 0 then perform drone_collect(); end if; -- saak korjatakse enne kokku
  update fishers set gold = gold - cost where user_id = u;
  update fisher_drone set parts = jsonb_set(parts, array[p_part], to_jsonb(cur + 1)), last_at = case when spot is not null then now() end where user_id = u;
  return drone_state() || jsonb_build_object('part', p_part, 'paid', cost);
end $$;
-- autopiloot: ühekordne ost (drooni 3. tasemest)
create or replace function public.drone_auto_buy() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fisher_drone;
begin
  f := fx_fisher(u);
  select * into d from fisher_drone where user_id = u for update;
  if d.user_id is null then raise exception 'Sul pole veel drooni'; end if;
  if d.auto then raise exception 'Autopiloot on juba olemas'; end if;
  if d.lvl < 3 then raise exception 'Autopiloodi saab paigaldada drooni 3. tasemest'; end if;
  if f.gold < 60000 then raise exception 'Kulda ei jätku (vaja 60000)'; end if;
  if d.spot is not null and fx_drone_ready(u) > 0 then perform drone_collect(); end if;
  update fishers set gold = gold - 60000 where user_id = u;
  update fisher_drone set auto = true, bat = case when spot is not null then fx_drone_bat(u) else bat end, last_at = case when spot is not null then now() end where user_id = u;
  return drone_state() || jsonb_build_object('autobought', true);
end $$;
-- kiirlaadimine: aku kohe täis (kulda 15 × drooni tase iga puuduva protsendi eest)
create or replace function public.drone_charge() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fisher_drone; v_bat numeric; cost int; r jsonb := '{}';
begin
  f := fx_fisher(u);
  select * into d from fisher_drone where user_id = u;
  if d.user_id is null then raise exception 'Sul pole veel drooni'; end if;
  if d.spot is not null and fx_drone_ready(u) > 0 then r := drone_collect(); end if;
  v_bat := fx_drone_bat(u);
  if v_bat >= 99.5 then raise exception 'Aku on juba täis'; end if;
  cost := ceil(100 - v_bat)::int * 15 * d.lvl;
  select * into f from fishers where user_id = u;
  if f.gold < cost then raise exception 'Kiirlaadimine maksab % kulda', cost; end if;
  update fishers set gold = gold - cost where user_id = u;
  update fisher_drone set bat = 100, last_at = case when spot is not null then now() end, dock_at = case when spot is null then now() end where user_id = u;
  return drone_state() || jsonb_build_object('charged', cost, 'collected', r -> 'collected');
end $$;
create or replace function public.drone_collect() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); f fishers; d fisher_drone; cfg jsonb; n int; i int; j int; w numeric[]; tot numeric; roll numeric; rar int; s fish_species;
  wt numeric; strength numeric; got jsonb := '[]'; cid bigint; xp int := 0; levels int[]; wthr text := fx_weather(); winter boolean := fx_is_winter();
  night boolean := fx_is_night(); b fish_baits; maxr int; sec numeric; tn int; used int; sm jsonb; items jsonb := '[]'; hz int;
begin
  f := fx_fisher(u);
  select * into d from fisher_drone where user_id = u for update;
  if d.user_id is null or d.spot is null then raise exception 'Droon ei ole praegu püügil'; end if;
  sm := fx_drone_sim(u); n := (sm ->> 'n')::int; hz := fx_drone_part(u, 'haarats');
  if n < 1 then raise exception 'Droon pole veel ühtegi kala toonud'; end if;
  cfg := fx_drone_cfg(d.lvl); maxr := (cfg ->> 'maxr')::int; sec := fx_drone_sec(u, d.lvl);
  tn := floor(extract(epoch from now() - d.last_at) / sec)::int; -- nii palju oleks aja järgi jõudnud
  select * into b from fish_baits where id = d.bait;
  w := fx_rarity_weights(u, d.spot, d.bait);
  strength := (fx_gear(u) ->> 'strength')::numeric;
  tot := 0; for j in 1..maxr loop tot := tot + coalesce(w[j], 0); end loop;
  for i in 1..n loop
    roll := random() * tot; rar := 1;
    for j in 1..maxr loop rar := j; roll := roll - coalesce(w[j], 0); exit when roll <= 0; end loop;
    if rar < maxr and random() < 0.04 * fx_drone_part(u, 'sonar') then rar := rar + 1; end if; -- kalasonar
    s := null;
    while s.id is null and rar >= 1 loop
      select fs.* into s from fish_species fs where fs.rarity = rar and d.spot = any(fs.spots) and fs.min_level <= f.level and fs.event is null
        and fs.weather is null and (not fs.night_only or night) and (not fs.winter_only or winter or d.spot = 'jaa')
        order by -ln(greatest(random(), 1e-9)) / (case when d.bait = any(fs.baits) then 4 else 1 end) limit 1;
      rar := rar - 1;
    end loop;
    continue when s.id is null;
    wt := (s.min_w + (s.max_w - s.min_w) * power(random(), 2.2)) * (1 + 0.02 * fx_sk(u, 'raskesaak'));
    wt := least(wt, greatest(s.min_w, strength * 0.95)); -- droon ei too õnge jaoks liiga rasket kala
    wt := round(wt, case when wt < 1 then 3 else 2 end);
    insert into fish_catches(user_id, species, rarity, weight, spot, night, weather, trap) values (u, s.id, s.rarity, wt, d.spot, night, wthr, 'droon') returning id into cid;
    got := got || jsonb_build_array(jsonb_build_object('id', cid, 'species', s.id, 'name', s.name, 'rarity', s.rarity, 'weight', wt));
    xp := xp + round(s.xp * 0.4);
    if hz > 0 and random() < 0.015 * hz then items := items || fx_give_random(u, least(5, 1 + (hz + 1) / 2), 1); end if; -- aardehaarats
  end loop;
  if b.consumable then
    used := 0; for i in 1..n loop if random() >= 0.08 * fx_drone_part(u, 'soodur') then used := used + 1; end if; end loop; -- söödasäästja
    update fishers set baits = jsonb_set(baits, array[b.id], to_jsonb(greatest(0, coalesce((baits ->> b.id)::int, 0) - used))) where user_id = u;
  end if;
  update fishers set total = total + jsonb_array_length(got) where user_id = u;
  update fisher_drone set total = total + jsonb_array_length(got), bat = greatest(0, bat - n * fx_drone_drain(u, d.lvl)),
    last_at = case when n < tn then now() else last_at + make_interval(secs => sec * n) end where user_id = u;
  if d.auto then update fisher_drone set bat = (sm ->> 'bat')::numeric, last_at = now() where user_id = u; end if; -- autopiloot: jätka sealt, kus aku praegu on
  xp := xp * fx_xp_mult();
  levels := fx_add_xp(u, xp);
  return drone_state() || jsonb_build_object('collected', jsonb_build_object('fish', got, 'xp', xp, 'spot', d.spot, 'items', items), 'lvlup', to_jsonb(levels), 'ach', fx_check_ach(u));
end $$;

-- ---------------------------------------------------------------------
-- 7. Õigused: abifunktsioone ei saa otse kutsuda, mängu funktsioone ainult sisseloginud mängija
-- ---------------------------------------------------------------------
do $$ declare r record; begin
  for r in select p.oid::regprocedure as sig, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and (p.proname like 'fx\_%' or p.proname in
             ('set_profile','kingdom_leaderboard','save_kingdom','fish_state','fish_odds','fish_cast','fish_hook','fish_lose','fish_land',
              'fish_market','fish_use','fish_sell_all','fish_shop','fish_orders_today','fish_order_deliver','kingdom_claim',
              'fish_competitions','fish_claim_prizes','fish_item_sell','fish_quests','fish_quest_claim','kingdom_news',
              'fish_house_upgrade','fish_aquarium_put','fish_aquarium_take','fish_aquarium_collect','fish_aquarium_view','fish_aquariums','fish_aquarium_like',
              'fish_rod_upgrade','fish_enchant','fish_boat_buy',
              'fish_market_list','fish_market_cancel','fish_market_buy','fish_market_browse','fish_market_mine',
              'kingdom_visit','kingdom_gift_send','monument_state','monument_contribute','fish_kalatund','fish_kt_claim',
              'secret_state','secret_cave_start','secret_cave_go','secret_cave_leave',
              'secret_castle_hall','secret_boss_attack','secret_boss_claim',
              'secret_animal_tame','secret_animal_gifts','secret_ring','daily_state','daily_claim',
              'lab_state','lab_fuse','lab_upgrade','lab_tank','lab_sell','lab_list','lab_unlist','lab_buy','lab_deliver',
              'research_state','research_start','research_rush','research_claim','research_gene','research_skill',
              'gear_state','gear_buy','license_buy','trap_set','trap_lift','trap_collect',
              'wear_state','clothes_buy','clothes_wear','clothes_auto','clothes_autoset','clothes_color',
              'event_state','event_quest_claim','event_prize_claim','journey_advance','duel_ping','duel_invite','duel_answer',
              'weather_state', 'duel_invite_bot', 'presence_ping', 'journey_swap', 'cabin_state', 'cabin_build', 'cabin_rush', 'cabin_upgrade', 'cabin_saun', 'proc_daily_claim', 'skills_state', 'skill_up', 'skills_reset', 'drone_state', 'drone_buy', 'drone_send', 'drone_recall', 'drone_collect', 'drone_charge', 'drone_part_up', 'drone_auto_buy', 'fish_diary', 'fish_stats', 'kingdom_news_older', 'license_state', 'license_buy2', 'away_digest', 'cabin_repair', 'proc_state', 'proc_start', 'proc_finish', 'proc_cancel', 'proc_upgrade', 'proc_sell', 'proc_order', 'proc_quest', 'proc_feed', 'biz_state', 'biz_accept', 'biz_decline', 'biz_deliver', 'biz_offer', 'smoke_state', 'smoke_start', 'smoke_take', 'smoke_upgrade', 'smoke_buy', 'smoke_sell', 'fleet_state', 'fleet_buy', 'fleet_upgrade', 'fleet_repair', 'fleet_crew', 'fleet_send', 'fleet_collect', 'bots_world', 'bot_gift_send', 'bot_aquarium_like')) loop
    execute format('revoke all on function %s from public, anon', r.sig);
    if r.proname like 'fx\_%' then
      execute format('revoke all on function %s from authenticated', r.sig);
    else
      execute format('grant execute on function %s to authenticated', r.sig);
    end if;
  end loop;
end $$;
