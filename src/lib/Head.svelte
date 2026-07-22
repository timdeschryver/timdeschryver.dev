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

	const structuredData = $derived(
		type === 'article'
			? {
					'@context': 'https://schema.org',
					'@type': 'BlogPosting',
					headline: title,
					description,
					url: canonical,
					mainEntityOfPage: canonical,
					image,
					datePublished: published,
					dateModified: modified || published,
					author: {
						'@type': 'Person',
						name: author,
						url: 'https://timdeschryver.dev',
					},
					publisher: {
						'@type': 'Person',
						name: author,
						url: 'https://timdeschryver.dev',
					},
					keywords: tags.join(', '),
				}
			: type === 'profile'
				? {
						'@context': 'https://schema.org',
						'@type': 'ProfilePage',
						url: canonical,
						mainEntity: {
							'@type': 'Person',
							name: author,
							url: canonical,
							jobTitle: 'Software Engineer',
							homeLocation: {
								'@type': 'Country',
								name: 'Belgium',
							},
							sameAs: [
								'https://github.com/timdeschryver',
								'https://www.linkedin.com/in/tim-deschryver',
								'https://bsky.app/profile/timdeschryver.dev',
							],
						},
					}
				: null,
	);
	const structuredDataJson = $derived(
		structuredData ? JSON.stringify(structuredData).replace(/</g, '\\u003c') : '',
	);
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

	{#if structuredData}
		<svelte:element this={"script"} type="application/ld+json">{structuredDataJson}</svelte:element>
	{/if}
</svelte:head>
