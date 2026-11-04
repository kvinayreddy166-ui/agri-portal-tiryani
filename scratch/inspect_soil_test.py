import os

with open("scratch/soil_card_kau/Soil test.htm", "r", encoding="utf-8", errors="ignore") as f:
    soil_test_content = f.read()

print("="*40, "SOIL TEST.HTM", "="*40)
print(soil_test_content[:4000])
print("\n... MIDDLE ...\n")
print(soil_test_content[4000:8000])
print("\n... END ...\n")
print(soil_test_content[8000:])
