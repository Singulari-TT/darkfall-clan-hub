const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = process.env.DARKFALL_USERNAME;
const password = process.env.DARKFALL_PASSWORD;

const LZW = {
    "decompress": function (compressed) {
        let dictSize = 0;
        let dictionary = [];
        let w = String.fromCharCode(compressed[0]);
        let result = w;
        for (let i = 1; i < compressed.length; i++) {
            let entry = "";
            let k = compressed[i];
            if (k.toString().charAt(0) === "_") {
                let key = k.replace("_", "");
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

const sha1_upper = (text) => crypto.createHash('sha1').update(text).digest('hex').toUpperCase();

function safeMatch(text, regex, index = 1) {
    const match = text.match(regex);
    return match ? match[index] : null;
}

async function scrapeHarvests() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";

    try {
        console.log("Authenticating for Harvest Scraping...");
        const resp1 = await fetch(`${baseUrl}?WebGateRequest=1&RequestOwner=EXTBRM`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ UserName: username, RequestOwner: "EXTBRM" })
        });
        const text1 = await resp1.text();
        const rck = safeMatch(text1, /<RCK>(.*?)<\/RCK>/);
        const wbg = safeMatch(text1, /<WebGateRequest>(.*?)<\/WebGateRequest>/);

        if (!rck || !wbg) {
            throw new Error(`Authentication loop failure: RCK=${!!rck}, WBG=${!!wbg}`);
        }

        const hpass = sha1_upper(sha1_upper(password) + rck);
        const resp2 = await fetch(`${baseUrl}?WebGateRequest=${wbg}&Password=${hpass}&UserName=${username}&RequestOwner=EXTBRM`);
        const text2 = await resp2.text();
        const sessionKey = safeMatch(text2, /<SessionKey>(.*?)<\/SessionKey>/);

        if (!sessionKey) {
            throw new Error("Failed to secure SessionKey from WebGate.");
        }

        // 3. Fetch News Reel
        console.log("Fetching News Reel for Empire Logs...");
        const newsResp = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=54&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: "104" }) // Use static Clan ID for now
        });
        const newsText = await newsResp.text();
        const dataMatch = newsText.match(/<Data>(.*?)<\/Data>/);
        if (!dataMatch) return;

        const xml = LZW.decompress(dataMatch[1].split(','));

        // 4. Parse Harvest Events
        // Example: "Wilby Jones has harvested a Timber Grove in Greybark (10th time)."
        const harvestRegex = /<Event>[\s\S]*?<TimeData>(.*?)<\/TimeData>[\s\S]*?<Text>(.*?) has harvested a (.*?) in (.*?) \((\d+)(?:st|nd|rd|th)? time\)\.<\/Text>[\s\S]*?<\/Event>/g;
        let match;

        while ((match = harvestRegex.exec(xml)) !== null) {
            const [_, time, character, nodeType, holdingName, milestone] = match;

            console.log(`Harvest Detected: ${character} @ ${nodeType} in ${holdingName} [${milestone}]`);
            const timeIso = new Date(time + ' UTC').toISOString();

            // Find if this character is one of our registered members
            const { data: charData } = await supabase
                .from('Characters')
                .select('id')
                .ilike('name', character.trim())
                .single();

            if (charData) {
                await supabase
                    .from('Characters')
                    .update({ last_harvest: timeIso })
                    .eq('id', charData.id);
                console.log(`Recorded harvest for member: ${character}`);
            }

            // Also keep existing logic to track global holdings info if needed
            // ...
        }

        // --- NEW: Heartbeat ---
        await supabase
            .from("SystemConfig")
            .upsert({ key: 'last_harvest_scraper_sync', value: 'Success', updated_at: new Date().toISOString() }, { onConflict: 'key' });

    } catch (err) {
        console.error("Harvest Scraping Error:", err);
    }
}

scrapeHarvests();
