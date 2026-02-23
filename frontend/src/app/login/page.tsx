import Link from "next/link";
import { redirect } from "next/navigation";
import { Network } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/utils/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(163,230,53,0.3)]">
              <Network className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif text-3xl tracking-tighter glow-text font-bold text-white">Lumeris.</span>
          </Link>
        </div>

        <div className="glass-card p-8 rounded-3xl w-full">
          <h1 className="text-2xl font-serif font-bold text-white mb-2 text-center">Welcome Back</h1>
          <p className="text-white/60 text-center mb-8 text-sm">Sign in to continue learning.</p>

          <AuthForm view="login" />

          <div className="mt-6 text-center text-sm text-white/50">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
