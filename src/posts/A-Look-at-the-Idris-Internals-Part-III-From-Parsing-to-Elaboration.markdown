---
title: A Look at the Idris Internals, Part III - From Parsing to Elaboration
summary: Looking at how Idris is desugared and elaborated to TT
date: 2016-03-15
---

So after looking at the parser in the [last post], this post will
explore what happens after an Idris has been parsed, namely how
it is desugared and elaborated to a TT program.

Looking throught the [`idrisMain`] method in `REPL.hs`, it seems that
code is actually loaded by either the [`loadInputs`] function (also in
`REPL.hs`) or the [`loadModule`] from `Parser.hs`.

[`loadInputs`] *loads* a list of Idris files, meaning that it tries to
completely process these files (reading, parsing, elaborating, saving
the state in the `IState`) and all their dependencies. It uses the
[`buildTree`] function from `Chaser.hs` to retrieve the actual files
along with modification times and indicating if a file needs to be
re-loaded. It uses the locally defined [`tryLoad`] function, which
uses [`loadFromIFile`] from `Parser.hs` which either re-loads an
existing IBC file or processes a file via the [`loadSource`]
function. Similarly, the [`loadModule`] function also checks if a
module is already loaded, if not either loads it from an up-to-date
IBC file or ends up loading it from source via [`loadSource`]. So
either way [`loadSource`] seems like an important part of processing
and loading source files in Idris ;).

[`loadSource`] does *a lot of things*^[I must admit I am a bit unhappy
with the plethora of 150+ line monadic functions in the Idris source code,
but that's just a newbie complaining....], such as loading all required
IBC files for modules required by that file (which presumably must exist
at this point), clears the current IBC cache, parses the file with the
[`parseProg`] function and then (dam, dam, dam), goes on to elaborate and
typecheck the loaded program by calling [`elabDecls`] on the parsed declarations.

So looking at Idris as a compiler (as opposed to say the REPL
functionality), the [`elabDecls`] seems to be the most important entry
point into the elaborator. The [`process`] function which seems to be
processing REPL commands is also an interesting entry point, as it is
processing pieces of Idris code in smaller chunks. It ends up making a
few calls to the [`elabVal`] and [`elabREPL`] (which is a wrapper with
a catch around [`elabVal`]) functions.

<!--
In keeping with the spirit of the [last post], let's try to run the
elaborator on a small piece of Idris code to see what it
does. Spinning up a `cabal repl` as in the last post,
-->

All in all, we've basically looked a bit more at how the elaborator
ends up being invoked, but not at how it really works. Unfortunately,
the latter is really a bit beyond of the scope of these blog posts (at
least for now), where I try to familiarize myself with the Idris code
base bit by bit. The [*design and implementation paper* (PDF)] by Edwin Brady
goes into some details of how elaboration works, I am not yet confident
to explore this topic here.

[`elabDecls`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/ElabDecls.hs#L148

[`idrisMain`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/REPL.hs#L1635

[`loadInputs`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/REPL.hs#L1535

[`loadModule`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Parser.hs#L1583

[`buildTree`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Chaser.hs#L116

[`tryLoad`]:  https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/REPL.hs#L1599

[`loadFromIFile`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Parser.hs#1615

[`loadSource`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Parser.hs#1639

[`parseProg`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Parser.hs#1554

[`process`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/REPL.hs#L815

[`elabVal`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Elab/Value.hs#L92

[`elabREPL`]: https://github.com/idris-lang/Idris-dev/blob/76257997a9bf03d62e28cefba0d6a7d3d42eca28/src/Idris/Elab/Value.hs#L135

[last post]: /posts/A-Look-at-the-Idris-Internals-Part-II-Taking-the-Parser-for-a-Spin.html

[*design and implementation paper* (PDF)]: https://eb.host.cs.st-andrews.ac.uk/drafts/impldtp.pdf
