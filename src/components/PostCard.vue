<template>
  <article>
    <h2>
      <PostLink :post="post"></PostLink>
    </h2>
    <p v-html="post.description"/>
    <PostMeta :post="post" :with-tags="true"/>
  </article>
</template>

<script>
import PostMeta from '~/components/PostMeta'
import PostLink from '~/components/PostLink'

export default {
  components: {
    PostMeta,
    PostLink,
  },
  props: {
    post: {},
  },
}
</script>

<style lang="stylus" scoped>
p {
  margin-top: 0.5em;
}
</style>

