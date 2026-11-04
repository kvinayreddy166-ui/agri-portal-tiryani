with open("project/src/app/router/PageSwitch.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Add SoilHealthMeter to imports
if "SoilHealthMeter," not in text:
    text = text.replace("  SeedRateCalculator,\n", "  SeedRateCalculator,\n  SoilHealthMeter,\n")

# 2. Add case in AuthenticatedPageSwitch
if "case 'soil-health-meter':" not in text:
    target = "    case 'profitability-calculator':\n      return <ProfitabilityCalculator />;"
    replacement = "    case 'profitability-calculator':\n      return <ProfitabilityCalculator />;\n    case 'soil-health-meter':\n      return <SoilHealthMeter />;"
    text = text.replace(target, replacement)

# 3. Add case in PublicPageSwitch
if "case 'soil-health-meter':" in text:
    target2 = "    case 'profitability-calculator':\n      return <PublicToolkitPage><ProfitabilityCalculator /></PublicToolkitPage>;"
    replacement2 = "    case 'profitability-calculator':\n      return <PublicToolkitPage><ProfitabilityCalculator /></PublicToolkitPage>;\n    case 'soil-health-meter':\n      return <PublicToolkitPage><SoilHealthMeter /></PublicToolkitPage>;"
    text = text.replace(target2, replacement2)

with open("project/src/app/router/PageSwitch.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated PageSwitch.tsx successfully!")
