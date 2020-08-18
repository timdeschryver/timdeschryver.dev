<script>
  import { onMount } from 'svelte'
  import { stores } from '@sapper/app'
  const { page } = stores()

  let bmc

  onMount(() => {
    console.log(
      'BMC mounted',
      'MutationObserver' in window,
      document.querySelector('#bmc-wbtn'),
    )
    if (!'MutationObserver' in window) return
    bmc = document.querySelector('#bmc-wbtn')
    if (bmc) return
    let observer = new MutationObserver((entries, observer) => {
      entries.forEach((entry) => {
        const [added] = entry.addedNodes
        if (added && added.id === 'bmc-wbtn') {
          console.log('found bmc')
          observer.disconnect()
          bmc = added
        }
      })
    })
    observer.observe(document.querySelector('body'), {
      childList: true,
      subtree: true,
    })
  })
  $: if (bmc) {
    const isPageForBMC = $page.path.startsWith('/blog') && $page.params.slug
    console.log(isPageForBMC, $page.path.startsWith('/blog'), $page.params.slug)
    if (isPageForBMC) {
      bmc.style.display = 'flex'
    } else {
      bmc.style.display = 'none'
    }
  }
</script>
<svelte:head>
  <script
    data-name="BMC-Widget"
    src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
    defer="true"
    data-id="timdeschryver"
    data-description="Support me on Buy me a coffee!"
    data-message="If you liked my blog, consider buying my a coffee!"
    data-color="#FF813F"
    data-position=""
    data-x_margin="18"
    data-y_margin="18"
  ></script>
</svelte:head>
