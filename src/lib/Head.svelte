<script lang="ts">
	type PageType = 'website' | 'article' | 'profile';

	type Props = {
		title: string;
		description: string;
		canonical: string;
		image?: string;
		type?: PageType;
		author?: string;
		published?: string;
		modified?: string | null;
		tags?: string[];
	};

	let {
		title,
		description,
		canonical,
		image,
		type = 'website',
		author = 'Tim Deschryver',
		published,
		modified,
		tags = [],
	}: Props = $props();

	const siteUrl = 'https://timdeschryver.dev';
	const personId = `${siteUrl}/#person`;
	const websiteId = `${siteUrl}/#website`;

	const structuredData = $derived.by(() => {
		const person = {
			'@type': 'Person',
			'@id': personId,
			name: author,
			url: siteUrl,
			image: `${siteUrl}/images/tim.webp`,
			description:
				'Belgian software engineer and Microsoft MVP writing about .NET, Angular, testing, AI-assisted development, and developer tooling.',
			jobTitle: 'Software Engineer',
			award: 'Microsoft Most Valuable Professional (MVP)',
			knowsAbout: [
				'.NET',
				'Angular',
				'Software testing',
				'AI-assisted development',
				'Agentic AI',
				'Sociocracy 3.0',
				'NgRx',
			],
			homeLocation: {
				'@type': 'Country',
				name: 'Belgium',
			},
			sameAs: [
				'https://www.linkedin.com/in/tim-deschryver',
				'https://bsky.app/profile/timdeschryver.dev',
				'https://twitter.com/tim_deschryver',
				'https://github.com/timdeschryver',
				'https://mvp.microsoft.com/en-us/PublicProfile/5004452?fullName=Tim%20Deschryver',
			],
		};
		const website = {
			'@type': 'WebSite',
			'@id': websiteId,
			url: siteUrl,
			name: 'Tim Deschryver',
			description: 'Articles about .NET, Angular, testing, and developer tooling.',
			inLanguage: 'en',
			publisher: { '@id': personId },
		};
		const webPage = {
			'@type': type === 'profile' ? 'ProfilePage' : 'WebPage',
			'@id': `${canonical}#webpage`,
			url: canonical,
			name: title,
			description,
			inLanguage: 'en',
			isPartOf: { '@id': websiteId },
			...(type === 'profile' ? { mainEntity: { '@id': personId } } : {}),
		};
		const article =
			type === 'article'
				? {
						'@type': 'BlogPosting',
						'@id': `${canonical}#article`,
						headline: title,
						description,
						url: canonical,
						mainEntityOfPage: { '@id': `${canonical}#webpage` },
						isPartOf: { '@id': websiteId },
						...(image ? { image } : {}),
						datePublished: published,
						dateModified: modified || published,
						author: { '@id': personId },
						publisher: { '@id': personId },
						keywords: tags,
						inLanguage: 'en',
					}
				: null;

		return {
			'@context': 'https://schema.org',
			'@graph': [webPage, ...(article ? [article] : []), website, person],
		};
	});
	const structuredDataJson = $derived(JSON.stringify(structuredData).replace(/</g, '\\u003c'));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content={author} />
	<link rel="canonical" href={canonical} />

	<meta property="og:site_name" content="Tim Deschryver" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content={type === 'article' ? 'article' : 'website'} />
	{#if image}
		<meta property="og:image" content={image} />
		<meta property="og:image:alt" content={title} />
	{/if}
	{#if type === 'article' && published}
		<meta property="article:published_time" content={published} />
	{/if}
	{#if type === 'article' && modified}
		<meta property="article:modified_time" content={modified} />
	{/if}

	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if image}
		<meta name="twitter:image" content={image} />
		<meta name="twitter:image:alt" content={title} />
	{/if}

	<svelte:element this={"script"} type="application/ld+json">{structuredDataJson}</svelte:element>
</svelte:head>
