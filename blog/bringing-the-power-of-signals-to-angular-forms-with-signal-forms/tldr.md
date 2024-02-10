To use Signal Forms in your project, run the following command.

```bash
npm install ng-signal-forms
```

This is an example on how to build a form with Signal Forms.
If you want to play around with this example, take a look at [GitHub repository](https://github.com/timdeschryver/spartan-signal-forms).

:::code-group

```ts [title=app.component.ts]
import { createFormField, createFormGroup, SignalInputDirective, V } from 'ng-signal-forms';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		RouterOutlet,
		FormsModule,
		JsonPipe,
		HlmInputDirective,
		HlmButtonDirective,
		HlmLabelDirective,
		SignalInputDirective,
		HlmAlertDirective,
		HlmIconComponent,
		HlmAlertIconDirective,
		HlmAlertTitleDirective,
		HlmAlertDescriptionDirective,
		AppErrorComponent,
		HlmSeparatorDirective,
		BrnSeparatorComponent,
		HlmButtonDirective,
		HlmCheckboxComponent,
		HlmCardDirective,
		HlmCardHeaderDirective,
		HlmCardTitleDirective,
		HlmCardDescriptionDirective,
		HlmCardContentDirective,
		HlmCardFooterDirective,
		HlmCheckboxComponent,
		HlmSwitchComponent,
		HlmButtonDirective,
	],
	templateUrl: './app.component.html',
	styleUrl: './app.component.css',
	host: {
		class: 'text-foreground block antialiased',
	},
})
export class AppComponent {
	protected readonlyBibNumber = signal(false);

	protected formModel = createFormGroup({
		name: createFormField('', {
			validators: [
				V.required(),
				{
					validator: V.minLength(2),
					message: ({ minLength }) => `Name must be at least ${minLength} characters`,
				},
			],
		}),
		bibNumber: createFormField<number | undefined>(4706674, {
			readOnly: () => this.readonlyBibNumber(),
		}),
		shipping: createFormGroup(() => {
			const differentFromBilling = createFormField(false);
			return {
				differentFromBilling,
				street: createFormField('', {
					validators: [
						{
							validator: V.required(),
							disable: () => !differentFromBilling.value(),
						},
					],
					hidden: () => !differentFromBilling.value(),
				}),
				zip: createFormField('', {
					validators: [
						{
							validator: V.required(),
							disable: () => !differentFromBilling.value(),
						},
					],
					hidden: () => !differentFromBilling.value(),
				}),
			};
		}),
		team: createFormGroup([createFormField(''), createFormField(''), createFormField('')]),
	});

	private debug = effect(() => {
		console.log('value:', this.formModel.value());
		console.log('valid:', this.formModel.valid());
	});

	protected submit(): void {
		console.log({
			value: this.formModel.value(),
			valid: this.formModel.valid(),
		});
	}

	protected reset(): void {
		this.formModel.reset();
	}

	protected prefill(): void {
		this.formModel.controls.name.value.set('John Doe');
		this.formModel.controls.bibNumber.value.update((v) => (v ?? 0) * 10);
		this.formModel.controls.shipping.controls.differentFromBilling.value.set(true);
		this.formModel.controls.shipping.controls.street.value.set('Street');
		this.formModel.controls.shipping.controls.zip.value.set('Zip');
	}

	protected toggleReadonly(): void {
		this.readonlyBibNumber.update((v) => !v);
	}
}
```

```razor [title=app.component.html]
<div class='w-full flex justify-center p-12 gap-12'>
  <div class='flex-initial w-96'>
    <div>
      <h3 class='text-lg font-medium'>ng-signal-forms demo</h3>
      <p class='text-sm text-muted-foreground'>Using <a hlmBtn target='_blank' variant='link' class='p-0'
          href='https://www.spartan.ng/documentation/introduction'>Spartan Components</a>, created by <a hlmBtn
          target='_blank' variant='link' class='p-0' href='https://twitter.com/goetzrobin'>&#64;Robin Goetz</a>.</p>
    </div>

    <brn-separator hlmSeparator />

    <div class="mb-4">
      <label for='name'>Name</label>
      <input type='text' id='name' ngModel [formField]='formModel.controls.name' hlmInput class="w-full"/>
      @if (formModel.controls.name.touched()) {
        @if (formModel.controls.name.hasError('required')) {
          <app-error>Name is required.</app-error>
        } @else if (formModel.controls.name.hasError('minLength')) {
          <app-error>
            {{ formModel.controls.name.errorMessage('minLength') }}
          </app-error>
        }
      }
    </div>

    <div class="mb-4">
      <label for='bib'>Bibnumber <span class="float-right"><hlm-switch class="mr-2" (changed)="toggleReadonly()" />Readonly mode</span></label>
      <input type='number' id='bib' ngModel [formField]='formModel.controls.bibNumber' hlmInput class="w-full" />
    </div>

    <section hlmCard class="mb-4">
      <div hlmCardHeader>
        <h3 hlmCardTitle>Shipping address</h3>
        <div hlmCardDescription>
            <label class='flex items-center' hlmLabel>
              <hlm-checkbox ngModel [formField]='formModel.controls.shipping.controls.differentFromBilling' id='differentFromBilling' class="mr-2" />
              Is your shipping address different from billing address?
            </label>
        </div>
      </div>
      <div hlmCardContent>
        <!-- using control flow-->
        @if(!formModel.controls.shipping.controls.street.hidden()){
          <div class="mb-4">
            <label for='street'>Street</label>
            <input type='text' id='street' ngModel [formField]='formModel.controls.shipping.controls.street' hlmInput class="w-full"/>
          </div>
        }

        <!-- using the hidden attribute-->
        <div [hidden]="formModel.controls.shipping.controls.zip.hidden()">
          <label for='zip'>Zip</label>
          <input type='text' id='zip' ngModel [formField]='formModel.controls.shipping.controls.zip' hlmInput class="w-full"/>
        </div>
      </div>
    </section>

    <section hlmCard class="mb-4">
      <div hlmCardHeader>
        <h3 hlmCardTitle>Team</h3>
        <div hlmCardDescription>
          Add your team members here!
        </div>
      </div>
      <div hlmCardContent>
        @for (member of formModel.controls.team.controls(); track $index) {
          <div class="mb-2">
            <label for='member-{{$index}}'>Team member {{$index+1}}</label>
            <input type='text' id='member-{{$index}}' ngModel [formField]='member' hlmInput class="w-full"/>
          </div>
        }
      </div>
    </section>
  </div>

  <div class="bg-neutral-900 p-8">
    <div class="mb-4">
      <button hlmBtn variant='outline' class="mr-2" (click)="submit()">Submit Form</button>
      <button hlmBtn variant='outline' class="mr-2" (click)="prefill()">Prefill Form</button>
      <button hlmBtn variant='outline' class="mr-2" (click)="reset()">Reset Form</button>
   </div>
    <pre>{{
        {
          value: formModel.value(),
          touchState: formModel.touchedState(),
          dirtyState: formModel.dirtyState(),
          valid: formModel.valid(),
          errors: formModel.errorsArray(),
        } | json
      }}
        </pre>
  </div>
</div>
```

:::
