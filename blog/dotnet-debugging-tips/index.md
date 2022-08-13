---
title: .NET Debugging Tips
slug: dotnet-debugging-tips
description: A collection of tips for debugging .NET applications.
author: Tim Deschryver
date: 2022-06-30
tags: .NET, Visual Studio, Rider
---

A collection of tips for debugging .NET applications.

## Debug Tip #1: Conditional Breakpoints

What: a breakpoint that's only hit when a condition is satisfied  
How: right-click a breakpoint, select Conditions, then write your expressions (with IntelliSense support)  
Why: when you want to debug a specific case in an iteration  
Docs: https://docs.microsoft.com/en-us/visualstudio/debugger/using-breakpoints?view=vs-2022

https://twitter.com/tim_deschryver/status/1526554182513217537

## Debug Tip #2: Data Breakpoints

What: a breakpoint that's only hit every time the value of a variable changes  
How: right-click a variable, click on the "Set Data Breakpoint" menu item  
Why: when you don't know when/how a value is changed  
Docs: https://docs.microsoft.com/en-us/visualstudio/debugger/using-breakpoints

https://twitter.com/tim_deschryver/status/1529097887128248321

## Debug Tip #3: Moving the debug pointer

What: move the debug pointer to another location  
How: drag and drag the debug pointer  
Why: when you want to re-execute a code block, or when you want to step into a different execution path  
Docs: https://docs.microsoft.com/en-us/visualstudio/debugger/navigating-through-code-with-the-debugger

https://twitter.com/tim_deschryver/status/1531623766291275778

## Debug Tip #4: Break on handled exceptions

What: pause the application when there's a (handled) exception (all exception types, or specific)  
How: enable all "Common Language Runtime" (CLR) Exceptions (check the checkbox)  
Why: to easily find the root cause of an issue  
Docs: https://docs.microsoft.com/en-us/visualstudio/debugger/managing-exceptions-with-the-debugger

https://twitter.com/tim_deschryver/status/1534109304919293953

## Debug Tip #5: The immediate window

What: A console where you can quickly jot down code to execute  
How: Visual Studio: Debug > Windows > Immediate (ctrl+alt+i). Rider: Open by default (alt+i to give it focus)  
Why: Execute code to try things out without a restart  
Docs: https://docs.microsoft.com/en-us/visualstudio/ide/reference/immediate-window

https://twitter.com/tim_deschryver/status/1536751232810897411

## Debug Debug Tip #6: The Debugger Display Attribute

What: Configure how an object is represented in a debug window  
How: Add the DebuggerDisplay attribute to your class  
Why: Make it easy to see the important information while debugging  
Docs: https://docs.microsoft.com/en-us/visualstudio/debugger/using-the-debuggerdisplay-attribute

https://twitter.com/tim_deschryver/status/1541760671850692609
