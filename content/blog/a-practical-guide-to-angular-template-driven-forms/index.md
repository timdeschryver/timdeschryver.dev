---
title: A practical guide to Angular Template-Driven Forms
slug: a-practical-guide-to-angular-template-driven-forms
description: The things I looked up while learning the template-driven way
author: Tim Deschryver
date: 2021-03-10
tags: Angular, Guide, Forms
banner: ./images/banner.jpg
bannerCredit: Photo by [Thomas Renaud](https://unsplash.com/@lafabriquedesplis) on [Unsplash](https://unsplash.com)
published: true
---

In Angular, we have two ways to build forms, which are template-driven and reactive.
While both ways are different to use, they're both built on top of a common Forms API.

From the start of my journey with Angular, I've always used Reactive Forms.
That's because reactive forms are recommended (sold as more scalable, reusable, and testable) in the [Angular docs](https://angular.io/guide/forms-overview#choosing-an-approach) and because most of the content created by the community is focused on using the reactive way to create forms in Angular.

Until recently, I never looked at template-driven forms. But due to circumstances that have occurred in the same week, I've decided to get more familiar with creating template-driven forms.

The first circumstance was returning to a complex form after a couple of months and having struggles with how the form was set up. Due to these struggles, I [experimented with building a layer on top of the Reactive Forms API](/blog/a-new-way-to-validate-angular-forms). While at first, I was pretty happy with the design, the solution was getting worse with every addition. Now that I look back at that proof of concept, I realize that I was building a poor-mans API compared to the API that template-driven forms already provide.

The second circumstance was that [Ward Bell](https://twitter.com/wardbell) was advocating for template-driven forms on a [Forms Episode](https://www.spreaker.com/user/ng-conf/e047-forms-series-episode-2-template-dri) of the [The Angular Show](https://twitter.com/AngularShow) podcast.

Based on Ward's experience, the examples that were talked about on the podcast (alongside a [StackBlitz demo](https://stackblitz.com/edit/angular-kkatri)), and my findings while I was attempting to build a layer on top of the Angular Forms API, I'm now exploring and discovering the benefits of the template-driven way.

In this post, I'd like to share my experience with some practical examples.
The code used in this guide can be found on [GitHub](https://github.com/timdeschryver/angular-forms-guide).

> This guide is a Work In Process. During the next weeks, I'll probably cover validation, nested forms, how to test template-driven forms, control value accessors, and dynamic forms. If you have anything you want to see here or if you have suggestions feel free to reach out on [Twitter](https://timdeschryver.dev/twitter) or [create an issue on GitHub](https://github.com/timdeschryver/angular-forms-guide/issues/new).

## Creating a form

If this is your first time building a template-driven form or if you just need a quick refresher, I would suggest starting by reading the [Angular docs](https://angular.io/guide/forms#building-a-template-driven-form). For a more in-depth look at how template-driven forms behave and react, the Angular docs also got you covered at [Data flow in template-driven forms](https://angular.io/guide/forms-overview#data-flow-in-template-driven-forms).

A brief recap of the docs is that the HTML `form` entity creates a new [`NgForm`](https://angular.io/api/forms/NgForm) instance (this is a [built-in Angular directive](https://github.com/angular/angular/blob/master/packages/forms/src/directives/ng_form.ts), which uses `form` as the directive's selector). Inside the form, the [`ngModel` directive](https://angular.io/api/forms/NgModel) is used to register form controls to the form instance (under the hood `ngModel` creates a new [`FormControl`](https://angular.io/api/forms/FormControl), as we can see in the [source code](https://github.com/angular/angular/blob/master/packages/forms/src/directives/ng_model.ts#L268)). While adding the `ngModel` attribute to a control, it's important to also assign a value to the `name` attribute to correctly build up the form tree. The value given to the `name` attribute is the property name inside the template model, with the form control instance as the value.

In code, this looks like this.

```ts
@Component({
  selector: 'app-component',
  template: `
    <form>
      <label for="text">A label</label>
      <input type="text" id="text" name="formText" ngModel />
    </form>
  `,
})
export class AppComponent {}
```

> While the `for` attribute of the label and the `id` attribute of the input control does not affect the Angular form, it's important to link the label to the control in order to make the form [accessible](https://www.w3.org/WAI/tutorials/forms/labels/).

This form results in the following form value.

```json
{
  "formText": ""
}
```

To unlock the full potential of template-driven forms, we use [two-way binding](https://angular.io/guide/two-way-binding) to bind the template form to a TypeScript (data) model. The TypeScript model is used to process a form submission when a user submits the form, for example, to make a request to a backend. The model can be sent to the backend in its current state, or it can also be translated to a model that the backend API expects.

Because the TypeScript model is coupled to the template model, every change made to the model will also change the value of the template model and visa-versa.

To create a two-way binding we use the banana in a box syntax (`[()]`), the form now looks like this.

```ts{6,11-13}
@Component({
  selector: 'app-component',
  template: `
    <form>
      <label for="text">Text</label>
      <input type="text" id="text" name="formText" [(ngModel)]="model.text" />
    </form>
  `,
})
export class AppComponent {
  model = {
    text: null,
  }
}
```

The above template and model result in the following structures for the two models.
Notice the difference between the two property names:

- `formText` for the template model, because the input has `formText` as the name of the control
- and `text` for the TypeScript model, because the model has the `text` property

<table>
<thead>
<th style="vertical-align: top; width: 1%;">
Template Form Value
</th>
<th style="vertical-align: top; width: 1%;">
TypeScript Model Value
</th>
</thead>
<tr style="background: inherit;">
<td style="vertical-align: top; width: 1%;">
<pre>
{
    formText: 'some text value here'
}
</pre>
</td>
<td style="vertical-align: top; ; width: 1%;">
<pre>
{
    text: 'some text value here'
}
</pre>
</td>
</tr>
</table>

Because the structure of the template model and the TypeScript model doesn't need to match, it unlocks significant advantages in comparison to reactive forms, which we will address later in the next sections.

### Form Building Blocks

First, we need some basic controls before we're able to construct a usable form.
In this section, we'll take a look at how we can create the most common form controls and how its value translates to the two models look like.

#### Input Controls

The obvious and the easiest controls are the native input controls, these controls are single HTML elements that have a value. To bind the control to the TypeScript model, we can just use the `ngModel` directive.

Angular makes things easier for us by already parsing the value of the input control to its corresponding type. Angular does this with a [couple of directives](https://github.com/angular/angular/tree/master/packages/forms/src/directives), more specifically with control value accessors. An example of this is the number input control, the value of the number control (a string) is [parsed](https://github.com/angular/angular/blob/master/packages/forms/src/directives/number_value_accessor.ts#L81) to a number by the number value accessor.

```ts
@Component({
  selector: 'app-component',
  template: `
    <form>
      <label for="text">Text</label>
      <input type="text" id="text" name="formText" [(ngModel)]="model.text" />

      <label for="number">Number</label>
      <input
        type="number"
        id="number"
        name="formNumber"
        [(ngModel)]="model.number"
      />
    </form>
  `,
})
export class AppComponent {
  model = {
    text: null,
    number: null,
  }
}
```

<table>
<thead>
<th style="vertical-align: top; width: 1%;">
Template Form Value
</th>
<th style="vertical-align: top; width: 1%;">
TypeScript Model Value
</th>
</thead>
<tr style="background: inherit;">
<td style="vertical-align: top; width: 1%;">
<pre>
{
    formText: 'hello',
    formNumber: 5
}
</pre>
</td>
<td style="vertical-align: top; ; width: 1%;">
<pre>
{
    text: 'hello',
    number: 5
}
</pre>
</td>
</tr>
</table>

#### Select Element

While the HTML select element doesn't have a value attribute, we can still use the `ngModel` directive to bind the select element to the TypeScript model.

To assign values to the option elements, the `value` attribute is used on the options.
These options can be static or can be iterated over by using the `*ngFor` directive.

The value of the selected option is used as the value of the TypeScript model.
When the TypeScript model has an initial value or when it's reassigned a new value, the corresponding option will be selected automatically in the template.

```ts
@Component({
  selector: 'app-component',
  template: `
    <label for="select">Select</label>
    <select id="select" name="formSelect" [(ngModel)]="model.select">
      <option [value]="null">Default Option</option>
      <option *ngFor="let option of options" [value]="option.value">
        {{ option.label }}
      </option>
    </select>
  `,
})
export class AppComponent {
  model = {
    select: null,
  }

  options = [
    {
      value: 1,
      label: 'Option One',
    },
    {
      value: 2,
      label: 'Option Two',
    },
    {
      value: 3,
      label: 'Option Three',
    },
  ]
}
```

<table>
<thead>
<th style="vertical-align: top; width: 1%;">
Template Form Value
</th>
<th style="vertical-align: top; width: 1%;">
TypeScript Model Value
</th>
</thead>
<tr style="background: inherit;">
<td style="vertical-align: top; width: 1%;">
<pre>
{
    formSelect: 2
}
</pre>
</td>
<td style="vertical-align: top; ; width: 1%;">
<pre>
{
    select: 2
}
</pre>
</td>
</tr>
</table>

#### Checkbox List

For my checkbox lists I like to include the checkbox items in the TypeScript model, and add a `selected` property on the items to know which checkboxes are selected (checked). In the template, this `selected` property is bound to a checkbox control with the `ngModel` directive.

All checkbox elements within the same group must have unique names, otherwise, all the control will share the same form control instance, and thus the same value.

```ts
@Component({
  selector: 'app-component',
  template: `
    <label>Checkbox list</label>
    <div *ngFor="let check of model.checks">
      <input
        type="checkbox"
        [id]="'formCheckbox-' + check.id"
        [name]="'formCheckbox-' + check.id"
        [(ngModel)]="check.selected"
      />
      <label [for]="'formCheckbox-' + check.id">{{ check.label }}</label>
    </div>
  `,
})
export class AppComponent {
  model = {
    checks: [
      {
        id: 'check-one',
        label: 'Check One',
        selected: false,
      },
      {
        id: 'check-two',
        label: 'Check Two',
        selected: false,
      },
      {
        id: 'check-three',
        label: 'Check Three',
        selected: false,
      },
    ],
  }
}
```

<table>
<thead>
<th style="vertical-align: top; width: 1%;">
Template Form Value
</th>
<th style="vertical-align: top; width: 1%;">
TypeScript Model Value
</th>
</thead>
<tr style="background: inherit;">
<td style="vertical-align: top; width: 1%;">
<pre>
{
    formCheckbox-check-one: false,
    formCheckbox-check-two: true,
    formCheckbox-check-three: true,
}
</pre>
</td>
<td style="vertical-align: top; ; width: 1%;">
<pre>
{
    checks: [
        {
            id: 'check-one',
            label: 'Check One',
            selected: false
        },
        {
            id: 'check-two',
            label: 'Check Two',
            selected: true
        },
        {
            id: 'check-three',
            label: 'Check Three',
            selected: true
        }
    ]
}
</pre>
</td>
</tr>
</table>

In the example above, the checkbox values are represented in a flat object structure.
While this is enough for the simple cases, we can also reorganize the structure of the template model by creating nested objects.
Because the template model doesn't need to reflect the TypeScript model, it allows us to be flexible with the structures we use to shape the form.

This allows us as developers to model the template as efficiently as possible for certain use-cases.
I find it easier to group the checkboxes in a nested hierarchy to make it effortless to validate the checkbox group, e.g. when at least one checkbox needs to be checked.

The snippet below uses the [`ngModelGroup` directive](https://angular.io/api/forms/NgModelGroup) to group the checkboxes. Behind the scenes, Angular creates a new [`FormGroup`](https://angular.io/api/forms/FormGroup) instance and adds a new leaf in the template model with the given name.
This change doesn't impact the TypeScript model and is purely a change to the template model to make it easier to use.

```ts{5,9}
@Component({
  selector: 'app-component',
  template: `
    <label>Checkbox list</label>
    <div *ngFor="let check of model.checks" ngModelGroup="formCheckbox">
      <input
        type="checkbox"
        [id]="'formCheckbox-' + check.id"
        [name]="check.id"
        [(ngModel)]="check.selected"
      />
      <label [for]="'formCheckbox-' + check.id">{{ check.label }}</label>
    </div>
  `,
})
export class AppComponent {
  model = {
    checks: [
      {
        id: 'check-one',
        label: 'Check One',
        selected: false,
      },
      {
        id: 'check-two',
        label: 'Check Two',
        selected: false,
      },
      {
        id: 'check-three',
        label: 'Check Three',
        selected: false,
      },
    ],
  }
}
```

This change leads to the following structures of the template model and the TypeScript model.

<table>
<thead>
<th style="vertical-align: top; width: 1%;">
Template Form Value
</th>
<th style="vertical-align: top; width: 1%;">
TypeScript Model Value
</th>
</thead>
<tr style="background: inherit;">
<td style="vertical-align: top; width: 1%;">
<pre>
{
    formCheckbox: {
        check-one: false,
        check-two: true,
        check-three: true
    }
}
</pre>
</td>
<td style="vertical-align: top; ; width: 1%;">
<pre>
{
    checks: [
        {
            id: 'check-one',
            label: 'Check One',
            selected: false
        },
        {
            id: 'check-two',
            label: 'Check Two',
            selected: true
        },
        {
            id: 'check-three',
            label: 'Check Three',
            selected: true
        }
    ]
}
</pre>
</td>
</tr>
</table>

#### Radio Group

A radio group is similar to a checkbox list. The difference is that in contrast to a checkbox list, radio buttons that belong together need to have the same `name`. If this is not the case, the form creates a new form control instance for each radio button with a different name. Because the radio buttons are linked to the same TypeScript model value, the radio buttons all have the same value and will all be updated when another radio button is selected. While the TypeScript model will have the correct value, this might be confusing on the side of the template model and might cause problems in the future when it needs to be validated.

```ts
@Component({
  selector: 'app-component',
  template: `
    <label>Radio group</label>
    <div>
      <input
        type="radio"
        id="radio-1"
        name="formRadioGroup"
        [value]="1"
        [(ngModel)]="model.radio"
      />
      <label for="radio-1">Radio One</label>
    </div>

    <div>
      <input
        type="radio"
        id="radio-2"
        name="formRadioGroup"
        [value]="2"
        [(ngModel)]="model.radio"
      />
      <label for="radio-2">Radio Two</label>
    </div>

    <div>
      <input
        type="radio"
        id="radio-3"
        name="formRadioGroup"
        [value]="3"
        [(ngModel)]="model.radio"
      />
      <label for="radio-3">Radio Three</label>
    </div>
  `,
})
export class AppComponent {
  model = {
    radio: null,
  }
}
```

<table>
<thead>
<th style="vertical-align: top; width: 1%;">
Template Form Value
</th>
<th style="vertical-align: top; width: 1%;">
TypeScript Model Value
</th>
</thead>
<tr style="background: inherit;">
<td style="vertical-align: top; width: 1%;">
<pre>
{
    formRadioGroup: 1
}
</pre>
</td>
<td style="vertical-align: top; ; width: 1%;">
<pre>
{
    radio: 1
}
</pre>
</td>
</tr>
</table>

### Forms Controls Example

To play around with the form controls and see how changes reflect on the template model and the TypeScript model, you can take a look at the following StackBlitz.

<iframe src="https://stackblitz.com/github/timdeschryver/angular-forms-guide/tree/72ef36ff10cdf972736a7786c527b24464d74ff5?ctl=1&embed=1" title="angular-forms-guide-input-types" loading="lazy"></iframe>

The code used in this guide can be found on [GitHub](https://github.com/timdeschryver/angular-forms-guide).

> This guide is a Work In Process. During the next weeks, I'll probably cover validation, nested forms, how to test template-driven forms, control value accessors, and dynamic forms. If you have anything you want to see here or if you have suggestions feel free to reach out on [Twitter](https://timdeschryver.dev/twitter) or [create an issue on GitHub](https://github.com/timdeschryver/angular-forms-guide/issues/new).
