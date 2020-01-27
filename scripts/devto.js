const { readFileSync } = require('fs')
const { join } = require('path')
const fetch = require('node-fetch')

const [slug] = process.argv.slice(2)

require('dotenv-extended').load({
  path: '.env',
})
;(async () => {
  try {
    const url = `https://timdeschryver.dev/blog/${slug}`
    const file = readFileSync(
      join('./content/blog', slug, 'index.md'),
      'utf-8',
    ).replace(/\.\/images\//g, `${url}/images/`)
    const { metadata, content } = extractFrontmatter(file)

    const devToContent = content
      .split('\n')
      .map(line => {
        if (line.startsWith('```')) {
          const a = line.includes(':') ? line.indexOf(':') : line.length
          const b = line.includes('{') ? line.indexOf('{') : line.length
          return line.substring(0, Math.min(a, b))
        }
        return line
      })
      .join('\n')

    const devToMeta = {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags
        .split(',')
        .filter((_, i) => i < 4)
        .map(t =>
          t
            .trim()
            .replace(' ', '')
            .toLowerCase(),
        ),
      cover_image: metadata.banner,
      published: true,
    }
    console.log(devToContent)
    console.log(devToMeta)

    const devToMarkdown = `---
${Object.entries(devToMeta)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}
---

Follow me on Twitter at [@tim_deschryver](https://twitter.com/tim_deschryver) | Originally published on [timdeschryver.dev](${url}).

${devToContent}

-------

Follow me on Twitter at [@tim_deschryver](https://twitter.com/tim_deschryver) | Originally published on [timdeschryver.dev](${url}).
`

    const article = {
      article: {
        title: devToMeta.title,
        body_markdown: devToContent,
        description: devToMeta.description,
        published: true,
        tags: devToMeta.tags,
        main_image: devToMeta.cover_image,
        canonical_url: url,
      },
    }

    const result = await postArticle(article)
    console.log(result)
  } catch (err) {
    console.log(err)
  }
})()

function extractFrontmatter(markdown) {
  const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown)
  const frontMatter = match[1]
  const content = markdown.slice(match[0].length)

  const metadata = frontMatter.split('\n').reduce((data, pair) => {
    const colonIndex = pair.indexOf(':')
    data[pair.slice(0, colonIndex).trim()] = pair.slice(colonIndex + 1).trim()
    return data
  }, {})

  return { metadata, content }
}

async function postArticle(article) {
  return await fetch('https://dev.to/api/articles', {
    method: 'post',
    body: JSON.stringify(article),
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.DEVTO_TOKEN,
    },
  }).then(res => res.json())
}
