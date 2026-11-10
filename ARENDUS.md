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

## Järgmised plaanid
1. Etapp 5: Kalatund – reaalajas võistlused + ühine bossikala (server kontrollib tulemusi).
2. Etapp 6: prestiiž pärast kalapüügi 50. taset.
3. Ideed: jõulusündmus (detsember), äpina paigaldamine (PWA), mobiilis kaardi suum,
   koduloomad, külalisteraamat, hooaja edetabel, varukoopiad.

Reeglid: ära lõhu olemasolevat mängu, raha/esemeid ei tohi saada topelt, tehingud ja võistlused
kontrollib server, kõik salvestub.
