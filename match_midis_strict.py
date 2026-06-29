#!/usr/bin/env python3
# STRICT MIDI matcher: only accepts a match when the TUNE NAME (or a clear title
# signature) actually appears in the MIDI filename. No loose word-overlap.
import json, re, os, sys
if not os.path.exists('cis_marked_ids.json'): print('need cis_marked_ids.json'); sys.exit(1)
ID=json.load(open('cis_marked_ids.json'))

mf=open('audio_manifest.js').read()
m=re.search(r'const CIS1908 = \{',mf); s=m.end(); d=1; i=s
while i<len(mf) and d:
    d+= 1 if mf[i]=='{' else -1 if mf[i]=='}' else 0; i+=1
mapped=set(int(n) for n in re.findall(r'(\d+)\s*:',mf[s:i-1]))
need={int(k):v for k,v in ID.items() if int(k) not in mapped}

roots=[os.path.expanduser('~/Downloads'),os.path.expanduser('~/Desktop'),os.path.expanduser('~/Documents')]
midis=[]
for r in roots:
    for dp,_,fns in os.walk(r):
        for fn in fns:
            if fn.lower().endswith(('.mid','.midi')): midis.append(os.path.join(dp,fn))

def norm(s): return re.sub(r'[^a-z0-9]','',s.lower())
midi_norm=[(p, norm(os.path.splitext(os.path.basename(p))[0])) for p in midis]

def tune_variants(tune):
    # primary + parenthetical alternates, each normalized
    parts=[re.split(r'[(/]',tune)[0]] + re.findall(r'\(([^)]+)\)',tune)
    out=set()
    for p in parts:
        for piece in re.split(r'[/]',p):
            n=norm(piece)
            if len(n)>=5: out.add(n)
    return out

strong={}; weak={}; none_=[]
for num,(title,tune,comp,pd) in need.items():
    tvars=tune_variants(tune)
    tnorm=norm(title)[:18]
    hit=None; how=None
    for p,mn in midi_norm:
        # STRONG: a full tune-name variant appears in the filename
        if any(tv in mn for tv in tvars):
            hit=p; how='tune'; break
    if not hit:
        for p,mn in midi_norm:
            # MEDIUM: a long chunk of the title appears
            if len(tnorm)>=10 and tnorm in mn:
                hit=p; how='title'; break
    if hit and how=='tune': strong[num]=(title,tune,hit)
    elif hit: weak[num]=(title,tune,hit)
    else: none_.append((num,title,tune,comp))

with open('midi_strict.txt','w') as f:
    f.write("STRONG matches — tune name found in filename (TRUST, sing-check quality only): %d\n"%len(strong))
    f.write("="*72+"\n")
    for num,(t,tune,p) in sorted(strong.items()):
        f.write(f"CIS {num:>3}  {t[:30]:<30} [{tune[:16]}]\n      -> {os.path.basename(p)}\n")
    f.write("\nWEAK (title-only, VERIFY): %d\n"%len(weak))
    for num,(t,tune,p) in sorted(weak.items()):
        f.write(f"CIS {num:>3}  {t[:30]:<30} -> {os.path.basename(p)}\n")
    f.write("\nNO MATCH (need to find the MIDI): %d\n"%len(none_))
    for num,t,tune,comp in sorted(none_):
        f.write(f"CIS {num:>3}  {t[:32]:<32} tune {tune[:20]} ({comp})\n")

json.dump({'strong':{str(n):{'title':v[0],'tune':v[1],'midi':v[2]} for n,v in strong.items()}},
          open('midi_strict.json','w'),indent=2,ensure_ascii=False)
print('need music     :', len(need))
print('STRONG (trust) :', len(strong))
print('WEAK (verify)  :', len(weak))
print('NO MATCH       :', len(none_))
print()
print('STRONG matches:')
for num,(t,tune,p) in sorted(strong.items()):
    print(f"   CIS {num}: {t[:26]:<26} -> {os.path.basename(p)}")
print('\n-> wrote midi_strict.txt and midi_strict.json')
