"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "sign-in" | "sign-up";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const supabase = createClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus({ kind: "error", text: error.message });
        setLoading(false);
        return;
      }
      router.push("/ares");
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus({ kind: "error", text: error.message });
      setLoading(false);
      return;
    }
    if (!data.session) {
      setStatus({
        kind: "info",
        text: "Konto erstellt. Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben, und melde dich anschließend an.",
      });
      setMode("sign-in");
      setLoading(false);
      return;
    }
    router.push("/ares");
    router.refresh();
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-1 items-center">
          <span className="text-sm font-semibold tracking-[0.2em] text-text">ARES OS</span>
          <span className="text-xs text-text-muted">
            {mode === "sign-in" ? "Anmelden, Sir." : "Konto erstellen"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              E-Mail
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface-2 border border-border focus:border-border-strong outline-none px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted transition-colors duration-150"
              placeholder="du@beispiel.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Passwort
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface-2 border border-border focus:border-border-strong outline-none px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted transition-colors duration-150"
              placeholder="••••••••"
            />
          </div>

          {status && (
            <p
              className={cn(
                "text-xs leading-relaxed",
                status.kind === "error" ? "text-critical" : "text-text-secondary"
              )}
            >
              {status.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center px-5 py-2.5 bg-text text-bg text-xs font-medium uppercase tracking-wider disabled:opacity-40 hover:bg-white transition-colors"
          >
            {loading ? "Bitte warten..." : mode === "sign-in" ? "Anmelden" : "Registrieren"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
            setStatus(null);
          }}
          className="text-xs text-text-muted hover:text-text transition-colors text-center"
        >
          {mode === "sign-in"
            ? "Noch kein Konto? Registrieren"
            : "Bereits ein Konto? Anmelden"}
        </button>
      </div>
    </div>
  );
}
