<template>
  <Layout>
    <section>
      <a href="https://twitter.com/tim_deschryver">Twitter</a> |
      <a href="https://github.com/timdeschryver">GitHub</a> |
      <a href="https://medium.com/@timdeschryver">Medium</a>
    </section>
  </Layout>
</template>

<script>
export default {
  metaInfo: {
    title: 'Home',
  },
}
</script>


<style lang="stylus" scoped>
main {
  display: grid;
  height: 100%;
}

section {
  margin: auto;
}

a {
  color: #333;
}
</style>
