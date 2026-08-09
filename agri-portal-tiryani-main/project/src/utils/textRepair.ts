const WINDOWS_1252_BYTE_BY_CODE_POINT: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

const MOJIBAKE_PATTERN = /[ÃÂâ€š€œ€�¢¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ƒ]/;
const TELUGU_PATTERN = /[\u0C00-\u0C7F]/g;

function toWindows1252Bytes(value: string) {
  const bytes: number[] = [];
  for (const char of value) {
    const codePoint = char.codePointAt(0) || 0;
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const byte = WINDOWS_1252_BYTE_BY_CODE_POINT[codePoint];
    if (byte === undefined) return null;
    bytes.push(byte);
  }
  return Uint8Array.from(bytes);
}

function repairOnce(value: string) {
  const bytes = toWindows1252Bytes(value);
  if (!bytes) return value;
  return new TextDecoder('utf-8').decode(bytes);
}

function scoreText(value: string) {
  const teluguCount = value.match(TELUGU_PATTERN)?.length || 0;
  const mojibakeCount = value.match(MOJIBAKE_PATTERN)?.length || 0;
  const replacementCount = (value.match(/\uFFFD/g) || []).length;
  return teluguCount * 8 - mojibakeCount * 3 - replacementCount * 12;
}

export function repairTeluguText(value: string) {
  if (!value || !MOJIBAKE_PATTERN.test(value)) return value;

  let current = value;
  let best = value;
  let bestScore = scoreText(value);

  for (let index = 0; index < 5; index += 1) {
    current = repairOnce(current);
    const score = scoreText(current);
    if (score > bestScore) {
      best = current;
      bestScore = score;
    }
  }

  return best;
}

export function repairTeluguRecord<T extends Record<string, string>>(labels: T): T {
  return Object.fromEntries(
    Object.entries(labels).map(([key, value]) => [key, repairTeluguText(value)])
  ) as T;
}
