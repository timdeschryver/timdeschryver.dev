<script lang="ts">
	type PageType = 'website' | 'article' | 'profile' | 'collection';
	type Link = { name: string; url: string };

	type Props = {
		title: string;
		description: string;
		canonical: string;
		image?: string;
		imageWidth?: number;
		imageHeight?: number;
		imageType?: string;
		type?: PageType;
		markdown?: string;
		author?: string;
		published?: string;
		modified?: string | null;
		tags?: string[];
		section?: Link;
		items?: Link[];
	};

	let {
		title,
		description,
		canonical,
		image = 'https://timdeschryver.dev/images/social-card.webp',
		imageWidth = 1200,
		imageHeight = 627,
		imageType = 'image/webp',
		type = 'website',
		markdown,
		author = 'Tim Deschryver',
		published,
		modified,
		tags = [],
		section,
		items = [],
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
		const breadcrumb = section
			? {
					'@type': 'BreadcrumbList',
					'@id': `${canonical}#breadcrumb`,
					itemListElement: [
						{ '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
						{ '@type': 'ListItem', position: 2, name: section.name, item: section.url },
						{ '@type': 'ListItem', position: 3, name: title, item: canonical },
					],
				}
			: null;
		const itemList =
			type === 'collection' && items.length
				? {
						'@type': 'ItemList',
						'@id': `${canonical}#items`,
						itemListElement: items.map((item, index) => ({
							'@type': 'ListItem',
							position: index + 1,
							name: item.name,
							url: item.url,
						})),
					}
				: null;
		const webPage = {
			'@type':
				type === 'profile' ? 'ProfilePage' : type === 'collection' ? 'CollectionPage' : 'WebPage',
			'@id': `${canonical}#webpage`,
			url: canonical,
			name: title,
			description,
			inLanguage: 'en',
			isPartOf: { '@id': websiteId },
			...(type === 'profile' ? { mainEntity: { '@id': personId } } : {}),
			...(breadcrumb ? { breadcrumb: { '@id': breadcrumb['@id'] } } : {}),
			...(itemList ? { mainEntity: { '@id': itemList['@id'] } } : {}),
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
						articleSection: tags,
						inLanguage: 'en',
					}
				: null;

		return {
			'@context': 'https://schema.org',
			'@graph': [
				webPage,
				...(breadcrumb ? [breadcrumb] : []),
				...(itemList ? [itemList] : []),
				...(article ? [article] : []),
				website,
				person,
			],
		};
	});
	const structuredDataJson = $derived(JSON.stringify(structuredData).replace(/</g, '\\u003c'));
	const openGraphType = $derived(type === 'collection' ? 'website' : type);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content={author} />
	<link rel="canonical" href={canonical} />
	{#if markdown}
		<link
			rel="alternate"
			type="text/markdown"
			href={markdown}
			title="Markdown version of this page"
		/>
	{/if}

	<meta property="og:site_name" content="Tim Deschryver" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content={openGraphType} />
	<meta property="og:locale" content="en_US" />
	{#if image}
		<meta property="og:image" content={image} />
		<meta property="og:image:alt" content={title} />
		{#if imageWidth}<meta property="og:image:width" content={String(imageWidth)} />{/if}
		{#if imageHeight}<meta property="og:image:height" content={String(imageHeight)} />{/if}
		{#if imageType}<meta property="og:image:type" content={imageType} />{/if}
	{/if}
	{#if type === 'article' && published}
		<meta property="article:published_time" content={published} />
	{/if}
	{#if type === 'article' && modified}
		<meta property="article:modified_time" content={modified} />
	{/if}
	{#if type === 'article'}
		<meta property="article:author" content={siteUrl} />
		{#each tags as tag (tag)}
			<meta property="article:tag" content={tag} />
		{/each}
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
