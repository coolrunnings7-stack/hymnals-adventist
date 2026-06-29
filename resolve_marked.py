#!/usr/bin/env python3
# For the user's MARKED CIS hymns, gather every identifier we have:
#   CIS number, title (from hymn list), first line (from lyrics), tune name (from cis_tunes.json),
# then check if that tune already exists in our audio library under ANY name.
import json, re, os, sys

MARKED = [5,12,17,18,27,32,40,51,57,64,71,74,76,78,79,87,93,94,96,101,102,107,109,110,134,138,146,150,166,191,196,198,199,200,202,203,204,205,212,216,219,227,230,282,283,288,289,294,299,301,308,311,312,315,332,385,387,395,399,409,430,431,503,504,505,506,507,508,510,516,519,520,524,525,528,532,535,538,548,551,552,561,564,566,567,576,583,586,594,611,634,647,654,677,683,720,722,729,734,741,845,847,852,854,855,861,862,863,865,867,870,877,878,879,887,892,894,905,907,913,914,929,930]

def load(p, d=None):
    try: return json.load(open(p))
    except: return d

hymns = load('cis1908_hymns.json', [])
hymns = hymns.get('hymns', hymns) if isinstance(hymns, dict) else hymns
title_by = { (h.get('number') or h.get('n')): (h.get('title') or '') for h in hymns }

lyr = load('cis1908_lyrics.json', {}) or load('cis_lyrics.json', {})
def first_line(n):
    raw = None
    if isinstance(lyr, dict):
        raw = lyr.get(str(n)) or lyr.get(n)
    if not raw: return ''
    if isinstance(raw, list): raw = '\n'.join(raw)
    for line in str(raw).split('\n'):
        s = re.sub(r'^\d+\s*', '', line).strip()
        if s and not s.lower().startswith('refrain'):
            return s[:60]
    return ''

cis_tunes = load('cis_tunes.json', {})
named = cis_tunes.get('named', {}); unnamed = cis_tunes.get('unnamed', {})
def tune_of(n):
    s=str(n)
    if s in named:   return named[s], 'named'
    if s in unnamed: return unnamed[s], 'bracket'
    return '', 'none'

# existing audio library tune tokens
mf = open('audio_manifest.js').read() if os.path.exists('audio_manifest.js') else ''
def norm(x): return re.sub(r'[^A-Z0-9]','',x.upper())
have_tokens={}
for key in re.findall(r"'([^']+)'", mf):
    have_tokens[norm(key)] = key
    if '-' in key:
        have_tokens[norm(key.rsplit('-',1)[1])] = key

rows=[]
for n in MARKED:
    title=title_by.get(n,'')
    fl=first_line(n)
    tune,kind=tune_of(n)
    # try to find this tune already in library
    hit=''
    for cand in (tune, title, fl):
        if cand and norm(cand) in have_tokens:
            hit=have_tokens[norm(cand)]; break
    rows.append((n,title,fl,tune,kind,hit))

with open('marked_resolved.txt','w') as f:
    f.write("MARKED CIS HYMNS — identity & match status (%d)\n"%len(rows))
    f.write("num | title | first line | tune(name/bracket) | already-have?\n")
    f.write("="*90+"\n")
    for n,t,fl,tune,kind,hit in rows:
        f.write(f"{n:>4} | {t[:28]:<28} | {fl[:30]:<30} | {tune[:18]:<18}({kind}) | {('HAVE: '+hit) if hit else '--'}\n")

json.dump([{'n':n,'title':t,'first_line':fl,'tune':tune,'kind':kind,'have':hit}
           for n,t,fl,tune,kind,hit in rows], open('marked_resolved.json','w'), indent=2, ensure_ascii=False)

named_ct=sum(1 for r in rows if r[4]=='named')
brack_ct=sum(1 for r in rows if r[4]=='bracket')
have_ct =sum(1 for r in rows if r[5])
print('marked hymns         :', len(rows))
print('have NAMED tune      :', named_ct)
print('have bracket(1st line):', brack_ct)
print('ALREADY in library    :', have_ct, '(can fill instantly)')
print()
print('--- the instant-fills found ---')
for n,t,fl,tune,kind,hit in rows:
    if hit: print(f'   CIS {n}: {t[:30]} -> {hit}')
print()
print('-> wrote marked_resolved.txt and marked_resolved.json')
