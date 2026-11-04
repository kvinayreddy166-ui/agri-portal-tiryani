import subprocess
import sys
sys.stdout.reconfigure(encoding='utf-8')

cmd = ["git", "diff", "0978b545", "6d521bf0", "--", "project/src/app/Layout.tsx"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print("=== Layout.tsx ===")
print(res.stdout)

cmd = ["git", "diff", "0978b545", "6d521bf0", "--", "project/src/features/calculators/pages/FertilizerCalculator.tsx"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print("=== FertilizerCalculator.tsx ===")
print(res.stdout[:1500])

cmd = ["git", "diff", "0978b545", "6d521bf0", "--", "project/src/features/officers-toolkit/pages/InspectionEnforcementHub.tsx"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print("=== InspectionEnforcementHub.tsx ===")
print(res.stdout[:1500])

cmd = ["git", "diff", "0978b545", "6d521bf0", "--", "project/src/features/officers-toolkit/pages/OfficersToolkit.tsx"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print("=== OfficersToolkit.tsx ===")
print(res.stdout)

cmd = ["git", "diff", "0978b545", "6d521bf0", "--", "project/src/features/tour-diary/pages/TourDiary.tsx"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print("=== TourDiary.tsx ===")
print(res.stdout[:1500])

cmd = ["git", "diff", "0978b545", "6d521bf0", "--", "project/src/shared/components/ui/ToolkitPageHeader.tsx"]
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print("=== ToolkitPageHeader.tsx ===")
print(res.stdout)
