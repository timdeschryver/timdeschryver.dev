---
title: Load testing
slug: load-testing
date: 2024-04-02
tags: tools, performance
---

# Load testing

**To measure is to know.**
As a developer, it's crucial to evaluate your system's capability for building robust and reliable software applications.

Load testing is a key aspect of this evaluation process.
It helps you understand how your system performs under varying loads, from real-world loads to anticipated peak load conditions.
By subjecting your system to different levels of load, you can identify potential performance bottlenecks, stability issues, and scalability concerns.
This information is invaluable for optimizing your system, ensuring it can handle the expected user loads resulting in a positive user experience and preventing system failures under high loads.

## Why is Load Testing Important?

- **Performance Optimization**: Load testing helps identify the (maximum) operating capacity of an application, any bottlenecks or weak points in your system, and determine which element is causing degradation. This can help you optimize the performance of your application.
- **Regression Testing**: Load testing helps you to identify performance trends in your application. By introducing tests you can ensure that new features or changes do not negatively impact the performance of your application.
- **Scalability Planning**: Measuring is knowing. You can plan the infrastructure better when you know the number of users your application can handle and act accordingly.
- **Improved User Experience**: By ensuring that your application can handle expected user loads, you can provide a better user experience. Slow or unresponsive applications can lead to user dissatisfaction.

## Why Invest Time in Load Testing?

Investing time in load testing is a preventive measure to ensure system readiness and performance capability. It’s about being proactive rather than reactive. Without proper load testing, your application could fail spectacularly at the worst possible time - when there are maximum users on the system.

In conclusion, load testing is not just a one-time task but a crucial part of the continuous delivery process. It ensures that your application will perform well under pressure, providing a seamless experience for your users, and ultimately, contributing to the success of your software or application.

## How to Perform Load Testing?

There are several tools available for load testing, here are a few that I've used in the past:

- [Bombardier](https://github.com/codesenberg/bombardier): a simple CLI tool for load testing a single URL. Useful for quick tests, for example, to test the configured [Rate limiting](../../bits/rate-limiting-in-aspnet/index.md) on an API. East to configure.
- [Artillery](https://artillery.io/): define test scenarios with various load phases using YAML. Artillery has a built-in [Playwright engine](https://www.artillery.io/docs/reference/engines/playwright). Easy to configure in your CI/CD pipeline.
- [K6](https://k6.io/): write test scripts in JavaScript. It has a (paid) cloud service for running tests at scale. Easy to be added to your CI/CD pipeline. K6 has a useful browser extension to record user flows.
- [Apache JMeter](https://jmeter.apache.org/): for if you like a GUI to create and execute tests. A battle-tested tool.
