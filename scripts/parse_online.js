require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function parseAndUpdateOnlineStatus() {
    try {
        const xmlContent = fs.readFileSync('C:/tmp/darkfall_clan_news.xml', 'utf8');

        // Match all <Event> blocks
        const eventRegex = /<Event>[\s\S]*?<TimeData>(.*?)<\/TimeData>[\s\S]*?<Text>(.*?)<\/Text>[\s\S]*?<\/Event>/g;
        let match;

        const playerStatus = {}; // Map of playerName -> is_online (true/false)

        while ((match = eventRegex.exec(xmlContent)) !== null) {
            const timeData = match[1];
            const text = match[2];

            // The text looks like:
            // "Lieutenant Wilby Jones is now online."
            // "Asgrim Blackforge is now online."
            // "Recruit Asgrim Blackforge is now offline."
            const onlineMatch = text.match(/^(?:.* )?(.*?) is now (online|offline)\.$/);

            if (onlineMatch) {
                let playerName = onlineMatch[1].trim();
                const statusStr = onlineMatch[2];
                const isOnline = statusStr === 'online';

                // The previous regex `(?:.* )?(.*?)` grabs the last word before "is now".
                // We actually want the whole name. Let's do a better regex.
                const betterMatch = text.match(/^(.*?) is now (online|offline)\.$/);
                if (betterMatch) {
                    playerName = betterMatch[1].trim();
                }

                const ranks = ['Recruit ', 'Private ', 'Corporal ', 'Sergeant ', 'Lieutenant ', 'Captain ', 'Major ', 'Commander ', 'General ', 'SupremeGeneral '];
                for (const rank of ranks) {
                    if (playerName.startsWith(rank)) {
                        playerName = playerName.substring(rank.length).trim();
                        break;
                    }
                }

                if (playerStatus[playerName] === undefined) {
                    playerStatus[playerName] = { is_online: isOnline, last_seen: timeData };
                    console.log(`Found latest status for ${playerName}: ${isOnline ? 'Online' : 'Offline'} at ${timeData}`);
                }
            }
        }

        console.log("\nUpdating Supabase with latest statuses...");

        // Update the database
        for (const [playerName, data] of Object.entries(playerStatus)) {
            const lastOnlineDate = new Date(data.last_seen + ' UTC').toISOString();

            // Try to find the character in the DB
            const { data: charData, error: findError } = await supabase
                .from('Characters')
                .select('id, name')
                .ilike('name', playerName) // Case-insensitive match 
                .single();

            if (findError && findError.code !== 'PGRST116') {
                console.error(`Error finding character ${playerName}:`, findError.message);
                continue;
            }

            if (charData) {
                const { error: updateError } = await supabase
                    .from('Characters')
                    .update({
                        is_online: data.is_online,
                        last_online: data.is_online ? null : lastOnlineDate
                    })
                    .eq('id', charData.id);

                if (updateError) {
                    console.error(`Error updating character ${playerName}:`, updateError.message);
                } else {
                    console.log(`Successfully updated ${playerName} to ${data.is_online ? 'Online' : 'Offline'}`);
                }
            } else {
                console.log(`Character ${playerName} not found in database, skipping update.`);
            }
        }

        console.log("Online status update complete.");

    } catch (e) {
        console.error("Failed to parse and update:", e);
    }
}

parseAndUpdateOnlineStatus();
