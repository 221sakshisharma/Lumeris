"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBackendAuthHeaders } from "@/utils/backend-auth";

export function ChatInterface({ resourceId }: { resourceId: string }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [clearing, setClearing] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChatHistory() {
      setLoadingHistory(true);
      try {
        const authHeaders = await getBackendAuthHeaders();
        const res = await fetch(`http://localhost:8000/api/chat/history/${resourceId}`, {
          cache: "no-store",
          headers: authHeaders,
        });

        if (!res.ok) {
          throw new Error("Failed to load chat history");
        }

        const data = await res.json();
        const parsedMessages = Array.isArray(data.messages)
          ? data.messages
              .filter(
                (message: { role?: string; message?: string }) =>
                  message && (message.role === "user" || message.role === "assistant")
              )
              .map((message: { role: "user" | "assistant"; message: string }) => ({
                role: message.role,
                content: message.message ?? "",
              }))
          : [];

        if (!cancelled) {
          if (parsedMessages.length > 0) {
            setMessages(parsedMessages);
          } else {
            setMessages([
              {
                role: "assistant",
                content: "Hello! I've analyzed this resource. What would you like to know?",
              },
            ]);
          }
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setMessages([
            {
              role: "assistant",
              content: "Hello! I've analyzed this resource. What would you like to know?",
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    loadChatHistory();
    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [messages, loadingReply, loadingHistory]);

  const appendNovelText = (existing: string, incoming: string) => {
    if (!incoming) return existing;
    if (!existing) return incoming;
    if (existing.includes(incoming) || existing.endsWith(incoming)) return existing;
    if (incoming.startsWith(existing)) return incoming;

    const maxOverlap = Math.min(existing.length, incoming.length);
    for (let overlap = maxOverlap; overlap > 0; overlap--) {
      if (existing.endsWith(incoming.slice(0, overlap))) {
        return existing + incoming.slice(overlap);
      }
    }

    return existing + incoming;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loadingReply || loadingHistory) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoadingReply(true);

    try {
      const authHeaders = await getBackendAuthHeaders();
      const res = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ query: userMessage, resource_id: resourceId }),
      });

      if (!res.ok) {
        throw new Error("Chat request failed");
      }
      if (!res.body) throw new Error("No response body");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          newMessages[lastIdx].content = appendNovelText(newMessages[lastIdx].content, chunk);
          return newMessages;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to server." }]);
    } finally {
      setLoadingReply(false);
    }
  };

  const clearChat = async () => {
    if (loadingReply || loadingHistory || clearing) return;

    const confirmed = window.confirm(
      "Clear this chat for this resource? This will permanently delete the conversation history."
    );
    if (!confirmed) return;

    setClearing(true);
    try {
      const authHeaders = await getBackendAuthHeaders();
      const res = await fetch(`http://localhost:8000/api/chat/history/${resourceId}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        throw new Error("Failed to clear chat history");
      }

      setMessages([
        {
          role: "assistant",
          content: "Chat cleared. Ask a new question whenever you're ready.",
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Couldn't clear chat history. Please try again." },
      ]);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 pr-6">
        <div className="flex flex-col gap-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-primary/20 text-white border border-primary/30 rounded-br-none"
                    : "bg-white/5 text-white/90 border border-white/10 rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {(loadingReply || loadingHistory) && (
            <div className="flex justify-start">
              <div className="bg-white/5 text-white/90 border border-white/10 rounded-2xl rounded-bl-none p-4 flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"></span>
                <span
                  className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></span>
                <span
                  className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                ></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 mt-auto">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this document..."
            className="flex-1 h-14 bg-black/40 border-white/10 text-white focus-visible:ring-primary/50 placeholder:text-white/30 rounded-2xl px-4"
          />
          <Button
            type="button"
            variant="outline"
            onClick={clearChat}
            disabled={loadingReply || loadingHistory || clearing}
            className="h-14 w-14 border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-2xl p-0"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            type="submit"
            disabled={!input.trim() || loadingReply || loadingHistory}
            className="btn-neon h-14 w-14 rounded-2xl p-0"
            title="Send"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </Button>
        </form>
      </div>
    </div>
  );
}
