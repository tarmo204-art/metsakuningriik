# Metsakuningriik

Rahulik metsakuningriigi brauserimäng koos serveri kontrollitud kalapüügiga.

- **Mäng:** https://metsakuningriik.netlify.app
- **Server ja andmebaas:** Supabase (`supabase/schema.sql`)

## Failid

| Fail | Mis see on |
|---|---|
| `index.html` | Valmis mäng, mida Netlify näitab |
| `vendor/supabase.js` | Supabase'i ühenduse teek |
| `supabase/schema.sql` | Kogu andmebaas ja serveri loogika. Käivita Supabase'i SQL Editoris. Võib uuesti käivitada. |
| `src/` | Mängu lähtekood |
| `build.py` | Paneb `src/` failidest kokku `index.html` |

## Uue kala lisamine

Lisa rida tabelisse `fish_species` (Supabase → Table Editor). Mäng loeb kalad andmebaasist,
nii et koodi muuta pole vaja. Välja `look` abil saab määrata kala kuju ja värvid.
Väljale `baits` kirjuta kala lemmiksöödad (nt `{uss,mais}`) ja väljale `times` parim aeg
(`{hommik}`, `{päev}`, `{õhtu}` või `{öö}`, võib ka mitu). Tühjaks jättes pole kalal lemmikut.
Väljale `max_len` kirjuta kala pikkus sentimeetrites tema suurima kaalu (`max_w`) juures. Mäng arvutab
sellest iga püütud kala pikkuse. Kui kala on välja mõeldud, pane `real` väärtuseks `false`.
Väljale `max_age` kirjuta, mitu aastat kala elab. Selle järgi arvutab mäng püütud kala vanuse.
Väljale `element` (tuli, jää, vesi, välk, vari, valgus, loodus) kirjuta, mis elemendi kala geneetikalaborisse kaasa
annab. Tühjaks jättes valib schema.sql selle ise.

## Geneetikalabori seaded

Supabase → Table Editor → `lab_config`. Siin saab muuta (muudatus kehtib kohe ja jääb alles ka siis,
kui schema.sql uuesti käivitada):

| Võti | Mida see muudab |
|---|---|
| `rarity_weights` | Hübriidi harulduse tõenäosused protsentides: tavaline, ebatavaline, haruldane, eepiline, müütiline (algselt `[60, 25, 10, 4, 1]`) |
| `level_bonus` | Kui palju iga laboritase parandab haruldasemate hübriidide võimalust |
| `mutation_chance` | Elemendi juhusliku mutatsiooni võimalus |
| `daily_fusions` | Ühendamisi päevas labori tasemetel 1–5 |
| `fee` | Ühendamise hind kullas labori tasemetel 1–5 |
| `aura_cap` | Akvaariumi võimete ülempiir (0,15 = 15%) |
