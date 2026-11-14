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
  status text not null default 'kept', -- kept|trophy|sold|cooked|released|exchanged|delivered
  caught_at timestamptz not null default now()
);
create index if not exists fish_catches_user on public.fish_catches(user_id, status);
create index if not exists fish_catches_time on public.fish_catches(caught_at);
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
 ('muutiline','Müütiline õng',80000,48,500,0.32,0.19,10)
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
 (1,'Kaluri onn','Väike onn järve kaldal. Siia mahub esimene akvaarium.',300,3,'{}',0.02,0.03,0.04,3),
 (2,'Paadikuur','Kuur paadi ja võrkude jaoks.',800,6,'{"karp":5}',0.04,0.06,0.08,4),
 (3,'Kalurionn','Soe onn suitsuahjuga.',1800,9,'{"karp":10,"parl":2}',0.06,0.09,0.12,5),
 (4,'Kalamaja','Päris kalamaja oma sillaga.',3500,13,'{"parl":4,"merevaik":3}',0.08,0.12,0.16,6),
 (5,'Suur kalamaja','Kahekordne maja suure akvaariumiga.',6000,17,'{"merevaik":5,"ruun":2}',0.10,0.15,0.20,7),
 (6,'Kalurimõis','Mõis, kuhu tullakse kaugelt kalu vaatama.',10000,22,'{"ruun":3,"sormus":2}',0.12,0.18,0.24,8),
 (7,'Sadamamaja','Maja oma väikese sadamaga.',16000,27,'{"sormus":3,"mustparl":1}',0.14,0.21,0.28,9),
 (8,'Kuninglik kalamaja','Kuningas ise käib siin kala söömas.',25000,33,'{"mustparl":2,"kristall":1}',0.16,0.24,0.32,10),
 (9,'Järvede loss','Klaasseintega loss vee kohal.',40000,40,'{"kristall":2,"soomus":1}',0.18,0.27,0.36,11),
 (10,'Veekuninga palee','Legendaarne palee, mille akvaariumist räägib kogu kuningriik.',65000,46,'{"kristall":3,"soomus":2}',0.20,0.30,0.40,12)
on conflict (level) do update set name=excluded.name, descr=excluded.descr, gold=excluded.gold, min_fish_level=excluded.min_fish_level,
  items=excluded.items, sell_bonus=excluded.sell_bonus, xp_bonus=excluded.xp_bonus, bait_save=excluded.bait_save, slots=excluded.slots;

insert into public.fish_achievements (id,name,descr,title,reward_gold,reward_xp,sort) values
 ('maja1','Oma nurk','Ehita kalamaja',null,200,100,29),
 ('maja5','Suur kalamaja','Täienda kalamaja 5. tasemele','Majaperemees',1500,800,30),
 ('maja10','Veekuninga palee','Täienda kalamaja 10. tasemele','Veekuningas',10000,5000,31),
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
 ('kahv1','kahv',1,'Väike kahv','Kala pääseb viimasel hetkel 30% harvemini ja raske kala rebib tamiili 15% harvemini katki.',150,2,0.30,0.15,1),
 ('kahv2','kahv',2,'Teleskoopkahv','Pikk vars ulatub kaugele: 50% vähem põgenemisi, 25% vähem katkiminekuid.',900,8,0.50,0.25,2),
 ('kahv3','kahv',3,'Kummeeritud suurkahv','Suur kummeeritud võrk ka hiidkaladele: 70% vähem põgenemisi, 35% vähem katkiminekuid.',3500,16,0.70,0.35,3),
 ('korv1','korv',1,'Söödakorv','Puistab põhja peibutussööta: kala võtab 15% kiiremini, latikat, karpkala ja teisi rahulikke kalu tuleb 1,5× rohkem.',200,3,0.15,1.5,4),
 ('korv2','korv',2,'Method-feeder','Kokkupressitud peibutussööt konksu ümber: kala võtab 25% kiiremini, rahulikke kalu 2× rohkem.',1500,10,0.25,2.0,5),
 ('hoidja1','hoidja',1,'Ridvahoidja','Teine õng on hoidjas vees: 7% juhtudest tuleb sinna samal ajal teine kala.',400,5,0.07,0,6),
 ('hoidja2','hoidja',2,'Kahe õnge alus','Kindel alus kelluke-signalisaatoriga: 13% juhtudest tuleb teise õnge otsa kala.',2500,14,0.13,0,7),
 ('sump1','sump',1,'Kalasump','Kala püsib vees elus ja värske: müües saad 5% parema hinna.',300,4,0.05,0,8),
 ('sump2','sump',2,'Suur võrksump','Pikk ja avar sump: kala püsib eriti värske, müües 10% parem hind.',2000,12,0.10,0,9),
 ('ammber1','ammber',1,'Söödaämber','Elussööt püsib ämbris elus: 25% viskest ei kulu sööt ära.',120,2,0.25,0,10),
 ('ammber2','ammber',2,'Õhupumbaga söödaämber','Pump hoiab vee hapnikurikka: 45% viskest ei kulu sööt ära.',1200,9,0.45,0,11),
 ('vork1','vork',1,'Nakkevõrk 30 m','Pane järve või merre. 2 tunni pärast on võrgus kuni 5 kala. Vajab kalastuskaarti.',800,6,2,5,12),
 ('vork2','vork',2,'Nakkevõrk 60 m','Kaks korda pikem võrk: 1,5 tunniga kuni 8 kala. Vajab kalastuskaarti.',3000,15,1.5,8,13),
 ('mord1','mord',1,'Mõrd','Rõngastel võrkpüünis haugile, latikale, linaskile ja angerjale. 4 tunniga kuni 4 kala.',1200,8,4,4,14),
 ('mord2','mord',2,'Suur kalamõrd','Pikkade tiibadega mõrd: 3 tunniga kuni 6 kala, ka suuremaid.',4000,18,3,6,15),
 ('katiska1','katiska',1,'Katiska','Soome traatmõrd väikestele kaladele: ahven, särg, kiisk. 3 tunniga kuni 6 kala.',350,3,3,6,16),
 ('katiska2','katiska',2,'Kahekordne katiska','Kaks katiskat korraga: 2 tunniga kuni 9 kala.',1600,11,2,9,17),
 ('loks1','loks',1,'Vähimõrd','Püüab jõevähke. Pane järve või jõkke, 3 tunniga kuni 6 vähki.',500,4,3,6,18),
 ('loks2','loks',2,'Vähimõrrad (3 tk)','Kolm mõrda korraga: 2 tunniga kuni 10 vähki.',2200,13,2,10,19)
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
  bonus := coalesce((public.fx_gear(u, p_spot) ->> 'catch')::numeric, coalesce(r.catch_bonus,0)) + coalesce(b.rarity_bonus,0) + coalesce(sp.bonus,0)
           + public.fx_weather_bonus(public.fx_weather()) + case when night then 0.05 else 0 end + 0.03 * coalesce(f.luck,0)
           + case when public.fx_myth(u, 'kuuong') then 0.03 else 0 end + public.fx_lab_aura(u, 'onn') * 0.2;
  for i in 1..6 loop
    avail[i] := exists (select 1 from public.fish_species s where s.rarity = i and p_spot = any(s.spots)
                 and s.min_level <= coalesce(f.level,1) and (not s.night_only or night)
                 and (not s.winter_only or winter or p_spot = 'jaa') and (s.weather is null or wthr = any(s.weather)));
    w[i] := base[i] * power(1 + bonus, i - 1);
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
      when 'varustus' then (select count(distinct g.kind) from public.fisher_gear fg join public.fish_gear g on g.id = fg.gear where fg.user_id = u and g.kind in ('kahv','korv','hoidja','sump','ammber')) >= 5
      when 'vana1' then (select count(*) from public.fish_catches c join public.fish_species fs on fs.id = c.species where c.user_id = u and not c.bought and c.weight >= fs.min_w + .75 * (fs.max_w - fs.min_w)) >= 1
      when 'vana25' then (select count(*) from public.fish_catches c join public.fish_species fs on fs.id = c.species where c.user_id = u and not c.bought and c.weight >= fs.min_w + .75 * (fs.max_w - fs.min_w)) >= 25
      when 'legvana5' then (select count(*) from public.fish_catches c join public.fish_species fs on fs.id = c.species where c.user_id = u and not c.bought and (c.giant or c.weight > fs.max_w)) >= 5
      when 'parija' then exists (select 1 from public.fisher_myth where user_id = u and myth = 'parijasormus')
      when 'taht1' then f.prestige >= 1 when 'taht5' then f.prestige >= 5 when 'taht10' then f.prestige >= 10 when 'taht25' then f.prestige >= 25
      when 'oo' then f.night >= 50 when 'prugi' then f.junk >= 10 when 'kirst' then f.chests >= 5
      when 'kuldkala' then coalesce(hasgold,false) when 'tellimused' then f.orders_done >= 20
      when 'voitja' then f.comp_wins >= 1 when 'murdja' then f.broken >= 5
      when 'ilmakalur' then nweather_all > 0 and nweather >= nweather_all when 'kuldkirst' then goldchest
      when 'usin' then f.quests_done >= 25 when 'kott' then nitems >= 30
      when 'maja1' then f.house_level >= 1 when 'maja5' then f.house_level >= 5 when 'maja10' then f.house_level >= 10
      when 'akvaarium' then (select count(*) from public.fish_catches where user_id = u and status = 'aquarium') >= 5
      when 'paadimees' then cardinality(f.boats) >= 1 when 'kapten' then cardinality(f.boats) >= 3
      when 'taiustaja' then exists (select 1 from public.fisher_rods where user_id = u and upg >= 5)
      when 'volur' then exists (select 1 from public.fisher_rods where user_id = u and ench_lvl >= 3)
      when 'suvamees' then not exists (select 1 from public.fish_species s where 'sugavik' = any(s.spots) and s.rarity >= 3 and not exists (select 1 from public.fish_catches c where c.user_id = u and not c.bought and c.species = s.id))
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
declare u uuid := fx_uid(); f fishers; book jsonb; v_ach jsonb; byr jsonb; inv jsonb; inbox int; act jsonb; w text := fx_weather(); v_items jsonb;
begin
  f := fx_fisher(u);
  -- vanad pooleli jäänud viskamised loetakse kaotatuks
  update fish_casts set state = 'lost' where user_id = u and state in ('waiting','hooked') and created_at < now() - interval '3 minutes';
  select coalesce(jsonb_object_agg(species, jsonb_build_object('n', n, 'max', mx, 'fa', fa, 'fs', fsp, 'ra', ra, 'rs', rsp)), '{}') into book
    from (select species, count(*) n, max(weight) mx, min(caught_at) fa, (array_agg(spot order by caught_at))[1] fsp,
            (array_agg(caught_at order by weight desc, caught_at))[1] ra, (array_agg(spot order by weight desc, caught_at))[1] rsp
          from fish_catches where user_id = u and not bought group by species) x;
  select coalesce(jsonb_object_agg(ach, at), '{}') into v_ach from fish_unlocked where user_id = u;
  select coalesce(jsonb_object_agg(rarity, n), '{}') into byr from (select rarity, count(*) n from fish_catches where user_id = u and not bought group by rarity) x;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'species', species, 'rarity', rarity, 'weight', weight, 'spot', spot,
           'giant', giant, 'trophy', status = 'trophy', 'bought', bought, 'at', caught_at) order by status = 'trophy' desc, rarity desc, weight desc), '[]')
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
    'inbox', inbox, 'active', act, 'weather', w, 'is_night', fx_is_night(), 'is_winter', fx_is_winter(), 'today', fx_today(),
    'items', v_items, 'quests_done', f.quests_done, 'badges', fx_badges(u),
    'gear', fx_gear(u), 'boats', to_jsonb(f.boats),
    'rod_mods', (select coalesce(jsonb_object_agg(rod, jsonb_build_object('upg', upg, 'ench', ench, 'ench_lvl', ench_lvl)), '{}') from fisher_rods where user_id = u),
    'market_open', (select count(*) from fish_market where seller = u and status = 'open'),
    'house', f.house_level, 'aquarium', fx_aq_fish(u), 'aq_score', fx_aq_score(u), 'aq_pending', fx_aq_pending(u), 'aq_likes', f.aq_likes)
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
  bsaved boolean := false; korv numeric; korv2 numeric; fit jsonb; wade boolean; peek numeric;
begin
  f := fx_fisher(u);
  korv := fx_kit_v(u, 'korv'); korv2 := greatest(1, fx_kit_v(u, 'korv', true));
  if f.auto_dress then perform fx_dress_auto(u, p_spot); end if;
  fit := fx_fit(u, p_spot); wade := p_spot = 'jogi' and (fit -> 'worn') ? 'wade';
  select * into sp from fish_spots where id = p_spot;
  if sp.id is null then raise exception 'Tundmatu püügikoht'; end if;
  if f.level < sp.min_level then raise exception 'See püügikoht avaneb kalapüügi % tasemel', sp.min_level; end if;
  if sp.boat is not null and not (sp.boat = any(f.boats)) then raise exception 'Siia pääsemiseks on vaja paati: %', (select name from fish_boats where id = sp.boat); end if;
  g := fx_gear(u, p_spot); chm := (g ->> 'chest')::numeric;
  if f.rod_broken then raise exception 'Õng on katki. Paranda see enne püüki.'; end if;
  select * into b from fish_baits where id = p_bait;
  if b.id is null then raise exception 'Tundmatu sööt'; end if;
  if b.consumable then
    cnt := coalesce((f.baits ->> b.id)::int, 0);
    if cnt < 1 then raise exception 'Sul pole seda sööta. Osta seda poest.'; end if;
    if random() >= coalesce((fx_house(u)).bait_save, 0) then
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
    w := fx_rarity_weights(u, p_spot, p_bait);
    roll := random() * 100;
    for i in 1..6 loop acc := acc + w[i]; if roll <= acc then rar := i; exit; end if; rar := i; end loop;
    -- Lant (peibutis, mis ei kulu ja on ostetud) meelitab peamiselt röövkalu: 85% juhtudest otsitakse
    -- valitud või madalamast klassist kala, kelle lemmik on lant; muidu tavaline valik (rahulik kala harva).
    lure := not b.consumable and b.price > 0;
    if lure and random() < 0.85 then
      rr := rar;
      while rr >= 1 loop
        select * into s from fish_species fs where fs.rarity = rr and p_spot = any(fs.spots) and fs.min_level <= f.level
          and (not fs.night_only or night) and (not fs.winter_only or winter or p_spot = 'jaa')
          and (fs.weather is null or wthr = any(fs.weather)) and fs.baits && array['hobelant','kuldvobler','draakonilant']
          order by -ln(greatest(random(), 1e-9)) / ((case when p_bait = any(fs.baits) then 4 else 1 end) * (case when dp = any(fs.times) then 2.5 else 1 end)) limit 1;
        exit when s.id is not null;
        rr := rr - 1;
      end loop;
    end if;
    while s.id is null and rar >= 1 loop
      select * into s from fish_species fs where fs.rarity = rar and p_spot = any(fs.spots) and fs.min_level <= f.level
        and (not fs.night_only or night) and (not fs.winter_only or winter or p_spot = 'jaa')
        and (fs.weather is null or wthr = any(fs.weather))
        order by case when fs.weather is not null and random() < (g ->> 'wpref')::numeric then 0 else 1 end,
          -ln(greatest(random(), 1e-9)) / ((case when p_bait = any(fs.baits) then 4 else 1 end) * (case when dp = any(fs.times) then 2.5 else 1 end)
            * (case when fs.baits && array['mais','leib'] then korv2 else 1 end)
            * (case when wade and fs.id = any(array['harjus','joeforell','vikerforell','lohe','toogjas','teib','sainas','turb','vimb','koha']) then 1.6 else 1 end)) limit 1;
      exit when s.id is not null;
      rar := rar - 1;
    end loop;
    if s.id is null then raise exception 'Siin pole praegu kalu'; end if;
    wt := s.min_w + (s.max_w - s.min_w) * power(random(), 2.2);
    if random() < 0.03 * (g ->> 'giant')::numeric then giant := true; wt := s.max_w * (1.25 + random() * 0.35); end if;
    wt := round(wt, case when wt < 1 then 3 else 2 end);
  end if;
  wait_ms := round((1800 + random() * 5200) * b.wait_mult * fx_weather_wait(wthr) * (g ->> 'wait')::numeric * (1 - korv) * (case when fit ->> 'tier' = 'hea' and (fit ->> 'need')::int > 0 then 0.9 else 1 end));
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
  if now() > c.bite_at + interval '3 seconds' then
    update fish_casts set state = 'lost' where id = c.id; update fishers set lost = lost + 1 where user_id = u;
    return jsonb_build_object('ok', false, 'reason', 'late');
  end if;
  select * into f from fishers where user_id = u;
  select * into r from fish_rods where id = f.rod;
  select * into sp from fish_spots where id = c.spot;
  r.reel_bonus := (fx_gear(u) ->> 'reel')::numeric + case when (fx_fit(u, c.spot) -> 'worn') ? 'pockets' then 0.03 else 0 end; r.strength := (fx_gear(u) ->> 'strength')::numeric;
  if c.kind = 'fish' then
    select * into s from fish_species where id = c.species;
    diff := s.difficulty;
    need := 2 + (s.rarity >= 3)::int + (s.rarity >= 5)::int + (s.difficulty >= 9)::int;
    zone := greatest(0.08, 0.27 - s.rarity * 0.025 - sp.difficulty * 0.01 + r.reel_bonus);
    speed := 1.0 + s.difficulty * 0.12 + least(0.5, c.weight / 60);
    est := round(c.weight * (0.85 + random()::numeric * 0.3), 1);
  else
    diff := 2; need := 2; zone := 0.26 + r.reel_bonus; speed := 1.0; est := case when c.kind = 'chest' then round((6 + random() * 6)::numeric, 1) else round((0.3 + random())::numeric, 1) end;
  end if;
  update fish_casts set state = 'hooked', hooked_at = now(), need_hits = need where id = c.id;
  return jsonb_build_object('ok', true, 'need', need, 'zone', round(zone, 3), 'speed', round(speed, 2), 'est', est,
    'strength', r.strength, 'difficulty', diff);
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
    roll := random();
    if roll < chance and roll >= chance * (1 - fx_kit_v(u, 'kahv', true)) then netsave := true; end if;
    if roll < chance * (1 - fx_kit_v(u, 'kahv', true)) then
      update fish_casts set state = 'broken' where id = c.id;
      update fishers set rod_broken = true, broken = broken + 1, rods_broken = case when f.rod = any(rods_broken) then rods_broken else rods_broken || f.rod end where user_id = u;
      ach := fx_check_ach(u);
      return jsonb_build_object('ok', false, 'reason', 'broken', 'weight', c.weight, 'strength', r.strength, 'name', s.name, 'ach', ach);
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
  end if;
  -- harva leiab kala kõhust midagi
  if random() < 0.04 then items := fx_give_random(u, least(5, s.rarity + 1), 1); end if;
  -- ridvahoidja: teise õnge otsa tuli samal ajal kala
  if random() < fx_kit_v(u, 'hoidja') then
    select fs.* into s2 from fish_species fs where fs.rarity <= 2 and c.spot = any(fs.spots) and fs.min_level <= f.level and fs.weather is null
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
  xp := round(xp * (1 + coalesce((fx_house(u)).xp_bonus, 0) + case when fx_myth(u, 'hobesarv') then 0.10 else 0 end + fx_lab_aura(u, 'tarkus') + case when dressed then 0.10 else 0 end)) * fx_xp_mult();
  levels := fx_add_xp(u, xp);
  if 50 = any(levels) or 25 = any(levels) then perform fx_news(u, 'level', jsonb_build_object('level', (select max(x) from unnest(levels) x))); end if;
  ach := fx_check_ach(u);
  kt := fx_kt_add(u, s.id, s.rarity, c.weight, c.giant);
  return jsonb_build_object('ok', true, 'kind', 'fish', 'kt', kt, 'catch_id', cid, 'items', items, 'species', s.id, 'name', s.name, 'rarity', s.rarity,
    'weight', c.weight, 'giant', c.giant, 'new_species', newsp, 'record', prevmax is not null and c.weight > prevmax,
    'xp', xp, 'x2', fx_kuma(), 'fav', c.bait = any(s.baits), 'best', fx_daypart() = any(s.times), 'levels', to_jsonb(levels), 'ach', ach)
    || jsonb_build_object('net', netsave, 'second', second, 'dressed', dressed)
    || jsonb_build_object('sec', fx_secret_ev(u, 'catch', jsonb_build_object('species', s.id, 'weather', wthr,
         'killed', coalesce((kt ->> 'killed')::boolean, false), 'boat', sp.boat is not null, 'kt', kt is not null,
         'spot', c.spot, 'night', v_night, 'weight', c.weight)));
end $$;

-- Turuhinnad (muutuvad iga päev, müües sama kala ühel päeval palju langeb hind)
create or replace function public.fx_market_mult(p_species text, d date) returns numeric language sql immutable as
$$ select round((0.7 + (abs(hashtext('turg' || p_species || d::text)) % 600) / 1000.0)::numeric, 2) $$;

create or replace function public.fish_market() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today();
begin
  return (select coalesce(jsonb_object_agg(s.id, jsonb_build_object('mult', fx_market_mult(s.id, d), 'sold', coalesce(x.qty, 0))), '{}')
    from fish_species s left join fish_sales x on x.user_id = u and x.day = d and x.species = s.id);
end $$;

create or replace function public.fx_sell_value(u uuid, c fish_catches) returns int language plpgsql as $$
declare s fish_species; d date := fx_today(); sold int; avgw numeric; v numeric;
begin
  select * into s from fish_species where id = c.species;
  select coalesce(qty, 0) into sold from fish_sales where user_id = u and day = d and species = c.species;
  sold := coalesce(sold, 0);
  avgw := (s.min_w + s.max_w) / 2;
  v := s.price * fx_market_mult(s.id, d) * least(2, 0.6 + 0.4 * c.weight / avgw) / (1 + sold / 15.0)
       * (1 + coalesce((fx_house(u)).sell_bonus, 0) + fx_star_bonus((select prestige from fishers where user_id = u))
            + case when fx_myth(u, 'udukroon') then 0.10 else 0 end + fx_lab_aura(u, 'kuld') + case when c.bought then 0 else fx_kit_v(u, 'sump') end)
       * (case when c.bought then 0.6 else 1 end);
  insert into fish_sales(user_id, day, species, qty) values (u, d, c.species, 1)
    on conflict (user_id, day, species) do update set qty = fish_sales.qty + 1;
  return greatest(1, round(v));
end $$;

-- Kalade kasutamine: müü / toiduks / vabaks / trofeeks / vaheta
create or replace function public.fish_use(p_ids bigint[], p_action text, p_choice text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); c fish_catches; s fish_species; v_gold int := 0; v_food int := 0; v_fame int := 0; v_xp int := 0; v_maps int := 0;
  n int := 0; levels int[] := '{}'; ntro int; f fishers; extra jsonb := '{}'; bb text; rel text[] := '{}';
begin
  if p_action not in ('sell','cook','release','trophy','untrophy','exchange') then raise exception 'Tundmatu tegevus'; end if;
  f := fx_fisher(u);
  if p_action = 'exchange' and coalesce(array_length(p_ids, 1), 0) <> 1 then raise exception 'Vaheta korraga üks kala'; end if;
  for c in select * from fish_catches where id = any(p_ids) and user_id = u
             and status = case when p_action = 'untrophy' then 'trophy' else 'kept' end for update loop
    select * into s from fish_species where id = c.species;
    if p_action = 'sell' then v_gold := v_gold + fx_sell_value(u, c); update fish_catches set status = 'sold' where id = c.id;
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
        where fs.rarity <= maxr and fs.min_level <= f.level and not fs.night_only and not fs.winter_only
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
    from public.fish_catches c where c.caught_at >= p_from and c.caught_at < p_to and not c.bought
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
  foreach cmp in array array['big','rare','most'] loop
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
    res := res || jsonb_build_object(cmp, jsonb_build_object('top', top, 'mine', mine, 'last', last,
             'ends', per.p_to, 'claimed', exists (select 1 from fish_prizes where user_id = u and fish_prizes.comp = cmp and period = prev.p_start)));
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('name', p.name, 'title', f.title, 'level', f.level, 'stars', f.prestige, 'total', f.total,
           'biggest', f.biggest, 'rare', f.rare, 'me', f.user_id = u) order by f.level desc, f.prestige desc, f.pxp desc, f.xp desc, f.total desc), '[]')
    into lb from (select * from fishers order by level desc, prestige desc, pxp desc, xp desc, total desc limit 30) f
    join profiles p on p.id = f.user_id where not p.hidden or f.user_id = u;
  return res || jsonb_build_object('leaderboard', lb);
end $$;

-- Võidupreemiad (viimase 7 päeva ja 2 nädala lõppenud võistlused); iga preemiat saab võtta ühe korra
create or replace function public.fish_claim_prizes() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today(); cmp text; k int; per record; pl int; got jsonb := '[]';
  v_gold int; v_xp int; ttl text; levels int[] := '{}';
begin
  perform fx_fisher(u);
  foreach cmp in array array['big','rare','most'] loop
    for k in 1..(case when cmp = 'big' then 7 else 2 end) loop
      select * into per from fx_period(cmp, case when cmp = 'big' then d - k else d - 7 * k end);
      if exists (select 1 from fish_prizes where user_id = u and fish_prizes.comp = cmp and period = per.p_start) then continue; end if;
      select place into pl from fx_comp_rank(cmp, per.p_from, per.p_to) where user_id = u;
      if pl is null or pl > 3 then continue; end if;
      if cmp = 'big' then v_gold := (array[300,150,80])[pl]; v_xp := (array[150,80,40])[pl]; ttl := 'Päeva hiidkala püüdja';
      elsif cmp = 'rare' then v_gold := (array[1500,800,400])[pl]; v_xp := (array[600,300,150])[pl]; ttl := 'Haruldaste jahtija';
      else v_gold := (array[1500,800,400])[pl]; v_xp := (array[600,300,150])[pl]; ttl := 'Nädala kalur'; end if;
      insert into fish_prizes(user_id, comp, period, place) values (u, cmp, per.p_start, pl);
      if pl = 1 then perform fx_news(u, 'comp', jsonb_build_object('comp', cmp, 'period', per.p_start)); end if;
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
          select fs.id into spc from public.fish_species fs where fs.rarity <= 2 and fs.min_level <= lvl and not fs.night_only and not fs.winter_only and fs.weather is null
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
    select n.id, n.at, n.kind, n.data, n.user_id = auth.uid() as me,
      case when p.hidden and n.user_id <> auth.uid() then 'Salapärane kalur' else coalesce(p.name, 'Kalur') end as name,
      case when p.hidden and n.user_id <> auth.uid() then null else f.title end as title
    from fish_news n left join profiles p on p.id = n.user_id left join fishers f on f.user_id = n.user_id
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
    'me', p_user = u, 'fish', fx_aq_fish(p_user));
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
  st := r.strength * (1 + 0.1 * up); cb := r.catch_bonus + 0.01 * up; rb := r.reel_bonus + 0.02 * up;
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
  select greatest(1, round(s.price * least(2, 0.6 + 0.4 * p_weight / ((s.min_w + s.max_w) / 2))))::int from public.fish_species s where s.id = p_species
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
    select m.id, m.species, m.rarity, m.weight, m.giant, m.price, m.base, m.created_at as at, m.seller = u as mine,
      case when p.hidden and m.seller <> u then 'Salapärane kalur' else coalesce(p.name, 'Kalur') end as seller
    from fish_market m left join profiles p on p.id = m.seller
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
       select m.id, m.species, m.rarity, m.weight, m.price, m.fee, m.status, m.closed_at as at, case when m.seller = u then 'sold' else 'bought' end as side
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
    'top', coalesce((select jsonb_agg(x) from (select case when p.hidden and c.user_id <> u then 'Salapärane valitseja' else p.kingdom end as kingdom, c.total, c.user_id = u as me
        from kingdom_monument_contrib c join profiles p on p.id = c.user_id where c.stage = m.stage order by c.total desc limit 10) x), '[]'),
    'mine', coalesce((select total from kingdom_monument_contrib where stage = m.stage and user_id = u), 0),
    'today', coalesce((select jsonb_object_agg(res, amount) from kingdom_contrib_resday where user_id = u and day = fx_today()), '{}'), 'cap', 2000,
    'contributors', (select count(*) from kingdom_monument_contrib where stage = m.stage));
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
create or replace function public.fx_kt_win(d date) returns table(p_from timestamptz, p_to timestamptz) language sql stable as
$$ select (d::timestamp + make_interval(hours => fx_kt_hour())) at time zone 'Europe/Tallinn',
          (d::timestamp + make_interval(hours => fx_kt_hour() + 1)) at time zone 'Europe/Tallinn' $$;
create or replace function public.fx_kt_boss(d date) returns kalatund_boss language plpgsql as $$
declare b kalatund_boss; n int;
begin
  select * into b from kalatund_boss where day = d;
  if b.day is null then
    select count(distinct user_id) into n from fish_catches where caught_at > now() - interval '7 days' and not bought;
    insert into kalatund_boss(day, hp, max_hp) values (d, 1000 + 600 * greatest(1, n), 1000 + 600 * greatest(1, n)) on conflict (day) do nothing;
    select * into b from kalatund_boss where day = d;
  end if;
  return b;
end $$;
-- kutsutakse fish_land seest: lisab punktid ja teeb bossile kahju
create or replace function public.fx_kt_add(u uuid, p_species text, p_rarity int, p_w numeric, p_giant boolean) returns jsonb language plpgsql as $$
declare d date := fx_today(); w record; avgw numeric; v_pts int; b kalatund_boss; v_dmg int; killed boolean := false;
begin
  select * into w from fx_kt_win(d);
  if now() < w.p_from or now() >= w.p_to then return null; end if;
  select (min_w + max_w) / 2 into avgw from fish_species where id = p_species;
  v_pts := greatest(1, round((array[5,10,25,60,150,400])[least(6, greatest(1, p_rarity))] * (0.6 + 0.4 * least(3, p_w / greatest(avgw, 0.01))) * case when p_giant then 1.5 else 1 end));
  perform pg_advisory_xact_lock(hashtext('kalatund' || d::text));
  b := fx_kt_boss(d);
  v_dmg := case when b.killed_at is null then least(b.hp, v_pts) else 0 end;
  if v_dmg > 0 then
    update kalatund_boss set hp = hp - v_dmg where day = d returning * into b;
    if b.hp <= 0 then
      update kalatund_boss set killed_at = now(), killer = u where day = d; killed := true;
      perform fx_news(u, 'boss', jsonb_build_object('day', d));
    end if;
  end if;
  insert into kalatund_score(day, user_id, pts, fish, dmg, best_rarity) values (d, u, v_pts, 1, v_dmg, p_rarity)
  on conflict (day, user_id) do update set pts = kalatund_score.pts + v_pts, fish = kalatund_score.fish + 1,
    dmg = kalatund_score.dmg + v_dmg, best_rarity = greatest(kalatund_score.best_rarity, p_rarity);
  return jsonb_build_object('pts', v_pts, 'dmg', v_dmg, 'hp', greatest(0, b.hp), 'max_hp', b.max_hp, 'killed', killed);
end $$;

create or replace function public.fx_kt_top(d date, u uuid, lim int) returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('place', x.place, 'name', x.name, 'title', x.title, 'pts', x.pts, 'fish', x.fish, 'dmg', x.dmg, 'me', x.user_id = u) order by x.place), '[]')
  from (select k.user_id, p.name, f.title, k.pts, k.fish, k.dmg, (row_number() over (order by k.pts desc, k.fish desc, k.user_id))::int as place
        from kalatund_score k join profiles p on p.id = k.user_id left join fishers f on f.user_id = k.user_id where k.day = d) x
  where x.place <= lim or x.user_id = u
$$;

create or replace function public.fish_kalatund() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today(); w record; b kalatund_boss; yb kalatund_boss; mine jsonb; unclaimed int; act boolean; nxt timestamptz; part int;
begin
  perform fx_fisher(u);
  select * into w from fx_kt_win(d);
  act := now() >= w.p_from and now() < w.p_to;
  nxt := case when now() < w.p_from then w.p_from else (select p_from from fx_kt_win(d + 1)) end;
  if act then b := fx_kt_boss(d); else select * into b from kalatund_boss where day = d; end if;
  select * into yb from kalatund_boss where day = d - 1;
  select to_jsonb(k) - 'user_id' - 'day' into mine from kalatund_score k where k.day = d and k.user_id = u;
  select count(*) into part from kalatund_score where day = d;
  select count(*) into unclaimed from kalatund_score k where k.user_id = u and k.day >= d - 7
    and (k.day < d or now() >= w.p_to) and not exists (select 1 from kalatund_prize z where z.user_id = u and z.day = k.day);
  return jsonb_build_object('now', now(), 'active', act, 'start', w.p_from, 'end', w.p_to, 'next', nxt, 'hour', fx_kt_hour(),
    'top', fx_kt_top(d, u, 10), 'mine', mine, 'players', part, 'unclaimed', unclaimed,
    'boss', case when b.day is null then null else jsonb_build_object('hp', b.hp, 'max_hp', b.max_hp, 'killed_at', b.killed_at,
       'killer', (select name from profiles where id = b.killer)) end,
    'yesterday', jsonb_build_object('top', (select coalesce(jsonb_agg(e) filter (where (e->>'place')::int <= 3), '[]') from jsonb_array_elements(fx_kt_top(d - 1, u, 3)) e),
       'boss', case when yb.day is null then null else jsonb_build_object('killed', yb.killed_at is not null, 'killer', (select name from profiles where id = yb.killer)) end));
end $$;

create or replace function public.fish_kt_claim() returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); d date := fx_today(); w record; k record; pl int; b kalatund_boss; v_gold int; v_xp int; got jsonb := '[]';
  levels int[] := '{}'; items jsonb; topdmg uuid; f fishers;
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
    items := '[]';
    select * into b from kalatund_boss where day = k.day;
    if b.killed_at is not null and k.dmg > 0 then
      v_gold := v_gold + 300 + f.level * 10; v_xp := v_xp + 200;
      items := fx_give_random(u, 4, 1);
      select user_id into topdmg from kalatund_score where day = k.day order by dmg desc, pts desc limit 1;
      if topdmg = u then update fishers set titles = case when not ('Bossikala alistaja' = any(titles)) then titles || 'Bossikala alistaja'::text else titles end where user_id = u; end if;
    end if;
    update fishers set gold = gold + v_gold,
      titles = case when pl = 1 and not ('Kalatunni kuningas' = any(titles)) then titles || 'Kalatunni kuningas'::text else titles end where user_id = u;
    if pl = 1 then perform fx_news(u, 'kalatund', jsonb_build_object('day', k.day, 'pts', k.pts)); end if;
    levels := levels || fx_add_xp(u, v_xp);
    got := got || jsonb_build_object('day', k.day, 'place', pl, 'pts', k.pts, 'gold', v_gold, 'xp', v_xp, 'boss', b.killed_at is not null and k.dmg > 0, 'items', items);
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
    where s.rarity in (3, 4) and not s.night_only and not s.winter_only and s.weather is null and s.min_level <= 30
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
    'value', round(s.price * least(2, 0.6 + 0.4 * c.weight / ((s.min_w + s.max_w) / 2))));
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
  return jsonb_build_object('gold', f.gold, 'level', f.level, 'now', now(), 'license_until', f.license_until, 'license_price', 400,
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
  if f.license_until is not null and f.license_until > now() + interval '7 days' then raise exception 'Kalastuskaart kehtib veel üle 7 päeva'; end if;
  if f.gold < 400 then raise exception 'Kalastuskaart maksab 400 kulda'; end if;
  update fishers set gold = gold - 400, license_until = greatest(coalesce(license_until, now()), now()) + interval '7 days' where user_id = u;
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
  if p_kind = 'vork' and (f.license_until is null or f.license_until < now()) then raise exception 'Võrguga püüdmiseks on vaja kehtivat kalastuskaarti'; end if;
  perform pg_advisory_xact_lock(hashtext('trap:' || u::text));
  if exists (select 1 from fish_traps where user_id = u and kind = p_kind and status = 'set') then raise exception 'See püünis on juba vees'; end if;
  insert into fish_traps(user_id, kind, gear, spot, ready_at) values (u, p_kind, g.id, p_spot, now() + make_interval(mins => round(g.val * 60)::int));
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
  lst text[]; wthr text := fx_weather(); winter boolean := fx_is_winter(); cid bigint;
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
    if t.kind = 'loks' and random() < 0.85 then
      select * into s from fish_species where id = 'vahk';
    else
      select fs.* into s from fish_species fs where t.spot = any(fs.spots) and fs.min_level <= f.level and fs.weather is null
        and (not fs.winter_only or winter or t.spot = 'jaa') and fs.real
        and case when t.kind = 'vork' then fs.rarity <= 3 and fs.max_w >= 0.2
                 when t.kind = 'loks' then fs.id = any(array['ahven','sarg','kiisk','roosarg','viidikas','nurg','ogalik','mudamaim','lepamaim','hink','trulling','voldas','teib','luukarits'])
                 else fs.id = any(lst) end
        order by -ln(greatest(random(), 1e-9)) * fs.rarity limit 1;
    end if;
    continue when s.id is null;
    wt := s.min_w + (case when t.kind in ('katiska','loks') and s.id <> 'vahk' then least(s.max_w, 0.4) else s.max_w end - s.min_w) * power(random(), pw);
    wt := round(greatest(wt, s.min_w), case when wt < 1 then 3 else 2 end);
    insert into fish_catches(user_id, species, rarity, weight, spot, night, weather, trap) values (u, s.id, s.rarity, wt, t.spot, false, wthr, t.kind) returning id into cid;
    got := got || jsonb_build_array(jsonb_build_object('id', cid, 'species', s.id, 'name', s.name, 'rarity', s.rarity, 'weight', wt));
  end loop;
  xp := (6 + 4 * jsonb_array_length(got)) * fx_xp_mult();
  levels := fx_add_xp(u, xp);
  update fish_traps set status = 'done', result = jsonb_build_object('fish', got, 'xp', xp) where id = t.id;
  return gear_state() || jsonb_build_object('collected', jsonb_build_object('kind', t.kind, 'gear', t.gear, 'spot', t.spot, 'fish', got, 'xp', xp),
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
              'wear_state','clothes_buy','clothes_wear','clothes_auto','clothes_autoset','clothes_color')) loop
    execute format('revoke all on function %s from public, anon', r.sig);
    if r.proname like 'fx\_%' then
      execute format('revoke all on function %s from authenticated', r.sig);
    else
      execute format('grant execute on function %s to authenticated', r.sig);
    end if;
  end loop;
end $$;
