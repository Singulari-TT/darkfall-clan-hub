import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function sha1Upper(text: string) {
    return crypto.createHash("sha1").update(text).digest("hex").toUpperCase();
}

const LZW_decompress = (compressed: string[]): string => {
    let dictSize = 0;
    const dictionary: Record<number, string> = {};
    let w = String.fromCharCode(parseInt(compressed[0]));
    let result = w;
    for (let i = 1; i < compressed.length; i++) {
        const k = compressed[i];
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
    const rck = text1.match(/<RCK>(.*?)<\/RCK>/)![1];
    const wbg = text1.match(/<WebGateRequest>(.*?)<\/WebGateRequest>/)![1];
    const hpass = sha1Upper(sha1Upper(password) + rck);
    const resp2 = await fetch(`${baseUrl}?WebGateRequest=${wbg}&Password=${hpass}&UserName=${username}&RequestOwner=EXTBRM`);
    return (await resp2.text()).match(/<SessionKey>(.*?)<\/SessionKey>/)![1];
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

    // Count online member tags
    const matches = xml.match(/<OnlineRecord>/g);
    const count = matches?.length ?? 0;

    // Update the SystemConfig table so the dashboard reflects this
    await db.from("SystemConfig").upsert({
        key: "members_logged_in",
        value: count.toString()
    }, { onConflict: "key" });

    return { processed: count, note: `Found ${count} online records. Database updated.` };
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
            if (harvestMatch) {
                const [, , nodeType, holdingName, milestone] = harvestMatch;
                const { data: holding } = await db.from("Holdings").select("id").eq("name", holdingName).single();
                if (holding) {
                    const { data: node } = await db.from("Resource_Nodes").select("id, total_hits").eq("holding_id", (holding as any).id).eq("type", nodeType).single();
                    if (node) {
                        await db.from("Resource_Nodes").update({ total_hits: Math.max((node as any).total_hits, parseInt(milestone)) }).eq("id", (node as any).id);
                    } else {
                        await db.from("Resource_Nodes").insert({ holding_id: (holding as any).id, type: nodeType, total_hits: parseInt(milestone) });
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

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session as any)?.user?.id || (session as any).user.role !== "Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { script } = await req.json();
        const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

        let result: { processed: number; note: string };
        switch (script) {
            case "online-status":
                result = await runOnlineStatus(db);
                break;
            case "harvest-sync":
                result = await runHarvestSync(db);
                break;
            default:
                return NextResponse.json({ error: `Unknown script: ${script}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, ...result });
    } catch (e: any) {
        console.error("Trigger scrape error:", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
