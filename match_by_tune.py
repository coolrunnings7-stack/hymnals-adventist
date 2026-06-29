#!/usr/bin/env python3
# Re-match the 123 marked hymns using their IDENTIFIED TUNE NAMES against the
# audio library (which is keyed by tune). This fixes the earlier name-blind miss.
import json, re, os, sys
if not os.path.exists('cis_marked_ids.json'):
    print('need cis_marked_ids.json (from Claude)'); sys.exit(1)
ID = json.load(open('cis_marked_ids.json'))  # {"51":[title,TUNE,composer,pd], ...}

mf = open('audio_manifest.js').read() if os.path.exists('audio_manifest.js') else ''
def norm(x): return re.sub(r'[^A-Z0-9]','',x.upper())

# library tune tokens: from each key, index the tune part (after last '-') AND whole key
have = {}
for key in set(re.findall(r"'([^']+)'", mf)):
    if '-' in key:
        have.setdefault(norm(key.rsplit('-',1)[1]), key)
# also include backup filenames
bk=os.path.expanduser('~/hymnals_audio_backup/audio')
if os.path.isdir(bk):
    for f in os.listdir(bk):
        if f.endswith('.mp3') and '-' in f:
            have.setdefault(norm(f[:-4].rsplit('-',1)[1]), f[:-4])

def core(tune):  # strip parenthetical alt names, take primary token
    t = re.split(r'[(/]', tune)[0].strip()
    return t

fill, render = [], []
for num, (title, tune, comp, pd) in ((int(k),v) for k,v in ID.items()):
    primary = core(tune)
    # try primary tune name, then any alt names inside parens
    cands = [primary] + re.findall(r'\(([^)]+)\)', tune)
    hit=''
    for c in cands:
        for token in re.split(r'[/ ]', c):
            if len(token)>=4 and norm(token) in have:
                hit=have[norm(token)]; break
        if hit: break
    if hit: fill.append((num,title,tune,hit))
    else:   render.append((num,title,tune,comp))

fill.sort(); render.sort()
with open('marked_final.txt','w') as f:
    f.write("=== INSTANT FILL (tune already in library) : %d ===\n"%len(fill))
    for n,t,tune,hit in fill:
        f.write(f"  CIS {n:>3}  {t[:34]:<34} [{tune[:20]}] -> {hit}\n")
    f.write("\n=== NEED TO RENDER (public domain) : %d ===\n"%len(render))
    for n,t,tune,comp in render:
        f.write(f"  CIS {n:>3}  {t[:34]:<34} tune {tune[:24]:<24} ({comp})\n")
json.dump({'fill':[[n,h] for n,_,_,h in fill],
           'render':[[n,t,tune,comp] for n,t,tune,comp in render]},
          open('marked_final.json','w'), indent=2, ensure_ascii=False)
print("INSTANT FILL (already have):", len(fill))
print("NEED TO RENDER (PD)        :", len(render))
print()
print("instant fills:")
for n,t,tune,hit in fill: print(f"   CIS {n}: {t[:30]} -> {hit}")
print("\n-> wrote marked_final.txt and marked_final.json")
