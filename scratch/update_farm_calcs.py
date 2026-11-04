with open("project/src/features/calculators/pages/FarmCalculators.tsx", "r", encoding="utf-8") as f:
    content = f.read()

target = "    title: 'Seed Rate Calculator',"
new_item = """  {
    title: 'Soil Health Meter',
    titleTe: 'మట్టి ఆరోగ్య మీటర్',
    description: 'Assess soil test results & field indicators with instant health scoring and advisory.',
    descriptionTe: 'రసాయన పరీక్ష మరియు క్షేత్ర స్థాయి లక్షణాలతో మట్టి ఆరోగ్య స్కోర్ మరియు సిఫార్సులు పొందండి.',
    path: '/officer-toolkit/soil-health-meter',
    icon: FlaskConical,
    accent: 'from-teal-600 to-emerald-700',
    panel: 'from-teal-100 via-teal-50 to-emerald-100 dark:from-teal-950/40 dark:via-slate-900 dark:to-emerald-950/40',
    border: 'border-teal-300 dark:border-teal-800/60',
    text: 'text-teal-800 dark:text-teal-200',
  },
"""

if "title: 'Soil Health Meter'" in content:
    print("Already present!")
else:
    # insert before or after Seed Rate Calculator
    # find ending of calculatorItems: "];"
    idx = content.find("];\n\nexport function FarmCalculators")
    if idx != -1:
        content = content[:idx] + new_item + content[idx:]
        with open("project/src/features/calculators/pages/FarmCalculators.tsx", "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully updated FarmCalculators.tsx!")
    else:
        print("Could not find insertion index")
