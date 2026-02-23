import { Leaf } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background h-full">
      <div className="w-24 h-24 mb-6 rounded-full bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(163,230,53,0.1)] relative">
        <div className="absolute inset-0 rounded-full animate-ping bg-primary/10 duration-[3000ms]"></div>
        <Leaf className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(163,230,53,0.8)]" />
      </div>

      <h2 className="font-serif text-3xl font-bold text-white mb-2">Learn Anything, Faster.</h2>
      <p className="text-white/50 max-w-md mb-8">
        Paste a YouTube link or upload a PDF. Get flashcards, quizzes, and an AI tutor instantly.
      </p>
    </div>
  );
}
