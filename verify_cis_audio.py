#!/usr/bin/env python3
# Verifies CIS audio end-to-end: for every CIS number that maps to a tune,
# confirm that tune's .mp3 exists on the GitHub release (what the app streams).
# Reports any "mapped but missing" hymns (would be silent in the app).
import re, os, sys, subprocess, json

MF = 'audio_manifest.js'
if not os.path.exists(MF):
    print('ERROR: run from project folder'); sys.exit(1)
src = open(MF).read()

# Extract CIS1908 block
m = re.search(r'const CIS1908 = \{', src)
start = m.end(); depth=1; i=start
while i < len(src) and depth:
    if src[i]=='{': depth+=1
    elif src[i]=='}': depth-=1
    i+=1
block = src[start:i-1]

pairs = re.findall(r'(\d+)\s*:\s*\'([^\']+)\'', block)
keys = sorted(set(k for _,k in pairs))
print('CIS numbers mapped       :', len(pairs))
print('distinct tune keys used  :', len(keys))

# Get the list of asset names actually on the release (one network call)
try:
    out = subprocess.check_output(
        ['gh','release','view','audio-v1','--repo','coolrunnings7-stack/hymnals-adventist',
         '--json','assets','--jq','.assets[].name'],
        text=True, stderr=subprocess.DEVNULL)
    on_release = set(n.strip()[:-4] for n in out.splitlines() if n.strip().endswith('.mp3'))
    print('assets on GitHub release :', len(on_release))
except Exception as e:
    print('Could not reach gh release (run: gh auth status). Error:', e); sys.exit(1)

missing = [k for k in keys if k not in on_release]
present = [k for k in keys if k in on_release]
print()
print('tune keys PRESENT on release:', len(present))
print('tune keys MISSING on release:', len(missing))
if missing:
    # how many CIS hymns are affected by missing keys?
    affected = sorted(int(n) for n,k in pairs if k in set(missing))
    print('CIS hymns that would be SILENT:', len(affected))
    print('first affected CIS numbers   :', affected[:15])
    print('first missing keys           :', missing[:10])
    json.dump({'missing_keys':missing,'silent_cis':affected},
              open('cis_audio_gaps.json','w'), indent=2)
    print('-> wrote cis_audio_gaps.json')
else:
    print()
    print('ALL mapped CIS tunes are present on the release. Every mapped hymn can play.')

# Suggest 6 spread-out hymns to actually tap-test by ear
import random
sample_nums = sorted(set(int(n) for n,k in pairs if k in on_release))
if sample_nums:
    step = max(1, len(sample_nums)//6)
    picks = sample_nums[::step][:6]
    print()
    print('Suggested hymns to TAP-TEST by ear (spread across the book):')
    keymap = {int(n):k for n,k in pairs}
    for n in picks:
        print(f'   CIS {n:>4}  (tune file: {keymap[n]})')
