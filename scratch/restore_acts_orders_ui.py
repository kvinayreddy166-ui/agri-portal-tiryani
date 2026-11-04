import subprocess

# 1. Checkout ActsAndOrders.tsx from 0978b545
subprocess.run(['git', 'checkout', '0978b545', '--', 'project/src/features/officers-toolkit/pages/ActsAndOrders.tsx'], check=True)

# 2. Read ActsAndOrders.tsx
path = 'project/src/features/officers-toolkit/pages/ActsAndOrders.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content_norm = content.replace('\r\n', '\n')

old_fco = """    tags: ['38 Clauses', 'Forms A to P', 'Schedules I–IV', 'Seizure & Stop Sale'],
    stats: '38 Clauses • 18 Forms',"""

new_fco = """    tags: ['38 Clauses', '28 Forms', 'Schedules I–VIII', 'Seizure & Stop Sale'],
    stats: '38 Clauses • 28 Forms • VIII Schedules',"""

old_ins = """    tags: ['Sections 1–38', 'Rules 1–46', 'Forms I to XXI', 'Analyst & Enforcement'],
    stats: '38 Sections • 46 Rules • 21 Forms',"""

new_ins = """    tags: ['Sections 1–38', 'Rules 1–46', 'Forms I to XVIII', 'Analyst & Enforcement'],
    stats: '38 Sections • 46 Rules • 18 Forms',"""

assert old_fco in content_norm, "old_fco not found"
assert old_ins in content_norm, "old_ins not found"

content_norm = content_norm.replace(old_fco, new_fco, 1)
content_norm = content_norm.replace(old_ins, new_ins, 1)

with open(path, 'wb') as f:
    f.write(content_norm.replace('\n', '\r\n').encode('utf-8'))

print("ActsAndOrders.tsx UI successfully restored from 0978b545 while preserving 28 forms and VIII schedules!")
