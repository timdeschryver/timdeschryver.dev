import * as sapper from '@sapper/app'
import { googleAnalytics } from './utils/google-analytics.js'

sapper.start({
  target: document.querySelector('#sapper'),
})

if (process.env.GA_TRACKING_ID) {
  googleAnalytics(process.env.GA_TRACKING_ID)
}
