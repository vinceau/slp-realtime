# API

`slp-realtime` exposes two different ways to interface with event subscription.


## 1. JSON Config API

> easy to use but limited in power

The [JSON Config API](./json-config.md) is recommended for people uncomfortable with Javascript or those unfamiliar with [RxJS](https://rxjs-dev.firebaseapp.com/guide/overview) or [Functional reactive programming](https://en.wikipedia.org/wiki/Functional_reactive_programming).

Using this API, you define all the events you want to subscribe to in a single JSON object. You then write a single handler function which determines what code to execute depending on what event gets emitted.

[Click here](./json-config.md) to read the JSON Config API docs.

## 2. RxJS Observable API

> extremely powerful but complex

The [RxJS Observable API](./observables.md) is recommended for those who have used [RxJS](https://rxjs-dev.firebaseapp.com/guide/overview) in the past, those who are confident in their JS skills, or anyone who's up for a challenge.

Using this API, you subscribe to each event you want manually using an observable's `subscribe()` method. You should use the RxJS `pipe()` operator to filter down to the exact event that you want, before subscribing. You specify the handler function for each individual event.

[Click here](./observables.md) to read the RxJS Observable API docs.
