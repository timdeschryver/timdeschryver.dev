<script>
  import { onMount } from 'svelte'
  let name = ''
  $: name && window.sessionStorage.setItem('user', name)

  onMount(() => {
    name = window.sessionStorage.getItem('user') || ''
  })
</script>

<style>
  .form-actions {
    text-align: right;
  }

  form {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: 0px;
    padding: 130px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    mix-blend-mode: normal !important;
  }

  button {
    color: var(--prime-color);
    margin: 0;
    margin-left: 5px;
    cursor: pointer;
    text-decoration: none;
    text-transform: uppercase;
    border: none;
    padding: 0.25rem 1rem;
    font-size: 0.75rem;
    line-height: 2.5;
    font-weight: 900;
    background: none;
  }
</style>

<form on:submit|preventDefault>
  <h3>Send Tim a message</h3>

  <div>
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={name} />
  </div>

  <div>
    <label for="message">Message</label>
    <textarea id="message" required maxlength="500" rows="5" />
  </div>

  <div class="form-actions">
    <button type="button" on:click>Cancel</button>
    <button type="submit">Submit</button>
  </div>
</form>