import '~/style/index.styl'

import DefaultLayout from '~/layouts/Default.vue'

// The Client API can be used here. Learn more: gridsome.org/docs/client-api
export default function(Vue, { router, head }) {
  router.beforeEach((to, _from, next) => {
    head.meta.push({
      key: 'og:url',
      name: 'og:url',
      content: process.env.GRIDSOME_BASE_PATH + to.path,
    })
    next()
  })

  head.link.push({
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css?family=Comfortaa|Poiret One|Gugi',
  })

  head.meta.push({
    key: 'keywords',
    name: 'keywords',
    content: 'Angular, NgRx, TypeScript, Blogger, Tim, Deschryver, Belgium',
  })

  head.meta.push({
    key: 'og:title',
    name: 'og:title',
    content: 'Tim Deschryver',
  })
  head.meta.push({
    key: 'og:description',
    name: 'og:description',
    content: `Tim Deschryver's experiences and thoughts on programming`,
  })

  head.meta.push({
    key: 'twitter:title',
    name: 'twitter:title',
    content: 'Tim Deschryver',
  })
  head.meta.push({
    key: 'twitter:description',
    name: 'twitter:description',
    content: `Tim Deschryver's experiences and thoughts on programming`,
  })
  head.meta.push({
    key: 'twitter:card',
    name: 'twitter:card',
    content: 'summary',
  })
  head.meta.push({
    key: 'twitter:creator',
    name: 'twitter:creator',
    content: '@tim_deschryver',
  })

  Vue.component('Layout', DefaultLayout)
}
