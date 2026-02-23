"use client";

import { createClient } from "@/utils/supabase/client";

export async function getBackendAuthHeaders() {
  const supabase = createClient();

  // Session can be available before getUser resolves on initial client hydration.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let user = session?.user ?? null;

  if (!user) {
    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;
  }

  if (!user) {
    throw new Error("User not authenticated");
  }

  return {
    "x-user-id": user.id,
    "x-user-email": user.email ?? "",
  };
}
