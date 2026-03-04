require('dotenv').config({ path: '.env.local' });

const { DISCORD_CLIENT_ID, DISCORD_BOT_TOKEN } = process.env;

if (!DISCORD_CLIENT_ID || !DISCORD_BOT_TOKEN) {
    console.error("Missing DISCORD_CLIENT_ID or DISCORD_BOT_TOKEN in .env.local");
    process.exit(1);
}

const commands = [
    {
        name: "roster",
        description: "Pull a Dreadkrew member's character roster directly from the Hub.",
        options: [
            {
                name: "user",
                description: "The Discord user to query. (Leave blank for yourself)",
                type: 6, // USER type
                required: false
            }
        ]
    },
    {
        name: "market",
        description: "Fetch the active logistics buy/sell orders from the Clan Bank.",
    },
    {
        name: "intel",
        description: "Submit a quick text-based tactical recon report to the War Room.",
        options: [
            {
                name: "report",
                description: "The tactical intel you wish to report.",
                type: 3, // STRING
                required: true
            }
        ]
    }
];

async function register() {
    console.log("Pushing Bot Commands to Discord API...");
    const res = await fetch(`https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/commands`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bot ${DISCORD_BOT_TOKEN}`
        },
        body: JSON.stringify(commands)
    });

    if (res.ok) {
        console.log("Successfully registered /roster, /market, and /intel commands globally!");
    } else {
        console.error("Failed to register commands:", await res.text());
    }
}

register();
