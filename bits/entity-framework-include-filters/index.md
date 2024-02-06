---
title: Entity Framework Include Filters
slug: entity-framework-include-filters
date: 2024-02-06
tags: dotnet, entity-framework
---

# Entity Framework Include Filters

The location where you filter (included) entities is important, as it has a significant impact on the result set.
Without knowing the details, it's easy to make assumptions and make a subtle mistake while filtering entities.

I know I made the mistake numerous times, even not so long ago, and I'm sure I'm not the only one.
That's why I decided to write this Bit, to raise awareness about the small but important details.

The following examples illustrate the difference between including filtered entities (using `Where`), and filtering
entities after the include (using `Any` in this example) statement.

<details>
<summary>Input data</summary>

```json
[
	{
		"FullName": "Tiffany Gerlach",
		"Addresses": [
			{
				"Street": "70 Delmer Ways",
				"ZipCode": "2377"
			},
			{
				"Street": "61 Trisha River",
				"ZipCode": "7470"
			}
		]
	},
	{
		"FullName": "Milford Nader",
		"Addresses": [
			{
				"Street": "86 Feeney Pine",
				"ZipCode": "6560"
			},
			{
				"Street": "23 Hauck Run",
				"ZipCode": "3610"
			}
		]
	}
]
```

</details>

The first example retrieves all persons and only includes the addresses matching the `ZipCode` predicate.
Does not filter the "root" entity.

:::code-group

```cs {2} [title=Include Filter]
var persons = await dbContext.Set<Person>()
  .Include(p => p.Addresses.Where(a => a.ZipCode == "7470"))
  .ToListAsync();
```

```json [title=Result]
[
	{
		"FullName": "iffany Gerlach",
		"Addresses": [
			{
				"Street": "61 Trisha River",
				"ZipCode": "7470"
			}
		]
	},
	{
		"FullName": "Milford Nader",
		"Addresses": []
	}
]
```

:::

The second example only retrieves persons that contain the specified `ZipCode` condition, with all their addresses.
Filters the "root" entity, not the children.

:::code-group

```cs {2-3} [title=Filter After Include]
var persons = await dbContext.Set<Person>()
  .Include(p => p.Addresses)
  .Where(p => p.Addresses.Any(a => a.ZipCode == "7470"))
  .ToListAsync();
```

```json [title=Result]
[
	{
		"FullName": "Tiffany Gerlach",
		"Addresses": [
			{
				"Street": "70 Delmer Ways",
				"ZipCode": "2377"
			},
			{
				"Street": "61 Trisha River",
				"ZipCode": "7470"
			}
		]
	}
]
```

:::
