#!/usr/bin/env python3
# Wires the 18 instant-fill matches into CIS1908, as a MARKED, reversible block.
# Also writes a sing-check sheet listing each with its tune+recording for verdicts.
import json, re, os, sys

MF='audio_manifest.js'
if not os.path.exists(MF): print('run from project folder'); sys.exit(1)
if not os.path.exists('marked_final.json'): print('need marked_final.json'); sys.exit(1)

fills = json.load(open('marked_final.json'))['fill']  # [[num, key], ...]
ids = json.load(open('cis_marked_ids.json')) if os.path.exists('cis_marked_ids.json') else {}

src=open(MF).read()
# find CIS1908 block
m=re.search(r'const CIS1908 = \{',src); s=m.end(); d=1; i=s
while i<len(src) and d:
    d+= 1 if src[i]=='{' else -1 if src[i]=='}' else 0; i+=1
block_end=i-1
block=src[s:block_end]
existing=set(int(n) for n in re.findall(r'(\d+)\s*:',block))

new=[]; review=[]
for num,key in fills:
    num=int(num)
    title,tune = (ids.get(str(num),[ '', '' ])[0], ids.get(str(num),['','',''])[1]) if ids else ('','')
    review.append((num,title,tune,key, num in existing))
    if num in existing:   # already mapped — don't duplicate; note for review
        continue
    new.append(f"  {num}: '{key}',  // FILL-CHECK")

before=src[:block_end].rstrip()
if not before.endswith(',') and not before.endswith('{'): before+=','
ins = "\n  // === 18 instant-fill candidates (sing-check before trusting) ===\n" + "\n".join(new) + "\n" if new else ""
new_src = before + ins + src[block_end:]

ok=all(new_src.count(o)==new_src.count(c) for o,c in [('(',')'),('{','}'),('[',']')])
print('fills considered :', len(fills))
print('newly added      :', len(new))
print('already mapped   :', len(fills)-len(new), '(left as-is)')
print('brace balance    :', ok)
if not ok: print('NOT writing'); sys.exit(1)
open(MF+'.pre18','w').write(src); open(MF,'w').write(new_src)

with open('fill18_singcheck.txt','w') as f:
    f.write("18 INSTANT-FILL CANDIDATES — sing-check each, mark K(keep) or X(wrong)\n")
    f.write("="*66+"\n")
    for num,title,tune,key,already in sorted(review):
        f.write(f"[ ] CIS {num:>3}  {title[:30]:<30}  tune {tune[:18]:<18}  plays: {key}\n")
    f.write("\nAfter singing: tell Claude the X (wrong) numbers; he'll pull them.\n")
print('wrote audio_manifest.js (backup .pre18) and fill18_singcheck.txt')
