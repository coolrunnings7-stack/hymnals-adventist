#!/usr/bin/env python3
# Extract CIS tune names from cis_html/N.html (hymnary.org pages).
# Real structure (confirmed):
#   <span class="hy_infoLabel">Name:</span></td>
#   <td><span class="hy_infoItem"><a href="/tune/...">MONSELL</a></span></td>
# A bracketed value like [What shall I do with Jesus?] = tune has no proper name.
import os, re, json, html, sys

SRC = 'cis_html'
if not os.path.isdir(SRC):
    print('ERROR: run from project folder (cis_html/ not found)'); sys.exit(1)

# Match 'Name:' label, then (across whitespace/newline) the hy_infoItem value,
# which may or may not be wrapped in an <a> tag.
pat = re.compile(
    r'hy_infoLabel">Name:</span>\s*</td>\s*'
    r'<td[^>]*>\s*<span class="hy_infoItem">\s*'
    r'(?:<a[^>]*>)?\s*(.*?)\s*(?:</a>)?\s*</span>',
    re.S | re.I)

named, unnamed, none_found = {}, {}, []

for fn in os.listdir(SRC):
    m = re.match(r'(\d+)\.html$', fn)
    if not m: continue
    num = int(m.group(1))
    try:
        txt = open(os.path.join(SRC, fn), encoding='utf-8', errors='ignore').read()
    except Exception:
        continue
    mm = pat.search(txt)
    if not mm:
        none_found.append(num); continue
    val = html.unescape(mm.group(1)).strip()
    val = re.sub(r'<[^>]+>', '', val).strip()  # strip any stray inner tags
    if not val:
        none_found.append(num); continue
    if val.startswith('[') and val.endswith(']'):
        unnamed[num] = val.strip('[]').strip()
    else:
        named[num] = val

out = {
    'named':   {str(k): named[k]   for k in sorted(named)},
    'unnamed': {str(k): unnamed[k] for k in sorted(unnamed)},
}
json.dump(out, open('cis_tunes.json', 'w'), indent=2, ensure_ascii=False)

print('=== CIS tune extraction ===')
print('pages with a NAMED tune  :', len(named))
print('pages with bracketed text:', len(unnamed))
print('pages with no tune field :', len(none_found))
print('total accounted          :', len(named)+len(unnamed)+len(none_found))
print()
print('sample named tunes:')
for k in list(sorted(named))[:15]:
    print('   CIS', k, '->', named[k])
print()
distinct = sorted(set(named.values()))
print('DISTINCT named tunes     :', len(distinct))
print('sample distinct tunes    :', ', '.join(distinct[:20]))
if none_found:
    print()
    print('first few with no field  :', none_found[:10])
print('-> wrote cis_tunes.json')
