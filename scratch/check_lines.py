import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'acephate-25-fenvalerate-3-ec' in line:
        print(f"Acephate found at line {idx+1}")
        for j in range(idx-1, idx+12):
            print(f"  {j+1}: {lines[j].rstrip()}")
    if 'chlorpyrifos-50-cypermethrin-5-ec' in line:
        print(f"Chlorpyrifos found at line {idx+1}")
        for j in range(idx-1, idx+12):
            print(f"  {j+1}: {lines[j].rstrip()}")
