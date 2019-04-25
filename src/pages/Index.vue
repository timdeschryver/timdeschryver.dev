<template>
  <Layout>
    <div class="wrapper">
      <SocialLinks />
    </div>
  </Layout>
</template>

<script>
import SocialLinks from '~/components/SocialLinks.vue'

export default {
  components: {
    SocialLinks,
  },
}
</script>

<style lang="styl">
.wrapper
  text-align center
  transform translateY(35vh)
  @media screen and (max-height: 450px)
    transform translateY(30vh)
  @media screen and (max-height: 280px)
    transform translateY(25vh)
  @media screen and (max-height: 220px)
    transform translateY(2vh)
</style>
