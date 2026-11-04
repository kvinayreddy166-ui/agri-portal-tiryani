import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

files = [
    'project/index.html',
    'project/package.json',
    'project/src/app/App.tsx',
    'project/src/app/Layout.tsx',
    'project/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx',
    'project/src/features/agrochemicals/services/agrochemicalService.ts',
    'project/src/features/agrochemicals/types/index.ts',
    'project/src/features/calculators/pages/FertilizerCalculator.tsx',
    'project/src/features/officers-toolkit/pages/ActsAndOrders.tsx',
    'project/src/features/officers-toolkit/pages/InspectionEnforcementHub.tsx',
    'project/src/features/officers-toolkit/pages/OfficersToolkit.tsx',
    'project/src/features/tour-diary/pages/TourDiary.tsx',
    'project/src/shared/components/ui/ToolkitPageHeader.tsx',
]

for f in files:
    cmd = ["git", "diff", "--stat", "0978b545", "6d521bf0", "--", f]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    print(f"=== {f} ===")
    print(res.stdout.strip())
