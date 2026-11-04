import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/soil_health_meter.html", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

print(f"File size: {len(html)} bytes")

# Extract title
m = re.search(r"<title>(.*?)</title>", html, re.I | re.S)
print("Title:", m.group(1).strip() if m else "No title")

# Look for wpProQuiz or quiz data
wp_matches = re.findall(r"wpProQuiz[a-zA-Z0-9_]*", html)
print("wpProQuiz matches:", set(wp_matches))

# Look for quiz scripts or config
scripts = re.findall(r"<script[^>]*>(.*?)</script>", html, re.I | re.S)
print(f"Total script tags: {len(scripts)}")
for i, s in enumerate(scripts):
    if any(k in s.lower() for k in ["proquiz", "wpproquiz", "globalquiz", "json"]):
        print(f"\n--- Script {i} ---")
        print(s[:1000])

# Search for any form or table
forms = re.findall(r"(<form[^>]*>.*?</form>)", html, re.I | re.S)
print(f"Total forms: {len(forms)}")
for f in forms:
    print(f[:500])

# Extract the main content container
main_content = ""
for tag in ["entry-content", "post-content", "content", "main"]:
    cm = re.search(rf'class="[^"]*{tag}[^"]*"[^>]*>(.*?)</div>', html, re.I | re.S)
    if cm:
        print(f"Found container {tag}: length {len(cm.group(1))}")
        main_content = cm.group(1)
        break

if not main_content:
    # Just grab body
    bm = re.search(r"<body[^>]*>(.*?)</body>", html, re.I | re.S)
    if bm:
        main_content = bm.group(1)

# Strip tags and show sample lines
lines = [re.sub(r"<[^>]+>", " ", l).strip() for l in main_content.splitlines()]
lines = [l for l in lines if len(l) > 5]
print("\n--- Content Sample (First 40 text lines) ---")
for l in lines[:40]:
    print(l)
