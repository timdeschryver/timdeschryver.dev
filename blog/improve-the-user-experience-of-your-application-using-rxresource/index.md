---
title: Improve the user experience of your application using (rx)resource
slug: improve-the-user-experience-of-your-application-using-rxresource
description: Don't just replace observable streams with the `value()` signal of a resource, but also take advantage of its built-in additional properties to improve the user experience of your application.
date: 2025-01-14
tags: Angular
---

[Angular 19](https://blog.angular.dev/meet-angular-v19-7b29dfd05b84) ships with an **experimental method** called [`resource`](https://angular.dev/api/core/resource) (or [`rxResource`](https://angular.dev/api/core/rxjs-interop/rxResource)) to help us manage **asynchronous read actions**, primarily against an HTTP resource. This feature is designed to streamline the process of fetching data from a server, making it easier for developers to handle the response.

While there are already fantastic articles written on the topic, such as [Everything you need to know about the resource API](https://push-based.io/article/everything-you-need-to-know-about-the-resource-api) by [Enea Jahollari](https://x.com/Enea_Jahollari) and
[Asynchronous Data Flow with Angular's new Resource API](https://www.angulararchitects.io/en/blog/asynchronous-resources-with-angulars-new-resource-api) by [Manfred Steyer](https://x.com/ManfredSteyer/), these articles focus on the technical aspects on how to use the new API, and thus mostly cover the TypeScript part.
The Angular [docs](https://angular.dev/guide/signals/resource) are also written from a technical angle, and document the bits and pieces of the API in detail to get you started.

While you first need to understand what `resource` does and know how you can make the most use of it, I think it's also important to acknowledge that it can improve the user experience. In the end, a happy user should be our main goal, right?

In this article, I want to highlight how the `resource` API helps teams to make better UIs.
I hope you keep this in mind when you and your team start to use `resource` in your application, or when you're refactoring existing code towards the `resource` method.

### Basic example

Let's start with a basic example to see how this impacts the way we fetch data from a server.

Imagine you have a component that fetches a list of weather forecasts from a server.
Currently, the default way is to use the `HttpClient` to fetch the data, which returns an `Observable<T>`, and then display it in the component using the `async` pipe or manually subscribe to it.

The new proposal is to use `resource` or `rxResource` method instead.
The difference between the two is that `rxResource` requires an observable, while `resource` expects a promise.
I'm using `rxResource` because the HTTP client still returns an observable.

Both methods expect a configuration object [`ResourceOptions`](https://angular.dev/api/core/ResourceOptions#) that expects a `loader` method.
Via the `loader` option, you tell the resource how to fetch the data from the server. I'm using the example of fetching data from a server here, but it can work with any asynchronous operation.

Once the resource is instantiated, it immediately invokes the `loader` method.
This means your data will be fetched when the component is created.

The `resource` method returns a [`ResourceRef`](https://angular.dev/api/core/ResourceRef) object, which we will cover later in this article.

```ts:weather-forecast.component.ts
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import type { WeatherForecast } from './weather-forecast';

@Component({...})
export class WeatherForecastComponent {
	private http = inject(HttpClient);
	readonly weatherforecastResource = rxResource({
		loader: () => this.http.get<WeatherForecast[]>(`/api/weatherforecast`),
	});

	protected refresh() {
		this.weatherforecastResource.reload();
	}
}
```

For the ones of you who read the entire example, you also have noticed it's possible to refresh the data by executing the `reload` method of the `resource`.
Invoking this method re-invokes the configured loader method. Important to know is that it ignores new requests if the current request is still pending.

### The problem

The default behavior that we're currently used to, is having an `HttpClient` which returns an `Observable` containing the fetched data.
In the best case, you handle non-successful requests properly, e.g. by using the `catchError` operator, and do something with the error.
Some of you also have some custom logic to keep track of the request state, for example, loading, idle, success, error states.
If you keep track of the request state, it might feel as boilerplate code that you have to repeat for every request. Better, is to use a shared piece of code to take care of this, hopefully in an easy and intuitive manner for your team to use.

Sadly the reality can be different.
From my own experience, I've seen that many projects only think about the happy path, and do not consider the unhappy path.
Resulting in buggy applications where errors are swallowed, or where the users see an error page.
For projects that also handle the unhappy path, it can be hard to enforce an agreed-upon way of handling requests throughout the codebase.
All of this leads to a bad experience, in the worst case, this leads to frustrated users, damaging the reputation of your application and the team.

### Why `resource` provides a solution

As I've mentioned before, the `resource` method just doesn't simply return the data from the server, instead, the `resource` method returns a [`ResourceRef` object](https://angular.dev/api/core/ResourceRef).
This object contains details about the request and the response in a single object.

To read the response, you can use the `value()` Signal.
Additionally, `ResourceRef` also provides properties to create a good UI, such as the request state ([`ResourceStatus`](https://angular.dev/api/core/ResourceStatus)) and the error when the request has failed. It also adds useful methods to access all of this information, which makes it developer-friendly.

### How you can use `resource` to improve the user experience

Now that we have an understanding of how to fetch data using the `resource` method, let's see how it can improve the user experience of your application.

Using the properties of the `ResourceRef` object, you can easily show the user what's happening (or what has happened) with the request.
In the example below:

- the user sees when a request is loading using the `isLoading()` method;
- or when the request has failed by checking the `error()` method;
- you can also notice that it's simple to add a retry button to retry the request, or to refresh stale data.

Lastly, to show the user the data, you can use the `value()` method to display the response result.

```razor:title=weather-forecast.component.html
<button (click)="refresh()">Refresh forecast</button>

<!-- Check on error, and display the error message -->
@if (weatherforecastResource.error()) {
  <div>{{ $any(weatherforecastResource.error()).message }}</div>
  <div><button (click)="refresh()">Retry</button></div>
}
@else {
  <!-- Make it obvious that something is happening in the background -->
  @if(weatherforecastResource.isLoading()) {
    <div>Loading...</div>
  }

  <!-- Display the results -->
  @if(weatherforecastResource.hasValue()) {
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>TemperatureC</th>
          <th>TemperatureF</th>
          <th>Summary</th>
        </tr>
      </thead>
      <tbody>
        @for (forecast of weatherforecastResource.value(); track forecast.date)
        {
          <tr>
            <td>{{ forecast.date | date }}</td>
            <td>{{ forecast.temperatureC }}</td>
            <td>{{ forecast.temperatureF }}</td>
            <td>{{ forecast.summary }}</td>
          </tr>
        }
      </tbody>
    </table>
  }
}
```

### Conclusion

In this article, I've shown you how you leverage the new `resource` API to improve the user experience of your application.
To do this, I highlighted the importance of handling the request state properly, and how `resource` can help you with that.

Instead of having your users stare at a blank screen, `resource` makes it simpler to show a loading indicator, an error message, and even a retry mechanism to the user.
For these tasks I used the built-in properties of a `ResourceRef`.

Not only does this improve the user experience of your application, it also increases the developer experience and productivity.
Having a built-in way to handle requests within the Angular framework makes it easier to enforce a consistent way of handling requests throughout your codebase.

I recommend reading the articles I mentioned at the beginning of this article, as they provide a good overview of the technical aspects of the `resource` API.
These articles also provide an in-depth explanation of how to make full use of the `resource` API using examples.

The takeaway of this article is that you should not just simply replace observable streams with the `value()` signal, but also take advantage of the other built-in methods.
