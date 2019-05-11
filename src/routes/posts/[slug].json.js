import send from '@polka/send'
import { posts } from './_posts.js'

let lookup

export function get(req, res) {
  if (!lookup || process.env.NODE_ENV !== 'production') {
    lookup = new Map()
    posts().forEach(post => {
      lookup.set(post.metadata.slug, post)
    })
  }

  const post = lookup.get(req.params.slug)

  if (post) {
    res.setHeader('Cache-Control', `max-age=${5 * 60 * 1e3}`) // 5 minutes
    res.setHeader('Content-Type', `application/json`)
    send(res, 200, JSON.stringify(post))
  } else {
    send(res, 404, { message: 'not found' })
  }
}
