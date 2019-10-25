---
title: Common and easy-to-make mistakes when you’re new to NgRx
slug: common-and-easy-to-make-mistakes-when-youre-new-to-ngrx
description: Writing and refactoring FizzBuzz in NgRx with maintainability in mind
author: Tim Deschryver
date: 2019-03-04T09:25:46.919Z
tags: NgRx,Redux, Angular
banner: ./images/banner.jpg
bannerCredit: Photo by [Sarah Dorweiler](https://unsplash.com/@sarahdorweiler) on [Unsplash](https://unsplash.com)
published: true
publisher: Angular In Depth
canonical_url: https://blog.angularindepth.com/common-and-easy-to-make-mistakes-when-youre-new-to-ngrx-49404ac973ea
publish_url: https://blog.angularindepth.com/common-and-easy-to-make-mistakes-when-youre-new-to-ngrx-49404ac973ea
---

This post is aimed at newcomers to NgRx.

In the first part of the post, we’ll be creating a new Angular project and we’ll implement a FizzBuzz implementation with NgRx. For the initial setup we’ll use the Angular CLI, and to scaffold the NgRx files we’ll be relying on the NgRx schematics.

The second part of the post will be used to refactor and reason about the implementation of the first part. The goal is to have a more maintainable code base.

### What is FizzBuzz

Before we start, let’s get everyone up to speed with FizzBuzz. FizzBuzz is a task that prints out numbers incrementally starting from 1, if the number is divisible by three the number get replaced by the word fizz and if the number is divisible by five it gets replaced by buzz. If the number is divisible by both three and five, the word fizz buzz will be printed out.

The output starts as follows:

1, 2, Fizz, 4, Buzz, Fizz, 7, 8, Fizz, Buzz, 11, Fizz, 13, 14, FizzBuzz, 16, 17, Fizz, 19, Buzz, Fizz, 22, 23, Fizz, Buzz, …

### Initial project setup

Let’s get started! We can create the project using the `ng new` command and we’ll install the NgRx packages using the NgRx schematics. These schematics will install the package and will also automate the needed configurations to wire up NgRx correctly.

```bash
ng new ngrx-fizzbuzz
ng add @ngrx/store
ng add @ngrx/effects --spec=false --group=true
ng add @ngrx/store-devtools
yarn add @ngrx/schematics --dev
```

### Creating the FizzBuzz reducer

With the project ready, we can start to implement FizzBuzz. We do this by creating the fizzbuzz reducer, using the [reducer schematic](https://ngrx.io/guide/schematics/reducer).

```bash
ng generate @ngrx/schematics:reducer fizzbuzz --reducers=reducers/index.ts --group=true --spec=false
```

In the reducer:

- We define the fizzbuzz State, with the counter and the message to print out
- Provide an initial state, to initially load up the start of the application
- Create the reducer function. Inside this function, **we modify the state in a pure way — we don’t mutate properties directly on the state.** Whenever we want to print out the next output, invoked by the `NEXT` action, we increment the counter and create the message. Inside the `switch` statement, the default case is very important. When the reducer retrieves an action it isn’t responsible for (every reducer gets invoked by any action), we return the state as is. Without the default return case, the state would become `undefined`.

```ts
export interface State {
  counter: number
  message: string
}

export const initialState: State = {
  counter: 1,
  message: '',
}

export function reducer(state = initialState, action: Action): State {
  switch (action.type) {
    case 'NEXT':
      const counter = state.counter + 1
      let message = ''

      if (counter % 3 === 0) {
        message += 'Fizz'
      }
      if (counter % 5 === 0) {
        message += 'Buzz'
      }

      return {
        counter,
        message: message || counter.toString(),
      }

    default:
      return state
  }
}
```

### Updating the component

Now that we’ve defined the fizzbuzz state and the fizzbuzz reducer, it’s time to print out the fizzbuzz output. Inside the `AppComponent`, we inject the Store to get the fizzbuzz message and to dispatch the `NEXT` action to invoke the reducer.

To get the message from the store, we use the `select` operator. Because `State` is the whole application state, we first have to access the `fizzbuzz` state in order to retrieve the `message`. This gives us an RxJS stream, consisting of messages. To print the messages out, we use the Angular `async` pipe.

To trigger a state change, we have to invoke the fizzbuzz reducer. Because we can’t invoke the reducer directly, we use the `dispatch` function. We send the action `NEXT` to the store which will invoke the fizzbuzz reducer, resulting in a new message in the message stream.

```ts
@Component({
  selector: 'app-root',
  template: `
    {{ fizzbuzzMessage | async }}
  `,
})
export class AppComponent implements OnInit {
  fizzbuzzMessage: Observable<string> = this.store.pipe(
    select(state => state.fizzbuzz.message),
  )

  constructor(private store: Store<State>) {}

  ngOnInit() {
    setInterval(() => this.store.dispatch({ type: 'NEXT' }), 1000)
  }
}
```

If we now start the application, we’ll see the fizzbuzz messages! 🎉

### Refactor to a maintainable application

Before we walk through the refactoring, I would encourage you to roll up your sleeves first and refactor the current code yourself on [StackBlitz](https://stackblitz.com/edit/ngrx-fizzbuzz-part-one).

### Using Actions and action creators

The first step in the refactoring journey would be to create actions. We do this to remove magic strings, but maybe even more important, to allow action type checking. In this small example, the full power of this step won’t be visible. In larger applications, you’ll notice that TypeScript can infer the action’s properties inside the reducers.

We can create the action by using the [action schematic](https://ngrx.io/guide/schematics/action).

```bash
ng generate @ngrx/schematics:action fizzbuzz --group=true --spec=false
```

The above schematic creates the action file and an example action inside of it, consisting out of an action enum, an action creator, and an action union type. We can modify this to fit our fizzbuzz application as follows:

```ts
import { Action } from '@ngrx/store'

// action enum
export enum FizzBuzzActionTypes {
  Next = '[AppComponent] Next',
}

// action creator
export class Next implements Action {
  readonly type = FizzBuzzActionTypes.Next
}

// actions union type, add more Actions using a pipe '|'
export type FizzBuzzActions = Next
```

Now, we can remove the magic string `NEXT` inside the fizzbuzz reducer and inside the `AppComponent`.

> For more information about actions see the [official docs](https://ngrx.io/guide/store/actions) and a previous post [Let’s have a chat about Actions and Action Creators within NgRx](./posts/lets-have-a-chat-about-actions-and-action-creators-within-ngrx).

### Using selectors and derived state

The problem with the working code is that we hold multiple versions of the same state inside the store state, this can make it hard to maintain over time when the application keeps on growing. That’s why we’re going to extract the fizzbuzz message inside a selector.

Before we can create the selector, we first have to provide a `getter` to retrieve the `counter` within the fizzbuzz state. When this is done, we can create our message selector to compute derived state.

```ts
// `getter` in the reducer file reducers/fizzbuzz.reducer
export const getCounter = (state: State) => state.counter

// selectors in reducers

// First, select the fizzbuzz state from app state
export const getFizzBuzzState = createFeatureSelector<fromFizzbuzz.State>(
  'fizzbuzz',
)

// Second, wrap the getter inside a selector
export const getCounter = createSelector(
  getFizzBuzzState,
  fromFizzbuzz.getCounter,
)

// Third, create the message selector based on the counter state
export const getMessage = createSelector(
  getCounter,
  counter => {
    let message = ''
    if (counter % 3 === 0) {
      message += 'Fizz'
    }
    if (counter % 5 === 0) {
      message += 'Buzz'
    }

    return message || counter.toString()
  },
)
```

> For more info about selectors see the [official docs](https://ngrx.io/guide/store/selectors) and a previous post [Sharing data between modules is peanuts](./posts/sharing-data-between-modules-is-peanuts).

### The reducer

With the action and the selector created, it’s time to clean up the reducer. This is done by:

- Typing the actions by using the actions union `FizzBuzzActions`. This makes sure that the `switch` statement’s `case` s are valid and will also correctly type the action inside the `case` statement.
- Replacing the `Next` string with the enum `FizzBuzzActionTypes.Next`.
- Removing the `message` property from the state, since the message is now derived in the `getMessage` selector.

```ts
export interface State {
  counter: number
}

export const initialState: State = {
  counter: 1,
}

export function reducer(state = initialState, action: FizzBuzzActions): State {
  switch (action.type) {
    case FizzBuzzActionTypes.Next:
      return {
        counter: state.counter + 1,
      }

    default:
      return state
  }
}
```

> For more info about reducers see the [official docs](https://ngrx.io/guide/store/reducers) and for more info about state normalization see a previous post [Normalizing state](./posts/normalizing-state).

### Using effects

I’m a big fan of effects and I’m using it to put every piece of logic that isn’t specific to the component’s logic. The most used and known example of this are AJAX requests, but the use cases of effects can be broadened out to everything that is causing your component to become impure.

Inside the `effects/app.effects.ts` file created by the `ng add` command, we’re going to move the logic to dispatch the `Next` action on every second. For this, we’re using the RxJS `interval` instead of the `setInterval` method, creating a continuous stream that emits a `Next` Action on each time interval. These actions will be dispatched to the store, invoking the reducer that on his turn triggers the `getMessage` selector resulting in a re-render with the new message output.

```ts
@Injectable()
export class AppEffects {
  @Effect()
  fizzbuzzes = interval(1000).pipe(mapTo(new Next()))
}
```

> For more info about effects see the [official docs](https://ngrx.io/guide/effects) and for more effects usages see [Start using ngrx/effects for this](./posts/start-using-ngrx-effects-for-this).

### The new component

With these steps completed, we can now go back to the `AppComponent` and:

- Remove the dispatch logic
- Use the `getMessage` selector — personally, I also prefer removing the Store’s type. You won’t lose type safety because the selector (and its output) is typed. Plus from my experience, the Store’s type can lead to confusion, this is because at runtime it will contain the whole AppState.

```ts
@Component({
  selector: 'app-root',
  template: `
    {{ fizzbuzzes | async }}
  `,
})
export class AppComponent {
  fizzbuzzes = this.store.pipe(select(getMessage))

  constructor(private store: Store<{}>) {}
}
```

### The outcome

If you keep these little tips in mind, each boundary inside the application has its own responsibility. This makes it easier to reason about and easier to maintain in the long run. If something goes wrong you can quickly scope it down to a specific boundary and you immediately know where to look.

#### Introducing Actions and Action Creators: reducing boilerplate

- by using this convention, we **get rid of a magic string value**
- we gain **type safety**
- we don’t have to write an action more than once, we add a small layer of abstraction and follow the **DRY** principle
- it makes **testing actions easier**, we only have to write one test
- maintainability bonus: follow the [**Good Action Hygiene**](https://www.youtube.com/watch?v=JmnsEvoy-gY) practice introduced by [Mike Ryan](https://twitter.com/MikeRyanDev)

#### Reducers: only store the data once

- this will lead to smaller and **cleaner reducers**
- we have a **single point of truth**, we don’t have to remember every state property for this state
- we only have to **test state mutators**
- readability bonus: if the immutable way (using the spread operator) of writing reducers is new and a bit uncomfortable, use **Immer** to make the transition easier — [Clean NgRx reducers using Immer](./posts/clean-ngrx-reducers-using-immer)

#### Selectors: used to derive state based on the store state

- **don’t pollute the store state**, use selectors as queries to create view models
- **keep selectors small** so they can be used to compose bigger selectors
- since these are just functions that receive state and return some data they are also **easy to test**
- selectors are **highly performant** because they memoize (cache) the latest execution so they don’t have to re-execute on every state change
- in-depth bonus: to fully understand the benefits that selectors provide see [**Selectors are more powerful than you think**](https://www.youtube.com/watch?v=E7GKnjGCXzU) by [Alex Okrushko](https://twitter.com/AlexOkrushko)

#### Effects: used for side effects

- making your **components pure**, thus predictable, easier to reason about
- fully **unleashes the power RxJS provides**, e.g. cancel pending requests when needed
- easier to test components, but also provides **separated tests for side effects**
- architectural bonus: different ways to process actions, [**Patterns and Techniques**](https://blog.nrwl.io/ngrx-patterns-and-techniques-f46126e2b1e5) by [Victor Savkin](https://twitter.com/victorsavkin)

To end this post, see the [this Blitz](https://stackblitz.com/edit/ngrx-fizzbuzz-refactored) for the refactored version.
