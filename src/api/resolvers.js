import { format } from 'date-fns'

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
        ? format(metadata.date, 'MMMM Do YYYY')
        : metadata.date.toString()
    },
    canonical_url(metadata) {
      return (
        metadata.canonical_url ||
        `https://timdeschryver.dev/posts/${metadata.slug}`
      )
    },
  },
}
