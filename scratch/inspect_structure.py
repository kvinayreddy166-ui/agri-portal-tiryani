import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

items = re.findall(r'["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"],\s*\n\s*["\']?name["\']?\s*:\s*[\'"]([^\'"]+)[\'"],\s*\n\s*["\']?nameTe["\']?\s*:\s*[\'"]([^\'"]+)[\'"],\s*\n\s*["\']?category["\']?\s*:\s*[\'"]([^\'"]+)[\'"]', text)

insecticides = [it for it in items if it[3] == 'insecticide']
print(f"Total insecticides: {len(insecticides)}")
print("First 5 insecticides:", [(i[0], i[1]) for i in insecticides[:5]])
print("Last 5 insecticides:", [(i[0], i[1]) for i in insecticides[-5:]])
