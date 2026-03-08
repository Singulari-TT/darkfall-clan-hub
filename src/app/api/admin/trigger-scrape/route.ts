import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

function sha1Upper(text: string) {
    return crypto.createHash("sha1").update(text).digest("hex").toUpperCase();
}

const LZW_decompress = (compressed: string[]): string => {
    if (!compressed || compressed.length === 0 || (compressed.length === 1 && !compressed[0])) return "";

    let dictSize = 0;
    const dictionary: Record<number, string> = {};
    const firstCode = parseInt(compressed[0]);
    if (isNaN(firstCode)) return "";

    let w = String.fromCharCode(firstCode);
    let result = w;
    for (let i = 1; i < compressed.length; i++) {
        const k = compressed[i];
        if (!k) continue;

        let entry = "";
        if (!k.startsWith("_")) {
            entry = String.fromCharCode(parseInt(k));
        } else {
            const key = parseInt(k.slice(1));
            entry = dictionary[key] ?? (w + w.charAt(0));
        }
        result += entry;
        dictionary[dictSize++] = w + entry.charAt(0);
        w = entry;
    }
    return result;
};

async function authenticate() {
    const username = process.env.DARKFALL_USERNAME!;
    const password = process.env.DARKFALL_PASSWORD!;
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";

    const resp1 = await fetch(`${baseUrl}?WebGateRequest=1&RequestOwner=EXTBRM`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ UserName: username, RequestOwner: "EXTBRM" }),
    });
    const text1 = await resp1.text();

    const rckMatch = text1.match(/<RCK>(.*?)<\/RCK>/);
    const wbgMatch = text1.match(/<WebGateRequest>(.*?)<\/WebGateRequest>/);

    if (!rckMatch || !wbgMatch) {
        throw new Error(`WebGate Init Failed. Response: ${text1.substring(0, 100)}...`);
    }

    const rck = rckMatch[1];
    const wbg = wbgMatch[1];
    const hpass = sha1Upper(sha1Upper(password) + rck);

    const resp2 = await fetch(`${baseUrl}?WebGateRequest=${wbg}&Password=${hpass}&UserName=${username}&RequestOwner=EXTBRM`);
    const text2 = await resp2.text();

    const sessionMatch = text2.match(/<SessionKey>(.*?)<\/SessionKey>/);
    if (!sessionMatch) {
        throw new Error(`WebGate Auth Failed (SessionKey missing). Response: ${text2.substring(0, 100)}...`);
    }

    return sessionMatch[1];
}

async function fetchNewsXml(sessionKey: string): Promise<string | null> {
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";
    const resp = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=54&RequestOwner=QETUO`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ClanID: "104" }),
    });
    const text = await resp.text();
    const match = text.match(/<Data>(.*?)<\/Data>/);
    if (!match) return null;
    return LZW_decompress(match[1].split(","));
}

async function runOnlineStatus(db: any): Promise<{ processed: number; note: string }> {
    const sessionKey = await authenticate();
    const xml = await fetchNewsXml(sessionKey);
    if (!xml) return { processed: 0, note: "No data from news reel" };

    // 1. Current Online Count (from <OnlineRecord>)
    const charNameRegex = /<CharacterName>(.*?)<\/CharacterName>/g;
    const onlineNames: string[] = [];
    let match;
    while ((match = charNameRegex.exec(xml)) !== null) {
        onlineNames.push(match[1]);
    }
    const count = onlineNames.length;

    // Reset status and update currently online characters
    await db.from("Characters").update({ is_online: false });
    if (count > 0) {
        await db.from("Characters")
            .update({ is_online: true, last_online: new Date().toISOString() })
            .in("name", onlineNames);
    }

    // 2. Scan News Reel for Logon/Logoff Session Details
    const lines = xml.split("\n");
    for (const line of lines) {
        const textMatch = line.match(/<Text>(.*?)<\/Text>/);
        if (textMatch) {
            const text = textMatch[1];
            // Match: "CharacterName has logged off. Session length: 45m."
            const logoffMatch = text.match(/^(.*?) has logged off\. Session length: (\d+)m\.$/);
            if (logoffMatch) {
                const [, charName, minutes] = logoffMatch;
                await db.from("Characters")
                    .update({ last_session_length: parseInt(minutes) })
                    .eq("name", charName);
            }
        }
    }

    // Update the SystemConfig table so the dashboard reflects this
    await db.from("SystemConfig").upsert({
        key: "members_logged_in",
        value: count.toString()
    }, { onConflict: "key" });

    return { processed: count, note: `Synchronized ${count} online characters and processed session logs.` };
}

async function runHarvestSync(db: any): Promise<{ processed: number; note: string }> {
    const sessionKey = await authenticate();
    const xml = await fetchNewsXml(sessionKey);
    if (!xml) return { processed: 0, note: "No data from news reel" };

    // Use a non-dotAll regex to avoid ES2018 requirement
    const lines = xml.split("\n");
    let count = 0;
    let currentTime = "";
    let currentText = "";

    for (const line of lines) {
        const timeMatch = line.match(/<TimeData>(.*?)<\/TimeData>/);
        if (timeMatch) currentTime = timeMatch[1];
        const textMatch = line.match(/<Text>(.*?)<\/Text>/);
        if (textMatch) currentText = textMatch[1];

        if (currentTime && currentText) {
            const harvestMatch = currentText.match(/^(.*?) has harvested a (.*?) in (.*?) \((\d+)(?:st|nd|rd|th)? time\)\.$/);
            if (harvestMatch && harvestMatch.length >= 5) {
                const playerName = harvestMatch[1];
                const nodeType = harvestMatch[2];
                const holdingName = harvestMatch[3];
                const milestone = harvestMatch[4];

                // 1. Update individual character metrics
                await db.from("Characters")
                    .update({ last_harvest: new Date().toISOString() })
                    .eq("name", playerName);

                // 2. Update holdings records
                const { data: holding } = await db.from("Holdings").select("id").eq("name", holdingName).maybeSingle();
                if (holding) {
                    const { data: node } = await db.from("Resource_Nodes").select("id, total_hits").eq("holding_id", (holding as any).id).eq("node_type", nodeType).maybeSingle();
                    if (node) {
                        await db.from("Resource_Nodes").update({ total_hits: Math.max((node as any).total_hits, parseInt(milestone)) }).eq("id", (node as any).id);
                    } else {
                        await db.from("Resource_Nodes").insert({ holding_id: (holding as any).id, node_type: nodeType, total_hits: parseInt(milestone) });
                    }
                    count++;
                }
            }
            currentTime = "";
            currentText = "";
        }
    }

    return { processed: count, note: `Synced ${count} harvest events to Holdings` };
}

async function runHoldingsSync(db: any): Promise<{ processed: number; note: string }> {
    const sessionKey = await authenticate();
    const baseUrl = "http://192.227.120.142:50313/spenefett/fwd";

    // 1. Request Holdings List (Request 102 with QETUO)
    const resp = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=102&RequestOwner=QETUO`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ ClanID: "104" }),
    });
    const text = await resp.text();
    const match = text.match(/<Data>(.*?)<\/Data>/);
    if (!match) return { processed: 0, note: "No holdings data found (Likely server maintenance)" };

    const xml = LZW_decompress(match[1].split(","));
    const holdingIDs = xml.match(/<HoldingID>(.*?)<\/HoldingID>/g);
    if (!holdingIDs) return { processed: 0, note: "No holding IDs found in list" };

    let totalUpdated = 0;
    for (const hMatch of holdingIDs) {
        const idMatch = hMatch.match(/<HoldingID>(.*?)<\/HoldingID>/);
        if (!idMatch) continue;
        const hId = idMatch[1];

        // 2. Request Individual Holding Detail
        const respDetail = await fetch(`${baseUrl}?SessionKey=${sessionKey}&WebGateRequest=103&RequestOwner=QETUO`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ HoldingID: hId }),
        });
        const textDetail = await respDetail.text();
        const detailMatch = textDetail.match(/<Data>(.*?)<\/Data>/);
        if (detailMatch) {
            const detailXml = LZW_decompress(detailMatch[1].split(","));
            const nameMatch = detailXml.match(/<HoldingName>(.*?)<\/HoldingName>/);
            const name = nameMatch ? nameMatch[1] : `Holding_${hId}`;

            // Upsert Holding
            const { data: holding } = await db.from("Holdings").upsert({ name, type: 'City' }, { onConflict: 'name' }).select('id').single();
            const holdingDbId = (holding as any)?.id;
            if (!holdingDbId) continue;

            // Extract Resource Nodes
            const nodes = detailXml.match(/<BuildingName>(.*?)<\/BuildingName>[\s\S]*?<HitsPercentage>(.*?)<\/HitsPercentage>/g);
            if (nodes) {
                for (const nodeXml of nodes) {
                    const bNameMatch = nodeXml.match(/<BuildingName>(.*?)<\/BuildingName>/);
                    const hitsMatch = nodeXml.match(/<HitsPercentage>(.*?)<\/HitsPercentage>/);

                    if (bNameMatch && hitsMatch) {
                        const nodeType = bNameMatch[1];
                        const hits = parseInt(hitsMatch[1]);

                        if (['Timber Grove', 'Quarry', 'Mine', 'Herb Patch'].includes(nodeType)) {
                            await db.from("Resource_Nodes").upsert({
                                holding_id: holdingDbId,
                                node_type: nodeType,
                                total_hits: hits
                            }, { onConflict: 'holding_id,node_type' });
                        }
                    }
                }
            }
            totalUpdated++;
        }
    }

    // Update sync timestamp
    await db.from("SystemConfig").upsert({
        key: "holdings_last_synced",
        value: new Date().toISOString()
    }, { onConflict: "key" });

    return { processed: totalUpdated, note: `Successfully synced ${totalUpdated} holdings and their resource nodes.` };
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session as any)?.user?.id || (session as any).user.role !== "Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { script } = await req.json();
        const db = supabaseAdmin;

        let result: { processed: number; note: string };
        switch (script) {
            case "online-status":
                result = await runOnlineStatus(db);
                break;
            case "harvest-sync":
                result = await runHarvestSync(db);
                break;
            case "holdings-sync":
                result = await runHoldingsSync(db);
                break;
            default:
                return NextResponse.json({ error: `Unknown script: ${script}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        console.error("Trigger scrape error:", e);
        return NextResponse.json({
            success: false,
            error: `${e.message} @ ${e.stack?.split('\n')[1] || 'unknown'}`
        }, { status: 500 });
    }
}
