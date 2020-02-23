const fetch = require('node-fetch')

module.exports = (on, config) => {
  on('task', {
    sitemapUrls(numberOfUrls = 4) {
      return fetch(`${config.baseUrl}/sitemap.xml`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/xml',
        },
      })
        .then(res => res.text())
        .then(xml => {
          const locs = [...xml.matchAll(`<loc>(.|\n)*?</loc>`)].map(([loc]) =>
            loc.replace('<loc>', '').replace('</loc>', ''),
          )
          console.log(numberOfUrls)
          return locs.slice(0, numberOfUrls || 4)
        })
    },
  })
  return config
}
