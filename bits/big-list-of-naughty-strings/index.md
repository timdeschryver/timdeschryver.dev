---
title: Big List of Naughty Strings
slug: big-list-of-naughty-strings
date: 2023-08-08
tags: libraries, security
---

# Big List of Naughty Strings

Does your application correctly handle all kinds of input correctly?
Do you need some inspiration to test your application with some edge/special cases?

Look no further, the [Big List of Naughty Strings](https://github.com/minimaxir/big-list-of-naughty-strings) is here to help you!
There are different sets of inputs, from the boring "Reserved Strings" and "Special Characters" cases to the more interesting variants like "(Server and Client) Injections", "Unicode fonts", "Known CVEs and Vulnerabilities", "Special Filenames", and more.

Take a look at the repository and start copy-pasting some of the strings in your application, or use one of the libraries (e.g. [NaughtyStrings](https://github.com/SimonCropp/NaughtyStrings) for .NET, or [blns](https://www.npmjs.com/package/blns) for Node.js ) to automate this process.

Fun fact: I couldn't generate the banner for this bit (in various tools) because it contained a few naughty strings that broke the export.

For the entire set see [big-list-of-naughty-strings/blns.txt](https://github.com/minimaxir/big-list-of-naughty-strings/blob/master/blns.txt), here's a small sample:

```txt:big-list-of-naughty-strings.txt
null
0,,0

<foo val=“bar” />
찦차를 타고 온
❤️ 💜 💛 💚 💙
⒯⒣⒠ 𝒒𝒖𝒊𝒄𝒌 𝕓𝕣𝕠𝕨𝕟 𝖋𝖔𝖝 𝖏𝖚𝖒𝖕𝖘 𝕠𝕧𝕖𝕣 𝕥𝕙𝕖 𝖑𝖆𝖟𝖞 ｄｏｇ
(｡◕ ∀ ◕｡)
<img src=x onerror=alert(2) />
'; EXEC sp_MSForEachTable 'DROP TABLE ?'; --
{{ "".__class__.__mro__[2].__subclasses__()[40]("/etc/passwd").read() }}
h̖̯͓o̝͙̖͎̱̮ ҉̺̙̞̟͈W̷̼̭a̺̪͍į͈͕̭͙̯̜t̶̼̮s̘͙͖̕ ̠̫̠B̻͍͙͉̳ͅe̵h̵̬͇̫͙i̹͓̳̳̮͎̫̕n͟d̴̪̜̖ ̰͉̩͇͙̲͞ͅT͖̼͓̪͢h͏͓̮̻e̬̝̟ͅ
```
