import gql from 'graphql-tag'
import { client } from '../../apollo-client'

export async function get(req, res) {
  const response = await client(req).query({
    query: gql`
      query($slug: String!) {
        post(slug: $slug) {
          html
          metadata {
            author
            canonical_url
            title
            description
            banner
            tags
            folder
            date(displayAs: "human")
          }
        }
      }
    `,
    variables: {
      slug: req.params.slug,
    },
  })

  if (response.data && response.data.post) {
    res.setHeader('Cache-Control', `max-age=${5 * 60 * 1e3}`) // 5 minutes
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(response.data))
  } else {
    let str = `${req.params.slug} not found.
      Go back to <a href="${process.env.BASE_PATH}">home</a> or browse <a href="${process.env.BASE_PATH}/blog">blog</a>.
    `
    res.writeHead(404, {
      'Content-Type': 'text/html',
      'Content-Length': str.length,
    })

    res.end(str)
  }
}
