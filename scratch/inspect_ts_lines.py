import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(min(50, len(lines))):
    print(lines[i], end="")
