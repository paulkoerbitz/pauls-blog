---
title: A first look at WebAssembly
summary: Taking a look at WebAssembly and writing a first function
date: 2019-01-27
---

I've been interested in [WebAssembly] for a while as I believe it will
be a huge step for the web and will become _the_ way to deliver applications.
So I'm glad that I finally took a moment to take a glance at it and try
some things out. This post takes a look at writing a first function in
WebAssembly and the minimal tooling required to make this work. It is
heavily inspired by the [Wrtiting WebAssembly by Hand] post by Colin Eberhardt.

## Wasm, Wat, Wabt

One interesting thing about web assembly is that it specifies both
a text and a binary format. The binary format is called `wasm` and
the text format is called `wat`. The binary format is the one that
will be used 'usually', i.e. it will be transfered, compiled and
instantiated by the browser or nodejs. The text format is equivalent
and can be looked at by humans. And it is surprisingly readable.

The [WebAssembly Binary Toolkit] or `wabt` converts between the
WebAssembly text and binary formats (and a few other formats). It is
written in C++, which is great for performance and embedability into
other languages, but isn't so great for installing it since you need
a binary that runs on your machine or need to compile it. One of the
cool things I discovered while taking these first steps in WebAssembly is that the ["JavaScript" port of wabt], which is installable from npm
is in fact a WebAssembly port - the C++ code was just compiled to
WebAssembly and made available on npm. Pretty cool! So we can use
the `wabt` package from JavaScript to convert from `wat` to `wasm` and
then we can use node's built-in support for `wasm` to compile,
instantiate and run it.

### A Lispy Stack Language

[WebAssembly] is a stack language which at the moment only supports
four types: 32 and 64 bit integers (`i32` and `i64`) and 32 and 64 bit
floats (`f32` and `f64`). Compared to a high level language it is of
course very simplistic, however, compared to other stack languages
it has some rich control flow structures like `loop`, `block` and `if`.

Being a stack language, WebAssembly instructions push to and consume values
from the stack and these push and pop operations are  implicit. This makes code a bit hard to read, since the reader must
keep track of which values are currently on the stack and which instruction
consumes how many values. For example, consider incrementing a local
variable in WebAssembly:

```WAT
;; read $x and push its value onto the stack
get_local $x
;; push the constant 1 to the stack
i32.const 1
;; pop two values off the stack, add them, push the result to the stack
i32.add
;; pop the top value of the stack and store it in the local variable $x
set_local $x
```

Interestingly, the web assembly text format can also nest these
instructions and wrap them in parentheses. This is just syntactic
sugar for the stack format shown above, but it does make things more
readable:

```WAT
(set_local $x
    (i32.add
        (get_local $x)
        (i32.const 1)
    )
)
```

To convert this, the instructions that appear as 'arguments' are
simply moved before the 'calling' instructions, so `(i32.add (get_local $x) (i32.const 1))` is syntactic sugar for

```WAT
get_local $x
i32.const 1
i32.add
```

I guess Brendan Eich finally got the Lisp into the browser that he
wanted to create 20 years ago ;).

## Writing a Fibonacci function in WAT

Now that we've taken a first look at how WebAssembly looks, let's
take on something slightly more difficult by writing the Fibonacci
function in WebAssembly. To compute the n-th Fibonacci number, we will
simply loop over the Fibonacci numbers starting from the first two and
compute the next number by adding the last two. Here is how this would
look in JavaScript:

```JavaScript
function fib(n) {
    let last = 1, current = 1;
    for (; n > 2; --n) {
        let buffer = last + current;
        last = current;
        current = buffer;
    }
    return current;
}
```

And without further ado, here is the equivalent version in WebAssembly:

```WAT
;; src/fibonacci.wat
(module
    (func $fib (param $n i32) (result i32)
        (local $last i32)
        (local $curr i32)
        (local $buff i32)
        (set_local $last (i32.const 1))
        (set_local $curr (i32.const 1))
        (block
            (loop
                (br_if 1 (i32.le_s (get_local $n) (i32.const 2)))
                (set_local $buff (i32.add (get_local $last) (get_local $curr)))
                (set_local $last (get_local $curr))
                (set_local $curr (get_local $buff))
                (set_local $n (i32.sub (get_local $n) (i32.const 1)))
                (br 0)
            )
        )
        (get_local $curr)
    )
    (export "fib" (func $fib))
)
```

Let's go through this step by step:

```WAT
;; src/fibonacci.wat
(module
```

First some boilerplate, we must declare a module, this is obligatory in
WebAssembly. Next we declare our first function, `$fib`:

```WAT
    (func $fib (param $n i32) (result i32)
```

We can name the function, as we do here with `$fib`, but this is just a
convenience in the text format. In the binary format, functions are
referred to by their index, however this is hard for humans to follow, so
it is nice that we can use an identifier here. Next we declare the types
and names of any parameters (`(param $n i32)`) and the type of the return
value (`(result i32)`). Both of these are optional, when no parameters are
defined the function is nullary (doesn't take arguments) and if no result
is declared the function does not return a value.

Next up we declare some local variables along with their types:

```WAT
        (local $last i32)
        (local $curr i32)
        (local $buff i32)
```

and now we initialze `$last` and `$curr`

```WAT
        (set_local $last (i32.const 1))
        (set_local $curr (i32.const 1))
```

This has been quite simple so far, now things become a little more interesting. We have a `loop` to loop over the computation of the
Fibonacci numbers and we will wrap this by a `block`. We'll see
in a moment why we need the `block`.

```WAT
        (block
            (loop
```

Both `loop` and `block` are control-flow instructions. By themselves
they don't do anything, but they are targets for branch instructions
we will see in a moment. The difference between a `loop` and a `block`
is that a branch instruction will jump backwards to the beginning of
a `loop` (akin to a `continue` statement in JavaScript) but forward to
a `block` instruction. Therefore, `block` is suitable to _skipping over_
some code whereas `loop` is suitable to, erm, loop. We will see the purpose
of the `block` next:

```WAT
                (br_if 1 (i32.le_s (get_local $n) (i32.const 2)))
```

Now we have the conditional branch which checks if we should break out
of the loop. The first argument is the index of the block
or loop that the branch instruction targets. In our case `br_if 0` would
target the `loop` and `br_if 1` targets the `block`. So the index basically
says _to which nested control-flow instruction the br jumps_. By nesting the control flow targets
and then targeting them with an index in a `br`, WebAssembly enforces the
well-formedness of branch instructions so that we can't just jump to any label. The index starts at `0`, so a `0` would target the `loop` and a `1` targets the `block`. So here `br_if 1` will branch to the end of the `block` if the condition is true (because blocks establish a branch target at their end as explained above). The condition that is being checked is `(i32.le_s (get_local $n) (i32.const 2))` where `i32.le_s` is a signed less-or-equal
comparison of `$n` and `2`, so basically `$n <= 2`. Now it is hopefully
 clear why we need the `block` instruction before the `loop`: we need
a branch target to jump out of the loop, so we need a branch target outside
of the `loop` and the `block` is just that.

The next instructions simply update `$curr`, `$last` and `$n` similar
to how this was done in our JavaScript version:

```WAT
                (set_local $buff (i32.add (get_local $last) (get_local $curr)))
                (set_local $last (get_local $curr))
                (set_local $curr (get_local $buff))
                (set_local $n (i32.sub (get_local $n) (i32.const 1)))
```

While this is a bit more verbose in WebAssembly, these instructions basically
mirror what is happening in JavaScript.

Now we have the `br 0` instruction which jumps back to the `loop` branch
target which makes the `loop` actually loop:

```WAT
                (br 0)
```

At the end of the function, we read the value of the local variable `$curr`
and put it onto the stack to return it from the function:

```WAT
        (get_local $curr)
```

And finally we export `$fib` with the name `fib` from our WebAssembly module
so that we can actually call this from JavaScript:

```WAT
    (export "fib" (func $fib))
```

And that's it! While being slightly more verbose all parts are certainly
recognizable for such a simple function. The most difficult part for me was
to understand how the `loop` and `block` instructions work together with
`br` and `br_if`.


## A simple compile function

Now that we've done all the work of writing our function in WebAssembly,
let's use it from JavaScript! First we need to convert the `wat` format
into `wasm`. We use `wabt`'s functions `parseWat` and then the `toBinary`
method for this:

```JavaScript
// src/compile.js
const { readFile } = require('fs');
const { promisify } = require('util');
const wabt = require('wabt')();

const readFilePromise = promisify(readFile);

/**
 * Takes a WAT filename and converts it into an instantiated WASM module
 */
const compile = async (watFile) => {
    const watContents = await readFilePromise(watFile, 'utf-8');
    const wasmModule = wabt.parseWat(watFile, watContents);
    const { buffer } = wasmModule.toBinary({ write_debug_names: true });
    const module = await WebAssembly.compile(buffer);
    return WebAssembly.instantiate(module);
}

module.exports = { compile };
```

The last two lines of the `compile` function compile and instantiate the
binary `wasm` which is a bit of boilerplate that must be performed before
a WebAssembly module can actually be used from JavaScript. With this out
of the way we can actually compile and call our `fib` function:

```JavaScript
// src/index.js
const { compile } = require('./compile');

const run = async () => {
    const instance = await compile('fibonacci.wat');
    console.log(instance.exports.fib(10));
}

run();
```

Running this inside the `src` folder gives

```
src$ node index.js
> 55
```

Tada! It works! If you want to see the full code check out this
[mini-repo on GitHub].

## Conclusion

In this post we took a brief look at writing a pretty simple function
in WebAssembly. While WebAssembly is of course a compile target and
will rarely be written by hand, I found it very encouraging that simple
things are in fact pretty simple. Even though WebAssembly does have a few
more advanced features such as indirect branches and calls and memory
handling, I'm now pretty confident that it is possible to learn this
language pretty quickly.


[WebAssembly]: https://webassembly.github.io/spec/core/index.html
[Wrtiting WebAssembly by Hand]: https://blog.scottlogic.com/2018/04/26/webassembly-by-hand.html
["JavaScript" port of wabt]: https://www.npmjs.com/package/wabt
[mini-repo on GitHub]: https://github.com/paulkoerbitz/wasm-first-steps
[WebAssembly Binary Toolkit]: https://github.com/WebAssembly/wabt