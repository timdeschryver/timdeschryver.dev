## Configure the router

```ts{2}
RouterModule.forRoot(routes, {
	paramsInheritanceStrategy: 'always',
});
```

## Result

Watch that the parent's data is available on the snapshot, instead of just the activated route.

```txt
https://localhost:4200/company/7/year/2022/customers/1
```

```diff
{
	"snapshot": {
		"params": {
			"customerId": 1
+			"companyId": 7,
+			"year": 2022,
		}
	}
}
```

This means that you can simply access it.

```ts
const companyId = activatedRoute.snapshot.params.companyId;
```

## Sandbox

Take a look at a working sandbox and notice the effect when you remove the `paramsInheritanceStrategy: 'always'` option.

<iframe src="https://stackblitz.com/edit/angular-zhha9v?ctl=1&embed=1&file=src/app/app-routing.module.ts" title="angular-routing-example"
></iframe>
