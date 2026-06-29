import sys, os

f = 'App.js'
if not os.path.exists(f):
    print('ERROR: run from your project folder (App.js not found)'); sys.exit(1)

s = open(f).read(); orig = s
if 'const listRef = useRef(null);' in s:
    print('Already patched (listRef exists). Revert to App.js.prescroll first.'); sys.exit(1)

# 1) refs after verseY
lines = s.split('\n'); out = []; added = False
for ln in lines:
    out.append(ln)
    if (not added) and ('const verseY = useRef(' in ln):
        out += ['  const listRef = useRef(null);',
                '  const listOffset = useRef(0);',
                '  const wantRestore = useRef(false);']
        added = True
assert added, 'verseY anchor not found'
s = '\n'.join(out)

# 2) restore effect, inserted after the sing-along effect
ea = '  }, [singIdx, singing]);'
assert s.count(ea) == 1, 'singing effect anchor not unique (%d)' % s.count(ea)
eff = ea + '''

  // Keep your place in the list after closing a hymn (the list rebuilds in
  // chunks, so we pin to the saved offset briefly while those chunks fill in).
  useEffect(() => {
    if (selected === null && wantRestore.current) {
      const target = listOffset.current;
      let n = 0;
      const id = setInterval(() => {
        n += 1;
        if (listRef.current) listRef.current.scrollToOffset({ offset: target, animated: false });
        if (n >= 16) { clearInterval(id); wantRestore.current = false; }
      }, 40);
      return () => clearInterval(id);
    }
  }, [selected]);'''
s = s.replace(ea, eff, 1)

# 3) closeHymn flags a restore
ca = "const closeHymn = async () => { await stopSound(); setProjecting(false); setSinging(false); setSelected(null); };"
cb = "const closeHymn = async () => { await stopSound(); setProjecting(false); setSinging(false); wantRestore.current = true; setSelected(null); };"
assert s.count(ca) == 1, 'closeHymn not unique (%d)' % s.count(ca)
s = s.replace(ca, cb)

# 4) FlatList: ref + scroll tracking
fa = "          <FlatList\n            data={data}"
fb = ("          <FlatList\n"
      "            ref={listRef}\n"
      "            onScroll={e => { listOffset.current = e.nativeEvent.contentOffset.y; }}\n"
      "            scrollEventThrottle={16}\n"
      "            windowSize={21}\n"
      "            data={data}")
assert s.count(fa) == 1, 'FlatList anchor not unique (%d)' % s.count(fa)
s = s.replace(fa, fb)

for o, c in [('(', ')'), ('{', '}'), ('[', ']')]:
    if s.count(o) != s.count(c):
        print('WARNING %s/%s unbalanced (%d/%d) - not writing' % (o, c, s.count(o), s.count(c))); sys.exit(1)

open(f + '.prescroll', 'w').write(orig)
open(f, 'w').write(s)
print('OK: scroll-restore v2 patched. backup at App.js.prescroll')
