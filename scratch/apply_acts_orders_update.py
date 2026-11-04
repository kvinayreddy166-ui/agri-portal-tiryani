import sys

def update_acts_and_orders():
    path = 'project/src/features/officers-toolkit/pages/ActsAndOrders.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Normalize CRLF
    content_norm = content.replace('\r\n', '\n')

    old_fco = """    tags: ['38 Clauses', 'Forms A to P', 'Schedules I–IV', 'Seizure & Stop Sale'],
    stats: '38 Clauses • 18 Forms',"""

    new_fco = """    tags: ['38 Clauses', '28 Forms', 'Schedules I–VIII', 'Seizure & Stop Sale'],
    stats: '38 Clauses • 28 Forms • VIII Schedules',"""

    old_ins = """    tags: ['Sections 1–38', 'Rules 1–46', 'Forms I to XXI', 'Analyst & Enforcement'],
    stats: '38 Sections • 46 Rules • 21 Forms',"""

    new_ins = """    tags: ['Sections 1–38', 'Rules 1–46', 'Forms I to XVIII', 'Analyst & Enforcement'],
    stats: '38 Sections • 46 Rules • 18 Forms',"""

    assert old_fco in content_norm, "old_fco not found in ActsAndOrders.tsx"
    assert old_ins in content_norm, "old_ins not found in ActsAndOrders.tsx"

    content_norm = content_norm.replace(old_fco, new_fco, 1)
    content_norm = content_norm.replace(old_ins, new_ins, 1)

    with open(path, 'wb') as f:
        f.write(content_norm.replace('\n', '\r\n').encode('utf-8'))
    print("ActsAndOrders.tsx updated!")

def update_fco_explorer():
    path = 'project/src/features/officers-toolkit/components/FcoExplorer.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    content_norm = content.replace('\r\n', '\n')

    old_btn = """            <button
              type="button"
              onClick={() => onOpenSection('forms')}
              className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800"
            >
              27 Forms
            </button>
            <button
              type="button"
              onClick={() => onOpenSection('schedules')}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800"
            >
              8 Schedules
            </button>"""

    new_btn = """            <button
              type="button"
              onClick={() => onOpenSection('forms')}
              className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-800"
            >
              28 Forms
            </button>
            <button
              type="button"
              onClick={() => onOpenSection('schedules')}
              className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-200 transition hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-800"
            >
              VIII Schedules
            </button>"""

    assert old_btn in content_norm, "old_btn not found in FcoExplorer.tsx"
    content_norm = content_norm.replace(old_btn, new_btn, 1)

    with open(path, 'wb') as f:
        f.write(content_norm.replace('\n', '\r\n').encode('utf-8'))
    print("FcoExplorer.tsx updated!")

def update_fco_clauses():
    path = 'project/src/features/officers-toolkit/data/fcoClauses.ts'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    content_norm = content.replace('\r\n', '\n')

    old_stats = "export const fcoDashboardStats = ['9 Cards', 'Clauses 1-39', '7 Schedules', '28 Forms', 'Offline Ready'];"
    new_stats = "export const fcoDashboardStats = ['9 Cards', 'Clauses 1-39', 'VIII Schedules', '28 Forms', 'Offline Ready'];"

    old_sched = "'Current structure recognises 7 schedules including Schedule VI Biostimulants and Schedule VII Nano Fertilisers.'"
    new_sched = "'Current structure recognises VIII schedules including Schedule VI Biostimulants, Schedule VII Nano Fertilisers and Schedule VIII Organic Carbon Enhancers.'"

    assert old_stats in content_norm, "old_stats not found in fcoClauses.ts"
    assert old_sched in content_norm, "old_sched not found in fcoClauses.ts"

    content_norm = content_norm.replace(old_stats, new_stats, 1)
    content_norm = content_norm.replace(old_sched, new_sched, 1)

    with open(path, 'wb') as f:
        f.write(content_norm.replace('\n', '\r\n').encode('utf-8'))
    print("fcoClauses.ts updated!")

def update_fertiliser_legal_charts():
    path = 'project/src/features/officers-toolkit/data/fertiliserLegalCharts.ts'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    content_norm = content.replace('\r\n', '\n')

    old_str = "'Current structure: 7 schedules and 27 forms',"
    new_str = "'Current structure: VIII schedules and 28 forms',"

    assert old_str in content_norm, "old_str not found in fertiliserLegalCharts.ts"
    content_norm = content_norm.replace(old_str, new_str, 1)

    with open(path, 'wb') as f:
        f.write(content_norm.replace('\n', '\r\n').encode('utf-8'))
    print("fertiliserLegalCharts.ts updated!")

if __name__ == '__main__':
    update_acts_and_orders()
    update_fco_explorer()
    update_fco_clauses()
    update_fertiliser_legal_charts()
