'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var apolloServerMicro = require('apollo-server-micro');
var gql = _interopDefault(require('graphql-tag'));
var dateFns = require('date-fns');
var fs = require('fs');
var path = require('path');
var marked = _interopDefault(require('marked'));
var highlightCode = _interopDefault(require('gatsby-remark-prismjs/highlight-code'));
require('prismjs/components/prism-bash');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-json');
require('prismjs/components/prism-textile');
require('prismjs/components/prism-graphql');
require('prismjs/components/prism-yaml');

const typeDefs = gql`
  type Query {
    posts(published: Boolean): [Post]
    post(slug: String): Post
  }

  type Post {
    html(htmlEntities: Boolean = false): String
    metadata: PostMetadata
  }

  type PostMetadata {
    title: String
    slug: String
    description: String
    author: String
    date(displayAs: String): String
    tags: [String]
    banner: String
    bannerCredit: String
    published: Boolean
    publisher: String
    publish_url: String
    canonical_url: String
  }
`;

const resolvers = {
  Query: {
    posts: (_parent, { published }, { posts }) => {
      if (published === null) {
        return posts
      }

      return posts.filter(post => post.metadata.published === published)
    },
    post: (_parent, { slug }, { posts }) =>
      posts.find(post => post.metadata.slug === slug),
  },

  Post: {
    html(post, { htmlEntities }) {
      if (htmlEntities) {
        return post.html
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
      }
      return post.html
    },
  },
  PostMetadata: {
    date(metadata, { displayAs }) {
      return displayAs === 'human'
        ? dateFns.format(metadata.date, 'MMMM Do YYYY')
        : metadata.date.toString()
    },
    canonical_url(metadata) {
      return (
        metadata.canonical_url ||
        `https://timdeschryver.dev/posts/${metadata.slug}`
      )
    },
  },
};

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
};

function getFiles(dir, extension) {
  const subdirs = fs.readdirSync(dir);

  const files = subdirs.map(subdir => {
    const res = path.join(dir, subdir);
    const isDirectory = fs.lstatSync(res).isDirectory();

    if (isDirectory) {
      return getFiles(res, extension)
    }

    if (path.extname(res) === extension) {
      return res
    }

    return []
  });

  return [].concat(...files)
}

function extractFrontmatter(markdown) {
  const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);
  const frontMatter = match[1];
  const content = markdown.slice(match[0].length);

  const metadata = {};
  frontMatter.split('\n').forEach(pair => {
    const colonIndex = pair.indexOf(':');
    metadata[pair.slice(0, colonIndex).trim()] = pair
      .slice(colonIndex + 1)
      .trim();
  });

  return { metadata, content }
}

function posts() {
  const files = getFiles("../../posts", '.md');
  return files
    .map(file => {
      const markdown = fs.readFileSync(file, 'utf-8');
      const { content, metadata } = extractFrontmatter(markdown);
      const assetsSrc = path.dirname(file.replace('content', ''));
      const renderer = new marked.Renderer();

      renderer.link = (href, title, text) => {
        const href_attr = `href="${href}"`;
        const title_attr = title ? `title="${title}"` : '';
        const prefetch_attr = href.startsWith('/') ? `prefetch="true"` : '';
        const attributes = [href_attr, title_attr, prefetch_attr]
          .filter(Boolean)
          .join(' ');

        return `<a ${attributes}>${text}</a>`
      };

      renderer.image = function(href, _title, text) {
        const src = href.startsWith('http') ? href : path.join(assetsSrc, href);
        return `<img src="${src}" alt="${text}" loading="lazy"/>`
      };

      renderer.code = (source, lang) => {
        lang = lang || 'txt';

        const lineIndex = lang.indexOf('{');
        const fileIndex = lang.indexOf(':');

        const language =
          lineIndex !== -1 || fileIndex !== -1
            ? lang
                .substring(
                  0,
                  Math.min(...[lineIndex, fileIndex].filter(i => i !== -1)),
                )
                .trim()
            : lang;
        const prismLanguage = langs[language];
        const file =
          fileIndex !== -1 ? lang.substr(lang.indexOf(':') + 1).trim() : '';

        const lineNumberRegExp = /{([^}]+)}/g;
        const linesHighlight = [];
        let curMatch;
        while ((curMatch = lineNumberRegExp.exec(lang))) {
          let parts = curMatch[1].split(',');
          parts.forEach(p => {
            let [min, max] = p.split('-').map(Number);
            max = max || min;
            while (min <= max) {
              linesHighlight.push(min++);
            }
          });
        }

        if (!prismLanguage) {
          console.warn('did not found a language for: ' + language);
          return `<pre class='language-text'><code>${source}</code></pre>`
        }

        const highlighted = highlightCode(
          prismLanguage,
          source,
          linesHighlight,
        ).replace(/gatsby-highlight-code-line/g, 'line-highlight');

        const codeBlock = `<code>${highlighted}</code>`;
        const fileBlock = file ? `<div class="file">${file}</div>` : '';
        return `<pre class='language-${prismLanguage}'>${codeBlock}${fileBlock}</pre>`
      };

      renderer.codespan = source => {
        return `<code class="language-text">${source}</code>`
      };

      renderer.heading = (text, level, rawtext) => {
        const anchorRegExp = /{([^}]+)}/g;

        const anchorOverwrite = anchorRegExp.exec(rawtext);
        const fragment = anchorOverwrite
          ? anchorOverwrite[0].substring(2, anchorOverwrite[0].length - 1)
          : slugify(rawtext);
        const anchor = `posts/${metadata.slug}#${fragment}`;

        return `
          <h${level} id="${fragment}">
            <a href="${anchor}" class="anchor" aria-hidden="true">
              ${
                text.includes('{')
                  ? text.substring(0, text.indexOf('{') - 1)
                  : text
              }
            </a>
          </h${level}>`
      };

      const html = marked(
        content.replace(/^\t+/gm, match => match.split('\t').join('  ')),
        { renderer },
      );

      const published = metadata.published === 'true';
      const tags = metadata.tags.split(',').map(p => (p ? p.trim() : p));
      const banner = path.join("https://timdeschryver.dev", assetsSrc, metadata.banner)
        .replace(/\\/g, '/')
        .replace('/', '//');

      return {
        html,
        metadata: {
          ...metadata,
          date: new Date(metadata.date),
          published,
          tags,
          banner,
        },
      }
    })
    .sort((a, b) => (a.metadata.date < b.metadata.date ? 1 : -1))
}

function slugify(string) {
  const a = 'àáäâãåăæçèéëêǵḧìíïîḿńǹñòóöôœøṕŕßśșțùúüûǘẃẍÿź·/_,:;';
  const b = 'aaaaaaaaceeeeghiiiimnnnooooooprssstuuuuuwxyz------';
  const p = new RegExp(a.split('').join('|'), 'g');

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

const apolloServerConfig = {
  typeDefs,
  resolvers,
  context: { posts: posts() },
  introspection: true,
  playground: {
    settings: {},
    tabs: [
      {
        endpoint: '/graphql',
        name: 'All Posts',
        query: `query {
  posts(published: true) {
    metadata {
      title
      description
      author
      slug
      date(displayAs: "human")
    }
  }
}`,
      },
      {
        endpoint: '/graphql',
        name: 'One Post',
        query: `query {
  post(slug: "start-using-ngrx-effects-for-this") {
    html,
    metadata {
      author
    }
  }
}`,
      },
    ],
  },
};

const server = new apolloServerMicro.ApolloServer(apolloServerConfig);

module.exports = server.createHandler();
