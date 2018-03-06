---
title: typeful-redux - A look under the covers
summary: A look at the type-level proramming tricks used in typeful-redux
date: 2018-03-04
---

In the [last post] I announced my library [typeful-redux], a fully
type-safe, low boilerplate redux wrapper for TypeScript. The library
achieves full type safety while allowing very concise application code
by pulling some neat tricks with TypeScript's type system. In this post
I want to take a closer look at these tricks.

## The Goal

Before looking at how [typeful-redux] leverages TypeScript's type system,
it is instructive to consider what the actual goal of the library is. typeful-redux wants to

  - give a fully type-safe redux wrapper, meaning that the type of the created
    store must be as informative as possible. That means in particular that the
    dispatch function must be fully typed so that all dispatches can be
    type-checked and we can't dispatch actions that do not have a reducer.

  - reduce the boilerplate required to configure actions and reducers.

The type of the store looks as follows. `STORE_STATE` and `STORE_DISPATCH` are
the generic type parameters that we want to fill out with the *right* types:

```TypeScript
type Store<STORE_STATE, STORE_DISPATCH> {
    getState(): STORE_STATE;
    dispatch: STORE_DISPATCH;
    // I'll leave this out going forward because it is boring
    subscribe(() => void): () => void;
}
```

As an example, if we create a store with a single reducer that we give the name `todos` and has state `TodoItem[]` and the single action
`add`, the full store type will look as follows:

```TypeScript
interface TodoItem {
    task: string;
    completed: boolean;
}

// Create a new reducer with initial state [] and action 'add'
const TodoReducer = createReducer([] as TodoItem[])
    ('add', (s, payload: string) => [
        ...s,
        { task: payload, completed: false }
    ]);

// Create the store
const store = new StoreBuilder()
    .addReducer('todos', TodoReducer)
    .addMiddleware(reduxLogger) // as example
    .build();

// store has the following type:
type StoreType = {
    getState(): {
        todos: TodoItem[];
    };
    dispatch: {
        todos: {
            add(payload: string): void;
        }
    }
};
```

So in this case `STORE_STATE` should be inferred to be `{ todos: TodoItem[]; }`
and `STORE_DISPATCH` should be inferred to be

```TypeScript
todos: {
    add(payload: string): void;
}
```

## Giving `getState()` the Right Type

Let's start with a look at how we can give `getState()` the right
type. This is easier than getting the `dispatch` object to look right
but it leverages the same tricks, so it's a good place to start. While
pulling out the types from the library, I'll leave off parts which are not
relevant for the current discussion to make following a bit easier.

The first part is pretty simple: the `createReuducer` function takes
an initial state and returns a `Reducer` which has a `getInitial()`
method that returns this state. So basically the state parameter `REDUCER_STATE` flows right through `createReducer`.

```TypeScript
type Reducer<REDUCER_STATE, /* ... */> = {
    getInitial(): REDUCER_STATE;
    // ...
};

const createReducer =
    <REDUCER_STATE>(s: REDUCER_STATE): Reducer<REDUCER_STATE> => {
        // ...
    };

```

Next comes the `StoreBuilder` which takes a `Reducer` and a `reducerName`
under which the reducer's state and dispatch functions will become
availabe once the store is created via the `build` method:

```TypeScript
class StoreBuilder<STORE_STATE = {}, /* ... */> = {
    addReducer<REDUCER_NAME extends string, REDUCER_STATE, /* ... */>(
        reducerName: REDUCER_NAME,
        reducerBuilder: Reducer<REDUCER_STATE, /* ... */>
    ): StoreBuilder<STORE_STATE & { [name in REDUCER_NAME]: REDUCER_STATE }, /* ... */>

    build(): Store<STORE_STATE, /* ... */>;
}
```

Here things become a little more interesting: `StoreBuilder` has a
type parameter `STORE_STATE` which tracks the state of the store.
We can see this because it is the first
type parameter to `Store` which `build` returns.

Now comes the first trick: When another reducer is added, `addReducer` takes
the `reducerName` (in the example above, this is `'todos'`) for which it
infers the type `REDUCER_NAME` which is a subtype of `string`. Specifying the type parameter in this way, `REDUCER_NAME` will be inferred to be the string itself. So if we call `addReducer('todos', TodosReducer)`, then `REDUCER_NAME` is inferred to be the type `'todos'`. This will be useful in a minute.

The second trick is to extract the type of the state from the `Reducer`. This
is realtively easy, `addReducer` has a second type parameter `REDUCER_STATE` which is the first type parameter to `Reducer`, this way `REDUCER_STATE` will be inferred to the type of the `Reducer`'s state.

The third trick now brings these things together by returning a `StoreBuilder`
with a new type. The type parameter `STORE_STATE` of `StoreBuilder` now becomes
`STORE_STATE & { [name in REDUCER_NAME]: REDUCER_STATE }`. As stated above `REDUCER_NAME` will have been inferred to the
`reducerName` and `REDUCER_STATE` to the state type of the reducer. Thus `{ [name in 'todos']: REDUCER_STATE }`
is basically `{ todos: REDUCER_STATE }` and intersecting the *store state type so far* (`STORE_STATE`) with `{ todos: REDUCER_STATE }`
basically means *give `STORE_STATE` also the property `'todos'` with type `REDUCER_STATE`*.

By combining these methods as described above we can extend the state parameter
with each `addReducer` call so that we can always give `getState()` the right
return type.


## Building a Fully-Typed Dispatch Object

Hopefully the discussion for `getState()` was somewhat easy to follow. To give
`dispatch` the right types we will use the exact same tricks but we need to
go through one more level of indirection.

Let's go back to `Reducer` and `createReducer` where we have left of the most
interesting parts. A more complete type of `Reducer` looks as follows (I still
leave off some parts for clarity, but there are no type tricks involved there,
they are just there for convenience, so we're not missing anything by not
discussing them):

```TypeScript
type Reducer<REDUCER_STATE, REDUCER_DISPATCH = {}> = {
    // for adding setters, these are actions without a payload
    <HANDLER_NAME extends string>(
        name: HANDLER_NAME,
        handler: (state: REDUCER_STATE) => REDUCER_STATE
    ): Reducer<REDUCER_STATE, REDUCER_DISPATCH & Dispatch0<HANDLER_NAME>>;

    // for adding handlers, these are actions with a payload
    <HANDLER_NAME extends string, PAYLOAD>(
        name: HANDLER_NAME,
        handler: (state: REDUCER_STATE, payload: PAYLOAD) => STATE
    ): Reducer<REDUCER_STATE, REDUCER_DISPATCH & Dispatch1<HANDLER_NAME, PAYLOAD>>;

    // ...
};

type Dispatch0<HANDLER_NAME extends string> = {
    [name in HANDLER_NAME]: { (): void; }
};

type Dispatch1<HANDLER_NAME extends string, PAYLOAD> = {
    [name in HANDLER_NAME]: { (payload: PAYLOAD): void; }
};
```

So we see that `Reducer` has two generic type parameters:
`REDUCER_STATE` is the type off the state as we have seen previously and `REDUCER_DISPATCH` is the final type of the dispatch functions that we are interested in (this is what `StoreBuilder` will use to assemble the type of the dispatch object).

There are two different call signatures, the first one is for adding
actions which don't need a payload (I call them `setters` here) and the
second one is for actions which do need a payload (called `handlers`).
They serve essentially the same purpose, but for type inference reasons,
it is necessary to have two different signatures.

Let's focus on the second signature, as both work essentially the same
way. Really what we are doing here is we're using the same trick as when
building up the full store state type to build up the type of the dispatch
functions on this reducer. So let's look again at our example of creating
a really simple reducer:

```TypeScript
const TodoReducer = createReducer([] as TodoItem[])
    ('add', (s: TodoItem[], payload: string) => /* ... */)
```

so `name` is `'add'`, `REDUCER_STATE` is `TodoItem[]` and `PAYLOAD` is `string`. As before, the type parameter `HANDLER_NAME` will be inferred to be just `'add'`. We then return a `Reducer<REDUCER_STATE, REDUCER_DISPATCH & Dispatch1<HANDLER_NAME, PAYLOAD>>`, substituting
the parameters `REDUCER_STATE = TodoItem[]`, `REDUCER_DISPATCH = {}`, `HANDLER_NAME = 'add'` and `PAYLOAD = string` we get

```TypeScript
Reducer<REDUCER_STATE, REDUCER_DISPATCH & Dispatch1<HANDLER_NAME, PAYLOAD>>
= Reducer<TodoItem[], {} & Dispatch1<'add', string>>
= Reducer<TodoItem[], {} & { [name in 'add']: { (payload: string): void } }>
= Reducer<TodoItem[], { [name in 'add']: { (payload: string): void } }>
= Reducer<TodoItem[], { add: { (payload: string): void } }>
= Reducer<TodoItem[], { add(payload: string): void; }>
```

So now the `DISPATCH` type parameter is `{ add(payload: string): void; }`, thus
a single function with name `add` that accepts a `string` and returns `void`.
It might be instructive to run through these substitutions one more time
with a second handler.

Let's instead look at how `StoreBuilder` uses this information to build up
the type of the full dispatch object. Going back to this definition,
we'll see that `StoreBuilder` also has a second type parameter which
is the type of the dispatch object.

```TypeScript
class StoreBuilder<STORE_STATE = {}, STORE_DISPATCH = {}> {
    public addReducer<REDUCER_NAME extends string, REDUCER_STATE, REDUCER_DISPATCH>(
        reducerName: REDUCER_NAME,
        reducerBuilder: Reducer<REDUCER_STATE, REDUCER_DISPATCH>
    ): StoreBuilder<
        STORE_STATE & { [name in REDUCER_NAME]: REDUCER_STATE },
        STORE_DISPATCH & { [name in REDUCER_NAME]: REDUCER_DISPATCH }
    > { /* ... */ }
```

Looking at the `addReducer` method again, we see that `StoreBuilder`
uses the exact same mechanism to extend the type of the store dispatch
object as it uses for the type of the store state. Using the `Reducer`
from above, let's look at how the types get inferred in this example

```TypeScript
// TodoReducer has type Reducer<TodoItem[], { add(payload: string): void; }>

new StoreBuilder()
    .addReducer('todos', TodoReducer)
```

Recall that `REDUCER_NAME` is inferred to be `'todos'`, `REDUCER_STATE` is inferred as `TodoItem[]`
and `REDUCER_DISPATCH` is inferred as `{ add(x: string): void; }`. The resulting
`StoreBuilder` type will thus be

```TypeScript
StoreBuilder<
    {} & { [name in REDUCER_NAME]: REDUCER_STATE },
    {} & { [name in REDUCER_NAME]: REDUCER_DISPATCH }
>
= StoreBulider<
    { [name in 'todos']: TodoItem[] },
    { [name in 'todos']: { add(payload: string): void; } }
>
= StoreBulider<
    { todos: TodoItem[] },
    { todos: { add(payload: string): void; } }
>
```

When invoking the `build` method, we will get a store with the following type

```TypeScript
type StoreType = {
    getState(): {
        todos: TodoItem[];
    };
    dispatch: {
        todos: {
            add(x: string): void;
        }
    }
};
```

Which is the goal that we started out with. I'm not really sure how to
conclude this post, but I think it is pretty cool that by leveraging
three simple tricks we can get a type inferred where it is at first
surprising that you can actually do this.


[last post]: /posts/announcing-typeful-redux.html
[typeful-redux]: https://github.com/paulkoerbitz/typeful-redux