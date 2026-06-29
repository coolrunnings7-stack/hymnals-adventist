import sys, os
f = 'App.js'
if not os.path.exists(f):
    print('ERROR: run from your project folder (App.js not found)'); sys.exit(1)
s = open(f).read(); orig = s

if 'const detailOverlay = selected ?' in s:
    print('Already patched (detailOverlay exists). Revert to App.js.prescroll first.'); sys.exit(1)

# 1) detail view stops being an early-return; becomes an overlay value
a1 = "  if (selected) {"
assert s.count(a1) == 1, 'if (selected) anchor not unique (%d)' % s.count(a1)
s = s.replace(a1, "  const detailOverlay = selected ? (() => {", 1)

# 2) close the IIFE where the detail block used to close (just before the list return)
a2 = ("      </SafeAreaView>\n"
      "    );\n"
      "  }\n"
      "\n"
      "  return (\n"
      "    <SafeAreaView style={s.root}>")
assert s.count(a2) == 1, 'detail-end / main-return boundary not unique (%d)' % s.count(a2)
b2 = ("      </SafeAreaView>\n"
      "    );\n"
      "  })() : null;\n"
      "\n"
      "  return (\n"
      "    <SafeAreaView style={s.root}>")
s = s.replace(a2, b2, 1)

# 3) render the overlay on top of the (still-mounted) list, at the very end of the component
a3 = ("        </>\n"
      "      )}\n"
      "    </SafeAreaView>\n"
      "  );\n"
      "}\n"
      "\n"
      "const s = StyleSheet.create({")
assert s.count(a3) == 1, 'end-of-component anchor not unique (%d)' % s.count(a3)
b3 = ("        </>\n"
      "      )}\n"
      "      {detailOverlay ? (\n"
      "        <View style={StyleSheet.absoluteFill}>{detailOverlay}</View>\n"
      "      ) : null}\n"
      "    </SafeAreaView>\n"
      "  );\n"
      "}\n"
      "\n"
      "const s = StyleSheet.create({")
s = s.replace(a3, b3, 1)

for o, c in [('(', ')'), ('{', '}'), ('[', ']')]:
    if s.count(o) != s.count(c):
        print('WARNING %s/%s unbalanced (%d/%d) - not writing' % (o, c, s.count(o), s.count(c))); sys.exit(1)

open(f + '.preoverlay', 'w').write(orig)
open(f, 'w').write(s)
print('OK: detail-as-overlay patched. backup at App.js.preoverlay')
