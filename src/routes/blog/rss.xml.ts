import { UTCDate } from '$lib/formatters';
import { posts } from '../_posts';

export function get() {
	return {
		body: generate(posts),
		headers: {
			'Content-Type': 'application/xml'
		}
	};
}

function generate(allPosts: ReturnType<typeof posts>) {
	const publishedPosts = allPosts.filter((post) => post.metadata.published);
	const nodes = publishedPosts.map((post) => {
		const link = `${import.meta.env.VITE_PUBLIC_BASE_PATH}/blog/${post.metadata.slug}`;
		const tldr = post.tldr
			? `<p><a href="${link}?tldr=true">Read the <strong>TLDR version</strong> on timdeschryver.dev</a></p>`
			: `<p>Read <strong>${post.metadata.title}</strong> on <a href="${link}">timdeschryver.dev</a></p>`;
		return {
			title: post.metadata.title,
			description: post.metadata.description,
			link,
			pubDate: UTCDate(post.metadata.date),
			content: (
				`<img class="webfeedsFeaturedVisual" src="${post.metadata.banner}" alt="${post.metadata.title}"/>` +
				tldr +
				post.html
			)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
		};
	});

	const itemNodes = nodes
		.map((node) => {
			return `
				<item>
				<title><![CDATA[ ${node.title} ]]></title>
				<description><![CDATA[ ${node.description} ]]></description>
				<link>${node.link}</link>
				<guid isPermaLink="false">${node.link}</guid>
				<pubDate>${node.pubDate}</pubDate>
				<content:encoded>${node.content}></content:encoded>
				</item>
			`;
		})
		.join('\n');

	const link = `<link>${import.meta.env.VITE_PUBLIC_BASE_PATH}/blog</link>`;
	const atom = `<atom:link href="${
		import.meta.env.VITE_PUBLIC_BASE_PATH
	}/blog/rss.xml" rel="self" type="application/rss+xml"/>`;
	const imageLink = `<link>${import.meta.env.VITE_PUBLIC_BASE_PATH}/blog</link>`;
	const image = `<image>
	<url>${import.meta.env.VITE_PUBLIC_BASE_PATH}/favicons/favicon-32x32.png</url>
	<title>Tim Deschryver</title>
	${imageLink}
	</image>`;
	const xml = `<?xml version="1.0" encoding="UTF-8" ?>
		<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:webfeeds="http://webfeeds.org/rss/1.0" version="2.0">
		<channel>
		<title><![CDATA[ Tim Deschryver ]]></title>
		<webfeeds:accentColor>#F8C400</webfeeds:accentColor>
		<webfeeds:analytics id="${import.meta.env.VITE_PUBLIC_GA_TRACKING_ID}" engine="GoogleAnalytics"/>
		<description><![CDATA[ Blog by Tim Deschryver ]]></description>
		${link}
		${atom}
		${image}
		<language>en-us</language>
		<lastBuildDate>${new Date().toISOString()}</lastBuildDate>
		${itemNodes}
		</channel>
		</rss>`;
	return xml;
}
