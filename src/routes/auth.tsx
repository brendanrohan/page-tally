import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Book Loggins" },
      { name: "description", content: "Sign in with a one-time code sent to your email." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setEmail(trimmed);
    setStep("code");
    toast.success("Check your inbox for a 6-digit code.");
  };

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const token = code.trim();
    if (token.length !== 6) return;
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
    setVerifying(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <BookOpen className="h-5 w-5 text-accent" />
          <h1 className="font-serif text-2xl tracking-tight">Book Loggins</h1>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {step === "email" ? (
            <form onSubmit={sendCode} className="space-y-4">
              <div>
                <h2 className="font-serif text-lg">Sign in</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email and we'll send you a 6-digit code.
                </p>
              </div>
              <input
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-md bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={sending || !email.trim()}
                className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {sending ? "Sending…" : "Send code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div>
                <h2 className="font-serif text-lg">Enter your code</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We emailed a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
                </p>
              </div>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full px-3 py-2 rounded-md bg-background border border-input text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {verifying ? "Verifying…" : "Verify & sign in"}
              </button>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setCode(""); }}
                  className="hover:text-foreground"
                >
                  ← Use a different email
                </button>
                <button
                  type="button"
                  onClick={() => sendCode()}
                  disabled={sending}
                  className="hover:text-foreground disabled:opacity-50"
                >
                  {sending ? "Resending…" : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}