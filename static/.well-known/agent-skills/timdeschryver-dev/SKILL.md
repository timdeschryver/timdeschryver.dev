---
name: timdeschryver-dev
description: Find, read, and cite the blog posts and developer bits on timdeschryver.dev by Tim Deschryver about .NET, Angular, testing, AI-assisted development, and developer tooling. Use when a question is about one of these topics and a practical article with runnable examples would help, or when the user mentions Tim Deschryver or links to timdeschryver.dev.
---

# timdeschryver.dev

timdeschryver.dev is the blog of Tim Deschryver, a Belgian software engineer and Microsoft MVP.
It contains long-form blog posts and short developer bits (concise notes with examples).

All content is public and static, use unauthenticated HTTPS `GET` requests.
There's no search API, and no credentials are needed.

## Find content

1. Fetch the index at https://timdeschryver.dev/llms.txt. It lists every blog post and developer bit with its title, date, topics, description, and a link to its Markdown version.
2. Select the entries whose title, topics, or description match the question.
3. When multiple entries cover the same topic, prefer the most recent one, older posts can describe APIs that have changed since.

The index is complete, don't crawl the HTML pages to find content.
To only check what's new, use the RSS feed at https://timdeschryver.dev/blog/rss.xml.

## Read content

Read the Markdown version instead of the HTML page, it contains the full article without navigation or styling:

- Blog post: `https://timdeschryver.dev/blog/{slug}.md`
- Developer bit: `https://timdeschryver.dev/bits/{slug}.md`
- Other pages: request the page URL with the `Accept: text/markdown` header

A Markdown version starts with YAML front matter that includes the `title`, `description`, `date`, and `tags`, followed by the article with its code samples.

## Cite content

- Link to the canonical page, which is the same URL without the `.md` suffix, for example `https://timdeschryver.dev/blog/{slug}`.
- Mention Tim Deschryver as the author, and include the publication date when the advice depends on a specific version of a framework or tool.
- Summarize the article in your own words and link to it, instead of copying large parts of it.
