"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Youtube } from "lucide-react";
import { getBackendAuthHeaders } from "@/utils/backend-auth";

type ResourceItem = {
  id: string;
  title: string;
  type: "youtube" | "pdf";
  created_at: string | null;
};

export function ResourceSidebar() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    async function loadResources() {
      try {
        const authHeaders = await getBackendAuthHeaders();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resources`, {
          cache: "no-store",
          headers: authHeaders,
        });
        const data = await res.json();
        if (!cancelled) {
          setResources(Array.isArray(data.resources) ? data.resources : []);
        }
      } catch (error) {
        const isAuthError =
          error instanceof Error && error.message === "User not authenticated";
        if (!isAuthError) {
          console.error("Failed to load resources", error);
        }
        if (!cancelled) {
          setResources([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    async function init() {
      setLoading(true);
      await loadResources();
    }

    const onRefresh = () => {
      loadResources();
    };

    init();
    window.addEventListener("resources:refresh", onRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener("resources:refresh", onRefresh);
    };
  }, []);

  const currentResourceId = pathname?.startsWith("/dashboard/resource/")
    ? pathname.split("/").pop()
    : null;

  if (loading) {
    return <div className="px-2 py-3 text-sm text-white/40">Loading resources...</div>;
  }

  if (resources.length === 0) {
    return <div className="px-2 py-3 text-sm text-white/40">No resources yet.</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {resources.map((resource) => (
        <Link
          key={resource.id}
          href={`/dashboard/resource/${resource.id}`}
          className={`group flex items-center gap-3 p-2 rounded-md transition-colors ${
            currentResourceId === resource.id
              ? "bg-primary/10 text-white"
              : "hover:bg-white/5"
          }`}
        >
          <div
            className={`p-1.5 rounded-md ${
              resource.type === "youtube"
                ? "bg-red-500/20 text-red-400"
                : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {resource.type === "youtube" ? (
              <Youtube className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <span className="text-sm text-white/70 group-hover:text-white truncate font-medium">
            {resource.title}
          </span>
        </Link>
      ))}
    </div>
  );
}
