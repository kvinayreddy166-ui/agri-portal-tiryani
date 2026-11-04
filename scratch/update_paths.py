with open("project/src/app/router/paths.ts", "r", encoding="utf-8") as f:
    text = f.read()

# 1. PUBLIC_AUTH_ROUTES
if "'/officer-toolkit/soil-health-meter'" not in text:
    text = text.replace(
        "'/officer-toolkit/profitability-calculator',",
        "'/officer-toolkit/profitability-calculator',\n  '/officer-toolkit/soil-health-meter',"
    )

# 2. PUBLIC_PAGES
if "'soil-health-meter'" not in text:
    text = text.replace(
        "'profitability-calculator',",
        "'profitability-calculator',\n  'soil-health-meter',"
    )

# 3. PAGE_PATHS
if "'soil-health-meter': '/officer-toolkit/soil-health-meter'" not in text:
    text = text.replace(
        "'profitability-calculator': '/officer-toolkit/profitability-calculator',",
        "'profitability-calculator': '/officer-toolkit/profitability-calculator',\n  'soil-health-meter': '/officer-toolkit/soil-health-meter',"
    )

# 4. getRouteBackFallback
if "pathname === '/officer-toolkit/soil-health-meter'" not in text:
    text = text.replace(
        "pathname === '/officer-toolkit/profitability-calculator'",
        "pathname === '/officer-toolkit/profitability-calculator' ||\n    pathname === '/officer-toolkit/soil-health-meter'"
    )

# 5. getPageBackFallback
if "page === 'soil-health-meter'" not in text:
    text = text.replace(
        "page === 'profitability-calculator'",
        "page === 'profitability-calculator' || page === 'soil-health-meter'"
    )

# 6. VALID_PAGES & OFFICER_TOOLKIT_SUBPAGES
# Note: 'soil-health-meter' was added to PUBLIC_PAGES and if replace did all instances of 'profitability-calculator', check if it's in VALID_PAGES
# Let's verify and ensure VALID_PAGES and OFFICER_TOOLKIT_SUBPAGES have it.

with open("project/src/app/router/paths.ts", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated paths.ts successfully!")
