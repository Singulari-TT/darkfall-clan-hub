const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

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

async function exhaustiveProbe() {
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";
    const sessionKey = "oiAK7WRPTiXQXSdc0kCLqr1GiLra1cbo";

    console.log("Using Session Key:", sessionKey);

    const holdingNames = ["Kryzerok", "Aradoth", "Izkhand", "Ul'Hamra"];

    try {
        // Broad sweep of request IDs with 'Holdings' context
        for (let reqId of [42, 85, 101, 102, 103, 104, 105, 120]) {
            console.log(`\n--- Testing Request ${reqId} (SubRequest/Menu Context) ---`);
            const payloads = [
                { ClanID: "101", SubRequest: "Holdings" },
                { ClanID: "101", MenuID: "Holdings" },
                { ClanID: "101", PagePanelTabSub: "3" }
            ];

            for (let params of payloads) {
                const resp = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=${reqId}&RequestOwner=QETUO`, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams(params)
                });
                const text = await resp.text();

                if (text.includes("Invalid Session")) {
                    console.error("Session expired.");
                    return;
                }

                const data = text.match(/<Data>(.*?)<\/Data>/);
                if (data) {
                    const xml = LZW.decompress(data[1].split(','));
                    const found = holdingNames.some(name => xml.includes(name));
                    if (found) {
                        console.log(`!!! MATCH FOUND IN REQUEST ${reqId} with params ${JSON.stringify(params)} !!!`);
                        console.log(xml);
                        return; // Stop once we find it
                    } else {
                        console.log(`Req ${reqId} (${Object.keys(params)[0]}): Data received (len: ${xml.length}), no matches.`);
                    }
                }
            }
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

exhaustiveProbe();
