<script>
  import Head from '../components/Head.svelte'
</script>

<style>
  .intro {
    color: var(--text-color-50);
    text-align: center;
    font-size: 1.3em;
    margin-top: 25%;
  }

  a.social-link {
    transition: all var(--transition-duration) ease-in;
    border-color: transparent;
    color: var(--text-color);
  }

  a.social-link:hover {
    color: var(--text-color);
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
