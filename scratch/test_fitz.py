import fitz

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793630378899_d9c9ec0c.pdf'
doc = fitz.open(pdf_path)
print('PDF pages:', len(doc))
for i in range(min(3, len(doc))):
    print(f'--- Page {i+1} ---')
    print(doc[i].get_text()[:400])
