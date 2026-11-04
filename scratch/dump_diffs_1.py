import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

for f in ['project/src/app/Layout.tsx', 'project/src/shared/components/ui/ToolkitPageHeader.tsx', 'project/src/features/officers-toolkit/pages/OfficersToolkit.tsx', 'project/src/app/App.tsx', 'project/index.html', 'project/package.json']:
    cmd = ["git", "diff", "0978b545", "6d521bf0", "--", f]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    print(f"================ {f} ================")
    print(res.stdout)
