with open('scratch/agro_diff_current.patch', 'r', encoding='utf-8') as f:
    text = f.read()

hunks = text.split('@@')
print('Total hunks:', len(hunks))
for idx, h in enumerate(hunks[1::2]):
    content = hunks[2 + 2*idx]
    print(f"Hunk {idx+1} ({h.strip()}):")
    for l in content.splitlines()[:6]:
        print("  ", l)
