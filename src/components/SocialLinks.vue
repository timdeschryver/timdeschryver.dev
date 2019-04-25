<template>
  <div class="social-links">
    <a href="https://twitter.com/tim_deschryver">Twitter</a> {{ separator }}
    <a href="https://github.com/timdeschryver">GitHub</a> {{ separator }}
    <a href="https://medium.com/@timdeschryver">Medium</a>
  </div>
</template>

<script>
export default {
  props: {
    separator: { type: String, default: '|' },
  },
}
</script>

<style lang="styl">
.social-links
  a
    color #333
    font-weight 900
</style>
