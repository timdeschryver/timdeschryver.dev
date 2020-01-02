import gql from 'graphql-tag'
import { client } from '../apollo-client'

export async function get(req, res) {
  res.writeHead(200, {
    'Cache-Control': `max-age=0, s-max-age=${600}`, // 10 minutes
    'Content-Type': 'application/xml',
  })

  const map = await generate(req)
  res.end(map)
}

async function generate(req) {
  const response = await client(req).query({
    query: gql`
      query {
        posts(published: true) {
          metadata {
            slug
          }
        }
      }
    `,
  })

  const lastMod = `<lastmod>${new Date().toISOString()}</lastmod>`
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" 
    xmlns:xhtml="http://www.w3.org/1999/xhtml" 
    xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" 
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" 
    xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
    <url>
      <loc>https://timdeschryver.dev</loc>
      <priority>1.0</priority>
      <changefreq>daily</changefreq>
      ${lastMod}
    </url>
    <url>
      <loc>https://timdeschryver.dev/snippets</loc>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
      ${lastMod}
    </url>
    <url>
      <loc>https://timdeschryver.dev/blog</loc>
      <changefreq>daily</changefreq>
      <priority>0.6</priority>
      ${lastMod}
    </url>
    ${response.data.posts
      .map(
        post => `<url>
          <loc>https://timdeschryver.dev/blog/${post.metadata.slug}</loc>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
          ${lastMod}
        </url>`,
      )
      .join('\n')}
  </urlset>`
}
