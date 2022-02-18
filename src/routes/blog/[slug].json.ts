import {readPosts} from '../_posts';
import fetch from "node-fetch";

export async function get(req) {
    const posts = await readPosts()
    const post = posts.find((p) => p.metadata.slug === req.params.slug);

    if (!post) {
        return {
            status: 404,
        };
    }

    return {
        body: {
            post: {
                ...post,
                contributors: await getContributors(post.metadata.slug)
            }
        },
        headers: {
            'Cache-Control': `max-age=300`
        }
    };
}


async function getContributors(slug: string) {
    return fetch(`https://api.github.com/repos/timdeschryver/timdeschryver.dev/commits?path=content/blog/${slug}/`, {
        headers: {
            'Authorization': `Bearer: ${import.meta.env.VITE_GITHUB_TOKEN}`,
        },
    })
        .then(res => res.json())
        .then((commits: any) => {
            return [...new Map(commits
                .filter(commit => !['timdeschryver', 'web-flow'].includes(commit.author.login))
                .map(commit => {
                    return [commit.author.login, commit.commit.author.name]
                }))]
        }).catch(() => {
            return []
        });
}
