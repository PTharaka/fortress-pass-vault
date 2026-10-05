/**
 * Fortress Password Generator — core generation engine.
 *
 * Security model:
 * - All randomness comes from crypto.getRandomValues() (CSPRNG).
 * - Character selection uses rejection sampling to avoid modulo bias.
 * - Nothing is persisted or transmitted; generation is fully local.
 */

export const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
export const NUMBERS = "0123456789";
export const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>?/~";

/** Characters that look alike in many fonts (0/O, 1/l/I, etc.). */
export const AMBIGUOUS = new Set("0O1lI|`'\"".split(""));

export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export const DEFAULT_OPTIONS: GeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 64;

function filterAmbiguous(chars: string): string {
  return chars
    .split("")
    .filter((c) => !AMBIGUOUS.has(c))
    .join("");
}

/** Returns the enabled character pools, honoring the ambiguous filter. */
export function getPools(options: GeneratorOptions): string[] {
  const pools: string[] = [];
  if (options.uppercase) pools.push(UPPERCASE);
  if (options.lowercase) pools.push(LOWERCASE);
  if (options.numbers) pools.push(NUMBERS);
  if (options.symbols) pools.push(SYMBOLS);
  if (options.excludeAmbiguous) {
    return pools.map(filterAmbiguous).filter((p) => p.length > 0);
  }
  return pools;
}

export function getPoolSize(options: GeneratorOptions): number {
  return getPools(options).reduce((sum, p) => sum + p.length, 0);
}

export function canGenerate(options: GeneratorOptions): boolean {
  return (
    options.length >= MIN_LENGTH &&
    options.length <= MAX_LENGTH &&
    getPoolSize(options) > 0
  );
}

/**
 * Unbiased random index in [0, max) using rejection sampling.
 * Rejects values that would make some outcomes more likely than others
 * (the "modulo bias" problem of `randomByte % max`).
 */
function randomIndex(max: number, random: () => Uint32Array): number {
  if (max <= 0) throw new Error("max must be positive");
  const range = Math.floor(0x100000000 / max) * max; // largest multiple of max <= 2^32
  for (;;) {
    const value = random()[0];
    if (value < range) return value % max;
  }
}

const defaultRandom = (): Uint32Array => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf;
};

/**
 * Generates a password guaranteeing at least one character from every
 * enabled pool, then shuffles with a Fisher–Yates pass so the guaranteed
 * characters are not predictably positioned.
 */
export function generatePassword(
  options: GeneratorOptions,
  random: () => Uint32Array = defaultRandom,
): string {
  if (!canGenerate(options)) {
    throw new Error(
      "Cannot generate: select at least one character category and a length of 8–64.",
    );
  }

  const pools = getPools(options);
  const all = pools.join("");
  const chars: string[] = [];

  // Guarantee one character from each enabled pool.
  for (const pool of pools) {
    chars.push(pool[randomIndex(pool.length, random)]);
  }

  // Fill the remainder from the combined pool.
  while (chars.length < options.length) {
    chars.push(all[randomIndex(all.length, random)]);
  }

  // Fisher–Yates shuffle (unbiased via rejection sampling).
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1, random);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/**
 * Entropy estimate in bits: length * log2(poolSize).
 * This is an upper-bound estimate assuming a uniform CSPRNG; it does not
 * account for the "at least one per category" guarantee, which slightly
 * reduces true entropy but is negligible at normal lengths.
 */
export function estimateEntropyBits(options: GeneratorOptions): number {
  const poolSize = getPoolSize(options);
  if (poolSize === 0) return 0;
  return Math.round(options.length * Math.log2(poolSize));
}

export type StrengthLabel = "Weak" | "Fair" | "Strong" | "Very Strong";

export function strengthFromEntropy(bits: number): {
  label: StrengthLabel;
  /** 0–4 for meter rendering */
  score: 0 | 1 | 2 | 3 | 4;
} {
  if (bits < 45) return { label: "Weak", score: 1 };
  if (bits < 70) return { label: "Fair", score: 2 };
  if (bits < 110) return { label: "Strong", score: 3 };
  return { label: "Very Strong", score: 4 };
}
