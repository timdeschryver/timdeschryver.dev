import { format, differenceInDays, distanceInWordsToNow } from 'date-fns'

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
      if (displayAs === 'human') {
        const diff = differenceInDays(new Date(), metadata.date)
        const dateFormatted =
          diff <= 7
            ? distanceInWordsToNow(metadata.date, new Date()) + ' ago'
            : format(metadata.date, 'MMMM Do YYYY')
        return dateFormatted
      }
      return metadata.date.toString()
    },
    canonical_url(metadata) {
      return (
        metadata.canonical_url ||
        `https://timdeschryver.dev/posts/${metadata.slug}`
      )
    },
  },
}
