---
title: Unit testing TypeScript types with dtslint
summary: A short introduction on how to unit test TypeScript type operators with dtslint
date: 2018-05-21
---

In the course of writing and updating [typeful-redux] I've started to write
quite a few type operators. These are essentially type-level functions
which allow quite powerful type transformations thanks to TypeScripts many
powerful type-level features.

As these operators become more powerful and more complicated, the need to
test their correctness has increased. Especially for libraries like typeful-redux,
where the main advertised feature is type correctness and enhanced type safety,
it is really important that the type operators actually work as intended.

## dtslint to the rescue

[dtslint] is a tool written by Microsoft to lint d.ts files, it leverages
the great [TSLint] along with some additional rules to check the quality
of `.d.ts` TypeScript declaration files. My understanding is that [dtslint]
was mostly created to check the typings of libraries at [DefinitelyTyped].
We're going to leverage its `expect` rule to write type-level
unit tests.

## The setup

The main reason for this article is that I found the setup to use dtslint
for unit tests not completely straight-forward and I couldn't find
anyone writing about it, so I tought that giving a step-by-step guide might
be helpful to the next person trying to do this.

First step is to just install [dtslint], it's on npm, so this is quite simple:

```
$ npm install --save-dev dtslint
```

Next, we'll need a directory where we want to put the type test files, in
[typeful-redux] I've decided to put this in the `test/types` folder. We'll
augment the `scripts` section in `package.json` with a `dtslint` entry pointing
to this directory:

```json
/* file: package.json */
    // ...
    "scripts": {
        // ...
        "dtslint": "dtslint test/types"
    }
    //...
```

In the test directory, we'll need at least three files, `tsconfig.json`, `index.d.ts`
and `tslint.json` (technically, the last one is not strictly needed, but we'll need it here).

`tsconfig.json` should contain the compiler configuration from the project with a few small changes. For typeful-redux, it looks as follows:

```json
/* file: test/types/tsconfig.json */
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    /* Strict Type-Checking Options */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    /* Additional Checks */
    /* next line commented out because we need unused vars for type tests */
    // "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "lib": ["es5"],
    /* dtslint needs these to operate in this directory */
    "baseUrl": ".",
    "paths": { "typeful-redux": ["../../src"] }
  }
}
```

So these are just the tsconfig settings used in the project except that
we need to remove `unusedLocals` and add a `baseUrl` pointing to the
current directory and possibly the `paths` of the type definitions of any
library we may want to use.

Next up is `index.d.ts`, `dtslint`'s idea is that this is the main type file of
the library. Since we're after writing type level unit tests here we just
leave this empty except for one comment:

```TypeScript
/* file: test/types/index.d.ts */
// TypeScript Version: 2.8
```

The `// TypeScript Version: 2.8` controls the TypeScript version against which
dtslint checks the definition file. Depending on the use case, more versions
may or should be listed here, but for my purposes, using TypeScript 2.8 is needed
and so I don't want to test against any older versions.

Finally `tslint.json`, this file is only needed if the default dtslint rules will
be modified. We need to do this as we are violating dtslint default rules by
having an empty `index.d.ts`:

```json
/* file: test/types/tslint.json */
{
  "extends": "dtslint/dtslint.json",
  "rules": {
    "no-useless-files": false,
    /* I find this rule annoying, so I'm disabeling it ;) */
    "eofline": false
  }
}
```

## So what about the tests, Jim?

Ah yes, the tests, the reason we're doing all of this stuff ;). We're almost
there. First lets see if our setup works. If you're following along at home,
you should be able to run

```bash
$ npm run dtslint

> typeful-redux@0.3.0 dtslint /home/pkoerbitz/dev/ts/typeful-redux
> dtslint test/types
```

and get (... drumroll ...) nothing. Well, um, yes, dtslint isn't exactly super chatty
about what it is doing which is certainly the largest complaint I have about the
whole approach, but that's what we've got. If you want to make sure that dtslint
is actually doing its thing, then comment out the `no-useless-files` rule and run
again which should give you something like the following:

```bash
$ npm run dtslint

> typeful-redux@0.3.0 dtslint /home/pkoerbitz/dev/ts/typeful-redux
> dtslint test/types

Error: /home/pkoerbitz/dev/ts/typeful-redux/test/types/index.d.ts:1:1
ERROR: 1:1  no-useless-files  File has no content. See: https://github.com/Microsoft/dtslint/blob/master/docs/no-useless-files.md

    at /home/pkoerbitz/dev/ts/typeful-redux/node_modules/dtslint/bin/index.js:101:19
    at Generator.next (<anonymous>)
    at fulfilled (/home/pkoerbitz/dev/ts/typeful-redux/node_modules/dtslint/bin/index.js:5:58)
    at <anonymous>
```

ah, so much better, what does the exit code say?

```bash
$ echo $?
1
```

Good. Comment-in the `no-useless-files: false`
line again. Now we're ready to add our first 'test'. We can actually
add other TypeScript files into the test directory (`test/types` here)
and dtslint will happily lint them for us. The key to writing tests
is that there is an `expect` rule which takes a special comment
and checks that the next type is the same as the one in the comment:

```TypeScript
/* file: test/types/type-helpers.ts (but name is not important) */
// Testing that the type on the next line is string - this will fail ;)
// $ExpectType string
type Test_01_number_is_not_string = number;
```

Let's try this:

```bash
$ npm run dtslint

> typeful-redux@0.3.0 dtslint /home/pkoerbitz/dev/ts/typeful-redux
> dtslint test/types

Error: /home/pkoerbitz/dev/ts/typeful-redux/test/types/type-helpers.ts:3:1
ERROR: 3:1  expect  Expected type to be:
  string
got:
  number
```

Fantastic. dtslint's output is not quite on the level of mocha or jest (I
assume they're taking pull requests ;P) but it's is certainly much much
better than not being able to test type operators. Now we can happliy go along and write unit tests for  our type operators. The actual `type-helpers.ts` test file looks as follows:

```TypeScript
import { Arg1, Arg2, Equals } from '../../src/type-helpers';

// $ExpectType string
type Arg1_extracts_arg1_from_unary_function = Arg1<(x: string) => void>;

// $ExpectType string
type Arg1_extracts_arg1_from_binary_function = Arg1<(x: string, y: number) => void>;

// $ExpectType never
type Arg1_extracts_never_from_nullary_function = Arg1<() => void>;

// $ExpectType string
type Arg2_extracts_arg2_from_binary_function = Arg2<(x: number, y: string) => void>;

// $ExpectType string
type Arg2_extracts_arg2_from_trinary_function = Arg2<(x: number, y: string, z: number) => void>;

// $ExpectType never
type Arg2_extracts_never_from_unary_function = Arg2<(x: number) => void>;

// $ExpectType never
type Arg2_extracts_never_from_nullary_function = Arg2<() => void>;

// $ExpectType true
type Equals_string_string_is_true = Equals<string, string>;

// $ExpectType false
type Equals_string_number_is_false = Equals<string, number>;
```

Happy type testing!

[typeful-redux]: https://github.com/paulkoerbitz/typeful-redux
[tslint]: https://palantir.github.io/tslint
[dtslint]: https://github.com/Microsoft/dtslint
[DefinitelyTyped]: https://github.com/DefinitelyTyped/DefinitelyTyped
[type-helpers]: https://github.com/paulkoerbitz/typeful-redux/blob/master/src/type-helpers.ts
