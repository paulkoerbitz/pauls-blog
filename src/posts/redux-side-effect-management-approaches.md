---
title: A look at Redux side effect management approaches
summary: An overview over the many different side management approaches with redux
date: 2018-04-08
draft: true
---

Using redux one starts to discover pretty soon that it is apparently
not enough to manage state in frontend applications. While plain redux
works great for coordinating updates to application state one still
needs to deal with side effects, especially managing server interactions.

There seems to be a whole cottage industry of redux side effect management
libraries. Here I want to take a look at the ones that seem most important,
compare their conceptual approach and the pros and cons as I perceive them.

## A working example

To compare the different approaches, I want to establish a working example
to illustrate how the different approaches fare. As an exmple we'll use
the subreddit client from the redux docs.

## Bare Metal

First of all there is the possibility to - grasp - *not actually use a side effect management library*. Yes, you read that right, even though
it seems that everyone is using one thing or another even spending weeks swapping out one thing or another, you might want to think
twice if you actually need such a thing. Hey, [even Dan Abramov supports][dan-abramov-no-thunk] this approach.

In the bare metal appraoch, we write the async effect handeling in functions
handeling the async-ness. For example:

```TypeScript
async fetchSubreddit(dispatch: Dispatch, subbreddit: string) {

}
```

We can pass the dispatch method into these function from our containers, in fact we can even bind dispatvch when we connect them, so that the wrapped component does not have to pass in the `dispatch` function:

```TypeScript
```

### Pros & Cons

The advantage of this approch is IMO that it is straight forward and easy to understand and also quite flexible. Furthermore, it is easy to ensure
full type safety in this code. A disadvantage is that there is no special
support for writing tests and there are no helper functions which facilitate
certain side effect patterns.

## Redux Thunk

The first step up from the bare metal apprach is [redux thunk][redux-thunk]

## Redux Saga

## Redux Observable

## Redux Ship

## And the winner is ...


[dan-abramov-no-thunk]: https://stackoverflow.com/a/34599594/346587
[redux-thunk]: https://github.com/gaearon/redux-thunk
[redux-saga]: https://github.com/redux-saga/redux-saga
[redux-observable]: https://github.com/redux-observable/redux-observable
[redux-ship]: https://github.com/clarus/redux-ship