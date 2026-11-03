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
