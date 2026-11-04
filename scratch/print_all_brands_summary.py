from test_brand_parser import pdf_items

print(f"Total items: {len(pdf_items)}")
for it in pdf_items:
    print(f"#{it['num']:<3} {it['technical']:<40} -> {len(it['brands'])} brands: {', '.join(it['brands'][:4])}...")
