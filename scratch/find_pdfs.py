import os, glob

gemini_dir = r'C:\Users\kvina\.gemini'
pdfs = glob.glob(os.path.join(gemini_dir, '**', '*.pdf'), recursive=True)
for p in pdfs:
    print(p, os.path.getsize(p))
