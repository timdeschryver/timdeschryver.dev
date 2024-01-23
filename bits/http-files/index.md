---
title: Http Files
slug: http-files
date: 2023-08-01
tags: devtools, developer-experience
---

# HTTP Files

`.http` files are a simple way to quickly invoke your API endpoints because you don't have to leave your IDE to use a separate tool.
I use it regularly when I'm building a new feature.

You can commit this file to your repository so that your teammates can also make use of it!

HTTP files are supported by most IDEs (for Visual Studio Code, you'll have to install the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extensions), the only caveat is that the variables syntax is (currently) different between Visual Studio products and JetBrains products.

Here's an example of a `.http` file for a Todo API:

```http:todoitems.http
@base=https://localhost:5167

### Create a new item

POST {{base}}/todoitems
Content-Type: application/json

{
  "id": "{{$guid}}",
  "name":"walk dog",
  "isComplete":false
}

### Get All items

GET {{base}}/todoitems

### Update item

PUT {{base}}/todoitems/1
Content-Type: application/json

{
  "id": 1,
  "name":"walk dog",
  "isComplete": true
}

### Delete item

DELETE {{base}}/todoitems/1
```

For more information, check out the documentation for the various IDEs:

- [Visual Studio](https://learn.microsoft.com/en-us/aspnet/core/test/http-files)
- [Visual Studio Code (HTTP extension)](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- [JetBrains Rider](https://www.jetbrains.com/help/rider/Http_client_in__product__code_editor.html)
- [JetBrains WebStorm](https://www.jetbrains.com/help/webstorm/http-client-in-product-code-editor.html)
