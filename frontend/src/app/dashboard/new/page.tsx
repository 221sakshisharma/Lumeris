import { AddResourceForm } from "@/components/add-resource-form";

export default function NewResourcePage() {
  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-white mb-2">Start Learning</h1>
        <p className="text-white/60">
          Paste a YouTube link or upload a PDF to generate flashcards, quizzes, and tutor-ready notes.
        </p>
      </div>

      <AddResourceForm />
    </div>
  );
}
