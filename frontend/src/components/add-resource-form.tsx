"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, FileText, UploadCloud } from "lucide-react";
import { getBackendAuthHeaders } from "@/utils/backend-auth";

export function AddResourceForm() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleYoutubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const authHeaders = await getBackendAuthHeaders();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resources/process-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ url: youtubeUrl }),
      });
      const data = await res.json();
      if (data.resource_id) {
        window.dispatchEvent(new Event("resources:refresh"));
        router.push(`/dashboard/resource/${data.resource_id}`);
      } else {
        alert("Failed to process video");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing video");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const authHeaders = await getBackendAuthHeaders();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resources/process-pdf`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });
      const data = await res.json();
      if (data.resource_id) {
        window.dispatchEvent(new Event("resources:refresh"));
        router.push(`/dashboard/resource/${data.resource_id}`);
      } else {
        alert("Failed to process pdf");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 rounded-3xl">
      <Tabs defaultValue="youtube" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/20 p-1 rounded-xl">
          <TabsTrigger value="youtube" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">
            <Youtube className="w-4 h-4 mr-2" /> YouTube Video
          </TabsTrigger>
          <TabsTrigger value="pdf" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">
            <FileText className="w-4 h-4 mr-2" /> PDF Document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="youtube">
          <form onSubmit={handleYoutubeSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="youtube-url" className="text-white/80">
                YouTube URL
              </Label>
              <Input
                id="youtube-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                required
                className="bg-black/20 border-white/10 text-white focus-visible:ring-primary/50 text-lg py-6"
              />
            </div>
            <Button type="submit" disabled={loading || !youtubeUrl} className="w-full btn-neon font-semibold py-6">
              {loading ? "Processing Video..." : "Synthesize Video"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="pdf">
          <form onSubmit={handlePdfSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label className="text-white/80">Upload PDF</Label>
              <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-primary/50 transition-colors bg-white/5 cursor-pointer flex flex-col items-center justify-center">
                <UploadCloud className="w-12 h-12 text-white/40 mb-4" />
                <p className="text-white/80 font-medium mb-1">Click to upload or drag and drop</p>
                <p className="text-white/50 text-sm mb-4">PDF up to 10MB</p>
                <Input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("pdf-upload")?.click()}
                  className="bg-black/40 border-white/20 hover:bg-white/10 text-white"
                >
                  Select File
                </Button>
                {file && <p className="mt-4 text-primary text-sm font-medium">{file.name}</p>}
              </div>
            </div>
            <Button type="submit" disabled={loading || !file} className="w-full btn-neon font-semibold py-6">
              {loading ? "Processing PDF..." : "Synthesize PDF"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
