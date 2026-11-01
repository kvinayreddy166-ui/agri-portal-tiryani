import fitz
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

major_doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf')

def extract_section_text(formulation_query):
    matched_sections = []
    # search across all pages
    for p_idx in range(len(major_doc)):
        page = major_doc[p_idx]
        text = page.get_text()
        if formulation_query.lower() in text.lower():
            matched_sections.append((p_idx + 1, text))
    return matched_sections

# Test with a few items:
test_queries = ['Acephate 97% DF', 'Clothianidin 0.5% GR', 'Chlorantraniliprole 0.53%', 'Cyantraniliprole 10.26%', 'Chlorpyrifos 10% Granules']
for q in test_queries:
    res = extract_section_text(q)
    print(f'Query: {q} -> Found on pages: {[r[0] for r in res]}')
    if res:
        print(f'  Snippet from page {res[0][0]}:')
        lines = res[0][1].split('\n')
        for l in lines[:8]:
            print('   ', l.strip())
