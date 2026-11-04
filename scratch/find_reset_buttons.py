import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

calc_dir = 'project/src/features/calculators/pages'
for file in os.listdir(calc_dir):
    if file.endswith('.tsx'):
        path = os.path.join(calc_dir, file)
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        for idx, line in enumerate(lines):
            if any(term in line.lower() for term in ['reset', 'clear', 'rotateccw', 'rotate-ccw']) and ('<button' in line or 'reset' in line.lower()):
                # print surrounding lines if it looks like a button
                if '<button' in line or (idx > 0 and '<button' in lines[idx-1]) or (idx > 1 and '<button' in lines[idx-2]):
                    print(f"{file}:{idx+1}: {line.strip()}")
            elif any(term in line.lower() for term in ['standard crop spacing presets']):
                print(f"{file}:{idx+1} [TEXT]: {line.strip()}")
