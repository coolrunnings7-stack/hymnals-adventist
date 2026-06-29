#!/usr/bin/env python3
# Adds the 245 instant-fill CIS matches into the CIS1908 block of audio_manifest.js.
# - Skips any CIS number already present (never overwrites existing audio).
# - Backs up the manifest, balance-checks braces before writing.
# - Also writes a human-readable review sheet: cis_fills_review.txt
import json, re, os, sys

MF = 'audio_manifest.js'
RPT = 'cis_match_report.json'
for f in (MF, RPT):
    if not os.path.exists(f):
        print('ERROR: missing', f); sys.exit(1)

report = json.load(open(RPT))
fillable = report.get('fillable', {})  # { "108": "OLIVET", ... }  (value = tune name)

# We need the ACTUAL existing key per CIS num. Re-derive from match file if it stored it,
# else rebuild by matching tune name to a have-key from the manifest.
src = open(MF).read()

# Collect existing tune keys from the manifest (anything ': 1' style OR existing CIS values)
have_keys = set(re.findall(r"'([^']+)'", src))
def norm(s): return re.sub(r'[^A-Z0-9]', '', s.upper())
key_by_tune = {}
for k in have_keys:
    if '-' in k:
        key_by_tune.setdefault(norm(k.rsplit('-',1)[1]), k)

# Find the CIS1908 block boundaries
m = re.search(r'const CIS1908 = \{', src)
start = m.end()
depth = 1; i = start
while i < len(src) and depth:
    if src[i] == '{': depth += 1
    elif src[i] == '}': depth -= 1
    i += 1
block_end = i - 1  # index of the closing }
block = src[start:block_end]

# Which CIS numbers already mapped?
existing_nums = set(int(n) for n in re.findall(r'(\d+)\s*:', block))

# Build new lines
new_lines = []
review = []
skipped_have = 0
no_key = []
for num_s, tune in fillable.items():
    num = int(num_s)
    if num in existing_nums:
        skipped_have += 1
        continue
    key = key_by_tune.get(norm(tune))
    if not key:
        no_key.append((num, tune)); continue
    new_lines.append(f"  {num}: '{key}',")
    review.append((num, tune, key))

review.sort()
with open('cis_fills_review.txt', 'w') as f:
    f.write("CIS INSTANT-FILL REVIEW  (%d matches)\n" % len(review))
    f.write("Format: CIS# -> TUNE -> recording that will play\n")
    f.write("If any pairing looks WRONG, note the CIS# and tell Claude.\n")
    f.write("="*60 + "\n")
    for num, tune, key in review:
        f.write(f"CIS {num:>4}  ->  {tune:<18}  ->  {key}\n")

# Insert new lines before the closing brace of the block.
# Ensure the char right before block_end has a comma if needed.
before = src[:block_end].rstrip()
if not before.endswith(',') and not before.endswith('{'):
    before += ','
insertion = '\n' + '\n'.join(new_lines) + '\n'
new_src = before + insertion + src[block_end:]

ok = all(new_src.count(o) == new_src.count(c) for o,c in [('(',')'),('{','}'),('[',']')])
print('=== CIS instant-fill wiring ===')
print('matches in report        :', len(fillable))
print('already mapped (skipped) :', skipped_have)
print('no existing key found    :', len(no_key))
print('NEW entries to add        :', len(new_lines))
print('brace balance after edit :', ok)
if not ok:
    print('NOT writing (unbalanced).'); sys.exit(1)

open(MF + '.precisfill', 'w').write(src)
open(MF, 'w').write(new_src)
print('wrote audio_manifest.js (backup: audio_manifest.js.precisfill)')
print('wrote review sheet: cis_fills_review.txt')
if no_key:
    print('\nNote — these had no matching key (left for render batch):')
    for n,t in no_key[:10]: print('   CIS', n, t)
