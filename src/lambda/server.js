import { ApolloServer } from 'apollo-server-micro'
import { apolloServerConfig } from '../api'

const server = new ApolloServer(apolloServerConfig)

module.exports = server.createHandler()
