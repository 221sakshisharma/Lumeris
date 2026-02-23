import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Layers, BrainCircuit } from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";
import { FlashcardView } from "@/components/flashcard-view";
import { QuizView } from "@/components/quiz-view";
import { createClient } from "@/utils/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResourcePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let resourceTitle = "Resource";
  let resourceType = "resource";
  let createdLabel = "Added recently";

  if (user) {
    try {
      const response = await fetch(`http://localhost:8000/api/resources/${id}`, {
        cache: "no-store",
        headers: {
          "x-user-id": user.id,
          "x-user-email": user.email ?? "",
        },
      });

      if (response.ok) {
        const resource = await response.json();
        resourceTitle = resource.title || resourceTitle;
        resourceType = resource.type || resourceType;
        if (resource.created_at) {
          createdLabel = `Added ${new Date(resource.created_at).toLocaleDateString()}`;
        }
      }
    } catch (error) {
      console.error("Failed to load resource", error);
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="p-6 border-b border-white/10 bg-background/50 backdrop-blur-sm sticky top-0 z-10 flex flex-col gap-2 shadow-md">
        <div className="flex items-center gap-3">
          <div className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
            {resourceType}
          </div>
          <span className="text-white/50 text-sm">{createdLabel}</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-white truncate pr-10">{resourceTitle}</h1>
      </header>

      <div className="flex-1 overflow-hidden p-6">
        <Tabs defaultValue="chat" className="h-full flex flex-col w-full max-w-5xl mx-auto">
          <TabsList className="grid !h-auto w-full grid-cols-3 mb-6 bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1">
            <TabsTrigger value="chat" className="rounded-xl h-11 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all py-0">
              <MessageSquare className="w-4 h-4 mr-2" /> Synth Chat
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="rounded-xl h-11 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all py-0">
              <Layers className="w-4 h-4 mr-2" /> Flashcards
            </TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-xl h-11 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all py-0">
              <BrainCircuit className="w-4 h-4 mr-2" /> Practice Quiz
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 relative overflow-hidden bg-white/5 border border-white/10 rounded-3xl shadow-inner backdrop-blur-xl">
            <TabsContent value="chat" className="h-[calc(100%-2rem)] m-4 data-[state=active]:flex flex-col">
              <ChatInterface resourceId={id} />
            </TabsContent>

            <TabsContent value="flashcards" className="h-[calc(100%-2rem)] m-4 data-[state=active]:flex flex-col">
              <FlashcardView resourceId={id} />
            </TabsContent>

            <TabsContent value="quiz" className="h-[calc(100%-2rem)] m-4 data-[state=active]:flex flex-col overflow-y-auto">
              <QuizView resourceId={id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
