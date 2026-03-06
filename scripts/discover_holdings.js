const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

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

function sha1_upper(text) {
    return crypto.createHash('sha1').update(text).digest('hex').toUpperCase();
}

async function discoverHoldings() {
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";

    try {
        console.log("Authenticating with WebGate...");
        // 1. Get Salt
        const resp1 = await fetch(`${baseUrl}?WebGateRequest=1&RequestOwner=EXTBRM`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ UserName: username, RequestOwner: "EXTBRM" })
        });
        const text1 = await resp1.text();
        console.log("Response 1:", text1);
        const rckMatch = text1.match(/<RCK>(.*?)<\/RCK>/);
        const wbgMatch = text1.match(/<WebGateRequest>(.*?)<\/WebGateRequest>/);

        if (!rckMatch || !wbgMatch) {
            throw new Error("Failed to extract RCK or WebGateRequest from Response 1");
        }

        const rck = rckMatch[1];
        const wbg = wbgMatch[1];

        // 2. Session Key
        const hpass = sha1_upper(sha1_upper(password) + rck);
        const resp2 = await fetch(`${baseUrl}?WebGateRequest=${wbg}&Password=${hpass}&UserName=${username}&RequestOwner=EXTBRM`);
        const text2 = await resp2.text();
        console.log("Response 2:", text2);
        const skMatch = text2.match(/<SessionKey>(.*?)<\/SessionKey>/);

        if (!skMatch) {
            throw new Error("Failed to extract SessionKey from Response 2");
        }

        const sessionKey = skMatch[1];

        // 3. Fetch Clan Holdings (Request 102 for Clan Info usually contains this)
        console.log("Fetching Clan Status...");
        const clanResp = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=102&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: "104" })
        });
        const clanText = await clanResp.text();

        // Let's dump the response to see the XML structure for holdings
        // Usually it's inside <Data> and LZW compressed if it's a list
        const dataMatch = clanText.match(/<Data>(.*?)<\/Data>/);
        if (dataMatch) {
            const xml = LZW.decompress(dataMatch[1].split(','));
            console.log("--- DISCOVERED CLAN DATA ---");
            console.log(xml);

            // Look for <Holding> or <City> blocks in the XML
            const cityMatches = xml.match(/<Name>(.*?)<\/Name>[\s\S]*?<Type>(.*?)<\/Type>/g);
            if (cityMatches) {
                console.log("\n--- DETECTED HOLDINGS ---");
                cityMatches.forEach(m => {
                    const name = m.match(/<Name>(.*?)<\/Name>/)[1];
                    const type = m.match(/<Type>(.*?)<\/Type>/)[1];
                    console.log(`[${type}] ${name}`);
                });
            }
        } else {
            console.log("No compressed data found in response. Raw text:");
            console.log(clanText);
        }

    } catch (err) {
        console.error("Discovery Error:", err);
    }
}

discoverHoldings();
