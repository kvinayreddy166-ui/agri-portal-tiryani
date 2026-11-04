with open("project/src/features/calculators/pages/PesticideCalculator.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Define emptyForm right after initialForm
empty_form_def = """const emptyForm = {
  productName: '',
  areaValue: '',
  areaUnit: 'acres' as AreaUnit,
  unitType: 'liquid' as UnitType,
  waterPerAcre: '',
  tankChoice: '16' as TankChoice,
  customTankSize: '',
  aiPercentage: '',
  aiDose: '',
  aiDoseUnit: 'g-ai-acre' as AiDoseUnit,
  directDose: '',
};
"""

if "const emptyForm =" not in text:
    text = text.replace("const initialForm = {", empty_form_def + "\nconst initialForm = {")

# 2. Add isResetting state
if "const [isResetting, setIsResetting] = useState(false);" not in text:
    text = text.replace("const [copied, setCopied] = useState(false);", "const [copied, setCopied] = useState(false);\n  const [isResetting, setIsResetting] = useState(false);")

# 3. Update reset function
old_reset = """  const reset = () => {
    setCopied(false);
    setMode('activeIngredient');
    setForm(initialForm);
  };"""

new_reset = """  const reset = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setCopied(false);
    setMode('activeIngredient');
    setForm(emptyForm);
    showSuccess(t('Inputs Cleared', 'ఇన్‌పుట్‌లు తొలగించబడ్డాయి'), t('All input fields have been cleared.', 'అన్ని ఇన్‌పుట్ ఫీల్డ్‌లు ఖాళీ చేయబడ్డాయి.'));
  };"""

text = text.replace(old_reset, new_reset)

# 4. Update button icon
old_icon = '<RotateCcw className="h-3.5 w-3.5" />'
new_icon = '<RotateCcw className={`h-3.5 w-3.5 transition-transform duration-500 ${isResetting ? \'animate-spin\' : \'\'}`} />'
text = text.replace(old_icon, new_icon)

with open("project/src/features/calculators/pages/PesticideCalculator.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated PesticideCalculator.tsx successfully!")
