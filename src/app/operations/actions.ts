"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { pingDiscordOperations } from "@/lib/discordBot";

export interface ClanOperation {
    id: string;
    title: string;
    description: string;
    event_date: string;
    op_type: string;
    status: string;
    created_by: string;
    created_at: string;
    Users?: {
        display_name: string | null;
    } | null;
}

export interface RSVP {
    id: string;
    operation_id: string;
    user_id: string;
    status: 'Attending' | 'Maybe' | 'Absent';
    character_id: string | null;
    Users?: { display_name: string | null; avatar_url: string | null };
    Characters?: { character_name: string | null; role: string | null };
}

export async function fetchOperations() {
    const { data, error } = await supabase
        .from("Clan_Operations")
        .select(`
            *,
            Users (display_name)
        `)
        .order("event_date", { ascending: true });

    if (error) {
        console.error("Error fetching operations", error);
        return [];
    }

    return data as ClanOperation[];
}

export async function createOperation(title: string, description: string, dateStr: string, type: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord || !['Admin', 'Leader', 'Officer'].includes(userRecord.role)) {
        throw new Error("Only command staff can schedule official operations.");
    }

    const { data: newOp, error } = await supabase
        .from("Clan_Operations")
        .insert({
            title,
            description,
            event_date: dateStr,
            op_type: type,
            created_by: userRecord.id,
            status: 'Scheduled'
        })
        .select()
        .single();

    if (error) throw new Error("Failed to create operation.");

    // Fire the Discord Bot
    await pingDiscordOperations(title, description, dateStr, type);

    return { success: true, operation: newOp };
}

export async function fetchRSVPs(operationId: string) {
    const { data, error } = await supabase
        .from("Operation_RSVPs")
        .select(`
            *,
            Users (display_name, avatar_url),
            Characters (character_name, role)
        `)
        .eq("operation_id", operationId);

    if (error) return [];
    return data as RSVP[];
}

export async function submitRSVP(operationId: string, statusText: 'Attending' | 'Maybe' | 'Absent', characterId?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("User record not found");

    // Check if an RSVP already exists to UPSERT
    const { data: existing } = await supabase
        .from("Operation_RSVPs")
        .select("id")
        .eq("operation_id", operationId)
        .eq("user_id", userRecord.id)
        .single();

    if (existing) {
        const { error } = await supabase
            .from("Operation_RSVPs")
            .update({
                status: statusText,
                character_id: characterId || null
            })
            .eq("id", existing.id);
        if (error) throw new Error("Failed to update RSVP");
    } else {
        const { error } = await supabase
            .from("Operation_RSVPs")
            .insert({
                operation_id: operationId,
                user_id: userRecord.id,
                status: statusText,
                character_id: characterId || null
            });
        if (error) throw new Error("Failed to insert RSVP");
    }

    return { success: true };
}
