with open("project/src/app/router/paths.ts", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace("  '/officer-toolkit/soil-health-meter',\n  'acts-and-orders'", "  'acts-and-orders'")

with open("project/src/app/router/paths.ts", "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed line in paths.ts")
