"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function syncUserToPublicUsers() {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
        return;
    }

    await supabase.from("users").upsert(
        {
            id: userData.user.id,
            email: userData.user.email ?? "",
        },
        { onConflict: "id" }
    );
}

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        throw new Error(error.message);
    }

    await syncUserToPublicUsers();

    revalidatePath("/", "layout");
    redirect("/dashboard");
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    const { data: signupData, error } = await supabase.auth.signUp(data);

    if (error) {
        throw new Error(error.message);
    }

    if (signupData.session && signupData.user) {
        await syncUserToPublicUsers();
        revalidatePath("/", "layout");
        redirect("/dashboard");
    }

    return {
        requiresEmailConfirmation: true,
        email: data.email,
        message: "Check your inbox to confirm your email, then sign in.",
    };
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    redirect("/login");
}
