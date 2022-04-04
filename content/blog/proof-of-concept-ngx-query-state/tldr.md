```ts
import { QueryState, provideQueryState } from 'query-state';

@Component({
	selector: 'example-customers',
	template: `
		<form>
			<input type="text" name="name" [ngModel]="name" required />
		</form>

		<query-state-template [queryState]="queryState.data$">
			<ng-template [qsIdle]="queryState.data$" let-customers>
				<div *ngFor="let customer of customers">
					<div>{{ customer.id }}</div>
					<div>{{ customer.name }}</div>
					<div>{{ customer.address }}</div>
					<a [routerLink]="[customer.id]">Details</a>
				</div>
			</ng-template>
		</query-state-template>
	`,
	providers: provideQueryState(CustomersService, {
		name: CustomersComponent.name,
	}),
})
export class CustomersComponent implements AfterViewInit {
	@ViewChild(NgForm)
	form!: NgForm;
	name = this.queryState.queryParams.name || '';

	constructor(public readonly queryState: QueryState<Customer[]>) {}

	ngAfterViewInit(): void {
		if (this.form.valueChanges) {
			this.queryState.update(this.form.valueChanges.pipe(debounceTime(500)));
		}
	}
}
```
