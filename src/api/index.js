import { typeDefs } from './schema'
import { resolvers } from './resolvers'
import { posts } from './models'

export const apolloServerConfig = {
  typeDefs,
  resolvers,
  context: { posts: posts() },
  introspection: true,
  playground: true,
}
