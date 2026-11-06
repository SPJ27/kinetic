import { getAccessToken } from "./access-token";

export async function getLatestCommit(repoUrl: string, accessToken?: string) {
    const url = new URL(repoUrl);
    const match = url.pathname.match(
        /^\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9._-]+?)(?:\.git)?\/?$/
    );

    if (!match) {
        throw new Error("Invalid GitHub repository URL");
    }
    const [, owner, repo] = match;
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits`,
        {
            headers: {
                Accept: "application/vnd.github+json",
                ...(accessToken && {
                    Authorization: `Bearer ${accessToken}`,
                }),
            },
        }
    )

    if (!response.ok) {
        throw new Error(
            `GitHub API error: ${response.status} ${response.statusText}`
        );
    }
    const commits = await response.json();

    const latest = commits[0];
    return {
        sha: latest.sha,
        shortSha: latest.sha.slice(0, 7)
    };
}

export async function getRepos() {
    const { accessToken } = await getAccessToken();
    const response = await fetch("https://api.github.com/user/repos?sort=pushed&direction=desc&per_page=100", {
        headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${accessToken}`,
        },
    })
    const repos = await response.json();
    return repos.map((repo: any) => ({
        name: repo.name,
        fullName: repo.full_name,
        url: repo.html_url,
        pushedAt: repo.pushed_at
    }));

}