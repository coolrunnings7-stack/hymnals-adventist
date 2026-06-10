// ============================================================
// FILE: src/database/schema.sql
// Hymnals of the Adventist Movement — Full SQLite Schema
// ============================================================

// ─────────────────────────────────────────────
// TABLE: hymnal_editions
// Every published SDA hymnal, in order
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hymnal_editions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  code            TEXT NOT NULL UNIQUE,   -- e.g. 'SDA1985', 'CHURCH1941'
  title           TEXT NOT NULL,
  year_published  INTEGER,
  publisher       TEXT,
  total_hymns     INTEGER,
  is_primary      INTEGER DEFAULT 0,      -- 1 = the 1985 SDA Hymnal (main)
  cover_image     TEXT,                   -- local asset path
  description     TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

// Seed data — all known SDA hymnal editions
INSERT OR IGNORE INTO hymnal_editions (code, title, year_published, publisher, total_hymns, is_primary) VALUES
  ('MILLENNIAL1849', 'Millennial Harp', 1849, 'Joshua V. Himes', 120, 0),
  ('ADVENT1852',     'Hymns for God''s People', 1852, 'Adventist Press', 180, 0),
  ('SDA1861',        'Hymns and Tunes (1861)', 1861, 'Review & Herald', 225, 0),
  ('SDA1869',        'Hymns and Tunes (1869)', 1869, 'Review & Herald', 308, 0),
  ('GOSPEL1886',     'Gospel Song and Hymn Book', 1886, 'Review & Herald', 380, 0),
  ('CHRIST1908',     'Christ in Song', 1908, 'Review & Herald', 900, 0),
  ('CHURCH1941',     'The Church Hymnal', 1941, 'Review & Herald', 703, 0),
  ('SDA1985',        'The Seventh-day Adventist Hymnal', 1985, 'Review & Herald', 695, 1),
  ('SUPP2000',       'Hymnal Supplement', 2000, 'Review & Herald', 100, 0);


// ─────────────────────────────────────────────
// TABLE: tune_masters
// Every unique musical tune, identified by tune name
// This is the heart of the cross-hymnal index
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tune_masters (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tune_name     TEXT NOT NULL UNIQUE,  -- e.g. 'LOBE DEN HERREN', 'ADESTE FIDELES'
  meter         TEXT,                  -- e.g. '8.7.8.7.D', 'L.M.', 'C.M.'
  composer      TEXT,
  composer_year INTEGER,
  origin        TEXT,                  -- e.g. 'German chorale', 'American folk'
  notes         TEXT
);


// ─────────────────────────────────────────────
// TABLE: hymns_master
// One row per unique hymn (by tune + primary text)
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hymns_master (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tune_id         INTEGER REFERENCES tune_masters(id),
  canonical_title TEXT NOT NULL,
  first_line      TEXT,
  topic_tags      TEXT,  -- JSON array: '["praise","worship","morning"]'
  scripture_refs  TEXT,  -- JSON array: '["Psalm 150","Revelation 5:12"]'
  num_verses      INTEGER,
  has_chorus      INTEGER DEFAULT 0,
  copyright_status TEXT DEFAULT 'public_domain',  -- 'public_domain' | 'licensed' | 'restricted'
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);


// ─────────────────────────────────────────────
// TABLE: hymnal_entries
// Each hymn's appearance in a specific edition
// (the cross-hymnal index link table)
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hymnal_entries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  hymn_id         INTEGER NOT NULL REFERENCES hymns_master(id),
  edition_id      INTEGER NOT NULL REFERENCES hymnal_editions(id),
  hymnal_number   INTEGER,             -- number in that edition (e.g. 695)
  title_in_edition TEXT,               -- may differ from canonical title
  first_line      TEXT,
  UNIQUE(edition_id, hymnal_number)
);


// ─────────────────────────────────────────────
// TABLE: hymn_lyrics
// Full lyrics per hymn per language
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hymn_lyrics (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  hymn_id      INTEGER NOT NULL REFERENCES hymns_master(id),
  language     TEXT NOT NULL DEFAULT 'en',  -- ISO 639-1: 'en','es','fr','ht','sw'...
  title        TEXT NOT NULL,
  verse_number INTEGER NOT NULL,             -- 1, 2, 3... 99 = chorus, 100 = bridge
  verse_label  TEXT,                         -- 'Verse 1', 'Chorus', 'Bridge'
  lyrics_text  TEXT NOT NULL,
  UNIQUE(hymn_id, language, verse_number)
);


// ─────────────────────────────────────────────
// TABLE: languages
// All supported language editions
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS languages (
  code         TEXT PRIMARY KEY,   -- ISO 639-1
  name_english TEXT NOT NULL,
  name_native  TEXT NOT NULL,
  hymns_count  INTEGER DEFAULT 0,
  is_rtl       INTEGER DEFAULT 0,  -- right-to-left script
  is_available INTEGER DEFAULT 0   -- 1 = downloadable
);

INSERT OR IGNORE INTO languages (code, name_english, name_native, is_available) VALUES
  ('en', 'English',           'English',          1),
  ('es', 'Spanish',           'Español',          1),
  ('fr', 'French',            'Français',         1),
  ('pt', 'Portuguese',        'Português',        1),
  ('ht', 'Haitian Creole',    'Kreyòl ayisyen',   1),
  ('de', 'German',            'Deutsch',          1),
  ('sw', 'Swahili',           'Kiswahili',        1),
  ('zu', 'Zulu',              'isiZulu',          0),
  ('tl', 'Tagalog',           'Tagalog',          1),
  ('id', 'Indonesian',        'Bahasa Indonesia', 1),
  ('ko', 'Korean',            '한국어',            0),
  ('ja', 'Japanese',          '日本語',            0),
  ('zh', 'Chinese (Simplified)', '中文',           0),
  ('ro', 'Romanian',          'Română',           0),
  ('ru', 'Russian',           'Русский',          0),
  ('hi', 'Hindi',             'हिन्दी',           0),
  ('ta', 'Tamil',             'தமிழ்',            0),
  ('am', 'Amharic',           'አማርኛ',            0),
  ('yo', 'Yoruba',            'Yorùbá',           0),
  ('tw', 'Twi',               'Twi',              0);


// ─────────────────────────────────────────────
// TABLE: audio_files
// MIDI and MP3 audio per hymn
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audio_files (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  hymn_id          INTEGER NOT NULL REFERENCES hymns_master(id),
  file_type        TEXT NOT NULL,      -- 'midi' | 'mp3' | 'musicxml'
  instrument       TEXT DEFAULT 'organ', -- 'organ' | 'piano' | 'a_cappella' | 'full'
  tempo_bpm        INTEGER DEFAULT 90,
  local_path       TEXT,               -- path after download: audio/hymn_0001_organ.mp3
  remote_url       TEXT,               -- CDN URL for streaming / download
  file_size_kb     INTEGER,
  duration_seconds INTEGER,
  is_downloaded    INTEGER DEFAULT 0,
  created_at       TEXT DEFAULT (datetime('now'))
);


// ─────────────────────────────────────────────
// TABLE: sheet_music
// MusicXML files for in-app notation rendering
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sheet_music (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  hymn_id      INTEGER NOT NULL REFERENCES hymns_master(id),
  key_signature TEXT DEFAULT 'C',       -- 'C', 'G', 'F', etc.
  time_signature TEXT DEFAULT '4/4',
  local_path   TEXT,
  remote_url   TEXT,
  is_downloaded INTEGER DEFAULT 0
);


// ─────────────────────────────────────────────
// TABLE: user_favorites
// User's saved hymns
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  hymn_id    INTEGER NOT NULL REFERENCES hymns_master(id),
  added_at   TEXT DEFAULT (datetime('now')),
  notes      TEXT,
  UNIQUE(hymn_id)
);


// ─────────────────────────────────────────────
// TABLE: worship_sets
// Playlists / service orders
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS worship_sets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  date        TEXT,
  notes       TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS worship_set_items (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  set_id    INTEGER NOT NULL REFERENCES worship_sets(id) ON DELETE CASCADE,
  hymn_id   INTEGER NOT NULL REFERENCES hymns_master(id),
  position  INTEGER NOT NULL,
  language  TEXT DEFAULT 'en',
  notes     TEXT
);


// ─────────────────────────────────────────────
// TABLE: user_preferences
// App settings per user
// ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);

INSERT OR IGNORE INTO user_preferences (key, value) VALUES
  ('default_language', 'en'),
  ('default_instrument', 'organ'),
  ('font_size', 'medium'),
  ('auto_scroll', '1'),
  ('dark_mode', 'auto'),
  ('default_edition', 'SDA1985');


// ─────────────────────────────────────────────
// FULL-TEXT SEARCH virtual table
// Enables fast search across titles, first lines, lyrics
// ─────────────────────────────────────────────
CREATE VIRTUAL TABLE IF NOT EXISTS hymns_fts USING fts5(
  hymn_id UNINDEXED,
  canonical_title,
  first_line,
  topic_tags,
  scripture_refs,
  content='hymns_master',
  content_rowid='id'
);

// ─────────────────────────────────────────────
// INDEXES for performance
// ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hymnal_entries_hymn    ON hymnal_entries(hymn_id);
CREATE INDEX IF NOT EXISTS idx_hymnal_entries_edition ON hymnal_entries(edition_id);
CREATE INDEX IF NOT EXISTS idx_hymn_lyrics_hymn_lang  ON hymn_lyrics(hymn_id, language);
CREATE INDEX IF NOT EXISTS idx_audio_hymn             ON audio_files(hymn_id);
CREATE INDEX IF NOT EXISTS idx_sheet_music_hymn       ON sheet_music(hymn_id);
CREATE INDEX IF NOT EXISTS idx_favorites_hymn         ON user_favorites(hymn_id);
CREATE INDEX IF NOT EXISTS idx_set_items_set          ON worship_set_items(set_id);
