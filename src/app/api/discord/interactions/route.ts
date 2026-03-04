import { NextRequest, NextResponse } from "next/server";
import { verifyDiscordRequest } from "@/lib/discordAuth";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Setup admin client so bot can read everything
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Handles incoming HTTP Interactions from Discord
 */
export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-signature-ed25519");
    const timestamp = req.headers.get("x-signature-timestamp");
    const clientPublicKey = process.env.DISCORD_PUBLIC_KEY;

    if (!signature || !timestamp || !clientPublicKey) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const rawBody = await req.text();

    const isVerified = await verifyDiscordRequest(rawBody, signature, timestamp, clientPublicKey);
    if (!isVerified) {
        return new NextResponse("Invalid request signature", { status: 401 });
    }

    const interaction = JSON.parse(rawBody);

    // 1. Handle Ping
    if (interaction.type === 1) { // InteractionType.PING
        return NextResponse.json({ type: 1 }); // InteractionResponseType.PONG
    }

    // 2. Handle Application Commands (Slash Commands)
    if (interaction.type === 2) { // InteractionType.APPLICATION_COMMAND
        const data = interaction.data;

        // --- Command: /roster ---
        if (data.name === "roster") {
            try {
                // Find discord ID of the user triggering or target user
                const targetDiscordId = data.options?.[0]?.value || interaction.member.user.id;

                // Query Database
                const { data: userRecord } = await supabaseAdmin
                    .from("Users")
                    .select("id, display_name, role, Characters(character_name, role)")
                    .eq("discord_id", targetDiscordId)
                    .single();

                if (!userRecord) {
                    return NextResponse.json({
                        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                        data: { content: "No Dreadkrew operative found for that user." }
                    });
                }

                // Format nicely
                let charStr = userRecord.Characters?.map((c: any) => `- **${c.character_name}** (${c.role})`).join("\n") || "No declared characters.";

                return NextResponse.json({
                    type: 4,
                    data: {
                        embeds: [{
                            title: `Operative: ${userRecord.display_name}`,
                            description: `**Role:** ${userRecord.role}\n\n**Known Characters:**\n${charStr}`,
                            color: 0x8B0000 // Deep red
                        }]
                    }
                });

            } catch (err) {
                console.error(err);
                return NextResponse.json({ type: 4, data: { content: "Failed to access archives." } });
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
                return NextResponse.json({ type: 4, data: { content: "The Clan Bank currently has no open requests." } });
            }

            let buyOrders = orders.filter(o => o.order_type === 'Buy').map(o => `- Want: ${o.quantity} **${o.item_name}** (${o.price})`).join("\n");
            let sellOrders = orders.filter(o => o.order_type === 'Sell').map(o => `- Selling: ${o.quantity} **${o.item_name}** (${o.price})`).join("\n");

            return NextResponse.json({
                type: 4,
                data: {
                    embeds: [{
                        title: "⚖️ Clan Bank Active Ledger",
                        description: `**Bank Buying:**\n${buyOrders || "None"}\n\n**Bank Selling:**\n${sellOrders || "None"}`,
                        color: 0xC5A059 // Gold
                    }]
                }
            });
        }

        // Unhandled commands fallback
        return NextResponse.json({ type: 4, data: { content: "Unknown command." } });
    }

    return new NextResponse("Unknown interaction type", { status: 400 });
}
