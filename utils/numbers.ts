/**
 * Reads the whole number out of a rendered amount or count, for example "⁨12,500 ل.س⁩" or
 * "× 2". The storefront formats amounts with en-US digit grouping inside bidi isolates, so
 * everything that is not a digit is a separator. Arabic-Indic digits are mapped too, in case
 * a locale change ever switches the numerals.
 */
export function parseNumber(text: string): number {
  const digits = text
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '');
  if (!digits) {
    throw new Error(`No number found in "${text}"`);
  }
  return Number(digits);
}

/**
 * Like `parseNumber`, but a text equal to `zeroLabel` (for example the translated "Free")
 * reads as 0, which is how the storefront prints a shipping method that costs nothing.
 */
export function parseAmount(text: string, zeroLabel: string): number {
  return text.trim() === zeroLabel.trim() ? 0 : parseNumber(text);
}

/** Every displayed figure is rounded on its own, so sums can differ from a displayed total by this much per term. */
export const ROUNDING_TOLERANCE = 1;

/** Absolute difference, for tolerance assertions. */
export function difference(a: number, b: number): number {
  return Math.abs(a - b);
}
