// Azure Static Web Apps derives the content type from the file extension and ignores a Content-Type route header,
// so the feed is also prerendered as a .feed file (an extension without a default MIME type that would win over ours),
// which /blog/rss.xml is rewritten to (see staticwebapp.config.json)
export const prerender = true;

export { GET } from '../rss.xml/+server';
