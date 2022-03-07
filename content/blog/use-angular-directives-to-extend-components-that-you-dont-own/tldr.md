Directives can be used to globally configure 3rd party components .

```ts
import { Directive } from '@angular/core';
import { Calendar } from 'primeng/calendar';

@Directive({
	// global directive
	selector: 'p-calendar',
	// opt-in directive
	selector: 'p-calendar[defaultCalendar]',
	// opt-out directive
	selector: 'p-calendar:not(resetCalendar)',
})
export class CalenderDirective {
	constructor(private calendar: Calendar) {
		this.calendar.dateFormat = 'dd/mm/yy';
		this.calendar.showIcon = true;
		this.calendar.showButtonBar = true;
		this.calendar.monthNavigator = true;
		this.calendar.yearNavigator = true;
		this.calendar.yearRange = '1900:2050';
		this.calendar.firstDayOfWeek = 1;
	}
}
```

Resulting in the following changes to the HTML template.

```diff
<p-calendar
	[(ngModel)]="date"
	required
	id="date"
	name="date"
-	dateFormat="dd/mm/yy"
-	[showIcon]="true"
-	[showButtonBar]="true"
-	[monthNavigator]="true"
-	[yearNavigator]="true"
-	yearRange="1900:2050"
-	[firstDayOfWeek]="1"
>
</p-calendar>
```
