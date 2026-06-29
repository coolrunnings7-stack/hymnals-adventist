#!/usr/bin/env python3
# Run on your Mac. Checks your 164 needed CIS tunes against the SCM catalog
# (scm.txt must be present — it isn't on your Mac, so this version checks against
# a SCM tune-name list I will embed). Outputs which tunes SCM likely has vs not.
import json, re, os, sys

if not os.path.exists('needed_tunes.json'):
    print('ERROR: needed_tunes.json missing — run list_needed_tunes.py first'); sys.exit(1)
needed = json.load(open('needed_tunes.json'))   # {TUNE: [cis nums]}

# SCM tune tokens (normalized) extracted from the catalog Claude has.
SCM = set(json.load(open('scm_norm.json'))) if os.path.exists('scm_norm.json') else set()
if not SCM:
    print('NOTE: scm_norm.json not found next to this script.')
    print('This script needs the SCM index file from Claude to compare.')
    print('Tunes needed total:', len(needed))
    sys.exit(0)

def norm(s): return re.sub(r'[^A-Z0-9]','',s.upper())
have, miss = {}, {}
for tune, nums in needed.items():
    if norm(tune) in SCM: have[tune]=nums
    else: miss[tune]=nums
print('=== SCM availability for the 164 needed CIS tunes ===')
print('needed tunes        :', len(needed))
print('SCM HAS (renderable) :', len(have), '  -> unlocks', sum(len(v) for v in have.values()), 'hymns')
print('SCM MISSING          :', len(miss), '  -> ', sum(len(v) for v in miss.values()), 'hymns need another source')
json.dump({'have':have,'miss':miss}, open('scm_availability.json','w'), indent=2, ensure_ascii=False)
print('-> wrote scm_availability.json')
print()
print('sample renderable:', ', '.join(list(have)[:15]))
print('sample missing   :', ', '.join(list(miss)[:15]))
