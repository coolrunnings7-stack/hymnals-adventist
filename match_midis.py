#!/usr/bin/env python3
# Matches the user's existing MIDI library to the 117 CIS hymns needing music.
# Matches on BOTH hymn title and tune name (from cis_marked_ids.json), and scores
# by how well the MIDI filename overlaps — so we get the RIGHT tune, not a lookalike.
import json, re, os, sys, subprocess

if not os.path.exists('cis_marked_ids.json'):
    print('need cis_marked_ids.json'); sys.exit(1)
ID = json.load(open('cis_marked_ids.json'))  # {"51":[title,TUNE,composer,pd]}

# Which CIS numbers still need music? (not in manifest CIS1908)
mf=open('audio_manifest.js').read()
m=re.search(r'const CIS1908 = \{',mf); s=m.end(); d=1; i=s
while i<len(mf) and d:
    d+= 1 if mf[i]=='{' else -1 if mf[i]=='}' else 0; i+=1
mapped=set(int(n) for n in re.findall(r'(\d+)\s*:',mf[s:i-1]))
need = {int(k):v for k,v in ID.items() if int(k) not in mapped}

# Gather all MIDI paths on the Mac
roots = [os.path.expanduser('~/Downloads'), os.path.expanduser('~/Desktop'), os.path.expanduser('~/Documents')]
midis=[]
for r in roots:
    for dp,_,fns in os.walk(r):
        for fn in fns:
            if fn.lower().endswith(('.mid','.midi')):
                midis.append(os.path.join(dp,fn))

def toks(s):
    return set(t for t in re.split(r'[^a-z0-9]+', s.lower()) if len(t)>2)

# Pre-tokenize midi stems
midi_tok=[(p, toks(os.path.splitext(os.path.basename(p))[0])) for p in midis]

STOP={'the','and','for','with','you','our','his','her','thee','thou','thy','are','was'}
def clean(ts): return ts - STOP

matches={}
for num,(title,tune,comp,pd) in need.items():
    primary = re.split(r'[(/]', tune)[0].strip()
    want = clean(toks(title) | toks(primary))
    best=None; bestscore=0
    for p,mt in midi_tok:
        mt2=clean(mt)
        if not mt2: continue
        inter=want & mt2
        # score: overlap weighted, require tune OR strong title overlap
        score=len(inter)
        # bonus if the primary tune token appears
        if toks(primary) & mt2: score+=2
        if score>bestscore:
            bestscore=score; best=p
    if best and bestscore>=3:
        matches[num]=(title,tune,best,bestscore)

# Report
hits=sorted(matches.items())
with open('midi_matches.txt','w') as f:
    f.write("CIS HYMN -> MATCHED MIDI (score)  [%d of %d matched]\n"%(len(hits),len(need)))
    f.write("="*80+"\n")
    for num,(title,tune,path,score) in hits:
        f.write(f"CIS {num:>3}  {title[:30]:<30} [{tune[:16]:<16}] s{score}\n      -> {os.path.basename(path)}\n")
    f.write("\n=== STILL UNMATCHED (need another approach) ===\n")
    for num,(title,tune,comp,pd) in sorted(need.items()):
        if num not in matches:
            f.write(f"CIS {num:>3}  {title[:34]:<34} tune {tune[:20]} ({comp})\n")

json.dump({str(n):{'title':v[0],'tune':v[1],'midi':v[2],'score':v[3]} for n,v in matches.items()},
          open('midi_matches.json','w'), indent=2, ensure_ascii=False)
print('hymns needing music :', len(need))
print('MATCHED to a MIDI    :', len(matches))
print('still unmatched      :', len(need)-len(matches))
print()
print('sample matches (VERIFY these look right):')
for num,(title,tune,path,score) in hits[:18]:
    print(f"   CIS {num}: {title[:26]:<26} -> {os.path.basename(path)} (s{score})")
print('\n-> wrote midi_matches.txt and midi_matches.json')
