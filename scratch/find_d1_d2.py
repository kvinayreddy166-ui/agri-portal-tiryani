import re

with open("scratch/soil_card_kau/Soil test.htm", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

for m in re.finditer(r"D[12]", html):
    start = max(0, m.start() - 100)
    end = min(len(html), m.end() + 200)
    print(html[start:end])
    print("="*40)
