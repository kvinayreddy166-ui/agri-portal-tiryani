import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    lines = [f.readline() for _ in range(25)]

for i, l in enumerate(lines):
    print(f"{i+1}: {l.strip()[:100]}")
