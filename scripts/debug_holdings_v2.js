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

async function debugHoldings() {
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

        // Based on the user's description: Clan Menu -> Menu Button -> Holdings -> City Tab
        // Let's try Request 3 (MenuRequest)
        console.log("\n2. Requesting Clan Menu (WebGateRequest=3)...");
        const respMenu = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=3&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: "101" }) // Note: previous log showed ClanID 101
        });
        const textMenu = await respMenu.text();
        const dataMenu = textMenu.match(/<Data>(.*?)<\/Data>/);
        if (dataMenu) {
            console.log("Decompressed Menu Data:");
            console.log(LZW.decompress(dataMenu[1].split(',')));
        }

        // Let's try to find "Holdings" or similar in a broader request if 3 doesn't work
        // Maybe Request 16 (often used for sub-menus)
        console.log("\n3. Testing Request 16 (Sub-menu probe)...");
        const resp16 = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=16&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: "101", MenuID: "Holdings" })
        });
        const text16 = await resp16.text();
        const data16 = text16.match(/<Data>(.*?)<\/Data>/);
        if (data16) {
            console.log("Decompressed Request 16 Data:");
            console.log(LZW.decompress(data16[1].split(',')));
        }

        // Try Request 37 (OverviewRequest)
        console.log("\n4. Testing Request 37 (Overview probe)...");
        const resp37 = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=37&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: "101" })
        });
        const text37 = await resp37.text();
        const data37 = text37.match(/<Data>(.*?)<\/Data>/);
        if (data37) {
            console.log("Decompressed Request 37 Data:");
            console.log(LZW.decompress(data37[1].split(',')));
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

debugHoldings();
