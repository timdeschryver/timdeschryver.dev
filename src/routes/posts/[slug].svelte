<script context="module">
  import gql from 'graphql-tag'
  import ApolloClient from 'apollo-boost'

  export async function preload({ params }) {
    const client = new ApolloClient({
      fetch: this.fetch,
    })

    const response = await client.query({
      query: gql`
        query($slug: String!) {
          post(slug: $slug) {
            html
            metadata {
              author
              publisher
              publish_url
              title
              description
              banner
              tags
            }
          }
        }
      `,
      variables: {
        slug: params.slug,
      },
    })

    return response.data || this.error(404)
  }
</script>

<script>
  import Banner from '../../components/Banner.svelte'
  export let post
</script>

<svelte:head>
  <title>{post.metadata.title}</title>

  <meta name="author" content={post.metadata.author} />
  <meta name="copyright" content={post.metadata.author} />
  <meta name="description" content={post.metadata.description} />
  <meta name="keywords" content={post.metadata.tags.join(',')} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={post.metadata.banner} />
  <meta name="twitter:title" content={post.metadata.title} />
  <meta name="twitter:description" content={post.metadata.description} />

  <meta name="og:title" content={post.metadata.title} />
  <meta name="og:description" content={post.metadata.description} />
  <meta name="og:type" content="article" />
  <meta name="og:image" content={post.metadata.banner} />
</svelte:head>

<article class="post">
  <Banner publisher={post.metadata.publisher} />
  <h2>{post.metadata.title}</h2>
  {@html post.html}
</article>
