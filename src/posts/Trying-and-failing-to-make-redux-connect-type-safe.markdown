---
title: Trying and failing to make a type safe react-redux connect wrapper
summary: It's challenging to make a type safe react-redux connect function. I thought I had found a way, but was wrong...
date: 2016-11-16
---

One of the challenges when trying to use redux with TypeScript in a
type safe way is to use the [react-redux] `connect` function in a type
safe manner. At the time of writing, the type definition at
[DefinitelyTyped] does not ensure type safety. This blog post tries to
develop a more limited^[In the sense that our function will not cover
all the use cases that the [react-redux] `connect` function covers.]
wrapper around this function which ensures type safety, but sadly
fails to come up with a full solution.

The `connect` function from react redux has a simple purpose: To turn
a presentation focused component requiring properties A and to
automatically generate a logic focused container^[The distinction
between presentation focused *'components'* and logic focused
*'containers'* is a widespread one and is for example explained in
this [blog post][components-containers].] requiring properties B. It
does this via two functions, `mapStateToProps` and
`mapDispatchToProps` which take the current state from the store or
its dispatch function, respectively and properties B. The `connect`
function then returns a generated container requiring properties
B to instantiate and uses the passed functions to convert this into
property A and instantiate the initially passed component.

### Solving the first problem: type parameter inference

If we simplify things a bit more by munging `mapStateToProps` and
`mapDispatchToProps` into a single function `convertProps`^[The idea
is that this function will only receive the properties of the new
container and that the store is contained in these. React redux offers
a way to pass the store as a context object, but I want to forgo this
possibility, as it cannot be made type safe either.] and only handeling
React StatelessFunctionalComponents for now^[We can easily use other
React components here as well, this is only a simplification for
presentation purposes.] we need something like the following:

```{.java}
// one.ts
import * as _ from 'lodash';
import * as React from 'react';
import { render } from 'react-dom';

const { div } = React.DOM;

// Goal: getting to a type safe connect function.

// The connect function takes an existing react comonent class with
// properties A, a function transforming properties B to properties A
// and returns a new react component expecting properties B.

// essentially, we need something like the following:
function connect<NEW_PROPS, OLD_PROPS>(convertProps: (p: NEW_PROPS) => OLD_PROPS,
                                       componentClass: React.SFC<OLD_PROPS>{
                                      ): React.SFC<NEW_PROPS> {
    return props => React.createElement(componentClass, convertProps(props));
}

interface OldProps {
    oldName: string;
}

const OldComp: React.SFC<OldProps> = props => {
    return div(undefined, "Hello, " + props.oldName + "!");
};

interface NewProps {
    newName: string;
}

function convertProps(newProps: NewProps): OldProps {
    return { oldName: newProps.newName };
}

const NewComp = connect(convertProps, OldComp);

NewComp({ newName: "connect" }); /* works */

```

This is a simple approach, unfortunately it is not very type safe. To
see this we'll change the `convertProps` function to not return the
OldProps but something not containing these properties:


```{.java}
// two.ts
function convertProps(newProps: NewProps): {} {
    return {};
}

// no type error
const NewComp = connect(convertProps, OldComp);

// runtime error, 'oldName' is not passed to
NewComp({ newName: "connect" });

```

The problem here is that the inferred type for the `OLD_PROPS` type
parameter is `{}`, the return type of the changed `convertProps`
function and that `OldComp` of type `React.SFC<OldProps>` is accepted
(type compatible) with as a parameter of type `React.SFC<{}>`. This
is a known, by design unsoundness of the TypeScript type system as
noted under [type compatibility] in the TypeScript wiki. The issue
here is that `React.SFC<OldProps> extends React.SFC<{}>` holds, however,
`SFC` should be contravariant in its type parameter.

Can we work around this issue? It turns that we can fix the `OLD_PROPS`
type parameter of the connect function if we pass the arguments *one by one*
in reverse order:

```{.java}
// three.ts
function connect<NEW_PROPS, OLD_PROPS>(
     componentClass: React.SFC<OLD_PROPS>
    ): (convertProps: (p: NEW_PROPS) => OLD_PROPS) => React.SFC<NEW_PROPS>
{
    return convertProps => props => React.createElement(componentClass, convertProps(props));
}
```

This might look a little complicated at first, but all we're
doing is to pass the component class first, and then we're
passing the `convertProps` function. In functional programming terms,
we're *currying* the connect function. This is enough to make
TypeScript infer the type arguments from the component. Thus
the type of `connect(OldComp)` is
`(convertProps: (p: NEW_PROPS) => OldProps) => React.SFC<NEW_PROPS>`,
thus

```{.java}
// still in three.ts
function convertProps(newProps: NewProps): {} {
    return {};
}

// now a type error, as it should be
const NewComp = connect(OldComp)(convertProps);
```

now gives a type error as it should. Since the type parameter
`NEW_PROPS` will be inferred to be the type of the parameter passed to
`convertProps`, this will not be a problem for type safety.

### Failing to solve the second problem: constraining a type intersection

Now the *real* react connect function is a bit more complicated, it
takes two functions to create the new props and handles different react
components, not just SFCs. At the time of writing, the [DefinitelyTyped]
definition available through npm via `@types/react-redux` gives the
following type definitions:

```{.java}
interface ComponentDecorator<TOriginalProps, TOwnProps> {
    (component: ComponentClass<TOriginalProps> | StatelessComponent<TOriginalProps>):
        ComponentClass<TOwnProps>;
}

type FuncOrSelf<T> = T | (() => T);

interface MapStateToProps<TStateProps, TOwnProps> {
    (state: any, ownProps?: TOwnProps): TStateProps;
}

interface MapDispatchToPropsFunction<TDispatchProps, TOwnProps> {
    (dispatch: Dispatch<any>, ownProps?: TOwnProps): TDispatchProps;
}

export declare function connect<TStateProps, TDispatchProps, TOwnProps>(
    mapStateToProps: FuncOrSelf<MapStateToProps<TStateProps, TOwnProps>>,
    mapDispatchToProps?: FuncOrSelf<MapDispatchToPropsFunction<TDispatchProps, TOwnProps>
                                    | MapDispatchToPropsObject>
): ComponentDecorator<TStateProps & TDispatchProps, TOwnProps>;
```

There is a lot of stuff here that I assume is there to handle all
the flexible ways in which the connect function could be used (there
is even a more complicated second signature, which I am completely
ignoring here). Being a static typing enthusiast, I obviously think
this is misguided, I just want one definition that checks as much as
possible at compile time. I also have a few gripes with this
definition, as it doesn't do any type checking on the store or the
dispatch function, but this is not really the place to get into that.

The main practical difference between the simplified version
illustrated in the first part of this post is that this version takes
two functions, one from the current state (`mapStateToProps`) and one
using the dispatch function (`mapDispatchToProps`) (the first is
supposed to provide input properties, the second callbacks) and mixes
their results to create the old properties for the input component.

The problem which I haven't been able to solve is that these
two functions both provide some subset of the properties required
by the input component which we want to wrap. In order to ensure
type safety, we would like to guarantee that together, these
properties cover all properties required for the original component (B).
In terms of the type system, the intersection of both properties
should extend the properties required by the original component,
thus

```{.java}
PropsFromMapStateToProps & PropsFromMapDispatchToProps extends PropsForB
```

Unfortunately, I haven't found a way to do this in the TypeScript type
system. Given this limitation, I currently don't see a way of creating
a wrapper of this connect function which ensures type safety.


[DefinitelyTyped]: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/react-redux/react-redux.d.ts
[react-redux]: https://redux.js.org/docs/basics/UsageWithReact.html
[type compatibility]: https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Type%20Compatibility.md
[components-containers]: https://medium.com/@dan_abramov/smart-and-dump-components-7ca2f9a7c7d0
