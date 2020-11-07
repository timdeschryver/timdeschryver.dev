import { posts } from "../_posts";

export function get() {
  return {
    body: posts(),
    headers: {
      "Cache-Control": `max-age=0, s-max-age=${600}`, // 10 minutes
      "Content-Type": "application/json",
    },
  };
}
