---
title: Why writing integration tests on a C# API is a productivity booster
slug: why-writing-integration-tests-on-a-csharp-api-is-a-productivity-booster
description: Time-consuming tasks that can be prevented with integration tests.
author: Tim Deschryver
date: 2020-06-08
tags: .NET, csharp, testing
banner: ./images/banner.jpg
bannerCredit: Photo by [Aron Visuals](https://unsplash.com/@aronvisuals) on [Unsplash](https://unsplash.com)
published: true
---

Writing integration (or functional) tests on a C# API gives more confidence in the code that is written, in addition, it increases the productivity during all stages of development. See [How to test your C# Web API](/blog/how-to-test-your-csharp-web-api) on how I write my integration tests.

### Manual tests

During the development phase, an API endpoint needs to be tested. Writing unit tests just on the business logic isn't good enough, because most systems also need to interact with external pieces and things can go wrong here. It's for this reason that the whole flow needs to be tested. We need to verify that a trigger (an HTTP request) results in the expected effect (data is persisted in a database or that a service is invoked). Without having an integration test, this test needs to be performed manually and besides being time-consuming it's boring and therefore, a mistake is easily made.

We have experienced this ourselves, repeatedly. After a small database change we assumed it wouldn't break anything ... but it did.
So why didn't we just verified we didn't break anything? Our environment was not easy to boot up, and our end-to-end tests took a while.
Luckily for us, most issues were caught during our CI on the server; but this also usually resulted that another dev "wasted" time to pay attention to the broken build.

In a best-case scenario, tools like [Swagger](https://swagger.io/) or [Postman](https://www.postman.com/) can help to build up the request, but it in the end it's still you that needs to verify that the expected outcome is reached. This step must be repeated when there's a change, and while it's possible to save the previous request in most of the available tools to test endpoints, it's often not properly maintained. Thus, time will be lost again.

The bad scenario is that the API is tested by triggering the request via the actual application.
This can be time-consuming in multiple ways:

- It's required that the whole environment (or most of it) is up
- It's sometimes not easy to trigger the request, for example, stepping through a process, or to fill out a form

With an integration test, a test needs to be written once and only needs to be manually checked once.
It has the added benefit that:

- It's available for the whole team
- Can be tested (and written) separately, apart from the application
- It's fast to run
- No extra tooling needs to be used

### Test setup

Writing unit tests usually means mocking or stubbing an interface in the application.
For more complex scenarios, this setup can be long and will become unreadable over time.
If the setup is hard and unmaintainable, then how do we know that the cause of a bug lies in the code or that it's the test setup that is wrong?
I've even made mistakes in easy setups, and spend hours to figure out why my test wouldn't turn green. Often, when I called another developer for help, she pointed out the mistake in no-time.

While writing integration tests, less time will be spent on the setup, not only how to write it (with some discussions) but also the maintenance cost will be lower.
With an integration test, there's just one case when an interface needs to be mocked. When it communicates with the "real world".
For example, an email that is sent or a 3rd party service that needs to be invoked.

Because it's impossible to influence the behavior of that interface, we can only expect it to do its job when given a correct input. This is something that we have control over, and this is what we test in these cases.
For all of the remaining cases, just use the real implementation of that interface.
A database is **not** a layer that has to mocked, it's a crucial part of the system.

### Refactoring

During a refactor, it's not recommended to modify the codebase and the test specs at the same time.
How else do you make sure that the refactor didn't cause regression?

Choosing the right level of abstraction is hard and can result in brittle tests.
When was the last time that you refactored an implementation or switched between two libraries, resulting in failing tests?
When this happens, it means that the level of abstraction isn't right or that implementation details are under test.

Both causes aren't a joy to work with and are prolonging the development time of a refactor. Sometimes, it even postpones or blocks a needed refactor because no one wants to touch it.
On the contrary, integration tests don't care about implementation details.
The system just has to do what it's supposed to do, and this is verified by asserting on the output of the system.

### Unexpected bugs

Upgrading dependencies can result in unexpected bugs that aren't visible at first.
In my case, this was a couple of weeks ago when we upgraded an API from dotnet core 2.1 to dotnet core 3.1.
While most of it worked, we forgot to add an XML transformation to an endpoint.
I'm confident that if there was an integration test on this endpoint, this would've popped up right after the upgrade and could have been resolved quickly. Rather than have surfaced during QA, and harder to reproduce.

With everything already set up, it's pretty easy to reproduce and debug a bug in the system.
Just write a new request and you're good to go.
You can even quickly change from environment to reproduce that bug.

### Code coverage

If code coverage is your thing, you will like integration tests.
Because the whole system (from top to bottom) is under test, you can reach a high percentage number with just one test.
If there are none integration tests, just start with the simple happy paths and add extra specs where or when they are necessary.
A good candidate would be when a part of the API continually receives some patchwork to fix bugs.

### Conclusion

If you haven't noticed, I really like writing integration tests for a C# API. I think it allows us to focus on what is important, a working system. It gives me the confidence that the API works as expected when it's released.

Even when the internals are modified, I can just run the integration tests to make sure I didn't accidentally break something. This is something that unit tests can't give me and has often gone wrong in the past. Perhaps, the projects I worked on didn't have the best test setups, but in my opinion integration tests are just easier and faster to write, and are less vulnerable to human mistakes. If the pit of success is wider, then why not take advantage of it.
Does it prevent bugs? Sadly not... as Dijkstra, said "Program testing can be used to show the presence of bugs, but never to show their absence!".
