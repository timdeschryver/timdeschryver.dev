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