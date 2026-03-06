import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://www.riseofagon.com/bans/", {
            next: { revalidate: 300 }
        });

        if (!response.ok) throw new Error("Failed to fetch ban data");

        const html = await response.text();

        // Extract the table rows from <tbody>
        const tbodyRegex = /<tbody>([\s\S]*?)<\/tbody>/;
        const tbodyMatch = html.match(tbodyRegex);

        if (!tbodyMatch) return NextResponse.json({ success: true, data: [] });

        const rowsHtml = tbodyMatch[1];
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;

        const banData: any[] = [];

        let rowMatch;
        while ((rowMatch = rowRegex.exec(rowsHtml)) !== null) {
            const cellsHtml = rowMatch[1];
            const cells: string[] = [];
            let cellMatch;
            while ((cellMatch = cellRegex.exec(cellsHtml)) !== null) {
                cells.push(cellMatch[1].replace(/<[^>]*>/g, '').trim());
            }

            if (cells.length >= 4) {
                banData.push({
                    id: Math.random().toString(36).substr(2, 9),
                    character: cells[0],
                    clan: cells[1] || "None",
                    reason: cells[2],
                    date: cells[3],
                    duration: cells[4] || "Unknown"
                });
            }
        }

        return NextResponse.json({
            success: true,
            data: banData.slice(0, 50)
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
