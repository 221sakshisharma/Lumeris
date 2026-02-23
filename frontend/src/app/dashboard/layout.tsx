import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Network, LogOut, PlusCircle } from "lucide-react";
import { ResourceSidebar } from "@/components/resource-sidebar";
import { logout } from "@/app/actions/auth";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-64 bg-primary/5 blur-3xl rounded-full translate-x-[-50%] pointer-events-none" />

      <aside className="w-64 flex flex-col border-r border-white/10 z-10 bg-background/80 backdrop-blur-md">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_10px_rgba(163,230,53,0.3)]">
            <Network className="w-4 h-4 text-primary" />
          </div>
          <span className="font-serif text-xl tracking-tighter glow-text font-bold text-white">Lumeris.</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <Link href="/dashboard/new" className="w-full btn-neon flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium mb-4">
            <PlusCircle className="w-4 h-4" /> Start Learning
          </Link>

          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 mt-2 px-2">Your Resources</div>

          <ResourceSidebar />
        </div>

        <div className="p-4 border-t border-white/10">
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full p-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white">U</div>
              <span className="flex-1 text-left">Logout</span>
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative z-0 h-full overflow-hidden">{children}</main>
    </div>
  );
}
