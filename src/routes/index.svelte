<script lang="ts">
  import Head from "../components/Head.svelte";
</script>

<style>
  .intro {
    text-align: center;
    font-size: 1.3em;
    margin-top: 25%;
  }
</style>

<Head title="Tim Deschryver" />

<section class="intro">
  <a
    href={`${import.meta.env.SNOWPACK_PUBLIC_BASE_PATH}/twitter`}
    class="social-link">Twitter</a>
  |
  <a
    href={`${import.meta.env.SNOWPACK_PUBLIC_BASE_PATH}/github`}
    class="social-link">GitHub</a>
</section>

<a href="sitemap.xml" style="display:none; visibility:hidden">sitemap.xml</a>
