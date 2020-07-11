import gql from 'graphql-tag'
import { client } from '../../apollo-client'

export async function get(req, res) {
  const response = await client(req).query({
    query: gql`
      query {
        posts(published: true, first: 1) {
          metadata {
            title
            description
            canonical_url
            banner
          }
        }
      }
    `,
  })

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(response.data.posts[0].metadata, null, 2))
}
