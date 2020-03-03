<script>
  import Head from '../../components/Head.svelte'

  let resources = [
    {
      title: 'Redux',
      links: [
        {
          link: 'https://redux.js.org/',
          text: 'Redux docs',
          category: '📖',
        },
        {
          link: 'https://redux.js.org/style-guide/style-guide',
          text: 'Redux styleguide',
          category: '📖',
        },
        {
          link: 'https://egghead.io/courses/getting-started-with-redux',
          text: 'Getting Started with Redux - Dan Abramov',
          category: '📺',
        },
        {
          link:
            'https://blog.isquaredsoftware.com/2017/05/idiomatic-redux-tao-of-redux-part-1',
          text: 'Idiomatic Redux: The Tao of Redux - Mark Erikson',
          category: '✍',
        },
        {
          link: 'https://www.youtube.com/watch?v=ewelU8WHXQ4',
          text: 'The Fundamentals of Redux - Mark Erikson',
          category: '🎤',
        },
        {
          link: 'https://ultimatecourses.com/blog/redux-typescript-store',
          text:
            'Finally understand Redux by building your own Store - Todd Motto',
          category: '✍',
        },
        {
          link: 'https://www.smashingmagazine.com/2018/07/redux-designers-guide/',
          text: 'What Is Redux: A Designer’s Guide',
          category: '✍',
        },
        {
          link: 'https://www.youtube.com/watch?v=nYkdrAPrdcw/',
          text: 'Hacker Way: Rethinking Web App Development at Facebook (Flux)',
          category: '🎤',
        },
      ],
    },
    {
      title: 'NgRx',
      links: [
        {
          link: 'https://ngrx.io',
          text: 'NgRx docs',
          category: '📖',
        },
        {
          link: 'https://www.youtube.com/watch?v=mhA7zZ23Odw',
          text: 'Reactive Angular with NgRx - Rob Wormald',
          category: '🎤',
        },
        {
          link: 'https://www.youtube.com/watch?v=RXuSDiLmcN0',
          text: 'Building Sub States w/ NgRx Selectors - Brandon Roberts',
          category: '🎤',
        },
        {
          link:
            'https://www.youtube.com/watch?v=JmnsEvoy-gY&list=PL8OUS498tQP3FFsZzULTGnbyIcILFjHd3&index=3',
          text: 'Good Action Hygiene - Mike Ryan',
          category: '🎤',
        },
        {
          link: 'https://www.youtube.com/watch?v=E7GKnjGCXzU',
          text: 'Selectors are more powerful than you think - Alex Okrushko',
          category: '🎤',
        },
        {
          link: 'https://www.youtube.com/watch?v=omnwu_etHTY',
          text: 'You might not need NgRx - Mike Ryan',
          category: '🎤',
        },
        {
          link: 'https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5',
          text: 'Patterns and Techniques - Victor Savkin',
          category: '✍',
        },
        {
          link: 'https://gist.github.com/btroncone/a6e4347326749f938510',
          text: 'Comprehensive Introduction to @ngrx/store - Brian Troncone',
          category: '✍',
        },
        {
          link: 'https://medium.com/angular-in-depth/tagged/ngrx',
          text: 'Articles tagged with NgRx from AngularInDepth',
          category: '✍',
        },
        {
          link:
            'https://blog.oasisdigital.com/2020/ngrx-is-40x-faster-than-your-code-find-out-why/',
          text: 'NgRx is 40x faster than your code, find out why - Lance Finney',
          category: '✍',
        },
      ],
    },
    {
      title: 'Example Apps',
      links: [
        {
          link:
            'https://github.com/ngrx/platform/tree/master/projects/example-app',
          text: 'ngrx/example-app',
        },
        {
          link: 'https://github.com/alex-okrushko/ngrx-nx-workshop',
          text: 'alex-okrushko/ngrx-nx-workshop',
        },
        {
          link: 'https://github.com/nrwl/ngrx-workshop-app',
          text: 'nrwl/ngrx-workshop-app',
        },
        {
          link: 'https://github.com/tomastrajan/angular-ngrx-material-starter',
          text: 'tomastrajan/angular-ngrx-material-starter',
        },
      ],
    },
  ]
</script>

<style>
  li {
    margin-top: 0;
  }
</style>

<svelte:head>
  <title>Resouces: NgRx - Tim Deschryver</title>

  <meta name="title" content="Resouces: NgRx" />
  <meta name="description" content="NgRx Resources I share a lot" />
  <meta name="keywords" content="NgRx, Resources" />
  <meta name="image" content="https://timdeschryver.dev/images/ngrx.png" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta
    name="twitter:image"
    content="https://timdeschryver.dev/images/ngrx.png" />
  <meta name="twitter:title" content="NgRx Resources" />
  <meta name="twitter:description" content="NgRx Resources I share a lot" />
  <meta name="og:url" content="https://timdeschryver.dev/resources/ngrx" />
  <meta name="og:title" content="Resouces: NgRx" />
  <meta name="og:description" content="NgRx Resources I share a lot" />
  <meta name="og:type" content="article" />
  <meta name="og:image" content="https://timdeschryver.dev/images/ngrx.png" />
</svelte:head>

<h1>NgRx Resources</h1>

{#each resources as resource}
  <h2>{resource.title}</h2>

  <ul>
    {#each resource.links as link}
      <li>
        <a href={link.link}>{link.category || ''} {link.text}</a>
      </li>
    {/each}
  </ul>
{/each}
