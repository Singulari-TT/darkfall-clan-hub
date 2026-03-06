"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { sendDiscordNotification } from "@/lib/discordWebhook";

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
    is_main: boolean;
    created_at: string;
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
            admin_only,
            is_main: false // Default to false, user can set as main after
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

export async function toggleMain(charId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const lookupField = getIdField(userId);

    // Get the UUID
    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq(lookupField, userId)
        .single();

    if (!userRecord) throw new Error("Unauthorized");

    // 1. Reset all characters for this user to NOT main
    const { error: resetError } = await supabase
        .from("Characters")
        .update({ is_main: false })
        .eq("user_id", userRecord.id);

    if (resetError) throw new Error("Failed to reset main status");

    // 2. Set the target character as main
    const { error: updateError } = await supabase
        .from("Characters")
        .update({ is_main: true })
        .eq("id", charId)
        .eq("user_id", userRecord.id);

    if (updateError) throw new Error("Failed to set new main status");

    // 3. Announce to Discord
    const { data: charData } = await supabase
        .from("Characters")
        .select("name")
        .eq("id", charId)
        .single();

    const { data: userProfile } = await supabase
        .from("Users")
        .select("display_name")
        .eq("id", userRecord.id)
        .single();

    if (charData && userProfile) {
        await sendDiscordNotification(
            `🛡️ **${userProfile.display_name || 'A Member'}** has officially verified their Primary Character: **${charData.name}**. Tactical Dossier updated.`,
            false
        );
    }

    revalidatePath("/profile");
    revalidatePath("/tavern");
    return true;
}

export async function fetchAllMemberIdentities() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    // Admin/Leader check
    const { data: user } = await supabase
        .from("Users")
        .select("role")
        .eq(getIdField(session.user.id), session.user.id)
        .single();

    if (!user || !['Admin', 'Leader', 'Officer'].includes(user.role)) {
        throw new Error("Forbidden: Admin Access Required");
    }

    const { data, error } = await supabase
        .from("Users")
        .select(`
            id,
            discord_id,
            display_name,
            role,
            created_at,
            Characters (
                id,
                name,
                is_main,
                is_visible,
                admin_only
            )
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}
