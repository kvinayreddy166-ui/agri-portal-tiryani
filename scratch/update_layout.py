with open("project/src/app/Layout.tsx", "r", encoding="utf-8") as f:
    text = f.read()

target = "'profitability-calculator': { title: t('Profit Calculator', 'లాభదాయకత కాలిక్యులేటర్'), breadcrumbs: [dashboard, toolkit, farmCalculators] },"
replacement = """'profitability-calculator': { title: t('Profit Calculator', 'లాభదాయకత కాలిక్యులేటర్'), breadcrumbs: [dashboard, toolkit, farmCalculators] },
    'soil-health-meter': { title: t('Soil Health Meter', 'మట్టి ఆరోగ్య మీటర్'), breadcrumbs: [dashboard, toolkit, farmCalculators] },"""

if "'soil-health-meter':" not in text:
    text = text.replace(target, replacement)
    with open("project/src/app/Layout.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated Layout.tsx successfully!")
else:
    print("Already in Layout.tsx")
