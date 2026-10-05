import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { PasswordGenerator, SecurityDetails } from "@/components/password-generator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fortress Password Generator — Strong passwords, generated locally" },
      {
        name: "description",
        content:
          "Generate cryptographically strong passwords locally in your browser with the Web Crypto API. No uploads, no storage, no tracking.",
      },
      {
        property: "og:title",
        content: "Fortress Password Generator — Strong passwords, generated locally",
      },
      {
        property: "og:description",
        content:
          "Cryptographically strong passwords generated 100% in your browser. Nothing is uploaded or stored.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
      </div>

      <header className="relative mx-auto flex w-full max-w-5xl items-center gap-2 px-6 pt-8">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold tracking-wide text-foreground">
          Fortress
        </span>
      </header>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-20 pt-14 sm:pt-20">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-strength-max" />
            100% local • Web Crypto API
          </p>
          <h1 className="text-gradient mx-auto mt-5 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Generate a password you can trust.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Cryptographically strong passwords created entirely in your
            browser. Tune the rules, check the strength, and copy with one
            click.
          </p>
        </div>

        <div className="mt-10 flex w-full justify-center">
          <PasswordGenerator />
        </div>

        <SecurityDetails />
      </main>

      <footer className="relative border-t border-border/60 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-6 text-center">
          <p className="text-sm font-semibold text-foreground">
            Fortress Password Generator
          </p>
          <p className="text-xs text-muted-foreground">
            Local-first • No tracking • No password storage
          </p>
        </div>
      </footer>
    </div>
  );
}
