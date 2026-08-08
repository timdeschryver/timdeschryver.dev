import { UTCDate } from '$lib/formatters';
import { publicUrl } from '../../../lib/variables';
import { readPosts } from '../_posts';

export const prerender = true;

export async function GET() {
	const posts = await readPosts();
	return new Response(generate(posts), {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
		},
	});
}

function generate(posts: Awaited<ReturnType<typeof readPosts>>) {
	const nodes = posts.slice(0, 20).map((post) => {
		const link = publicUrl(`/blog/${post.metadata.slug}`);
		const tldr = post.tldr
			? `<p><a href="${link}?tldr=true">Read the <strong>code-only version</strong> on timdeschryver.dev</a></p>`
			: `<p>Read <strong>${post.metadata.title}</strong> on <a href="${link}">timdeschryver.dev</a></p>`;
		return {
			title: post.metadata.title,
			description: post.metadata.description,
			link,
			pubDate: UTCDate(post.metadata.date),
			content: safeCdata(
				`<img class="webfeedsFeaturedVisual" src="${post.metadata.banner}" alt="${htmlAttribute(post.metadata.title)}"/>` +
					tldr +
					absolutizeUrls(post.html || ''),
			),
		};
	});

	const itemNodes = nodes
		.map((node) => {
			return `
				<item>
					<title><![CDATA[${safeCdata(node.title)}]]></title>
					<description><![CDATA[${safeCdata(node.description)}]]></description>
					<link>${node.link}</link>
					<guid>${node.link}</guid>
					<pubDate>${node.pubDate}</pubDate>
					<dc:creator><![CDATA[Tim Deschryver]]></dc:creator>
					<content:encoded><![CDATA[${node.content}]]></content:encoded>
				</item>
			`;
		})
		.join('\n');

	const link = `<link>${publicUrl('/blog')}</link>`;
	const atom = `<atom:link href="${publicUrl('/blog/rss.xml')}" rel="self" type="application/rss+xml"/>`;
	const imageLink = `<link>${publicUrl('/blog')}</link>`;
	const image = `<image>
	<url>${publicUrl('/favicons/favicon-32x32.png')}</url>
	<title>Tim Deschryver</title>
	${imageLink}
	</image>`;
	const xml = `<?xml version="1.0" encoding="UTF-8" ?>
		<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:webfeeds="http://webfeeds.org/rss/1.0" version="2.0">
		<channel>
		<title><![CDATA[ Tim Deschryver ]]></title>
		<description><![CDATA[ Blog by Tim Deschryver ]]></description>
		<lastBuildDate>${UTCDate(latestContentDate(posts))}</lastBuildDate>
		<ttl>60</ttl>
		<language>en-us</language>
		${link}
		${atom}
		${image}
		${itemNodes}
		</channel>
		</rss>`;
	return xml;
}

function latestContentDate(posts: Awaited<ReturnType<typeof readPosts>>) {
	return posts
		.map((post) => post.metadata.modified || post.metadata.date)
		.sort()
		.at(-1) as string;
}

function absolutizeUrls(html: string) {
	return html.replace(/\b(href|src)="\/(?!\/)/g, (_, attribute: string) => {
		return `${attribute}="${publicUrl('/')}`;
	});
}

function safeCdata(value: string) {
	return value.replaceAll(']]>', ']]]]><![CDATA[>');
}

function htmlAttribute(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('"', '&quot;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');
}
