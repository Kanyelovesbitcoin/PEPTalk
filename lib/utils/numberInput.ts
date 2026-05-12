export function sanitizeDecimalInput(value: string) {
  const normalized = value.replace(/,/g, '.');
  let nextValue = '';
  let hasDecimal = false;

  for (const char of normalized) {
    if (char >= '0' && char <= '9') {
      nextValue += char;
      continue;
    }

    if (char === '.' && !hasDecimal) {
      nextValue += char;
      hasDecimal = true;
    }
  }

  return nextValue;
}
