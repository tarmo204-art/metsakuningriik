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
