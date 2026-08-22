export function calculateBarCount(
  totalLength: number,
  left: number,
  right: number,
  spacingPattern: number[],
): number {
  if (!spacingPattern.length) return 0;

  const usableLength = totalLength - left - right;

  if (usableLength <= 0) return 0;

  let current = 0;
  let count = 1; // luôn có thanh đầu tiên
  let index = 0;

  while (true) {
    const spacing = spacingPattern[index % spacingPattern.length];

    if (spacing <= 0) break;

    current += spacing;

    if (current > usableLength) {
      break;
    }

    count++;
    index++;
  }

  return count;
}
