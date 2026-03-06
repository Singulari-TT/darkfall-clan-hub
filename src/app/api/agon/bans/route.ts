import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://www.riseofagon.com/bans/", {
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) throw new Error("Failed to fetch ban data");

        const html = await response.text();

        // Parsing logic to be added

        return NextResponse.json({
            success: true,
            data: [], // Actual scraping logic to be refined
            rawHtmlSnippet: html.substring(0, 1000)
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
