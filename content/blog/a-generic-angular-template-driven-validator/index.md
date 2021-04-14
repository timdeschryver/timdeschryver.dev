---
title: A generic Angular template-driven validator
slug: a-generic-angular-template-driven-validator
description: One validator to rule them all
author: Tim Deschryver
date: 2021-04-14
tags: Angular, Forms, Template Driven
banner: ./images/banner.jpg
bannerCredit: Photo by [Ivan Diaz](https://unsplash.com/@ivvndiaz) on [Unsplash](https://unsplash.com)
published: true
---

A common complaint when it comes to creating custom validators with Angular template-driven forms is the boilerplate that one has to write before the validator can be used.

While I partly agree with that remark, it also has a clear separation of concerns because it adds a layer to validate the model.
For the complex models, I take the opportunity to use the validator in a way that the validator is acting as a separate layer, containing the business rules.

The part where I do agree is that you have to touch (and review) multiple files to create and register the directive.
The extra overhead (even if it's only a small effort) to add the validator directive to an Angular module is also often forgotten, which leads to frustrations.

But as we'll see, this doesn't have to be the case.
We can create one validator to rule them all.

Let's simply call this validator `ValidatorDirective`, and all this directive does is accept a callback to a method that returns the validation errors.

```ts{9-13}:validator.directive.ts
import { Directive, Input } from '@angular/core';
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
```

With the `ValidatorDirective` we can now validate a form while defining inline validators.
For example, to validate a single `ngModel`, we create the validator in the component.
The validator (`scoreValidator`) receives the control and returns the validation errors, just like the `validate` method from the `Validator` interface.

```ts
@Component()
export class Component {
	scoreValidator = (control: AbstractControl): ValidationErrors | null => {
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

To use the inline validator in the template, you assign the `validator` attribute (this is the selector from the `ValidatorDirective` directive) to the validate method (`scoreValidator`) .

```html
<input type="number" name="score" ngModel [validator]="validateScore" />
```

Instead of having to write all the validators manually, you can also invoke the built-in Angular validators, or invoke your custom validators.

```ts
@Component()
export class Component {
	scoreValidator = (control: AbstractControl): ValidationErrors | null => {
		// invoke multiple validators with `compose`
		// return Validators.compose([Validators.min(0), Validators.max(10)])(control);

		// it's also possible to short-circuit the validation
		return Validators.min(0)(control) || Validators.max(10)(control);
	};
}
```

This is quick and easy for simple one-off validators.

Because validating a form group or even an entire form might get complex, it's a best practice to extract the validation rules outside of the component into its own method or class.
This keeps the component small and simple, and makes the validation logic easier to test.

To validate a `ngModelGroup` you can reuse the same validator directive.

```html
<div ngModelGroup="person" [validator]="personValidator">
	<!-- imagine multiple form fields here -->
</div>
```

```ts
@Component()
export class Component {
	personValidator = (control: AbstractControl): ValidationErrors | null => {
		return validatePerson(control.value);
	};
}
```

Note that I'm using the arrow syntax while declaring these validators.
I do this to scope the method to the component class, instead of the directive class.
This allows me to use other class properties within the validator method.

## Conclusion

We can eliminate some of the "boilerplate" 🙊 by creating one generic validator directive that accepts a callback to validate a form model.
This allows us to create inline validators within components. While this can be quick and easy for simple validations, I prefer to extract the complex validators into their own layer.

When the validation logic lives on its own (and not in a directive or in the component), it also doesn't bind the business rules to an Angular-specific layer.

The only downside to using the generic validator directive is that you can't [revalidate the validator](/blog/a-practical-guide-to-angular-template-driven-forms#revalidate-custom-validators).

### Demo

<iframe src="https://stackblitz.com/edit/angular-ivy-54k3yq?ctl=1&embed=1&file=src/app/app.component.ts" title="angular-validator-example"
></iframe>
