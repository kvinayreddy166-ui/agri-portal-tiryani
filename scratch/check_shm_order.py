import re

with open("project/src/features/calculators/pages/SoilHealthMeter.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("File total lines:", len(lines))
for i, line in enumerate(lines):
    if any(k in line for k in ["Quick Demo Presets", "Tab Selector", "Visual Speedometer", "TAB 1:", "TAB 2:", "TAB 3:", "Printable Footer"]):
        print(f"Line {i+1}: {line.strip()}")
