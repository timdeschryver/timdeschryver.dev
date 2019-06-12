import { format, differenceInDays, distanceInWordsToNow } from 'date-fns'

export const resolvers = {
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
        const diff = differenceInDays(new Date(), metadata.date)
        const dateFormatted =
          diff <= 7
            ? distanceInWordsToNow(metadata.date, new Date()) + ' ago'
            : format(metadata.date, 'MMMM Do YYYY')
        return dateFormatted
      }
      return metadata.date.toString()
    },
  },
}
