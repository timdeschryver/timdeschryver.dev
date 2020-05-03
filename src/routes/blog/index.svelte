<script context="module">
  export async function preload() {
    const res = await this.fetch(`blog.json`)
    if (res.ok) {
      const { posts } = await res.json()
      return { posts }
    }
    this.error(500, 'Something went wrong...')
  }
</script>

<script>
  import Head from '../../components/Head.svelte'
  import { stores } from '@sapper/app'
  const { page } = stores()

  export let posts

  let tags = Object.entries(
    posts
      .map(p => p.metadata.tags)
      .flat()
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {}),
  )
    .sort(([v1, c1], [v2, c2]) => c2 - c1 || v2 - v1)
    .slice(0, 15)
    .map(([v]) => v)

  let filteredPosts = posts
  let query = $page.query['q'] || ''
  $: queryParts = query.split(' ')

  $: if (typeof window !== 'undefined') {
    let params = new URLSearchParams(window.location.search)

    if (query) {
      params.set('q', query)
      window.history.replaceState(
        window.history.state,
        '',
        `${location.pathname}?${params}`,
      )
    } else {
      params.delete('q')
      window.history.replaceState(window.history.state, '', location.pathname)
    }
  }

  $: if (query) {
    filteredPosts = posts.filter(p => {
      return queryParts.every(
        q =>
          p.metadata.tags.some(t => match(t, q)) ||
          like(p.metadata.title, q) ||
          like(p.metadata.description, q),
      )
    })
  } else {
    filteredPosts = posts
  }

  function tagClicked(tag) {
    if (queryParts.includes(tag)) {
      query = queryParts.filter(q => q !== tag).join(' ')
    } else {
      query = query ? `${query.trim()} ${tag}` : tag
    }
  }

  function like(text, value) {
    return text.match(new RegExp(value, 'i'))
  }

  function match(text, value) {
    return text.match(new RegExp(`^${value}$`, 'i'))
  }
</script>

<style>
  time {
    position: absolute;
    left: -15em;
  }

  @media (max-width: 1150px) {
    time {
      display: none;
    }
  }

  h2 {
    margin-top: 0;
  }

  p {
    line-height: 1.5rem;
    font-weight: 200;
    margin-bottom: 1em;
  }

  li {
    padding: 0.5em 0;
    border-bottom: 2px solid transparent;
    border-right: 3px solid transparent;
  }

  li:hover {
    transition: box-shadow 300ms;

    box-shadow: var(--prime-color-03) 13px 13px 1px 0px;
    border-bottom: 3px solid var(--prime-color);
    border-right: 3px solid var(--prime-color);
  }

  li::before {
    background: none;
  }
  input {
    border: 1px solid;
  }

  button {
    background: var(--prime-color);
    border: none;
    padding: 0.2em 0.5em;
    margin: 0.3em;
    opacity: 0.7;
    border-radius: 2px;
    transition: opacity 300ms;
    cursor: pointer;
    font-size: 0.65rem;
  }

  button:hover {
    opacity: 0.85;
  }

  button.active {
    opacity: 1;
  }
</style>

<Head title="Blog - Tim Deschryver" />

<div>
  <input
    type="search"
    bind:value={query}
    placeholder="Search"
    autocomplete="off"
    aria-label="Search" />
  {#each tags as tag}
    <button
      class:active={queryParts.some(q => match(q, tag))}
      on:click={() => tagClicked(tag)}>
      {tag}
    </button>
  {/each}
</div>

<ul>
  {#each filteredPosts as post}
    <li>
      <a rel="prefetch" href={`/blog/${post.metadata.slug}`}>
        <time datetime={post.metadata.date}>{post.metadata.date}</time>
        <h2>{post.metadata.title}</h2>
        <p>{post.metadata.description}</p>
      </a>
    </li>
  {:else}Sorry, no posts matched your criteria...{/each}
</ul>
