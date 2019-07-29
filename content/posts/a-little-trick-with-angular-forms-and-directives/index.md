---
title: A little trick with Angular forms and directives 🃏
slug: a-little-trick-with-angular-forms-and-directives
description: Imagine having a form that you want to use at multiple places inside your application. The form will have the same layout but the validation will be different. In our case, this form is used in a procedure and in each step of the procedure the form gets more restrictive.s? Can you keep it [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)? We had this problem and came up with the following solution.
author: Tim Deschryver
date: 2019-07-29T16:28:00.000Z
tags: Angular, Forms
banner: ./images/banner.jpg
bannerCredit: Photo by [Julius Drost](https://unsplash.com/@juliusdrost) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
canonical_url: https://blog.angularindepth.com/a-little-trick-with-angular-forms-and-directives-137e2c53f25
---

Imagine having a form that you want to use at multiple places inside your application. The form will have the same layout but the validation will be different.

In our case, this form is used in a multi-step procedure and in each step of the procedure the form gets more restrictive. Can you keep it [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)? We had this problem and came up with the following solution.

### The form

As an example let's take a simple form, we have a person with a name, contact info, and allergies.
In the beginning, only the name is required. Later on, we're going to require the rest of the person's info.

```ts
@Component({
  selector: 'person',
  template: `
    <div [formGroup]="form">
      <div>
        <label>Name</label>
        <input type="text" formControlName="name" />
      </div>

      <div>
        <label>Contact info</label>
        <input type="text" formControlName="contactInfo" />
      </div>

      <div>
        <label>Allergies</label>
        <input type="text" formControlName="allergies" />
      </div>

      <strong>{{ form.valid ? 'valid' : 'invalid' }}</strong>
    </div>
  `,
})
export class PersonComponent {
  form = this.formBuilder.group({
    name: ['', Validators.required],
    contactInfo: [''],
    allergies: [''],
  })

  constructor(private formBuilder: FormBuilder) {}
}
```

By default, we make the person's name a required field.

### The directive

By using an Angular directive we can inject the component's instance, which allows us to access the form. In our case to alter the form's validation and making more fields required.

```ts
@Directive({
  selector: 'person[stage-one]',
})
export class StageOneDirective {
  constructor(host: PersonComponent) {
    host.form.get('contactInfo').setValidators([Validators.required])
  }
}
```

To be sure that the directive will have the `PersonComponent` injected, we have to make the directive specific for the person form. To accomplish this, we can use the component's selector as a prefix and append the directive's name to it, `person[stage-one]`. By doing this, you can only use the directive if the directive is added as an attribute on the person component.
Because the form on the person component is set to public, we can access the form from within our directive. If we have access to the form, we have access to the form fields and their validators.

We can use the same approach to create a stricter validation.

```ts
@Directive({
  selector: 'person[stage-two]',
})
export class StageTwoDirective {
  constructor(host: PersonComponent) {
    host.form.get('contactInfo').setValidators([Validators.required])
    host.form.get('allergies').setValidators([Validators.required])
  }
}
```

### Usage

To make this small example complete, this is how you would use the person component together with or without a directive in another component.

```html
<!-- Only the name is required -->
<person></person>

<!-- The name and the contactInfo are required -->
<person stage-one></person>

<!-- All fields are required -->
<person stage-two></person>
```

> I find this a clean solution in combination with Control Value Accessors, as discussed in [Working with Angular forms in an enterprise environment](./working-with-angular-forms-in-an-enterprise-environment)

Play around with this example in the following [blitz](https://stackblitz.com/edit/angular-forms-directive-trick).
