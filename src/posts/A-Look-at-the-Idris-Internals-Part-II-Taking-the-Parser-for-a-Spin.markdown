---
title: A Look at the Idris Internals, Part II - Taking the Parser for a Spin
summary: Trying out the Idris Parser on the GHCi REPL
date: 2016-01-17
---

After we've looked at how the parser ends up being called in the [last
post](/posts/A-look-at-the-Idris-Internals-Part-I-Overview-and-Parsing.html),
I thought it would be a fun little exercise to spin up the Idris parser on
the GHCi REPL to see if we can get some expressions parsed and what kind
of AST they produce.

To spin up ghci, we need to go throught the usual `cabal configure &&
cabal install` dance and then run `cabal repl`. Calling `ghci` with
the desired target file directly (e.g. `Parser.hs`) won't work, as
Idris generates some files during build time which won't be available
in this case.

As briefly mentioned in the previous post, we can use the
[`runparser`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/ParseHelpers.hs#L77)
function to actually run a specific parser, but how do we call it?
The type signature looks a bit hairy at first:

```{.Haskell}
runparser :: StateT st IdrisInnerParser res -> st -> String -> String -> Result res
```

but it's actually quite simple: The `StateT st IdrisInnerParser res`
is the type in which the different building blocks for the parser are
defined. In fact, most of the parser building blocks have a type of
[`IdrisParser`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/ParseHelpers.hs#L46)
and this is just defined by `type IdrisParser = StateT IState
IdrisInnerParser`, so `st` is specialized to
[`IState`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L178),
the big state record in Idris. There is an
[`idrisInit`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L343)
binding, which defines an empty IState, and we'll just use that for
our experiments at the REPL. All that is left is to pick an
appropriate parser for us to start the experiments. Looking at the
different building blocks of the parsers, we notice that many take an
argument of type
[`SyntaxInfo`][SyntaxInfo].
Idris parses some parts of its syntax things differently depending on
the context (for example if a
[`DSL`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L1325)
binding has been defined). We will not burden ourselves with such
details right now and use the
[`defaultSyntax`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L1463)
defined in `AbsSyntaxTree.hs` to keep things simple.

Let's start with a powerful parser which allows us to parse a
siginficant part of the source code. The
[`prog`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Parser.hs#L153)
is easily missed, but it actually allows us to parse full Idris programs.
Here is a very simple one:

```{.Haskell}
ghci> import Idris.Parser
ghci> import Idris.AbsSyntaxTree
ghci> let myProgram = "id : a -> a\nid x = x";
ghci> putStrLn myProgram
id : a -> a
id x = x
ghci> :t runparser (prog defaultSyntax) idrisInit "(test)" myProgram
runparser (prog defaultSyntax) idrisInit "(test)" myProgram
  :: Text.Trifecta.Result.Result [PDecl]
ghci> runparser (prog defaultSyntax) idrisInit "(test)" myProgram
Success [tydecl id : a -> a,pat {_2}       id x  = x where []]
```

So we see that the result from the parse is wrapped in a
[`Result`](http://hackage.haskell.org/package/trifecta-1.5.2/docs/Text-Trifecta-Result.html)
datatype from the Trifecta library (this can basically be a `Success`
with the result or a `Failure` with some information on where the
parse went wrong and why) and returns a list of
[`PDecl`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L637),
which is the datastructure that represents top-level declarations of
the idris language. These are defined in `AbsSyntaxTree.hs`.

We can see that the actual `PDecl`s are pretty printed, which is too
bad, since we wanted to figure out how the parsing result was exactly
represented in the datastructure. My standard hacky way to work
around this^[If there is a better way, please let me know] is to
simply comment out the existing show instance for these datatypes and
derive them instead. To do this we have to comment out the `Show`
instances on lines 1582 to 1592 in
[`AbsSyntaxTree.hs`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L1582)
and add `deriving Show` clauses to `PDecl'`, `Directive`, `PClause`,
`PData'`, `PTerm`, `PAltTerm`, `PDo'` and `PTactic'` in the same
file. Doing so and running the above commands at the REPL again gives
us (slightly reformatted)

```{.Haskell}
ghci> runparser (prog defaultSyntax) idrisInit "(test)" myProgram
Success [
    PTy (DocString (Options { sanitize = True, allowRawHtml = False
                            , preserveHardBreaks = True, debug = False})
                   (fromList []))
        []
        (Syn { using = [], syn_params = [], syn_namespace = [], no_imp = [], imp_methods = []
             , decoration = <<fn>>, inPattern = False, implicitAllowed = False
             , maxline = Nothing, mut_nesting = 0
             , dsl_info = DSL { dsl_bind = PRef (builtin) [] >>=
                              , dsl_return = PRef (builtin) [] return
                              , dsl_apply = PRef (builtin) [] <*>
                              , dsl_pure = PRef (builtin) [] pure
                              , dsl_var = Nothing
                              , index_first = Nothing
                              , index_next = Nothing
                              , dsl_lambda = Nothing
                              , dsl_let = Nothing
                              , dsl_pi = Nothing
                              }
             , syn_in_quasiquote = 0
             })
        (test):1:4
        []
        id
        (test):1:1-3
        (PPi (Exp {pargopts = [], pstatic = Dynamic, pparam = False})
             __pi_arg
             No location
             (PRef (test):1:6-7 [(test):1:6-7] a)
             (PRef (test):1:11-12 [(test):1:11-12] a))
  , PClauses (test):2:1
             []
             {_2}
             [ PClause (test):2:4
                       id
                       (PApp (test):2:4 (PRef (test):2:1-3 [(test):2:1-3] id)
                                              [PExp { priority = 1, argopts = []
                                                    , pname = {arg0}
                                                    , getTm = PRef (test):2:4-5
                                                                   [(test):2:4-5]
                                                                   x
                                                    }])
                       []
                       (PRef (test):2:8-9 [(test):2:8-9] x)
                       []
             ]
]
```

This is a bit long, but going through it bit by bit and ignoring some
parts, we can hopefully make sense of it. First, there are two
top-level declarations `PTy` and `PClauses`, which are constructors of
the
[`PDecl'`](https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L637)
datatype. The `PTy` is a type declaration which consists of a
[`Docstring`][Docstring], a list of
[`Name`][Name]-[`Docstring`][Docstring] tuples (presumably for the
parameters), a [`SyntaxInfo`][SyntaxInfo] (briefly touched on before),
a [`FC`][FC] (which is a source location and here pretty-printed to
`(test):1:4`, I think this is the position of the `:`), a list of
`FnOpt` (extra info such as if a function is inlinable, total, etc.),
a `Name`, another `FC` (source location, this is the position of the
name) and finally a [`PTerm`][PTerm], which is here a `PPi`, a
dependently-typed function type.

The `PClauses` is a pattern clause, so really the list of pattern
matching definitions. It features a source location (`FC`), a list of
function options (`FnOpts`), a name (this seems to be the `{_2}` here,
indicating that this name was implicitly generated) and a list of
[`PClause' PTerm`][PClause'], which are the actual clause definitions.

We could drill down further on each of these, and of course
there is a ton of details which I blissfully ignore, but I feel like
that going this far has given me a fairly good superficial
understanding of how parsing works in Idris in the sense that if I
needed to find out how something works in detail, I would know where
to look and find it fairly quickly. The next post will take a brief
look at how the initial parse result is processed further.

[SyntaxInfo]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L1443

[Docstring]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Docstrings.hs#L48

[Name]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Core/TT.hs#L452

[FC]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Core/TT.hs#L83

[PTerm]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L945

[PClause']: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/AbsSyntaxTree.hs#L751