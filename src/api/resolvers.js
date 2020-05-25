export const resolvers = {
  Query: {
    posts: (_parent, { published }, { posts }) => {
      if (published === null) {
        return posts
      }

      return posts.filter(post => post.metadata.published === published)
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
}

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
