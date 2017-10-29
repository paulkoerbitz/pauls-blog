---
title: Connect (type) safely
summary: With TypeScript 2.6's new strictFunctionTypes option the type definition of the redux connect function are actually type safe
date: 2017-10-28
---

One of the challenges when trying to use redux with TypeScript in a
type safe way is to use the [react-redux] `connect` function in a type
safe manner. To the best of my knowledge, it [was previously not possible]
to write a type definition for TypeScript which would catch property-related
type errors. The main culprit was [TypeScripts unsound handeling of function
argument types], which were bivariant when they should have been contravariant
instead.

However, with TypeScript 2.6 a new strictness option is included called
`strictFunctionTypes`. This option will ensure that function arguments are
typed contravariantly, as they should be. It turns out that this is really
all that is needed to make the existing type definition of the `connect` function
type safe.

## What we want

The redux `connect` function takes a plain react [component] which only
depends on its properties and _connects_ it to a redux store, making it
a [container] which can depend on and modify the application state in the
redux store.

To do this, `connect` takes two functions, `mapStateToProps` and
`mapDispatchToProps`. As the name suggests, `mapStateToProps` uses the
current application state to produce properties and the `mapDispatchToProps`
function uses the dispatch function to produce properties for the component
to be connnected. Generally, the first will produce properties for the component
to read and the second will produce callbacks for the component to modify
the application state. The merged return values from `mapStateToProps`
and `mapDispatchToProps` will be passed to the component to be connected.
Thus, the type definition of the `connect` function should ensure that
the merged return values are a superset of the properties that the
component passed to the connect function expects.

## The problem with bivariant function types

Up to TypeScript 2.5, function arguments would always be typed bivariantely,
which would lead to the following problem with the `connect` function:

```TypeScript
interface OldProps {
    oldIndex: number;
}

const OldComp: React.SFC<OldProps> = props => {
    return div(undefined, props.oldIndex.toString());
};

interface NewProps {
    newIndex: number;
}

interface State {}

interface Dispatch {}

interface PropsFromState {}

interface PropsFromDispatch {}

function mapStateToProps(s: State, np: NewProps): PropsFromState {
    return {};
}

function mapDispatchToProps(d: Dispatch, np: NewProps): PropsFromDispatch {
    return {};
}

// No type error in TypeScript <= 2.5 - but using NewComp leads to a
// runtime error as `oldIndex` is undefined
const NewComp = connect(mapStateToProps, mapDispatchToProps)(OldComp);
```

The problem here is that `PropsFromState & PropsFromDispatch = {} & {} = {}`
is clearly not a superset of `OldProps = { oldIndex: number; }`, but the
type checker (up to 2.5) does not complain about this as it is happy if
either `(PropsFromState & PropsFromDispatch) extends OldProps` or `OldProps extends (PropsFromState & PropsFromDispatch)`. This is just the unsoundness which
is introduced by typing function arguments bivariantly.


## strictFunctionTypes to the rescue

With the `strictFunctionTypes` option enabled, TypeScript 2.6 now types
function arguments contravariantly. In case of the connect function this means
that it insists that `(PropsFromState & PropsFromDispatch) extends OldProps`
must hold, the other way around is no longer enough. This fixes the problem
pointed out above and makes the type definition of the connect function
type safe.

[react-redux]: https://redux.js.org/docs/basics/UsageWithReact.html
[TypeScripts unsound handeling of function argument types]: https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Type%20Compatibility.md
[component]: https://medium.com/@dan_abramov/smart-and-dump-components-7ca2f9a7c7d0
[container]: https://medium.com/@dan_abramov/smart-and-dump-components-7ca2f9a7c7d0
[was previously not possible]: /posts/Trying-and-failing-to-make-redux-connect-type-safe.html