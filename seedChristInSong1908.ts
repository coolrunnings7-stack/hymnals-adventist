// src/database/seedChristInSong1908.ts
// Seeds the complete Christ in Song (1908) index into the app.
// It attaches to the CHRIST1908 edition that db.ts already creates, so it does
// NOT make a duplicate edition. Public domain (Belden, Review & Herald, 1908).
//
// Idempotent: if the edition already has its hymns, this does nothing — safe to
// run on every launch. Runs inside one transaction so 951 inserts are fast and
// all-or-nothing.
//
// Reads the data file produced by build_cis1908_index.py.
// Put that file at:  src/data/cis1908_hymns.json

import * as SQLite from 'expo-sqlite';
import cis1908 from '../data/cis1908_hymns.json';

type CisHymn = { number: number; title: string };

export async function seedChristInSong1908(db: SQLite.SQLiteDatabase) {
  const edition = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM hymnal_editions WHERE code = 'CHRIST1908'`
  );
  if (!edition) return; // edition row not created yet — nothing to attach to

  const already = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM hymnal_entries WHERE edition_id = ?`,
    [edition.id]
  );
  if (already && already.n >= 900) return; // already seeded

  const hymns = (cis1908 as { hymns: CisHymn[] }).hymns;

  await db.withTransactionAsync(async () => {
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
  });

  console.log(`[seed] Christ in Song 1908: added ${hymns.length} hymns`);
}
