import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Let's inspect git diff 0978b545 HEAD -- project/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx
cmd = ['git', 'diff', '0978b545', 'HEAD', '--', 'project/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx']
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
lines = res.stdout.splitlines()

for l in lines:
    if l.startswith(('+', '-')) and not l.startswith(('+++', '---')):
        print(l)
