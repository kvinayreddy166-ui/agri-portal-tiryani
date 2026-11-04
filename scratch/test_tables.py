import fitz

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793630378899_d9c9ec0c.pdf'
doc = fitz.open(pdf_path)

page0 = doc[0]
tabs = page0.find_tables()
print('Found tables on page 1:', len(tabs.tables))
if tabs.tables:
    tab = tabs.tables[0]
    df = tab.extract()
    print('Header/first rows:')
    for row in df[:5]:
        print(row)
