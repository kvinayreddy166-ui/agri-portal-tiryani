import os, re, sys
sys.stdout.reconfigure(encoding='utf-8')

calc_dir = 'project/src/features/calculators/pages'
for f in os.listdir(calc_dir):
    if f.endswith('.tsx'):
        path = os.path.join(calc_dir, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        matches = re.finditer(r'<button[^>]*onClick=\{([^}]+)\}[^>]*>', content)
        for m in matches:
            fn = m.group(1)
            if any(term in fn.lower() for term in ['reset', 'clear']):
                full_tag = m.group(0)
                # find line number
                line_no = content[:m.start()].count('\n') + 1
                print(f"{f}:{line_no} -> fn={fn}")
                print(f"   tag: {full_tag}")
