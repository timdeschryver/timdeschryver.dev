# timdeschryver.dev auth.md

How AI agents can access timdeschryver.dev.

## Audience

AI agents, assistants, crawlers, and other automated tools that read the articles and notes published on this site.

## Registration

Not required. This is a public, read-only blog. There are no user accounts, and no registration or provisioning endpoint.

## Supported methods

All access is anonymous and read-only:

- Unauthenticated HTTPS `GET` requests for the pages, their Markdown versions, and the feeds
- [MCP server](https://timdeschryver.dev/mcp): Streamable HTTP MCP server with `search_content` and `read_content` tools, described by its [server card](https://timdeschryver.dev/.well-known/mcp/server-card.json)
- [A2A agent](https://timdeschryver.dev/a2a): Agent2Agent endpoint, described by its [agent card](https://timdeschryver.dev/.well-known/agent-card.json)

## Credentials

None. The site, the MCP server, and the A2A agent do not issue or accept API keys, OAuth tokens, or session cookies, so agents do not need to send credentials.

## Where to start

- [llms.txt](https://timdeschryver.dev/llms.txt): Index of every blog post and developer bit, linking to their Markdown versions
- Markdown versions: Append `.md` to any blog post or developer bit URL, for example `https://timdeschryver.dev/blog/<slug>.md`
- [XML sitemap](https://timdeschryver.dev/sitemap.xml): Complete index of canonical pages
- [RSS feed](https://timdeschryver.dev/blog/rss.xml): Full-content feed of long-form articles
