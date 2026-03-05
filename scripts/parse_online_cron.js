const fs = require('fs');
const https = require('https');

// Expecting environment variables from GitHub Actions secrets
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// The live URL for the Darkfall clan news feed
const CLAN_NEWS_URL = process.env.CLAN_NEWS_URL;

if (!supabaseUrl || !supabaseKey || !CLAN_NEWS_URL) {
    console.error("Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or CLAN_NEWS_URL). Exiting.");
    process.exit(1);
}

// Helper to make raw API requests to Supabase Rest API
async function supabaseFetch(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=representation'
        }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, options);
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Supabase Error: ${res.status} ${errorText}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// Fetch the XML string directly from the web URL
function fetchXmlData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(data); });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function parseAndUpdateOnlineStatus() {
    try {
        console.log(`Fetching live Clan News XML from ${CLAN_NEWS_URL}...`);
        const xmlContent = await fetchXmlData(CLAN_NEWS_URL);

        // Match all <Event> blocks
        const eventRegex = /<Event>[\s\S]*?<TimeData>(.*?)<\/TimeData>[\s\S]*?<Text>(.*?)<\/Text>[\s\S]*?<\/Event>/g;
        let match;

        let membersOnlineCount = 0;
        const playerStatus = {}; // Map of playerName -> is_online (true/false)

        while ((match = eventRegex.exec(xmlContent)) !== null) {
            const timeData = match[1];
            const text = match[2];

            // Look for "is now online" or "is now offline"
            const onlineMatch = text.match(/^(.*?)\s+is now (online|offline)\.$/);

            if (onlineMatch) {
                let playerName = onlineMatch[1].trim();
                const statusStr = onlineMatch[2];
                const isOnline = statusStr === 'online';

                // Strip standard ranks
                const ranks = ['Recruit ', 'Private ', 'Corporal ', 'Sergeant ', 'Lieutenant ', 'Captain ', 'Major ', 'Commander ', 'General ', 'SupremeGeneral '];
                for (const rank of ranks) {
                    if (playerName.startsWith(rank)) {
                        playerName = playerName.substring(rank.length);
                        break;
                    }
                }

                // First occurrence (closest to top = newest) dictates the current status
                if (playerStatus[playerName] === undefined) {
                    playerStatus[playerName] = isOnline;
                    if (isOnline) membersOnlineCount++;
                    console.log(`Latest known status for ${playerName}: ${isOnline ? 'Online' : 'Offline'} at ${timeData}`);
                }
            }
        }

        console.log(`\nTotal unique members currently online: ${membersOnlineCount}`);
        console.log("Pushing decoupled count to Supabase SystemConfig...");

        try {
            await supabaseFetch(`SystemConfig`, 'POST', {
                key: 'members_logged_in',
                value: membersOnlineCount.toString()
            });
            console.log("Successfully pushed count to SystemConfig.");
        } catch (updateError) {
            console.error("Error updating SystemConfig:", updateError.message);
        }

    } catch (e) {
        console.error("Failed to fetch or parse:", e);
        process.exit(1);
    }
}

parseAndUpdateOnlineStatus();
