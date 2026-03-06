import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch("https://www.riseofagon.com/agonmetrics/pvp/global/", {
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) throw new Error("Failed to reach Agon Metrics");

        const html = await response.text();

        // Regex setup (Updated for new HTML structure)
        const gankRowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*class="timestamp-data"[^>]*>(.*?)<\/td>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/g;
        const nameRegex = /^([\s\S]*?)\s*<span/;
        const clanRegex = /<span[^>]*class="clanname-minimal"[^>]*>(.*?)<\/span>/;

        const clans: Record<string, { members: Record<string, { lastSeen: string, count: number }>, totalActivity: number }> = {};

        let match;
        while ((match = gankRowRegex.exec(html)) !== null) {
            const [_, timeStr, killerHtml, victimHtml] = match;

            const processCell = (cellHtml: string) => {
                const nameMatch = cellHtml.match(nameRegex);
                const clanMatch = cellHtml.match(clanRegex);

                if (nameMatch && clanMatch) {
                    const name = nameMatch[1].trim();
                    const clan = clanMatch[1].trim();

                    if (!clans[clan]) {
                        clans[clan] = { members: {}, totalActivity: 0 };
                    }

                    if (!clans[clan].members[name]) {
                        clans[clan].members[name] = { lastSeen: timeStr.trim(), count: 0 };
                    }

                    clans[clan].members[name].count++;
                    clans[clan].totalActivity++;
                }
            };

            processCell(killerHtml);
            processCell(victimHtml);
        }

        // Convert to sorted array
        const sortedClans = Object.entries(clans)
            .map(([name, data]) => ({
                name,
                totalActivity: data.totalActivity,
                members: Object.entries(data.members)
                    .map(([memberName, mData]) => ({
                        name: memberName,
                        ...mData
                    }))
                    .sort((a, b) => b.count - a.count)
            }))
            .sort((a, b) => b.totalActivity - a.totalActivity);

        return NextResponse.json({
            success: true,
            clans: sortedClans.slice(0, 20) // Top 20 most active clans
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
