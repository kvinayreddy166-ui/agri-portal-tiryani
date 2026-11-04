import sys
import re

with open("scratch/soil_health_meter.html", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

for match in re.finditer(r"wpProQuiz", html, re.I):
    start = max(0, match.start() - 100)
    end = min(len(html), match.end() + 200)
    print("MATCH:\n", html[start:end], "\n" + "="*40)
