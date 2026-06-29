#!/usr/bin/env python3
# Builds a clean, readable checklist of all silent CIS hymns for the user to mark.
# Outputs both a .txt (print/mark on paper) and a .html (tap to mark on screen).
import json, os, sys
if not os.path.exists('cis_real_gaps.json'):
    print('run cis_gaps_real.py first'); sys.exit(1)
g=json.load(open('cis_real_gaps.json'))
missing=g['missing']  # {num: title}
nums=sorted(int(n) for n in missing)

# TXT version: simple, with a [ ] box, 3-digit number, title
with open('cis_silent_checklist.txt','w') as f:
    f.write("CIS 1908 — SILENT HYMNS CHECKLIST  (%d hymns need music)\n" % len(nums))
    f.write("Mark an X in [ ] for the hymns you most want music for.\n")
    f.write("="*64+"\n")
    for n in nums:
        f.write(f"[ ] {n:>4}  {missing[str(n)]}\n")

# HTML version: tappable checkboxes, shows a live count, lets you copy the marked list
rows="".join(
    f'<label class="row"><input type="checkbox" data-n="{n}"> '
    f'<span class="num">{n}</span> <span class="ttl">{missing[str(n)].replace("&","&amp;").replace("<","&lt;")}</span></label>\n'
    for n in nums)
html=f"""<!doctype html><meta charset=utf-8>
<title>CIS Silent Hymns — mark the ones you want</title>
<style>
 body{{font-family:Georgia,serif;max-width:760px;margin:24px auto;padding:0 16px;color:#241a10;background:#f7f1e6}}
 h1{{font-size:20px}} .bar{{position:sticky;top:0;background:#f7f1e6;padding:10px 0;border-bottom:2px solid #b9974a}}
 .row{{display:flex;gap:10px;align-items:baseline;padding:5px 6px;border-bottom:1px solid #e3d8c2;cursor:pointer}}
 .row:hover{{background:#efe6d3}} .num{{width:46px;text-align:right;font-weight:bold;color:#6b531c}}
 input{{transform:scale(1.4);margin-right:4px}} button{{font-size:15px;padding:8px 14px;background:#6b531c;color:#fff;border:none;border-radius:6px;cursor:pointer}}
 #out{{width:100%;height:120px;margin-top:10px;font-family:monospace}}
</style>
<h1>Christ in Song (1908) — {len(nums)} hymns still need music</h1>
<div class=bar><b>Marked: <span id=c>0</span></b> &nbsp;
 <button onclick="cp()">Copy marked numbers</button>
 <span style="font-size:13px;color:#555">tap a row to mark it</span></div>
<div id=list>{rows}</div>
<textarea id=out placeholder="Your marked hymn numbers appear here after you click Copy"></textarea>
<script>
 const boxes=[...document.querySelectorAll('input')];
 function upd(){{document.getElementById('c').textContent=boxes.filter(b=>b.checked).length}}
 boxes.forEach(b=>b.addEventListener('change',upd));
 function cp(){{const m=boxes.filter(b=>b.checked).map(b=>b.dataset.n);
  document.getElementById('out').value=m.join(', ');
  navigator.clipboard&&navigator.clipboard.writeText(m.join(', '));}}
</script>
"""
open('cis_silent_checklist.html','w').write(html)
print('hymns listed   :', len(nums))
print('wrote cis_silent_checklist.txt   (print & mark on paper)')
print('wrote cis_silent_checklist.html  (tap to mark on screen, then Copy)')
