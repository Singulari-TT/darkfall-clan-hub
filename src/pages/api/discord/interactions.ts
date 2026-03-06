import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDiscordRequest } from "@/lib/discordAuth";
import { supabaseAdmin } from "@/lib/supabase-admin";

// We need to disable the default Next.js body parser so we can verify the raw cryptogrpahic signature
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send("Method Not Allowed");
    }

    const signature = req.headers["x-signature-ed25519"] as string;
    const timestamp = req.headers["x-signature-timestamp"] as string;
    const clientPublicKey = process.env.DISCORD_PUBLIC_KEY;

    if (!signature || !timestamp || !clientPublicKey) {
        return res.status(401).send("Unauthorized");
    }

    // Read raw body streams into string
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');

    const isVerified = await verifyDiscordRequest(rawBody, signature, timestamp, clientPublicKey);
    if (!isVerified) {
        return res.status(401).send("Invalid request signature");
    }

    const interaction = JSON.parse(rawBody);

    // 1. Handle Ping
    if (interaction.type === 1) {
        return res.status(200).json({ type: 1 });
    }

    // 2. Handle Application Commands (Slash Commands)
    if (interaction.type === 2) {
        const data = interaction.data;

        // --- Command: /roster ---
        if (data.name === "roster") {
            try {
                const targetDiscordId = data.options?.[0]?.value || interaction.member.user.id;

                const { data: userRecord } = await supabaseAdmin
                    .from("Users")
                    .select("id, display_name, role, Characters(character_name, role)")
                    .eq("discord_id", targetDiscordId)
                    .single();

                if (!userRecord) {
                    return res.status(200).json({
                        type: 4,
                        data: { content: "No Dreadkrew member found for that user." }
                    });
                }

                let charStr = userRecord.Characters?.map((c: any) => `- **${c.character_name}** (${c.role})`).join("\n") || "No declared characters.";

                return res.status(200).json({
                    type: 4,
                    data: {
                        embeds: [{
                            title: `Member: ${userRecord.display_name}`,
                            description: `**Role:** ${userRecord.role}\n\n**Known Characters:**\n${charStr}`,
                            color: 0x8B0000
                        }]
                    }
                });
            } catch (err) {
                console.error(err);
                return res.status(200).json({ type: 4, data: { content: "Failed to access archives." } });
            }
        }

        // --- Command: /market ---
        if (data.name === "market") {
            const { data: orders } = await supabaseAdmin
                .from("Market_Orders")
                .select("item_name, quantity, price, order_type")
                .eq("status", "Open")
                .order("created_at", { ascending: false })
                .limit(10);

            if (!orders || orders.length === 0) {
                return res.status(200).json({ type: 4, data: { content: "The Clan Bank currently has no open requests." } });
            }

            let buyOrders = orders.filter(o => o.order_type === 'Buy').map(o => `- Want: ${o.quantity} **${o.item_name}** (${o.price})`).join("\n");
            let sellOrders = orders.filter(o => o.order_type === 'Sell').map(o => `- Selling: ${o.quantity} **${o.item_name}** (${o.price})`).join("\n");

            return res.status(200).json({
                type: 4,
                data: {
                    embeds: [{
                        title: "⚖️ Clan Bank Active Ledger",
                        description: `**Bank Buying:**\n${buyOrders || "None"}\n\n**Bank Selling:**\n${sellOrders || "None"}`,
                        color: 0xC5A059
                    }]
                }
            });
        }

        return res.status(200).json({ type: 4, data: { content: "Unknown command." } });
    }

    return res.status(400).send("Unknown interaction type");
}
