import urllib.request
import urllib.parse
import ssl
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base_url = "https://farmextensionmanager.com/sitedata/soilcard/"
files = [
    "Soil health card/Soil test.htm",
    "Soil health card/Soil indicator.htm",
    "Soil health card/blank page.htm"
]

os.makedirs("scratch/soil_card_kau", exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

for f in files:
    full_url = base_url + urllib.parse.quote(f)
    print("Fetching:", full_url)
    try:
        req = urllib.request.Request(full_url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            content = resp.read()
            local_name = os.path.basename(f)
            with open(os.path.join("scratch/soil_card_kau", local_name), "wb") as out:
                out.write(content)
            print(f" Saved {local_name} ({len(content)} bytes)")
    except Exception as e:
        print(f" Error fetching {f}: {e}")
