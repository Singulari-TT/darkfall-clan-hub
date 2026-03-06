import { NextResponse } from "next/server";

export async function GET() {
    try {
        // We use a POST request to the heatmap page with 'foo=bar' to trigger the JSON response
        const response = await fetch("https://www.riseofagon.com/agonmetrics/pvp/heatmap/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "foo=bar",
            next: { revalidate: 3600 } // Heatmap data doesn't change extremely fast, cache for 1 hour
        });

        if (!response.ok) throw new Error("Failed to fetch heatmap data");

        const data = await response.json();

        return NextResponse.json({
            success: true,
            ganks: data.ganks || []
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
