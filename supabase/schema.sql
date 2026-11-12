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
 ('taht1','Esimene täht','Teeni pärast 50. taset esimene prestiižitäht','Tähekalur',3000,0,90),
 ('taht5','Viis tähte','Teeni 5 prestiižitähte','Kuldtähe kalur',8000,0,91),
 ('taht10','Tähistaevas','Teeni 10 prestiižitähte','Tähtede valitseja',15000,0,92),
 ('taht25','Järvede legend','Teeni 25 prestiižitähte','Järvede legend',40000,0,93)
on conflict (id) do update set name=excluded.name, descr=excluded.descr, title=excluded.title,
  reward_gold=excluded.reward_gold, reward_xp=excluded.reward_xp, sort=excluded.sort;

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
           + public.fx_weather_bonus(public.fx_weather()) + case when night then 0.05 else 0 end + 0.03 * coalesce(f.luck,0);
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
  select coalesce(jsonb_object_agg(species, jsonb_build_object('n', n, 'max', mx)), '{}') into book
    from (select species, count(*) n, max(weight) mx from fish_catches where user_id = u and not bought group by species) x;
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
    || jsonb_build_object('prestige', f.prestige, 'pxp', f.pxp, 'pxp_need', fx_star_need(f.prestige), 'star_bonus', fx_star_bonus(f.prestige), 'prestige_last', f.prestige_last);
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
  night boolean := fx_is_night(); winter boolean := fx_is_winter(); wthr text := fx_weather(); g jsonb; chm numeric;
begin
  f := fx_fisher(u);
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
      update fishers set baits = jsonb_set(baits, array[b.id], to_jsonb(cnt - 1)) where user_id = u;
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
    while rar >= 1 loop
      select * into s from fish_species fs where fs.rarity = rar and p_spot = any(fs.spots) and fs.min_level <= f.level
        and (not fs.night_only or night) and (not fs.winter_only or winter or p_spot = 'jaa')
        and (fs.weather is null or wthr = any(fs.weather))
        order by case when fs.weather is not null and random() < (g ->> 'wpref')::numeric then 0 else 1 end, random() limit 1;
      exit when s.id is not null;
      rar := rar - 1;
    end loop;
    if s.id is null then raise exception 'Siin pole praegu kalu'; end if;
    wt := s.min_w + (s.max_w - s.min_w) * power(random(), 1.7);
    if random() < 0.03 * (g ->> 'giant')::numeric then giant := true; wt := s.max_w * (1.25 + random() * 0.35); end if;
    wt := round(wt, 2);
  end if;
  wait_ms := round((1800 + random() * 5200) * b.wait_mult * fx_weather_wait(wthr) * (g ->> 'wait')::numeric);
  insert into fish_casts(user_id, spot, bait, kind, species, junk, weight, giant, bite_at)
  values (u, p_spot, b.id, kind, s.id, junk, wt, giant, now() + make_interval(secs => wait_ms / 1000.0))
  returning id into cid;
  return jsonb_build_object('cast_id', cid, 'wait_ms', wait_ms, 'weather', wthr, 'night', night);
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
  r.reel_bonus := (fx_gear(u) ->> 'reel')::numeric; r.strength := (fx_gear(u) ->> 'strength')::numeric;
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
    levels := fx_add_xp(u, 8);
    ach := fx_check_ach(u);
    return jsonb_build_object('ok', true, 'kind', 'junk', 'junk', c.junk, 'xp', 8, 'levels', to_jsonb(levels), 'ach', ach,
      'gold', case when c.junk = 'purk' then 3 else 0 end, 'map', c.junk = 'pudel', 'items', items);
  elsif c.kind = 'chest' then
    tier := coalesce(nullif(c.junk, ''), 'puu');
    g := case tier when 'kuld' then 400 + f.level * 60 when 'hobe' then 150 + f.level * 30 else 60 + f.level * 15 end + floor(random() * 60)::int;
    update fish_casts set state = 'landed' where id = c.id;
    update fishers set chests = chests + 1, gold = gold + g where user_id = u;
    items := fx_give_random(u, case tier when 'kuld' then 5 when 'hobe' then 3 else 2 end, case tier when 'kuld' then 3 when 'hobe' then 2 else 1 end);
    if random() < (case tier when 'kuld' then 1 when 'hobe' then 0.4 else 0.15 end) then perform fx_inbox(u, '{"map":1}', 'Veealune aardekirst'); res := '{"map":true}'; else res := '{"map":false}'; end if;
    if tier = 'kuld' then perform fx_news(u, 'chest', jsonb_build_object('gold', g)); end if;
    levels := fx_add_xp(u, (case tier when 'kuld' then 150 when 'hobe' then 60 else 30 end) + f.level * 2);
    ach := fx_check_ach(u);
    return jsonb_build_object('ok', true, 'kind', 'chest', 'tier', tier, 'gold', g, 'xp', (case tier when 'kuld' then 150 when 'hobe' then 60 else 30 end) + f.level * 2,
      'levels', to_jsonb(levels), 'ach', ach, 'items', items) || res;
  end if;

  select * into s from fish_species where id = c.species;
  -- varustuse tugevus
  if c.weight > r.strength then
    chance := least(1, (c.weight / r.strength - 1) * 1.3) + case when wthr = 'torm' then 0.1 else 0 end;
    if random() < chance then
      update fish_casts set state = 'broken' where id = c.id;
      update fishers set rod_broken = true, broken = broken + 1, rods_broken = case when f.rod = any(rods_broken) then rods_broken else rods_broken || f.rod end where user_id = u;
      ach := fx_check_ach(u);
      return jsonb_build_object('ok', false, 'reason', 'broken', 'weight', c.weight, 'strength', r.strength, 'name', s.name, 'ach', ach);
    end if;
  end if;
  if random() < (case when wthr = 'torm' then 0.06 else 0.03 end) then
    update fish_casts set state = 'lost' where id = c.id; update fishers set lost = lost + 1 where user_id = u;
    return jsonb_build_object('ok', false, 'reason', 'escaped', 'name', s.name, 'rarity', s.rarity);
  end if;

  select max(weight) into prevmax from fish_catches where user_id = u and species = s.id and not bought;
  newsp := prevmax is null;
  update fish_casts set state = 'landed' where id = c.id;
  insert into fish_catches(user_id, species, rarity, weight, spot, giant, night, weather)
  values (u, s.id, s.rarity, c.weight, c.spot, c.giant, v_night, wthr) returning id into cid;
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
  update fishers set total = total + 1, rare = rare + (s.rarity >= 3)::int, night = fishers.night + v_night::int,
    biggest = greatest(biggest, c.weight),
    biggest_species = case when c.weight > biggest then s.id else biggest_species end
    where user_id = u;
  xp := round(s.xp * (1 + sp.difficulty * 0.1) * case when c.giant then 1.5 else 1 end * case when newsp then 2 else 1 end);
  xp := round(xp * (1 + coalesce((fx_house(u)).xp_bonus, 0)));
  levels := fx_add_xp(u, xp);
  if 50 = any(levels) or 25 = any(levels) then perform fx_news(u, 'level', jsonb_build_object('level', (select max(x) from unnest(levels) x))); end if;
  ach := fx_check_ach(u);
  kt := fx_kt_add(u, s.id, s.rarity, c.weight, c.giant);
  return jsonb_build_object('ok', true, 'kind', 'fish', 'kt', kt, 'catch_id', cid, 'items', items, 'species', s.id, 'name', s.name, 'rarity', s.rarity,
    'weight', c.weight, 'giant', c.giant, 'new_species', newsp, 'record', prevmax is not null and c.weight > prevmax,
    'xp', xp, 'levels', to_jsonb(levels), 'ach', ach);
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
       * (1 + coalesce((fx_house(u)).sell_bonus, 0) + fx_star_bonus((select prestige from fishers where user_id = u)))
       * (case when c.bought then 0.6 else 1 end);
  insert into fish_sales(user_id, day, species, qty) values (u, d, c.species, 1)
    on conflict (user_id, day, species) do update set qty = fish_sales.qty + 1;
  return greatest(1, round(v));
end $$;

-- Kalade kasutamine: müü / toiduks / vabaks / trofeeks / vaheta
create or replace function public.fish_use(p_ids bigint[], p_action text, p_choice text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := fx_uid(); c fish_catches; s fish_species; v_gold int := 0; v_food int := 0; v_fame int := 0; v_xp int := 0; v_maps int := 0;
  n int := 0; levels int[] := '{}'; ntro int; f fishers; extra jsonb := '{}'; bb text;
begin
  if p_action not in ('sell','cook','release','trophy','untrophy','exchange') then raise exception 'Tundmatu tegevus'; end if;
  f := fx_fisher(u);
  if p_action = 'exchange' and coalesce(array_length(p_ids, 1), 0) <> 1 then raise exception 'Vaheta korraga üks kala'; end if;
  for c in select * from fish_catches where id = any(p_ids) and user_id = u
             and status = case when p_action = 'untrophy' then 'trophy' else 'kept' end for update loop
    select * into s from fish_species where id = c.species;
    if p_action = 'sell' then v_gold := v_gold + fx_sell_value(u, c); update fish_catches set status = 'sold' where id = c.id;
    elsif p_action = 'cook' then v_food := v_food + greatest(2, round(c.weight * 4 + s.rarity * 3)); update fish_catches set status = 'cooked' where id = c.id;
    elsif p_action = 'release' then v_fame := v_fame + s.rarity * 2; v_xp := v_xp + ceil(s.xp * 0.3); update fish_catches set status = 'released' where id = c.id;
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
    'ach', fx_check_ach(u)) || extra;
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
    select id into it from public.fish_items where rarity <= maxr order by -ln(greatest(random(), 1e-9)) * power(2, rarity) limit 1;
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
    when 'count' then (select count(*) from public.fish_catches where user_id = u and not bought and caught_at >= since)
    when 'rarity' then (select count(*) from public.fish_catches where user_id = u and not bought and caught_at >= since and rarity >= prm::int)
    when 'spot' then (select count(*) from public.fish_catches where user_id = u and not bought and caught_at >= since and spot = prm)
    when 'species' then (select count(*) from public.fish_catches where user_id = u and not bought and caught_at >= since and species = prm)
    when 'weight' then (select coalesce(sum(weight), 0) from public.fish_catches where user_id = u and not bought and caught_at >= since)
    when 'night' then (select count(*) from public.fish_catches where user_id = u and not bought and caught_at >= since and night)
    when 'weather' then (select count(*) from public.fish_catches c join public.fish_species s on s.id = c.species where c.user_id = u and not c.bought and c.caught_at >= since and s.weather is not null)
    when 'chest' then (select count(*) from public.fish_casts where user_id = u and created_at >= since and kind = 'chest' and state = 'landed')
    else 0 end)::numeric
$$;

create or replace function public.fx_gen_quests(u uuid, per text, ps date) returns void language plpgsql as $$
declare f public.fishers; lvl int; i int; k text; prm text; tgt numeric; pick int; sp text; spc text; ri text;
begin
  select * into f from public.fishers where user_id = u; lvl := coalesce(f.level, 1);
  for i in 1..3 loop
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
      else
        if lvl >= 8 then k := 'rarity'; prm := '3'; tgt := 1 + lvl / 20; else k := 'rarity'; prm := '2'; tgt := 3; end if;
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
  if not exists (select 1 from fish_quests q where q.user_id = u and q.period = 'd' and q.pstart = d) then perform fx_gen_quests(u, 'd', d); end if;
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
  return jsonb_build_object('gold', q.reward_gold, 'xp', q.reward_xp, 'items', v_items, 'levels', to_jsonb(levels), 'ach', fx_check_ach(u));
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
  return jsonb_build_object('ok', true);
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
              'kingdom_visit','kingdom_gift_send','monument_state','monument_contribute','fish_kalatund','fish_kt_claim')) loop
    execute format('revoke all on function %s from public, anon', r.sig);
    if r.proname like 'fx\_%' then
      execute format('revoke all on function %s from authenticated', r.sig);
    else
      execute format('grant execute on function %s to authenticated', r.sig);
    end if;
  end loop;
end $$;
