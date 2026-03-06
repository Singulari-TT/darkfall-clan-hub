"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { sendDiscordNotification } from "@/lib/discordWebhook";

// Helper to determine if the session user ID is a local UUID or a fallback Discord ID
function getIdField(id: string) {
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    return isUUID ? "id" : "discord_id";
}

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

export interface TournamentMatch {
    id: string;
    tournament_id: string;
    round: number;
    match_number: number;
    player1_id: string | null;
    player2_id: string | null;
    winner_id: string | null;
    player1_score: number;
    player2_score: number;
    next_match_id: string | null;
    created_at: string;
    // UI helpers
    player1_name?: string;
    player2_name?: string;
    winner_name?: string;
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

    // Get user from DB
    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq(getIdField(session.user.id), session.user.id)
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
        .eq(getIdField(session.user.id), session.user.id)
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
        .eq(getIdField(session.user.id), session.user.id)
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
        .eq(getIdField(session.user.id), session.user.id)
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
        .eq(getIdField(session.user.id), session.user.id)
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
        .eq(getIdField(session.user.id), session.user.id)
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
        .eq(getIdField(session.user.id), session.user.id)
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

// ── Matches: Fetch all for bracket ──────────────────────────────────────────
export async function fetchMatches(tournamentId: string): Promise<TournamentMatch[]> {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("Unauthorized");

    const { data, error } = await supabase
        .from("Tournament_Matches")
        .select(`
            *,
            p1:Tournament_Participants!player1_id ( character_name, Users ( display_name ) ),
            p2:Tournament_Participants!player2_id ( character_name, Users ( display_name ) )
        `)
        .eq("tournament_id", tournamentId)
        .order("round", { ascending: true })
        .order("match_number", { ascending: true });

    if (error) {
        console.error("Error fetching matches:", error);
        return [];
    }

    return (data as any[]).map((m) => ({
        ...m,
        player1_name: m.p1?.Users?.display_name ?? m.p1?.character_name ?? "TBD",
        player2_name: m.p2?.Users?.display_name ?? m.p2?.character_name ?? "TBD",
    })) as TournamentMatch[];
}

// ── Matches: Generate Brackets ──────────────────────────────────────────────
export async function generateBrackets(tournamentId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Verify creator
    const { data: userRecord } = await supabase.from("Users").select("id").eq(getIdField(session.user.id), session.user.id).single();
    const { data: t } = await supabase.from("Tournaments").select("created_by, format").eq("id", tournamentId).single();
    if (t?.created_by !== userRecord?.id) throw new Error("Only the creator can generate brackets.");
    if (t?.format === "Free For All") throw new Error("FFA tournaments do not use brackets.");

    // 2. Fetch participants and shuffle
    const { data: participants } = await supabase.from("Tournament_Participants").select("id").eq("tournament_id", tournamentId);
    if (!participants || participants.length < 2) throw new Error("Need at least 2 participants.");

    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // 3. Simple Power-of-2 logic (4, 8, 16)
    // For now, we'll implement a clean single-elimination.
    // We determine how many rounds are needed.
    const numParticipants = shuffled.length;
    let rounds = Math.ceil(Math.log2(numParticipants));
    const bracketSize = Math.pow(2, rounds); // Next power of 2

    // Create match structure
    // Round 1 matches, then round 2, etc.
    const allMatchIds: string[] = [];

    // We work backwards from the final to set up next_match_id
    // Round X: 1 match (Final)
    // Round X-1: 2 matches
    // Round 1: N/2 matches

    let currentRoundMatches: any[] = [];
    let previousRoundMatches: any[] = []; // Matches in the round we just created (higher round number)

    for (let r = rounds; r >= 1; r--) {
        const matchesInRound = Math.pow(2, rounds - r);
        const roundData = [];

        for (let m = 0; m < matchesInRound; m++) {
            const nextMatchIndex = Math.floor(m / 2);
            const nextMatchId = previousRoundMatches[nextMatchIndex]?.id || null;

            const { data: match, error } = await supabase
                .from("Tournament_Matches")
                .insert({
                    tournament_id: tournamentId,
                    round: r,
                    match_number: m,
                    next_match_id: nextMatchId
                })
                .select("id")
                .single();

            if (error) throw new Error("Failed to initialize bracket structure.");
            roundData.push(match);
        }
        previousRoundMatches = roundData;
        if (r === 1) currentRoundMatches = roundData; // Save round 1 for seed mapping
    }

    // 4. Seed Round 1
    // Map participants to round 1 matches
    for (let i = 0; i < shuffled.length; i++) {
        const matchIndex = Math.floor(i / 2);
        const isPlayer2 = i % 2 === 1;
        const matchId = currentRoundMatches[matchIndex].id;

        const updateField = isPlayer2 ? 'player2_id' : 'player1_id';
        await supabase.from("Tournament_Matches").update({ [updateField]: shuffled[i].id }).eq("id", matchId);
    }

    return true;
}

// ── Matches: Update Result ───────────────────────────────────────────────────
export async function updateMatchResult(matchId: string, winnerId: string, p1Score: number, p2Score: number) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { data: match } = await supabase.from("Tournament_Matches").select("*").eq("id", matchId).single();
    if (!match) throw new Error("Match not found.");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq(getIdField(session.user.id), session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not authorize user.");

    const { data: t } = await supabase
        .from("Tournaments")
        .select("created_by")
        .eq("id", match.tournament_id)
        .single();

    const isCreator = t?.created_by === userRecord.id;
    const isAdmin = userRecord.role === "Admin";

    if (!isCreator && !isAdmin) {
        throw new Error("Unauthorized: Only the tournament creator or an administrator can report results.");
    }

    // Update the match
    const { error } = await supabase
        .from("Tournament_Matches")
        .update({
            winner_id: winnerId,
            player1_score: p1Score,
            player2_score: p2Score
        })
        .eq("id", matchId);

    if (error) throw new Error("Failed to update match result.");

    // Push winner to next match if exists
    if (match.next_match_id) {
        // Need to know if this match was the 'top' or 'bottom' feeder for the next match
        // match_number 0 feeds next_match P1, 1 feeds next_match P2, 2 feeds next_match_id-2 P1, etc.
        const isP2Feeder = match.match_number % 2 === 1;
        const nextField = isP2Feeder ? 'player2_id' : 'player1_id';

        await supabase
            .from("Tournament_Matches")
            .update({ [nextField]: winnerId })
            .eq("id", match.next_match_id);
    }

    return true;
}
