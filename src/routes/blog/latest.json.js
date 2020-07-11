import gql from 'graphql-tag'
import { client } from '../../apollo-client'

export async function get(req, res) {
  const response = await client(req).query({
    query: gql`
      query {
        posts(first: 1) {
          metadata {
            canonical_url
            title
            description
            banner
          }
        }
      }
    `,
  })

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(response.data.posts[0].metadata, null, 2))
}
