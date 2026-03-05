const crypto = require('crypto');

// Environment variables provided by GitHub Actions Secrets
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = process.env.DARKFALL_USERNAME;
const password = process.env.DARKFALL_PASSWORD;

if (!supabaseUrl || !supabaseKey || !username || !password) {
    console.error("Missing required environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DARKFALL_USERNAME, and DARKFALL_PASSWORD are set in GitHub Secrets. Exiting.");
    process.exit(1);
}

// LZW Decompression object
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

function sha1_upper(text) {
    return crypto.createHash('sha1').update(text).digest('hex').toUpperCase();
}

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

async function parseAndUpdateOnlineStatus() {
    try {
        const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";

        console.log("Step 1: Requesting WebGate Auth Salt (RCK)...");
        const postUrl = `${baseUrl}?WebGateRequest=1&RequestOwner=EXTBRM`;
        const resp1 = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ UserName: username, RequestOwner: "EXTBRM" })
        });
        const text1 = await resp1.text();

        const rckMatch = text1.match(/<RCK>(.*?)<\/RCK>/);
        const wbgMatch = text1.match(/<WebGateRequest>(.*?)<\/WebGateRequest>/);
        const ownerMatch = text1.match(/<RequestOwner>(.*?)<\/RequestOwner>/);

        if (!rckMatch || !wbgMatch) {
            console.error("Failed to acquire WebGate Auth Session.");
            process.exit(1);
        }

        const rck = rckMatch[1];
        const wbg = wbgMatch[1];
        const reqOwner = ownerMatch ? ownerMatch[1] : "EXTBRM";

        console.log("Step 2: Sending SHA-1 Hashed Credentials...");
        const temp_hpass = sha1_upper(password);
        const hpass = sha1_upper(temp_hpass + rck);

        const url2 = `${baseUrl}?WebGateRequest=${wbg}&Password=${hpass}&UserName=${username}&RequestOwner=${reqOwner}`;
        const resp2 = await fetch(url2);
        const text2 = await resp2.text();

        const sessionMatch = text2.match(/<SessionKey>(.*?)<\/SessionKey>/);
        const wbg2Match = text2.match(/<WebGateRequest>(.*?)<\/WebGateRequest>/);

        if (!sessionMatch || !wbg2Match) {
            console.error("Authentication failed. Invalid Session.");
            process.exit(1);
        }

        const sessionKey = sessionMatch[1];
        console.log("Successfully Authenticated into WebGate.");

        // Step 3: Accessing Clan Tab (Needed to get the specific RequestOwner and ID context)
        console.log("Step 3: Initializing Clan Context...");
        const clanUrl = `${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=1&RequestOwner=QETUO`;
        const resp4 = await fetch(clanUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ogb: "true" })
        });
        const text4 = await resp4.text();
        const clanDataMatch = text4.match(/<Data>(.*?)<\/Data>/);

        let newReqOwner = "QETUO";
        let clanID = "104";

        if (clanDataMatch) {
            const compressed = clanDataMatch[1].split(',');
            const decodedClan = LZW.decompress(compressed);
            const ownerMatch = decodedClan.match(/<RequestOwner>(.*?)<\/RequestOwner>/);
            if (ownerMatch) newReqOwner = ownerMatch[1];
            const clanIdMatch = decodedClan.match(/<ClanID>(.*?)<\/ClanID>/);
            if (clanIdMatch) clanID = clanIdMatch[1];
        }

        // Step 4: Accessing Clan Roster (Scrape True Online Status)
        console.log("Step 4: Requesting Live XML Clan Roster...");

        let membersOnlineCount = 0;
        let startRow = 1;
        let totalRows = 9999;
        let pagesScraped = 0;

        while (startRow <= totalRows) {
            const rosterUrl = `${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=47&RequestOwner=${newReqOwner}&ogb=true`;
            const rosterResp = await fetch(rosterUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ ClanID: clanID, Sort: "1", Direction: "1", GridCurrentStartRow: startRow.toString() })
            });
            const rosterText = await rosterResp.text();
            const rosterDataMatch = rosterText.match(/<Data>(.*?)<\/Data>/);

            if (!rosterDataMatch) {
                console.error("Failed to retrieve XML Data block from WebGate Roster.");
                break;
            }

            const compressedRoster = rosterDataMatch[1].split(',');
            const xmlContent = LZW.decompress(compressedRoster);

            // Extract pagination info
            const startRowMatch = xmlContent.match(/<GridCurrentStartRow>(.*?)<\/GridCurrentStartRow>/);
            const pageRowsMatch = xmlContent.match(/<GridCurrentPageRows>(.*?)<\/GridCurrentPageRows>/);
            const totalRowsMatch = xmlContent.match(/<GridTotalRows>(.*?)<\/GridTotalRows>/);

            if (totalRowsMatch) totalRows = parseInt(totalRowsMatch[1], 10);
            if (pageRowsMatch) {
                const pageRows = parseInt(pageRowsMatch[1], 10);
                startRow += pageRows;
            } else {
                break; // safeguard
            }

            // Count truly "Online" active states on this page
            const onlineMatches = xmlContent.match(/<State>Online<\/State>/g);
            if (onlineMatches) membersOnlineCount += onlineMatches.length;

            pagesScraped++;
        }

        console.log(`Successfully scraped ${pagesScraped} roster pages.`);
        console.log(`\nTotal truly active members currently online: ${membersOnlineCount}`);
        console.log("Pushing decoupled count to Supabase SystemConfig...");

        try {
            await supabaseFetch(`SystemConfig`, 'POST', {
                key: 'members_logged_in',
                value: membersOnlineCount.toString()
            });
            console.log("Successfully pushed live count to SystemConfig via Secure API.");
        } catch (updateError) {
            console.error("Error updating SystemConfig in Supabase:", updateError.message);
        }

    } catch (e) {
        console.error("Failed to fetch or parse:", e);
        process.exit(1);
    }
}

parseAndUpdateOnlineStatus();
