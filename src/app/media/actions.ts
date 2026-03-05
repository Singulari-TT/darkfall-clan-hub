"use server"

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function hideMedia(youtubeId: string, hiddenBy: string) {
    if (!youtubeId || !hiddenBy) {
        return { success: false, error: "Missing required fields" };
    }

    const { error } = await supabase
        .from('Hidden_Media')
        .insert({
            youtube_id: youtubeId,
            hidden_by: hiddenBy
        });

    if (error) {
        console.error("Error hiding media:", error);
        return { success: false, error: error.message };
    }

    // Force Next.js to re-fetch the youtube proxy route on the next load
    revalidatePath('/media');

    return { success: true };
}
