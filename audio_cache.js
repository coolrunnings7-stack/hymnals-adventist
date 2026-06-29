// audio_cache.js
// Downloads hymn tunes on demand from the app's public GitHub release and caches
// them on the device, so each tune is fetched once and then plays offline forever.
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUDIO_BASE =
  'https://github.com/coolrunnings7-stack/hymnals-adventist/releases/download/audio-v1/';

const DIR = FileSystem.documentDirectory + 'tunes/';
const IDX_KEY = 'cachedTunes:v1';

let _index = null;
async function loadIndex() {
  if (_index) return _index;
  try { const raw = await AsyncStorage.getItem(IDX_KEY); _index = raw ? JSON.parse(raw) : {}; }
  catch (e) { _index = {}; }
  return _index;
}
async function markCached(key) {
  const idx = await loadIndex(); idx[key] = true;
  try { await AsyncStorage.setItem(IDX_KEY, JSON.stringify(idx)); } catch (e) {}
}

async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  } catch (e) {
    try { await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }); } catch (e2) {}
  }
}

function safeName(key) { return String(key).replace(/[^A-Za-z0-9_-]/g, '_'); }
function localUri(key) { return DIR + safeName(key) + '.mp3'; }
function remoteUrl(key) { return AUDIO_BASE + encodeURIComponent(key) + '.mp3'; }

// Fast, reliable: is this tune already saved on the device?
export async function isCached(key) {
  if (!key) return false;
  const idx = await loadIndex();
  if (idx[key]) return true;
  try {
    const info = await FileSystem.getInfoAsync(localUri(key));
    if (info && info.exists) { await markCached(key); return true; }
  } catch (e) {}
  return false;
}

// Returns { uri, downloaded } — downloaded=true only when a network fetch happened.
export async function getPlayable(key) {
  if (!key) return null;
  await ensureDir();
  const local = localUri(key);
  const idx = await loadIndex();
  try {
    const info = await FileSystem.getInfoAsync(local);
    if (idx[key] && info && info.exists) return { uri: info.uri || local, downloaded: false };
    if (info && info.exists) { await markCached(key); return { uri: info.uri || local, downloaded: false }; }
  } catch (e) {}
  const res = await FileSystem.downloadAsync(remoteUrl(key), local);
  if (!res || res.status !== 200) {
    try { await FileSystem.deleteAsync(local, { idempotent: true }); } catch (e) {}
    throw new Error('Could not download tune (' + (res ? res.status : 'no response') + ')');
  }
  await markCached(key);
  return { uri: res.uri || local, downloaded: true };
}

// Back-compat: returns just the uri.
export async function getPlayableUri(key) {
  const r = await getPlayable(key);
  return r ? r.uri : null;
}

export async function downloadAll(keys, onProgress) {
  await ensureDir();
  let done = 0, failed = 0;
  for (const key of keys) {
    try {
      const idx = await loadIndex();
      let have = !!idx[key];
      if (!have) { try { const i = await FileSystem.getInfoAsync(localUri(key)); have = !!(i && i.exists); } catch (e) {} }
      if (!have) {
        const res = await FileSystem.downloadAsync(remoteUrl(key), localUri(key));
        if (res && res.status === 200) await markCached(key); else failed += 1;
      }
    } catch (e) { failed += 1; }
    done += 1;
    if (onProgress) onProgress(done, keys.length, failed);
  }
  return { done, failed };
}

export async function cachedCount(keys) {
  const idx = await loadIndex();
  let n = 0; for (const key of keys) if (idx[key]) n += 1; return n;
}
