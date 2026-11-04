with open("project/src/features/calculators/pages/IrrigationCalculator.tsx", "r", encoding="utf-8") as f:
    text = f.read()

empty_defs = """const emptyDripForm: DripIrrigationInput = {
  cropName: '',
  area: 0,
  areaUnit: 'acres',
  rowSpacing: 0,
  rowSpacingUnit: 'cm',
  plantSpacing: 0,
  plantSpacingUnit: 'cm',
  emitterSpacing: 0,
  emitterSpacingUnit: 'cm',
  emitterDischarge: 0,
  waterRequirementPerPlant: 0,
  pumpHorsePower: 0,
};

const emptySprinklerForm: SprinklerIrrigationInput = {
  cropName: '',
  area: 0,
  areaUnit: 'acres',
  spacingX: 0,
  spacingY: 0,
  nozzleDischargeLph: 0,
  operatingSprinklers: 0,
  targetDepthMm: 0,
  pumpHorsePower: 0,
};
"""

if "const emptyDripForm:" not in text:
    text = text.replace("const defaultDripForm: DripIrrigationInput = {", empty_defs + "\nconst defaultDripForm: DripIrrigationInput = {")

# Add isResetting state
if "const [isResetting, setIsResetting] = useState(false);" not in text:
    text = text.replace("const [copied, setCopied] = useState(false);", "const [copied, setCopied] = useState(false);\n  const [isResetting, setIsResetting] = useState(false);")

# Update resetDrip and resetSprinkler
old_resets = """  const resetDrip = () => {
    setDripForm(defaultDripForm);
    setCopied(false);
  };

  const resetSprinkler = () => {
    setSprinklerForm(defaultSprinklerForm);
    setCopied(false);
  };"""

new_resets = """  const resetDrip = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setDripForm(emptyDripForm);
    setCopied(false);
    showSuccess(t('Inputs Cleared', 'ఇన్‌పుట్‌లు తొలగించబడ్డాయి'), t('All input fields have been cleared.', 'అన్ని ఇన్‌పుట్ ఫీల్డ్‌లు ఖాళీ చేయబడ్డాయి.'));
  };

  const resetSprinkler = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setSprinklerForm(emptySprinklerForm);
    setCopied(false);
    showSuccess(t('Inputs Cleared', 'ఇన్‌పుట్‌లు తొలగించబడ్డాయి'), t('All input fields have been cleared.', 'అన్ని ఇన్‌పుట్ ఫీల్డ్‌లు ఖాళీ చేయబడ్డాయి.'));
  };"""

text = text.replace(old_resets, new_resets)

# Update button icon
old_icon = '<RotateCcw className="h-3.5 w-3.5" />'
new_icon = '<RotateCcw className={`h-3.5 w-3.5 transition-transform duration-500 ${isResetting ? \'animate-spin\' : \'\'}`} />'
text = text.replace(old_icon, new_icon)

with open("project/src/features/calculators/pages/IrrigationCalculator.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated IrrigationCalculator.tsx successfully!")
