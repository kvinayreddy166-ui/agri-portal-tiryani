import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

calc_dir = 'project/src/features/calculators'
for root, dirs, files in os.walk(calc_dir):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            for idx, line in enumerate(lines):
                if any(w in line.lower() for w in ['reset', 'clear']) and 'button' in line.lower():
                    print(f"{os.path.relpath(path, calc_dir)}:{idx+1}: {line.strip()}")
                elif 'rotateccw' in line.lower():
                    print(f"{os.path.relpath(path, calc_dir)}:{idx+1} [ICON]: {line.strip()}")
