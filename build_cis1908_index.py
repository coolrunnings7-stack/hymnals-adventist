#!/usr/bin/env python3
"""
build_cis1908_index.py  (v3 — robust HTML parser + self-diagnostics)
--------------------------------------------------------------------
Builds the COMPLETE Christ in Song (1908) index from hymnary.org / CSR1908
(F. E. Belden, Review & Herald, 1908 — PUBLIC DOMAIN).

Writes (next to this script):
  cis1908_hymns.json   -> { edition_code, count, hymns:[{number,title}, ...] }
  cis1908_seed.sql     -> optional standalone SQL for a local sanity check

RUN:
    cd ~/Downloads/hymnals-adventist
    python3 build_cis1908_index.py

If a page comes back empty, it prints a short snippet of what hymnary actually
sent — copy that terminal output to Claude and he'll fix it fast.
"""

import gzip
import html
import json
import re
import sys
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser

BASE = "https://hymnary.org/hymnal/CSR1908"
PAGES = range(0, 10)
PAUSE = 4.0
EDITION_CODE = "CHRIST1908"

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/124.0.0.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://hymnary.org/",
}

HYMN_HREF = re.compile(r"/hymn/CSR1908/(\d+)\b")


class HymnParser(HTMLParser):
    """Collects {number: first_line} from every /hymn/CSR1908/<n> link,
    ignoring the /hymn/CSR1908/page/<n> page-scan links."""
    def __init__(self):
        super().__init__()
        self.cur = None
        self.buf = []
        self.found = {}

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href", "") or ""
            m = HYMN_HREF.search(href)
            if m and "/page/" not in href:
                self.cur = int(m.group(1))
                self.buf = []
            else:
                self.cur = None

    def handle_data(self, data):
        if self.cur is not None:
            self.buf.append(data)

    def handle_endtag(self, tag):
        if tag == "a" and self.cur is not None:
            text = html.unescape("".join(self.buf)).strip()
            if text and not text.isdigit():
                n = self.cur
                if n not in self.found or len(text) > len(self.found[n]):
                    self.found[n] = text
            self.cur = None


def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read()
        if (r.headers.get("Content-Encoding") or "").lower() == "gzip":
            raw = gzip.decompress(raw)
    return raw.decode("utf-8", "replace")


def parse_page(text):
    p = HymnParser()
    p.feed(text)
    return p.found


def diagnose(text):
    print("\n  --- DIAGNOSTIC (copy this to Claude) ---")
    print(f"  page length: {len(text)} chars")
    print(f"  contains 'CSR1908': {text.count('CSR1908')} times")
    print(f"  contains '/hymn/CSR1908/': {text.count('/hymn/CSR1908/')} times")
    idx = text.find("/hymn/CSR1908/")
    if idx == -1:
        idx = text.lower().find("hymn")
    start = max(0, idx - 120)
    snippet = text[start:start + 500] if idx >= 0 else text[:500]
    snippet = " ".join(snippet.split())  # collapse whitespace for readability
    print("  snippet:")
    print("  " + snippet)
    print("  --- end diagnostic ---\n")


def sql_str(s):
    return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"


def build_seed(hymns):
    ED = f"(SELECT id FROM hymnal_editions WHERE code='{EDITION_CODE}' LIMIT 1)"
    out = [
        "-- Christ in Song (1908) optional standalone SQL (local sanity check only).",
        "PRAGMA foreign_keys=ON;",
        "BEGIN TRANSACTION;",
        "INSERT OR IGNORE INTO hymnal_editions (code,title,year_published,publisher,total_hymns,is_primary)",
        f"  VALUES ('{EDITION_CODE}','Christ in Song',1908,'Review & Herald',{len(hymns)},0);",
    ]
    for h in hymns:
        t = sql_str(h["title"])
        out.append("INSERT INTO hymns_master (canonical_title,first_line,copyright_status,notes) "
                   f"VALUES ({t},{t},'public_domain',{sql_str('CSR1908 #%d' % h['number'])});")
        out.append("INSERT OR IGNORE INTO hymnal_entries (hymn_id,edition_id,hymnal_number,title_in_edition,first_line) "
                   f"VALUES (last_insert_rowid(),{ED},{h['number']},{t},{t});")
    out.append("COMMIT;")
    return "\n".join(out)


def main():
    all_hymns = {}
    for p in PAGES:
        url = BASE if p == 0 else f"{BASE}?page={p}"
        print(f"  fetching page {p+1}/10 ... ", end="", flush=True)
        try:
            text = fetch(url)
        except Exception as e:
            print(f"FAILED ({e})")
            sys.exit(1)
        page = parse_page(text)
        if not page:
            print("0 hymns")
            diagnose(text)
            print("  Stopping so you can send Claude the diagnostic above.")
            sys.exit(1)
        all_hymns.update(page)
        print(f"{len(page)} hymns")
        if p != PAGES[-1]:
            time.sleep(PAUSE)

    hymns = [{"number": n, "title": all_hymns[n]} for n in sorted(all_hymns)]
    with open("cis1908_hymns.json", "w", encoding="utf-8") as f:
        json.dump({"edition_code": EDITION_CODE, "count": len(hymns), "hymns": hymns},
                  f, ensure_ascii=False, indent=2)
    with open("cis1908_seed.sql", "w", encoding="utf-8") as f:
        f.write(build_seed(hymns))

    print()
    print(f"  DONE — {len(hymns)} hymns written.")
    if hymns[:3]:
        print("  sample:", " | ".join(f"{h['number']}={h['title']}" for h in hymns[:3]))
    if len(hymns) < 940:
        print("  WARNING: expected ~951.")
    print("  Wrote: cis1908_hymns.json  (this feeds the app)")


if __name__ == "__main__":
    print("Building Christ in Song (1908) index from hymnary.org ...")
    main()
