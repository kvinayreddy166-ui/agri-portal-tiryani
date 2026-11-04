import subprocess

cmd = ['git', 'diff', '0978b545', 'HEAD', '--', 'project/src/features/agrochemicals/pages/AgrochemicalDatabase.tsx']
res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')

with open('scratch/agro_diff_current.patch', 'w', encoding='utf-8') as f:
    f.write(res.stdout)

print("Saved patch of AgrochemicalDatabase.tsx")
