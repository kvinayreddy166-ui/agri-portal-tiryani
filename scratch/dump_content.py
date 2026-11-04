import re

with open("scratch/soil_health_meter.html", "r", encoding="utf-8", errors="ignore") as f:
    html = f.read()

# Find all div ids or classes
divs = re.findall(r'<div[^>]+(?:class|id)=["\']([^"\']+)["\']', html)
print("Div classes/ids found:", len(divs))
for d in divs[:30]:
    print(" ", d)

# Find where "wpProQuiz" or quiz id is called in HTML or JS
quiz_inits = re.findall(r'wpProQuiz[_\w]*\s*\([^)]*\)', html)
print("Quiz inits:", quiz_inits)

# Find any text between tags in the entire document
text_chunks = re.findall(r'>([^<]{10,})<', html)
print(f"Text chunks found: {len(text_chunks)}")
for t in text_chunks:
    t_clean = t.strip()
    if t_clean and not t_clean.startswith('/*') and not t_clean.startswith('//') and not t_clean.startswith('var '):
        print("T:", t_clean[:120])
