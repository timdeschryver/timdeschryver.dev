import gql from 'graphql-tag'
import { client } from '../../apollo-client'

export async function get(req, res) {
  const response = await client(req).query({
    query: gql`
      query($first: Int) {
        posts(published: true, first: $first) {
          metadata {
            slug
            title
            description
            date(displayAs: "human")
            tags
            canonical_url
          }
        }
      }
    `,
    variables: {
      first: +req.query.first,
    },
  })

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(response.data, null, 2))
}
