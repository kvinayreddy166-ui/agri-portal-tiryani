with open("project/src/features/calculators/pages/SoilHealthMeter.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add isResetting state
if "const [isResetting, setIsResetting] = useState(false);" not in text:
    text = text.replace("const [copied, setCopied] = useState(false);", "const [copied, setCopied] = useState(false);\n  const [isResetting, setIsResetting] = useState(false);")

# Update handleReset
old_handle_reset = """  const handleReset = () => {
    setLabForm(initialLabForm);
    setFieldState(initialFieldIndicators);
    setCopied(false);
    showSuccess(t('Reset Complete', 'రీసెట్ చేయబడింది'), t('Default values restored.', 'సాధారణ విలువలు పునరుద్ధరించబడ్డాయి.'));
  };"""

new_handle_reset = """  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setLabForm(initialLabForm);
    setFieldState(initialFieldIndicators);
    setCopied(false);
    showSuccess(t('Reset Complete', 'రీసెట్ చేయబడింది'), t('Default values restored.', 'సాధారణ విలువలు పునరుద్ధరించబడ్డాయి.'));
  };"""

text = text.replace(old_handle_reset, new_handle_reset)

# Update button icon
old_icon = '<RotateCcw className="h-3 w-3" />'
new_icon = '<RotateCcw className={`h-3 w-3 transition-transform duration-500 ${isResetting ? \'animate-spin\' : \'\'}`} />'
text = text.replace(old_icon, new_icon)

with open("project/src/features/calculators/pages/SoilHealthMeter.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated SoilHealthMeter.tsx successfully!")
