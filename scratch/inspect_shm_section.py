import re

with open("scratch/soil_health_meter.html", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

for match in re.finditer(r"Soil Health Meter", html, re.I):
    start = max(0, match.start() - 300)
    end = min(len(html), match.end() + 1000)
    print("--- MATCH AT", match.start(), "---")
    print(html[start:end])
    print("=" * 60)
