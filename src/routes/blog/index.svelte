<script context="module" lang="ts">
  export async function preload() {
    const result = await this.fetch(`/blog.json`);
    const posts = await result.json();
    return { posts };
  }
</script>

<script lang="ts">
  import Head from "../../components/Head.svelte";
  import { page } from "@sveltejs/kit/assets/runtime/stores";

  export let posts;

  let tags = Object.entries(
    posts
      .map((p) => p.metadata.tags)
      .flat()
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {})
  )
    .sort(([v1, c1], [v2, c2]) => c2 - c1 || v2 - v1)
    .slice(0, 15)
    .map(([v]) => v);
  let filteredPosts = posts;
  let query = $page.query["q"] || "";
  $: queryParts = query.split(" ");
  $: if (typeof window !== "undefined") {
    let params = new URLSearchParams(window.location.search);
    if (query) {
      params.set("q", query);
      window.history.replaceState(
        window.history.state,
        "",
        `${location.pathname}?${params}`
      );
    } else {
      params.delete("q");
      window.history.replaceState(window.history.state, "", location.pathname);
    }
  }
  $: if (query) {
    filteredPosts = posts.filter((p) => {
      return queryParts.every(
        (q) =>
          p.metadata.tags.some((t) => match(t, q)) ||
          like(p.metadata.title, q) ||
          like(p.metadata.description, q)
      );
    });
  } else {
    filteredPosts = posts;
  }
  function tagClicked(tag) {
    if (queryParts.includes(tag)) {
      query = queryParts.filter((q) => q !== tag).join(" ");
    } else {
      query = query ? `${query.trim()} ${tag}` : tag;
    }
  }
  function like(text, value) {
    return text.match(new RegExp(value, "i"));
  }
  function match(text, value) {
    return text.match(new RegExp(`^${value}$`, "i"));
  }
</script>

<style>
  time {
    position: absolute;
    left: -15em;
    top: 0;
  }
  @media (max-width: 1150px) {
    time {
      display: none;
    }
  }
  h2 {
    margin-top: 0;
    font-size: 0.9em;
  }
  li {
    padding: 0.5em 0;
    border-bottom: 2px solid transparent;
    border-right: 3px solid transparent;
    animation: slide-top 0.3s both;
    animation-delay: calc(var(--i) * 0.05s);
  }
  @keyframes slide-top {
    from {
      transform: translateY(-50%);
      opacity: 0;
    }
  }
  li:first-child {
    margin-top: 0;
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

  button.active {
    filter: brightness(120%) saturate(120%) !important;
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
      class:active={queryParts.some((q) => match(q, tag))}
      on:click={() => tagClicked(tag)}>
      {tag}
    </button>
  {/each}
</div>

<ul>
  {#each filteredPosts as post, i}
    <li style="--i: {i}">
      <a rel="prefetch" href={`/blog/${post.metadata.slug}`}>
        <h2>{post.metadata.title}</h2>
        <time
          datetime={post.metadata.humanDate}>{post.metadata.humanDate}</time>
      </a>
    </li>
  {:else}Sorry, no posts matched your criteria...{/each}
</ul>
