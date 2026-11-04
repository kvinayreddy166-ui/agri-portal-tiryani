import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

for f in ['project/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx', 'project/src/features/officers-toolkit/pages/ActsAndOrders.tsx']:
    cmd = ["git", "diff", "0978b545", "6d521bf0", "--", f]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    print(f"================ {f} ================")
    lines = res.stdout.splitlines()
    print("\n".join(lines[:100]))
    print(f"... ({len(lines)} total diff lines) ...")
    print("\n".join(lines[-50:]))
