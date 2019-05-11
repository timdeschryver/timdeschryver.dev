<script>
  import SocialLinks from '../components/SocialLinks.svelte'
</script>

<style>
  .intro {
    text-align: center;
    font-size: 1.3em;
    margin-top: 25%;
  }

  :global(.intro a) {
    color: var(--color-text);
    border: none;
  }
</style>

<section class="intro">
  <SocialLinks />
</section>
