<script>
  import SocialLinks from '../components/SocialLinks.svelte'
  import Head from '../components/Head.svelte'
</script>

<style>
  .intro {
    color: var(--text-color-50);
    text-align: center;
    font-size: 1.3em;
    margin-top: 25%;
  }

  :global(.intro a) {
    color: var(--text-color-50);
    transition: all 200ms ease-in;
    border-color: transparent;
  }

  :global(.intro a):hover {
    color: var(--text-color);
    border-color: currentColor;
  }
</style>

<Head title="Tim Deschryver" />

<section class="intro">
  <SocialLinks />
</section>

<a href="links" style="display:none; visibility:hidden">hidden links</a>
