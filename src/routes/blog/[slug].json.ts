import { posts } from "./_posts";

export function get(req) {
  const allPosts = posts();
  const post = allPosts.find((x) => x.metadata.slug === req.params.slug);
  return {
    body: post,
    headers: {
      // "Cache-Control": `max-age=0, s-max-age=${600}`, // 10 minutes
      "Content-Type": "application/json",
    },
  };
}
