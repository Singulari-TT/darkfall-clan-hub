import { supabaseAdmin } from "./supabase-admin";

/**
 * Sends a generic discord notification. If it's intel-related, it uses the intel webhook.
 */
export async function sendDiscordNotification(message: string, isIntel: boolean = false, imageUrl?: string) {
    let webhookKey = isIntel ? "discord_intel_webhook" : "discord_ops_webhook";

    const { data: setting } = await supabaseAdmin
        .from("Clan_Settings")
        .select("setting_value")
        .eq("setting_key", webhookKey)
        .single();

    const webhookUrl = setting?.setting_value?.url || process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error(`Discord webhook URL is not configured for ${webhookKey}.`);
        return;
    }

    const payload: any = {
        content: message,
    };

    if (isIntel && imageUrl) {
        payload.embeds = [
            {
                title: "New Tactical Intel Logged",
                description: message,
                color: 0x8B0000,
                image: {
                    url: imageUrl,
                },
            },
        ];
        payload.content = ""; // Clear content if embedded
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Failed to send Discord notification: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error sending Discord notification:", error);
    }
}
