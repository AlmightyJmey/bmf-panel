# BMF Panel — Ghid Setup (versiune finala)

## Pasul 1 — Supabase (baza de date)

1. supabase.com → New Project → nume `bmf-panel` → Create
2. Asteapta ~2 min
3. SQL Editor → New Query → copiaza TOT continutul din `supabase_schema.sql` → Run
4. Settings → API → copiaza:
   - Project URL
   - anon public key
   - service_role key

## Pasul 2 — GitHub

1. github.com → New repository → nume `bmf-panel` → Create (gol, fara README)
2. Pe pagina goala a repo-ului, click pe linkul **"uploading an existing file"**
3. Dezarhiveaza acest ZIP pe calculator
4. Trage (drag & drop) TOT ce e in interiorul folderului `bmf-final` (nu folderul el insusi — continutul lui: `app`, `lib`, `package.json`, etc) in zona de upload din GitHub
5. Commit changes

## Pasul 3 — Vercel

1. vercel.com → Add New → Project → Import repo-ul `bmf-panel`
2. La Environment Variables adauga exact 3:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL (fara /rest/v1/ la final!)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key
3. Deploy

## Pasul 4 — Primul cont (Lider)

1. Supabase → Authentication → Users → Add user (email + parola)
2. Copiaza UUID-ul generat
3. SQL Editor → ruleaza:

```sql
insert into public.profiles (id, username, rank, family, can_edit, is_admin)
values ('UUID_COPIAT', 'lider', 'Lider', 'bmf', true, true);
```

4. Intra pe linkul de Vercel cu acel email + parola

## Pasul 5 — Restul conturilor

Din panel, ca Lider, buton **+ Cont nou** (sus dreapta). Pentru Co-Lider, bifeaza si "Poate aproba invoiri".

## Ce e nou fata de versiunea anterioara

- Membrii sunt PERMANENTI — ii adaugi o data, raman in toate saptamanile
- Coloana noua "Invoire" in tabel (bulina albastra/verde/rosie)
- Sectiune noua "Invoiri" — oricine depune, doar Lider/Co-Lider aproba
- Afacere are tabel simplificat (fara Status/Predat/Task)
- Design baby blue pe fundal negru cu skyline
- Misiuni cu progres editabil live (slider)
