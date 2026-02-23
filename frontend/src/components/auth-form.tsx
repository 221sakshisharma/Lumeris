"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/client";

type SignupResult = {
  requiresEmailConfirmation?: boolean;
  email?: string;
  message?: string;
};

export function AuthForm({ view }: { view: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  const isNextRedirectError = (err: unknown) => {
    if (!err || typeof err !== "object") return false;
    const maybe = err as { digest?: unknown };
    return typeof maybe.digest === "string" && maybe.digest.startsWith("NEXT_REDIRECT");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      if (view === "login") {
        await login(formData);
      } else {
        const result = (await signup(formData)) as SignupResult | undefined;
        if (result?.requiresEmailConfirmation) {
          setNotice(result.message ?? "Check your inbox to confirm your email, then sign in.");
          setPassword("");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      if (isNextRedirectError(err)) {
        return;
      }
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      if (message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email first. Check your inbox, then sign in.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not sign in with Google.";
      setError(message);
      setOauthLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {notice && (
        <div className="p-3 bg-primary/15 border border-primary/40 text-primary rounded-lg text-sm">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 text-left">
        <Label htmlFor="email" className="text-white/80">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/50"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2 text-left">
        <Label htmlFor="password" className="text-white/80">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-black/20 border-white/10 text-white focus-visible:ring-primary/50"
          placeholder="........"
        />
      </div>

      <Button
        type="submit"
        disabled={loading || oauthLoading}
        className="w-full btn-neon font-semibold text-primary-foreground py-6 !mt-6"
      >
        {loading ? "Processing..." : view === "login" ? "Sign In" : "Create Account"}
      </Button>

      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || oauthLoading}
        variant="outline"
        className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 py-6"
      >
        {oauthLoading ? "Connecting..." : "Continue with Google"}
      </Button>
    </form>
  );
}
