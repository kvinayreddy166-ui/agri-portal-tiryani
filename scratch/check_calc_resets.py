import re

files = [
    "project/src/features/calculators/pages/PesticideCalculator.tsx",
    "project/src/features/calculators/pages/IrrigationCalculator.tsx",
    "project/src/features/calculators/pages/PlantPopulationCalculator.tsx",
    "project/src/features/calculators/pages/SeedRateCalculator.tsx",
    "project/src/features/calculators/pages/ProfitabilityCalculator.tsx",
]

for f in files:
    with open(f, "r", encoding="utf-8") as fp:
        content = fp.read()
    print("="*30, f, "="*30)
    # find reset functions
    resets = re.findall(r'(?:const|function)\s+(?:reset|handleReset)[^{]*\{[^}]*\}', content)
    for r in resets:
        print("Function:", r)
    # find reset button in JSX
    btn_matches = re.finditer(r'<button[^>]*onClick=\{(?:reset|handleReset)\}[^>]*>.*?</button>', content, re.S)
    for b in btn_matches:
        print("Button JSX:\n", b.group(0)[:300])
