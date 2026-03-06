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

async function sessionReuseProbe() {
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";
    // REUSING RECENT SESSION PINCHED FROM LOGS
    const sessionKey = "oiAK7WRPTiXQXSdc0kCLqr1GiLra1cbo";

    console.log("Using Session Key:", sessionKey);

    try {
        // Try Request 102 with Tab 3 (Holdings)
        // AND adding GridCurrentStartRow=1 which is often required to trigger the grid vs just the layout
        const gridRequests = [
            { id: 102, params: { ClanID: "101", PagePanelTabSub: "3", GridCurrentStartRow: "1" } },
            { id: 102, params: { ClanID: "101", PagePanelTabSub: "3" } },
            { id: 12, params: { ClanID: "101", SubRequest: "Holdings", GridCurrentStartRow: "1" } }
        ];

        for (let req of gridRequests) {
            console.log(`\n--- Testing Request ${req.id} with params ${JSON.stringify(req.params)} ---`);
            const resp = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=${req.id}&RequestOwner=QETUO`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(req.params)
            });
            const text = await resp.text();

            // Check if session is still valid
            if (text.includes("Invalid Session")) {
                console.error("Session expired. Need to wait for connections to clear.");
                return;
            }

            const data = text.match(/<Data>(.*?)<\/Data>/);
            if (data) {
                const xml = LZW.decompress(data[1].split(','));
                console.log(`Result length: ${xml.length}`);
                if (xml.includes("Kryzerok") || xml.includes("Aradoth") || xml.includes("Izkhand") || xml.includes("Ul'Hamra")) {
                    console.log("!!! TARGET FOUND !!!");
                    console.log(xml);
                } else {
                    console.log("Snippet:", xml.substring(0, 500));
                }
            } else {
                console.log("No compressed data.");
            }
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

sessionReuseProbe();
