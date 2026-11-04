import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/agro_diff_current.patch', 'r', encoding='utf-8') as f:
    text = f.read()

hunks = text.split('@@')
for idx in range(4, len(hunks)//2):
    h = hunks[1 + 2*idx]
    content = hunks[2 + 2*idx]
    print(f"=== Hunk {idx+1} ({h.strip()}) ===")
    print("\n".join(content.splitlines()[:25]))
