"use server"

import { supabase } from "@/lib/supabase";

export async function getOnlineCount() {
    const { data, error } = await supabase
        .from('SystemConfig')
        .select('value')
        .eq('key', 'members_logged_in')
        .single();

    if (error) {
        // Failing silently to 0 if the table doesn't exist yet
        return 0;
    }

    return data?.value ? parseInt(data.value, 10) : 0;
}
