import sys, os
ap = 'App.js'
if not os.path.exists(ap):
    print('ERROR: run from project folder'); sys.exit(1)
a = open(ap).read(); a_orig = a

# 1) import isCached + getPlayable
old_imp = "import { getPlayableUri, downloadAll, cachedCount } from './audio_cache';"
new_imp = "import { getPlayableUri, getPlayable, isCached, downloadAll, cachedCount } from './audio_cache';"
assert a.count(old_imp) == 1, 'import anchor not found (%d)' % a.count(old_imp)
a = a.replace(old_imp, new_imp, 1)

# 2) only show Loading when an actual download will happen
old_play = ("      const key = audioFor(edition, n);\n"
            "      if (!key) { setPlaying(false); return; }\n"
            "      setLoadingAudio(true);\n"
            "      let uri;\n"
            "      try { uri = await getPlayableUri(key); }\n"
            "      catch (e) { setLoadingAudio(false); setPlaying(false); return; }\n"
            "      setLoadingAudio(false);")
new_play = ("      const key = audioFor(edition, n);\n"
            "      if (!key) { setPlaying(false); return; }\n"
            "      const already = await isCached(key);\n"
            "      if (!already) setLoadingAudio(true);\n"
            "      let uri;\n"
            "      try { const r = await getPlayable(key); uri = r.uri; }\n"
            "      catch (e) { setLoadingAudio(false); setPlaying(false); return; }\n"
            "      setLoadingAudio(false);")
assert a.count(old_play) == 1, 'play block anchor not found (%d)' % a.count(old_play)
a = a.replace(old_play, new_play, 1)

ok = all(a.count(o) == a.count(c) for o, c in [('(', ')'), ('{', '}'), ('[', ']')])
if not ok:
    print('unbalanced, not writing'); sys.exit(1)
open(ap + '.prelabel', 'w').write(a_orig)
open(ap, 'w').write(a)
print('OK - label now only shows while truly downloading')
