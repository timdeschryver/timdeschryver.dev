<script>
  import { onMount } from 'svelte'

  let colorPrime
  let colorText
  let colorBg

  let codeTheme

  $: dispatchColor('--prime-color', colorPrime)
  $: dispatchColor('--background-color', colorBg)
  $: dispatchCodeTheme('code-theme', codeTheme)

  onMount(() => {
    colorPrime = localStorage.getItem('--prime-color')
    colorBg = localStorage.getItem('--background-color')
    codeTheme = document.body.dataset.theme
  })

  function dispatchColor(key, value) {
    if (!value) return
    window.dispatchEvent(
      new CustomEvent('change-color', {
        detail: {
          key,
          value,
        },
      }),
    )
  }

  function dispatchCodeTheme(key, value) {
    if (!value) return
    window.dispatchEvent(
      new CustomEvent('change-code-theme', {
        detail: {
          value,
        },
      }),
    )
  }
</script>

<input type="color" bind:value={colorPrime} />
<input type="color" bind:value={colorBg} />
<input type="color" bind:value={colorText} />

<select bind:value={codeTheme}>
  <option value="custom">Custom</option>
  <option value="atom-dark">Atom Dark</option>
  <option value="dracula">Dracula</option>
  <option value="nord">Nord</option>
</select>
