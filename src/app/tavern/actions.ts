"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export type TavernPost = {
    id: string;
    author_discord_id: string;
    author_name: string;
    message: string;
    color: string;
    created_at: string;
};

export async function fetchTavernPosts(): Promise<TavernPost[]> {
    const { data, error } = await supabase
        .from("tavern_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("fetchTavernPosts error:", error);
        return [];
    }
    return data || [];
}

export async function createTavernPost(message: string, color: string): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };
    if (!message?.trim()) return { success: false, error: "Message is empty." };
    if (message.trim().length > 280) return { success: false, error: "Max 280 characters." };

    const authorName = (session.user as any).displayName || session.user.name || "Anonymous";

    const { error } = await supabase.from("tavern_posts").insert({
        author_discord_id: session.user.id,
        author_name: authorName,
        message: message.trim(),
        color,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath("/tavern");
    return { success: true };
}

export async function deleteTavernPost(id: string): Promise<{ success: boolean; error?: string }> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Not authenticated." };

    const isAdmin = (session.user as any).role === "Admin";

    // Only allow deleting own posts (or admin can delete any)
    const query = supabase.from("tavern_posts").delete().eq("id", id);
    if (!isAdmin) query.eq("author_discord_id", session.user.id);

    const { error } = await query;
    if (error) return { success: false, error: error.message };
    revalidatePath("/tavern");
    return { success: true };
}
