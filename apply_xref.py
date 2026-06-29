# Wires the cross-reference "Also found in" feature into App.js
import re, sys
f = "App.js"
src = open(f).read()
orig = src

# 1) import getCrossRefs + EDITION_LABELS (after the FRENCH import)
if "cross_reference" not in src:
    src = src.replace(
        "import FRENCH from './french_lyrics.json';",
        "import FRENCH from './french_lyrics.json';\nimport { getCrossRefs, EDITION_LABELS } from './cross_reference';",
        1)

# 2) Map our app edition ids <-> cross_reference edition codes.
#    cross_reference uses: CIS1908, SDAH1985, CH1941, ThaiSDA
#    app editions present: SDAH1985, CIS1908, CH1941, HT1886, MH1854, BURMESE, MISSION
#    Only the three overlap; ThaiSDA has no in-app book (show as info, not tappable).
# Insert a helper just before the detailOverlay definition.
helper = """  // --- Cross-reference helpers (which other hymnals share this tune) ---
  const XREF_TO_APP = { CIS1908: 'CIS1908', SDAH1985: 'SDAH1985', CH1941: 'CH1941' };
  const jumpToCrossRef = (xrefEd, num) => {
    const appEd = XREF_TO_APP[xrefEd];
    if (!appEd || !HYMNS[appEd]) return;            // no in-app book (e.g. Thai) -> not tappable
    const target = HYMNS[appEd].find(h => h.n === num);
    if (!target) return;
    stopSound();
    setEdition(appEd);
    setEntered(true);
    openHymn(target);
  };
"""
if "jumpToCrossRef" not in src:
    src = src.replace("  const detailOverlay = selected ? (() => {",
                      helper + "\n  const detailOverlay = selected ? (() => {", 1)

# 3) Render the "Also found in" row right after the detailEdition line.
anchor = '          <Text style={[s.detailEdition, { color: INK_ACCENT[edition] || GOLD }]}>{activeEdition.name} ({activeEdition.year})</Text>'
xref_block = anchor + """
          {(() => {
            const refs = getCrossRefs(edition, selected.n);
            if (!refs || refs.length === 0) return null;
            return (
              <View style={s.xrefWrap}>
                <Text style={s.xrefLabel}>Also found in</Text>
                <View style={s.xrefRow}>
                  {refs.map((r, i) => {
                    const tappable = !!HYMNS[r.edition];
                    const label = (EDITION_LABELS[r.edition] || r.edition) + ' #' + r.number;
                    return tappable ? (
                      <TouchableOpacity key={i} style={s.xrefChip} onPress={() => jumpToCrossRef(r.edition, r.number)}>
                        <Text style={s.xrefChipTxt}>{label}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View key={i} style={[s.xrefChip, s.xrefChipFlat]}>
                        <Text style={s.xrefChipInfo}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })()}"""
if "Also found in" not in src:
    src = src.replace(anchor, xref_block, 1)

# 4) Add styles. Find the StyleSheet.create({ ... }) and inject our keys after 'detailEdition:' style.
# Locate detailEdition style line and add ours right after its closing entry.
m = re.search(r'(\n\s*detailEdition:\s*\{[^}]*\},)', src)
if m and "xrefWrap:" not in src:
    inject = m.group(1) + """
  xrefWrap: { marginTop: 6, marginBottom: 4, alignItems: 'center' },
  xrefLabel: { color: '#9a8757', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  xrefRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  xrefChip: { backgroundColor: 'rgba(168,132,42,0.16)', borderColor: 'rgba(168,132,42,0.5)', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 4 },
  xrefChipTxt: { color: '#caa24a', fontSize: 12, fontWeight: '600' },
  xrefChipFlat: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  xrefChipInfo: { color: '#8a7a55', fontSize: 12 },"""
    src = src.replace(m.group(1), inject, 1)

if src == orig:
    print("NO CHANGES MADE — anchors not found; nothing written.")
    sys.exit(1)

open(f, "w").write(src)
checks = {
  "import added": "cross_reference" in src,
  "helper added": "jumpToCrossRef" in src,
  "row added": "Also found in" in src,
  "styles added": "xrefWrap:" in src,
}
for k,v in checks.items(): print(("OK  " if v else "MISS ")+k)
print("done")
