---
title: A Look at the Idris Internals, Part I - Overview and Parsing
summary: A short overview of the Idris compilation process, parsing and the high-level AST
date: 2016-01-10
---

[Idris](http://idris-lang.org) is a purely functional programming
language with full dependent types that I have been interested in for
some time. Idris makes some choices that I find very appealing, and so
I have been following it and poking around with it every so often.
Unfortunately, this interest has so far only resulted in very minor
contributions, but that's not a reason to give up and not try again
;). I have been interested in compilers and code generation in
general, and in the Idris backend in particular, so I'm using this new
year as an excuse to take another look at the Idris internals. My
intention is to write a few posts exploring the Idris compilation
process in general and its backend in particular to gain a better
understanding of it and hopefully to find a good place to contribute
to it.

The goal of this post is to get a fairly high-level overview over how
the compilation process works in general and how parsing works in a
bit more detail. Future posts will explore the other parts a little
deeper. There is a [recent paper][1] by Edwin Brady, the creator of
Idris, that explains some aspects of the Idris compilation
process. This [earlier paper][2] focuses more on TT and the type
theory, but is of course also very interesting. In comparison to these
papers, my goal is to give a more detailed look at the code and
possibly also dive a bit deeper into some details that are left out of
these papers as they are fairly standard from a research perspective
and not that interesting to academics well versed in this topic.


## A high-level view of the Idris compilation process

On a very high level, the Idris compilation process consists of the
following steps: First the source code is parsed and an abstract
syntax tree (AST) for the high-level Idris language is produced. This
language is then slightly desugared, for example by replacing do
notation and so on. Then the so-called elaboration process starts,
where implicit arguments are infered and the desugared Idris language
is converted to the main core language, called TT. In TT all arguments
are explicit, yet TT is still a fully dependently typed
language. Typechecking occurs at this level. TT is then simplified by
converting (possibly dependently-typed) pattern matching into simple
case trees, this simplified form of TT is called *TT_case*. A number
of further simplification processes produce successively simpler
intermediate languages: *IR_case* (a first untyped intermediate
language), *IR_lift* where all lambdas have been lifted to the top
level, *IR_defunc* where partially applied functions have been
converted to constructors and finally *IR_ANF* where all function
arguments are either constants or variables. These intermediate
languages (and some other data) are written to Idris *ibc* files. Code
generators process these files and compile the intermediate languages
further to executables.

## Parsing and producing the Idris AST

The first step of the compiler is to parse the source code and to
produce an AST representing this code. The main file for the `idris`
executable lives in `main/Main.hs`. This ends up calling the function
`idrisMain` in `src/Idris/REPL.hs`. This and other functions in that
module load code either with the `loadFromIFile` or `loadModule`
functions, both defined in `src/Idris/Parser.hs`. This is the main
file of the parser, which defines the aformentioned top-level
functions for loading code.  Other files of interest for the parsing
process are `ParserExpr.hs`, `ParserData.hs`, `ParserOps.hs` and
`ParserHelpers.hs`, all of which define different parts of the parser,
and, importantly, `AbsSyntaxTree.hs`, which contains the datatypes for
the syntax tree, as well as other important datatypes used in the
parsing process.

The function in `Parser.hs` which actually starts parsing code from is
[`loadSource`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Parser.hs#L1594). Interestingly,
this function parses a file in two parts, it first parses the imported
modules ([`parseImports`]()), then proceeds to load these modules and
only parses the program afterwards with the
[`parseProg`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Parser.hs#L1509)
function.

These functions run in the Idris monad and modify its state, so they're
not just pure parsing functions. The Idris monad is used fairly
extensively throughout the compliation process and is a `StateT IState`
on top of `ExceptT` and
`IO`. [`IState`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L178)
is a large record defined in `AbsSyntaxTree.hs` which mostly lists the
known top-level definitions as well as some current state related to
elaboration and proving.

Running the parser is accomplished by the aptly-named
[`runparser`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/ParseHelpers.hs#L77)
function from `ParseHelpers.hs`. This function takes a `StateT st
IdrisInnerParser res` as input, where `IdrisInnerParser` is just a
`newtype` around a `Parser` from the
[Trifecta](http://hackage.haskell.org/package/trifecta) library.  Much
of the `Parse*.hs` files define items for the trifecta parser
combinators, and are thus relatively straight forward.

The datatypes that represent the high-level language are defined in
defined in `src/Idris/AbsSyntaxTree.hs`.  The datatype for top-level
declarations is
[`PDecl'`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L637),
which is usually parameterized over
[`PTerm`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L944),
the main datastructure defining the high-level language terms.

That's it for the current post, in the next part I'll take a very
brief look at where desugaring, elaboration and TT, Idris' core
language, live.

[1]: http://eb.host.cs.st-andrews.ac.uk/drafts/compile-idris.pdf "Edwin Brady: Cross-platform compilers for functional languages (PDF)"

[2]: http://www.cs.st-andrews.ac.uk/~eb/drafts/impldtp.pdf "Edwin Brady: Idris, a General Purpose Dependently Typed Programming Language: Design and Implementation (PDF)"