import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_pos = text.find('=\n[')
if start_pos == -1:
    start_pos = text.find('= [')
start_pos = text.find('[', start_pos)
end_pos = text.rfind(']') + 1

items = json.loads(text[start_pos:end_pos])

def parse_num_range(s):
    # Strip % and preceding digits
    s_clean = re.sub(r'\d+(?:\.\d+)?\s*%', '', s)
    s_clean = s_clean.replace('–', '-').replace('—', '-')
    nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', s_clean)]
    return nums

def format_rate(val):
    if val >= 10:
        return f"{round(val)}"
    elif val >= 1:
        r = round(val, 1)
        return f"{int(r)}" if r.is_integer() else f"{r}"
    elif val >= 0.1:
        r = round(val, 2)
        return f"{r}"
    else:
        return f"{round(val, 3)}"

for item in items:
    old_l = item.get('dosagePerLitre', '')
    if 'ml / gm per Litre water' not in old_l and old_l != '':
        continue
        
    claims = item.get('cibrcApprovedClaims', [])
    if not claims:
        continue
        
    upper_name = item['name'].upper()
    c = claims[0]
    fd = str(c.get('formulationDosePerHa', '')).strip()
    wv = str(c.get('dilutionWaterPerHa', '')).strip()
    
    fd_nums = parse_num_range(fd)
    wv_nums = parse_num_range(wv)
    
    unit = 'ml' if any(x in upper_name for x in ['EC', 'SC', 'SL', 'OD', 'CS', 'FS', 'EW', 'SE', 'DC', 'ULV', 'ME']) else 'g'
    
    if any(x in upper_name for x in ['GR', 'CG', 'DP', 'DUST', 'BAIT', 'TAB', 'TABLET', 'GEL', 'RB', 'CB', 'FS', 'WS', 'DS']):
        continue
        
    if fd_nums and wv_nums and wv_nums[0] > 0 and fd_nums[0] > 0:
        w_min = wv_nums[0]
        w_max = wv_nums[-1] if len(wv_nums) > 1 else w_min
        f_min = fd_nums[0]
        f_max = fd_nums[-1] if len(fd_nums) > 1 else f_min
        
        # Invert if range was extracted in reverse
        if f_min > f_max: f_min, f_max = f_max, f_min
        if w_min > w_max: w_min, w_max = w_max, w_min
        
        r_min = f_min / w_max
        r_max = f_max / w_min
        p_min = r_min * 15.0
        p_max = r_max * 15.0
        
        print(f"[{item['id']}] {item['name']}:")
        print(f"   FD: '{fd}' (parsed: {fd_nums}) | WV: '{wv}' (parsed: {wv_nums})")
        print(f"   Rate/L: {r_min:.2f} - {r_max:.2f} {unit} | Pump: {p_min:.1f} - {p_max:.1f} {unit}")
