require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log("Attempting to create generic public 'item-icons' bucket...");

    // Create the bucket using the Storage API
    const { data, error } = await supabase
        .storage
        .createBucket('item-icons', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log("✅ Bucket 'item-icons' already exists!");
        } else {
            console.error("❌ Error creating bucket:", error.message);
        }
    } else {
        console.log("✅ Successfully created 'item-icons' bucket!");
    }
}

createBucket();
