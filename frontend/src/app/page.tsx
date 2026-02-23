import Link from "next/link";
import { ArrowRight, Brain, Network, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <nav className="w-full flex items-center justify-between p-6 max-w-7xl mx-auto z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(163,230,53,0.3)]">
            <Network className="w-4 h-4 text-primary" />
          </div>
          <span className="font-serif text-2xl tracking-tighter glow-text font-bold text-white">Lumeris.</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/login" className="text-white/70 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="px-5 py-2.5 rounded-full btn-neon font-semibold text-primary-foreground tracking-wide flex items-center gap-2">
            Start Learning <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl mx-auto z-10 py-20">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium uppercase tracking-widest backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Lumeris Context Engine
        </div>

        <h1 className="font-serif text-6xl md:text-8xl font-bold mb-6 leading-tight tracking-tight text-white drop-shadow-2xl">
          Learn Anything, <br />
          <span className="italic font-serif text-primary glow-text pr-4">Faster.</span>
        </h1>

        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed">
          Paste a YouTube link or upload a PDF. Get flashcards, quizzes, and an AI tutor instantly.
        </p>

        <Link href="/signup" className="group px-8 py-4 rounded-full btn-neon font-bold text-lg text-primary-foreground tracking-wide flex items-center gap-3">
          Start Learning
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      <section className="w-full max-w-7xl mx-auto px-6 py-24 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Brain className="w-6 h-6 text-primary" />}
            title="Smart Search"
            description="Find the exact moment or concept across your videos and PDFs without guesswork."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-primary" />}
            title="Auto Flashcards"
            description="Turn hours of YouTube videos and dense PDFs into active recall sessions automatically."
          />
          <FeatureCard
            icon={<Network className="w-6 h-6 text-primary" />}
            title="Practice Quizzes"
            description="Auto-generated multiple-choice quizzes that help you retain what you just learned."
          />
        </div>
      </section>

      <footer className="w-full py-8 text-center text-white/30 text-sm z-10 font-mono">
        <p>CULTIVATED BY THINKERS AT LUMERIS</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass-card p-8 rounded-3xl flex flex-col gap-4 group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
        {icon}
      </div>
      <h3 className="font-serif text-2xl font-semibold text-white mt-2">{title}</h3>
      <p className="text-white/50 leading-relaxed font-sans">{description}</p>
    </div>
  );
}
