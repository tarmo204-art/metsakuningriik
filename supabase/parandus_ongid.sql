-- Õngede paranduse uuendus (käivita SQL Editoris)
alter table public.fishers add column if not exists rods_broken text[] not null default '{}';
alter table public.fishers add column if not exists rod_repairs jsonb not null default '{}';
update public.fishers set rods_broken = array[rod] where rod_broken and not (rod = any(rods_broken));

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
    'house', f.house_level, 'aquarium', fx_aq_fish(u), 'aq_score', fx_aq_score(u), 'aq_pending', fx_aq_pending(u), 'aq_likes', f.aq_likes);
end $$;

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
