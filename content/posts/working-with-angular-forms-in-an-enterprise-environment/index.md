---
title: Working with Angular forms in an enterprise environment
slug: working-with-angular-forms-in-an-enterprise-environment
description: At our company we struggled with Angular Forms at the start. This is because we dived in head first, without talking about how we would want to use it throughout out projects. This post shows how we're currently using Angular Forms to be more productive.
author: Tim Deschryver
date: 2019-04-23T08:00:00.000Z
tags: Angular, Forms, Enterprise, Angular Forms, Reactive Forms
banner: ./images/banner.jpg
bannerCredit: Photo by [Will O](https://unsplash.com/@blnk_kanvas) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
canonical_url: https://blog.angularindepth.com/working-with-angular-forms-in-an-enterprise-environment-8279df4ae6fd
tweet_id: '1126070177098080256'
---

At our company we struggled with Angular Forms at the start. This is because we dived in head first, without talking about how we would want to use it throughout out projects. This post shows how we're currently using Angular Forms to be more productive.

## A bit of background

Anyone that has worked on projects of caliber in the past, will know that there is a high probability that these applications will contain large amounts of complex forms. We were not an exception, we're working in a medical domain to make the administration of clients easier. We come into contact with forms on a daily basis, simple forms and more complex forms.

As a newly formed team starting on a new project we agreed that we would use [Reactive Forms](https://angular.io/guide/reactive-forms), besides that we hadn’t made agreements around forms and form validation. After a few sprints we started to notice that we were writing a lot of (the same) code, both Angular as HTML. At the same time we received some design feedback and noticed that we had to touch to much code to get everything right. This is where we started to think that there should be a better way of dealing with forms.

## Input form fields

We starting writing input form fields containing all of the orchestration code that is responsible for the field’s behavior. The first iteration of these fields consisted of passing the form control and form group as input to these controls. While this worked at the beginning, it wasn’t great. We always had to be reminded to pass down the form group to the form field as this wasn’t the default “Angular way”. For some of the controls we ended up with an internal form inside the form field component that had to be kept in sync with the main component, with all the problems and nasty code that came with it.

After some iterations we learned about [Control Value Accessor](https://angular.io/api/forms/ControlValueAccessor)s and this opened up possibilities together with [NgControl](https://angular.io/api/forms/NgControl). From the Angular docs we can see that a CVA has the following API:

```ts
interface ControlValueAccessor {
  /**
  * Writes a new value to the element.
  *
  * This method is called by the forms API to write to the view when programmatic changes from model to view are requested.
  */
  writeValue(obj: any): void

  /**
  * Registers a callback function that is called when the control's value changes in the UI.
  *
  * This method is called by the forms API on initialization to update the form model when values propagate from the view to the model.
  * When implementing the `registerOnChange` method in your own value accessor, save the given function so your class calls it at the appropriate time.
  */
  registerOnChange(fn: any): void

  /**
  * Registers a callback function is called by the forms API on initialization to update the form model on blur.
  *
  * When implementing `registerOnTouched` in your own value accessor, save the given function so your class calls it when the control should be considered blurred or "touched".
  */
  registerOnTouched(fn: any): void

  /**
  * Function that is called by the forms API when the control status changes to or from 'DISABLED'. Depending on the status, it enables or disables the appropriate DOM element.
  */
  setDisabledState(isDisabled: boolean)?: void
}
```

This combination allowed us to use our custom form fields just as we would have previously but with more functionality inside of them. The code also looked a lot cleaner. Think of a standardized behavior and visualization for developers as well as for our users, e.g. form validation, and binding the label to the correct input field. For each type of control we created our own implementation and ended up with an abstract class `BaseFormField` , containing generic code that we needed in each of our form fields.

```ts
export abstract class BaseFormField implements ControlValueAccessor, DoCheck {
  @Input() label: string
  @Input() ariaLabel: string
  // giving the possibility to override the default error messages
  @Input() errorMessages: { [key: string]: string } = {}

  @Output() change = new EventEmitter<any>()

  // generate a unique id for each control
  id = generateControlId()

  value: any
  text: string
  disabled = false
  required = false

  onChange = (_value: any) => {}
  onTouched = () => {}

  constructor(@Optional() @Self() public controlDir: NgControl) {
    // bind the CVA to our control
    controlDir.valueAccessor = this
  }

  ngDoCheck() {
    if (this.controlDir.control instanceof FormControl) {
      // check if this field is required or not to display a 'required label'
      const validator =
        this.controlDir.control.validator &&
        this.controlDir.control.validator(new FormControl(''))
      this.required =
        Boolean(validator && validator.hasOwnProperty('required')) ||
        Boolean(validator && validator.hasOwnProperty('selectedCount'))
    }
  }

  get hasErrors() {
    return (
      this.controlDir.control &&
      this.controlDir.control.touched &&
      this.controlDir.control.errors
    )
  }

  // implementation of `ControlValueAccessor`
  writeValue(value: any): void {
    this.value = value
    if (typeof value === 'string') {
      this.text = value
    }

    this.onChange(this.value)
    this.change.emit(this.value)
  }

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled
  }
}
```

As you can see, we're also using these form field components to implement a generic behavior across form fields:

- We bind the label to the correct form field, we do this by generating a unique id for each form field
- When a form field is optional, we append it to the form field's label
- We show validation messages in a generic way, with the option to override the default validation messages when needed
- When a form is disabled, we disable the form field

An implementation of a checkbox list looks as follows:

```ts
@Component({
  selector: 'checkbox-list',
  template: `
    <div class="form-part" [class.field-error]="hasErrors">
      <label *ngIf="label"
        >{{ label }}<small *ngIf="!required"> (Optional)</small></label
      >
      <div class="checkbox-list" [ngClass]="alignment">
        <div class="checkbox-placeholder" *ngFor="let item of items">
          <mat-checkbox
            [checked]="isChecked(item.value)"
            (change)="change($event, item.value)"
            (blur)="onTouched()"
            [disabled]="disabled"
            >{{ item.label }}
          </mat-checkbox>
        </div>
      </div>
      <error-message-container
        [control]="controlDir.control"
        [errorMessages]="errorMessages"
      >
      </error-message-container>
    </div>
  `,
})
export class CheckboxListComponent extends BaseFormField {
  @Input() items: Item[]
  @Input() alignment: 'horizontal' | 'vertical' = 'horizontal'

  isChecked(value: any) {
    return (
      this.controlDir.control &&
      this.controlDir.control.value &&
      this.controlDir.control.value.includes(value)
    )
  }

  change(event: MatCheckboxChange, value: any) {
    if (event.checked) {
      this.writeValue((this.value || []).concat(value))
    } else {
      this.writeValue(this.value.filter((v: any) => v !== value))
    }
  }
}
```

The checkbox list field component can be used like a normal input field:

```html
<checkbox-list
  formControlName="allergies"
  label="Allergies"
  alignment="horizontal"
  [items]="allergies"
></checkbox-list>
```

## Form directives

By following the practice above, it allows us to extend these controls with custom directives. For example if we want to populate a radio list or a select box, we can simply assign values to our items.

```ts
@Directive({
  selector: 'radio-list[relation-list]',
})
export class RadioRelationDirective {
  constructor(private host: RadioListComponent) {
    this.host.items = [
      { label: 'Partner', value: Relation.Partner },
      { label: 'Child', value: Relation.Child },
      { label: 'Parent', value: Relation.Parent },
    ]
  }
}

@Directive({
  selector: 'select-field[relation-list]',
})
export class SelectRelationDirective {
  constructor(private host: SelectFieldComponent) {
    this.host.items = [
      { label: 'Partner', value: Relation.Partner },
      { label: 'Child', value: Relation.Child },
      { label: 'Parent', value: Relation.Parent },
    ]
  }
}
```

## Super-charged Control Value Accessor’s

CVA’s allows us to create common reusable components, think of a generic person’s component asking for personal information. Before we learned about CVA’s we implemented these control multiple times, with all drawbacks included. More than less whenever a new ticket appeared to add a new field, tweak the validation, or to change the behavior of a form field we forgot to update a form on another location. By using a CVA, this can be prevented. It allows us to define the form template and to define the form group with validation built-in. This is nothing special since this can also be done with a default component. The difference lays inside the parent component, where we can use the CVA as a normal form field by just defining it inside the form group. In other words, we can now create a part of a form and just use it as a normal form field. For example if we would take a very simple form asking for the person’s first and last name, the implementation looks as follows:

```ts
@Component({
  selector: 'person-simple',
  template: `
    <div [formGroup]="form" class="form">
      <form-field
        formControlName="firstName"
        label="First name"
      ></new-form-field>
      <form-field
        formControlName="name"
        label="Name"
      ></new-form-field>
    </div>
  `,
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PersonSimpleComponent),
      multi: true,
    },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PersonSimpleComponent),
      multi: true,
    },
  ],
})
export class PersonSimpleComponent
  implements OnDestroy, ControlValueAccessor, Validator {
  destroy = new Subject()
  form = this.fb.group({
    name: [null, [Validators.required, Validators.minLength(2)]],
    firstName: [null, [Validators.required, Validators.minLength(2)]],
  })
  onTouched = () => {}

  constructor(private fb: FormBuilder) {}

  ngOnDestroy() {
    this.destroy.next()
    this.destroy.complete()
  }

  writeValue(value: any) {
    if (value) {
      this.form.setValue(value, { emitEvent: false })
    }
  }

  registerOnChange(fn: any) {
    this.form.valueChanges.pipe(takeUntil(this.destroy)).subscribe(fn)
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn
  }

  setDisabledState(disabled: boolean) {
    disabled ? this.form.disable() : this.form.enable()
  }

  validate(control: AbstractControl): ValidationErrors | null {
    if (control.touched) {
      ValidationUtils.touchAllFormElements(this.form)
    }

    if (this.form.valid) {
      return null
    }

    return {
      'person-error': {
        value: this.form.value,
      },
    }
  }
}
```

This allows us to use this component inside our parent form::

```html
<person-simple formControlName="person1"></person-simple>
<person-simple formControlName="person2"></person-simple>
```

These two persons are defined in the parent’s form group as form controls:

```ts
form = this.fb.group({
  person1: [null],
  person2: [null],
})
```

Resulting in the following form value:

```json
{
  "person1": {
    "name": "Sarah",
    "firstName": "Smith"
  },
  "person2": {
    "name": "John",
    "firstName": "Smith"
  }
}
```

## Form validation

There was already a glance visible about validation in the previous code snippets. Here again, we felt the pain of writing and maintaining the same code every time we had to implement form validation. That’s why we created an error container, which sole responsibility is to show error messages.

```ts
@Component({
  selector: 'error-message-container',
  template: `
    <div
      class="error-message"
      [style.visibility]="control.touched ? 'visible' : 'hidden'"
    >
      {{ control.errors | humanizeMessages: errorMessages }}
    </div>
  `,
})
export class ErrorMessageContainerComponent {
  @Input() control: FormControl
  @Input() errorMessages?: { [key: string]: string }
}
```

We also have a `humanizeFormMessages` pipe to map the error to a human friendly message. We inject `FormMessages`, containing the default messages. An enterprise environment wouldn't be an enterprise environment if there are no exceptions to the default behavior, that's why we made it possible to override the default messages with case-specific messages.

```ts
@Pipe({ name: 'humanizeFormMessages' })
export class HumanizeFormMessagesPipe implements PipeTransform {
  constructor(@Inject(FormMessages) private messages) {}

  transform(
    validationErrors: ValidationErrors,
    overriddenMessages: { [key: string]: string },
  ) {
    if (!validationErrors) {
      return ''
    }

    // Allow the possibility to override messages
    const messages = {
      ...this.messages,
      ...overriddenMessages,
    }

    const messageKey = Object.keys(validationErrors)[0]
    const getMessage = messages[messageKey]
    const message = getMessage
      ? getMessage(validationErrors[messageKey])
      : 'Invalid field'
    return message
  }
}
```

## Creating wizards with `FormGroupDirective`

To make big wizard forms more manageable we chopped them up into multiple smaller steps. For every step in in the wizard we create its own isolated form. The wizard form is made up by stitching up all these little forms together. This improves the maintainability and the testing capabilities. By having this loose coupling it becomes easier to make some modifications to the forms, you have the option to re-use the step forms in different screen e.g. using the form in the wizard and using the form as a stand-a-lone form.

To implement this, use the [FormGroupDirective](https://angular.io/api/forms/FormGroupDirective) as [ControlContainer](https://angular.io/api/forms/ControlContainer) and provide them via [viewProviders](https://angular.io/api/core/Component#viewproviders) (not via `providers`). We can now inject the `FormGroupDirective` inside the component and append the child form to its parent form, in our case this is the wizard.

```ts
@Component({
  selector: 'child-form',
  templateUrl: './child-form.component.html',
  styleUrls: ['./child-form.component.scss'],
  viewProviders: [
    { provide: ControlContainer, useExisting: FormGroupDirective },
  ],
})
export class ChildFormComponent implements OnInit {
  form = this.fb.group({
    firstName: [null, [Validators.required]],
    lastName: [null, [Validators.required]],
  })

  constructor(
    private parentForm: FormGroupDirective,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.parentForm.form.addControl('person', this.form)
  }
}
```

## Testing forms

To test our forms we’re using [@angular-extensions/testing-library](https://github.com/testing-library/angular-testing-library), which is an Angular wrapper around [dom-testing-library](https://github.com/testing-library/angular-testing-library). This prevents us from testing implementation details and test our forms the way our users would use them.

We navigate to the form fields by using the form labels, we submit forms by clicking on the submit button. We don't care about the methods from the form component, we care about what our users see.

```ts
test('login form submits using the component syntax', async () => {
  const fakeUser = { username: 'jackiechan', password: 'hiya! 🥋' }
  const login = {
    emit: jest.fn(),
  }

  const { getByLabelText, getByText, input } = await render(
    LoginFormComponent,
    {
      componentProperties: { login },
      imports: [ReactiveFormsModule],
    },
  )

  input(getByLabelText('Username'), {
    target: {
      value: '',
    },
  })

  // If the text is not found the test will fail
  getByText('Username is required')

  input(getByLabelText('Username'), {
    target: {
      value: fakeUser.username,
    },
  })

  input(getByLabelText('Password'), {
    target: {
      value: fakeUser.password,
    },
  })

  submit(getByText('Create new account'))

  expect(login.emit).toHaveBeenCalledTimes(1)
  expect(login.emit).toHaveBeenCalledWith(fakeUser)
})
```

## Some of the resources that helped us to tackle this problem

- [Angular Forms – AngularConnect 2017](https://www.youtube.com/watch?v=CD_t3m2WMM8&) by [Kara Erickson](https://twitter.com/karaforthewin)
- [Never again be confused when implementing ControlValueAccessor in Angular forms](https://blog.angularindepth.com/never-again-be-confused-when-implementing-controlvalueaccessor-in-angular-forms-93b9eee9ee83) by [Max Koretskyi](https://twitter.com/maxkoretskyi)
- [Make Your Angular Form’s Error Messages Magically Appear](https://netbasal.com/make-your-angular-forms-error-messages-magically-appear-1e32350b7fa5) by [Netanel Basal](https://twitter.com/NetanelBasal)
- [Angular: Nested template driven form](https://medium.com/@a.yurich.zuev/angular-nested-template-driven-form-4a3de2042475) by [Alexey Zuev](https://twitter.com/yurzui)
- [Unleash the power 💪of Forms with Angular’s Reactive Forms](https://blog.angularindepth.com/unleash-the-power-of-forms-with-angulars-reactive-forms-d6be5918f408) by [Siddharth Ajmera](https://twitter.com/SiddAjmera)
- [Dive into Reactive Forms](https://blog.angularindepth.com/dive-into-reactive-forms-cfc9adbb4467) by [Reactive Fox](https://twitter.com/thekiba_io)
- [The Control Value Accessor  -  Like A Wormhole In Space For Your Forms, Only More Useful](https://www.youtube.com/watch?v=kVbLSN0AW-Y) by [Jennifer Wadella ](https://twitter.com/likeOMGitsFEDAY)
