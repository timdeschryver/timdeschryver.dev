import gql from 'graphql-tag'

export const typeDefs = gql`
  type Query {
    posts(published: Boolean): [Post]
    post(slug: String): Post
    snippets: [Snippet]
  }

  type Post {
    html(htmlEntities: Boolean = false): String
    metadata: PostMetadata
  }

  type PostMetadata {
    title: String
    folder: String
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

  type Snippet {
    html(htmlEntities: Boolean = false): String
    metadata: SnippetMetadata
  }

  type SnippetMetadata {
    title: String
    slug: String
    image: String
    date(displayAs: String): String
    tags: [String]
  }
`
