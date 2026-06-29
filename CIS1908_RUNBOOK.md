# Christ in Song (1908) — Build & Deliver Runbook

Goal: add the **complete 951-hymn Christ in Song (1908)** edition to the
*Hymnals of the Adventist Movement* app, with **titles**, and turn on **audio**
for every hymn you have a recording for.

Everything here is public domain (Belden, Review & Herald, 1908), so there are no
permissions to chase. These three files are yours to keep — they don't depend on
this chat staying open.

---

## What you have

| File | What it does |
|---|---|
| `build_cis1908_index.py` | Pulls all 951 hymns from the source, writes `cis1908_index.json` + `cis1908_seed.sql` |
| `build_audio_manifest.py` | Scans your recordings, writes `audio_manifest.js` automatically |
| `CIS1908_RUNBOOK.md` | This file |

Put all three in your project root: `~/Downloads/hymnals-adventist`.

---

## Step 1 — Build the 951-hymn index

```bash
cd ~/Downloads/hymnals-adventist
python3 build_cis1908_index.py
```

You'll watch it fetch 10 pages and finish with **"DONE — 951 hymns written."**
If it ever says fewer than ~940, just run it again (a page didn't load).

It creates:
- `cis1908_index.json` — the clean data, in case you want to inspect it
- `cis1908_seed.sql` — the file you load into the app database

---

## Step 2 — Load the index into the app database

This depends on how your app seeds SQLite. You built it with the
`hymnal_editions / hymns_master / hymnal_entries` schema, so the seed matches that
exactly. Two common ways:

**A. If you seed from a `.sql` file at first launch** — drop `cis1908_seed.sql`
into your `src/database/` (or wherever your other seeds live), import it in your
seeder, and clear the app's stored database so it re-seeds:
- On the phone: delete the app and reinstall from Expo, OR
- bump your DB version number if your code uses one.

**B. To test the SQL directly on your Mac first** (sanity check, optional):
```bash
sqlite3 test.db < src/database/schema.sql
sqlite3 test.db < cis1908_seed.sql
sqlite3 test.db "SELECT COUNT(*) FROM hymnal_entries WHERE hymnal_number BETWEEN 1 AND 951;"
```
That last line should print a number near 951.

The seed is **idempotent** — running it twice won't create duplicates (it looks up
the existing 1908 edition and uses `INSERT OR IGNORE` on the entries).

> One thing to check in the UI: the 1908 edition may still be flagged
> "coming soon" somewhere in your edition list/config. Flip it to available so
> the now-populated edition shows up.

---

## Step 3 — Turn on the music

You save your GarageBand exports by Christ in Song number — that's exactly what
this needs. Because the 1908 edition's hymn numbers *are* the CIS numbers, the
wiring is now 1-to-1 and automatic.

1. Export each recording as **MP3 (192 kbps)** named by its CIS number:
   `cis_643.mp3`, `cis_021.mp3`, etc. (lowercase, no spaces).
2. Put them in `assets/audio/`.
3. Run:
   ```bash
   cd ~/Downloads/hymnals-adventist
   python3 build_audio_manifest.py
   ```
   It prints exactly which hymns got wired up and writes `audio_manifest.js`.
4. Restart Expo so it notices the new files:
   ```bash
   npx expo start --clear
   ```
5. Open any hymn you added — the gold ▶ play button should be there.

**Same tune, two hymnals?** A recording belongs to a *tune*, not a number. To make
a recording you already have also play on a different hymn (say SDA Hymnal 499),
create `audio_extra.json` in the project root:
```json
{ "499": "cis_643.mp3" }
```
Re-run `build_audio_manifest.py` and it merges that in.

---

## Step 4 — Verify, then ship

- Search a few CIS numbers in the app — titles should be there for all 951.
- Confirm play buttons appear only on hymns you have audio for.
- Heart a hymn, force-quit, reopen — favorites should persist.

When it looks right, submit the update to both stores. A fully-populated,
public-domain hymnal with real audio is a much stronger, more complete app than
the review queue last saw — exactly the kind of substance that moves things along.

---

## If something breaks

- **"python3: command not found"** → try `python build_cis1908_index.py`.
- **Index script fails to fetch** → check Wi-Fi, run it again; it's just reading
  10 public web pages.
- **No play button** → the file name's number didn't match, or Expo didn't restart.
  Re-run `build_audio_manifest.py` (it lists what it found) and `npx expo start --clear`.
- **"unable to resolve module .../audio/..."** → the manifest points at a file that
  isn't in `assets/audio/`. Re-run the audio script; it only lists files that exist.
