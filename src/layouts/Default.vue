<template>
  <div class="page">
    <header>
      <component :is="titleTag" class="name">
        <g-link :to="{ name: 'home' }">{{ config.siteName }} </g-link>
      </component>

      <nav>
        <g-link :to="{ name: 'posts' }">Posts </g-link>
      </nav>
    </header>

    <main class="main">
      <slot />
    </main>

    <footer v-if="!isHomePage">
      <div v-if="twitter">
        <TwitterLinks v-bind="twitter" />
      </div>
      <div>
        Follow me on:
        <SocialLinks :separator="'&'" />
      </div>
    </footer>
  </div>
</template>

<script>
import config from '~/.temp/config.js'
import SocialLinks from '~/components/SocialLinks.vue'
import TwitterLinks from '~/components/TwitterLinks.vue'

export default {
  components: {
    SocialLinks,
    TwitterLinks,
  },
  props: {
    twitter: {
      url: String,
      text: String,
      hashtags: Array,
      tweetId: String,
    },
  },
  computed: {
    isHomePage() {
      return this.$route.name === 'home'
    },
    titleTag() {
      return this.isHomePage ? 'h1' : 'h2'
    },
    config() {
      return config
    },
  },
}
</script>

<style lang="styl">
html
body
  height 100%
  color #444
  margin-top 0
  font-family Comfortaa, monospace

html
   box-sizing border-box

body
  line-height 1.8

header
main
footer
  margin-left auto
  margin-right auto
  max-width 47rem
  padding 0.75em 1.3125em

header
  a
    color #333

header
footer
  display flex
  justify-content space-between
  align-items center
  nav
    height 1em
    margin 0
  div
    margin 0

header
  border-bottom 3px double #838383

footer
  border-top 3px double #838383

.name
  font-family Gugi
</style>
