"use server";

import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export interface MarketOrder {
    id: string;
    user_id: string;
    order_type: 'Buy' | 'Sell';
    item_name: string;
    quantity: number;
    price: string;
    status: 'Open' | 'Fulfilled' | 'Cancelled';
    created_at: string;
    Users?: {
        discord_id: string;
        display_name: string | null;
    } | null;
}

export async function fetchMarketOrders() {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const { data, error } = await supabase
        .from("Market_Orders")
        .select(`
            id,
            user_id,
            order_type,
            item_name,
            quantity,
            price,
            status,
            created_at,
            Users (
                discord_id,
                display_name
            )
        `)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching market orders:", error);
        return [];
    }

    return data as unknown as MarketOrder[];
}

export async function createMarketOrder(orderType: 'Buy' | 'Sell', itemName: string, quantity: number, price: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Could not find user.");

    const { error } = await supabase
        .from("Market_Orders")
        .insert({
            user_id: userRecord.id,
            order_type: orderType,
            item_name: itemName,
            quantity,
            price,
            status: 'Open'
        });

    if (error) {
        console.error("Error creating market order:", error);
        throw new Error("Failed to create order");
    }

    return true;
}

export async function updateOrderStatus(orderId: string, newStatus: 'Open' | 'Fulfilled' | 'Cancelled') {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    // Look up true UUID and role
    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Unauthorized");

    // Get the order to check ownership
    const { data: order } = await supabase
        .from("Market_Orders")
        .select("user_id")
        .eq("id", orderId)
        .single();

    if (!order) throw new Error("Order not found");

    if (order.user_id !== userRecord.id && userRecord.role !== 'Admin') {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("Market_Orders")
        .update({ status: newStatus })
        .eq("id", orderId);

    if (error) {
        console.error("Error updating order status:", error);
        throw new Error("Failed to update status");
    }

    return true;
}

export async function deleteMarketOrder(orderId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord) throw new Error("Unauthorized");

    const { data: order } = await supabase
        .from("Market_Orders")
        .select("user_id")
        .eq("id", orderId)
        .single();

    if (!order) throw new Error("Order not found");

    if (order.user_id !== userRecord.id && userRecord.role !== 'Admin') {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("Market_Orders")
        .delete()
        .eq("id", orderId);

    if (error) {
        console.error("Error deleting order:", error);
        throw new Error("Failed to delete order");
    }

    return true;
}

export async function sendOrderToDiscord(orderId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) throw new Error("Unauthorized");

    // Verify Admin
    const { data: userRecord } = await supabase
        .from("Users")
        .select("id, role")
        .eq("discord_id", session.user.id)
        .single();

    if (!userRecord || userRecord.role !== 'Admin') throw new Error("Unauthorized: Admin clearance required.");

    // Fetch Order details
    const { data: order } = await supabase
        .from("Market_Orders")
        .select("*, Users(display_name)")
        .eq("id", orderId)
        .single();

    if (!order) throw new Error("Order not found");

    // Fetch Webhook
    // Need service role bypass since Clan_Settings might not be public
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdminLocal = createClient(supabaseUrl, supabaseKey);

    const { data: setting } = await supabaseAdminLocal
        .from("Clan_Settings")
        .select("setting_value")
        .eq("setting_key", "discord_market_webhook")
        .single();

    const webhookUrl = setting?.setting_value?.url;
    if (!webhookUrl) return { error: "Discord Webhook not configured. Visit Admin Settings." };

    // Send to Discord
    const embedColor = order.order_type === 'Buy' ? 0x10B981 : 0xF43F5E; // Emerald or Rose

    const payload = {
        embeds: [{
            title: `⚖️ ${order.order_type === 'Buy' ? 'Bank Wants to Buy' : 'Bank is Selling'}`,
            description: `A new logistics order requires attention!`,
            color: embedColor,
            fields: [
                { name: "Item Needed", value: order.item_name, inline: true },
                { name: "Quantity", value: order.quantity.toString(), inline: true },
                { name: "Price / Reward", value: order.price, inline: true },
                { name: "Contact", value: order.Users?.display_name || "The Banker", inline: false }
            ],
            footer: {
                text: "Dreadkrew Logistics Hub"
            },
            timestamp: new Date().toISOString()
        }]
    };

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.error("Discord webhook failed", await res.text());
        return { error: "Failed to ping Discord. Is the webhook URL valid?" };
    }

    return { success: true };
}
