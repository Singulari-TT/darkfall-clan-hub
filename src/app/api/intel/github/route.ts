import { NextResponse } from "next/server";

export async function GET() {
    try {
        const query = 'darkfall in:name';
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                // Adding a User-Agent is required by GitHub API
                'User-Agent': 'Dreadkrew-Intel-Watcher'
            },
            next: { revalidate: 3600 } // Cache for 1 hour to stay within rate limits
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "GitHub API Request Failed");
        }

        const data = await response.json();

        const repos = data.items.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            language: repo.language,
            updatedAt: repo.updated_at,
            owner: repo.owner.login,
            avatar: repo.owner.avatar_url
        }));

        return NextResponse.json({
            success: true,
            data: repos.slice(0, 15) // Top 15 latest projects
        });
    } catch (error: any) {
        console.error("GitHub Search Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
