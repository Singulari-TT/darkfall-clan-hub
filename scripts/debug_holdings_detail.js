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

async function probeHoldings() {
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

        // Try Request 102 - This is often the Holdings list
        console.log("\n2. Requesting Holdings List (WebGateRequest=102)...");
        const resp102 = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=102&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ ClanID: "101" })
        });
        const text102 = await resp102.text();
        const data102 = text102.match(/<Data>(.*?)<\/Data>/);
        if (data102) {
            const xml = LZW.decompress(data102[1].split(','));
            console.log("Decompressed 102 Data:");
            console.log(xml);

            // If we find holding IDs, we can probe deeper
            const holdingMatches = xml.match(/<HoldingID>(.*?)<\/HoldingID>/g);
            if (holdingMatches) {
                for (const match of holdingMatches) {
                    const id = match.match(/<HoldingID>(.*?)<\/HoldingID>/)[1];
                    console.log(`\n--- Probing Holding ID: ${id} ---`);
                    // Request 103 or 104 are usually details
                    const respDetail = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=103&RequestOwner=QETUO`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({ HoldingID: id })
                    });
                    const textDetail = await respDetail.text();
                    const dataDetail = textDetail.match(/<Data>(.*?)<\/Data>/);
                    if (dataDetail) {
                        console.log(LZW.decompress(dataDetail[1].split(',')));
                    }
                }
            }
        } else {
            console.log("No data in 102. Response:", text102);
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

probeHoldings();
