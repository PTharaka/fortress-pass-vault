import { describe, expect, it } from "vitest";
import {
  AMBIGUOUS,
  DEFAULT_OPTIONS,
  LOWERCASE,
  MAX_LENGTH,
  MIN_LENGTH,
  NUMBERS,
  SYMBOLS,
  UPPERCASE,
  canGenerate,
  estimateEntropyBits,
  generatePassword,
  getPoolSize,
  strengthFromEntropy,
  type GeneratorOptions,
} from "@/lib/password";

const allOn: GeneratorOptions = { ...DEFAULT_OPTIONS, length: 32 };

describe("generatePassword", () => {
  it("produces a password of the requested length", () => {
    for (const length of [MIN_LENGTH, 16, 32, MAX_LENGTH]) {
      expect(generatePassword({ ...allOn, length })).toHaveLength(length);
    }
  });

  it("includes at least one character from every enabled category", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword(allOn);
      expect([...pw].some((c) => UPPERCASE.includes(c))).toBe(true);
      expect([...pw].some((c) => LOWERCASE.includes(c))).toBe(true);
      expect([...pw].some((c) => NUMBERS.includes(c))).toBe(true);
      expect([...pw].some((c) => SYMBOLS.includes(c))).toBe(true);
    }
  });

  it("only uses characters from enabled categories", () => {
    const pw = generatePassword({
      ...allOn,
      uppercase: false,
      symbols: false,
      length: 48,
    });
    const allowed = new Set([...(LOWERCASE + NUMBERS)]);
    for (const c of pw) expect(allowed.has(c)).toBe(true);
  });

  it("excludes ambiguous characters when requested", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ ...allOn, excludeAmbiguous: true });
      for (const c of pw) expect(AMBIGUOUS.has(c)).toBe(false);
    }
  });

  it("throws when all categories are disabled", () => {
    expect(() =>
      generatePassword({
        ...allOn,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      }),
    ).toThrow();
  });

  it("throws for out-of-range lengths", () => {
    expect(() => generatePassword({ ...allOn, length: 4 })).toThrow();
    expect(() => generatePassword({ ...allOn, length: 100 })).toThrow();
  });

  it("generates distinct passwords across calls", () => {
    const a = generatePassword(allOn);
    const b = generatePassword(allOn);
    expect(a).not.toBe(b);
  });

  it("produces unbiased-ish distribution with a deterministic RNG", () => {
    // Sequential counter as RNG: rejection sampling must not skew or hang.
    let n = 0;
    const rng = () => new Uint32Array([n++]);
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i++) {
      const pw = generatePassword(
        { ...allOn, length: 8, uppercase: false, symbols: false, numbers: false },
        rng,
      );
      for (const c of pw) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    expect(counts.size).toBe(LOWERCASE.length);
  });
});

describe("canGenerate / getPoolSize", () => {
  it("is false when no category is enabled", () => {
    expect(
      canGenerate({
        ...allOn,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      }),
    ).toBe(false);
  });

  it("computes pool size with and without ambiguous filter", () => {
    expect(getPoolSize(allOn)).toBe(
      UPPERCASE.length + LOWERCASE.length + NUMBERS.length + SYMBOLS.length,
    );
    expect(getPoolSize({ ...allOn, excludeAmbiguous: true })).toBeLessThan(
      getPoolSize(allOn),
    );
  });
});

describe("entropy & strength", () => {
  it("estimates entropy as length * log2(poolSize)", () => {
    const opts = { ...allOn, length: 16 };
    expect(estimateEntropyBits(opts)).toBe(
      Math.round(16 * Math.log2(getPoolSize(opts))),
    );
  });

  it("returns 0 entropy with an empty pool", () => {
    expect(
      estimateEntropyBits({
        ...allOn,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      }),
    ).toBe(0);
  });

  it("maps entropy to strength labels", () => {
    expect(strengthFromEntropy(30).label).toBe("Weak");
    expect(strengthFromEntropy(55).label).toBe("Fair");
    expect(strengthFromEntropy(90).label).toBe("Strong");
    expect(strengthFromEntropy(130).label).toBe("Very Strong");
  });
});
