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

## Järgmised plaanid
1. (Valmis: Kalatund 20–21 + bossikala, jõulud 1.12–6.1., Etapp 6 prestiiž.)
2. Ideed: mobiilis kaardi suum, koduloomad, külalisteraamat, hooaja edetabel, varukoopiad,
   tähtede vitriin teiste akvaariumi/külastuse vaates.

Reeglid: ära lõhu olemasolevat mängu, raha/esemeid ei tohi saada topelt, tehingud ja võistlused
kontrollib server, kõik salvestub.
