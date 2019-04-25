<template>
  <div v-if="tweetId" class="share-links">
    <a :href="retweet" @click.prevent="tweet">Retweet</a>,
    <a :href="like" @click.prevent="tweet">Like</a>,
    <a :href="reply" @click.prevent="tweet">Reply</a>, or
    <a :href="share" @click.prevent="tweet">Share</a>
    on Twitter
  </div>
  <div v-else class="share-links">
    <a :href="share" @click.prevent="tweet">Share</a> on Twitter
  </div>
</template>

<script>
export default {
  props: {
    url: {
      type: String,
      default: '',
    },
    text: {
      type: String,
      default: '',
    },
    hashtags: {
      type: Array,
      default: () => [],
    },
    tweetId: {
      type: String,
      default: '',
    },
  },
  computed: {
    retweet() {
      return `https://twitter.com/intent/retweet?tweet_id=${
        this.tweetId
      }&related=tim_deschryver`
    },
    like() {
      return `https://twitter.com/intent/like?tweet_id=${
        this.tweetId
      }&related=tim_deschryver`
    },
    reply() {
      return `https://twitter.com/intent/tweet?tweet_id=${
        this.tweetId
      }&related=tim_deschryver`
    },
    share() {
      const tweet = {
        url: this.url,
        text: this.text,
        hashtags: this.hashtags,
        via: 'tim_deschryver',
      }

      const queryString = Object.entries(tweet)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')

      return `https://twitter.com/share?${queryString}`
    },
  },
  methods: {
    tweet: function(event) {
      window.open(event.target.href, `twitter-share`, 'width=550,height=300')
    },
  },
}
</script>

<style lang="styl">
.share-links
  a
    color #333
    font-weight: 900
</style>
