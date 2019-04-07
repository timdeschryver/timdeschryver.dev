<template>
  <article>
    <h2>
      <g-link :to="post.path">{{ post.title }}</g-link>
    </h2>
    <p v-html="post.description"/>

    <PostMeta :post="post" :with-tags="true"/>
  </article>
</template>

<script>
import PostMeta from '~/components/PostMeta'

export default {
  components: {
    PostMeta,
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

a {
  text-decoration: none;
}
</style>

