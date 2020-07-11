'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var apolloServerMicro = require('apollo-server-micro');
var gql = _interopDefault(require('graphql-tag'));
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
require('prismjs/components/prism-diff');
require('prismjs/components/prism-csharp');

const typeDefs = gql`
  type Query {
    posts(published: Boolean, first: Int): [Post]
    post(slug: String): Post
    snippets: [Snippet]
  }

  type Post {
    html(htmlEntities: Boolean = false): String
    metadata: PostMetadata
  }

  type PostMetadata {
    title: String
    folder: String
    slug: String
    description: String
    author: String
    date(displayAs: String): String
    tags: [String]
    banner: String
    bannerCredit: String
    published: Boolean
    canonical_url: String
  }

  type Snippet {
    html(htmlEntities: Boolean = false): String
    metadata: SnippetMetadata
  }

  type SnippetMetadata {
    title: String
    slug: String
    image: String
    date(displayAs: String): String
    tags: [String]
    author: String
  }
`;

const resolvers = {
  Query: {
    posts: (_parent, { published, first }, { posts }) => {
      const filteredPosts =
        published === null || published === undefined
          ? posts
          : posts.filter(post => post.metadata.published === published);

      return filteredPosts.filter(
        (_, i) => i < (first || Number.MAX_SAFE_INTEGER),
      )
    },
    post: (_parent, { slug }, { posts }) =>
      posts.find(post => post.metadata.slug === slug),

    snippets: (_parent, _args, { snippets }) => {
      return snippets
    },
  },

  Post: {
    html,
  },
  PostMetadata: {
    date,
    canonical_url(metadata) {
      return (
        metadata.canonical_url ||
        `https://timdeschryver.dev/blog/${metadata.slug}`
      )
    },
  },

  Snippet: {
    html,
  },
  SnippetMetadata: {
    date,
  },
};

function html(content, { htmlEntities }) {
  if (htmlEntities) {
    return content.html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }
  return content.html
}

function date(metadata, { displayAs }) {
  return displayAs === 'human'
    ? new Date(metadata.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      })
    : metadata.date.toString()
}

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
  diff: 'diff',
  cs: 'csharp',
};

function posts() {
  const files = getFiles("./content/blog", '.md');
  return files
    .map(file => {
      const folder = path.dirname(file)
        .split(path.sep)
        .pop();
      const { html, metadata, assetsSrc } = parseFileToHtmlAndMeta(file, {
        createAnchorAndFragment: (_level, metadata, text) => {
          const anchorRegExp = /{([^}]+)}/g;
          const anchorOverwrite = anchorRegExp.exec(text);
          const fragment = anchorOverwrite
            ? anchorOverwrite[0].substring(2, anchorOverwrite[0].length - 1)
            : slugify(text);

          return { anchor: `blog/${metadata.slug}#${fragment}`, fragment }
        },
      });

      const published = metadata.published === 'true';
      const tags = metadata.tags.split(',').map(p =>
        p
          ? p
              .trim()
              .charAt(0)
              .toUpperCase() + p.trim().slice(1)
          : p,
      );

      const banner = path.join("http://localhost:3000", assetsSrc, metadata.banner)
        .replace(/\\/g, '/')
        .replace('/', '//');

      return {
        html,
        metadata: {
          ...metadata,
          folder,
          date: new Date(metadata.date),
          published,
          tags,
          banner,
        },
      }
    })
    .sort(sortByDate)
}

function snippets() {
  const files = getFiles("./content/snippets", '.md');
  return files
    .map(file => {
      const { html, metadata, assetsSrc } = parseFileToHtmlAndMeta(file, {
        createAnchorAndFragment: (level, metadata) =>
          level == 2
            ? {
                anchor: `snippets/${metadata.slug}`,
                fragment: metadata.slug,
              }
            : {},
        createHeadingParts: metadata => {
          return [
            metadata.image
              ? `<a href="${metadata.image}" download>Download</a>`
              : '',
            metadata.image
              ? `<a
                target="_blank"
                rel="noopener noreferrer"
                href="https://twitter.com/intent/tweet?text=${metadata.title}&via=tim_deschryver&url=${"http://localhost:3000"}/snippets/${metadata.slug}">Share</a>`
              : '',
          ]
        },
      });
      const tags = metadata.tags.split(',').map(p => (p ? p.trim() : p));
      const image = `${"http://localhost:3000"}/${metadata.image}`;

      return {
        html,
        metadata: {
          ...metadata,
          date: new Date(metadata.date),
          tags,
          image,
        },
      }
    })
    .sort(sortByDate)
}

function parseFileToHtmlAndMeta(
  file,
  { createAnchorAndFragment = () => {}, createHeadingParts = () => [] },
) {
  const markdown = fs.readFileSync(file, 'utf-8');
  const { content, metadata } = extractFrontmatter(markdown);
  const assetsSrc = path.dirname(file.replace('content', ''));
  const renderer = new marked.Renderer();

  renderer.link = (href, title, text) => {
    const basePath = path.dirname(file)
      .split(path.sep)
      .splice(1, 2)
      .join('/');
    const href_attr = href.startsWith('#')
      ? `href="${basePath}${href}"`
      : `href="${href}"`;
    const title_attr = title ? `title="${title}"` : '';
    const prefetch_attr = href.startsWith('/') ? `prefetch="true"` : '';
    const attributes = [href_attr, title_attr, prefetch_attr]
      .filter(Boolean)
      .join(' ');

    return `<a ${attributes}>${text}</a>`
  };

  renderer.image = function(href, _title, text) {
    const src = href.startsWith('http') ? href : path.join(assetsSrc, href);
    return `<figure>
      <img src="${src}" alt="${text}" loading="lazy"/>
      <figcaption>${text}</figcaption>
    </figure>`
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

    const highlightedLines = highlightCode(
      prismLanguage,
      source,
      {},
      linesHighlight,
    );

    const highlighted = highlightedLines
      .replace(/gatsby-highlight-code-line/g, 'line-highlight')
      // add space to render the line
      .replace(
        /<span class="line-highlight"><\/span>/g,
        '<span class="line-highlight"> </span>',
      );

    const codeBlock = `<code>${highlighted}</code>`;
    const headingParts = [file, ...createHeadingParts(metadata)].filter(Boolean);
    const heading = headingParts.length
      ? `<div class="code-heading">${headingParts.join('•')}</div>`
      : '';
    return `<pre class='language-${prismLanguage}'>${heading}${codeBlock}</pre>`
  };

  renderer.codespan = source => {
    return `<code class="language-text">${source}</code>`
  };

  renderer.heading = (text, level, rawtext) => {
    const headingText = text.includes('{')
      ? text.substring(0, text.indexOf('{') - 1)
      : text;

    const { anchor, fragment } = createAnchorAndFragment(
      level,
      metadata,
      rawtext,
    );
    if (!anchor) {
      return `<h${level}>${headingText}</h${level}>`
    }

    return `
      <h${level} id="${fragment}">
        <a href="${anchor}" class="anchor" aria-hidden="true" tabindex="-1">
          ${headingText}
        </a>
      </h${level}>`
  };

  const html = marked(
    content.replace(/^\t+/gm, match => match.split('\t').join('  ')),
    { renderer },
  );

  return { html, metadata, assetsSrc }
}

function getFiles(dir, extension, files = []) {
  const dirFiles = fs.readdirSync(dir);

  dirFiles.forEach(path$1 => {
    const file = path.join(dir, path$1);
    const isDirectory = fs.lstatSync(file).isDirectory();

    if (isDirectory) {
      return getFiles(file, extension, files)
    }

    if (path.extname(file) === extension) {
      files.push(file);
    }
  });

  return files
}

function extractFrontmatter(markdown) {
  const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);
  const frontMatter = match[1];
  const content = markdown.slice(match[0].length);

  const metadata = frontMatter.split('\n').reduce((data, pair) => {
    const colonIndex = pair.indexOf(':');
    data[pair.slice(0, colonIndex).trim()] = pair.slice(colonIndex + 1).trim();
    return data
  }, {});

  return { metadata, content }
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

function sortByDate(a, b) {
  return a.metadata.date < b.metadata.date ? 1 : -1
}

const apolloServerConfig = {
  typeDefs,
  resolvers,
  context: { posts: posts(), snippets: snippets() },
  introspection: true,
  playground: {
    settings: {},
    tabs: [
      {
        endpoint: '/api/graphql',
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
        endpoint: '/api/graphql',
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

module.exports = server.createHandler({ path: '/api/graphql' });
