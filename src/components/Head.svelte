<script>
  export let title
  export let social = true
</script>

<svelte:head>
  <title>{title}</title>

  <meta name="title" content={title} />
  <meta
    name="description"
    content="Tim Deschryver's experiences and thoughts on coding" />
  <meta
    name="keywords"
    content="Angular, NgRx, TypeScript, Blog, Blogger, Tim, Deschryver, Tim
    Deschryver, Belgium" />

  {#if social}
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Tim Deschryver" />
    <meta
      name="twitter:description"
      content="Tim Deschryver's experiences and thoughts on coding" />

    <meta name="og:title" content="Tim Deschryver" />
    <meta
      name="og:description"
      content="Tim Deschryver's experiences and thoughts on coding" />
  {/if}
</svelte:head>
