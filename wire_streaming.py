import sys, os, re

# ---------- 1) Transform audio_manifest.js ----------
mf = 'audio_manifest.js'
if not os.path.exists(mf):
    print('ERROR: run from project folder (audio_manifest.js not found)'); sys.exit(1)
m = open(mf).read(); m_orig = m
if 'ALL_TUNE_KEYS' not in m:
    m2, nsub = re.subn(r"require\(\s*'\./assets/audio/[^']*'\s*\)", "1", m)
    new_get = (
        "export function getAudio(edition, n) {\n"
        "  const map = BY_EDITION[edition];\n"
        "  if (!map) return undefined;\n"
        "  const key = map[n];\n"
        "  return (key && TUNES[key]) ? key : undefined;\n"
        "}\n\n"
        "export const ALL_TUNE_KEYS = Object.keys(TUNES);\n"
    )
    pat = re.compile(r"export function getAudio\(edition, n\)\s*\{.*?\n\}\n", re.S)
    assert pat.search(m2), 'could not find getAudio to replace'
    m2 = pat.sub(new_get, m2, count=1)
    open(mf + '.prestream', 'w').write(m_orig)
    open(mf, 'w').write(m2)
    print('manifest: stripped %d require()s; getAudio returns key; ALL_TUNE_KEYS exported' % nsub)
else:
    print('manifest already transformed, skipping')

# ---------- 2) App.js ----------
ap = 'App.js'
a = open(ap).read(); a_orig = a
changed = []

if "from './audio_cache'" not in a:
    a = a.replace("import { getAudio } from './audio_manifest';",
                  "import { getAudio, ALL_TUNE_KEYS } from './audio_manifest';\n"
                  "import { getPlayableUri, downloadAll, cachedCount } from './audio_cache';", 1)
    changed.append('imports')

# states (both at once, guaranteed)
if 'loadingAudio' not in a:
    a = a.replace("const soundRef = useRef(null);",
                  "const soundRef = useRef(null);\n"
                  "  const [loadingAudio, setLoadingAudio] = useState(false);\n"
                  "  const [dlState, setDlState] = useState({ active: false, done: 0, total: 0, saved: 0 });", 1)
    changed.append('states')

# Play: key -> cached local file before createAsync
old_play = "      const src = audioFor(edition, n);\n      if (!src) { setPlaying(false); return; }\n      let playCount = 0;\n      const MAX_PLAYS = 8;\n      const { sound } = await Audio.Sound.createAsync(src);"
new_play = ("      const key = audioFor(edition, n);\n"
            "      if (!key) { setPlaying(false); return; }\n"
            "      setLoadingAudio(true);\n"
            "      let uri;\n"
            "      try { uri = await getPlayableUri(key); }\n"
            "      catch (e) { setLoadingAudio(false); setPlaying(false); return; }\n"
            "      setLoadingAudio(false);\n"
            "      let playCount = 0;\n"
            "      const MAX_PLAYS = 8;\n"
            "      const { sound } = await Audio.Sound.createAsync({ uri });")
assert a.count(old_play) == 1, 'play anchor not found exactly once (%d)' % a.count(old_play)
a = a.replace(old_play, new_play, 1); changed.append('togglePlay')

# Play button label shows Loading while fetching
lbl_old = "<Text style={s.playBtnText}>{playing ? '\u275a\u275a  Pause' : '\u25b6  Play'}</Text>"
lbl_new = "<Text style={s.playBtnText}>{loadingAudio ? '\u2026 Loading' : (playing ? '\u275a\u275a  Pause' : '\u25b6  Play')}</Text>"
assert a.count(lbl_old) == 1, 'play label anchor not found (%d)' % a.count(lbl_old)
a = a.replace(lbl_old, lbl_new, 1); changed.append('playLabel')

ok = all(a.count(o) == a.count(c) for o, c in [('(', ')'), ('{', '}'), ('[', ']')])
if not ok:
    print('WARNING App.js unbalanced - not writing')
    for o,c in [('(',')'),('{','}'),('[',']')]: print(o,c,a.count(o),a.count(c))
    sys.exit(1)
open(ap + '.prestream', 'w').write(a_orig)
open(ap, 'w').write(a)
print('App.js edits:', ', '.join(changed))
print('OK - streaming play wired')
