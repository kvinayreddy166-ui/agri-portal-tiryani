import os, re

search_dir = 'project/src/features/officers-toolkit'
patterns = [
    r'18\s*Forms',
    r'21\s*Forms',
    r'Forms\s*I\s*to\s*XXI',
    r'Schedules\s*I[–-]IV',
    r'Forms\s*A\s*to\s*P',
    r'Forms\s*I\s*to\s*XVIII',
    r'Schedules\s*I[–-]VIII',
    r'28\s*Forms'
]

for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            p = os.path.join(root, file)
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for pat in patterns:
                    m = re.findall(pat, content, re.IGNORECASE)
                    if m:
                        print(f"File {p} matched {pat}: {m}")
