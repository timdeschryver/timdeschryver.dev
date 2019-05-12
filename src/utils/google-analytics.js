export const googleAnalytics = gaID => {
  window.dataLayer = window.dataLayer || []
  window.gtag = function() {
    dataLayer.push(arguments)
  }

  gtag('js', new Date())

  const script = document.createElement('script')
  script.src = `https://www.googletagmanager.com/gtag/js`
  document.body.appendChild(script)
}
