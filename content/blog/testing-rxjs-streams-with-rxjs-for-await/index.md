---
title: Testing RxJS streams with rxjs-for-await
slug: testing-rxjs-streams-with-rxjs-for-await
description: How does rxjs-for-await compare to other approaches when it comes to testing RxJS streams, and what I like about these tests.
author: Tim Deschryver
date: 2020-07-21
tags: testing, rxjs, rx-query
banner: ./images/banner.jpg
bannerCredit: Photo by [Richard Bagan](https://unsplash.com/@richard_bagan) on [Unsplash](https://unsplash.com)
published: true
---

While most of the examples that I've seen are using marbles diagrams to assert that a RxJS stream is behaving as intended,
I'm of the opinion that most of these tests don't benefit from the marble diagram syntax.

The reason why I think that, is because marbles are testing implementation details and this isn't useful for us as consumers.
We can expect that each operator is tested (within the producer's codebase, e.g. the RxJS repository) to verify that it operates in an expected way.
When we, as consumers. write tests we should only be interested, for the most part, in the output of the stream.
I do think that marble diagrams are useful when you're writing your custom operators because then it's important to test these implementation details.
Besides, I can say from my experience that it can take a while to understand your first marble diagram and take up some more time to write your first test.

Because of this, I used [`rxjs-for-await`](https://github.com/benlesh/rxjs-for-await) to write the tests for [rx-query](https://github.com/timdeschryver/rx-query). In this post, we'll write a test using `rxjs-for-await` and then compare it with other RxJS testing strategies. I hope this simple example illustrates why I do prefer these tests of marble tests.

As an example, let's test a simple `map` to map a value to its corresponding letter in the alphabet, over a certain amount of time.
The example code looks like this:

```ts
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

const toAlphabet = (): OperatorFunction<any, string> => (source) =>
  source.pipe(map((v) => ALPHABET[v]))

const source = timer(100, 10).pipe(toAlphabet(), takeWhile(Boolean))
```

## rxjs-for-await

[rxjs-for-await](https://github.com/benlesh/rxjs-for-await) written by [Ben Lesh](https://twitter.com/BenLesh) doesn't have its primary focus on making testing easy, but it's created to support the `async/await` syntax.
A happy coincidence, because this does come in handy while writing tests because we can just await the stream to complete and verify the outcome.

When you're writing tests with `rxjs-for-await` it's important to complete the stream.
Otherwise, it will just keep waiting until the stream completes, resulting in a timeout error.

```ts
import { eachValueFrom } from 'rxjs-for-await'

test('rxjs-for-await', async () => {
  const source = timer(100, 10).pipe(toAlphabet(), takeWhile(Boolean))

  const result = []
  for await (const value of eachValueFrom(source)) {
    result.push(value)
  }

  expect(result).toStrictEqual(ALPHABET.split(''))
})
```

When we compare this test to other RxJS testing strategies using marble tests we can clearly see the differences where the focus point lies on for these tests.

## RxJS Testing

The `TestScheduler` is provided by RxJS to write tests using the [marble diagram syntax](https://rxjs.dev/guide/testing/marble-testing).
In the test case below, you can see that every frame of the stream is asserted, each frame that is just waiting, and each frame that emits a value.
This is important when you're writing operators, and that's probably why this approach is used in the RxJS codebase to test the RxJS operators.
But it also makes things more complex, especially if you're not used to reading or writing marble diagrams.

> For more information about the `TestScheduler`, I refer you to the following posts written by [Kevin Kreuzer](https://twitter.com/kreuzercode), [Marble testing with RxJS testing utils](https://medium.com/@kevinkreuzer/marble-testing-with-rxjs-testing-utils-3ae36ac3346a) and [Testing asynchronous RxJs operators](https://medium.com/angular-in-depth/testing-asynchronous-rxjs-operators-5495784f249e).

```ts
import { TestScheduler } from 'rxjs/testing'

test('TestScheduler', () => {
  const scheduler = new TestScheduler((actual, expected) =>
    expect(actual).toEqual(expected),
  )

  scheduler.run(({ expectObservable }) => {
    const source = timer(100, 10).pipe(toAlphabet(), takeWhile(Boolean))
    const expected =
      '100ms a 9ms b 9ms c 9ms d 9ms e 9ms f 9ms g 9ms h 9ms i 9ms j 9ms k 9ms l 9ms m 9ms n 9ms o 9ms p 9ms q 9ms r 9ms s 9ms t 9ms u 9ms v 9ms w 9ms x 9ms y 9ms z 9ms |'
    expectObservable(source).toBe(expected)
  })
})
```

## jasmine-marbles

Now, let's take a look at how the same test is written with the popular [`jasmine-marbles`](https://github.com/synapse-wireless-labs/jasmine-marbles) package. It uses the same syntax to write the marble diagrams, but it doesn't require the setup to create the `TestScheduler`.

By using `jasmine-marbles`, we end up with the following test.

```ts
import { cold } from 'jasmine-marbles';

test('jasmine-marbles', () => {
  const sourceValues = {
      a: 0,
      b: 1,
      c: 2,
      ...
  };
  const source = cold(
    '100ms a 9ms b 9ms c 9ms d 9ms e 9ms f 9ms g 9ms h 9ms i 9ms j 9ms k 9ms l 9ms m 9ms n 9ms o 9ms p 9ms q 9ms r 9ms s 9ms t 9ms u 9ms v 9ms w 9ms x 9ms y 9ms z 9ms |',
    sourceValues,
  )
  const result = source.pipe(toAlphabet())
  const expected = cold(
    '100ms a 9ms b 9ms c 9ms d 9ms e 9ms f 9ms g 9ms h 9ms i 9ms j 9ms k 9ms l 9ms m 9ms n 9ms o 9ms p 9ms q 9ms r 9ms s 9ms t 9ms u 9ms v 9ms w 9ms x 9ms y 9ms z 9ms |',
  )
  expect(result).toBeObservable(expected)
})
```

## rxjs-marbles

Another great library from [Nicholas Jamieson](https://twitter.com/ncjamieson), called [`rxjs-marbles`](https://github.com/cartant/rxjs-marbles).
It can be compared with `jasmine-marbles` as it also gets rid of the setup and it also uses the same marble diagram syntax. The main difference is that `rxjs-marbles` can be used across all test frameworks. That's the reason why its API is different compared to `jasmine-marbles`.

```ts
import { marbles } from 'rxjs-marbles'

test(
  'rxjs-marbles',
  marbles((m) => {
    const source = timer(100, 10).pipe(toAlphabet(), takeWhile(Boolean))
    const expected =
      '100ms a 9ms b 9ms c 9ms d 9ms e 9ms f 9ms g 9ms h 9ms i 9ms j 9ms k 9ms l 9ms m 9ms n 9ms o 9ms p 9ms q 9ms r 9ms s 9ms t 9ms u 9ms v 9ms w 9ms x 9ms y 9ms z 9ms |'

    m.expect(source).toBeObservable(expected)
  }),
)
```

## Main differences and my thoughts

I think that marble tests are great for testing implementation details, every frame is important while writing your own RxJS operators. The only way to test these, in a descriptive way, is by using marble tests. This is clearly showcased in the RxJS repository.

But the advantages don't outweigh the disadvantages when it comes to testing most of the code that lives inside an application. Here, we should be interested in the output of a stream. Marble diagrams are also not helping to enlarge the pit of success, I haven't encountered a developer yet that immediately gets marble diagrams and feel comfortable to write their first test cases with it.
Most of the tests I've seen in application code are also brittle to change, e.g. they fail when a detail, for example a timer duration, is modified.

[Alex Okrushko](https://twitter.com/AlexOkrushko) did point out a drawback to this approach. Some tests will take longer to run because you can't mock times. This is crucial when you have timers that wait multiple seconds. Mocking times is possible with marble tests, and with [`ObserverSpy`](#observerspy).
For more info about fake times, see [https://ncjamieson.com/testing-with-fake-time/](https://ncjamieson.com/testing-with-fake-time/) by [Nicholas Jamieson](https://twitter.com/ncjamieson), and see the [`ObserverSpy docs`](https://github.com/hirezio/observer-spy#-for-time-based-rxjs-code-timeouts--intervals--animations---use-faketime).

That's why I like `rxjs-for-await`. It helps to reduce the complexity of writing and reading these tests. Simply put, it's simply input in, and output out.
That's why I wrote all the tests for `rx-query` using the `rxjs-for-await` package. For more use-cases, check out [the test cases](https://github.com/timdeschryver/rx-query/blob/master/rx-query/query.spec.ts) inside the repository.

## Alternatives

### ObserverSpy

This is a new library, written by [Shai Reznik](https://twitter.com/shai_reznik) not too long ago.
This was my first look into `ObserverSpy`, and I think it's great.
It solves the same problem that I had with marble tests, and I couldn't have said it any better than Shai:

> Marble tests are very powerful, but at the same time can be very complicated to learn and to reason about for some people.
> You need to learn and understand cold and hot observables, schedulers and to learn a new syntax just to test a simple observable chain.

The only, small, downside compared to `rxjs-for-await` is that you have to learn a new API, whereas `rxjs-for-await` is just using the JavaScript `async/await` feature. The plus side of using`ObserverSpy` is that it has useful helper methods to read the output values of the stream.

```ts
import { subscribeSpyTo } from '@hirez_io/observer-spy'

test('ObserverSpy', async () => {
  const source = timer(100, 10).pipe(toAlphabet(), takeWhile(Boolean))
  const observerSpy = subscribeSpyTo(source)

  await observerSpy.onComplete()

  expect(observerSpy.getValues()).toStrictEqual(ALPHABET.split(''))
})
```

### Manually

You don't need an extra dependency to test your RxJS streams.
The output of a stream can be tested via the callbacks provided by a subscription, for example, the `complete` callback.

But be careful when you go down this road, as this might lead to false positives.
In the test below it's crucial to use the `done` callback (from your test framework). If you don't use the `done` callback, the test completes before the `complete` callback is invoked, and thus will the assertion inside of the `complete` callback never be tested.
In other words, the test will always pass, even when it shouldn't.

This will probably lead to false-positives, as it was in my case.
That's why I suggest you to take a look at `rxjs-for-await` or `ObserverSpy`.
This way you can have confidence in the tests you write.

```ts
test('manual', (done) => {
  const source = timer(100, 10).pipe(toAlphabet(), takeWhile(Boolean))

  const result = []
  source.subscribe({
    next: (value) => result.push(value),
    complete: () => {
      expect(result).toStrictEqual(ALPHABET.split(''))
      done()
    },
  })
})
```
