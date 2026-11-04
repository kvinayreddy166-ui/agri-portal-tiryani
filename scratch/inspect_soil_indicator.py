with open("scratch/soil_card_kau/Soil indicator.htm", "r", encoding="utf-8", errors="ignore") as f:
    indicator_content = f.read()

print("="*40, "SOIL INDICATOR.HTM", "="*40)
print(indicator_content)
