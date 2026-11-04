import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

for f in ['project/src/features/officers-toolkit/pages/InspectionEnforcementHub.tsx', 'project/src/features/tour-diary/pages/TourDiary.tsx', 'project/src/features/calculators/pages/FertilizerCalculator.tsx']:
    cmd = ["git", "diff", "-w", "0978b545", "6d521bf0", "--", f]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    print(f"================ {f} ================")
    # Check if there are any non-className or non-style lines
    lines = res.stdout.splitlines()
    non_style_lines = [l for l in lines if l.startswith(('+', '-')) and not l.startswith(('+++', '---')) and 'className' not in l and 'class' not in l and not any(tag in l for tag in ['<p', '<h1', '<h2', '<h3', '<span', '<div', '<button', '<header', 't(', 'tone', 'variant'])]
    print(f"Total diff lines: {len(lines)}, potentially non-style diff lines: {len(non_style_lines)}")
    for l in non_style_lines[:20]:
        print("  ", l)
