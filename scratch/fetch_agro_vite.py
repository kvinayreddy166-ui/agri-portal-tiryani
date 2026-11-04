import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

try:
    req = urllib.request.Request('http://localhost:5173/src/features/agrochemicals/data/agrochemicalsData.ts')
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
        print("Status:", resp.status)
        print("Length:", len(content))
        print("First 200 bytes:")
        print(content[:200].decode('utf-8', errors='replace'))
        print("Last 200 bytes:")
        print(content[-200:].decode('utf-8', errors='replace'))
except Exception as e:
    print("Error fetching:", e)
