with open("project/src/features/calculators/pages/AcreageCalculator.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add isResetting state
if "const [isResetting, setIsResetting] = useState(false);" not in text:
    text = text.replace("const [copied, setCopied] = useState(false);", "const [copied, setCopied] = useState(false);\n  const [isResetting, setIsResetting] = useState(false);")

# Update resetCalculator
old_reset = """  const resetCalculator = () => {"""
new_reset = """  const resetCalculator = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);"""

text = text.replace(old_reset, new_reset)

# Update icon
old_icon = '<RotateCcw className="h-3.5 w-3.5" />'
new_icon = '<RotateCcw className={`h-3.5 w-3.5 transition-transform duration-500 ${isResetting ? \'animate-spin\' : \'\'}`} />'
text = text.replace(old_icon, new_icon)

with open("project/src/features/calculators/pages/AcreageCalculator.tsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated AcreageCalculator.tsx successfully!")
