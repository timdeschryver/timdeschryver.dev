<template>
  <div v-if="tweetId" class="share-links">
    <a
      :href="retweet"
      onclick="window.open(this.href, 'twitter-retweet', 'width=550,height=235');return false;"
      >Retweet</a
    >,
    <a
      :href="like"
      onclick="window.open(this.href, 'twitter-like', 'width=550,height=235');return false;"
      >Like</a
    >,
    <a
      :href="reply"
      onclick="window.open(this.href, 'twitter-tweet', 'width=550,height=235');return false;"
      >Reply</a
    >, or
    <a
      :href="share"
      onclick="window.open(this.href, 'twitter-share', 'width=550,height=235');return false;"
      >Share</a
    >
    on Twitter
  </div>
  <div v-else class="share-links"> <a :href="share">Share</a> on Twitter </div>
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
}
</script>

<style lang="styl">
.share-links
  a
    color #333
    font-weight: 900
</style>
