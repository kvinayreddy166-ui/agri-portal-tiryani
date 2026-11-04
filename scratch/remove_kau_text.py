with open("project/src/features/calculators/pages/SoilHealthMeter.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Line 895: Remove (KAU & Soil Health Card)
text = text.replace(
    "t('Secondary & Micronutrients (KAU & Soil Health Card)', 'ద్వితీయ మరియు సూక్ష్మ పోషకాలు')",
    "t('Secondary & Micronutrients', 'ద్వితీయ మరియు సూక్ష్మ పోషకాలు')"
)

# 2. Header subtitle: Remove KAU
text = text.replace(
    "'Comprehensive soil health index based on KAU & National Soil Health Card parameters.',\n                          'కేరళ వ్యవసాయ విశ్వవిద్యాలయం (KAU) & జాతీయ సాయిల్ హెల్త్ కార్డ్ ప్రమాణాల ఆధారిత సమగ్ర మీటర్.'",
    "'Comprehensive soil health index based on standard Soil Health Card parameters.',\n                          'సాయిల్ హెల్త్ కార్డ్ ప్రమాణాల ఆధారిత సమగ్ర మట్టి ఆరోగ్య మీటర్.'"
)

# 3. Footer: Remove KAU
text = text.replace(
    "<p>Parameters aligned with ICAR & Kerala Agricultural University (KAU) Farm Extension Standards.</p>",
    "<p>Parameters aligned with standard Soil Health Card & Agricultural Extension benchmarks.</p>"
)

# 4. Comments mentioning KAU
text = text.replace("Secondary & Micronutrients Section (KAU Specific)", "Secondary & Micronutrients Section")

with open("project/src/features/calculators/pages/SoilHealthMeter.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated SoilHealthMeter.tsx successfully!")
