---
title: Use jq to query and manipulate JSON data
slug: use-jq-to-query-and-manipulate-json-data
date: 2023-11-28
tags: devtools, productivity
---

# Using jq to work with JSON data

[jq](https://jqlang.github.io/jq/) is a lightweight command-line tool to quickly process your JSON data.
I mainly use it to search (`grep`) and select specific fields of a JSON file, but it can also be used to transform (`sed`) and process (`awk`) the data.
Of course, the output is also nicely formatted.

If this peaks your interest head over to the [download](https://jqlang.github.io/jq/download/) page.

:::code-group

```json data.json [title=data.json]
{
	"persons": [
		{
			"id": 1,
			"name": "Bob"
		},
		{
			"id": 2,
			"name": "Alice"
		}
	],
	"lastModified": "2023-11-26"
}
```

```bash [title=root property]
jq .lastModified data.json

> "2023-11-26"
```

```bash [title=specific array item]
jq .persons[1]
> {
    "id": 2,
    "name": "Alice"
  }
```

```bash [title=nested array property]
jq .persons.[].name data.json

> "Bob"
> "Alice"
```

```bash [title=multiple properties]
jq .persons[0].id, .lastModified data.json

> 1
> "2023-11-26"
```

:::

While these examples are simple and are using a local data source, you can feed data to `jq` using the pipe (`|`) operator.

```bash
curl 'https://api.github.com/repos/jqlang/jq/commits?per_page=5' | jq '.'
```

Make sure to check out the [tutorial](https://jqlang.github.io/jq/tutorial/) and the [playground](https://jqplay.org/s/DoDm89WwANI/) to also learn how to fully take advantage of `jq` by transforming and filtering JSON data.
