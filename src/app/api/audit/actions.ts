"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function logActivity(action: string, resource: string, details?: string) {
    try {
        const session = await getServerSession(authOptions);

        // Don't log anonymous traffic
        if (!session?.user?.id) return;

        // Get the internal UUID for the user
        const { data: user } = await supabase
            .from("Users")
            .select("id")
            .eq("discord_id", session.user.id)
            .single();

        if (!user) return;

        const { error } = await supabase
            .from("Audit_Logs")
            .insert({
                user_id: user.id,
                action,
                resource,
                details: details || null
            });

        if (error) {
            console.error("Failed to insert audit log:", error);
        }
    } catch (e) {
        console.error("Error in logActivity:", e);
    }
}
