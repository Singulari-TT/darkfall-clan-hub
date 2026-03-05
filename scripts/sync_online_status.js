require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const LZW = {
    "decompress": function (compressed) {
        var dictSize = 0;
        var dictionary = [];
        var w = String.fromCharCode(compressed[0]);
        var result = w;
        for (var i = 1; i < compressed.length; i++) {
            var entry = "";
            var k = compressed[i];
            if (k.toString().charAt(0) == "_") {
                var key = k.replace("_", "");
                if (dictionary[key]) {
                    entry = dictionary[key];
                } else {
                    entry = w + w.charAt(0);
                }
            } else {
                entry = String.fromCharCode(k);
            }
            result += entry;
            dictionary[dictSize++] = w + entry.charAt(0);
            w = entry;
        }
        return result;
    }
};

function sha1_upper(text) {
    return crypto.createHash('sha1').update(text).digest('hex').toUpperCase();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncOnlineStatus() {
    const username = process.env.DARKFALL_USERNAME || "kokane";
    const password = process.env.DARKFALL_PASSWORD || "roaZ0omb0ot";
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";
    const postUrl = `${baseUrl}?WebGateRequest=1&RequestOwner=EXTBRM`;

    try {
        console.log("Starting online status sync...");

        // 1. Get Salt (RCK)
        const resp1 = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ UserName: username, RequestOwner: "EXTBRM" })
        });
        const text1 = await resp1.text();
        const rckMatch = text1.match(/<RCK>(.*?)<\/RCK>/);
        const wbgMatch = text1.match(/<WebGateRequest>(.*?)<\/WebGateRequest>/);
        const ownerMatch = text1.match(/<RequestOwner>(.*?)<\/RequestOwner>/);

        if (!rckMatch || !wbgMatch) throw new Error("Failed connecting to Darkfall API (No RCK/WBG)");
        const rck = rckMatch[1];
        const wbg = wbgMatch[1];
        const reqOwner = ownerMatch ? ownerMatch[1] : "EXTBRM";

        // 2. Auth & Get Session Key
        const temp_hpass = sha1_upper(password);
        const hpass = sha1_upper(temp_hpass + rck);
        const url2 = `${baseUrl}?WebGateRequest=${wbg}&Password=${hpass}&UserName=${username}&RequestOwner=${reqOwner}`;
        const resp2 = await fetch(url2);
        const text2 = await resp2.text();

        const sessionMatch = text2.match(/<SessionKey>(.*?)<\/SessionKey>/);
        if (!sessionMatch) throw new Error("Authentication failed (No SessionKey)");
        const sessionKey = sessionMatch[1];

        // 3. Navigate to Clan Menu to get proper Route identifiers
        const clanUrl = `${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=1&RequestOwner=QETUO`;
        const resp4 = await fetch(clanUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ogb: "true" })
        });
        const text4 = await resp4.text();
        const clanDataMatch = text4.match(/<Data>(.*?)<\/Data>/);
        let newReqOwner = "QETUO", clanID = "104"; // Fallbacks

        if (clanDataMatch) {
            const compressed = clanDataMatch[1].split(',');
            const decodedClan = LZW.decompress(compressed);
            const ownerMatch = decodedClan.match(/<RequestOwner>(.*?)<\/RequestOwner>/);
            if (ownerMatch) newReqOwner = ownerMatch[1];
            const clanIdMatch = decodedClan.match(/<ClanID>(.*?)<\/ClanID>/);
            if (clanIdMatch) clanID = clanIdMatch[1];
        }

        // 4. Fetch the News Reel
        console.log("Fetching News Reel...");
        const newsReelUrl = `${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=54&RequestOwner=${newReqOwner}`;
        const resp7 = await fetch(newsReelUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: clanID })
        });
        const text7 = await resp7.text();
        const newsDataMatch = text7.match(/<Data>(.*?)<\/Data>/);

        if (!newsDataMatch) throw new Error("News Reel encoded payload not found in response");

        // 5. Decode XML
        const compressed = newsDataMatch[1].split(',');
        const xmlContent = LZW.decompress(compressed);

        console.log("Parsing logs...");
        // 6. Parse and Update DB
        const eventRegex = /<Event>[\s\S]*?<TimeData>(.*?)<\/TimeData>[\s\S]*?<Text>(.*?)<\/Text>[\s\S]*?<\/Event>/g;
        let match;
        const playerStatus = {};

        while ((match = eventRegex.exec(xmlContent)) !== null) {
            const timeData = match[1];
            const text = match[2];

            const betterMatch = text.match(/^(.*?) is now (online|offline)\.$/);
            if (betterMatch) {
                let playerName = betterMatch[1].trim();
                const isOnline = betterMatch[2] === 'online';

                const ranks = ['Recruit ', 'Private ', 'Corporal ', 'Sergeant ', 'Lieutenant ', 'Captain ', 'Major ', 'Commander ', 'General ', 'SupremeGeneral '];
                for (const rank of ranks) {
                    if (playerName.startsWith(rank)) {
                        playerName = playerName.substring(rank.length).trim();
                        break;
                    }
                }

                if (playerStatus[playerName] === undefined) {
                    playerStatus[playerName] = { is_online: isOnline, last_seen: timeData };
                }
            }
        }

        console.log(`Found ${Object.keys(playerStatus).length} unique players in the logs.`);

        for (const [playerName, data] of Object.entries(playerStatus)) {
            const lastOnlineDate = new Date(data.last_seen + ' UTC').toISOString();

            const { data: charData, error: findError } = await supabase
                .from('Characters')
                .select('id, name')
                .ilike('name', playerName)
                .single();

            if (findError && findError.code !== 'PGRST116') {
                console.error(`Error finding ${playerName}:`, findError.message);
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
                    console.error(`Error updating ${playerName}:`, updateError.message);
                } else {
                    console.log(`Updated ${playerName} -> ${data.is_online ? 'Online' : 'Offline'} within database.`);
                }
            }
        }
        console.log("Sync complete!");

    } catch (e) {
        console.error("Critical Sync Error:", e);
    }
}

syncOnlineStatus();
