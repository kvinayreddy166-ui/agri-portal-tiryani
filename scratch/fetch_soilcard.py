import urllib.request
import ssl
import sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://farmextensionmanager.com/sitedata/soilcard/soilcard.htm"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
        content = resp.read()
        with open("scratch/soilcard.htm", "wb") as f:
            f.write(content)
        print(f"Successfully downloaded soilcard.htm ({len(content)} bytes)")
except Exception as e:
    print(f"Error: {e}")
