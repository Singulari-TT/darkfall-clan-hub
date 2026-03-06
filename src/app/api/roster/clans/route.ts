import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("ExternalClanRosters")
            .select("*")
            .order("total_activity", { ascending: false });

        if (error) throw error;

        // Get the most recent last_scanned timestamp
        const lastScanned = data.length > 0
            ? data.reduce((latest, clan) => {
                const scanDate = new Date(clan.last_scanned);
                return scanDate > latest ? scanDate : latest;
            }, new Date(0)).toISOString()
            : null;

        return NextResponse.json({
            success: true,
            clans: data,
            lastScanned
        });

    } catch (error: any) {
        console.error("Fetch Clans Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
