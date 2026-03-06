import { NextResponse } from "next/server";

export async function GET() {
    try {
        const query = 'darkfall';

        // 1. GitHub Search
        const githubUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query + ' in:name')}&sort=updated&order=desc`;
        const githubPromise = fetch(githubUrl, {
            headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Dreadkrew-Intel-Watcher' },
            next: { revalidate: 3600 }
        }).then(r => r.json()).catch(() => ({ items: [] }));

        // 2. GitLab Search (Public)
        const gitlabUrl = `https://gitlab.com/api/v4/projects?search=${encodeURIComponent(query)}&visibility=public&order_by=last_activity_at&sort=desc&per_page=10`;
        const gitlabPromise = fetch(gitlabUrl, {
            next: { revalidate: 3600 }
        }).then(r => r.json()).catch(() => []);

        // Wait for all
        const [githubData, gitlabData] = await Promise.all([githubPromise, gitlabPromise]);

        const githubRepos = (githubData.items || []).map((repo: any) => ({
            id: `github-${repo.id}`,
            platform: 'github',
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

        const gitlabRepos = (Array.isArray(gitlabData) ? gitlabData : []).map((repo: any) => ({
            id: `gitlab-${repo.id}`,
            platform: 'gitlab',
            name: repo.name,
            fullName: repo.path_with_namespace,
            description: repo.description,
            url: repo.web_url,
            stars: repo.star_count,
            language: null, // GitLab projects API doesn't return primary language directly here
            updatedAt: repo.last_activity_at,
            owner: repo.namespace.name,
            avatar: repo.avatar_url || 'https://gitlab.com/assets/gitlab_logo-7ae504fe4f68fdebb3c2998423637e75300de2a1.png'
        }));

        // Combine and sort by date
        const allRepos = [...githubRepos, ...gitlabRepos].sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        return NextResponse.json({
            success: true,
            data: allRepos.slice(0, 20)
        });
    } catch (error: any) {
        console.error("Code Watch Aggregator Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
