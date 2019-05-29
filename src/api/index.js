import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { posts } from './models'

export const apolloServerConfig = {
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
}
