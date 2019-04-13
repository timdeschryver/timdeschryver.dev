<template>
  <Layout>
    <article>
      <div class="post-title">
        <h1>{{ $page.post.title }}</h1>
        <PostMeta :post="$page.post"/>
      </div>

      <div v-html="$page.post.content"/>
    </article>
  </Layout>
</template>

<script>
import PostMeta from '~/components/PostMeta'

export default {
  components: {
    PostMeta,
  },
  metaInfo() {
    return {
      title: this.$page.post.title,
      meta: [
        {
          name: 'description',
          content: this.$page.post.description,
        },
        {
          name: 'author',
          content: this.$page.post.author,
        },

        { name: 'og:title', content: this.$page.post.title },
        {
          name: 'og:url',
          content: process.env.GRIDSOME_BASE_PATH + this.$page.post.path,
        },
        { name: 'og:description', content: this.$page.post.description },
        { name: 'og:type', content: 'article' },
        {
          name: 'og:image',
          content: process.env.GRIDSOME_BASE_PATH + this.$page.post.banner.src,
        },

        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:creator', content: '@tim_deschryver' },
        { name: 'twitter:title', content: this.$page.post.title },
        { name: 'twitter:description', content: this.$page.post.description },
        {
          name: 'twitter:image',
          content: process.env.GRIDSOME_BASE_PATH + this.$page.post.banner.src,
        },
      ],
    }
  },
}
</script>

<page-query>
query Post ($path: String!) {
  post: post (path: $path) {
    title
    path
    banner
    date (format: "DD MMMM YYYY")
    timeToRead
    description
    content
    author
  }
}
</page-query>

<style lang="stylus" scoped>
.post-title {
  padding: calc((var(--space) / 2)) 0 calc((var(--space) / 2));
  text-align: center;
}
</style>