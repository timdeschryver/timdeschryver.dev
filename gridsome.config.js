// This is where project configuration and plugin options are located.
// Learn more: https://gridsome.org/docs/config

// Changes here requires a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

module.exports = {
  siteName: 'Tim Deschryver',
  titleTemplate: '%s',
  siteUrl: 'https://timdeschryver.dev',
  siteDescription: `Tim Deschryver's experiences and thoughts on programming`,
  plugins: [
    {
      use: '@gridsome/source-filesystem',
      options: {
        typeName: 'Post',
        path: 'content/posts/**/*.md',
        route: '/posts/:slug',
      },
    },
    {
      use: '@gridsome/plugin-google-analytics',
      options: {
        id: 'UA-137353884-1',
        debug: {
          sendHitTask: process.env.NODE_ENV === 'production',
        },
      },
    },
    {
      use: '@gridsome/plugin-sitemap',
      options: {
        cacheTime: 600000,
        config: {
          '/': {
            priority: 1.0,
          },
          '/posts/*': {
            changefreq: 'weekly',
            priority: 0.5,
          },
        },
      },
    },
  ],

  transformers: {
    remark: {
      externalLinksTarget: '_blank',
      externalLinksRel: ['nofollow', 'noopener', 'noreferrer'],
      anchorClassName: 'icon icon-link',
      plugins: ['@gridsome/remark-prismjs'],
    },
  },
}
