import re

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", encoding="utf-8") as f:
    content = f.read()

# count items with popularBrands
matches = re.findall(r"id:\s*['\"]([^'\"]+)['\"].*?name:\s*['\"]([^'\"]+)['\"].*?popularBrands:\s*(\[[^\]]*\])", content, re.DOTALL)
print(f"Total matching items with popularBrands in agrochemicalsData.ts: {len(matches)}")
for m in matches[:5]:
    print(f"ID: {m[0]}, Name: {m[1]}, Brands: {m[2][:80]}")
