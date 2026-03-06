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

async function deeperProbe() {
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

        // Try Request 102 with PagePanelTabSub=3 (Holdings/City Tab?)
        console.log("\n2. Requesting Holdings List (102 + PagePanelTabSub=3)...");
        const resp102 = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=102&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: "101", PagePanelTabSub: "3" })
        });
        const text102 = await resp102.text();
        const data102 = text102.match(/<Data>(.*?)<\/Data>/);
        if (data102) {
            console.log("Decompressed 102 (Tab 3) Data:");
            console.log(LZW.decompress(data102[1].split(',')));
        } else {
            console.log("No data in 102 (Tab 3). Response:", text102);
        }

        // Try Request 12 (often used for specific sub-grids)
        console.log("\n3. Testing Request 12 (Grid probe)...");
        const resp12 = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=12&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: "101", SubRequest: "Holdings" })
        });
        const text12 = await resp12.text();
        const data12 = text12.match(/<Data>(.*?)<\/Data>/);
        if (data12) {
            console.log("Decompressed Request 12 Data:");
            console.log(LZW.decompress(data12[1].split(',')));
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

deeperProbe();
