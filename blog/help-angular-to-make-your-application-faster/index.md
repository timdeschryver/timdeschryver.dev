---
title: Help Angular to make your application faster
slug: help-angular-to-make-your-application-faster
description: Learn what we did to make our Angular application snappier.
author: Tim Deschryver
date: 2020-02-03T20:02:16.323Z
tags: Angular, Performance, NgRx, TypeScript
---

To give a little background, at work we're creating an application to schedule the daily rounds of caregivers.
This is done in a one-week calendar view for multiple caregivers, typically between 20 and 50 caregivers are being scheduled at the same time.

In the calendar view, we have a row for each caregiver, and there's are columns that represent each day of the week.
If everything is loaded, we speak about more than 1.500 items in total on the calendar.
Besides the calendar, there are several side panes for convenient utility views, for example, a view for items that still need to be scheduled that week, or conflicting appointments.

Technically, this is an Angular application and it's using NgRx.
Loading the main calendar view happens incrementally, there are different calendar items (the main ones being appointments and absences) and they are all fetched in parallel.
Once the most important data is loaded, the side panes are loaded, and the view will update accordingly.
We also load the schedule for the next week, to provide a smooth week transition.
There's one NgRx selector that combines multiple slices of the state for this calendar view, so when there's a data change the whole view gets updated. This makes it a joy to work with, hurrah for [push-based architectures](https://medium.com/@thomasburlesonIA/push-based-architectures-with-rxjs-81b327d7c32d)!

It's here, that at a later phase during development when all different items were loaded that we started to see performance issues. Nothing big in general but there were small hiccups, these were sensible while working on the schedules. The mouse would lag behind, and popups were opening slow.

In this article, we'll take a look at the changes we made to keep the view snappy.

## Root cause <!-- omit in toc -->

After a few `console.log` statements inside the [`OnChanges` lifecycle hook](https://angular.io/api/core/OnChanges) of the main components, we noticed that most of the components were rendering too many times. This had a ripple effect, and thus some of the heavier functions were executed too many times. Our main job was to lower the number of change detection cycles, by a lot.

We already had the `ChangeDetectionStrategy` of all of our components to [`ChangeDetectionStrategy.OnPush`](https://angular.io/api/core/ChangeDetectionStrategy#OnPush), and we're already using pure pipes in multiple places of our application.
These good practices took us far, but not far enough later on in the development phase.

## Solutions <!-- omit in toc -->

- [@HostListener runs the change detection cycle](#hostlistener-runs-a-new-change-detection-cycle)
- [Do heavy lifting up front (and only once)](#do-heavy-lifting-upfront-and-only-once)
- [Pure pipes to prevent method calls](#pure-pipes-to-prevent-method-calls)
- [trackBy to decrease the number of DOM mutations](#trackby-to-decrease-the-number-of-dom-mutations)
- [Virtual scrolling for large lists](#virtual-scrolling-for-large-lists)
- [Referential checks (NgRx)](#referential-checks-ngrx)
- [Preventing selector executions (NgRx)](#preventing-selector-executions-ngrx)
- [Detach components from the change detection](#detach-components-from-the-change-detection)

### @HostListener runs a new change detection cycle

This one, I did not know of.
The calendar component works with different shortcuts, and we used the [`@HostListener` decorator](https://angular.io/api/core/HostListener) to react to `keydown` events.
When the decorator emits a new event it will run the change detection cycle of the component.
Even if the pressed key isn't handled, nor isn't modifying the component's state.

To fix this, we switched to using the RxJS [`fromEvent` method](https://rxjs.dev/api/index/function/fromEvent) to detect when a key was pressed.

The handled events are dispatched to the NgRx store, to modify the state.
With this change, the view only updates when the state inside the NgRx Store changes, in comparison to every `keydown` event.

```ts:calendar-before.component.ts
@HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
    const events = {
      'ArrowLeft': this.previousWeek,
      'ArrowRight': this.nextWeek,
    }
    const event = events[event.key]
    if (event) {
      event();
    }
}
```

```ts:calendar-after.component.ts
ngAfterViewInit() {
  fromEvent(document, 'keydown')
    .pipe(
      map((event: KeyboardEvent) => {
        const events = {
          'ArrowLeft': this.previousWeek,
          'ArrowRight': this.nextWeek
        }
        return events[event.key]
      }),
      filter(Boolean),
      tap(evt => evt()),
      takeUntil(this.destroy)
    )
    .subscribe();
}
```

### Do heavy lifting upfront (and only once)

The initial NgRx selector returned a list of caregivers and a list of appointments.
The calendar component has a loop over this list of caregivers. And inside the loop, we had a second loop over the days of the current week. To get the appointments of the caregiver for the given days, we used the `getCaregiverSchedule` method. The method filters out the appointments for the current employee, and the current day.

```html:calendar.component.html
<div class="row" *ngFor="let caregiver of calendar.caregivers">
  <caregiver-detail [caregiver]="caregiver"></caregiver-detail>
  <caregiver-day-appointments
    *ngFor="let day of days"
    [scheduleItems]="getCaregiverSchedule(caregiver.id, day)"
  ></caregiver-day-appointments>
</div>
```

```ts:calendar.component.ts
getCaregiverSchedule(caregiverId: number, date: Date) {
  return this.calendar.scheduleItems.filter(
    item => item.caregiverId === caregiverId && dateEquals(item.date, date)
  );
}
```

For one caregiver, the `getCaregiverSchedule` method was called 7 times. If there were 20 caregivers on the screen, the method was executed 140 times.

It was this method that was having difficulties because it contained the list of all the appointments from all the caregivers, and had to loop through the whole list of appointments, for every caregiver, for every day. At first sight, this does not look too bad. But... this triggers a change detection cycle for the child component because the input changes. To make it worse, this gets repeated whenever the Angular change detection cycle runs for this component.

We noticed that this method was easily been called around 2.000 times in a matter of seconds, repeatedly.
It was also the main cause to change the [HostListener](#hostlistener-runs-the-change-detection-cycle) because it didn't help that this was executed on every keystroke.

To solve this, we moved the filter logic to the NgRx selector. Where it should live.
Instead of 2 separate lists, we modeled the data to serve the view.
We removed the appointments list and moved it as a property to the caregiver.
By doing this, the filter logic for the caregivers is only executed once, when the selectors emit a new output.
Because the reference to the caregivers and their appointments remain the same, the `caregiver-day-appointments` component does not run a change detection.

The HTML view now looks as follows.

```html:calendar.component.html
<div class="row" *ngFor="let caregiver of calendar.caregivers">
  <caregiver-detail [caregiver]="caregiver"></caregiver-detail>
  <caregiver-day-appointments
    *ngFor="let day of days"
    [scheduleItems]="caregiver.scheduleItems"
    [day]="day"
  ></caregiver-day-appointments>
</div>
```

For me, this change also makes it more readable and easier to work it.

### Pure pipes to prevent method calls

After the previous change, we made the same mistake again.
We already grouped the appointments to the caregivers, but we still had to filter the appointments by day.
For this, we created a new method that filters the appointments for a given day.
While not that bad as previously, it still ran a lot of times, almost all of the runs were unnecessary.

To solve this, we didn't re-model our state because we didn't want to split up the appointments into days of the week.
This change would have made it harder to work with the caregivers' appointments, we still wanted to be able to easily access the appointments array to perform calculations.

That's why here, we opted for a [Pure Pipe](https://angular.io/guide/pipes#pure-and-impure-pipes).

> Angular executes a pure pipe only when it detects a pure change to the input value. A pure change is either a change to a primitive input value (String, Number, Boolean, Symbol) or a changed object reference (Date, Array, Function, Object).
> Angular ignores changes within (composite) objects. It won't call a pure pipe if you change an input month, add to an input array, or update an input object property.
> This may seem restrictive but it's also fast. An object reference check is fast—much faster than a deep check for differences—so Angular can quickly determine if it can skip both the pipe execution and a view update.
> For this reason, a pure pipe is preferable when you can live with the change detection strategy. When you can't, you can use the impure pipe.

The pipe will only execute when it detects that the input value(s) are changed.
A change is detected when the reference of the value is changed, just like the `OnPush` strategy.

Because we re-modeled the state previously, we can assure that the reference to the appointments remains the same.
This has as result that the pipe will only execute once and the `caregiver-day` component's change detection will only run one time.

```html:calendar.component.html
<div class="row" *ngFor="let caregiver of calendar.caregivers">
  <caregiver-detail [caregiver]="caregiver"></caregiver-detail>
  <caregiver-day-appointments
    *ngFor="let day of days"
    [scheduleItems]="caregiver.scheduleItems | filterAppointmentsByDate: day"
    [day]="day"
  ></caregiver-day-appointments>
</div>
```

```ts:filter-appointments-by-date.pipe.ts
@Pipe({ name: 'filterAppointmentsByDate' })
export class FilterAppointmentsByDatePipe implements PipeTransform {
  transform(appointments: Appointment[], date: Date) {
    return appointments.filter((appointment) =>
      dateEquals(appointment.date, date),
    )
  }
}
```

### trackBy to decrease the number of DOM mutations

We knew that having method calls inside the HTML view were bad for performance.
But what didn't work as expected, was the [`trackBy` method](https://angular.io/api/common/NgForOf#ngForTrackBy).
We assumed that because we were using the `trackBy` method, the methods inside the `ngFor` template would only execute once.
But this is not the case. The `trackBy` method only helps for the creation or the removal of the DOM node.

> A function that defines how to track changes for items in the iterable.
> When items are added, moved, or removed in the iterable, the directive must re-render the appropriate DOM nodes. To minimize churn in the DOM, only nodes that have changed are re-rendered.

I'm not not saying that the `trackBy` method is not useful, because it is. It helps Angular to know when it must re-render DOM nodes, and when it should not. It ensures that only the affected nodes will be mutated. The less we have to do, the better.

### Virtual scrolling for large lists

Because the list of caregivers might be large, a lot of component instances are created, together with their DOM nodes.
The logic inside these components will also be run, state is stored, subscriptions are established, and change detection cycles are run. This makes it unnecessarily harder for our devices. That's why we added virtual scrolling.

Virtual scrolling only creates the component instances that are visible in the view.
For this, we use the [Scrolling CDK](https://material.angular.io/cdk/scrolling/overview) of Angular Material.

With this change, only the visible caregiver rows are created.
At its worse case, this (currently) reduces 50 caregiver component instances to 10 caregiver component instances.
This also is future proof as more caregivers could be added later.

Component-wise this means that 40 caregiver components will not be created and that all of the child components will not be created.
If each caregiver has 10 appointments a day, we're speaking about 400 child components that are not be created. We're not even counting the child components that are going levels deeper.

The best part, for us as developers, is that this is a minor change. It's only a 5-minute change, most of the time is spent to open up the documentation.

To implement it, simply wrap your component inside a `cdk-virtual-scroll-viewport` component, set its `itemSize`, and replace the `*ngFor` directive to a `*cdkVirtualFor` directive. Both directives share the same API. There's nothing more to it!

```html:calendar.component.html
<cdk-virtual-scroll-viewport itemSize="160" style="height:100%">
  <div
    class="row"
    *cdkVirtualFor="let caregiver of calendar.caregivers; trackBy: trackBycaregiver"
  >
    <caregiver-detail [caregiver]="caregiver"></caregiver-detail>
    <caregiver-day-appointments
      *ngFor="let day of days; trackBy: trackByDay"
      [scheduleItems]="caregiver.scheduleItems | filterAppointmentsByDate: day"
      [day]="day"
    ></caregiver-day-appointments>
  </div>
</cdk-virtual-scroll-viewport>
```

### Referential checks (NgRx)

Another culprit was the main NgRx selector, that returned the list of caregivers with their schedules.
The selector emitted too many times. After each change to the schedule, the selector is executed and returns a new result, with a new reference.

To make the application faster when a week navigation occurs we load the data for the next week when the current week is loaded.
We're re-using the same API calls to load the next week, as we do to load the current week. This also means that every time we receive an API response, we are modifying the state.

When the state is modified, the selectors receive a new input, and they will execute. Because we're using multiple API calls this means that the selector to build up the view will be executed repeatedly, after each API response. With each execution, the selectors emit a new value to the component which will trigger the Angular change detection.

But why do the selector think it's receiving a new value?
A selector is executed when it receives a different input, the selector uses an equality check `===` to know if the input was changed.
This check is cheap and will execute fast. This is fine for most of the cases.

In our case, we have a main `selectCurrentWeekView` selector that builds up the view. It uses different selectors, and each selector is responsible to read the data from the state and to filter the items for the current week. Because we use the [`Array.prototype.filter()` method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) for this, it will always create a new reference and thus the equality check will fail. Because the "child selectors" all create new references, the main selector will execute for each change.

```ts:selectors.ts
export const selectCurrentWeekView = createSelector(
  (selectCaregivers, selectItemsA, selectItemsB, selectItemsC),
  (caregivers, a, b, c) => ...)
```

To get this resolved we can use the RxJS [`distinctUntilChanged` operator](https://rxjs.dev/api/operators/distinctUntilChanged) and verify if the new output is different from the current output. A simple `JSON.stringify` check does the trick to check if the output is the same, but we first quickly check if the length is the same because it's faster in this case.

> `distinctUntilChanged`: Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from the previous item.

The extra check is faster in comparison to running the Angular change detection for the whole component tree.

```ts:calendar-container.component.ts
calendar = this.store.pipe(
  select(selectCurrentWeekView),
  distinctUntilChanged(
    (prev, current) =>
      prev.caregivers === current.caregivers &&
      prev.caregivers.length === current.caregivers.length &&
      prev.caregivers.reduce((a, b) => a.concat(b.scheduleItems), []).length ===
        current.caregivers.reduce((a, b) => a.concat(b.scheduleItems), [])
          .length &&
      JSON.stringify(prev) === JSON.stringify(current),
  ),
)
```

While this solution works, it doesn't prevent the selector to be executed when the data remain the same.
If we want to limit the number of times the selector executes, we can take it a step further and modify the custom behavior of the NgRx selector.

A [default selector](https://github.com/ngrx/platform/blob/master/modules/store/src/selector.ts#L508-L512) `createSelector`, uses the [selector factory](https://github.com/ngrx/platform/blob/master/modules/store/src/selector.ts#L540) function to create a selector.
By default, a selector uses the [memoization technique](https://github.com/ngrx/platform/blob/master/modules/store/src/selector.ts#L66-L118) for performance reasons. Before the execution of the projection function, the memoize function relies on the [`isEqualCheck`](https://github.com/ngrx/platform/blob/master/modules/store/src/selector.ts#L42-L44) method to know whether the input is changed. If it has changed, the selector's projection function will be called. After the execution of the projector, the result is also compared with the same `isEqualCheck`, in order to not emit a new value.

The code within the NgRx repo looks like this.

```ts:@ngrx/store/selectors.ts
export function defaultMemoize(
  projectionFn: AnyFn,
  isArgumentsEqual = isEqualCheck,
  isResultEqual = isEqualCheck,
): MemoizedProjection {
  let lastArguments: null | IArguments = null
  let lastResult: any = null

  function reset() {
    lastArguments = null
    lastResult = null
  }

  function memoized(): any {
    if (!lastArguments) {
      lastResult = projectionFn.apply(null, arguments as any)
      lastArguments = arguments
      return lastResult
    }

    if (!isArgumentsChanged(arguments, lastArguments, isArgumentsEqual)) {
      return lastResult
    }

    const newResult = projectionFn.apply(null, arguments as any)
    lastArguments = arguments

    if (isResultEqual(lastResult, newResult)) {
      return lastResult
    }

    lastResult = newResult

    return newResult
  }

  return { memoized, reset }
}

export function isEqualCheck(a: any, b: any): boolean {
  return a === b
}

function isArgumentsChanged(
  args: IArguments,
  lastArguments: IArguments,
  comparator: ComparatorFn,
) {
  for (let i = 0; i < args.length; i++) {
    if (!comparator(args[i], lastArguments[i])) {
      return true
    }
  }
  return false
}
```

But like before, with the RxJS approach, this is not enough.
Our data is the same but the child selectors have created new references, thus the equality check thinks it receives new input.

To prevent the selector to be executed when the input data is the same, we can use the `createSelectorFactory` function to create our own selector, with our own equality check.
The `defaultMemoize` has a `isArgumentsEqual` argument to compare the input, here where we're going to provide our custom comparer method. Just like before, the comparer will also make use of a `JSON.stringify` check to compare the previous input with the current input.

```ts:selectors.ts
export const selectCurrentWeekView = createSelectorFactory(projection =>
  defaultMemoize(projection, argumentsStringifyComparer()),
)((selectCaregivers, selectItemsA, selectItemsB, selectItemsC), (caregivers, a, b ,c) => ...)

function argumentsStringifyComparer() {
  let currentJson = ''
  return (incoming, current) => {
    if (incoming === current) {
      return true
    }

    const incomingJson = JSON.stringify(incoming)
    if (currentJson !== incomingJson) {
      currentJson = incomingJson
      return false
    }

    return true
  }
}
```

Now, when one of the child selectors emit a new value, our `argumentsStringifyComparer` method is used to check if the `selectCurrentWeekView`'s projector function should execute.

When the data for the current week is being loaded the data will be different for every response, and the selector will still be executed.
When the data is loaded for the next week the state gets updated but the child selectors still return the same data for the current week. With this change, the selector now will not pick this up as a change, and will not run.

This ensures that the component only receives a new value when the content of data has been changed. Because we check the selector's arguments first, we also prevent that the projection function of the selector is executed. For the heavier selectors, this is also a performance booster.

### Preventing selector executions (NgRx)

With the current solution, our selector will still fire every time when the data has changed in the week view. The data of the view is partially loaded with multiple API calls. This means that the selector will be executed for each call. This is useless if all the calls follow-up fast after each other.

We can use the RxJS [`auditTime` operator](https://rxjs.dev/api/operators/auditTime) to reduce the number of selector executions, and thus also change detection cycles.

> `auditTime`: Ignores source values for duration milliseconds, then emits the most recent value from the source Observable, then repeats this process.

```ts:calendar-container.component.ts
calendar = this.store.pipe(
  auditTime(500),
  select(selectCurrentWeekView),
  startWith({ werknemers: [] }),
)

// or

calendar = this.store.pipe(
  auditTime(0, animationFrameScheduler),
  select(selectCurrentWeekView),
  startWith({ werknemers: [] }),
)
```

This change ensures that the selector will only be called once for a given time, and not on each state change for the current week.

Don't forget to use the RxJS [`startWith` operator](https://rxjs.dev/api/operators/startWith) to set the initial state. Otherwise, the component will receive an `undefined` value because the selector has not been executed yet when the components are initialized.

> `startWith`: Returns an Observable that emits the items you specify as arguments before it begins to emit items emitted by the source Observable.

### Detach components from the change detection

We went with this approach before applying some of the solutions already addressed.
Afterwards, we reverted this change as it has some downsides.
Nonetheless, it can still be helpful in some cases.

It's possible to detach a component, and its child components, from the Angular change detection cycles.
To do this, we can use the [`ChangeDetectorRef.detach()` method](https://angular.io/api/core/ChangeDetectorRef#detach).

After this change, you'll notice that the component doesn't do much.
To run the change detection for the component, We have to manually call [`ChangeDetectorRef.detectChanges()`](https://angular.io/api/core/ChangeDetectorRef#detectchanges) when we want to re-render the component.

In our case, we detached the caregiver component and we only ran the change detection when the caregiver data was changed, or when another property did change. To check if the caregiver data changed, we used the `JSON.stringify` method again.

```ts{7, 11-32}:caregiver-schedule.component.ts
import { ChangeDetectorRef } from '@angular/core'

export class CaregiverScheduleComponent implements OnChanges {
  @Input() otherProperty
  @Input() caregiver

  constructor(private cdr: ChangeDetectorRef) {
    cdr.detach()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.otherProperty) {
      this.cdr.detectChanges()
      return
    }

    if (changes.caregiver) {
      if (changes.caregiver.isFirstChange()) {
        this.cdr.detectChanges()
        return
      }

      if (
        changes.caregiver.previousValue.scheduleItems.length !==
          changes.caregiver.currentValue.scheduleItems.length ||
        JSON.stringify(changes.caregiver.previousValue.scheduleItems) !==
          JSON.stringify(changes.caregiver.currentValue.scheduleItems)
      ) {
        this.cdr.detectChanges()
        return
      }
    }
  }
}
```

This doesn't seem too bad, but it doesn't stop here.
We also had to call `detectChanges` in the child components.
For example, we were using a material menu and the menu didn't open when we clicked on the trigger.
To open the menu, we had to call `detectChanges` on the click event.
This is just one example, but we had to do this at multiple places.

This isn't straightforward.
If you're not aware that a component detached itself, it leads to frustration and minutes of debugging.

## Conclusion

The biggest improvement we can make is to reduce the number of change detection cycles.
This will lower the number of function calls, and the number of re-renders.

The first step towards this is to work with immutable data.
When you're working with data that is immutable Angular and NgRx can make use of the `===` equality check to know if it has to do something. When the usage of JavaScript functions creates a new reference of an array (for example `filter` and `map`), we can override the equality checks. This can be done with RxJS or by creating a custom NgRx selector creator.

Every piece of logic that does not have to be run is a big win for the performance of an application. Therefore, limit the amount of work that has to be done with techniques like virtual scrolling to restrict the number of active components.
Make use of the `trackBy` directive to let Angular know if something needs to be re-rendered.

Do not use methods in the HTML view, as these will be executed on every change detection cycle.
To resolve this, precalculate state wherever possible. When this is impossible, go for a pure pipe because it will be run fewer times in comparison to methods. When you're using a pipe it's (again) important to use immutable data, as the pipe will only execute when the input is changed.

Be aware of what triggers the change detection. If an input property of a component changes, or when it fires an event, it will trigger the Angular change detection.

Remember the quote "premature optimization is the root of all evil".
Most of these tips are only needed when the application doesn't feel snappy anymore.

### Useful resources

- [Optimizing an Angular application - Minko Gechev](https://www.youtube.com/watch?v=ybNj-id0kjY&list=PLOETEcp3DkCrmGI9bHXMDsxl6_YdnZr7M&index=42&t=0s)
- [Angular Performance Workshop - Manfred Steyer](https://www.youtube.com/watch?v=ZI_MC3YdSo4&list=PLOETEcp3DkCrmGI9bHXMDsxl6_YdnZr7M&index=27&t=0s)
- [Performance optimizations in Angular - Mert Değirmenci](https://www.youtube.com/watch?v=Tlmx1PbP8Qw)
- [The Need for Speed (aka Angular Performance) - Bonnie Brennan](https://www.youtube.com/watch?v=rhk25PEgItA&list=PL9pV_RwZceNiz7We-yUGBF7mzpB8DxHhs&index=3)
- [A gentle introduction into change detection in Angular - Maxim Koretskyi](https://indepth.dev/a-gentle-introduction-into-change-detection-in-angular/)
