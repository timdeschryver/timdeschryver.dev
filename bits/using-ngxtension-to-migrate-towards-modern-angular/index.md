---
title: 'Using ngxtension to migrate towards "Modern" Angular'
slug: using-ngxtension-to-migrate-towards-modern-angular
date: 2024-05-07
tags: angular
---

# Using ngxtension to migrate towards Modern Angular

In recent versions, Angular has introduced a new set of APIs and features that are considered "modern" Angular.
The `inject` method, `signal` based inputs, and the new `output` method, immediately come to my mind.

These new APIs are not only more powerful but also more readable and easier to use.
That's why it's encouraged to use it in new projects.

But what about existing projects?
You can have a mix of old and new Angular code in your project, or you might want to migrate to the new Angular version.
I prefer the latter because it keeps things consistent, but in large codebases this can be a daunting task that consumes some time and effort.

To automate this task there's a tool that can help you with this: [NG Extension (ngxtension)](https://ngxtension.netlify.app/), which is created by [Chau Tran](https://twitter.com/Nartc1410) and [Enea Jahollari](https://twitter.com/Enea_Jahollari).
This library provides a collection of utility methods to write Angular code, and it also provides a set of schematics to help you migrate to the new Angular APIs.

Let's see how we can use ngxtension to migrate towards "modern" Angular with some before and after examples.

:::code-group

```angular-ts [title=Before]
@Component({
	template: `
        @if (showTitle) {  
            <h1>{{ title }}</h1>
        }
        <button (click)="onClick()">Click me!</button> 
	`,
})
export class AwesomeComponent {
	@Input({ required: true }) title: string = '';
	@Input({ required: true, transform: booleanAttribute })
	showTitle: boolean = false;
	@Output() buttonClicked = new EventEmitter<string>();
	constructor(private service: AwesomeService) {}
	onClick() {
		this.buttonClicked.emit(this.title);
		this.service.magic();
	}
}
```

```angular-ts [title=After]
@Component({
	template: `
        @if (showTitle()) {
            <h1>{{ title() }}</h1>
        }
        <button (click)="onClick()">Click me!</button>
	`,
})
export class AwesomeComponent {
	private service = inject(AwesomeService);
	title = input.required<string>();
	showTitle = input.required<boolean, boolean>({ transform: booleanAttribute });
	buttonClicked = output<string>();

	onClick() {
		this.buttonClicked.emit(this.title());
		this.service.magic();
	}
}
```

:::

### ngxtension:convert-di-to-inject

:::code-group

```angular-ts [title=Before]
@Component()
export class AwesomeComponent {
  contructor(private service: AwesomeService) {}
}
```

```angular-ts [title=After]
@Component()
export class AwesomeComponent {
	private service = inject(AwesomeService);
}
```

:::

### ngxtension:convert-signal-inputs

:::code-group

```angular-ts [title=Before]
@Component()
export class AwesomeComponent {
	@Input({ required: true }) title: string = '';
	protected log() {
		console.log(this.title);
	}
}
```

```angular-ts [title=After]
@Component()
export class AwesomeComponent {
	title = input.required<string>();
	protected log() {
		console.log(this.title());
	}
}
```

:::

### ngxtension:convert-outputs

:::code-group

```angular-ts [title=Before]
@Component()
export class AwesomeComponent {
	@Output() logOutpout = new EventEmitter<string>();
	protected log() {
		this.logOutpout.emit('👋 Hello');
	}
}
```

```angular-ts [title=After]
@Component()
export class AwesomeComponent {
	logOutpout = output<string>();
	protected log() {
		this.logOutpout.emit('👋 Hello');
	}
}
```

:::
