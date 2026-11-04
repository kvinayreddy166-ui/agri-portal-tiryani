import urllib.request

urls = [
    "http://localhost:5173/src/features/calculators/pages/SoilHealthMeter.tsx",
    "http://localhost:5173/src/features/calculators/pages/FarmCalculators.tsx",
    "http://localhost:5173/src/features/calculators/engine/soilHealthEngine.ts",
    "http://localhost:5173/src/app/router/paths.ts",
    "http://localhost:5173/src/app/router/PageSwitch.tsx",
    "http://localhost:5173/src/app/Layout.tsx",
]

for url in urls:
    try:
        resp = urllib.request.urlopen(url)
        content = resp.read()
        print(f"OK ({resp.status}): {url} - {len(content)} bytes")
    except Exception as e:
        print(f"FAILED: {url} - {e}")
