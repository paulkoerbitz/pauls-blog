---
title: Ways to do Undo & Redo with Async Updates and Server Push
summary: Looking at two options of doing undo and redo in a context of async updates to a server and receiving data from the server.
date: 2017-01-15
layout: post.html
draft: true
---

## Undo and Redo

## The command pattern

## The immutable pattern

## Enter server updates

## What if the server fails?

## Enter server push

[command pattern]: https://en.wikipedia.org/wiki/Command_pattern
[stackoverflow question]: http://stackoverflow.com/questions/33746852/implementing-undo-redo-in-redux

As described in the [last post], I tried and failed to write a type
safe wrapper for the [react-redux] connect function. In this post, I
want to examine this function with a view towards writing a type safe
replacement in the future. To do so I'm examining the `connect.js`
module of react-redux version 4.4.32.

The first 33 lines are prelude, defining some helper functions and
objects, nothing too special. I'm not really sure how `nextVersion`
helps with code reloading, we'll hopefully figure this out as we'll
move along.

```{.javascript}
import { Component, createElement } from 'react'
import storeShape from '../utils/storeShape'
import shallowEqual from '../utils/shallowEqual'
import wrapActionCreators from '../utils/wrapActionCreators'
import warning from '../utils/warning'
import isPlainObject from 'lodash/isPlainObject'
import hoistStatics from 'hoist-non-react-statics'
import invariant from 'invariant'

const defaultMapStateToProps = state => ({}) // eslint-disable-line no-unused-vars
const defaultMapDispatchToProps = dispatch => ({ dispatch })
const defaultMergeProps = (stateProps, dispatchProps, parentProps) => ({
  ...parentProps,
  ...stateProps,
  ...dispatchProps
})

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component'
}

let errorObject = { value: null }
function tryCatch(fn, ctx) {
  try {
    return fn.apply(ctx)
  } catch (e) {
    errorObject.value = e
    return errorObject
  }
}

// Helps track hot reloading.
let nextVersion = 0
```

Next, we'll move on to define the `connect` function, which is
obviously the heart of this module. The start of this function
is again some prelude, where we figure out which parameters
are passed and assign default values for the ones not present.
One interesting part is maybe that the presence of `mapStateToProps`
determines (via `shouldSubscribe`) if the new component subscribes
to store changes or not.

```{.javascript}
export default function connect(mapStateToProps, mapDispatchToProps, mergeProps, options = {}) {
  const shouldSubscribe = Boolean(mapStateToProps)
  const mapState = mapStateToProps || defaultMapStateToProps

  let mapDispatch
  if (typeof mapDispatchToProps === 'function') {
    mapDispatch = mapDispatchToProps
  } else if (!mapDispatchToProps) {
    mapDispatch = defaultMapDispatchToProps
  } else {
    mapDispatch = wrapActionCreators(mapDispatchToProps)
  }

  const finalMergeProps = mergeProps || defaultMergeProps
  const { pure = true, withRef = false } = options
  const checkMergedEquals = pure && finalMergeProps !== defaultMergeProps

  // Helps track hot reloading.
  const version = nextVersion++

```

The way the `connect` function should be called is
`connect(mapStateToProps, mapDispatchToProps)(Component)`, so it
must return a function which receives the component which we want
to wrap. This is what happens on line 55. `connectDisplayName`
and `checkStateShape` are helper variables / functions for
error messages.

The `computeMergedProps` function is basically a wrapper around
the mergeProps function which is the user defined merged props
or a default version. The only difference is that it checks in
non-production environments if the final props object has the
right shape.

```{.javascript}
  return function wrapWithConnect(WrappedComponent) {
    const connectDisplayName = `Connect(${getDisplayName(WrappedComponent)})`

    function checkStateShape(props, methodName) {
      if (!isPlainObject(props)) {
        warning(
          `${methodName}() in ${connectDisplayName} must return a plain object. ` +
          `Instead received ${props}.`
        )
      }
    }

    function computeMergedProps(stateProps, dispatchProps, parentProps) {
      const mergedProps = finalMergeProps(stateProps, dispatchProps, parentProps)
      if (process.env.NODE_ENV !== 'production') {
        checkStateShape(mergedProps, 'mergeProps')
      }
      return mergedProps
    }
```

Now we get into the heart of the matter - creating the new react
component which we'll return from the `wrapWithConnect` function.
The `shouldComponentUpdate` method already reveals some key information
about the optimizations that this container performs - we'll update
if we're either not pure, some of our properties have changed or
if the store state has changed. Looks sensible ;)

```{.javascript}
    class Connect extends Component {
      shouldComponentUpdate() {
        return !pure || this.haveOwnPropsChanged || this.hasStoreStateChanged
      }

      constructor(props, context) {
        super(props, context)
        this.version = version
        this.store = props.store || context.store

        invariant(this.store,
          `Could not find "store" in either the context or ` +
          `props of "${connectDisplayName}". ` +
          `Either wrap the root component in a <Provider>, ` +
          `or explicitly pass "store" as a prop to "${connectDisplayName}".`
        )

        const storeState = this.store.getState()
        this.state = { storeState }
        this.clearCache()
      }
```

This class contains a lot of methods which are concerned with figuring
out how to compute the right state from the `mapStateToProps` and
`mapDispatchToProps` methods. Let's first take a look at `computeStateProps`
and `configureFinalMapState` as there seems to be a lot going on here.

The `configureFinalMapState` method is used to install the
`finalMapStateToProps` method and is called from `computeStateProps`
if it is not already present. It calls `mapState` on the state and the
props, if this returns a function^[This is where I would prefer the
constraints of a static type system - why do we need the case where
`mapState` does not return a final result? To me this seems like a
bit too much unneeded (=hard to understand) flexiblity, which dynamic
languages tend to gravitate to.] that function is set as
`finalMapStateToProps` and `computeStateProps` is called, otherwise
`mapState` is used as the `finalMapStateToProps` and the result of the
first call to `mapStateToProps` is returned. It helps that
`configureFinalMapState` is only ever called from `computeStateProps`,
so it is really an initialization method that should run at most
once. I am not sure if the *optimization* of only installing the
`finalMapStateToProps` property in the `computeStateProps` method, or
the different magic cases are really needed, but that's what we have.

The only place where `computeStateProps` is called from is the
`updateStatePropsIfNeeded` method, we will look at this functions
purpose in a minute.


```{.javascript}
      computeStateProps(store, props) {
        if (!this.finalMapStateToProps) {
          return this.configureFinalMapState(store, props)
        }

        const state = store.getState()
        const stateProps = this.doStatePropsDependOnOwnProps ?
          this.finalMapStateToProps(state, props) :
          this.finalMapStateToProps(state)

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(stateProps, 'mapStateToProps')
        }
        return stateProps
      }

      configureFinalMapState(store, props) {
        const mappedState = mapState(store.getState(), props)
        const isFactory = typeof mappedState === 'function'

        this.finalMapStateToProps = isFactory ? mappedState : mapState
        this.doStatePropsDependOnOwnProps = this.finalMapStateToProps.length !== 1

        if (isFactory) {
          return this.computeStateProps(store, props)
        }

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(mappedState, 'mapStateToProps')
        }
        return mappedState
      }
```

The `computeDispatchProps` and `configureFinalMapDispatch` methods
follow the same pattern as the `computeStateProps` and
`configureFinalMapStat` methods above. In fact, they could almost
be copied-and-pasted. `computeDispatchProps` first installs the
`finalMapDispatchToProps` property by calling `configureFinalMapDispatch`
method, if it is not already present. Analogously to the case
above, the `configureFinalMapDispatch` method checks if `mapDispatch`
returns a function and in this case installs that or `mapDispatch`
as the `finalMapDispatchToProps` property. Again, `computeDispatchProps`
is only ever called from the `updateDispatchPropsIfNeeded` method.

```{.javascript}
      computeDispatchProps(store, props) {
        if (!this.finalMapDispatchToProps) {
          return this.configureFinalMapDispatch(store, props)
        }

        const { dispatch } = store
        const dispatchProps = this.doDispatchPropsDependOnOwnProps ?
          this.finalMapDispatchToProps(dispatch, props) :
          this.finalMapDispatchToProps(dispatch)

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(dispatchProps, 'mapDispatchToProps')
        }
        return dispatchProps
      }

      configureFinalMapDispatch(store, props) {
        const mappedDispatch = mapDispatch(store.dispatch, props)
        const isFactory = typeof mappedDispatch === 'function'

        this.finalMapDispatchToProps = isFactory ? mappedDispatch : mapDispatch
        this.doDispatchPropsDependOnOwnProps = this.finalMapDispatchToProps.length !== 1

        if (isFactory) {
          return this.computeDispatchProps(store, props)
        }

        if (process.env.NODE_ENV !== 'production') {
          checkStateShape(mappedDispatch, 'mapDispatchToProps')
        }
        return mappedDispatch
      }
```

Next up are three `updateXYZPropsIfNeeded` methods, where `XYZ` is
either `State`, `Dispatch` or `Merge`. These always compute the new
part of the properties, but only update the cached version on the
object, if they are not `shallowEqual` to the currently cached
version.  If no update is performed, they return false, otherwise they
return true.

```{.javascript}
      updateStatePropsIfNeeded() {
        const nextStateProps = this.computeStateProps(this.store, this.props)
        if (this.stateProps && shallowEqual(nextStateProps, this.stateProps)) {
          return false
        }

        this.stateProps = nextStateProps
        return true
      }

      updateDispatchPropsIfNeeded() {
        const nextDispatchProps = this.computeDispatchProps(this.store, this.props)
        if (this.dispatchProps && shallowEqual(nextDispatchProps, this.dispatchProps)) {
          return false
        }

        this.dispatchProps = nextDispatchProps
        return true
      }

      updateMergedPropsIfNeeded() {
        const nextMergedProps = computeMergedProps(this.stateProps, this.dispatchProps, this.props)
        if (this.mergedProps && checkMergedEquals && shallowEqual(nextMergedProps, this.mergedProps)) {
          return false
        }

        this.mergedProps = nextMergedProps
        return true
      }
```

The other large block of methods are methods for
managing subscriptions and the lifecycle `componentDidMount`,
`componentWillUnmount` and `componentWillReceiveProps` methods.
In the later `haveOwnPropsChanged` is set to true if the
component is either marked as not pure of if the new props are
not shallow equal to the old ones.


```{.javascript}
      isSubscribed() {
        return typeof this.unsubscribe === 'function'
      }

      trySubscribe() {
        if (shouldSubscribe && !this.unsubscribe) {
          this.unsubscribe = this.store.subscribe(this.handleChange.bind(this))
          this.handleChange()
        }
      }

      tryUnsubscribe() {
        if (this.unsubscribe) {
          this.unsubscribe()
          this.unsubscribe = null
        }
      }

      componentDidMount() {
        this.trySubscribe()
      }

      componentWillReceiveProps(nextProps) {
        if (!pure || !shallowEqual(nextProps, this.props)) {
          this.haveOwnPropsChanged = true
        }
      }

      componentWillUnmount() {
        this.tryUnsubscribe()
        this.clearCache()
      }
```

Net up is the clear cache method, which shows us what is all cached on
the new component, there are the three prop types (state, dispatch and
merge), the final methods to compute them (`finalMapDispatchToProps`,
`finalMapStateToProps`), the rendered wrapped element
(`renderedElement`) and flags indicating if the stateProps or the
storeProps have changed. I don't quite understand what
`haveStatePropsBeenPrecalculated` and `statePropsPrecalculationError` do
quite yet.

```{.javascript}
      clearCache() {
        this.dispatchProps = null
        this.stateProps = null
        this.mergedProps = null
        this.haveOwnPropsChanged = true
        this.hasStoreStateChanged = true
        this.haveStatePropsBeenPrecalculated = false
        this.statePropsPrecalculationError = null
        this.renderedElement = null
        this.finalMapDispatchToProps = null
        this.finalMapStateToProps = null
      }
```

The handleChange method is the one that is subscribed to the store,
thus it is being called when the store has changed. When there is not
`this.unsubscribe` method, we're not yet subscribed, so we just
return. If the component is `pure` and the new store state is
shallowEqual to the old one, we also return. Otherwise, there is
another optimization if the `stateProps` do not depend on the
`ownProps`, we try to pre-compute the `stateProps`, store an error if
there is an exception thrown and remember that the state props have
been precalculated. In any case we set the `hasStoreStateChanged` flag
to true and store the new state.



```{.javascript}
      handleChange() {
        if (!this.unsubscribe) {
          return
        }

        const storeState = this.store.getState()
        const prevStoreState = this.state.storeState
        if (pure && prevStoreState === storeState) {
          return
        }

        if (pure && !this.doStatePropsDependOnOwnProps) {
          const haveStatePropsChanged = tryCatch(this.updateStatePropsIfNeeded, this)
          if (!haveStatePropsChanged) {
            return
          }
          if (haveStatePropsChanged === errorObject) {
            this.statePropsPrecalculationError = errorObject.value
          }
          this.haveStatePropsBeenPrecalculated = true
        }

        this.hasStoreStateChanged = true
        this.setState({ storeState })
      }
```

Finally, there is a `getWrappedInstance` convenience method.

```{.javascript}
      getWrappedInstance() {
        invariant(withRef,
          `To access the wrapped instance, you need to specify ` +
          `{ withRef: true } as the fourth argument of the connect() call.`
        )

        return this.refs.wrappedInstance
      }
```

### The render method

Finally the `render` method is pretty involved, it does far more than
just rendering the wrapped compoent, it is where all the caching and
precomputing mechanisms come into play.

There is a bit (too much(?)) logic in this function, fortunately the
variable names are really good. I've found it the easiest to work my
way from the bottom up. At the very end, the `this.renderedElement` is
returned, which is an instance of the wrapped element (with or without
a ref).

```{.javascript}
        if (withRef) {
          this.renderedElement = createElement(WrappedComponent, {
            ...this.mergedProps,
            ref: 'wrappedInstance'
          })
        } else {
          this.renderedElement = createElement(WrappedComponent,
            this.mergedProps
          )
        }

        return this.renderedElement
```

However, `this.renderedElement` is only computed if (a)
`haveMergedPropsChanged` is true or (b) `renderedElement` is falsy (so
probably undefined).

```{.javascript}
        if (!haveMergedPropsChanged && renderedElement) {
          return renderedElement
        }
```

Now `haveMergedPropsChanged` is either false if all of
`haveStatePropsChanged`, `haveDispatchPropsChanged`
and`haveOwnPropsChanged` are false (so no props have changed), or the
result of the `this.updateMergedPropsIfNeeded()` method.

```{.javascript}
        let haveMergedPropsChanged = true
        if (
          haveStatePropsChanged ||
          haveDispatchPropsChanged ||
          haveOwnPropsChanged
        ) {
          haveMergedPropsChanged = this.updateMergedPropsIfNeeded()
        } else {
          haveMergedPropsChanged = false
        }
```

`haveStatePropsChanged` is true if either
`haveStatePropsBeenPrecalculated` is true or if
`shouldUpdateStateProps` is true and `this.updateStatePropsIfNeeded()`
returns true. `shouldUpdateStateProps` is true if either (a) the
component is not pure or there is not rendered element yet, (b)
`hasStoreStateChanged` is true or (c) `haveOwnPropsChanged` is true
and `this.doStatePropsDependOnOwnProps` is. Similar conditions apply
to `shouldUpdateDispatchProps`, except that the `hasStoreStateChanged`
condition is not checked.

Now, another interesting thing that is going on in the render method is
that it sets a number of instance variables which control the caching
behavior, namely `haveOwnPropsChanged`, `hasStoreStateChanged`,
`haveStatePropsBeenPrecalculated`.  After render has run, these are
set to `false`, so that the respective components would not be
recalculated on a second run of `render`. Other life cycle
methods turn these instance variables to true again, this
is essential for only recomputing the parts of the properties
which are acutally needed.

Now that we have examined the full render method, let's see
it once more from top to bottom in all of its glory:

```{.javascript}
      render() {
        const {
          haveOwnPropsChanged,
          hasStoreStateChanged,
          haveStatePropsBeenPrecalculated,
          statePropsPrecalculationError,
          renderedElement
        } = this

        this.haveOwnPropsChanged = false
        this.hasStoreStateChanged = false
        this.haveStatePropsBeenPrecalculated = false
        this.statePropsPrecalculationError = null

        if (statePropsPrecalculationError) {
          throw statePropsPrecalculationError
        }

        let shouldUpdateStateProps = true
        let shouldUpdateDispatchProps = true
        if (pure && renderedElement) {
          shouldUpdateStateProps = hasStoreStateChanged || (
            haveOwnPropsChanged && this.doStatePropsDependOnOwnProps
          )
          shouldUpdateDispatchProps =
            haveOwnPropsChanged && this.doDispatchPropsDependOnOwnProps
        }

        let haveStatePropsChanged = false
        let haveDispatchPropsChanged = false
        if (haveStatePropsBeenPrecalculated) {
          haveStatePropsChanged = true
        } else if (shouldUpdateStateProps) {
          haveStatePropsChanged = this.updateStatePropsIfNeeded()
        }
        if (shouldUpdateDispatchProps) {
          haveDispatchPropsChanged = this.updateDispatchPropsIfNeeded()
        }

        let haveMergedPropsChanged = true
        if (
          haveStatePropsChanged ||
          haveDispatchPropsChanged ||
          haveOwnPropsChanged
        ) {
          haveMergedPropsChanged = this.updateMergedPropsIfNeeded()
        } else {
          haveMergedPropsChanged = false
        }

        if (!haveMergedPropsChanged && renderedElement) {
          return renderedElement
        }

        if (withRef) {
          this.renderedElement = createElement(WrappedComponent, {
            ...this.mergedProps,
            ref: 'wrappedInstance'
          })
        } else {
          this.renderedElement = createElement(WrappedComponent,
            this.mergedProps
          )
        }

        return this.renderedElement
      }
    }
```

Finally, we have some additional properties installed on the
Connect class (`static` properties in OO terms)

```{.javascript}
    Connect.displayName = connectDisplayName
    Connect.WrappedComponent = WrappedComponent
    Connect.contextTypes = {
      store: storeShape
    }
    Connect.propTypes = {
      store: storeShape
    }

    if (process.env.NODE_ENV !== 'production') {
      Connect.prototype.componentWillUpdate = function componentWillUpdate() {
        if (this.version === version) {
          return
        }

        // We are hot reloading!
        this.version = version
        this.trySubscribe()
        this.clearCache()
      }
    }

    return hoistStatics(Connect, WrappedComponent)
  }
```

## Conclusion & next steps

OK, we've seen that the generated component is somewhat involved and
has some fancy optimizations going on. Splitting the creation of the
properties of the wrapped component into external props, properties
computed from the state and properties computed from the dispatch
method allows deciding precisely which part has been updated and
if the wrapped component should be rendered again or not. The caching
mechanisms employed are also fancy, with a fairly precise control
over what needs to be recomputed when and only recomputing the parts
needed. All in all, the connect function is very simple apart from
these optimizations.


[last post]: http://koerbitz.me/posts/Trying-and-failing-to-make-redux-connect-type-safe.html

[react-redux]: https://github.com/reactjs/react-redux/blob/master/src/components/connect.js
