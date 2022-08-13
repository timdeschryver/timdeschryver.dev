---
title: TIL params inheritance strategy to always have access to parent route info
slug: til-paramsinheritancestrategy-to-always-have-access-to-parent-route-info
description: Configure the Angular router to always have access to the parent route data from within the child route.
author: Tim Deschryver
date: 2022-02-22
tags: Angular, TIL
---

For all the years that I've been working with Angular, I always had a hard time to access the parent route info, e.g. params, and data.

You probably already know what I mean and might even have written the same code as I did.

Let's take a quick look at an example route.

```txt
https://localhost:4200/parent/:parentId/child/:childId/grandchild
```

To make this more concrete, the route might look like this in the application.

```txt
https://localhost:4200/company/7/year/2022/customers
```

To give you the full picture, the Angular routes for this route are defined as follows.

```ts
RouterModule.forRoot([
    {
        path: 'company/:companyId',
        component: CompanyComponent,
        children: [
            {
                path: 'year/:year',
                component: YearComponent,
                children: [
                    path: 'customers',
                    component: CustomersComponent
                ]
            }
        ]
    },
]);
```

And the snapshot of the activated customers route looks empty by default.

```json
{
	"snapshot": {
		"params": {}
	}
}
```

Now, to access the parent id (`comanyId`) from the customers component, the code that I used to write, and have seen a lot, is the following one.

```ts
const companyId = activatedRoute.parent.parent.snapshot.params.companyId;
```

What I don't like about this code is that it's very brittle.
There's a big chance that the above breaks when the routes are re-arranged, or when the component is used in multiple views with another route structure or naming.

As a fix, one can make the code more robust and make the lookup dynamic, with for example, a `while` look that traverses the parent routes until it finds the data that it's looking for.

But, Today I Learned, that there's a better, quicker, and simpler solution to this problem.

Please welcome, [paramsInheritanceStrategy](https://angular.io/api/router/ExtraOptions#paramsInheritanceStrategy), a router option that's been a part of the Angular API from the earlier versions. It is only today, 4 years later, that I encounter the `paramsInheritanceStrategy` option.

With its value set to `always`, you get access to all parent data from the activated route snapshot.

For the same route as we started with, the customers activated route's payload looks like this.

```json
{
	"snapshot": {
		"params": {
			"companyId": 7,
			"year": 2022
		}
	}
}
```

Meaning that we can pluck `companyId` from the snapshot.

```ts
const companyId = activatedRoute.snapshot.params.companyId;
```

This has the advantage that:

- it's easier to understand
- it's reusable
- changing routes doesn't have an impact

This goes further than just the route `params`, but the full route information is accessible from the child, for example, the `data` property.

To get this result, configure the Angular router and set the `paramsInheritanceStrategy` option to `always`.

```ts{17}
RouterModule.forRoot([
    {
        path: 'company/:companyId',
        component: CompanyComponent,
        children: [
            {
                path: 'year/:year',
                component: YearComponent,
                children: [
                    path: 'customers',
                    component: CustomersComponent
                ]
            }
        ]
    }],
    {
        paramsInheritanceStrategy: 'always'
    }
);
```

Note that for params with the same name, that the param the closest to the activated route wins.

An example, let's take a look at the following structure.

```ts{3,5-8,11,14,16-19}
RouterModule.forRoot([
    {
        path: 'company/:id',
        component: CompanyComponent,
        data: {
            title: 'Company',
            featureToggleA: true,
        },
        children: [
            {
                path: 'year/:year',
                component: YearComponent,
                children: [
                    path: 'customers/:id',
                    component: CustomersComponent,
                    data: {
                        title: 'Customer',
                        featureToggleB: true,
                    },
                ]
            }
        ]
    }],
    {
        paramsInheritanceStrategy: 'always'
    }
);
```

When the customer route `/customers/99/year/2022/customers/4` is the active, then we end up with the following results.

```json
{
	"snapshot": {
		"params": {
			// from the year route
			"year": 2022,
			// from the customer route
			// the parent's route info is lost
			"id": 4
		},
		"data": {
			// from the customer route
			"title": "Customer",
			// from the company route
			"featureToggleA": true,
			// from the customer route
			"featureToggleB": false
		}
	}
}
```

Therefore, it's important to give a unique name to the route parameters, and not to default to `:id` for all routes. This also makes it easier to differentiate the params of a route.

## Conclusion

By setting the value of `paramsInheritanceStrategy` to `always`, we get access to all the data from parent routes. Whereas previously, with the default value `emptyOnly` we do not.

For the `https://localhost:4200/company/7/year/2022/customers/1` route, this means that the company id and the year are added to the params snapshot of the customer route.

```diff
{
    "snapshot": {
        "params": {
            "customerId": 1
+           "companyId": 7,
+           "year": 2022,
        }
    }
}
```

For the default `emptyOnly`, this is only the case when there isn't a component bound to the route.

Take a look at a working sandbox and notice the effect when you remove the `paramsInheritanceStrategy: 'always'` option.

<iframe src="https://stackblitz.com/edit/angular-zhha9v?ctl=1&embed=1&file=src/app/app-routing.module.ts" title="angular-routing-example"
></iframe>
