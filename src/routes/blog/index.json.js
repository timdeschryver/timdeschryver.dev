import gql from 'graphql-tag'
import { client } from '../../apollo-client'

export async function get(req, res) {
  const response = await client(req).query({
    query: gql`
      query {
        posts(published: true) {
          metadata {
            publish_url
            slug
            title
            description
            date(displayAs: "human")
          }
        }
      }
    `,
  })

  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(response.data))
}
