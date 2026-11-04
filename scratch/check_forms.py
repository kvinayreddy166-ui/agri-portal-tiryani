import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/sampling-hub/data/fertilizerForms.ts', 'r', encoding='utf-8') as f:
    text = f.read()

ids = re.findall(r"id:\s*['\"]([^'\"]+)['\"]", text)
print("Fertilizer form IDs count:", len(ids))
for i in ids:
    print(" -", i)

with open('project/src/features/officers-toolkit/data/insecticideActData.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

ins_forms = []
in_forms = False
for line in lines:
    if 'export const insecticideForms' in line:
        in_forms = True
    if in_forms:
        if "id: '" in line or 'id: "' in line:
            ins_forms.append(line.strip())

print("Insecticide forms count:", len(ins_forms))
for i in ins_forms:
    print(" -", i)
