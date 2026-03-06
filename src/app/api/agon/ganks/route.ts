import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://www.riseofagon.com/agonmetrics/pvp/global/", {
            next: { revalidate: 60 }
        });

        if (!response.ok) throw new Error("Failed to fetch gank data");

        const html = await response.text();

        // Regex to find table rows and extract data
        const gankRowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>(.*?)<\/td>[\s\S]*?<td[^>]*class="killer-cell"[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*class="victim-cell"[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/g;

        const nameRegex = /class="character-name"[^>]*>(.*?)<\/span>/;
        const clanRegex = /class="clan-tag"[^>]*>[\s\S]*?>(.*?)<\/a>/;

        const gankData: any[] = [];

        let match;
        while ((match = gankRowRegex.exec(html)) !== null) {
            const [_, timeStr, killerHtml, victimHtml] = match;

            const extractInfo = (cellHtml: string) => {
                const nameMatch = cellHtml.match(nameRegex);
                const clanMatch = cellHtml.match(clanRegex);
                const name = nameMatch ? nameMatch[1].trim() : "Unknown";
                const clan = clanMatch ? clanMatch[1].trim() : "";
                return clan ? `${name} [${clan}]` : name;
            };

            const killer = extractInfo(killerHtml);
            const target = extractInfo(victimHtml);

            gankData.push({
                id: Math.random().toString(36).substr(2, 9),
                time: timeStr.trim(),
                killer,
                target,
                location: "Global Sector" // The feed doesn't specify sector, just time and players
            });
        }

        return NextResponse.json({
            success: true,
            data: gankData.slice(0, 50)
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
