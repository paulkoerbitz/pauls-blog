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
it is instructive to consider what the actual goal is. typeful-redux wants to

  - give a fully type-safe redux wrapper, meaning that the type of the created
    store must be as informative as possible. That means in particular that the
    dispatch function must be fully typed so that all dispatches can be
    type-checked and we can't dispatch actions that do not have a reducer.

  - reduce the boilerplate required to configure actions and reducers.

The type of the store looks as follows. `Store` and `Dispatch` are
the generic type parameters that we want to fill out with the *right* type:

```TypeScript
type Store<State, Dispatch> {
    getState(): State;
    dispatch: Dispatch;
    // I'll leave this out going forward because it is boring
    subscribe(() => void): () => void;
}
```

As an example, if we create a store with a single reducer that gets
a *namespace* of `todos` and, has state `TodoItem[]` and actions
`add`, `clear` and `toggle`, the full store type will look as follows:

```TypeScript
interface TodoItem {
    task: string;
    completed: boolean;
}

// Create a new reducer with initial state [], then add three actions
const TodoReducer = createReducer([] as TodoItem[])
    ('clear', s => [])
    ('add', (s, newItem: TodoItem) => [...s, newItem])
    ('toggle', (s: TodoItem[], index: number) => [
        ...s.slice(0, i),
        { ...s[i], completed: !s[i].completed },
        ...s.slice(i + 1)
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
            add(taskName: string): void;
            clear(): void;
            toggle(taskId: number): void;
        }
    }
};
```

## Giving `getState()` the Right Type

Let's start with a look at how we can give `getState()` the right
type as this is a bit easier but essentially leverages the same
tricks as getting the `dispatch` object to look right. While pulling
out the types from the library, I'll leave off parts which are not
relevant for the current discussion to make following a bit easier.

The first part is pretty simple: the `createReuducer` function takes
an initial state and returns a `Reducer` which has a `getInitial()`
methods that returns this state. So basically the state parameter `S`
flows right through `createReducer`.

```TypeScript
type Reducer<S, /* ... */> = {
    getInitial(): S;
    // ...
};

const createReducer = <S>(s: S): Reducer<S> => {
    // ...
};

```

Next comes the `StoreBuilder` which takes a `Reducer` and a name
storing it internally until its `build` method is invoked which
creates the store.

```TypeScript
class StoreBuilder<X = {}, /* ... */> = {
    addReducer<R extends string, S, /* ... */>(
        reducerName: R,
        reducerBuilder: Reducer<S, /* ... */>
    ): StoreBuilder<X & { [r in R]: S }, /* ... */>

    build(): Store<X, /* ... */>;
}
```

Here things become a little more interesting: `StoreBuilder` has a
type parameter `X` which is the type of full store state. We can
see this because it is the first type parameter to `Store` which
`build` returns.

Now comes the first trick: When another reducer is added, `addReducer` takes
the `reducerName` (in the example above, this is `'todos'`) for which it
infers the type `R` which is a subtype of `string`. Specifying the type
parameter in this way, `R` will be infered to be the string itself. So
if we call `.addReducer('todos', TodosReducer)`, then `R` is inferred to be
the type `'todos'`. This will be useful in a minute.

The second trick is to extract the type of the state from the `Reducer`. This
is realtively easy, `addReducer` has a second type parameter `S` which is
the first type parameter to `Reducer`, this way `S` will be infered to the
type of the `Reducer`'s state.

The third trick now brings these things together by returning a `StoreBuilder`
with a new type. The type parameter `X` of `StoreBuilder` now becomes
`X & { [r in R]: S }`. As stated above `R` will have been inferred to the
`reducerName` and `S` to the state type of the reducer. Thus `{ [r in 'todos']: S }`
is basically `{ todos: S }` and intersecting the *state type so far* (`X`) with
basically means *give `X` also the property `'todos'` with type `S`*.

By combining these methods as described above we can extend the state parameter
with each `addReducer` call so that we can always give `getState()` the right
return type.


## Building a Fully-Typed Dispatch Object

Hopefully the discussion for `getState()` was somewhat easy to follow. To give
`dispatch` the right types we will use the exact same tricks but we need to
go through one more level of indirection.

Let's go back to `Reducer` and `createReducer` where we have left of the most
interesting parts. A more complete type of `Reducer` looks as follows (I still
leave of some parts for clarity, but there are no type tricks involved there,
they are just there for convenience, so we're not missing anything by not
discussing them):

```TypeScript
type Reducer<STATE, DISPATCH = {}> = {
    // for adding setters, these are actions without a payload
    <K extends string>(
        name: K,
        handler: (state: STATE) => STATE
    ): Reducer<STATE, DISPATCH & Dispatch0<K>>;

    // for adding handlers, these are actions with a payload
    <K extends string, PAYLOAD>(
        name: K,
        handler: (state: STATE, payload: PAYLOAD) => STATE
    ): Reducer<STATE, DISPATCH & Dispatch1<K, PAYLOAD>>;

    // ...
};

type Dispatch0<K extends string> = {
    [k in K]: { (): void; }
};

type Dispatch1<K extends string, P> = {
    [k in K]: { (x: P): void; }
};
```

So we see that `Reducer` has two generic type parameter:
`STATE` is the type of the state as we have seen previously and `DISPATCH`
is the final type of the dispatch functions that we are interested in (this is
what `StoreBuilder` will use to assemble the type of the dispatch object).

There are two different call signatures, the first one is for adding
actions which don't need a payload (I call them `setters` here) and the
second one is for actions which do need a payload (called `handlers`).
They serve essentially the same purpose, but for type inference reasons,
it is necessary to have two different signatures.

Let's focus on the second signature, as both work essentially the same
way. Really what we are doing here is we're using the same trick as when
building up the full store state type to build up the type of the dispatch
functions on this reducer. As an example, let's say we call the `Reducer`
with the following parameters:

```TypeScript
const TodoReducer = createReducer([] as TodoItem[])
    ('add', (s: TodoItem[], todoName: string) => /* ... */)
```

so `name` is `'add'`, `STATE` is `TodoItem[]` and `PAYLOAD` is `string`.
As before, the type parameter `K` will be inferred to be just `'add'`. We
then return a `Reducer<STATE, DISPATCH & Dispatch<K, PAYLOAD>>`, substituting
the parameters `STATE = TodoItem[]`, `DISPATCH = {}`, `K = 'add'` and `PAYLOAD = string` we get

```TypeScript
Reducer<STATE, DISPATCH & Dispatch<K, PAYLOAD>>
= Reducer<TodoItem[], {} & Dispatch<'add', string>>
= Reducer<TodoItem[], {} & { [k in 'add']: { (x: string): void } }>
= Reducer<TodoItem[], { [k in 'add']: { (x: string): void } }>
= Reducer<TodoItem[], { add: { (x: string): void } }>
= Reducer<TodoItem[], { add(x: string): void; }>
```

So now the `DISPATCH` type parameter is `{ add(x: string): void; }`, thus
a single function with name `add` that accepts a `string` and returns `void`.
It might be instructive to run through these substitutions one more time
with a second handler, but I'll leave this as an exercise to the reader.

Let's instead look at how `StoreBuilder` uses this information to build up
the type of the full dispatch object. Going back to this definition,
we'll see that `StoreBuilder` also has a second type parameter which
is the type of the dispatch object.

```TypeScript
class StoreBuilder<X = {}, Y = {}> {
    public addReducer<R extends string, S, YY>(
        reducerName: R,
        reducerBuilder: Reducer<S, YY>
    ): StoreBuilder<X & { [r in R]: S }, Y & { [r in R]: YY }> {
```

Looking at the `addReducer` method again, we see that `StoreBuilder`
uses the exact same mechanism to extend the type of the store dispatch
object as it uses for the type of the store state. Using the `Reducer`
from above, let's look at how the types get inferred in this example

```TypeScript
// TodoReducer has type Reducer<TodoItem[], { add(x: string): void; }>

new StoreBuilder()
    .addReducer('todos', TodoReducer)
```

Recall that `R` is inferred to be `'todos'`, `S` is inferred as `TodoItem[]`
and `YY` is inferred as `{ add(x: string): void; }`. The resulting
`StoreBuilder` type will thus be

```TypeScript
StoreBuilder<{} & { [r in R]: S }, {} & { [r in R]: YY }>
= StoreBulider<{ [r in 'todos']: TodoItem[] }, { [r in 'todos']: { add(x: string): void; } }>
= StoreBulider<{ todos: TodoItem[] }, { todos: { add(x: string): void; } }>
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