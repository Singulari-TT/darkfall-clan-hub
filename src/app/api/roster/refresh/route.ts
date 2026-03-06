import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any)?.role !== 'Admin') {
            return NextResponse.json({ success: false, error: "Unauthorized: Admin clearance required." }, { status: 403 });
        }

        const response = await fetch("https://www.riseofagon.com/agonmetrics/pvp/global/", {
            cache: 'no-store'
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

        // Prepare data for upsert
        const upsertData = Object.entries(clans).map(([name, data]) => {
            const memberList = Object.entries(data.members)
                .map(([memberName, mData]) => ({
                    name: memberName,
                    ...mData
                }))
                .sort((a, b) => b.count - a.count);

            const topMember = memberList[0];

            return {
                clan_name: name,
                member_count: memberList.length,
                top_member: topMember?.name || "Unknown",
                top_member_activity: topMember?.count || 0,
                total_activity: data.totalActivity,
                members: memberList,
                last_scanned: new Date().toISOString()
            };
        });

        // Upsert to Supabase
        const { error: upsertError } = await supabaseAdmin
            .from("ExternalClanRosters")
            .upsert(upsertData, { onConflict: 'clan_name' });

        if (upsertError) {
            console.error("Upsert Error:", upsertError);
            throw new Error(`Database upsert failed: ${upsertError.message}`);
        }

        return NextResponse.json({
            success: true,
            clansUpdated: upsertData.length
        });

    } catch (error: any) {
        console.error("Refresh Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
