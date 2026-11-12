# Metsakuningriik – arenduse märkmed (järgmisele abilisele)

Omanik ei oska programmeerida: vasta eesti keeles, anna täpsed klõpsamise juhised.

## Ülesehitus
- Mäng = üks HTML-fail, mille `build.py` paneb kokku `src/*.js` failidest.
  `python3 build.py väljund.html` (veebi versioon: + kalapuuk.js, cloud.js, koostoo.js).
- Kõik failid liidetakse üheks skriptiks: **funktsioonide nimed ei tohi korduda**.
- Laiendused mähivad olemasolevaid funktsioone (nt `const _dt = drawTile; drawTile = function…`).
- Server: Supabase. `supabase/schema.sql` on korduvalt käivitatav ega kustuta andmeid.
  Iga uus RPC tuleb lisada jaotise „7. Õigused“ nimekirja. Omanik käivitab faili SQL Editoris.
- Netlify ehitab `main` harust automaatselt (iga deploy ≈ 15 krediiti). Tööd tee harus `arendus`,
  siis `git merge --ff-only` main'i.

## Valmis
Kuningriik (hooned tasemetega, elanikud, sündmused, ekspeditsioonid, nõuandja Ülo, heli, realistlik
vesi/puud/kivid), koostöö (monument, kingid, külastused), kalapüük etapid 1–4
(ilmakalad, esemed, ülesanded, märgid, uudised, kalamaja+akvaarium, õngede täiustus/võlud, paadid,
mereveed, **mängijate kalaturg**).

**Etapp 6 – prestiižitähed** (valmis 12.11.2026): tase jääb 50 peale, kogemus koguneb edasi
tähtedeks (`fishers.prestige`, `pxp`, `prestige_last`). Täht vajab `fx_star_need(p) = 15000 + 2500·p`
kogemust, annab 1500+250·täht kulda + juhusliku eseme (iga 5. täht 2 eset), uudise `star` ja
püsiva müügiboonuse +1%/täht (max +30%, `fx_star_bonus`). Saavutused `taht1/5/10/25` tiitlitega.
Edetabel sorteerib tase → tähed. Mäng näitab tähte päises ja pidulikus aknas (`starCheck` kalapuuk.js).
NB: `supabase/parandus_ongid.sql` sisaldab vana `fish_state` – seda enam mitte käivitada.

**Udukuninga saladus, 1. osa** (valmis 12.11.2026) – `src/saladus.js` + schema.sql jaotised 2i ja 6h.
- Saladuste raamat = kalapüügi vahekaart `saladus` (+ kaart kuningriigi seiklustes). Laiendused
  registreerivad vahekaardi `FTAB_FN` kaudu (kalapuuk.js). `rpc` on mähitud: iga tulemus, kus on
  `sec`, näitab „Avastasid saladuse!“ akna.
- 10 salajast ülesannet (`secret_defs`), kontroll ühes kohas `fx_secret_ev(u, ev, d)`; sündmused:
  catch, junk, chest (fish_land), release (fish_use), quest (fish_quest_claim), like (fish_aquarium_like), cave.
- Kaarditükid (`secret_pieces`, 1–7): 1 kirst, 2 kaks saladust, 3 ülesanne, 4–5 Kristallikoobas,
  6–7 = järgmised osad. Tükid 1–3 avavad Kristallikoopa.
- Kristallikoobas: 3 laternat päevas, käigud vesi/tuul/kristall, server veeretab (`secret_cave_*`).
  Ese `koopakristall` tuleb ainult koopast (fx_give_random jätab selle välja).

**Udukuninga saladus, 2. osa** (valmis 12.11.2026) – schema.sql jaotised 2j ja 6i, saladus.js.
- Tükk 6: püük paadikohas (merel), tükk 7: püük Kalatunni ajal (mõlemal kasvav tõenäosus).
- Udulinn avaneb: 7 tükki + vähemalt üks paat (`fx_castle_open`). 4 saali (`secret_castle_hall`):
  värav (3000 kulda + 5 koopakristalli), peegel (mõistatus `fx_riddle`, vale vastus = 1 h ootust),
  raamatukogu (5 kala, igast haruldusest 1–5 kõige väiksem), kristall (koopas 12. sügavus + 10 kristalli).
- Müütilised esemed `secret_myths`/`fisher_myth`, kontroll `fx_myth(u, id)`: udukroon +10% müük
  (fx_sell_value), hõbesarv +10% kogemust (fish_land), varjuvõrk pool vähem põgenemisi (fish_land),
  kristallsüda 4 laternat (`fx_lanterns`), kuuõng +0.03 haruldusboonust (fx_rarity_weights).
- Kuninga Vari: ühine nädalaboss (`secret_boss`, `secret_boss_dmg`), 5 lööki päevas, elu =
  max(15000, 8000 × eelmise nädala lööjad), iga nädala kuju kardab üht ilma (×2 kahju, torm ×1,5).
  Preemia `secret_boss_claim` (ühe korra), esimene alistamine annab Kuuõnge.
- Uued saladused: varivoit, nork, linnaisand (kokku 13). Uudised: `myth`, `vari`.

**Udukuninga saladus, 3. osa** (valmis 12.11.2026) – schema.sql jaotised 2k ja 6j, saladus.js.
- Kalurite kroonika: `fx_chron(nädal)` valib kõigile sama kala + koha (≤30. tase, max tavaline paat)
  + ilma + päev/öö. Vihjed avanevad E / K / R (`fx_part3_state`). Õige püük (kontroll fx_secret_ev
  'catch') → 2500 kulda + 2 koopakristalli kord nädalas (`secret_chron`), esimesel korral müüt Hõbesoomus
  (õng murdub poole harvem). Saladus `kroonik3`.
- Haruldased loomad (`secret_animals`, `fisher_animals`): ilmuvad püügil (hirv/rebane/orav 0,6%),
  koopas (konn 4%) ja Varju löömisel (kull 4%); ootavad 48 h (`secret_state.animal`).
  `secret_animal_tame` võtab soovitud esemed, `secret_animal_gifts` kord päevas → kuningriigi postkasti
  (kuld/toit/kuulsus/kaart) + konn annab eseme. Saladus `loomaisand`.
- Pärija sõrmus (`secret_ring`): kui 6 müüti koos → 7. müüt (+1 latern, +1 löök, `fx_boss_hits`),
  20000 kulda + 500 kuulsust kuningriiki, saavutus `parija` tiitliga „Udukuninga pärija“.
- Saladusi kokku 15. Uudised: kroonika, animal, parija.

**Kaluri päev** (12.11.2026) – `src/meeldetuletus.js`: paneel püügi lehe ülaosas (mähib `tabPuuk`).
24 tunni ketas (öö 21–05, Kalatund, ilmavahetus iga 3 h, kesköö, osuti), „Tegemata“ (FS/FV/KT/SEC
andmetest, ilma uute päringuteta) ja „Tulemas“ ajajoon. Avatud/peidetud olek localStorage `mk.remOpen`.
Uue igapäevase asja lisamisel lisa see ka `remTodo()` / `remSoon()` sisse.

**Päevapreemia kalapüügi boonus** (12.11.2026) – `src/paev.js`, schema.sql 2l + 6k.
Kuningriigi päevapreemia oli juba olemas (engine.js `claimDaily`, tervitusaken joulud.js `openWelcome`,
kuningriigi kaart ui.js) – NB: nimi `DAILY` on seal kasutusel. `claimDaily` on mähitud: sisseloginud
mängija saab samast nupust ka serveri boonuse (`daily_claim`: 7 päeva ring, 7. päev aardekirst,
30 päeva järjest → saladus `jarjekindel`). Rida `fdayLine()` näitab boonust tervitusaknas ja kaardil.

**Õhtukuma** (12.11.2026) – iga päev 19–22 Tallinna aja järgi topelt kalapüügi kogemus (kala, leid, kirst).
Server: `fx_kuma()`, `fx_xp_mult()` fish_land'is, tulemuses `x2`, fish_state `kuma`. Kalatund (20–21) jääb sisse.
Välimus `src/ohtukuma.js`: mähib `drawBackdrop` (loojangutoon, päike, peegeldus), `drawFx` (sädemed),
`fvHeader` (kuldne riba + ×2), `tabPuuk` (bänner). Kellaaeg muuta: `fx_kuma` ja `KUMA.from/to`.

**Lemmiksööt ja parim aeg** (12.11.2026) – `fish_species.baits` ja `.times` (hommik/päev/õhtu/öö,
`fx_daypart()`), kõigil 88 kalal täidetud. fish_cast valib klassi sees kaaluga ×4 lemmiksöödale ja ×2,5
parimale ajale (testitud: haug landiga 54% vs leivaga 25%). fish_land annab `fav`/`best`.
Mäng `src/lemmik.js`: kalakaart (`fishCard`, elav kala canvas'el, päevaring, raskuse täpid), vihjeriba
püügi lehel (`favStrip`), „❤ Lemmiksööt“ märgid ja efekt. Püüdmata kalal on sööt ja aeg „???“.

**Realistlikud söödad** (12.11.2026) – `src/soodad.js` asendab `drawBait` (→ `drawBaitReal`): konksud,
kolmikkonksud, pöörlid, varjud ja läiked. Uue sööda lisamisel lisa sinna oma `case`.

**Päris suurused** (12.11.2026) – päris kaladel `min_w`/`max_w` päris elu järgi (tavaline püük kuni suur
isend; hiiglane ×1,25–1,6 läheneb rekordile), `max_len` cm suurima kaalu juures, `real=false` muinasjutukaladel.
Seeme on schema.sql-is pärast liikide sisestust (kehtib igal käivitusel). Püügi jaotus `power(random(), 2.2)`,
kaal 3 komakohaga alla 1 kg. Mängus `fKg` (alla 1 kg grammides), `fLen`, `fSize`, `fRange` (kalapuuk.js).
Mängu maksimum = hiiglane `max_w × FISH_GIANT (1,6)` – sama mis fish_cast'is; kui seda muudad, muuda mõlemas.
Kalakaardil mõõdulint `fcTape` (lemmik.js), kalaraamatus „kuni X kg · Y cm“.

**Kiitusbänner** (12.11.2026) – `src/kiitus.js` mähib `fxLand`: pärast kala väljatoomist „Vau! Sinu haug kaalub
10 kg ja on 76 cm pikk!“. Tase oma liigi suuruse järgi (vaike/hea/suur/hiid), konfetti suurtel, kiired hiiglastel,
mini-mõõdulint, märgid rekord/uus liik/lemmiksööt. Sõnastus „Sinu <nimi> kaalub…“ (nimetav, ei vaja käänamist).

## Järgmised plaanid
1. (Valmis: Kalatund 20–21 + bossikala, jõulud 1.12–6.1., Etapp 6 prestiiž.)
2. Ideed: nädalavahetuse sündmused, mobiilis kaardi suum, koduloomad, külalisteraamat, hooaja edetabel, varukoopiad,
   tähtede vitriin teiste akvaariumi/külastuse vaates.

Reeglid: ära lõhu olemasolevat mängu, raha/esemeid ei tohi saada topelt, tehingud ja võistlused
kontrollib server, kõik salvestub.
