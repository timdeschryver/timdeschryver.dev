import gql from 'graphql-tag'
import { client } from '../../apollo-client'

export async function get(req, res) {
  res.writeHead(200, {
    'Cache-Control': `max-age=0, s-max-age=${600}`, // 10 minutes
    'Content-Type': 'application/rss+xml',
  })

  const feed = await generate(req)
  res.end(feed)
}

async function generate(req) {
  const response = await client(req).query({
    query: gql`
      query {
        posts(published: true) {
          html(htmlEntities: true)
          metadata {
            title
            description
            slug
            date
          }
        }
      }
    `,
  })

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
<channel>
<title><![CDATA[ Tim Deschryver ]]></title>
<description><![CDATA[ Blog by Tim Deschryver ]]></description>
<link>${process.env.BASE_PATH}/blog</link>
<atom:link href="${
    process.env.BASE_PATH
  }/blog/rss.xml" rel="self" type="application/rss+xml"/>
<image>
  <url>${process.env.BASE_PATH}/favicons/favicon-32x32.png</url>
  <title>Tim Deschryver</title>
  <link>${process.env.BASE_PATH}/blog</link>
</image>
<language>en-us</language>
<lastBuildDate>${new Date()}</lastBuildDate>
${response.data.posts
  .map(
    post => `
      <item>
        <title><![CDATA[ ${post.metadata.title} ]]></title>
        <description><![CDATA[ ${post.metadata.description} ]]></description>
        <link>${process.env.BASE_PATH}/blog/${post.metadata.slug}</link>
        <guid isPermaLink="false">${process.env.BASE_PATH}/blog/${post.metadata.slug}</guid>
        <pubDate>${post.metadata.date}</pubDate>
        <content:encoded>${post.html}></content:encoded>
      </item>
    `,
  )
  .join('\n')}
</channel>
</rss>`
}
