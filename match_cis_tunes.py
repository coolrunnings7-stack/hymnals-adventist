#!/usr/bin/env python3
# Cleans extracted CIS tune names, then checks how many CIS hymns can be filled
# from tunes ALREADY in your library (audio_manifest TUNES keys / existing files).
import json, re, os, sys

if not os.path.exists('cis_tunes.json'):
    print('ERROR: run extract_cis_tunes.py first (cis_tunes.json missing)'); sys.exit(1)
data = json.load(open('cis_tunes.json'))
named = data.get('named', {})

def clean(name):
    n = name.strip().strip('"').strip()
    n = re.sub(r'<[^>]+>', '', n)
    n = re.sub(r'\s+', ' ', n)
    return n.strip()

# A real tune name: not ending in ':' (those are text incipits that slipped in),
# reasonably short, mostly uppercase letters/spaces/periods/hyphens/apostrophes.
def looks_like_tune(n):
    if not n or n.endswith(':'): return False
    if len(n) > 32: return False
    letters = re.sub(r'[^A-Za-z]', '', n)
    if not letters: return False
    upper = sum(1 for c in letters if c.isupper()) / len(letters)
    return upper if False else upper >= 0.6  # mostly caps

clean_named = {}
rejected = {}
for num, raw in named.items():
    c = clean(raw)
    letters = re.sub(r'[^A-Za-z]', '', c)
    up = (sum(1 for ch in letters if ch.isupper())/len(letters)) if letters else 0
    if c and not c.endswith(':') and len(c) <= 32 and up >= 0.6:
        clean_named[num] = c.upper()
    else:
        rejected[num] = c

# Normalize a tune name for matching (collapse spaces, drop punctuation, upper)
def norm(s):
    return re.sub(r'[^A-Z0-9]', '', s.upper())

# Build the set of tunes we ALREADY have, from audio_manifest.js keys.
have_norm = {}
mf = open('audio_manifest.js').read() if os.path.exists('audio_manifest.js') else ''
# keys look like 'SomeTitle-TuneName' : 1  — the part after the last '-' is the tune
for key in re.findall(r"'([^']+)':\s*1", mf):
    if '-' in key:
        tune = key.rsplit('-', 1)[1]
        have_norm[norm(tune)] = key
# also include raw backup filenames if present
bk = os.path.expanduser('~/hymnals_audio_backup/audio')
existing_files = []
if os.path.isdir(bk):
    existing_files = [f[:-4] for f in os.listdir(bk) if f.endswith('.mp3')]
for f in existing_files:
    if '-' in f:
        tune = f.rsplit('-', 1)[1]
        have_norm.setdefault(norm(tune), f)

# Match CIS named tunes against what we have
fillable = {}      # cis_num -> existing key (instant fill, no work)
need_render = {}   # cis_num -> tune name (must render/find)
for num, tune in clean_named.items():
    nt = norm(tune)
    hit = None
    for hn, key in have_norm.items():
        if hn == nt or (len(nt) >= 4 and (nt in hn or hn in nt)):
            hit = key; break
    if hit: fillable[num] = (tune, hit)
    else:   need_render[num] = tune

distinct_need = sorted(set(need_render.values()))
json.dump({'fillable': {k:v[0] for k,v in fillable.items()},
           'need_render_distinct': distinct_need},
          open('cis_match_report.json','w'), indent=2, ensure_ascii=False)

print('=== CIS named-tune matching ===')
print('clean named tunes        :', len(clean_named))
print('rejected as not-a-tune   :', len(rejected), '(text incipits that slipped in)')
print()
print('INSTANT FILL (already have):', len(fillable), 'CIS hymns')
print('NEED a tune (render/find) :', len(need_render), 'CIS hymns')
print('   -> distinct tunes to get:', len(distinct_need))
print()
print('sample instant-fills:')
for k in list(fillable)[:10]:
    print('   CIS', k, '->', fillable[k][0], '  (have:', fillable[k][1][:38], ')')
print()
print('sample distinct tunes still needed:')
print('  ', ', '.join(distinct_need[:25]))
print()
print('-> wrote cis_match_report.json')
