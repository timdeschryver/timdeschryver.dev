import sirv from 'sirv'
import polka from 'polka'
import compression from 'compression'
import * as sapper from '@sapper/server'
import { ApolloServer } from 'apollo-server-express'
import { apolloServerConfig } from './api'

const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === 'development'

const app = polka()

const apolloServer = new ApolloServer(apolloServerConfig)
apolloServer.applyMiddleware({ app })

app
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    sirv('content', { dev }),
    sapper.middleware({ ignore: apolloServer.graphqlPath }),
  )
  .listen(PORT, err => {
    if (err) console.log('error', err)
  })
