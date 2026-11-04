import os, re

patterns = [
    r'18\s*Forms',
    r'21\s*Forms',
    r'Schedules\s*I[–-]IV',
    r'Forms\s*I\s*to\s*XXI',
    r'Forms\s*A\s*to\s*P',
]

for root, dirs, files in os.walk('project/src'):
    for file in files:
        if file.endswith(('.ts', '.tsx', '.json', '.md')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for p in patterns:
                    matches = re.findall(p, content, re.IGNORECASE)
                    if matches:
                        print(f"Pattern '{p}' matched in {path}: {matches}")
