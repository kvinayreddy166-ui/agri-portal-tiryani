import fitz
import json

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793630378899_d9c9ec0c.pdf'
doc = fitz.open(pdf_path)

all_rows = []
current_crop = ""
current_insecticide = ""

for p_num, page in enumerate(doc):
    tabs = page.find_tables()
    if not tabs.tables:
        print(f"Page {p_num+1} has no tables!")
        continue
    for tab in tabs.tables:
        rows = tab.extract()
        for r_idx, row in enumerate(rows):
            # Check if this is header row
            if r_idx == 0 and ('Crop' in str(row[0]) or 'Insecticide' in str(row[1])):
                continue
            
            # Clean values
            cleaned = [c.strip() if c else "" for c in row]
            if len(cleaned) < 6:
                continue
            
            crop_val, ins_val, pest_val, ai_val, form_val, spray_val = cleaned[:6]
            
            # Update current crop if specified
            if crop_val:
                current_crop = " ".join(crop_val.split())
            if ins_val:
                current_insecticide = " ".join(ins_val.split())
            
            pest_val = " ".join(pest_val.split())
            ai_val = " ".join(ai_val.split())
            form_val = " ".join(form_val.split())
            spray_val = " ".join(spray_val.split())
            
            if not pest_val and not form_val:
                continue
                
            all_rows.append({
                "page": p_num + 1,
                "crop": current_crop,
                "insecticide": current_insecticide,
                "pest": pest_val,
                "aiDose": ai_val,
                "formulationDose": form_val,
                "sprayFluid": spray_val
            })

print(f"Total extracted rows across 28 pages: {len(all_rows)}")
crops = set(r["crop"] for r in all_rows)
print(f"Unique crops ({len(crops)}): {sorted(list(crops))}")
insecticides = set(r["insecticide"] for r in all_rows)
print(f"Unique insecticides ({len(insecticides)}): {len(insecticides)}")

with open('scratch/extracted_crop_pest_insecticides.json', 'w', encoding='utf-8') as f:
    json.dump(all_rows, f, indent=2, ensure_ascii=False)
