<template>
  <div v-if="publisher" class="publisher" :data-publisher="publisher">
    <a
      v-if="publisher === 'Angular In Depth'"
      href="https://blog.angularindepth.com"
    >
      <g-image
        src="../assets/images/aid_banner.png"
        :alt="publisher + ' banner'"
      />
    </a>

    <a v-if="publisher === 'ITNEXT'" href="https://itnext.io/">
      <g-image
        src="../assets/images/itnext_banner.png"
        :alt="publisher + ' banner'"
      />
    </a>
  </div>
</template>

<script>
export default {
  props: {
    publisher: {
      type: String,
      default: '',
    },
  },
}
</script>

<style lang="styl">
.publisher
  text-align center
  &[data-publisher='Angular In Depth']
    background #C7311E

  &[data-publisher='ITNEXT']
    background #3D79AD
</style>
