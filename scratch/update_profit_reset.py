with open("project/src/features/calculators/pages/ProfitabilityCalculator.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add isResetting state
if "const [isResetting, setIsResetting] = useState(false);" not in text:
    text = text.replace("const [copied, setCopied] = useState(false);", "const [copied, setCopied] = useState(false);\n  const [isResetting, setIsResetting] = useState(false);")

# Update resetAll function
old_reset = """  const resetAll = () => {
    const cotton = CROP_PRESETS[0];
    applyPreset(cotton);
    setLandArea('1');
    setAreaUnit('acres');
    setCostInputMode('per_acre');
    setResultDisplayMode('per_acre');
  };"""

new_reset = """  const resetAll = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setSelectedCropId('custom');
    setCustomCropName('');
    setLandArea('');
    setLandPrepCost('');
    setSeedsCost('');
    setFertilizersCost('');
    setPesticidesCost('');
    setLabourCost('');
    setOtherCost('');
    setYieldQuantity('');
    setUnitPrice('');
    setByProductIncome('0');
    setCostInputMode('per_acre');
    setResultDisplayMode('per_acre');
    showSuccess(t('Inputs Cleared', 'ఇన్‌పుట్‌లు తొలగించబడ్డాయి'), t('All input fields have been cleared.', 'అన్ని ఇన్‌పుట్ ఫీల్డ్‌లు ఖాళీ చేయబడ్డాయి.'));
  };"""

text = text.replace(old_reset, new_reset)

# Update button icon
old_icon = '<RotateCcw className="h-3.5 w-3.5" />'
new_icon = '<RotateCcw className={`h-3.5 w-3.5 transition-transform duration-500 ${isResetting ? \'animate-spin\' : \'\'}`} />'
text = text.replace(old_icon, new_icon)

with open("project/src/features/calculators/pages/ProfitabilityCalculator.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated ProfitabilityCalculator.tsx successfully!")
