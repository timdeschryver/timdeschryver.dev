import { feed } from '../utils/rss'

export function get(req, res) {
  res.writeHead(200, {
    'Cache-Control': `max-age=0, s-max-age=${600}`, // 10 minutes
    'Content-Type': 'application/rss+xml',
  })

  res.end(feed())
}

// this does not work for statis builds?
// export function get(req, res) {
//   const url = '/posts/rss.xml'
//   const str = `Redirecting to ${url}`

//   res.writeHead(302, {
//     Location: url,
//     'Content-Type': 'text/plain',
//     'Content-Length': str.length,
//   })

//   res.end(str)
// }
