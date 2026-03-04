import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUPABASE_URL_HERE',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'SUPABASE_ANON_KEY_HERE'
);

// We'll run the exact query to see the error output natively
async function test() {
    console.log("Testing insert...");

    // Using a fake Discord ID for created_by
    const { data, error } = await supabase
        .from("Clan_Goals")
        .insert({
            title: "Test Goal",
            description: "Debug",
            priority: "Medium",
            status: "Not Started",
            created_by: "12345678"
        })
        .select(`
            *,
            Users!Clan_Goals_created_by_fkey (
               name,
               image
            )
        `)

    console.dir(error, { depth: null });
    console.dir(data, { depth: null });
}

test();
