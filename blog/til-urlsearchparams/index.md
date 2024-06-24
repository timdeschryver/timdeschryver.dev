---
title: 'TIL: URLSearchParams'
slug: til-urlsearchparams
description: From my experience dealing with query strings was harder than it should be. But with URLSearchParams and URL it's actually pretty easy to do!
author: Tim Deschryver
date: 2020-05-03
tags: TIL, JavaScript
---

It has been a while that I had the need to read and write query parameters from an URL myself because Angular abstracts all of this away in the `@angular/router` package. But because my [personal blog](/blog) is written with Svelte and I wanted to have a feature to search for blog posts, I had to write it myself this time.

From my experience with query strings, during the jQuery era, this wasn't straight forward.
But today I learned about the `URLSearchParams` API and now it is super easy!

Let's take a look at an example.

We have the URL [https://timdeschryver.dev/blog?q=Angular+NgRx](https://timdeschryver.dev/blog?q=Angular+NgRx) and we want want to retrieve the query params to filter blog posts based on the `q` parameter.

To create the `URLSearchParams` we need to access the query string, this is available on the `search` property of the `location`. With it, we can create a new instance of `URLSearchParams`.

```js
console.log(location.search);
// |> '?q=Angular+NgRx'
const params = new URLSearchParams(location.search);
```

While writing this blog post, I also discovered that the search params are available on `URL` instances and on anchor tags (`<a>`).

```js
const url = new URL(location.search);
const params = url.searchParams;

const node = document.querySelector('#search');
const url = new URL(node.href);
const params = new URLSearchParams(node.search);
```

So now that we have `params`, what can we do with it?

We can read a query parameter with the `get` method.

```js
params.get('q');
// |> 'Angular NgRx'
```

We can set a query parameter with the `set` method.

```js
params.set('q', 'Performance');
```

We can delete a query parameter with the `delete` method.

```js
params.delete('q');
```

So easy!
We don't have to manually parse the query parameters ourselves and we're sure that it's bug-free.
There are even not all the available methods, these are just the ones I used and I think are the ones that are used the most.

## Navigating

Setting and deleting the search params doesn't change the current location.
To modify the current location we can make use of the `history.replaceState` method and pass it the new URL.

The stringified version of params will concatenate all keys and values to one query string.

```js
console.log(params.toString());
// |> q=Testing+Library
```

Together with the current pathname, we can create a new URL.

```js
window.history.replaceState(window.history.state, '', `${location.pathname}?${params}`);
```

## Example code

I ended up with the following code to set a new URL and to filter the blog posts.
Using the svelte reactive statements it's simple to react to value changes and makes the whole flow easy to read.

```js
// instantiate with the query parameter
// query is bound to an input element (<input bind:value={query} type="search"  />)
let query = $page.query['q'] || '';

// change the URL when the query is changed
$: if (typeof window !== 'undefined') {
	let params = new URLSearchParams(window.location.search);

	if (query) {
		params.set('q', query);
		window.history.replaceState(window.history.state, '', `${location.pathname}?${params}`);
	} else {
		params.delete('q');
		window.history.replaceState(window.history.state, '', location.pathname);
	}
}

// filter posts based on the query
$: if (query) {
	filteredPosts = posts.filter((p) => {
		return queryParts.every(
			(q) =>
				p.metadata.tags.some((t) => match(t, q)) ||
				like(p.metadata.title, q) ||
				like(p.metadata.description, q),
		);
	});
} else {
	filteredPosts = posts;
}
```

## Additional resources

- [URLSearchParams MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [Easy URL Manipulation with URLSearchParams](https://developers.google.com/web/updates/2016/01/urlsearchparams)
- [History MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/History)
