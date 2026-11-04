import urllib.request
import re

req = urllib.request.Request(
    'https://farmextensionmanager.com/soil-health-meter',
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

# Save to scratch to analyze
with open('scratch/soil_health_meter.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Saved HTML, length:", len(html))

# Look for script tags or angular / react / vue / blade content
scripts = re.findall(r'<script[^>]*src=["\'](.*?)["\']', html)
print("Scripts:", scripts)

# Search for text containing 'soil' or 'health' or 'meter'
body_text = re.sub(r'<[^>]+>', ' ', html)
body_words = [w for w in body_text.split() if len(w) > 3]
print("First 100 words in body:")
print(" ".join(body_words[:100]))
