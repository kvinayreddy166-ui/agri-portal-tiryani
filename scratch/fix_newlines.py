with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'rb') as f:
    raw = f.read()

# Normalize any \r\r\n or \r\n to \r\n
cleaned = raw.replace(b'\r\r\n', b'\r\n')
# If there are any stray \r\r\n repeatedly:
while b'\r\r\n' in cleaned:
    cleaned = cleaned.replace(b'\r\r\n', b'\r\n')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'wb') as f:
    f.write(cleaned)

print('Cleaned! File length:', len(cleaned))
