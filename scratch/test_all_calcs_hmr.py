import urllib.request

urls = [
    "http://localhost:5173/src/features/calculators/pages/PesticideCalculator.tsx",
    "http://localhost:5173/src/features/calculators/pages/PlantPopulationCalculator.tsx",
    "http://localhost:5173/src/features/calculators/pages/SeedRateCalculator.tsx",
    "http://localhost:5173/src/features/calculators/pages/IrrigationCalculator.tsx",
    "http://localhost:5173/src/features/calculators/pages/ProfitabilityCalculator.tsx",
    "http://localhost:5173/src/features/calculators/pages/SoilHealthMeter.tsx",
    "http://localhost:5173/src/features/calculators/pages/AcreageCalculator.tsx",
]

for url in urls:
    try:
        resp = urllib.request.urlopen(url)
        content = resp.read()
        print(f"OK ({resp.status}): {url} - {len(content)} bytes")
    except Exception as e:
        print(f"FAILED: {url} - {e}")
