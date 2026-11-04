import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

cmd = ["git", "diff", "0978b545", "6d521bf0", "--", "project/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
lines = res.stdout.splitlines()

for i in range(0, len(lines), 50):
    print("\n".join(lines[i:i+50]))
    input_str = "--- chunk ---"
