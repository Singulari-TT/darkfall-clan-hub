"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export async function fetchMapMarkers() {
    const { data, error } = await supabaseAdmin
        .from("Map_Markers")
        .select("id, type, lat, lng, created_by")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching map markers:", error);
        return [];
    }
    return data;
}

export async function createMapMarker(type: string, lat: number, lng: number) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized to create map marker");
    }

    const { data, error } = await supabaseAdmin
        .from("Map_Markers")
        .insert({
            type,
            lat,
            lng,
            created_by: session.user.id
        })
        .select()
        .single();

    if (error) {
        console.error("SUPABASE ERROR details:", JSON.stringify(error, null, 2));
        throw new Error("Failed to save map marker: " + error.message);
    }

    return data;
}

export async function deleteMapMarker(id: string) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        throw new Error("Unauthorized to delete map marker");
    }

    // Relying on RLS to ensure they only delete their own markers, or we can check here explicitly
    const { error } = await supabaseAdmin
        .from("Map_Markers")
        .delete()
        .eq("id", id)
        .eq("created_by", session.user.id);

    if (error) {
        console.error("Error deleting map marker:", error);
        throw new Error("Failed to delete map marker");
    }

    return true;
}
