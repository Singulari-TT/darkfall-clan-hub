"use server"

import { supabase } from "@/lib/supabase";

export async function getOnlineCount() {
    const { count, error } = await supabase
        .from('Characters')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

    if (error) {
        console.error("Error fetching online count:", error);
        return 0;
    }

    return count || 0;
}
