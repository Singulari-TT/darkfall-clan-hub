import { NextResponse } from 'next/server';

export async function GET() {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
        return NextResponse.json({ error: "YOUTUBE_API_KEY is missing in environment variables." }, { status: 500 });
    }

    try {
        // We look for videos mentioning "Rise of Agon" published in the last 7 days
        const query = encodeURIComponent("Rise of Agon");
        const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&order=date&maxResults=12&publishedAfter=${publishedAfter}&key=${YOUTUBE_API_KEY}`;

        const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache results for 1 hour
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error?.message || "YouTube API error");
        }

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
