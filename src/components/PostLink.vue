<template>
  <a
    v-if="post.publisher"
    :href="post.publishUrl"
    :data-publisher="post.publisher"
    rel="external"
    referrerpolicy="origin"
  >[{{ post.publisher }}] {{ post.title }}</a>

  <g-link v-else :to="post.path">{{ post.title }}</g-link>
</template>

<script>
export default {
  props: {
    post: {},
  },
}
</script>

<style lang="stylus" scoped>
a {
  color: #000;

  &[data-publisher='Angular In Depth'] {
    color: #C7311E;
  }

  &[data-publisher='ITNEXT'] {
    color: #3D79AD;
  }
}
</style>

