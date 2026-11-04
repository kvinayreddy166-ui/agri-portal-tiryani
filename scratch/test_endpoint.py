import urllib.request

try:
    resp = urllib.request.urlopen("http://localhost:5173/officer-toolkit/soil-health-meter")
    print("Status:", resp.status)
    content = resp.read(500)
    print("Preview:", content[:100])
except Exception as e:
    print("Error:", e)
