import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Lock,
  Cpu,
  Ban,
} from "lucide-react";
import {
  DEFAULT_OPTIONS,
  MAX_LENGTH,
  MIN_LENGTH,
  canGenerate,
  estimateEntropyBits,
  generatePassword,
  strengthFromEntropy,
  type GeneratorOptions,
} from "@/lib/password";

const STRENGTH_COLORS: Record<string, string> = {
  Weak: "bg-strength-weak",
  Fair: "bg-strength-fair",
  Strong: "bg-strength-strong",
  "Very Strong": "bg-strength-max",
};

const STRENGTH_TEXT: Record<string, string> = {
  Weak: "text-strength-weak",
  Fair: "text-strength-fair",
  Strong: "text-strength-strong",
  "Very Strong": "text-strength-max",
};

interface ToggleRowProps {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ id, label, hint, checked, onChange }: ToggleRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 transition-colors hover:border-primary/40 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
    >
      <span>
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-primary"
        />
        <span
          aria-hidden="true"
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground shadow transition-transform peer-checked:translate-x-5 peer-checked:bg-primary-foreground"
        />
      </span>
    </label>
  );
}

export function PasswordGenerator() {
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const regenerate = useCallback((opts: GeneratorOptions) => {
    if (!canGenerate(opts)) {
      setPassword("");
      return;
    }
    setPassword(generatePassword(opts));
    setCopied(false);
    setCopyError(false);
  }, []);

  // Generate on mount and whenever settings change.
  useEffect(() => {
    regenerate(options);
  }, [options, regenerate]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const update = <K extends keyof GeneratorOptions>(
    key: K,
    value: GeneratorOptions[K],
  ) => setOptions((prev) => ({ ...prev, [key]: value }));

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setCopyError(false);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard permission.
      try {
        const textarea = document.createElement("textarea");
        textarea.value = password;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (!ok) throw new Error("copy failed");
        setCopied(true);
        setCopyError(false);
        if (copyTimer.current) clearTimeout(copyTimer.current);
        copyTimer.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopyError(true);
      }
    }
  };

  const entropy = estimateEntropyBits(options);
  const strength = strengthFromEntropy(entropy);
  const enabled = canGenerate(options);

  return (
    <section
      aria-label="Password generator"
      className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8"
    >
      {/* Password display */}
      <div className="glow-ring flex items-center gap-2 rounded-2xl bg-background/70 p-2 pl-5">
        <output
          aria-label="Generated password"
          className="min-w-0 flex-1 truncate font-mono-display text-lg tracking-wide text-foreground sm:text-xl"
          style={{ fontFamily: "var(--font-mono-display)" }}
        >
          {enabled ? (
            visible ? (
              password
            ) : (
              "•".repeat(Math.min(password.length, 24))
            )
          ) : (
            <span className="text-sm text-muted-foreground">
              Select at least one character category
            </span>
          )}
        </output>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={!enabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => regenerate(options)}
          disabled={!enabled}
          aria-label="Regenerate password"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!enabled}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Copy status for screen readers */}
      <div aria-live="polite" className="sr-only">
        {copied ? "Password copied to clipboard" : ""}
        {copyError ? "Copy failed. Please select and copy manually." : ""}
      </div>
      {copyError && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          Copy failed — your browser blocked clipboard access. Select the
          password and copy it manually.
        </p>
      )}

      {/* Strength meter + entropy */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Strength
          </span>
          <span
            className={`text-sm font-semibold ${STRENGTH_TEXT[strength.label]}`}
          >
            {enabled ? strength.label : "—"}
          </span>
        </div>
        <div
          className="mt-2 flex gap-1.5"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={enabled ? strength.score : 0}
          aria-label={`Password strength: ${enabled ? strength.label : "none"}`}
        >
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                enabled && i <= strength.score
                  ? STRENGTH_COLORS[strength.label]
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">
            ~{enabled ? entropy : 0} bits of entropy
          </span>{" "}
          (estimate) — calculated as length × log₂(character pool size). Higher
          means more guesses an attacker would need.
        </p>
      </div>

      {/* Length slider */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="length"
            className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
          >
            Length
          </label>
          <span className="rounded-md bg-secondary px-2 py-0.5 font-mono-display text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-mono-display)" }}>
            {options.length}
          </span>
        </div>
        <input
          id="length"
          type="range"
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          value={options.length}
          onChange={(e) => update("length", Number(e.target.value))}
          className="mt-3 w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{MIN_LENGTH}</span>
          <span>{MAX_LENGTH}</span>
        </div>
      </div>

      {/* Character options */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <ToggleRow
          id="opt-uppercase"
          label="Uppercase"
          hint="A–Z"
          checked={options.uppercase}
          onChange={(v) => update("uppercase", v)}
        />
        <ToggleRow
          id="opt-lowercase"
          label="Lowercase"
          hint="a–z"
          checked={options.lowercase}
          onChange={(v) => update("lowercase", v)}
        />
        <ToggleRow
          id="opt-numbers"
          label="Numbers"
          hint="0–9"
          checked={options.numbers}
          onChange={(v) => update("numbers", v)}
        />
        <ToggleRow
          id="opt-symbols"
          label="Symbols"
          hint="!@#$%…"
          checked={options.symbols}
          onChange={(v) => update("symbols", v)}
        />
        <div className="sm:col-span-2">
          <ToggleRow
            id="opt-ambiguous"
            label="Exclude ambiguous characters"
            hint="Avoids 0/O, 1/l/I and similar look-alikes"
            checked={options.excludeAmbiguous}
            onChange={(v) => update("excludeAmbiguous", v)}
          />
        </div>
      </div>

      {/* Privacy note */}
      <p className="mt-6 flex items-start gap-2 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-strength-max" />
        Generated locally in your browser. Nothing is uploaded or stored.
      </p>
    </section>
  );
}

export function SecurityDetails() {
  const items = [
    {
      icon: Cpu,
      title: "Web Crypto API",
      body: "Passwords are built from crypto.getRandomValues(), the browser's cryptographically secure random number generator — the same source of randomness used for encryption keys.",
    },
    {
      icon: Ban,
      title: "Never Math.random()",
      body: "Math.random() is a predictable pseudo-random generator designed for simulations, not security. Its internal state can be reconstructed, making passwords guessable. Fortress never uses it.",
    },
    {
      icon: Lock,
      title: "Unbiased selection",
      body: "Characters are picked with rejection sampling, which avoids modulo bias — a subtle flaw in naive generators that makes some characters slightly more likely than others.",
    },
  ];
  return (
    <section aria-labelledby="how-it-works" className="mx-auto mt-16 w-full max-w-4xl">
      <h2
        id="how-it-works"
        className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
      >
        How it works
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
        A password generator is only as trustworthy as its randomness. Here's
        what Fortress does differently.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="glass-panel rounded-2xl p-5 transition-transform hover:-translate-y-1"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
