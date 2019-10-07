<script>
  export let publisher

  const publisherData = {
    ['Angular In Depth']: {
      href: 'https://blog.angularindepth.com/',
      src: 'publishers/aid_banner.png',
    },
    ['ITNEXT']: {
      href: 'https://itnext.io/',
      src: 'publishers/itnext_banner.png',
    },
    ['Newline']: {
      href: 'https://www.newline.co/',
      src: 'publishers/newline_banner.png',
    },
  }

  const details = publisherData[publisher]
</script>

<style>
  div {
    text-align: center;
  }

  a {
    border: none;
  }

  [data-publisher='Angular In Depth'] {
    background: var(--aid-color);
  }

  [data-publisher='ITNEXT'] {
    background: var(--itnext-color);
  }

  [data-publisher='Newline'] {
    background: var(--newline-color);
  }
</style>

{#if publisher}
<div data-publisher="{publisher}">
  <a href="{details.href}">
    <img src="{details.src}" alt="{publisher}" />
  </a>
</div>
{/if}
