import { supabaseAdmin } from "./supabase-admin";

/**
 * Sends a rich embed to the configured Operations webhook when a new Siege/Event is scheduled
 */
export async function pingDiscordOperations(title: string, description: string, dateStr: string, type: string) {
    const { data: setting } = await supabaseAdmin
        .from("Clan_Settings")
        .select("setting_value")
        .eq("setting_key", "discord_ops_webhook")
        .single();

    const webhookUrl = setting?.setting_value?.url || process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const embedColor = type === 'Siege' ? 0xFF0000 : (type === 'PvE' ? 0x00FF00 : 0x800080);

    // We can also @here or &role if they have standard tags
    const payload = {
        content: "@here **NEW OPERATION DECLARED**",
        embeds: [{
            title: `⚔️ ${title}`,
            description: `${description}\n\n**Time:** ${new Date(dateStr).toLocaleString()}`,
            color: embedColor,
            fields: [
                { name: "Op Type", value: type, inline: true },
                { name: "Orders", value: "Acknowledge attendance on the Clan Hub Operations Board.", inline: false }
            ]
        }]
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.error("Failed to ping ops webhook:", err);
    }
}
