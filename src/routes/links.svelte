<script context="module">  import gql from 'graphql-tag'
  import ApolloClient from 'apollo-boost'

  export async function preload() {
    const client = new ApolloClient({
      fetch: this.fetch,
    })

    const response = await client.query({
      query: gql`
        query {
          posts(published: true) {
            metadata {
              publisher
              canonical_url
              slug
              title
              description
              date(displayAs: "human")
            }
          }
        }
      `,
    })
    return response.data
  }
</script>

<script>
  export let posts
</script>

<a href="/posts/rss.xml">RSS Feed</a>
<a href="/sitemap.xml">Sitemap</a>
{#each posts as post}
  <a href="/posts/{post.metadata.slug}"> {post.metadata.title} </a>
{/each}
