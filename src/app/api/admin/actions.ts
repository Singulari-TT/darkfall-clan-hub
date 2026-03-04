"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export interface AuditLog {
    id: string;
    action: string;
    resource: string;
    details: string | null;
    created_at: string;
    Users: {
        discord_id: string;
        display_name: string | null;
    } | null;
}

export async function fetchAuditLogs() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        // Verify Admin status
        const { data: user } = await supabase
            .from("Users")
            .select("role")
            .eq("discord_id", session.user.id)
            .single();

        if (user?.role !== "Admin") {
            throw new Error("Unauthorized");
        }

        const { data, error } = await supabase
            .from("Audit_Logs")
            .select(`
                id,
                action,
                resource,
                details,
                created_at,
                Users:user_id (
                    discord_id,
                    display_name
                )
            `)
            .order("created_at", { ascending: false })
            .limit(100);

        if (error) {
            console.error("Error fetching audit logs:", error);
            return [];
        }

        return data as unknown as AuditLog[];
    } catch (e) {
        console.error("Error in fetchAuditLogs:", e);
        return [];
    }
}
