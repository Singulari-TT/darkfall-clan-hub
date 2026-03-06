"use server"

import { supabase } from "@/lib/supabase";
import { unstable_noStore as noStore } from "next/cache";

export async function getOnlineCount() {
    noStore();
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

export async function getLastSyncTime() {
    noStore();
    const { data } = await supabase
        .from('SystemConfig')
        .select('updated_at')
        .eq('key', 'members_logged_in')
        .single();

    return data?.updated_at || null;
}
