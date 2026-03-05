import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
        return NextResponse.json({ error: "YOUTUBE_API_KEY is missing in environment variables." }, { status: 500 });
    }

    try {
        // Build a robust query to capture organic content
        const query = encodeURIComponent('("Darkfall" OR "Rise of Agon" OR "RoA") AND ("pvp" OR "gameplay" OR "siege" OR "guide")');
        const publishedAfter = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(); // Last 14 days

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&order=date&maxResults=15&publishedAfter=${publishedAfter}&key=${YOUTUBE_API_KEY}`;

        const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache results for 1 hour
        const data = await res.json();

        // Fetch hidden media IDs from the database
        const { data: hiddenMedia, error: hiddenError } = await supabase
            .from('Hidden_Media')
            .select('youtube_id');

        const hiddenIds = new Set(hiddenMedia?.map(h => h.youtube_id) || []);

        // Filter out obviously unrelated content based on negative keywords if necessary,
        // or just return the results directly since the OR/AND query is fairly strict.
        const filteredItems = (data.items || []).filter((item: any) => {
            if (hiddenIds.has(item.id.videoId)) {
                return false;
            }
            const title = item.snippet.title.toLowerCase();
            const desc = item.snippet.description.toLowerCase();
            const combined = title + " " + desc;

            // Reject videos that might false-positive on "RoA" (e.g., Return of Alice, Rules of Action)
            // Unless they also mention Darkfall or Agon
            if (combined.includes('return of') || combined.includes('rules of')) {
                return combined.includes('darkfall') || combined.includes('agon');
            }

            return true;
        });

        // Return up to 12 videos
        return NextResponse.json({ items: filteredItems.slice(0, 12) });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
