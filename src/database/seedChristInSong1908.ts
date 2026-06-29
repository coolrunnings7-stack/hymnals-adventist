// src/database/seedChristInSong1908.ts
// Seeds Christ in Song (1908) into the CHRIST1908 edition db.ts already creates.
// Mirrors the app's own seedSampleHymns pattern (no transaction wrapper).
// Idempotent + logs clearly + never crashes app init.

import * as SQLite from 'expo-sqlite';
import cis1908 from '../data/cis1908_hymns.json';

type CisHymn = { number: number; title: string };

export async function seedChristInSong1908(db: SQLite.SQLiteDatabase) {
  try {
    const edition = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM hymnal_editions WHERE code = 'CHRIST1908'`
    );
    if (!edition) {
      console.log('[seed CIS1908] edition CHRIST1908 not found — skipping');
      return;
    }

    const already = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM hymnal_entries WHERE edition_id = ?`,
      [edition.id]
    );
    if (already && already.n >= 900) {
      console.log(`[seed CIS1908] already has ${already.n} entries — skipping`);
      return;
    }

    const hymns = (cis1908 as { hymns: CisHymn[] }).hymns;
    console.log(`[seed CIS1908] seeding ${hymns.length} hymns into edition ${edition.id}...`);

    for (const h of hymns) {
      const res = await db.runAsync(
        `INSERT INTO hymns_master (canonical_title, first_line, copyright_status, notes)
         VALUES (?, ?, 'public_domain', ?)`,
        [h.title, h.title, `CSR1908 #${h.number}`]
      );
      await db.runAsync(
        `INSERT OR IGNORE INTO hymnal_entries
           (hymn_id, edition_id, hymnal_number, title_in_edition, first_line)
         VALUES (?, ?, ?, ?, ?)`,
        [res.lastInsertRowId, edition.id, h.number, h.title, h.title]
      );
    }

    await db.runAsync(
      `UPDATE hymnal_editions SET total_hymns = ? WHERE id = ?`,
      [hymns.length, edition.id]
    );

    const check = await db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM hymnal_entries WHERE edition_id = ?`,
      [edition.id]
    );
    console.log(`[seed CIS1908] DONE — edition now has ${check?.n} entries`);
  } catch (e) {
    console.log('[seed CIS1908] ERROR:', String(e));
  }
}
