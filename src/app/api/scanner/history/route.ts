import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch the 5 most recently added items
        const { data, error } = await supabase
            .from('Game_Items')
            .select('name, icon_url')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
        }

        return NextResponse.json({ items: data || [] }, { status: 200 });

    } catch (e: any) {
        console.error("History Fetch Error:", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
