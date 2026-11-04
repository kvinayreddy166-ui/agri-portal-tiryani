import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

cmd = ['git', 'diff', '0978b545', 'HEAD', '--', 'project/src/features/officers-toolkit/pages/ActsAndOrders.tsx']
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

lines = res.stdout.splitlines()
print(f"Total diff lines in ActsAndOrders.tsx: {len(lines)}")
for l in lines:
    if l.startswith(('+', '-')) and not l.startswith(('+++', '---')):
        print(l)
