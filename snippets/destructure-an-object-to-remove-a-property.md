---
title: Destructure an object to remove a property
slug: destructure-an-object-to-remove-a-property
image: snippets/images/destructure-an-object-to-remove-a-property.png
date: 2020-01-28
tags: javascript
---

## Destructure an object to remove a property

### Use case

I want to delete a property from an object in a pure (immutable) way.

### Solution

Use a destructuring assignment to assign the to be removed property to a variable, while cloning the "rest" properties to a new variable.
The `_` is used to prevent a linter giving the warning "variable is declared but its value is never read".

```ts
const { password: _, ...user } = {
  id: 47,
  username: 'tim',
  password: 'iliketrains',
}

console.log(user)
// |> { id: 47, username: 'tim' }
```

For more examples see [Destructuring assignment on MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
