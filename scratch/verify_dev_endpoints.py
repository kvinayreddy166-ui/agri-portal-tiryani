import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

urls = [
    'http://localhost:5173/',
    'http://localhost:5173/src/features/agrochemicals/data/agrochemicalsData.ts',
    'http://localhost:5173/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx'
]

for url in urls:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
            print(f"URL: {url} -> Status: {resp.status}, Size: {len(data)} bytes")
            if 'agrochemicalsData.ts' in url:
                has_export = b'export const AGROCHEMICALS_DATA' in data
                print(f"   Contains 'export const AGROCHEMICALS_DATA': {has_export}")
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")
