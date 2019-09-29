---
title: What are Tables in WebAssembly?
summary: Taking a deeper look at what tables are in WebAssembly and what one can do with them
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-02-17
draft: true
---

In the [last post] we wrote a simple Fibonacci function in WebAssembly to understand the basics of how WebAssembly works. That way we discovered that simple things are actually relatively simple in WebAssembly as well. Of course, WebAssembly has some more advanced features. One thing that I found mysterious are *tables*. This post wants to explore a bit what they are and what they can be used for?

## What are tables?

According to the [WebAssembly specification], "a table is a vector of opaque values of a particular table element type." I don't seem be be alone in not getting the purpose of tables from this description, leading to a post by Lin Clark also titled [WebAssembly table imports... what are they?]. This post states that the purpose of tables is to represent function pointers, which are widely used in C and C++. Due to the security requirements of WebAssembly, it should not be able to directly modify function pointers to make them point to malicious code. This rules out storing function pointers in linear memory, where they could be manipulated directly. Therefore, function pointers are represented as opaque values in a table import where they cannot be modified. In future versions of the WebAssembly sepcification, tables may hold additional types, but right now the only type they can hold is `anyfunc` or `funcref` which is the type of any function.

## Table imports and table definitions

Tables can either be imported into a module or be defined in a module. There are future plans to allow more than one table in a WebAssembly module, but in the MVP only one table is allowed and this table must either be imported or defined in the module. So in the MVP, there can be _either_ a table import _or_ a table definition. Let's look at imports first.

### Table imports

A table import looks as follows (this is taken from [here](https://github.com/WebAssembly/spec/blob/c4d85ced84191898c37feb2783f2526299380a41/test/core/imports.wast#L271) in the WebAssembly spec test suite)

```
(module
    (import "spectest" "table" (table 10 20 funcref))
)
```

The first parameter (`10`) is the minimum size (the size allocated to the table in the beginning), the second (`20`) is the maximum size (the maximum size the table can be grown to) and `funcref` is the type of the elements in the table. `funcref` is the supertype of all function types and in the MVP is the only type allowed for tables (there are plans to allow more types and to have multiple tables with more precise types). In case you're confused by `funcref` and expected `anyfunc` here: `anyfunc` was recently renamed to `funcref` to achieve more consistency in WebAssembly names.

### Table definitions

Instead of importing a table, we can also define a table in a WebAssembly module (but not both - at least not in the MVP!)

A table definition looks as follows:

```
(module
    (table 10 20 funcref)
)
```

Yes - it looks exactly like the table type definition in the imports section!

### Initializing tables - the element section

Defined tables are initially filled with sentinal values and trying to use
such a sentinal value will cause a trap - in the web platform this means the
calling code will throw an exception.

Imported tables can have been initialized externally - but defined tables cannot.
The `element` section can be used to initialize a table. Right now the only thing
we can do is fill it with function pointers:

```
(elem
    ;; This is the table index, it defines which table we are initializing
    ;; In the WebAssembly MVP, this is always 0, it is a placeholder for
    ;; the post-MVP future when there may be more than one table.
    (i32.const 0)
    ;; these function references initialize the table with function pointers
    $foo
    $bar
)

(func $foo (result i32)
  i32.const 1
)

(func $bar (result i32)
  i32.const 0
)
```

As shown above, the `elem` instruction takes a table index. In the MVP we can have at most one table per module, but this may change in future versions. The table index space indexes all imported and internally-defined table definitions, assigning monotonically-increasing indices based on the order of definition in the module (as defined by the binary encoding). Thus, the index space starts at zero with the table imports (if any) followed by the tables defined within the module.

## Using tables - call_indirect

Now that we have gone to a great length of declaring or importing a table and initializing it, what can we actually do with it? The only way in which tables
can be used in the MVP is the `call_indirect` function which takes the index
of the function to call in the table. `call_indirect` always works on the
default table, which is the table with index `0`.

Given the table above, `(call_indirect (i32.const 0))` is equivalent to `(call $foo)` and `(call_indirect (i32.const 1))` is equivalent to `(call $bar)`.

## Limitations in the WebAssembly MVP

In the MVP tables are quite limited in WebAssembly. The WebAssembly API does not
allow for growing or assigning to tables. Therefore, an initialized table cannot be
changed through WebAssembly calls. There are some plans to change this in the future, but for now the functionality of tables from within WebAssembly is limited.
The JavaScript WebAssembly Table API however does not suffer from these restrictions and tables can be modified and grown through the JavaScript API.

## The JavaScript WebAssembly Table API

The [JavaScript WebAssembly table API]

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table

## A WebAssembly Table Example

As a small example of how a table and call_indirect can be used, let's compute
the [Collatz sequence] and count how many steps we need to reach the number 1. (Yes, this is a contrived example because we don't _need_ indirect calls and tables for this, but I found it really hard to come up with an example which isn't contrived and is simple enough to not drown out the call_indirect instructions in heaps of code.)

In the Collatz sequence, the next item is computed as follows

$$
C(n) =
n / 2  \text{ if }n\text{ is even}
3n + 1 \text{ if }n\text{ is odd}
$$


```
(module
    (table funcref)

    (elem
        (i32.const 0)
        $next_even
        $next_odd
    )

    (func $collatz_count (param $start i32) (result i32)
        (local $count i32)
        (i32.load (i32.mul (get_local $index) (i32.const 4)) 0)
    )

    (func $store (param $index i32) (param $value i32)
        (i32.store (i32.mul (get_local $index) (32.const 4)) 0 (get_local $value))
    )

    (func $swap (param $left i32) (param $right i32)
        (local $buffer i32)
        (set_local $buffer (i32.load $left))
        (i32.store $left (i32.load $right))
        (i32.store $right (get_local $buffer))
    )

    (func $ascending (param $left i32) (param $right i32) (result i32)
        (i32.lt_s (get_local $left) (get_local $right))
    )

    (func $ascending (param $left i32) (param $right i32) (result i32)
        (i32.gt_s (get_local $left) (get_local $right))
    )

    (func $bubble_sort
        (param $start_index i32)
        (param $end_index i32)
        (param $comparison_function i32)

        (local $outer_index i32)
        (local $inner_index i32)
        (local $next_inner_index i32)
        (local $comparison_result i32)

        (loop
            (br_if 1 (i32.ge_u (get_local $outer_index) (get_local $end_index))

            (set_local $inner_index (get_local $outer_index))
            (loop
                (set_local
                    $next_inner_index
                    (i32.add (get_local $inner_index) (i32.const 1))
                )
                (br_if 1 (i32.ge_u (get_local $next_inner_index) (get_local $end_index))
                (if
                    (call_indirect
                        $comparison_function
                        ($load (get_local $inner_index))
                        ($load (get_local $next_inner_index))
                    )
                    (then
                        (call $swap
                            (get_local $inner_index)
                            (get_local $next_inner_index)
                        )
                    )
                )
                (set_local $inner_index (get_local $next_inner_index))
                (br 0)
            )

            (set_local $outer_index (i32.add (get_local $outer_index) (i32.const 1)))
            (br 0)
        )
    )

    (func $sort_ascencing)

    (func $sort_descending)
)
```


So that what can we use tables in WebAssembly for? If we follow the idea that
tables are used for function pointers, we can use tables to pass function pointers
in WebAssembly.

As an example, we implement a small sorting function in WebAssembly which will
take a reference to the comparison (our function pointer). To keep things simple
we'll stick to bubble sort for the sorting.

```
(module
    (table funcref)
    (elem
        (i32.const 0)
        $ascending
        $descending
    )

    (memory 1)

    (func $load (param $index i32) (result i32)
        (i32.load (i32.mul (get_local $index) (i32.const 4)) 0)
    )

    (func $store (param $index i32) (param $value i32)
        (i32.store (i32.mul (get_local $index) (32.const 4)) 0 (get_local $value))
    )

    (func $swap (param $left i32) (param $right i32)
        (local $buffer i32)
        (set_local $buffer (i32.load $left))
        (i32.store $left (i32.load $right))
        (i32.store $right (get_local $buffer))
    )

    (func $ascending (param $left i32) (param $right i32) (result i32)
        (i32.lt_s (get_local $left) (get_local $right))
    )

    (func $ascending (param $left i32) (param $right i32) (result i32)
        (i32.gt_s (get_local $left) (get_local $right))
    )

    (func $bubble_sort
        (param $start_index i32)
        (param $end_index i32)
        (param $comparison_function i32)

        (local $outer_index i32)
        (local $inner_index i32)
        (local $next_inner_index i32)
        (local $comparison_result i32)

        (loop
            (br_if 1 (i32.ge_u (get_local $outer_index) (get_local $end_index))

            (set_local $inner_index (get_local $outer_index))
            (loop
                (set_local
                    $next_inner_index
                    (i32.add (get_local $inner_index) (i32.const 1))
                )
                (br_if 1 (i32.ge_u (get_local $next_inner_index) (get_local $end_index))
                (if
                    (call_indirect
                        $comparison_function
                        ($load (get_local $inner_index))
                        ($load (get_local $next_inner_index))
                    )
                    (then
                        (call $swap
                            (get_local $inner_index)
                            (get_local $next_inner_index)
                        )
                    )
                )
                (set_local $inner_index (get_local $next_inner_index))
                (br 0)
            )

            (set_local $outer_index (i32.add (get_local $outer_index) (i32.const 1)))
            (br 0)
        )
    )

    (func $sort_ascencing)

    (func $sort_descending)

    ;; TODO:
    ;; [ ] setup and initialize and export memory
    ;; [ ] write test functions and put on github
    ;; [ ] write a bit about the JavaScript WebAssembly Table API
)
```

```JavaScript
```


[last post]: /posts/a-first-look-at-webassembly.html

[WebAssembly specification]: http://webassembly.github.io/spec/core/syntax/modules.html#tables

[import section in the WebAssembly design documents]: https://github.com/WebAssembly/design/blob/master/Modules.md#imports

[table section in the WebAssembly design documents]: https://github.com/WebAssembly/design/blob/master/Semantics.md#table

[WebAssembly table imports... what are they?]: https://hacks.mozilla.org/2017/07/webassembly-table-imports-what-are-they/

[JavaScript WebAssembly table API]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table

[Collatz sequence]: https://en.wikipedia.org/wiki/Collatz_conjecture