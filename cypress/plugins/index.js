const fetch = require('node-fetch')

module.exports = (on, config) => {
  on('task', {
    sitemapLocations(pages = 4) {
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
          return locs.slice(0, pages || 4)
        })
    },
  })
  return config
}
