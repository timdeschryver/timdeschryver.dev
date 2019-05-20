import { generate } from '../utils/sitemap'

export function get(req, res) {
  res.writeHead(200, {
    'Cache-Control': `max-age=0, s-max-age=${600}`, // 10 minutes
    'Content-Type': 'application/xml',
  })

  res.end(generate())
}
