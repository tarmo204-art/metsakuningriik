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
