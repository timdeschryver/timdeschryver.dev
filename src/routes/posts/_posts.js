import { readdirSync, lstatSync, readFileSync } from 'fs'
import { join, extname, dirname } from 'path'
import { format, differenceInDays, distanceInWordsToNow } from 'date-fns'
import { extract_frontmatter } from '@sveltejs/site-kit/utils/markdown.js'
import marked from 'marked'
import PrismJS from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-textile'
import 'prismjs/components/prism-graphql'
import 'prismjs/components/prism-yaml'
require('dotenv-extended').load({
  path: '.env.' + process.env.NODE_ENV,
})

const langs = {
  bash: 'bash',
  html: 'markup',
  sv: 'markup',
  js: 'javascript',
  ts: 'typescript',
  json: 'json',
  css: 'css',
  txt: 'textile',
  graphql: 'graphql',
  yml: 'yaml',
}

function getFiles(dir, extension) {
  const subdirs = readdirSync(dir)

  const files = subdirs.map(subdir => {
    const res = join(dir, subdir)
    const isDirectory = lstatSync(res).isDirectory()

    if (isDirectory) {
      return getFiles(res, extension)
    }

    if (extname(res) === extension) {
      return res
    }

    return []
  })

  return [].concat(...files)
}

export function posts() {
  const files = getFiles('./content/posts', '.md')
  return files
    .map(file => {
      const markdown = readFileSync(file, 'utf-8')
      const { content, metadata } = extract_frontmatter(markdown)
      const assetsSrc = dirname(file.replace('content', ''))
      const renderer = new marked.Renderer()

      renderer.link = (href, title, text) => {
        let title_attr = ''

        if (title !== null) {
          title_attr = ` title="${title}"`
        }

        return `<a href="${href}"${title_attr}>${text}</a>`
      }

      renderer.image = function(href, _title, text) {
        const src = join(assetsSrc, href)
        return `<img src="${src}" alt="${text}" loading="lazy"/>`
      }

      renderer.code = (source, lang) => {
        const plang = langs[lang || 'txt']
        if (!plang) {
          console.warn('did not found a language for: ' + lang)
          return `<pre class='language-text'><code>${source}</code></pre>`
        }

        const highlighted = PrismJS.highlight(source, PrismJS.languages[plang], lang)

        return `<pre class='language-${plang}'><code>${highlighted}</code></pre>`
      }

      renderer.codespan = source => {
        return `<code class="language-text">${source}</code>`
      }

      renderer.heading = (text, level, rawtext) => {
        const fragment = slugify(rawtext)

        return `
          <h${level}>
            <span id="${fragment}" class="offset-anchor"></span>
            <a href="posts/${metadata.slug}#${fragment}" class="anchor" aria-hidden="true"></a>
            ${text}
          </h${level}>`
      }

      const html = marked(content.replace(/^\t+/gm, match => match.split('\t').join('  ')), { renderer })

      const date = new Date(metadata.date)
      const diff = differenceInDays(new Date(), date)
      const dateFormat = diff <= 7 ? distanceInWordsToNow(date, new Date()) + ' ago' : format(date, 'MMMM Do YYYY')

      const published = metadata.published === 'true'
      const tags = metadata.tags.split(',').map(p => (p ? p.trim() : p))
      const banner = join(process.env.BASE_PATH, assetsSrc, metadata.banner)
        .replace(/\\/g, '/')
        .replace('/', '//')

      return {
        html,
        metadata: { ...metadata, date, dateFormat, published, tags, banner },
      }
    })
    .sort((a, b) => (a.metadata.date < b.metadata.date ? 1 : -1))
}

function slugify(string) {
  const a = 'àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;'
  const b = 'aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}
