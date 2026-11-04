import re

with open("scratch/soil_card_kau/Soil test.htm", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

# find all table rows
rows = re.findall(r'<tr>(.*?)</tr>', html, re.S)
for i, r in enumerate(rows):
    # find label
    tds = re.findall(r'<td[^>]*>(.*?)</td>', r, re.S)
    if len(tds) >= 2:
        label = re.sub(r'<[^>]+>', ' ', tds[0]).strip()
        opts = re.findall(r'<option value=([^>]+)>([^<]+)</option>', tds[1])
        if opts:
            print(f"Param: {label}")
            for val, opt in opts:
                print(f"   [{val}] -> {opt}")
