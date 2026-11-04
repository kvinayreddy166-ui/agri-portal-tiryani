import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

cmd = ["git", "diff", "-w", "0978b545", "6d521bf0", "--", "project/src/features/officers-toolkit/pages/ActsAndOrders.tsx"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
lines = res.stdout.splitlines()
non_style_lines = [l for l in lines if l.startswith(('+', '-')) and not l.startswith(('+++', '---')) and 'className' not in l and 'class' not in l and not any(tag in l for tag in ['<p', '<h1', '<h2', '<h3', '<span', '<div', '<button', '<header', 't(', 'tone', 'variant'])]
print(f"Total diff lines: {len(lines)}, potentially non-style diff lines: {len(non_style_lines)}")
for l in non_style_lines[:30]:
    print("  ", l)
