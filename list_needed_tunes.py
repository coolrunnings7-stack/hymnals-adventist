#!/usr/bin/env python3
# Produces the real list of CIS named tunes that are NOT yet mapped to audio.
# Output: needed_tunes.json (distinct tune -> list of CIS numbers needing it)
#         needed_tunes.txt  (human-readable, sorted by how many hymns each unlocks)
import json, re, os, sys

MF='audio_manifest.js'; CT='cis_tunes.json'
for f in (MF,CT):
    if not os.path.exists(f): print('ERROR missing',f); sys.exit(1)

cis = json.load(open(CT)).get('named', {})   # {"108":"OLIVET",...} all named-tune hymns
src = open(MF).read()

# CIS numbers already mapped to audio
m=re.search(r'const CIS1908 = \{',src); s=m.end(); d=1; i=s
while i<len(src) and d:
    d+= 1 if src[i]=='{' else -1 if src[i]=='}' else 0; i+=1
block=src[s:i-1]
mapped_nums=set(int(n) for n in re.findall(r'(\d+)\s*:',block))

def cleanup(t):
    t=re.sub(r'<[^>]+>','',t).strip().strip('"').strip()
    return re.sub(r'\s+',' ',t).upper()

# Build: tune -> [cis numbers] for hymns NOT yet mapped
need={}
for num_s,tune in cis.items():
    num=int(num_s)
    if num in mapped_nums: continue
    t=cleanup(tune)
    if not t or t.endswith(':') or len(t)>32: continue
    need.setdefault(t,[]).append(num)

# sort tunes by how many CIS hymns each would unlock (most leverage first)
ranked=sorted(need.items(), key=lambda kv:(-len(kv[1]), kv[0]))
json.dump({t:sorted(ns) for t,ns in ranked}, open('needed_tunes.json','w'), indent=2, ensure_ascii=False)
with open('needed_tunes.txt','w') as f:
    f.write("CIS NAMED TUNES STILL NEEDED  (%d distinct tunes, %d hymns)\n"
            % (len(ranked), sum(len(ns) for _,ns in ranked)))
    f.write("Sorted by leverage (how many CIS hymns each tune unlocks)\n")
    f.write("="*56+"\n")
    for t,ns in ranked:
        f.write(f"{t:<26} {len(ns):>2} hymn(s)  CIS {', '.join(map(str,sorted(ns)))}\n")

print('=== CIS named tunes still needed ===')
print('distinct tunes needed :', len(ranked))
print('CIS hymns they unlock :', sum(len(ns) for _,ns in ranked))
print()
print('TOP leverage tunes (unlock the most hymns):')
for t,ns in ranked[:15]:
    print(f'   {t:<24} -> {len(ns)} hymns  (CIS {", ".join(map(str,sorted(ns)[:6]))}{"..." if len(ns)>6 else ""})')
print()
print('-> wrote needed_tunes.json and needed_tunes.txt')
