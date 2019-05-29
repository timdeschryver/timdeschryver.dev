'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var apolloServerMicro = require('apollo-server-micro');
var gql = _interopDefault(require('graphql-tag'));
var dateFns = require('date-fns');
var fs = require('fs');
var path = require('path');
var markdown_js = require('@sveltejs/site-kit/utils/markdown.js');
var marked = _interopDefault(require('marked'));
var PrismJS = _interopDefault(require('prismjs'));
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
  }
`;

const resolvers = {
  Query: {
    posts: (parent, { published }, { posts }) => {
      if (published === undefined) {
        return posts
      }

      return posts.filter(post => post.metadata.published === published)
    },
    post: (parent, { slug }, { posts }) =>
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
      if (displayAs === 'human') {
        const diff = dateFns.differenceInDays(new Date(), metadata.date);
        const dateFormatted =
          diff <= 7
            ? dateFns.distanceInWordsToNow(metadata.date, new Date()) + ' ago'
            : dateFns.format(metadata.date, 'MMMM Do YYYY');
        return dateFormatted
      }
      return metadata.date
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

function posts() {
  const files = getFiles('./content/posts', '.md');
  return files
    .map(file => {
      const markdown = fs.readFileSync(file, 'utf-8');
      const { content, metadata } = markdown_js.extract_frontmatter(markdown);
      const assetsSrc = path.dirname(file.replace('content', ''));
      const renderer = new marked.Renderer();

      renderer.link = (href, title, text) => {
        let title_attr = '';

        if (title !== null) {
          title_attr = ` title="${title}"`;
        }

        return `<a href="${href}"${title_attr}>${text}</a>`
      };

      renderer.image = function(href, _title, text) {
        const src = path.join(assetsSrc, href);
        return `<img src="${src}" alt="${text}" loading="lazy"/>`
      };

      renderer.code = (source, lang) => {
        const plang = langs[lang || 'txt'];
        if (!plang) {
          console.warn('did not found a language for: ' + lang);
          return `<pre class='language-text'><code>${source}</code></pre>`
        }

        const highlighted = PrismJS.highlight(
          source,
          PrismJS.languages[plang],
          lang,
        );

        return `<pre class='language-${plang}'><code>${highlighted}</code></pre>`
      };

      renderer.codespan = source => {
        return `<code class="language-text">${source}</code>`
      };

      renderer.heading = (text, level, rawtext) => {
        const fragment = slugify(rawtext);

        return `
          <h${level}>
            <span id="${fragment}" class="offset-anchor"></span>
            <a href="posts/${
              metadata.slug
            }#${fragment}" class="anchor" aria-hidden="true"></a>
            ${text}
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
