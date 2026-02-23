"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Repeat } from "lucide-react";
import { getBackendAuthHeaders } from "@/utils/backend-auth";

type Flashcard = {
  question: string;
  answer: string;
};

export function FlashcardView({ resourceId }: { resourceId: string }) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const generateCards = async () => {
    setLoading(true);
    try {
      const authHeaders = await getBackendAuthHeaders();
      const res = await fetch("http://localhost:8000/api/learning/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ resource_id: resourceId }),
      });
      const data = await res.json();
      if (data.flashcards) {
        setCards(data.flashcards);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % cards.length), 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length), 150);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Repeat className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ready to Memorize?</h3>
        <p className="text-white/50 mb-6 text-center max-w-sm">
          Generate AI-powered flashcards from this resource to test your knowledge.
        </p>
        <Button onClick={generateCards} disabled={loading} className="btn-neon text-primary-foreground font-semibold px-8 py-6">
          {loading ? "Synthesizing Cards..." : "Generate Flashcards"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-sm font-medium text-white/40 mb-6 uppercase tracking-widest">
        Card {currentIndex + 1} of {cards.length}
      </div>

      <div className="w-full max-w-2xl aspect-[4/3] cursor-pointer group [perspective:1000px]" onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
          <div className="absolute inset-0 [backface-visibility:hidden] glass-card rounded-3xl flex items-center justify-center p-8 md:p-12 text-center group-hover:border-primary/50">
            <h2 className="text-2xl md:text-4xl font-serif font-semibold text-white leading-tight">
              {cards[currentIndex].question}
            </h2>
          </div>

          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] glass-card rounded-3xl flex items-center justify-center p-8 md:p-12 bg-primary/5 border-primary/30">
            <p className="text-lg md:text-2xl text-white/90 leading-relaxed">{cards[currentIndex].answer}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <Button onClick={prevCard} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white transition-colors">
          Previous
        </Button>
        <Button onClick={() => setIsFlipped(!isFlipped)} className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors">
          Flip Card
        </Button>
        <Button onClick={nextCard} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-white transition-colors">
          Next
        </Button>
      </div>
    </div>
  );
}
