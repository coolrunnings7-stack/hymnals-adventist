#!/usr/bin/env python3
# Removes the 12 WRONG instant-fill lines from CIS1908. Keeps the 6 good ones.
# Targets only lines tagged // FILL-CHECK with these numbers.
import re, os, sys
WRONG = {198,202,288,299,385,519,525,535,583,647,887,914}
KEEP  = {205,283,311,634,654,729}
MF='audio_manifest.js'
if not os.path.exists(MF): print('run from project folder'); sys.exit(1)
src=open(MF).read(); orig=src
lines=src.split('\n')
out=[]; removed=[]; kept=[]
for ln in lines:
    m=re.match(r"\s*(\d+):\s*'[^']+',\s*//\s*FILL-CHECK", ln)
    if m:
        num=int(m.group(1))
        if num in WRONG:
            removed.append(num); continue           # drop it
        else:
            kept.append(num)
            out.append(ln.replace('  // FILL-CHECK',''))  # keep, clean the tag
    else:
        out.append(ln)
new='\n'.join(out)
ok=all(new.count(o)==new.count(c) for o,c in [('(',')'),('{','}'),('[',']')])
print('removed (wrong)  :', sorted(removed))
print('kept (good)      :', sorted(kept))
print('brace balance    :', ok)
if not ok: print('NOT writing'); sys.exit(1)
open(MF+'.preremove','w').write(orig); open(MF,'w').write(new)
print('cleaned. backup: audio_manifest.js.preremove')
