# timdeschryver.dev auth.md

How AI agents can access timdeschryver.dev.

## Audience

AI agents, assistants, crawlers, and other automated tools that read the articles and notes published on this site.

## Registration

Not required. This is a public, read-only blog. There are no user accounts, no API, and no registration or provisioning endpoint.

## Supported methods

Unauthenticated HTTPS `GET` requests. All content is public, and there is no other access method.

## Credentials

None. The site does not issue or accept API keys, OAuth tokens, or session cookies, so agents do not need to send credentials.

## Where to start

- [llms.txt](https://timdeschryver.dev/llms.txt): Index of every blog post and developer bit, linking to their Markdown versions
- Markdown versions: Append `.md` to any blog post or developer bit URL, for example `https://timdeschryver.dev/blog/<slug>.md`
- [XML sitemap](https://timdeschryver.dev/sitemap.xml): Complete index of canonical pages
- [RSS feed](https://timdeschryver.dev/blog/rss.xml): Full-content feed of long-form articles
