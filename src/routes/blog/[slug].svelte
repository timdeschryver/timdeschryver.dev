<script context="module">
  export async function preload({ params }) {
    const res = await this.fetch(`blog/${params.slug}.json`)

    if (res.ok) {
      const { post } = await res.json()
      return { post }
    }
    this.redirect(302, `${process.env.BASE_PATH}/blog`)
  }
</script>

<script>
  import { fromEvent, merge, animationFrameScheduler } from 'rxjs'
  import { concatMap, takeUntil, auditTime } from 'rxjs/operators'
  import { machine } from 'svelte-xstate-stores'
  import { onMount$, onDestroy$ } from 'svelte-rx'
  import Message from '../../components/Message.svelte'
  import { postMachine } from './post.machine'

  export let post
  let state = machine(postMachine, {
    context: {
      url: post.metadata.canonical_url,
    },
  })

  onMount$
    .pipe(
      concatMap(() =>
        merge(
          fromEvent(document, 'mouseup'),
          fromEvent(document, 'mousedown'),
          fromEvent(document, 'keydown'),
        ),
      ),
      auditTime(0, animationFrameScheduler),
      takeUntil(onDestroy$),
    )
    .subscribe(state.send)
</script>

<style>
  h1 {
    word-break: break-word;
  }

  .article-action {
    background: none;
    margin: 0;
    cursor: pointer;
    text-decoration: none;
    text-transform: uppercase;
    color: var(--prime-color);
    font-size: 0.75rem;
    line-height: 2.5;
    border: none;
    font-weight: 900;
    white-space: nowrap;
  }

  .article-action:not(:last-child) {
    margin-right: 17px;
  }

  .selection-actions {
    margin-top: 0;
    position: absolute;
    transform: translate(-78px, 10px);
    mix-blend-mode: normal !important;
  }

  .selection-actions button {
    margin: 0;
    margin-left: 5px;
    cursor: pointer;
    text-decoration: none;
    text-transform: uppercase;
    border: none;
    padding: 0.25rem 1rem;
    font-size: 0.75rem;
    line-height: 2.5;
    font-weight: 900;
    background: var(--prime-color);
  }

  .article-actions {
    text-align: center;
  }

  dialog {
    display: none;
  }

  dialog[open] {
    display: block;
    mix-blend-mode: unset;
  }

  img.support {
    height: 55px;
  }
  div.support {
    margin-top: 0;
  }
  a.support {
    display: inline-block;
    vertical-align: middle;
    margin-right: 1em;
  }
</style>

<svelte:head>
  <title>{post.metadata.title} - Tim Deschryver</title>

  <link rel="canonical" href="{post.metadata.canonical_url}" />

  <meta name="author" content="{post.metadata.author}" />
  <meta name="copyright" content="{post.metadata.author}" />
  <meta name="title" content="{post.metadata.title}" />
  <meta name="description" content="{post.metadata.description}" />
  <meta name="keywords" content="{post.metadata.tags.join(',')}" />
  <meta name="image" content="{post.metadata.banner}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="{post.metadata.banner}" />
  <meta name="twitter:title" content="{post.metadata.title}" />
  <meta name="twitter:description" content="{post.metadata.description}" />
  <meta name="twitter:label1" content="Written by" />
  <meta name="twitter:data1" content="{post.metadata.author}" />
  <meta name="twitter:label2" content="Published on" />
  <meta name="twitter:data2" content="{post.metadata.date}" />

  <meta name="og:url" content="{post.metadata.canonical_url}" />
  <meta name="og:title" content="{post.metadata.title}" />
  <meta name="og:description" content="{post.metadata.description}" />
  <meta name="og:type" content="article" />
  <meta name="og:image" content="{post.metadata.banner}" />
</svelte:head>

<h1>{post.metadata.title}</h1>
<time datetime="{post.metadata.date}">{post.metadata.date}</time>

{@html post.html}

<p>
  Please consider supporting me if have you enjoyed this post and found it
  useful:
</p>
<div class="support">
  <a
    class="support"
    href="https://www.buymeacoffee.com/timdeschryver"
    target="_blank"
    rel="nofollow noreferrer">
    <img
      class="support"
      src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
      alt="Buy Me A Coffee"
      style="width: 217px !important;" />
  </a>
  <a
    class="support"
    target="_blank"
    rel="nofollow noreferrer"
    href="https://www.paypal.com/donate?hosted_button_id=59M5TFPQJS8SQ">
    <img
      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAxcHgiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAxMDEgMzIiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHhtbG5zPSJodHRwOiYjeDJGOyYjeDJGO3d3dy53My5vcmcmI3gyRjsyMDAwJiN4MkY7c3ZnIj48cGF0aCBmaWxsPSIjMDAzMDg3IiBkPSJNIDEyLjIzNyAyLjggTCA0LjQzNyAyLjggQyAzLjkzNyAyLjggMy40MzcgMy4yIDMuMzM3IDMuNyBMIDAuMjM3IDIzLjcgQyAwLjEzNyAyNC4xIDAuNDM3IDI0LjQgMC44MzcgMjQuNCBMIDQuNTM3IDI0LjQgQyA1LjAzNyAyNC40IDUuNTM3IDI0IDUuNjM3IDIzLjUgTCA2LjQzNyAxOC4xIEMgNi41MzcgMTcuNiA2LjkzNyAxNy4yIDcuNTM3IDE3LjIgTCAxMC4wMzcgMTcuMiBDIDE1LjEzNyAxNy4yIDE4LjEzNyAxNC43IDE4LjkzNyA5LjggQyAxOS4yMzcgNy43IDE4LjkzNyA2IDE3LjkzNyA0LjggQyAxNi44MzcgMy41IDE0LjgzNyAyLjggMTIuMjM3IDIuOCBaIE0gMTMuMTM3IDEwLjEgQyAxMi43MzcgMTIuOSAxMC41MzcgMTIuOSA4LjUzNyAxMi45IEwgNy4zMzcgMTIuOSBMIDguMTM3IDcuNyBDIDguMTM3IDcuNCA4LjQzNyA3LjIgOC43MzcgNy4yIEwgOS4yMzcgNy4yIEMgMTAuNjM3IDcuMiAxMS45MzcgNy4yIDEyLjYzNyA4IEMgMTMuMTM3IDguNCAxMy4zMzcgOS4xIDEzLjEzNyAxMC4xIFoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMDAzMDg3IiBkPSJNIDM1LjQzNyAxMCBMIDMxLjczNyAxMCBDIDMxLjQzNyAxMCAzMS4xMzcgMTAuMiAzMS4xMzcgMTAuNSBMIDMwLjkzNyAxMS41IEwgMzAuNjM3IDExLjEgQyAyOS44MzcgOS45IDI4LjAzNyA5LjUgMjYuMjM3IDkuNSBDIDIyLjEzNyA5LjUgMTguNjM3IDEyLjYgMTcuOTM3IDE3IEMgMTcuNTM3IDE5LjIgMTguMDM3IDIxLjMgMTkuMzM3IDIyLjcgQyAyMC40MzcgMjQgMjIuMTM3IDI0LjYgMjQuMDM3IDI0LjYgQyAyNy4zMzcgMjQuNiAyOS4yMzcgMjIuNSAyOS4yMzcgMjIuNSBMIDI5LjAzNyAyMy41IEMgMjguOTM3IDIzLjkgMjkuMjM3IDI0LjMgMjkuNjM3IDI0LjMgTCAzMy4wMzcgMjQuMyBDIDMzLjUzNyAyNC4zIDM0LjAzNyAyMy45IDM0LjEzNyAyMy40IEwgMzYuMTM3IDEwLjYgQyAzNi4yMzcgMTAuNCAzNS44MzcgMTAgMzUuNDM3IDEwIFogTSAzMC4zMzcgMTcuMiBDIDI5LjkzNyAxOS4zIDI4LjMzNyAyMC44IDI2LjEzNyAyMC44IEMgMjUuMDM3IDIwLjggMjQuMjM3IDIwLjUgMjMuNjM3IDE5LjggQyAyMy4wMzcgMTkuMSAyMi44MzcgMTguMiAyMy4wMzcgMTcuMiBDIDIzLjMzNyAxNS4xIDI1LjEzNyAxMy42IDI3LjIzNyAxMy42IEMgMjguMzM3IDEzLjYgMjkuMTM3IDE0IDI5LjczNyAxNC42IEMgMzAuMjM3IDE1LjMgMzAuNDM3IDE2LjIgMzAuMzM3IDE3LjIgWiI+PC9wYXRoPjxwYXRoIGZpbGw9IiMwMDMwODciIGQ9Ik0gNTUuMzM3IDEwIEwgNTEuNjM3IDEwIEMgNTEuMjM3IDEwIDUwLjkzNyAxMC4yIDUwLjczNyAxMC41IEwgNDUuNTM3IDE4LjEgTCA0My4zMzcgMTAuOCBDIDQzLjIzNyAxMC4zIDQyLjczNyAxMCA0Mi4zMzcgMTAgTCAzOC42MzcgMTAgQyAzOC4yMzcgMTAgMzcuODM3IDEwLjQgMzguMDM3IDEwLjkgTCA0Mi4xMzcgMjMgTCAzOC4yMzcgMjguNCBDIDM3LjkzNyAyOC44IDM4LjIzNyAyOS40IDM4LjczNyAyOS40IEwgNDIuNDM3IDI5LjQgQyA0Mi44MzcgMjkuNCA0My4xMzcgMjkuMiA0My4zMzcgMjguOSBMIDU1LjgzNyAxMC45IEMgNTYuMTM3IDEwLjYgNTUuODM3IDEwIDU1LjMzNyAxMCBaIj48L3BhdGg+PHBhdGggZmlsbD0iIzAwOWNkZSIgZD0iTSA2Ny43MzcgMi44IEwgNTkuOTM3IDIuOCBDIDU5LjQzNyAyLjggNTguOTM3IDMuMiA1OC44MzcgMy43IEwgNTUuNzM3IDIzLjYgQyA1NS42MzcgMjQgNTUuOTM3IDI0LjMgNTYuMzM3IDI0LjMgTCA2MC4zMzcgMjQuMyBDIDYwLjczNyAyNC4zIDYxLjAzNyAyNCA2MS4wMzcgMjMuNyBMIDYxLjkzNyAxOCBDIDYyLjAzNyAxNy41IDYyLjQzNyAxNy4xIDYzLjAzNyAxNy4xIEwgNjUuNTM3IDE3LjEgQyA3MC42MzcgMTcuMSA3My42MzcgMTQuNiA3NC40MzcgOS43IEMgNzQuNzM3IDcuNiA3NC40MzcgNS45IDczLjQzNyA0LjcgQyA3Mi4yMzcgMy41IDcwLjMzNyAyLjggNjcuNzM3IDIuOCBaIE0gNjguNjM3IDEwLjEgQyA2OC4yMzcgMTIuOSA2Ni4wMzcgMTIuOSA2NC4wMzcgMTIuOSBMIDYyLjgzNyAxMi45IEwgNjMuNjM3IDcuNyBDIDYzLjYzNyA3LjQgNjMuOTM3IDcuMiA2NC4yMzcgNy4yIEwgNjQuNzM3IDcuMiBDIDY2LjEzNyA3LjIgNjcuNDM3IDcuMiA2OC4xMzcgOCBDIDY4LjYzNyA4LjQgNjguNzM3IDkuMSA2OC42MzcgMTAuMSBaIj48L3BhdGg+PHBhdGggZmlsbD0iIzAwOWNkZSIgZD0iTSA5MC45MzcgMTAgTCA4Ny4yMzcgMTAgQyA4Ni45MzcgMTAgODYuNjM3IDEwLjIgODYuNjM3IDEwLjUgTCA4Ni40MzcgMTEuNSBMIDg2LjEzNyAxMS4xIEMgODUuMzM3IDkuOSA4My41MzcgOS41IDgxLjczNyA5LjUgQyA3Ny42MzcgOS41IDc0LjEzNyAxMi42IDczLjQzNyAxNyBDIDczLjAzNyAxOS4yIDczLjUzNyAyMS4zIDc0LjgzNyAyMi43IEMgNzUuOTM3IDI0IDc3LjYzNyAyNC42IDc5LjUzNyAyNC42IEMgODIuODM3IDI0LjYgODQuNzM3IDIyLjUgODQuNzM3IDIyLjUgTCA4NC41MzcgMjMuNSBDIDg0LjQzNyAyMy45IDg0LjczNyAyNC4zIDg1LjEzNyAyNC4zIEwgODguNTM3IDI0LjMgQyA4OS4wMzcgMjQuMyA4OS41MzcgMjMuOSA4OS42MzcgMjMuNCBMIDkxLjYzNyAxMC42IEMgOTEuNjM3IDEwLjQgOTEuMzM3IDEwIDkwLjkzNyAxMCBaIE0gODUuNzM3IDE3LjIgQyA4NS4zMzcgMTkuMyA4My43MzcgMjAuOCA4MS41MzcgMjAuOCBDIDgwLjQzNyAyMC44IDc5LjYzNyAyMC41IDc5LjAzNyAxOS44IEMgNzguNDM3IDE5LjEgNzguMjM3IDE4LjIgNzguNDM3IDE3LjIgQyA3OC43MzcgMTUuMSA4MC41MzcgMTMuNiA4Mi42MzcgMTMuNiBDIDgzLjczNyAxMy42IDg0LjUzNyAxNCA4NS4xMzcgMTQuNiBDIDg1LjczNyAxNS4zIDg1LjkzNyAxNi4yIDg1LjczNyAxNy4yIFoiPjwvcGF0aD48cGF0aCBmaWxsPSIjMDA5Y2RlIiBkPSJNIDk1LjMzNyAzLjMgTCA5Mi4xMzcgMjMuNiBDIDkyLjAzNyAyNCA5Mi4zMzcgMjQuMyA5Mi43MzcgMjQuMyBMIDk1LjkzNyAyNC4zIEMgOTYuNDM3IDI0LjMgOTYuOTM3IDIzLjkgOTcuMDM3IDIzLjQgTCAxMDAuMjM3IDMuNSBDIDEwMC4zMzcgMy4xIDEwMC4wMzcgMi44IDk5LjYzNyAyLjggTCA5Ni4wMzcgMi44IEMgOTUuNjM3IDIuOCA5NS40MzcgMyA5NS4zMzcgMy4zIFoiPjwvcGF0aD48L3N2Zz4="
      class="support"
      alt="PayPal logo"
      aria-label="Support the blog"
      width="300" />
  </a>
</div>

<div class="article-actions">
  <a
    class="article-action"
    target="_blank"
    rel="nofollow noreferrer"
    href="https://www.paypal.com/donate?hosted_button_id=59M5TFPQJS8SQ">
    Support the blog
  </a>
  <a
    class="article-action"
    target="_blank"
    rel="nofollow noreferrer"
    href="https://twitter.com/intent/tweet?text={post.metadata.title}&via=tim_deschryver&url={post.metadata.canonical_url}">
    Share on Twitter
  </a>
  <a
    class="article-action"
    href="https://twitter.com/search?q={post.metadata.canonical_url}"
    target="_blank"
    rel="nofollow noreferrer">
    Discuss on Twitter
  </a>
  <button
    class="article-action"
    on:mousedown|stopPropagation="{() => state.send({ type: 'send_message' })}">
    Send Tim a message
  </button>
  <a
    class="article-action"
    target="_blank"
    rel="nofollow noreferrer"
    href="https://github.com/timdeschryver/timdeschryver.dev/tree/master/content/blog/{post.metadata.folder}/index.md">
    Edit on GitHub
  </a>
</div>

<div
  class="selection-actions"
  hidden="{!$state.matches('selected')}"
  style="left:{$state.context.mouseX}px;top:{$state.context.mouseY}px">
  <button
    tabindex="-1"
    on:mousedown|stopPropagation="{() => state.send({ type: 'send_message' })}">
    Send a message
  </button>
</div>

<dialog open="{$state.matches('message')}">
  <Message
    on:submit="{(evt) => state.send({
        type: 'submit',
        username: evt.target.elements['name'].value,
        message: evt.target.elements['message'].value,
      })}"
    on:click="{() => state.send({ type: 'cancel' })}" />
</dialog>
