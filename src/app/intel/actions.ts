"use server";

import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { sendDiscordNotification } from "@/lib/discordWebhook";

export async function submitIntel(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const file = formData.get("image") as File | null;
    const description = formData.get("description") as string;
    const clanName = formData.get("clan_name") as string | null;

    // Check if either file OR description is provided
    const hasFile = file && file.size > 0 && file.name !== 'undefined';
    const hasDescription = description && description.trim().length > 0;

    if (!hasFile && !hasDescription) {
        throw new Error("You must provide either visual evidence or a tactical description.");
    }

    try {
        // 1. Ensure the 'images' bucket exists to prevent upload crashes on new setups
        await supabaseAdmin.storage.createBucket('images', { public: true }).catch(() => { });

        let imageUrl = "";

        // 2. Upload the image if one was provided
        if (hasFile) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
            const filePath = `intel/${fileName}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                throw new Error(`Failed to upload image: ${uploadError.message}`);
            }

            const { data: publicUrlData } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            imageUrl = publicUrlData.publicUrl;
        }

        // 3. Create the Intel record in the database
        const { error: dbError } = await supabase
            .from("Intel")
            .insert({
                user_id: session.user.id,
                image_url: imageUrl,
                description: description || "No description provided",
                clan_name: clanName
            });


        if (dbError) {
            throw new Error("Failed to save Intel record to database");
        }

        // 4. Send the Discord Webhook notification
        const submitterName = session.user.name || "A Clan Member";
        await sendDiscordNotification(
            `**${submitterName}** has submitted new Tactical Intel!\n> ${description || "No description provided"}`,
            true,
            imageUrl || undefined
        );

        return { success: true };

    } catch (error: any) {
        console.error("Error submitting intel:", error);
        return { success: false, error: error.message || "An unknown error occurred" };
    }
}

export async function submitLootpack(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized");
    }

    const file = formData.get("image") as File;
    const value = parseInt(formData.get("value") as string) || 0;

    if (!file) {
        return { success: false, error: "No image provided" };
    }

    // Get true UUID
    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) return { success: false, error: "User not found" };

    try {
        await supabaseAdmin.storage.createBucket('images', { public: true }).catch(() => { });

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `lootpacks/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        const d = new Date();
        const weekIdentifier = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}-M${d.getMonth()}`;

        const { error: dbError } = await supabase
            .from("Lootpack_Submissions")
            .insert({
                user_id: userRecord.id,
                image_url: publicUrlData.publicUrl,
                value: value,
                week_identifier: weekIdentifier
            });

        if (dbError) throw new Error("Failed to save submission");

        return { success: true };

    } catch (error: any) {
        console.error("Error submitting lootpack:", error);
        return { success: false, error: error.message || "An unknown error occurred" };
    }
}

export async function fetchWeeklyLootpackLeaderboard() {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const d = new Date();
    const weekIdentifier = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}-M${d.getMonth()}`;

    const { data, error } = await supabase
        .from("Lootpack_Submissions")
        .select(`
            id,
            image_url,
            value,
            created_at,
            Users ( display_name )
        `)
        .eq("week_identifier", weekIdentifier)
        .order("value", { ascending: false });

    if (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }

    return data;
}
