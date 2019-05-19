import { posts } from '../routes/posts/_posts'

function htmlEntities(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function feed() {
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
<channel>
<title><![CDATA[ Tim Deschryver's Posts ]]></title>
<description><![CDATA[ Posts written by Tim Deschryver ]]></description>
<link>https://timdeschryver.dev/posts</link>
<image>
  <url>https://timdeschryver.dev/favicons/favicon-32x32.png</url>
  <title>Tim Deschryver's Posts</title>
  <link>https://timdeschryver.dev/posts</link>
</image>
${posts()
  .filter(post => post.metadata.published)
  .map(
    post => `
      <item>
        <title><![CDATA[ ${post.metadata.title} ]]></title>
        <description><![CDATA[ ${post.metadata.description} ]]></description>
        <link>https://timdeschryver.dev/posts/${post.metadata.slug}</link>
        <pubDate>${post.metadata.date}</pubDate>
        <content:encoded>${htmlEntities(post.html)}></content:encoded>
      </item>
    `,
  )
  .join('\n')}
</channel>
</rss>`
}
