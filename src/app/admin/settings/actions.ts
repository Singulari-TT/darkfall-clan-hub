"use server";

import { supabaseAdmin } from "@/lib/supabase-admin"; // Use admin bypass since config is secure
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";

async function verifyAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: user } = await supabaseAdmin
        .from("Users")
        .select("role")
        .eq("discord_id", session.user.id)
        .single();

    if (user?.role !== "Admin") throw new Error("Unauthorized: Admin clearance required.");
}

export async function fetchSystemSettings() {
    await verifyAdmin();

    const { data, error } = await supabaseAdmin
        .from("Clan_Settings")
        .select("*")
        .in("setting_key", ["discord_market_webhook", "discord_ops_webhook", "discord_intel_webhook"]);

    if (error) {
        console.error("Error fetching settings:", error);
        return { market: "", ops: "", intel: "" };
    }

    const settings: Record<string, string> = { market: "", ops: "", intel: "" };
    data?.forEach(row => {
        if (row.setting_key === "discord_market_webhook") settings.market = row.setting_value?.url || "";
        if (row.setting_key === "discord_ops_webhook") settings.ops = row.setting_value?.url || "";
        if (row.setting_key === "discord_intel_webhook") settings.intel = row.setting_value?.url || "";
    });

    return settings;
}

export async function updateSystemSettings(marketUrl: string, opsUrl: string, intelUrl: string) {
    await verifyAdmin();

    const updates = [
        { setting_key: "discord_market_webhook", setting_value: { url: marketUrl } },
        { setting_key: "discord_ops_webhook", setting_value: { url: opsUrl } },
        { setting_key: "discord_intel_webhook", setting_value: { url: intelUrl } }
    ];

    for (const update of updates) {
        const { error } = await supabaseAdmin
            .from("Clan_Settings")
            .upsert(update, { onConflict: "setting_key" });

        if (error) {
            console.error(`Error saving setting ${update.setting_key}:`, error);
            throw new Error(`Failed to save ${update.setting_key}`);
        }
    }

    return true;
}
