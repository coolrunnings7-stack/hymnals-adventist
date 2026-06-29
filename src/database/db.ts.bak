// src/database/db.ts
// Database initialization and all query helpers

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('hymnals.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`PRAGMA journal_mode = WAL;`);
  await database.execAsync(`PRAGMA foreign_keys = ON;`);

  // Create all tables
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS hymnal_editions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      year_published INTEGER,
      publisher TEXT,
      total_hymns INTEGER,
      is_primary INTEGER DEFAULT 0,
      cover_image TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tune_masters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tune_name TEXT NOT NULL UNIQUE,
      meter TEXT,
      composer TEXT,
      composer_year INTEGER,
      origin TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS hymns_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tune_id INTEGER REFERENCES tune_masters(id),
      canonical_title TEXT NOT NULL,
      first_line TEXT,
      topic_tags TEXT,
      scripture_refs TEXT,
      num_verses INTEGER,
      has_chorus INTEGER DEFAULT 0,
      copyright_status TEXT DEFAULT 'public_domain',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hymnal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hymn_id INTEGER NOT NULL REFERENCES hymns_master(id),
      edition_id INTEGER NOT NULL REFERENCES hymnal_editions(id),
      hymnal_number INTEGER,
      title_in_edition TEXT,
      first_line TEXT,
      UNIQUE(edition_id, hymnal_number)
    );

    CREATE TABLE IF NOT EXISTS hymn_lyrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hymn_id INTEGER NOT NULL REFERENCES hymns_master(id),
      language TEXT NOT NULL DEFAULT 'en',
      title TEXT NOT NULL,
      verse_number INTEGER NOT NULL,
      verse_label TEXT,
      lyrics_text TEXT NOT NULL,
      UNIQUE(hymn_id, language, verse_number)
    );

    CREATE TABLE IF NOT EXISTS languages (
      code TEXT PRIMARY KEY,
      name_english TEXT NOT NULL,
      name_native TEXT NOT NULL,
      hymns_count INTEGER DEFAULT 0,
      is_rtl INTEGER DEFAULT 0,
      is_available INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audio_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hymn_id INTEGER NOT NULL REFERENCES hymns_master(id),
      file_type TEXT NOT NULL,
      instrument TEXT DEFAULT 'organ',
      tempo_bpm INTEGER DEFAULT 90,
      local_path TEXT,
      remote_url TEXT,
      file_size_kb INTEGER,
      duration_seconds INTEGER,
      is_downloaded INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sheet_music (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hymn_id INTEGER NOT NULL REFERENCES hymns_master(id),
      key_signature TEXT DEFAULT 'C',
      time_signature TEXT DEFAULT '4/4',
      local_path TEXT,
      remote_url TEXT,
      is_downloaded INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hymn_id INTEGER NOT NULL REFERENCES hymns_master(id),
      added_at TEXT DEFAULT (datetime('now')),
      notes TEXT,
      UNIQUE(hymn_id)
    );

    CREATE TABLE IF NOT EXISTS worship_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worship_set_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id INTEGER NOT NULL REFERENCES worship_sets(id) ON DELETE CASCADE,
      hymn_id INTEGER NOT NULL REFERENCES hymns_master(id),
      position INTEGER NOT NULL,
      language TEXT DEFAULT 'en',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS hymns_fts USING fts5(
      hymn_id UNINDEXED,
      canonical_title,
      first_line,
      topic_tags,
      content='hymns_master',
      content_rowid='id'
    );

    CREATE INDEX IF NOT EXISTS idx_hymnal_entries_hymn    ON hymnal_entries(hymn_id);
    CREATE INDEX IF NOT EXISTS idx_hymnal_entries_edition ON hymnal_entries(edition_id);
    CREATE INDEX IF NOT EXISTS idx_hymn_lyrics_hymn_lang  ON hymn_lyrics(hymn_id, language);
    CREATE INDEX IF NOT EXISTS idx_audio_hymn             ON audio_files(hymn_id);
  `);

  // Seed default data
  await seedEditions(database);
  await seedLanguages(database);
  await seedSampleHymns(database);
}

async function seedEditions(db: SQLite.SQLiteDatabase) {
  const editions = [
    { code: 'MILLENNIAL1849', title: 'Millennial Harp', year: 1849, publisher: 'Joshua V. Himes', total: 120, primary: 0 },
    { code: 'SDA1869', title: 'Hymns and Tunes (1869)', year: 1869, publisher: 'Review & Herald', total: 308, primary: 0 },
    { code: 'CHRIST1908', title: 'Christ in Song', year: 1908, publisher: 'Review & Herald', total: 900, primary: 0 },
    { code: 'CHURCH1941', title: 'The Church Hymnal', year: 1941, publisher: 'Review & Herald', total: 703, primary: 0 },
    { code: 'SDA1985', title: 'The Seventh-day Adventist Hymnal', year: 1985, publisher: 'Review & Herald', total: 695, primary: 1 },
  ];
  for (const e of editions) {
    await db.runAsync(
      `INSERT OR IGNORE INTO hymnal_editions (code, title, year_published, publisher, total_hymns, is_primary) VALUES (?,?,?,?,?,?)`,
      [e.code, e.title, e.year, e.publisher, e.total, e.primary]
    );
  }
}

async function seedLanguages(db: SQLite.SQLiteDatabase) {
  const langs = [
    ['en', 'English', 'English', 1],
    ['es', 'Spanish', 'Español', 1],
    ['fr', 'French', 'Français', 1],
    ['pt', 'Portuguese', 'Português', 1],
    ['ht', 'Haitian Creole', 'Kreyòl ayisyen', 1],
    ['de', 'German', 'Deutsch', 1],
    ['sw', 'Swahili', 'Kiswahili', 1],
    ['tl', 'Tagalog', 'Tagalog', 1],
    ['id', 'Indonesian', 'Bahasa Indonesia', 1],
  ];
  for (const l of langs) {
    await db.runAsync(
      `INSERT OR IGNORE INTO languages (code, name_english, name_native, is_available) VALUES (?,?,?,?)`, l
    );
  }
}

async function seedSampleHymns(db: SQLite.SQLiteDatabase) {
  // Sample hymns for development / demo
  const hymns = [
    { title: 'Praise to the Lord, the Almighty', first_line: 'Praise to the Lord, the Almighty, the King of creation', tags: '["praise","worship"]', verses: 4, chorus: 0 },
    { title: 'Holy, Holy, Holy', first_line: 'Holy, holy, holy! Lord God Almighty', tags: '["worship","Trinity"]', verses: 4, chorus: 0 },
    { title: 'A Mighty Fortress Is Our God', first_line: 'A mighty fortress is our God, a bulwark never failing', tags: '["faith","strength"]', verses: 4, chorus: 0 },
    { title: 'Great Is Thy Faithfulness', first_line: 'Great is Thy faithfulness, O God my Father', tags: '["faithfulness","morning","trust"]', verses: 3, chorus: 1 },
    { title: 'How Great Thou Art', first_line: 'O Lord my God, when I in awesome wonder', tags: '["nature","praise","awe"]', verses: 4, chorus: 1 },
    { title: 'Nearer, My God, to Thee', first_line: 'Nearer, my God, to Thee, nearer to Thee', tags: '["prayer","longing","devotion"]', verses: 5, chorus: 0 },
    { title: 'What a Friend We Have in Jesus', first_line: 'What a friend we have in Jesus, all our sins and griefs to bear', tags: '["prayer","friendship","comfort"]', verses: 3, chorus: 0 },
    { title: 'Blessed Assurance', first_line: 'Blessed assurance, Jesus is mine', tags: '["assurance","joy","salvation"]', verses: 3, chorus: 1 },
    { title: 'Immortal, Invisible, God Only Wise', first_line: 'Immortal, invisible, God only wise', tags: '["worship","God","eternity"]', verses: 4, chorus: 0 },
    { title: 'The Lord Is My Shepherd', first_line: 'The Lord is my Shepherd; no want shall I know', tags: '["trust","peace","Psalm 23"]', verses: 4, chorus: 0 },
    { title: 'Lead Me to Calvary', first_line: 'King of my life, I crown Thee now', tags: '["calvary","cross","salvation"]', verses: 4, chorus: 1 },
    { title: 'Day by Day', first_line: 'Day by day and with each passing moment', tags: '["daily","trust","strength"]', verses: 3, chorus: 0 },
  ];

  for (const h of hymns) {
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO hymns_master (canonical_title, first_line, topic_tags, num_verses, has_chorus) VALUES (?,?,?,?,?)`,
      [h.title, h.first_line, h.tags, h.verses, h.chorus]
    );
    if (result.lastInsertRowId) {
      const hymnId = result.lastInsertRowId;
      // Add to SDA1985
      const edition = await db.getFirstAsync<{id:number}>(
        `SELECT id FROM hymnal_editions WHERE code = 'SDA1985'`
      );
      if (edition) {
        await db.runAsync(
          `INSERT OR IGNORE INTO hymnal_entries (hymn_id, edition_id, hymnal_number, title_in_edition) VALUES (?,?,?,?)`,
          [hymnId, edition.id, hymnId, h.title]
        );
      }
      // Add English lyrics (verse 1 sample)
      await db.runAsync(
        `INSERT OR IGNORE INTO hymn_lyrics (hymn_id, language, title, verse_number, verse_label, lyrics_text) VALUES (?,?,?,?,?,?)`,
        [hymnId, 'en', h.title, 1, 'Verse 1', h.first_line + '...']
      );
    }
  }
}

// ─────────────────────────────────────────────
// QUERY HELPERS
// ─────────────────────────────────────────────

export async function getAllEditions() {
  const db = await getDatabase();
  return db.getAllAsync<HymnalEdition>(`SELECT * FROM hymnal_editions ORDER BY year_published`);
}

export async function getHymnsByEdition(editionCode: string, page = 0, limit = 50) {
  const db = await getDatabase();
  return db.getAllAsync<HymnEntry>(
    `SELECT hm.id, hm.canonical_title, hm.first_line, hm.topic_tags,
            hm.num_verses, hm.has_chorus, hm.copyright_status,
            he.hymnal_number
     FROM hymns_master hm
     JOIN hymnal_entries he ON hm.id = he.hymn_id
     JOIN hymnal_editions ed ON he.edition_id = ed.id
     WHERE ed.code = ?
     ORDER BY he.hymnal_number
     LIMIT ? OFFSET ?`,
    [editionCode, limit, page * limit]
  );
}

export async function searchHymns(query: string, limit = 30) {
  const db = await getDatabase();
  return db.getAllAsync<HymnEntry>(
    `SELECT hm.id, hm.canonical_title, hm.first_line, hm.topic_tags,
            hm.num_verses, hm.has_chorus
     FROM hymns_master hm
     WHERE hm.canonical_title LIKE ? OR hm.first_line LIKE ? OR hm.topic_tags LIKE ?
     LIMIT ?`,
    [`%${query}%`, `%${query}%`, `%${query}%`, limit]
  );
}

export async function getHymnDetail(hymnId: number) {
  const db = await getDatabase();
  return db.getFirstAsync<HymnEntry>(
    `SELECT hm.*, GROUP_CONCAT(ed.code || ':' || he.hymnal_number, '|') as editions_list
     FROM hymns_master hm
     LEFT JOIN hymnal_entries he ON hm.id = he.hymn_id
     LEFT JOIN hymnal_editions ed ON he.edition_id = ed.id
     WHERE hm.id = ?
     GROUP BY hm.id`,
    [hymnId]
  );
}

export async function getHymnLyrics(hymnId: number, language = 'en') {
  const db = await getDatabase();
  return db.getAllAsync<LyricVerse>(
    `SELECT * FROM hymn_lyrics WHERE hymn_id = ? AND language = ? ORDER BY verse_number`,
    [hymnId, language]
  );
}

export async function getAudioFiles(hymnId: number) {
  const db = await getDatabase();
  return db.getAllAsync<AudioFile>(
    `SELECT * FROM audio_files WHERE hymn_id = ?`,
    [hymnId]
  );
}

export async function toggleFavorite(hymnId: number) {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{id:number}>(
    `SELECT id FROM user_favorites WHERE hymn_id = ?`, [hymnId]
  );
  if (existing) {
    await db.runAsync(`DELETE FROM user_favorites WHERE hymn_id = ?`, [hymnId]);
    return false;
  } else {
    await db.runAsync(`INSERT INTO user_favorites (hymn_id) VALUES (?)`, [hymnId]);
    return true;
  }
}

export async function isFavorite(hymnId: number): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{id:number}>(
    `SELECT id FROM user_favorites WHERE hymn_id = ?`, [hymnId]
  );
  return !!row;
}

export async function getFavorites() {
  const db = await getDatabase();
  return db.getAllAsync<HymnEntry>(
    `SELECT hm.id, hm.canonical_title, hm.first_line, hm.topic_tags, hm.num_verses, hm.has_chorus
     FROM hymns_master hm
     JOIN user_favorites uf ON hm.id = uf.hymn_id
     ORDER BY uf.added_at DESC`
  );
}

export async function getCrossIndex(hymnId: number) {
  const db = await getDatabase();
  return db.getAllAsync<CrossIndexEntry>(
    `SELECT he.hymnal_number, ed.code, ed.title, ed.year_published, he.title_in_edition
     FROM hymnal_entries he
     JOIN hymnal_editions ed ON he.edition_id = ed.id
     WHERE he.hymn_id = ?
     ORDER BY ed.year_published`,
    [hymnId]
  );
}

export async function getAvailableLanguages(hymnId: number) {
  const db = await getDatabase();
  return db.getAllAsync<{language:string}>(
    `SELECT DISTINCT language FROM hymn_lyrics WHERE hymn_id = ?`, [hymnId]
  );
}

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface HymnalEdition {
  id: number;
  code: string;
  title: string;
  year_published: number;
  publisher: string;
  total_hymns: number;
  is_primary: number;
  description?: string;
}

export interface HymnEntry {
  id: number;
  canonical_title: string;
  first_line: string;
  topic_tags: string;
  num_verses: number;
  has_chorus: number;
  copyright_status?: string;
  hymnal_number?: number;
  editions_list?: string;
}

export interface LyricVerse {
  id: number;
  hymn_id: number;
  language: string;
  title: string;
  verse_number: number;
  verse_label: string;
  lyrics_text: string;
}

export interface AudioFile {
  id: number;
  hymn_id: number;
  file_type: string;
  instrument: string;
  tempo_bpm: number;
  local_path?: string;
  remote_url?: string;
  duration_seconds?: number;
  is_downloaded: number;
}

export interface CrossIndexEntry {
  hymnal_number: number;
  code: string;
  title: string;
  year_published: number;
  title_in_edition: string;
}
