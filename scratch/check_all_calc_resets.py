import sys
sys.stdout.reconfigure(encoding='utf-8')

files = [
    ('PlantPopulationCalculator.tsx', 205, 235),
    ('SeedRateCalculator.tsx', 215, 245),
    ('PesticideCalculator.tsx', 225, 255),
    ('IrrigationCalculator.tsx', 275, 310),
    ('AcreageCalculator.tsx', 195, 225),
    ('FertilizerCalculator.tsx', 1945, 2025),
    ('ProfitabilityCalculator.tsx', 630, 665),
]

for fname, start, end in files:
    path = f'project/src/features/calculators/pages/{fname}'
    print(f"================ {fname} ({start}-{end}) ================")
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    for idx in range(start-1, min(end, len(lines))):
        print(f"{idx+1}: {lines[idx].rstrip()}")
