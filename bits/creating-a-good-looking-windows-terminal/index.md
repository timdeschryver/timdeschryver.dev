---
title: Creating a good-looking Windows Terminal
slug: creating-a-good-looking-windows-terminal
date: 2024-03-19
tags: windows, developer-experience
---

# Creating a good-looking Windows Terminal

As a developer, I spend a "lot" of time in the terminal.
I use it to run various other commands ranging from navigating to folders, running my environment, executing git commands, ...

I want my terminal to be a place that I enjoy spending time in.
I want it to be a place where I can be productive.

With my daily driver, the [Windows Terminal](https://learn.microsoft.com/en-us/windows/terminal/), I can make it look good and be productive at the same time.
The Windows Terminal is highly customizable, and I make use the following tools to make it look good:

- [Powershell](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell-on-windows?view=powershell-7.4): the default shell. The Windows terminal also supports other shells.
- [Oh My Posh](https://ohmyposh.dev/docs/installation/windows/): Make use of one of the beautiful looking themes that are available (or create your own), and add "Segments" to add more information to your prompt. For example, the current git branch (including changes), the .NET/Node.js version, the current Spotify song, ...
- [Nerd Fonts](https://ohmyposh.dev/docs/installation/fonts): to make sure that the icons are displayed correctly.
- [Terminal-Icons](https://github.com/devblackops/Terminal-Icons?tab=readme-ov-file#installation): display icons to known directories and files to make the terminal more visually appealing.
- [Predictive Intellisense](https://github.com/PowerShell/CompletionPredictor?tab=readme-ov-file#use-the-predictor): to get suggestions for commands => this boosts my productivity.

Some bonus tips:

- You can open multiple tabs and screens in the terminal.
- Use the [Quake mode](https://learn.microsoft.com/en-us/windows/terminal/tips-and-tricks#quake-mode) to open the terminal (which has the focus) on top of your screen with a hotkey.
- Via the settings, you can customize the colors (including the background) and shortcuts to your preference.

I hope this helps you to make your terminal a place where you enjoy spending time in.
For more tips and tricks you can check out my blog [How I've set up my new Windows development environment (2022)](../../blog/how-i-have-set-up-my-new-windows-development-environment-in-2022/index.md), or one of Scott Hanselman's [blog posts about customizing the Windows Terminal](https://www.hanselman.com/blog/googleresults.html?&sa=Search&domains=www.hanselman.com&sitesearch=www.hanselman.com&client=pub-7789616507550168&forid=1&ie=UTF-8&oe=UTF-8&safe=active&cof=GALT%3A%23B47B10%3BGL%3A1%3BDIV%3A%23A9501B%3BVLC%3A6F3C1B%3BAH%3Acenter%3BBGC%3AFFFFFF%3BLBGC%3A336699%3BALC%3AB47B10%3BLC%3AB47B10%3BT%3A000000%3BGFNT%3AA9501B%3BGIMP%3AA9501B%3BFORID%3A11&hl=en&q=windows%20terminal).
