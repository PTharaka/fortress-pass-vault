# Fortress Password Generator

A local-first, cryptographically secure password generator that runs entirely in your browser. No accounts, no backend, no tracking — open the page, tune the rules, and copy a strong password in one click.

## Features

- **Cryptographically strong generation** using the Web Crypto API (`crypto.getRandomValues()`)
- **Unbiased character selection** via rejection sampling (no modulo bias)
- **Guaranteed category coverage** — every enabled character class appears at least once
- **Length slider** from 8 to 64 characters
- **Toggles** for uppercase, lowercase, numbers, symbols, and excluding ambiguous characters (`0/O`, `1/l/I`, …)
- **Strength meter** (Weak / Fair / Strong / Very Strong) with a transparent entropy estimate in bits
- **One-click copy** with a copied confirmation state and a graceful fallback when clipboard access is blocked
- **Show/hide** password toggle
- **Accessible**: labeled controls, keyboard navigation, visible focus states, `aria-live` copy status, and reduced-motion support
- **Responsive** dark-first glass UI

## Security model

| Concern | Approach |
| --- | --- |
| Randomness | `crypto.getRandomValues()` (CSPRNG) only. `Math.random()` is never used — it is predictable and unsuitable for security. |
| Bias | Rejection sampling: random values that would skew the distribution are discarded and redrawn, so every character is equally likely. |
| Privacy | Passwords are generated in memory, never sent to a server, never written to `localStorage`/`sessionStorage`/cookies, never logged, and never included in URLs or analytics. |
| Entropy | Displayed as an estimate: `length × log₂(pool size)`. It assumes a uniform CSPRNG and is labeled as an estimate in the UI. |

## Local-only architecture

There is no backend. The app is a static React + TypeScript single-page app; the entire generator lives in `src/lib/password.ts` and executes in the browser. You can verify this by opening your browser's network inspector — generating a password produces zero network requests.

## Tech stack

- React 19 + TypeScript
- TanStack Start (file-based routing, SSR)
- Tailwind CSS v4 with a semantic design-token system
- Vitest for unit tests
- No runtime dependencies beyond the framework and `lucide-react` icons

## Getting started

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev

# Run the test suite
bunx vitest run
```

## Project structure

```
src/
├── lib/password.ts              # Generation engine: CSPRNG, rejection sampling, entropy, strength
├── components/password-generator.tsx  # Generator card + "How it works" section
├── routes/index.tsx             # Page layout, hero, footer, SEO metadata
├── styles.css                   # Design tokens (dark-first palette, glass utilities)
└── test/password.test.ts        # Unit tests for generation rules and edge cases
```

## Testing

`src/test/password.test.ts` covers:

- Correct output length across the full 8–64 range
- At least one character from every enabled category
- Disabled categories never appear in output
- Ambiguous-character exclusion
- Errors when all categories are disabled or length is out of range
- Entropy and strength-mapping calculations
