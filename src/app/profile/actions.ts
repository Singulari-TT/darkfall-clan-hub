"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

// Helper to determine if the session user ID is a local UUID or a fallback Discord ID
function getIdField(id: string) {
    const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    return isUUID ? "id" : "discord_id";
}

export interface CharacterItem {
    id: string;
    name: string;
    is_visible: boolean;
    admin_only: boolean;
}

export interface UserProfile {
    id: string;
    discord_id: string;
    role: string;
    display_name: string | null;
    bio: string | null;
    Characters: CharacterItem[];
}

export async function fetchMyProfile() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const { data, error } = await supabase
        .from("Users")
        .select(`
            id,
            discord_id,
            role,
            display_name,
            bio,
            Characters (
                id,
                name,
                is_visible,
                admin_only
            )
        `)
        .eq(getIdField(session.user.id), session.user.id)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
        throw new Error("Failed to load profile");
    }

    return data as UserProfile;
}

export async function updateDisplayName(newName: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("Users")
        .update({ display_name: newName })
        .eq(getIdField(session.user.id), session.user.id);

    if (error) {
        console.error("Error updating display name:", error);
        throw new Error("Failed to update name");
    }
    return true;
}

export async function updateBio(newBio: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("Users")
        .update({ bio: newBio })
        .eq(getIdField(session.user.id), session.user.id);

    if (error) {
        console.error("Error updating bio:", error);
        throw new Error("Failed to update bio");
    }
    return true;
}

export async function addCharacter(name: string, is_visible: boolean, admin_only: boolean) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized");
    }

    // Get the UUID first
    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq(getIdField(session.user.id), session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not find database user.");

    const { error } = await supabase
        .from("Characters")
        .insert({
            user_id: userRecord.id,
            name,
            is_visible,
            admin_only
        });

    if (error) {
        console.error("Error adding character:", error);
        throw new Error("Failed to add character");
    }
    return true;
}

export async function deleteCharacter(charId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    // Must ensure they own it!
    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq(getIdField(session.user.id), session.user.id)
        .single();

    if (!userRecord) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("Characters")
        .delete()
        .eq("id", charId)
        .eq("user_id", userRecord.id);

    if (error) {
        console.error("Error deleting character:", error);
        throw new Error("Failed to delete character");
    }
    return true;
}
