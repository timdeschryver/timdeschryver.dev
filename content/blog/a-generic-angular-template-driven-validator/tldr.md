## 1/3 Create the validator

Create the validator and import the directive where needed.

```ts:validator.module.ts
import { Directive, Input, NgModule } from '@angular/core';
import { AbstractControl, ValidationErrors, NG_VALIDATORS, Validator } from '@angular/forms';

@Directive({
	selector: '[validator]',
	providers: [{ provide: NG_VALIDATORS, useExisting: ValidatorDirective, multi: true }]
})
export class ValidatorDirective implements Validator {
	@Input() validator: (control: AbstractControl) => ValidationErrors | null;

	validate(control: AbstractControl): ValidationErrors | null {
		return this.validator(control);
	}
}

@NgModule({
	declarations: [ValidatorDirective],
	exports: [ValidatorDirective]
})
export class ValidatorModule {}
```

## 2/3 Use the validator

Use the validator directive as `[validator]="myValidator"`, where `myValidator` returns the validation errors.

```ts:app.component.ts
import { Component } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Component({
	template: `
		<form #form="ngForm">
			<div ngModelGroup="person" [validator]="personValidator">
				<div>
					<label for="firstName">First Name</label>
					<input
						type="text"
						id="firstName"
						name="firstName"
						[(ngModel)]="model.firstName"
						[validator]="firstNameValidator('tim')"
					/>
				</div>

				<div>
					<label for="lastName">Last Name</label>
					<input type="text" id="lastName" name="lastName" [(ngModel)]="model.lastName" />
				</div>

				<div>
					<label for="score">Score</label>
					<input
						type="number"
						id="score"
						name="score"
						[(ngModel)]="model.score"
						[validator]="scoreValidator"
					/>
				</div>
			</div>
		</form>
	`
})
export class AppComponent {
	model = {
		firstName: '',
		lastName: '',
		score: null
	};

	firstNameValidator = (notEqual: string) => (
		control: AbstractControl
	): ValidationErrors | null => {
		if (control.value === notEqual) {
			return { notEqual: { comparisson: notEqual } };
		}
		return null;
	};

	personValidator = (control: AbstractControl): ValidationErrors | null => {
		let errors: ValidationErrors = {};
		if (control.value.firstName && control.value.firstName === control.value.lastName) {
			errors.firstAndLastNotEqual = true;
		}
		if (control.value.firstName === 'foo') {
			errors.firstNotFoo = true;
		}
		return Object.keys(errors).length === 0 ? null : errors;
	};

	scoreValidator = (control: AbstractControl): ValidationErrors | null => {
		// return Validators.compose([Validators.min(0), Validators.max(10)])(control);

		// short circuit
		return Validators.min(0)(control) || Validators.max(10)(control);
	};

	scoreValidatorCustom = (control: AbstractControl): ValidationErrors | null => {
		if (control.value > 10) {
			return { maxScore: 10 };
		}
		if (control.value < 0) {
			return { minScore: 0 };
		}

		return null;
	};
}
```

## 3/3 Extract the validator

Extract the validator to outside the component to make it easier to maintain.

```ts{5-7}:app.component.ts
import { personValidator } from '@domain/person';

@Component()
export class AppComponent {
	personValidator = (control: AbstractControl): ValidationErrors | null => {
		return validatePerson(control.value)
	};
}
```

## Demo

<iframe
	src="https://stackblitz.com/edit/angular-ivy-54k3yq?ctl=1&embed=1&file=src/app/app.component.ts"
	title="angular-validator-example"
></iframe>
