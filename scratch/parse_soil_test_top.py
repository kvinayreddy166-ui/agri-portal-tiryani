import re

with open("scratch/soil_card_kau/Soil test.htm", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

# Let's see rows before Organic carbon
rows = re.findall(r'<tr>(.*?)</tr>', html, re.S)
for i in range(min(5, len(rows))):
    print(f"--- Row {i} ---")
    print(rows[i])
