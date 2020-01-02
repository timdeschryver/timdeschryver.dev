import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { posts, snippets } from './models'

export const apolloServerConfig = {
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
}
