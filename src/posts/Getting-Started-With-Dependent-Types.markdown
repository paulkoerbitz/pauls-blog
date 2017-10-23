---
title: Getting Started With Dependent Types
summary: Dependent types are all the rage but getting started can be a bit intimidating. This post summarizes some resources to get started with dependent types and my plan on how to learn them.
date: 2013-07-31
---

Dependent types, that is type systems where types may depend on
values, are the hot new thing. Dependent types seem like a logical
succession to [Haskell](/posts/Why-I-love-Haskell.html), which [people
much smarter than me
argue](http://stackoverflow.com/questions/12961651/why-not-be-dependently-typed/#answer-13241158)
is becoming a dependently typed language itself. I am interested in
learning more about dependent types and want to list some resources
here that I have used or am planing on using.

## Why dependent types?

Why bother learning languages with dependent types? Given that [I've
argued](/posts/Why-I-love-Haskell.html#encode-your-invariants-in-the-type-system)
that it is beneficial to encode a program's invariants in the type
system, it is only natural to want a type system that allows you to do
more of this. Dependent types give you this possibilitye, however
there is a trade off: writing programs in dependently typed languages
is more complex (you may have to write some proofs!) and we don't have
that much experience with it.

I can't really answer the question if the more powerful type system is
worth the additional difficulties, but it seems like things are in
motion and that now is an interesting time to find out:

- New dependently typed languages that are more or less intended to be
  used as real programming languages have started to appear in recent
  years. These languages include
  [Agda](http://wiki.portal.chalmers.se/agda/),
  [Idris](http://idris-lang.org) and [ATS](http://www.ats-lang.org).
  At least the latter two are clearly intended to be used as *real
  programming languages* (as opposed to theorem provers) and they do
  appear to be quite usuable to the casual observer.
  
- New books have come out which make heavy use of the theorem prover
  [Coq](http://coq.inria.fr) and are intended to teach the use of
  dependently typed languages. These books make the use of Coq
  accessible to a much larger audience (including me ;).

- Domain specific languages (DSLs) and specifically embedded
  domain specific languages (EDSLs) are becomming more and more
  important. Dependent types allow you to typecheck these languages
  with the build-in type checker.

- Haskell is moving towards dependent types and so the smart people
  behind Haskell seem to think this is a good idea. Who am I to
  disagree?

It is of course quite possible that these indications mean nothing or
that it simply looks like a trend to me since I have only recently
started to look at this topic. However, if Haskell has taught me one
thing then it is that great ideas, however different, may eventually
become successful when pursued with the necessary tenacity and that
things that look like huge inconveniences (purity!) may actually turn
out to be great advantages once we get accustomed to them. Non-total
functions have always felt like a wart in Haskell, and that is why I
am willing to bet on dependently typed languages now. I think there
will be a lot of exploring and a lot of learning before these
languages will be anything near mainstream (like where Haskell is
now), but now seems like an exciting time to be part of this
development.


## Resources

### Programming languages

There are now a number of interesting languages with dependent types.
This list makes no attempt to be exhaustive and is slanted towards the
things that interest me. 

- [Coq](http://coq.inria.fr) is the 800-pound Gorilla in dependent
  type land. Coq is first and foremost a theorem prover, but at its
  heart sits a dependently typed language called Gallina, which itself
  is an extensions of the *calculus of indicutive constructions*.

- [Agda](http://wiki.portal.chalmers.se/agda/) is also a theorem
  prover based on the *intuitionistic type theory* develop by
  Martin-Löf. The syntax is heavily influenced by Haskell (as opposed
  to Coq whose syntax closer to ML). A major difference between
  Agda and Coq is that Agda has no tactics language for proving
  theorems.

- [Idris](http://idris-lang.org/) is the new kid on the block, having
  appeared only in 2011. It is also heavily influenced by Haskell (the
  [introducing
  paper](http://www.cs.st-andrews.ac.uk/~eb/drafts/impldtp.pdf) asked
  the question *"What if Haskell had full dependent types?"* ). It
  differs from Coq and Agda in that it is not described as a theorem
  prover but as a general programming language. Indeed, functions must
  be annotated if one wants them to be checked for totality. This is a
  kind of escape hatch that will make developing regular programs
  easier in Idris. While it has (appart from dependent types) a lot in
  common with Haskell, it defaults to eager evaluation (with optional
  lazy evaluation available with special annotations).
  
- [ATS](http://www.ats-lang.org/) (which stands for *applied type
  system*) looks like a fusion of C and ML with dependent types thrown
  in for good measure. I am not really sure what to think of this
  language but at first sight it feels very different from the other
  ones listed here. What makes this language really interesting is
  that it is intended for systems programming, i.e. for the domain
  where one would usually use C or C++. I think this is great because
  those two have very little competition in their fields.^[The only
  other language that I am aware of that appeared during the last 10
  years and does not require garbage collection is
  [Rust](http://www.rust-lang.org).] Furthermore, when programming in
  C it is so easy to make mistakes that the dependent types and linear
  types that ATS has could be a real boon. That said, from my very
  limited impression the language seems a bit messy and therefore
  I think it is not the best place to start learning about dependent
  types.     


### Books and Papers

There are also a few books that have come out recently-ish that make
dependently typed languages (primarily Coq) much more accessible.
This is of course of huge importance to an autodidact like me.

- [Software foundations](http://www.cis.upenn.edu/~bcpierce/sf/) by
  Benjamin Pierce teaches Coq, functional programming, basic typing
  theory and the universe.  There are basically no prerequisites
  (except for being able to install Emacs ;)) and lots and lots of
  little excercises. It seems a bit slow at the start but working
  through all of the excercises will probably give a lot of
  familiarity with Coq, so that may be worth it.

- [Certified programming with dependent
  types](http://adam.chlipala.net/cpdt/) by Adam Chlipala. This book
  seems much more advanced than software foundations. It states in the
  introduction that it wants to initiate a discussion on best
  practices for developing certified programs in dependently typed
  languages. The author argues that every proof should be automated
  so that no manual steps are required (once the right lemmata have
  been developed).

- [Types and programming
  languages](http://www.cis.upenn.edu/~bcpierce/tapl/) by Benjamin
  Pierce. This book is not really on dependent types but introduces
  the foundations for programming language theory such as the typing
  rules, operational semantics, the (simply typed) lambda calculus,
  subtyping and a few more. I've meant to read it completely but
  I am stuck half way. It is certainly a very accessible book and
  a fun read.

- [A tutorial implmentation of a dependently typed lambda
  calculus](http://people.cs.uu.nl/andres/LambdaPi/LambdaPi.pdf) by
  Andres Löh et al. I am not sure if I can give you a better summary
  than the title. Doesn't it just make you want to read the paper?

- [Martin Löf's type
  theory](https://en.wikipedia.org/wiki/Intuitionistic_type_theory) is
  the foundation for Agda. I think learning the theory might not
  acutally be necessary for a working understanding of dependent types
  and to get an idea of what you can do with them, but it would sure
  be nice to know more about the foundations.

- [HoTT](http://homotopytypetheory.org/) or *Homotopy Type Theory*
  refers to a new interpretation of Martin-Löf’s system of
  intensional, constructive type theory into abstract homotopy theory.
  The book's authors believe that univalent foundations will
  eventually become a viable alternative to set theory as the
  “implicit foundation” for the unformalized mathematics done by most
  mathematicians.^[I've lifted the last two sentences from the books
  website for obvious reasons. See
  [here](http://homotopytypetheory.org/) and
  [here](http://homotopytypetheory.org/book/).] I am not sure I'll
  ever make it this far, but it seems like a very interesting theory.
  Advanced Haskellers seem to get a lot out of category theory, maybe
  the same will be said for HoTT and dependent types.


### Videos

There are also a few videos and screencasts which revolve around
dependent types or some programming language that features dependent
types. First of all there is a four day course on Idris with [videos
and
excercises](http://www.idris-lang.org/dependently-typed-functional-programming-with-idris-course-videos-and-slides/)
held by the creator of Idris Edwin Brady. I have found the video and
the excercises to be a good way to get started with Idris.  There is
also an introduction to Agda with [nine
lectures](https://www.youtube.com/playlist?list=PL44F162A8B8CB7C87) by
Conner McBride.


## My plan

While I do appreciate some theoretical background, I am not sure that
I have the stamina to work through a huge amount of theory without
also seeing some applications. I have thus decided to try an approach
that combines theory with practice. First of all, I would like to work
through *Sofware Foundations*. While this is theoretically a book,
there are so many exercises that it nicely combines theory and
practice. Once I am done with that I would like to work my way through
*Certified Programming with Dependent Types*. At the same time I am
going to try to port some nice Haskell program to Idris and attempt to
prove the totality of as many functions as possible. Since Wouter
Swierstra has already ported [Xmonad to
Coq](http://www.staff.science.uu.nl/~swier004/Publications/XmonadInCoq.pdf),
this seems like an interesting candidate. Besides, I am running xmonad
and like it a lot, so what could be a better opportunity to learn more
about it?
