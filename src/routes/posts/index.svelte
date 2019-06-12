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
  import Head from '../../components/Head.svelte'
  export let posts
</script>

<style>
  a {
    border: none;
    color: var(--text-color);
    background-image: linear-gradient(
      to right,
      var(--prime-color),
      var(--prime-color) 50%,
      transparent 50%,
      transparent
    );
    background-position: 100% 0;
    background-size: 201% 100%;
    transition: all var(--transition-duration) ease-in-out;
  }

  a:hover {
    color: var(--prime-color-text);
    background-position: 0 0;
  }

  li {
    transition: all 447ms ease-in;
  }

  li:nth-child(even):hover {
    transform: scale(1.1) rotate(1deg);
  }

  li:nth-child(odd):hover {
    transform: scale(1.1) rotate(-1deg);
  }

  [data-publisher='Angular In Depth'] {
    background-image: linear-gradient(
      to right,
      var(--aid-color),
      var(--aid-color) 50%,
      transparent 50%,
      transparent
    );
  }

  [data-publisher='Angular In Depth']:hover {
    color: var(--aid-color-text);
  }

  [data-publisher='ITNEXT'] {
    background-image: linear-gradient(
      to right,
      var(--itnext-color),
      var(--itnext-color) 50%,
      transparent 50%,
      transparent
    );
  }

  [data-publisher='ITNEXT']:hover {
    color: var(--itnext-color-text);
  }

  li:not(:first-child) {
    margin-top: 3em;
  }

  p {
    margin-top: calc(var(--spacing) / 3);
    color: var(--text-color-50);
    transition: color var(--transition-duration) ease-in-out;
  }

  small {
    color: var(--text-color-70);
    transition: color var(--transition-duration) ease-in-out;
  }

  h2 {
    font-weight: normal;
  }
</style>

<Head title="Posts" />

<ul>
  {#each posts as post}
    <li>
      <h2>
        {#if post.metadata.publisher}
          <a
            href={post.metadata.canonical_url}
            data-publisher={post.metadata.publisher}>
             {post.metadata.title} - {post.metadata.publisher}
          </a>
          <a
            href="/posts/{post.metadata.slug}"
            style="display:none;visibility:hidden">
            keep
          </a>
        {:else}
          <a rel="prefetch" href="/posts/{post.metadata.slug}">
             {post.metadata.title}
          </a>
        {/if}
      </h2>
      <small>{post.metadata.date}</small>
      <p>{post.metadata.description}</p>
    </li>
  {/each}
</ul>
