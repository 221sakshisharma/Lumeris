"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Network } from "lucide-react";
import { getBackendAuthHeaders } from "@/utils/backend-auth";

type QuizQuestion = {
  question: string;
  options: string[];
  correct_answer: string;
};

const getCanonical = (value: string) => value.trim().toLowerCase();

const stripOptionPrefix = (value: string) =>
  value.replace(/^[A-D][\).\-\s:]+/i, "").trim();

function resolveCorrectOption(question: QuizQuestion): string {
  const raw = question.correct_answer?.trim() ?? "";
  const byLetter = raw.match(/^([A-D])$/i);
  if (byLetter) {
    const index = byLetter[1].toUpperCase().charCodeAt(0) - 65;
    if (index >= 0 && index < question.options.length) {
      return question.options[index];
    }
  }

  const directMatch = question.options.find(
    (opt) => getCanonical(opt) === getCanonical(raw)
  );
  if (directMatch) {
    return directMatch;
  }

  const prefixStrippedRaw = getCanonical(stripOptionPrefix(raw));
  const normalizedMatch = question.options.find(
    (opt) => getCanonical(stripOptionPrefix(opt)) === prefixStrippedRaw
  );
  if (normalizedMatch) {
    return normalizedMatch;
  }

  return raw;
}

export function QuizView({ resourceId }: { resourceId: string }) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const authHeaders = await getBackendAuthHeaders();
      const res = await fetch("http://localhost:8000/api/learning/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ resource_id: resourceId }),
      });
      const data = await res.json();
      if (data.quizzes) {
        setQuestions(data.quizzes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    const correctOption = resolveCorrectOption(questions[currentIndex]);

    if (option === correctOption) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((c) => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Network className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Test Your Understanding</h3>
        <p className="text-white/50 mb-6 text-center max-w-sm">
          Generate a customized multiple-choice quiz based on this resource&apos;s concepts.
        </p>
        <Button onClick={generateQuiz} disabled={loading} className="btn-neon text-primary-foreground font-semibold px-8 py-6">
          {loading ? "Synthesizing Quiz..." : "Generate Quiz"}
        </Button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px]">
        <div className="text-center mb-8">
          <div className="text-6xl font-serif text-primary glow-text font-bold mb-4">
            {Math.round((score / questions.length) * 100)}%
          </div>
          <h3 className="text-2xl text-white font-medium">Quiz Completed</h3>
          <p className="text-white/50 mt-2">
            You scored {score} out of {questions.length}
          </p>
        </div>
        <Button onClick={resetQuiz} className="btn-neon text-primary-foreground px-8">
          Retry Quiz
        </Button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const correctOption = resolveCorrectOption(currentQ);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <span className="text-sm font-medium text-white/40 uppercase tracking-widest">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-sm font-medium text-primary">Score: {score}</span>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-8 mb-8 border-primary/20">
        <h2 className="text-xl md:text-2xl font-serif font-medium text-white leading-relaxed">
          {currentQ.question}
        </h2>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 pb-4">
        {currentQ.options.map((opt, i) => {
          let bgClass = "bg-white/5 border-white/10 hover:bg-white/10 text-white/90";

          if (isAnswered) {
            if (opt === correctOption) {
              bgClass = "bg-green-500/20 border-green-500/50 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
            } else if (opt === selectedOption) {
              bgClass = "bg-red-500/20 border-red-500/50 text-red-300";
            } else {
              bgClass = "bg-white/5 border-white/5 text-white/30 opacity-50";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={isAnswered}
              className={`text-left p-4 md:p-5 rounded-2xl border transition-all duration-300 ${bgClass}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-sm font-bold opacity-70">
                  {String.fromCharCode(65 + i)}
                </div>
                <span className="text-base md:text-lg">{opt}</span>
              </div>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="pt-4 mt-auto border-t border-white/10 flex justify-end">
          <Button onClick={nextQuestion} className="btn-neon px-8">
            {currentIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
          </Button>
        </div>
      )}
    </div>
  );
}
