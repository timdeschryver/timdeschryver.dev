<script>
  import { onMount } from 'svelte'
  let name = ''
  $: name && window.sessionStorage.setItem('user', name)

  onMount(() => {
    name = window.sessionStorage.getItem('user') || ''
  })
</script>

<style>
  button {
    margin-left: 5px;
  }

  .form-actions {
    text-align: right;
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
