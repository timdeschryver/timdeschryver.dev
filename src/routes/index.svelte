<script>
  import Head from '../components/Head.svelte'
</script>

<style>
  .intro {
    text-align: center;
    font-size: 1.3em;
    margin-top: 25%;
  }

  a.social-link {
    transition: all var(--transition-duration) ease-in;
    border-color: transparent;
  }

  a.social-link:hover {
    border-color: currentColor;
  }
</style>

<Head title="Tim Deschryver" />

<section class="intro">
  <a href="https://twitter.com/tim_deschryver" class="social-link">Twitter</a>
  |
  <a href="https://github.com/timdeschryver" class="social-link">GitHub</a>
</section>

<a href="links" style="display:none; visibility:hidden">hidden links</a>
