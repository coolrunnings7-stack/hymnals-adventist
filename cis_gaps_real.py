#!/usr/bin/env python3
# The HONEST CIS audit: for hymns 1..950, show which have audio and which don't,
# pulling the TITLE so we can see if silent ones are popular songs.
import json, re, os, sys

MF='audio_manifest.js'
HY='cis1908_hymns.json'
for f in (MF,HY):
    if not os.path.exists(f): print('missing',f); sys.exit(1)

src=open(MF).read()
m=re.search(r'const CIS1908 = \{',src); s=m.end(); d=1; i=s
while i<len(src) and d:
    d+= 1 if src[i]=='{' else -1 if src[i]=='}' else 0; i+=1
block=src[s:i-1]
mapped=set(int(n) for n in re.findall(r'(\d+)\s*:',block))

data=json.load(open(HY))
hymns=data.get('hymns',data) if isinstance(data,dict) else data
titles={ (h.get('number') or h.get('n')): (h.get('title') or '') for h in hymns }

total=len(titles)
have=sorted(n for n in titles if n in mapped)
miss=sorted(n for n in titles if n not in mapped)

print('=== HONEST CIS AUDIO AUDIT ===')
print('total CIS hymns      :', total)
print('HAVE audio           :', len(have))
print('MISSING audio        :', len(miss))
print()
# Check the specific ones the user named
for n in (51,87,95):
    status = 'HAS audio' if n in mapped else 'SILENT'
    print(f'  CIS {n}: {status}  -  "{titles.get(n,"?")}"')
print()
print('First 40 SILENT hymns (number + title) — are these popular?:')
for n in miss[:40]:
    print(f'   {n:>4}  {titles.get(n,"")[:50]}')
# save full list
json.dump({'have':have,'missing':{str(n):titles.get(n,"") for n in miss}},
          open('cis_real_gaps.json','w'), indent=2, ensure_ascii=False)
print()
print('-> wrote cis_real_gaps.json (full silent list with titles)')
