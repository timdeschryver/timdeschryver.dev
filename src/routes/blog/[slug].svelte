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

  function submitMessage(evt) {
    state.send({
      type: 'submit',
      username: evt.target.elements['name'].value,
      message: evt.target.elements['message'].value,
    })
  }
</script>

<style>
  .article-actions {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
  }

  .article-action {
    background: var(--background-color);
    margin: 0;
    cursor: pointer;
    text-decoration: none;
    text-transform: uppercase;
    color: var(--prime-color);
    border: 1px solid var(--prime-color);
    border-radius: 2px;
    padding: 0.25rem 1rem;
    font-size: 0.75rem;
    line-height: 2.5;
    font-weight: 900;
  }

  .article-action:hover {
    transition: background 300ms;
    background: var(--prime-color-shadow);
  }

  .selection-actions {
    margin-top: 0;
    position: absolute;
    transform: translate(-78px, 10px);
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
</style>

<svelte:head>
  <title>{post.metadata.title} - Tim Deschryver</title>

  <meta name="author" content={post.metadata.author} />
  <meta name="copyright" content={post.metadata.author} />
  <meta name="title" content={post.metadata.title} />
  <meta name="description" content={post.metadata.description} />
  <meta name="keywords" content={post.metadata.tags.join(',')} />
  <meta name="image" content={post.metadata.banner} />
  <meta name="canonical" content={post.metadata.canonical_url} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={post.metadata.banner} />
  <meta name="twitter:title" content={post.metadata.title} />
  <meta name="twitter:description" content={post.metadata.description} />
  <meta name="twitter:label1" content="Written by" />
  <meta name="twitter:data1" content={post.metadata.author} />

  <meta
    name="og:url"
    content={'https://timdeschryver.dev/blog/' + post.metadata.slug} />
  <meta name="og:title" content={post.metadata.title} />
  <meta name="og:description" content={post.metadata.description} />
  <meta name="og:type" content="article" />
  <meta name="og:image" content={post.metadata.banner} />
</svelte:head>

<h1>{post.metadata.title}</h1>
<time datetime={post.metadata.date}>{post.metadata.date}</time>

{@html post.html}

<div class="article-actions">
  <a
    class="article-action"
    target="_blank"
    rel="noopener noreferrer"
    href="https://twitter.com/intent/tweet?text={post.metadata.title}&via=tim_deschryver&url={post.metadata.canonical_url}">
    Share on Twitter
  </a>
  <a
    class="article-action"
    href="https://twitter.com/search?q={post.metadata.canonical_url}"
    target="_blank"
    rel="noopener noreferrer">
    Discuss on Twitter
  </a>
  <button
    class="article-action"
    on:mousedown|stopPropagation={() => state.send({ type: 'send_message' })}>
    Send Tim a message
  </button>
  <a
    class="article-action"
    target="_blank"
    rel="noopener noreferrer"
    href="https://github.com/timdeschryver/timdeschryver.dev/tree/master/content/blog/{post.metadata.folder}/index.md">
    Edit on GitHub
  </a>
</div>

<section class="newsletter">
  <form
    action="https://tinyletter.com/timdeschryver"
    method="post"
    target="popupwindow"
    onsubmit="window.open('https://tinyletter.com/timdeschryver', 'popupwindow',
    'scrollbars=yes,width=800,height=600');return true">
    <h3>Join the newsletter to receive new content by email</h3>
    <label for="tlemail">Enter your email address</label>
    <input type="text" name="email" id="tlemail" />
    <button type="submit">Join</button>
    <input type="hidden" value="1" name="embed" />
    <a href="https://tinyletter.com" target="_blank">powered by TinyLetter</a>
  </form>
</section>

<div
  class="selection-actions"
  hidden={!$state.matches('selected')}
  style="left:{$state.context.mouseX}px;top:{$state.context.mouseY}px">
  <button
    tabindex="-1"
    on:mousedown|stopPropagation={() => state.send({ type: 'send_message' })}>
    Send a message
  </button>
</div>

{#if $state.matches('message')}
  <Message
    on:submit={submitMessage}
    on:click={() => state.send({ type: 'cancel' })} />
{/if}
