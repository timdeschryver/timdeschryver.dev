---
title: Enable shell scripts for the JetBrains Toolbox App
slug: enable-shell-scripts-for-the-jetbrains-toolbox-app
description: How to open your JetBrains IDEs that are installed via the JetBrains Toolbox directly from the command line.
author: Tim Deschryver
date: 2022-06-24
tags: JetBrains, Windows
---

The [JetBrains Toolbox App](https://www.jetbrains.com/toolbox-app/) makes it easy to install JetBrain products and keep
them updated.
One caveat of using the Toolbox App, is that your shell scripts might not work anymore.
Luckily, there's a two-step process to configure the Jetbrains Toolbox App to work with your shell scripts.

As a workaround, open up the JetBrains Toolbox App Settings, enable the "generate shell scripts" option
and set the "Shell scripts location" to a folder of your choice.

For reference, I created a `.jetbrains` folder within my user folder.

```txt
C:\Users\{user}\.jetbrains
```

![Configure shell scripts within the JetBrains Toolbox App](./images/toolbox.png)

You can check if everything went well by opening the specified folder.
It should contain all the JetBrains products.

![Toolbox showing the JetBrains products](./images/toolbox.png)

Lastly, create a new PATH environment variable and point it to the same folder.

Restart your shell and you should be able to open the JetBrains IDEs from the command line.

As a bonus, you can also rename the shell scripts to custom names.
For example, I've configured WebStorm to start with the `ws` command.
To do this, go to the settings of the tool, scroll to the bottom, and rename the shell script name.

![The WebStorm settings with the modified shell script name](./images/webstorm.png)
