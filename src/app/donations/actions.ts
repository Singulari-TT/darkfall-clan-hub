"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

// Helper to determine if the session user ID is a local UUID or a fallback Discord ID
function getIdField(id: string) {
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    return isUUID ? "id" : "discord_id";
}

export interface LedgerEntry {
    id: string;
    item_name: string;
    quantity: number;
    source: string | null;
    created_at: string;
    Users?: {
        display_name: string | null;
    } | null;
}

export async function fetchLedgerEntries() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) return [];

    // Verify Admin role before returning data out of caution, though RLS protects it
    const { data: userRecord } = await supabase
        .from("Users")
        .select("role")
        .eq(getIdField(session.user.id), session.user.id)
        .single();

    if (!userRecord || !['Admin', 'Leader', 'Officer'].includes(userRecord.role)) {
        return [];
    }

    const { data, error } = await supabase
        .from("Bank_Ledger")
        .select(`
            id,
            item_name,
            quantity,
            source,
            created_at,
            Users (
                display_name
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching ledger:", error);
        return [];
    }

    return data as unknown as LedgerEntry[];
}

export async function addLedgerEntry(itemName: string, quantity: number, source: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    // Get true UUID and Role
    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq(getIdField(session.user.id), session.user.id)
        .single();

    if (!userRecord || !['Admin', 'Leader', 'Officer'].includes(userRecord.role)) {
        throw new Error("Unauthorized: Only Admins can log treasury entries.");
    }

    const { error } = await supabase
        .from("Bank_Ledger")
        .insert({
            item_name: itemName,
            quantity: quantity,
            source: source || null,
            logged_by: userRecord.id
        });

    if (error) {
        console.error("Error adding ledger entry:", error);
        throw new Error("Database insertion failed");
    }

    return { success: true };
}
