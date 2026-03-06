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

async function refinedProbe() {
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";

    try {
        console.log("1. Authenticating...");
        const resp1 = await fetch(`${baseUrl}?WebGateRequest=1&RequestOwner=EXTBRM`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ UserName: username, RequestOwner: "EXTBRM" })
        });
        const text1 = await resp1.text();
        const rckMatch = text1.match(/<RCK>(.*?)<\/RCK>/);
        const wbgMatch = text1.match(/<WebGateRequest>(.*?)<\/WebGateRequest>/);

        if (!rckMatch || !wbgMatch) {
            console.error("Auth Step 1 failed. Response:", text1);
            return;
        }

        const rck = rckMatch[1];
        const wbg = wbgMatch[1];

        const hpass = sha1_upper(sha1_upper(password) + rck);
        const resp2 = await fetch(`${baseUrl}?WebGateRequest=${wbg}&Password=${hpass}&UserName=${username}&RequestOwner=EXTBRM`);
        const text2 = await resp2.text();
        const skMatch = text2.match(/<SessionKey>(.*?)<\/SessionKey>/);

        if (!skMatch) {
            console.error("Auth Step 2 failed. Response:", text2);
            return;
        }

        const sessionKey = skMatch[1];
        console.log("Session Key acquired:", sessionKey);

        // Testing common "Grid Fetch" request IDs (12, 47, 54, 85, 102)
        const gridRequests = [
            { id: 102, params: { ClanID: "101", PagePanelTabSub: "3" } },
            { id: 12, params: { ClanID: "101", SubRequest: "Holdings" } },
            { id: 85, params: { ClanID: "101", Type: "City" } }
        ];

        for (let req of gridRequests) {
            console.log(`\n--- Testing Request ${req.id} with params ${JSON.stringify(req.params)} ---`);
            const resp = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=${req.id}&RequestOwner=QETUO`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(req.params)
            });
            const text = await resp.text();
            const data = text.match(/<Data>(.*?)<\/Data>/);
            if (data) {
                const xml = LZW.decompress(data[1].split(','));
                console.log(`Result from ${req.id}:`, xml.substring(0, 500), "...");
                if (xml.includes("Kryzerok") || xml.includes("Aradoth")) {
                    console.log("!!! TARGET FOUND !!!");
                    console.log(xml);
                }
            } else {
                console.log(`Request ${req.id} returned no compressed data.`);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

refinedProbe();
