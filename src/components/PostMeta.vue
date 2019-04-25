<template>
  <small>
    {{ post.date }} | {{ post.timeToRead }} min read
    <template v-if="withTags">
      |
      <span v-for="tag in post.tags" :key="tag">#{{ tag }}&nbsp;</span>
    </template>
  </small>
</template>

<script>
export default {
  props: {
    post: {},
    withTags: Boolean,
  },
}
</script>

<style lang="styl">
small
  color #838383
</style>
