---
title: Angular Signal Forms Keeps Improving (v21.2)
slug: angular-signal-forms-keeps-improving
description: Taking a quick glance at the new features shipped in Angular Signal Forms. We'll cover provideSignalFormsConfig, focusBoundControl, the Submission API, and the formRoot directive, and why they are useful.
date: 2026-03-12
tags: Angular
series:
  name: 'Angular Signal Forms'
---

In the previous blog post ["Refactoring a form to a Signal Form"](../refactoring-a-form-to-a-signal-form/index.md), we refactored an existing Angular form to use the new Signal Forms feature. At the time, Signal Forms were still experimental, and we mentioned that there were some limitations and areas for improvement.

Since then, the Angular team has continued to improve Signal Forms. In this blog post, we will take a look at some of the improvements that were added in recent versions of Signal Forms (at the time of writing v21.2), including application-wide CSS classes, programmatic focus management, and a more structured submission flow.

## provideSignalFormsConfig

To start with, there's a new method [`provideSignalFormsConfig`](https://angular.dev/api/forms/signals/provideSignalFormsConfig) to configure the Signal Forms in an application.

Currently, this method allows us to set CSS classes through the `classes` option, which are applied to form controls based on their state.
This can be used to easily apply consistent styling across form controls, e.g. to re-apply the `ng-*` classes that were present in the previous version of Angular forms.

The `classes` option accepts an object where the keys are the CSS class names and the values are functions that receive the `FormField` to determine when to apply the class based on the form control's state. Of course, this is not limited to re-applying the `ng-*` classes. You can define any custom classes that you want to apply based on the form control's state.

```ts [title="app.config.ts"] [highlight="6-14"]
import { ApplicationConfig } from '@angular/core';
import { provideSignalFormsConfig } from '@angular/forms/signals';

export const appConfig: ApplicationConfig = {
	providers: [
		provideSignalFormsConfig({
			classes: {
				'ng-dirty': ({ state }) => state.dirty(),
				'ng-touched': ({ state }) => state.touched(),
				'ng-valid': ({ state }) => state.valid(),
				'ng-invalid': ({ state }) => state.invalid(),
				'custom-class': ({ state }) => state.touched() && state.invalid()
				...
			},
		}),
	],
};
```

### NG_STATUS_CLASSES

If you want to re-apply all the `ng-*` classes, Angular provides a predefined set of classes called [`NG_STATUS_CLASSES`](https://angular.dev/api/forms/signals/compat/NG_STATUS_CLASSES) that you can use with `provideSignalFormsConfig` to have the same behavior as the previous version of Angular forms. This is a great option for those who want to migrate to Signal Forms without losing the styling.

```ts [title="app.config.ts"] [highlight="8"]
import { ApplicationConfig } from '@angular/core';
import { provideSignalFormsConfig } from '@angular/forms/signals';
import { NG_STATUS_CLASSES } from '@angular/forms/signals/compat';

export const appConfig: ApplicationConfig = {
	providers: [
		provideSignalFormsConfig({
			classes: NG_STATUS_CLASSES,
		}),
	],
};
```

## focusBoundControl

Another improvement is the addition of the [`focusBoundControl` method](https://angular.dev/api/forms/signals/FieldState#focusBoundControl) on the `FormField` instance.

With `focusBoundControl`, we can programmatically focus the first form control (based on the DOM order) within a field tree.
This only works when the form control is already rendered in the DOM. If there are no elements to be focused, the method does nothing.

```ts
this.form().focusBoundControl();
```

We use this method to focus the first form control when a dialog is opened.

It also opens up new possibilities for improving the user experience, especially when it comes to form validation. For example, we can use this method to focus the first invalid form control.

To do that, we can use the `errorSummary` on the form instance to get a summary of all the errors in the form. Then, we can call `focusBoundControl` on the first field tree to focus the first invalid form control.

```ts
form().errorSummary()[0]?.fieldTree().focusBoundControl();
```

Please keep in mind that focusing an input automatically can cause accessibility issues, so ensure it enhances the user experience rather than detracting from it.

## Submission API

The third improvement that we will discuss in this blog post is the new Submission API. The Submission API provides a more structured way to handle form submissions, including both valid and invalid form states.

You can implement an asynchronous submission action using the `submission` option in the `form` function. The `submission` option accepts an object with an `action` property that is called when a **valid** form is submitted.

The `action` receives the form instance as an argument, which you can use to access the form value and perform any necessary operations, such as making an API call to submit the form data. This action marks all the fields in the form as touched, so you don't have to worry about that in your implementation. The `action` returns a `TreeValidationResult`, which can be used to set validation errors on the form based on the response from the server.

```ts
form(
	signal<FormSchema>({...}),
	(path) => {
		// Validation comes here
	},
	// 👇 New submission API
	{
		submission: {
			action: async (form) => {
				const formValue = form().value();

				try {
					await service.submit(formValue);
					form().value.set({...});
					form().reset();
					return undefined;
				} catch (error) {
					return {
						kind: 'server',
						message: error instanceof HttpErrorResponse
							? error.error.title
							: 'Something went wrong. Please try again.',
					} satisfies ValidationError.WithOptionalFieldTree;
				}
			},
		},
	},
);
```

The `submission` option also accepts an `onInvalid` property that is called when an **invalid** form is submitted. This can be used to handle any specific logic when the form is invalid. This is great in combination with the `focusBoundControl` method that we discussed earlier, as we can focus the first invalid form control when the form is submitted in an invalid state. `onInvalid` receives the form instance as an argument, and does not return anything.

```ts [highlight="26-28"]
form(
	signal<FormSchema>({...}),
	(path) => {
		// Validation comes here
	},
	// 👇 New submission API
	{
		submission: {
			action: async (form) => {
				const formValue = form().value();

				try {
					await service.submit(formValue);
					form().value.set({...});
					form().reset();
					return undefined;
				} catch (error) {
					return {
						kind: 'server',
						message: error instanceof HttpErrorResponse
							? error.error.title
							: 'Something went wrong. Please try again.',
					} satisfies ValidationError.WithOptionalFieldTree;
				}
			},
			onInvalid: (form) => {
				form().errorSummary()[0]?.fieldTree().focusBoundControl();
			},
		},
	},
);
```

But how do we trigger the submission action?
Instead of implementing a `submit` event handler, we now set the (new) `formRoot` directive on the form element to bind the form instance to the form in the template. This automatically handles the form submission (for example, when the user clicks a submit button or presses enter in an input field), and triggers the appropriate submission action based on the form's validity.

### formRoot directive

The `formRoot` directive also adds the `novalidate` attribute to the form element, which disables the browser's default validation.

```html [title="form.component.html"]
<form [formRoot]="form"></form>
```

The directive needs to be imported from the `@angular/forms/signals` package in the component's imports array.

```ts [title="form.component.ts"] [highlight="6"]
import { Component } from '@angular/core';
import { FormRoot } from '@angular/forms/signals';

@Component({
	selector: 'app-form',
	imports: [FormRoot],
	templateUrl: './form.component.html',
})
export class FormComponent {
	form = form(...);
}
```

## Conclusion

These improvements make Signal Forms feel more complete and practical to use in real applications. With `provideSignalFormsConfig`, `focusBoundControl`, the Submission API, and the `formRoot` directive, several rough edges from the earlier versions have already been smoothed out. Signal Forms is clearly evolving quickly, and these additions make it an even more compelling option if you want to build forms with Angular's signal-based APIs.
