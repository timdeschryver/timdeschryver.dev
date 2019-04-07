<template>
  <Layout>
    <div class="posts">
      <PostCard v-for="edge in $page.posts.edges" :key="edge.node.id" :post="edge.node"/>
    </div>
  </Layout>
</template>

<page-query>
{
  posts: allPost (filter: {published: {eq: true}}){
    edges {
      node {
        id
        title
        path
        date (format: "DD MMMM YYYY")
        timeToRead
        description
        tags
        ...on Post {
            id
            title
            path
        }
      }
    }
  }
}
</page-query>

<script>
import PostCard from '~/components/PostCard.vue'

export default {
  components: {
    PostCard,
  },
  metaInfo: {
    title: 'Posts',
  },
}
</script>
