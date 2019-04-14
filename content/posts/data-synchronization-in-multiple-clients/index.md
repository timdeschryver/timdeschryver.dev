---
title: Data synchronization in multiple clients
slug: data-synchronization-in-multiple-clients
description: >-
  Often when working with a CRUD heavy application you find yourself or someone else asking the question, what should be done when multiple…

author: Tim Deschryver
date: '2018-05-28T18:40:12.485Z'
tags:
  - Angular
banner: './images/banner.jpg'
bannerCredit: 'Photo by [Scott Webb](https://unsplash.com/@scottwebb) on [Unsplash](https://unsplash.com)'
published: true
publisher: ITNEXT
publish_url: https://itnext.io/ngrx-data-synchronization-in-multiple-clients-df07785c0188
---

Often when working with a CRUD heavy application you find yourself or someone else asking the question, what should be done when multiple users (admins) are modifying the same data.

Let’s cut to the chase and explore the options we have.

### Real-time messaging

One approach would be use web sockets that allows to receive messages from the server. This would mean if user Bob would edit a record and once it’s processed on the server, every connected client (user) would receive the updated record. This way everyone has the latest version of the record.

Once the client receives the message from the server it should be dispatched in order to update the application state. The update part could be done manually but this is where [@ngrx/entity](https://github.com/ngrx/platform/tree/master/docs/entity) shines in my opinion, and here is why.  
I would recommend to use the following data structure for the message, where the payload is an entity.

```ts
{
   type: "update_user",
   payload: {
     ...
   }
}
```

When the client receives the message, it creates an `Action` from the message.  
This action will be then dispatched to make the change available in the whole application.

```ts
this.store.dispatch(new UpdateUser(message.payload))
```

In the reducer we use the [@ngrx/entity](https://www.youtube.com/watch?v=JmnsEvoy-gY) adapter to upsert (insert or update) the entity.

```ts
switch (action.type) {
  ...
  case UserActionTypes.UPSERT_USER:
    return adapter.upsertOne(action.payload.user, state);
  ...
}
```

I’m using `upsert` because the message received from the server contains a user object. If the server would return a partial user, we can just update the properties that are changed by using the update method.

```ts
switch (action.type) {
  ...
  case UserActionTypes.UPDATE_USER:
    return adapter.updateOne(
      {
        id: action.payload.user.id,
        changes: action.payload.user
      },
      state);
  ...
}
```

Note that it’s also possible to upsert/update multiple records at once with `upsertMany` or `updateMany`.

> Remember to use a clear and helpful name for your actions - see Mike Ryan’s talk at ng-conf about [good action hygiene](https://www.youtube.com/watch?v=JmnsEvoy-gY)

### Refresh client-side

If you don’t have the infrastructure to set up real-time messaging another solution might be to let the client refresh every x seconds or on specific user actions.

This has the downside that you might end up making unnecessary HTTP requests on every client that is running the application.

### Locking

An other option might be to lock the edit screen. This means that once a user opens a screen, this screen will be read-only for everyone else. Once the user is done editing, the screen will become free to use again.

This might be a simple solution, but this is also my least favorite one because of several points:

- users might accidentally lock screens that others need
- the user keeps waiting till the screen becomes free
- it could be possible that different unexpected scenarios might keep the screen locked for no reason, for example if a user loses hes connection or if the computer is shut down for any reason.

In short, the user experience is terrible.

### Versioning

In this fourth solution we’re going to take a look at versioning. With versioning you’re extending the entity with a version number (think event sourcing). This version number will be send from the server to the client (read), and will also be send from the client to the server (save). Before processing the save action, the server checks if both the version numbers match. If the server receives an unexpected version number from the client, the server doesn’t process the requests and notifies the user.

I’m liking this approach more than the locking approach because the user can just continue doing their job, and the odds that two users are editing the same entity at once are next to nil (?). If it does occur, the user can edit the now updated entity. But it is also perfectly possible to process or partially process the save action if the modified data isn’t important. Or even let the user decide which modifications are prior, think of a merge screen for the user.

This post is just to briefly explore the options one has to synchronize data between clients. I didn’t have the time to provide examples, but these could be added afterwards, when needed.

### Not to miss

[Announcing the Release of NgRx 6, New Projects, and Looking Ahead](https://medium.com/ngrx/announcing-the-release-of-ngrx-6-new-projects-and-looking-ahead-5fc30bed260b)
