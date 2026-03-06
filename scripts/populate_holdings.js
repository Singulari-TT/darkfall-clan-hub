const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const holdings = [
    { name: 'Aradoth', type: 'City' },
    { name: 'Izkand', type: 'City' },
    { name: 'Kryzerok', type: 'City', image_url: '/kryzerok.png' },
    { name: 'Ul\'Hamra', type: 'City' }
];

const nodeTypes = ['Timber Grove', 'Quarry', 'Mine', 'Herb Patch'];

async function populate() {
    console.log("🚀 Populating Empire Holdings...");

    for (const h of holdings) {
        console.log(`Processing ${h.name}...`);

        // Upsert Holding
        const { data: holdingData, error: hError } = await supabase
            .from('Holdings')
            .upsert(h, { onConflict: 'name' })
            .select()
            .single();

        if (hError) {
            console.error(`Error upserting ${h.name}:`, hError.message);
            continue;
        }

        const holdingId = holdingData.id;
        console.log(`✅ ${h.name} ready (ID: ${holdingId})`);

        // Create Nodes for each type if they don't exist
        for (const type of nodeTypes) {
            const { error: nError } = await supabase
                .from('Resource_Nodes')
                .upsert({
                    holding_id: holdingId,
                    node_type: type
                }, { onConflict: 'holding_id,node_type' }); // Note: unique constraint might be needed in SQL if not there

            if (nError) {
                // If it fails due to lack of unique constraint, we'll just ignore for now or handle
                console.log(`Node ${type} for ${h.name} might already exist or needs schema update.`);
            } else {
                console.log(`   + Node: ${type}`);
            }
        }
    }

    console.log("👑 Empire Population Complete.");
}

populate();
