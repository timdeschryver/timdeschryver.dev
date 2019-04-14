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
          key: 'description',
          name: 'description',
          content: this.$page.post.description,
        },
        {
          key: 'keywords',
          name: 'keywords',
          content: this.$page.post.tags.join(','),
        },
        {
          key: 'author',
          name: 'author',
          content: this.$page.post.author,
        },
        {
          key: 'copyright',
          name: 'copyright',
          content: this.$page.post.author,
        },

        { key: 'og:title', name: 'og:title', content: this.$page.post.title },
        {
          key: 'og:description',
          name: 'og:description',
          content: this.$page.post.description,
        },
        { key: 'og:type', name: 'og:type', content: 'article' },
        {
          key: 'og:image',
          name: 'og:image',
          content: process.env.GRIDSOME_BASE_PATH + this.$page.post.banner.src,
        },

        {
          key: 'twitter:card',
          name: 'twitter:card',
          content: 'summary_large_image',
        },
        {
          key: 'twitter:title',
          name: 'twitter:title',
          content: this.$page.post.title,
        },
        {
          key: 'twitter:description',
          name: 'twitter:description',
          content: this.$page.post.description,
        },
        {
          key: 'twitter:image',
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
    tags
  }
}
</page-query>

<style lang="stylus" scoped>
.post-title {
  padding: calc((var(--space) / 2)) 0 calc((var(--space) / 2));
  text-align: center;
}
</style>