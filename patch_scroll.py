import sys, os

f = 'App.js'
if not os.path.exists(f):
    print('ERROR: run this from your project folder (App.js not found here)'); sys.exit(1)

s = open(f).read()
orig = s

# guard against double-apply
if 'const listRef = useRef(null);' in s:
    print('Already patched (listRef exists). Nothing to do.'); sys.exit(0)

# --- 1) add the three refs right after verseY ---
lines = s.split('\n'); out = []; added = False
for ln in lines:
    out.append(ln)
    if (not added) and ('const verseY = useRef(' in ln):
        out.append('  const listRef = useRef(null);')
        out.append('  const listOffset = useRef(0);')
        out.append('  const wantRestore = useRef(false);')
        added = True
assert added, 'could not find verseY ref to anchor new refs'
s = '\n'.join(out)

# --- 2) closeHymn flags a restore ---
a = "const closeHymn = async () => { await stopSound(); setProjecting(false); setSinging(false); setSelected(null); };"
b = "const closeHymn = async () => { await stopSound(); setProjecting(false); setSinging(false); wantRestore.current = true; setSelected(null); };"
assert s.count(a) == 1, 'closeHymn line not found exactly once (count=%d)' % s.count(a)
s = s.replace(a, b)

# --- 3) FlatList gets ref + scroll tracking + restore-on-return ---
fa = "          <FlatList\n            data={data}"
fb = ("          <FlatList\n"
      "            ref={listRef}\n"
      "            onScroll={e => { listOffset.current = e.nativeEvent.contentOffset.y; }}\n"
      "            scrollEventThrottle={16}\n"
      "            windowSize={21}\n"
      "            onContentSizeChange={(w, h) => {\n"
      "              if (wantRestore.current && listRef.current) {\n"
      "                listRef.current.scrollToOffset({ offset: listOffset.current, animated: false });\n"
      "                if (h >= listOffset.current + 1) wantRestore.current = false;\n"
      "              }\n"
      "            }}\n"
      "            data={data}")
assert s.count(fa) == 1, 'FlatList anchor not found exactly once (count=%d)' % s.count(fa)
s = s.replace(fa, fb)

# balance sanity on whole file
for o, c in [('(', ')'), ('{', '}'), ('[', ']')]:
    if s.count(o) != s.count(c):
        print('WARNING: %s/%s unbalanced (%d/%d) — NOT writing.' % (o, c, s.count(o), s.count(c))); sys.exit(1)

open(f + '.prescroll', 'w').write(orig)
open(f, 'w').write(s)
print('OK: scroll-restore patched. backup at App.js.prescroll')
print('file length', len(s))
