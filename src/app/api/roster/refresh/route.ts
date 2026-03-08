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

        const clans: Record<string, { members: Record<string, { lastSeen: string, count: number, lastGiven?: string, lastGivenOpponent?: string, lastReceived?: string, lastReceivedOpponent?: string }>, totalActivity: number }> = {};

        let match;
        while ((match = gankRowRegex.exec(html)) !== null) {
            const [_, timeStr, killerHtml, victimHtml] = match;

            const extractName = (cellHtml: string) => {
                const nameMatch = cellHtml.match(nameRegex);
                return nameMatch ? nameMatch[1].trim() : null;
            };

            const killerName = extractName(killerHtml);
            const victimName = extractName(victimHtml);

            const processCell = (cellHtml: string, isKiller: boolean, opponentName: string | null) => {
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

                    if (isKiller) {
                        clans[clan].members[name].lastGiven = timeStr.trim();
                        clans[clan].members[name].lastGivenOpponent = opponentName || "Unknown";
                    } else {
                        clans[clan].members[name].lastReceived = timeStr.trim();
                        clans[clan].members[name].lastReceivedOpponent = opponentName || "Unknown";
                    }
                }
            };

            processCell(killerHtml, true, victimName);
            processCell(victimHtml, false, killerName);
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

        // Update individual Dreadkrew character metrics
        const dkInfo = clans['Dreadkrew'];
        if (dkInfo) {
            for (const [name, data] of Object.entries(dkInfo.members)) {
                const updates: any = {};
                // If they appeared in this feed, we update their gank timestamps
                if (data.lastGiven) {
                    updates.last_gank_given = new Date().toISOString();
                    updates.last_gank_opponent_given = data.lastGivenOpponent;
                }
                if (data.lastReceived) {
                    updates.last_gank_received = new Date().toISOString();
                    updates.last_gank_opponent_received = data.lastReceivedOpponent;
                }

                if (Object.keys(updates).length > 0) {
                    await supabaseAdmin
                        .from("Characters")
                        .update(updates)
                        .eq("name", name);
                }
            }
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
