---
title: Writing a dev.to blog post with VSCode
slug: writing-a-devto-blog-post-with-vscode
published: true
description: Writing and publishing a dev.to blog post directly within VSCode
tags: vscode, writing, showdev, blogging
banner: ./images/banner.jpg
author: Tim Deschryver
date: 2019-06-12T09:49:07.686Z
---

Today, I present you [📝 New Blog Post](https://marketplace.visualstudio.com/items?itemName=timdeschryver.new-blog-post) a simple way to create and publish [dev.to](https://dev.to) blog posts from within Visual Studio Code.

## Installation

To install the or search for `📝 New Blog Post` in the extensions go to the marketplace https://marketplace.visualstudio.com/items?itemName=timdeschryver.new-blog-post.

## Writing a dev.to post

The default template of this extension is the `dev.to` template. To create create a new blog post, right click in the explorer or use the command palette and select `📝 New Blog Post`

![Gif on how to create a new blog post](https://raw.githubusercontent.com/timdeschryver/new-blog-post/master/other/new-blog-post.gif)

## Publishing to dev.to

In order to be able to publish your post to `dev.to`, you have to first create an API access token.
You can create one at [https://dev.to/settings/account](https://dev.to/settings/account). Once you have your token copy paste the token in your VSCode settings with the `post.publishToken` setting:

```json
{
  "post.publishToken": "jbVJ8mwfY2WrPUGfDWjx4xxB"
}
```

> To add this to your config, search via the command palette for settings

When you have added the token to your settings, go back to your post and you can use the `🚀 Publish to dev.to` command in the command palette.

![Image showing how to publish to dev.to](https://raw.githubusercontent.com/timdeschryver/new-blog-post/master/other/publish-dev-to.png)

## Why

I created this extension to get familiar with VSCode extensions.

Also, my workflow to write my blog posts is to:

- write them within VSCode
- publish them to GitHub
- there's a [now](https://zeit.co/now) trigger that automatically deploys a new version to [timdeschryver.dev](https://timdeschryver.dev)
- manually cross-post on dev.to

To make it a little bit easier to myself, I think this extension is a good addition to save a few minutes 🙂.

## More info

For more info and the source code of this extension, go to the [GitHub repo](https://github.com/timdeschryver/new-blog-post)
