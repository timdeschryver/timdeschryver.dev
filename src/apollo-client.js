import ApolloClient from 'apollo-boost'
import fetch from 'node-fetch'

let _client

export function client(req) {
  if (_client) {
    return _client
  }

  const baseUrl = req ? `http://${req.headers['host']}` : process.env.BASE_PATH

  _client = new ApolloClient({
    fetch,
    uri: `${baseUrl}/graphql/`,
  })

  return _client
}
