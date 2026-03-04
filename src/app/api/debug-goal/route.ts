import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    console.log("TEST ROUTE HIT: Proceeding to Goal Insert...");

    const { data, error } = await supabase
        .from("Clan_Goals")
        .insert({
            title: "Phase 3 Verified",
            description: "The Database Schema is absolutely flawless now.",
            priority: "Critical",
            status: "Not Started",
            created_by: "11111111-2222-3333-4444-555555555555"
        })
        .select("*");

    if (error) {
        console.error("RAW SUPABASE ERROR:", error);
        return NextResponse.json({ success: false, error }, { status: 500 });
    }

    console.log("INSERT SUCCESSFUL!");
    return NextResponse.json({ success: true, data });
}
