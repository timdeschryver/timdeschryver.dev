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
  import Banner from '../../components/Banner.svelte'
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
  hgroup time {
    margin-top: 0;
    font-size: 0.83em;
  }

  :global(article li) {
    list-style-type: initial;
  }

  :global(article iframe) {
    width: 120%;
    height: 600px;
    margin-left: -10%;
  }

  :global(article p, article ul) {
    font-weight: var(--font-weight);
    transition-property: font-weight;
    transition-delay: var(--transition-duration);
  }

  :global(article code) {
    transition: all var(--transition-duration) ease-in-out;
  }

  :global(article table) {
    width: 100%;
  }

  :global(article th, article td) {
    text-align: left;
  }

  :global(article a) {
    color: inherit;
    border-bottom-color: var(--prime-color);
  }

  :global(article h3 + p, article h4 + p, article h5 + p) {
    margin-top: calc(var(--spacing) / 2);
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    font-size: 1.1em;
  }

  .article-action {
    background: none;
    border: none;
    margin: 0;
    padding: 0;
    color: inherit;
    cursor: pointer;
    text-transform: initial;
  }

  footer > * {
    margin-top: 0;
  }

  .line {
    flex-grow: 1;
    border-top: 1px dotted var(--text-color-70);
  }

  .line:first-child {
    margin-right: 17px;
  }

  .line:last-child {
    margin-left: 17px;
  }

  .selection-actions {
    margin-top: 0;
    position: absolute;
    transform: translate(-78px, 10px);
  }

  .selection-actions button {
    color: var(--background-color);
    background: var(--text-color);
    font-weight: bold;
  }

  .message {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: 0px;
    padding: 80px;
    background: var(--backdrop-color);
  }

  .newsletter {
    background: var(--prime-color-bg);
    padding: 1em;
    border-radius: 30px;
    box-shadow: 0px 0px 15px var(--prime-color);
  }

  .newsletter form {
    display: grid;
    grid-template-columns: minmax(250px, 1fr) minmax(min-content, 125px);
    column-gap: 1rem;
  }

  .newsletter h3,
  .newsletter label,
  .newsletter a {
    grid-column: 1 / 3;
  }

  .newsletter a {
    border-bottom: none;
    text-decoration: underline;
    text-align: center;
  }

  .newsletter input[type='text'] {
    grid-column: 1;
    font-size: 1.5em;
  }

  .newsletter button[type='submit'] {
    grid-column: 2;
    background: var(--prime-color);
    color: var(--background-color);
    cursor: pointer;
    font-size: 1.5em;
    border: 1px solid var(--prime-color);
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

<article data-state={$state.toStrings()}>
  <Banner publisher={post.metadata.publisher} />
  <hgroup>
    <h2>{post.metadata.title}</h2>
    <time datetime={post.metadata.date}>{post.metadata.date}</time>
  </hgroup>

  <section class="article-content">
    {@html post.html}
  </section>

  <footer>
    <div class="line" />
    <div class="article-actions">
      <a
        class="article-action"
        target="_blank"
        rel="noopener noreferrer"
        href="https://twitter.com/intent/tweet?text={post.metadata.title}&via=tim_deschryver&url={post.metadata.canonical_url}">
        Share on Twitter
      </a>
      •
      <a
        class="article-action"
        href="https://twitter.com/search?q={post.metadata.canonical_url}"
        target="_blank"
        rel="noopener noreferrer">
        Discuss on Twitter
      </a>
      •
      <button
        class="article-action"
        on:mousedown|stopPropagation={() => state.send({
            type: 'send_message',
          })}>
        Send Tim a message
      </button>
      •
      <a
        class="article-action"
        target="_blank"
        rel="noopener noreferrer"
        href="https://github.com/timdeschryver/timdeschryver.dev/tree/master/content/blog/{post.metadata.folder}/index.md">
        Edit on GitHub
      </a>
    </div>
    <div class="line" />
  </footer>

  <section class="newsletter">
    <form
      action="https://tinyletter.com/timdeschryver"
      method="post"
      target="popupwindow"
      onsubmit="window.open('https://tinyletter.com/timdeschryver',
      'popupwindow', 'scrollbars=yes,width=800,height=600');return true">
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
    <div class="message">
      <Message
        on:submit={submitMessage}
        on:click={() => state.send({ type: 'cancel' })} />
    </div>
  {/if}

</article>
