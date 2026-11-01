import re

def clean_form_dose(s):
    # Remove things like "5% WP", "10% EC", etc.
    s_clean = re.sub(r'\d+(?:\.\d+)?\s*%', '', s)
    # Remove words
    nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', s_clean)]
    return nums

test_str = "Dilute 250 gm of Alphacypermethrin5% WP"
print("Clean nums for:", test_str, "->", clean_form_dose(test_str))
