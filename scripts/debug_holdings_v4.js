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

async function bruteProbe() {
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";

    try {
        console.log("1. Authenticating...");
        const resp1 = await fetch(`${baseUrl}?WebGateRequest=1&RequestOwner=EXTBRM`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ UserName: username, RequestOwner: "EXTBRM" })
        });
        const text1 = await resp1.text();
        const rck = text1.match(/<RCK>(.*?)<\/RCK>/)[1];
        const wbg = text1.match(/<WebGateRequest>(.*?)<\/WebGateRequest>/)[1];

        const hpass = sha1_upper(sha1_upper(password) + rck);
        const resp2 = await fetch(`${baseUrl}?WebGateRequest=${wbg}&Password=${hpass}&UserName=${username}&RequestOwner=EXTBRM`);
        const text2 = await resp2.text();
        const sessionKey = text2.match(/<SessionKey>(.*?)<\/SessionKey>/)[1];
        console.log("Session Key:", sessionKey);

        // Brute force a few likely candidates with the TabSub parameter
        for (let reqId of [101, 102, 103, 104, 105]) {
            console.log(`\n--- Testing Request ${reqId} (TabSub=3) ---`);
            const resp = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=${reqId}&RequestOwner=QETUO`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ ClanID: "101", PagePanelTabSub: "3" })
            });
            const text = await resp.text();
            const data = text.match(/<Data>(.*?)<\/Data>/);
            if (data) {
                const xml = LZW.decompress(data[1].split(','));
                if (xml.includes("Kryzerok") || xml.includes("Aradoth") || xml.includes("Izkhand") || xml.includes("Ul'Hamra")) {
                    console.log(`MATCH FOUND IN REQUEST ${reqId}!`);
                    console.log(xml);
                } else {
                    console.log(`Request ${reqId} returned data but no holding names found. Snippet:`, xml.substring(0, 200));
                }
            } else {
                console.log(`Request ${reqId} returned no compressed data.`);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

bruteProbe();
