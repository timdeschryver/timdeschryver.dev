import gql from 'graphql-tag'

export const typeDefs = gql`
  type Query {
    posts(published: Boolean): [Post]
    post(slug: String): Post
  }

  type Post {
    html(htmlEntities: Boolean = false): String
    metadata: PostMetadata
  }

  type PostMetadata {
    title: String
    slug: String
    description: String
    author: String
    date(displayAs: String): String
    tags: [String]
    banner: String
    bannerCredit: String
    published: Boolean
    publisher: String
    publish_url: String
    canonical_url: String
  }
`
