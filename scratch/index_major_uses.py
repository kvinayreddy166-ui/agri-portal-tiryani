import fitz
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

major_doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf')
print(f'Major uses doc page count: {len(major_doc)}')

# Let us build a search index of headers in the 108-page PDF
headers = []
for p in range(len(major_doc)):
    text = major_doc[p].get_text()
    for line in text.split('\n'):
        line_clean = line.strip()
        # Look for headers like "1. Acephate 75% SP" or "10. Cartap Hydrochloride 50 % SP"
        if re.match(r'^\d+[\.\s]+[A-Za-z]', line_clean) and any(w in line_clean for w in ['% ', '%', 'EC', 'SC', 'WP', 'GR', 'SP', 'WG', 'SL', 'OD', 'FS', 'Pi', 'DP', 'Tablet', 'Bait', 'SG', 'CS']):
            headers.append((p, line_clean))

print(f'Found {len(headers)} formulation headers in major uses PDF.')
for h in headers[:15]:
    print(f'  Page {h[0]+1}: {h[1]}')
