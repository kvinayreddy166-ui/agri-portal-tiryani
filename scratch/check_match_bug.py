upper_name = "MALATHION 50% EC"
tokens = [' GR', ' % GR', 'CG', ' DP', ' DUST']
for t in tokens:
    if t in upper_name:
        print(f"Matched {t} in {upper_name}")

upper_name = "PHENTHOATE 50% EC"
for t in tokens:
    if t in upper_name:
        print(f"Matched {t} in {upper_name}")
