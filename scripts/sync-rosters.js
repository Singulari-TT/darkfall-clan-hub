require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncExternalRosters() {
    console.log("Starting External Roster sync from Agon Metrics...");

    try {
        const response = await fetch("https://www.riseofagon.com/agonmetrics/pvp/global/", {
            cache: 'no-store'
        });

        if (!response.ok) throw new Error(`Failed to reach Agon Metrics: ${response.statusText}`);

        const html = await response.text();

        // Regex setup (Updated for new HTML structure)
        const gankRowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*class="timestamp-data"[^>]*>(.*?)<\/td>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/g;
        const nameRegex = /^([\s\S]*?)\s*<span/;
        const clanRegex = /<span[^>]*class="clanname-minimal"[^>]*>(.*?)<\/span>/;

        const clans = {};

        let match;
        while ((match = gankRowRegex.exec(html)) !== null) {
            const [_, timeStr, killerHtml, victimHtml] = match;

            const processCell = (cellHtml) => {
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
                top_member_activity: topMember?.count || 0, // Column missing in DB
                total_activity: data.totalActivity,
                members: memberList,
                last_scanned: new Date().toISOString()
            };
        });

        if (upsertData.length === 0) {
            console.log("No clan data parsed from Agon Metrics. Check regex or source HTML.");
            return;
        }

        // Upsert to Supabase
        const { error: upsertError } = await supabase
            .from("ExternalClanRosters")
            .upsert(upsertData, { onConflict: 'clan_name' });

        if (upsertError) {
            console.error("Upsert Error:", upsertError);
            throw new Error(`Database upsert failed: ${upsertError.message}`);
        }

        console.log(`Successfully updated ${upsertData.length} clans in ExternalClanRosters.`);

    } catch (error) {
        console.error("Sync Error:", error.message);
        process.exit(1);
    }
}

syncExternalRosters();
