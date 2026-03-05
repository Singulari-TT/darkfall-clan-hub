"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export interface Tournament {
    id: string;
    name: string;
    description: string | null;
    format: "Free For All" | "1v1" | "Team";
    status: "Open" | "In Progress" | "Ended";
    prize: string | null;
    created_by: string | null;
    created_at: string;
    starts_at: string | null;
    participant_count?: number;
    creator_name?: string;
}

export interface TournamentParticipant {
    id: string;
    tournament_id: string;
    user_id: string;
    character_name: string;
    registered_at: string;
    placement: number | null;
    display_name?: string;
}

// ── Fetch all tournaments ──────────────────────────────────────────────────────
export async function fetchTournaments(): Promise<Tournament[]> {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("Tournaments")
        .select(`
            *,
            Tournament_Participants (count),
            Users ( display_name )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching tournaments:", error);
        return [];
    }

    return (data as any[]).map((t) => ({
        ...t,
        participant_count: t.Tournament_Participants?.[0]?.count ?? 0,
        creator_name: t.Users?.display_name ?? "Unknown",
    })) as Tournament[];
}

// ── Fetch single tournament with participants ──────────────────────────────────
export async function fetchTournamentById(id: string): Promise<{
    tournament: Tournament | null;
    participants: TournamentParticipant[];
    currentUserId: string | null;
}> {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const { data: tData, error: tErr } = await supabase
        .from("Tournaments")
        .select(`*, Users ( display_name )`)
        .eq("id", id)
        .single();

    if (tErr || !tData) {
        return { tournament: null, participants: [], currentUserId: null };
    }

    const { data: pData } = await supabase
        .from("Tournament_Participants")
        .select(`*, Users ( display_name )`)
        .eq("tournament_id", id)
        .order("placement", { ascending: true, nullsFirst: false });

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    const tournament: Tournament = {
        ...tData,
        creator_name: tData.Users?.display_name ?? "Unknown",
    };

    const participants: TournamentParticipant[] = (pData || []).map((p: any) => ({
        ...p,
        display_name: p.Users?.display_name ?? p.character_name,
    }));

    return {
        tournament,
        participants,
        currentUserId: userRecord?.id ?? null,
    };
}

// ── Create a tournament (any authenticated member) ────────────────────────────
export async function createTournament(
    name: string,
    description: string,
    format: string,
    prize: string,
    starts_at: string
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    const { data, error } = await supabase
        .from("Tournaments")
        .insert({
            name,
            description: description || null,
            format,
            prize: prize || null,
            starts_at: starts_at || null,
            status: "Open",
            created_by: userRecord.id,
        })
        .select("*")
        .single();

    if (error) throw new Error("Failed to create tournament.");
    return data as Tournament;
}

// ── Join a tournament ──────────────────────────────────────────────────────────
export async function joinTournament(tournamentId: string, characterName: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    const { error } = await supabase.from("Tournament_Participants").insert({
        tournament_id: tournamentId,
        user_id: userRecord.id,
        character_name: characterName,
    });

    if (error) {
        if (error.code === "23505") throw new Error("You are already registered.");
        throw new Error("Failed to join tournament.");
    }
    return true;
}

// ── Leave a tournament ────────────────────────────────────────────────────────
export async function leaveTournament(tournamentId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    const { error } = await supabase
        .from("Tournament_Participants")
        .delete()
        .eq("tournament_id", tournamentId)
        .eq("user_id", userRecord.id);

    if (error) throw new Error("Failed to leave tournament.");
    return true;
}

// ── Update tournament status (creator or admin) ───────────────────────────────
export async function updateTournamentStatus(tournamentId: string, status: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    const { data: t } = await supabase
        .from("Tournaments")
        .select("created_by")
        .eq("id", tournamentId)
        .single();

    const isCreator = t?.created_by === userRecord.id;
    const isAdmin = userRecord.role === "Admin";
    if (!isCreator && !isAdmin) throw new Error("Not authorized.");

    const { error } = await supabase
        .from("Tournaments")
        .update({ status })
        .eq("id", tournamentId);

    if (error) throw new Error("Failed to update status.");
    return true;
}

// ── Delete tournament (creator or admin) ──────────────────────────────────────
export async function deleteTournament(tournamentId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    const { data: t } = await supabase
        .from("Tournaments")
        .select("created_by")
        .eq("id", tournamentId)
        .single();

    const isCreator = t?.created_by === userRecord.id;
    const isAdmin = userRecord.role === "Admin";
    if (!isCreator && !isAdmin) throw new Error("Not authorized.");

    const { error } = await supabase.from("Tournaments").delete().eq("id", tournamentId);
    if (error) throw new Error("Failed to delete tournament.");
    return true;
}

// ── Set participant placement (creator or admin, after tournament ends) ────────
export async function setPlacement(participantId: string, placement: number | null) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    // Check if requester is the tournament creator
    const { data: p } = await supabase
        .from("Tournament_Participants")
        .select("tournament_id")
        .eq("id", participantId)
        .single();

    if (!p) throw new Error("Participant not found.");

    const { data: t } = await supabase
        .from("Tournaments")
        .select("created_by")
        .eq("id", p.tournament_id)
        .single();

    const isCreator = t?.created_by === userRecord.id;
    const isAdmin = userRecord.role === "Admin";
    if (!isCreator && !isAdmin) throw new Error("Not authorized.");

    const { error } = await supabase
        .from("Tournament_Participants")
        .update({ placement })
        .eq("id", participantId);

    if (error) throw new Error("Failed to set placement.");
    return true;
}
