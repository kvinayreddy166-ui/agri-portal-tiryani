import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

cmd = ["node", "-e", """
const esbuild = require('./project/node_modules/esbuild');
const fs = require('fs');
const code = fs.readFileSync('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'utf8');
try {
    const result = esbuild.transformSync(code, { loader: 'ts' });
    console.log('esbuild transform SUCCESS! Output length:', result.code.length);
} catch (e) {
    console.error('esbuild transform ERROR:', e);
}
"""]

res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
