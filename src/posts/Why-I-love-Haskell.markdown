---
title: Why I love Haskell
summary: My summary of what I love about Haskell and why I think it is a language worth learning and using. Argumentative ammunition for discussions.
date: 2013-07-19
---

I really like Haskell. But why? In this post I try to articulate why I
like this language so much and why I think it would be worth most
programmers' while to learn it. None of this is new, but I want to
express my own view in my own words. I write this in part to clarify
my thinking and in part to improve my ability to articulate these
points.

Many of my arguments apply to other strongly typed functional
programming languages. I just happen to know Haskell much better
than any of the other ones and thus I am focussing on Haskell.


## [Purity is good for you](http://yow.eventer.com/events/1004/talks/1054 Simon Peyton Jones: [Escape from the Ivory Tower: The Haskell Journey from 1990 to 2011)

When I first started to learn Haskell purity (In Haskell, *purity*
means that a function must be free from side effects such as
printing to the console or modifying variables.)
seemed like a crazy concept. Programming by modifying some kind of
state and interacting with the 'real world' is so ingrained in
mainstream programming languages that it is hard to imagine how you
can get anything done without it.  Ironically, after having
programmed in Haskell for a while, impure languages now make my
toenails curl. *What do you mean, I have to look **at the function
body** to find out if it writes to a file, makes calls over the
network, or talks to the database? That is **insane**!*

The beauty of Haskell's way of dealing with pure and impure
functions is that you can tell from the type signature what a
function is and isn't allowed to do. You can still do all those
impure calls-over-the-network and array-update-in-place things that
regular languages allow you to do, but you have to tell everyone
about it in your function's type signature.

This, and the Haskell community, pushes you to make your program as
pure as possible. I have found that this has huge benefits: Pure
functions are easy to understand: just by the name and type signature
it is usually obvious what a function does. When you do inspect a
function's body you don't have to keep track of what state the world
is in right now (or all the states that it could theoretically be in),
its behavior only depends on your input parameters.  As a result, this
makes programs (large parts of which are now pure functions) much
easier to understand. In fact, I find that one of the hardest things
about understanding programs is to keep track of state. This burden is
hugely reduced in the pure part of your code.

Purity makes testing a breeze. Most of the time the hard part about
writing tests is to construct the state where the tests should run,
verify it was changed in the intended ways, and clean up
afterwards. Worse, the code you want to test could depend on a global
state that you can't modify easily, such as the system time or the
random number generator. If you have pure functions, you just pass in
the arguments and check the result. Testing becomes much easier.

Pure functions simplify conceptualizing and designing programs.  In
functional programming you have two concepts: functions and data.  The
two are orthogonal in their purpose. The functions modify your data
until you get to the result. I find that conceptualizing and reasoning
about data that gets successively modified by a number of (pure)
functions is much easier than doing the equivalent with an object
oriented approach. It is just very difficult to mentally enumerate all
the possible states that a number of different objects could be in at
any given time. But understanding all possible states is necessary to
draw conclusions about the behavior of a program.

Have you ever tried to reuse some piece of code and found to your
dismay that it reads or writes stuff from or to disk, uses the
system time function in a way that is now inappropriate, talks over
the network, prints to the console or pops up dialogs? These things
are hugely inconvenient and often inhibit reuse. State just does
not compose well and having the ability to modify state tends to
create implicit dependencies. If you have a pure function, you can
call it anywhere you want!

You can, of course, try to reap most of those benefits by discipline,
e.g. by trying to minimize state whenever possible and to make as many
functions pure as possible. In fact, doing that is probably the way in
which Haskell has most changed how I write code in other languages. I
now strive to minimize the amount of code that causes side effects
wherever possible. Alas, I find that the type system really makes a
difference here: when you have to inspect each and every function to
find out (or recall) if it is pure or not, the benefit of writing pure
functions is significantly reduced. I also find that other languages
are lacking the *cultural* aspect of seeing state as bad and striving
for purity. So you have 'time()', 'random()' and calls to the outside
world all over the place. It might seem easier at first, but more
often than not, it will come back to bite you. Purity has had such a
profound impact on me that I cannot imagine that I will ever call a
language that does not have control over effects in the type system my
favorite programming language.


## Terse syntax

Haskell is a pretty terse language. When you compare the amount of
code you have to write to get typical tasks done it is usually right
up there with Python, Ruby, Clojure and the likes. And this is the
case even though Haskell has a strong static type system which in
mainstream languages is often associated with verbosity. I do not
consider syntax to be all that important, but not having to read or
write huge amounts of boilerplate is definitely a plus.


## [Believe the Type](http://learnyouahaskell.com Proudly stolen from Learn you a Haskell)

Haskell is often lauded for its strong type system and rightly
so. But what does having a strong type system mean? Why is
Haskell's type system *stronger* than Java's, C++'s or that of
other languages that are considered to have a strong static type
system?


### More precision

Haskell's type system is stronger than that of many other languages
because it is more precise: you can distinguish more things based on
their type. A prime example of this is the null reference or pointer
present in many languages. A null pointer is fundamentally
type-unsafe: If the pointer is null most operations that you could
usually do with the pointer will be invalid, and *the compiler is
going to do zilch about you doing it in error*. Many people, including
its inventor (Tony Hoare created ALGOL W which introduced null
references. He has called this his [*billion dollar
mistake*](https://en.wikipedia.org/wiki/Tony_Hoare#Quotations).),
consider null references a mistake, yet they persist in all mainstream
languages.

This is an example where more type safety actively eliminates a
class of errors which are hard to get rid off in other languages.
In general, the more things that can be expressed and checked at
compile time, the more errors you will be able to rule out before
ever running your program.


### Sum types

The previous example with null pointers is actually part of a
bigger concept which is usually referred to as *sum types* or
*tagged unions*. The idea is that values of a certain type can
have several forms, based on what state they are in.  Most
languages don't have support for sum types, yet they are a very
powerful concept. They allow you to rule out many things that
should be impossible at the type level, giving you more precise
types.

As an example, imagine you want to keep track of the state of a
financial transaction. If the transaction has been initialized you
have the init time, the amount, and a currency. If the transaction
has succeeded we furthermore have a succeeded time stamp, and an
authorization code. If it has failed it has a failed time stamp,
and a failure reason, but no auth code. In a language without sum
types this might be represented like this:

```haskell
struct Amount
{
  int amount;
  string currency;
};

struct Transaction
{
  TransactionState state;
  Timestamp initTime;
  Amount amount;
  Timestamp failedTime;
  string failedReason;
  Timestamp succeededTime;
  string authCode;
};
```

It is of course possible to infer from the field names, to some
degree, which field should be used when, but it is nonetheless not
entirely clear. Does a failed transaction have an amount? Or an auth
code? Instead consider the following definition in Haskell:

```haskell
data Amount = Amount { amount :: Int, currency :: String }

data Transaction =
     InitialTransaction    { itInitTime :: Timestamp
                           , itAmount :: Amount }
   | FailedTransaction     { ftInitTime :: Timestamp
                           , ftAmount :: Amount
                           , failedReason :: String }
   | SuccessfulTransaction { stInitTime :: Timestamp
                           , stAmount :: Amount
                           , authCode :: String }
```

The Haskell representation of the transaction can have one of three
states each of which carries the data relevant for this state (the
example also reveals one of Haskell's weak points, namely that the
accessors of a record cannot have the same name). This clearly
communicates to any reader of the code what state must be present
in each case and what is not going to be present. What is more, in
a function using this data type, the compiler will check that you
handled all the cases and you can't even write a program that
accesses data that is not available in a case. If you later
have to add a case, the compiler will inform you of all the places
where this case is not handled yet. This hugely helps you avoiding
bugs.


### Compiler checked documentation

More precise types also communicate more to other programmers.
Have you ever worked with code where you and your cocoders had the
mutual understanding that a certain pointer or reference can never
be null? That certain keys must be present in a map or that some
string field in a struct will always be null if conditions X and Y
hold? The problem with this knowledge is that it is
implicit. Implicit knowledge is not enforced in interfaces, at best
a comment will document it. Unfortunately comments are notorious
for not being kept up to date with the code. Since it is not
verified and does not affect the resulting program, it is all too
easy to let comments and code diverge. Then the comments become
actively misleading and therefore many have argued to use comments
as sparingly as possible.(Whatever you think of Robert Martin and
[Clean Code](http://books.google.de/books?id=_i6bDeoCQzsC), I think
this is a point that he makes persuasively.)

Yet conveying this kind of information is critically important when
programming in teams. If certain invariants should hold then it is
important that everyone understands this and thus it should be
documented somewhere and checked somehow. What better place to do
this than in the types? It clearly conveys the required information
to the programmers and 'ye old compiler assures you that these
invariants actually hold. If they are not, your code won't compile
and there are few incentives that work better on programmers.


### Encode your invariants in the type system

All the above points really harp on the same idea: it is better to
**encode your invariants in the type system**. Doing so will move more
knowledge into an area of the code that is easily seen and the
compiler will be your alley in maintaining those invariants. A more
powerful type system will allow you to do more of this, which is, all
other things being equal, good.

Of course, there is always the question of tradeoffs. Dynamically
typed languages are popular for some reason after all: a type
system can get in the way. Yet I find that (after a learning
period) Haskell's type system does so surprisingly little and
that its power is far too large to give it up for the occasional
inconvenience.


## The right kind of abstractions

Another magical thing about Haskell is that its creators and its
community just come up with the right, often mathematically
inspired, abstractions. That can mean that things are a bit abstract
at times but that is part of the beauty.

What is a good abstraction? To me it is a small, useful concept
that abstracts an underlying pattern from a number of concrete
contexts. By that measure we can judge an abstraction by (a) how
simple the concept is, and (b) the number of different contexts to
which it applies. Alas (a) is often not clear until you fully grasp
the abstraction, which, given its abstract nature, can be hard.

Let's check out Haskell's most famous abstraction the monad.  A
monad is an abstraction for doing things sequentially where the
second thing can depend on the result of the first. It is
unbelievable in how many situations it applies, for example
optional values, lists, things that carry state around (e.g. random
number generators), parsers, IO, software transactional memory, and
lots and lots of other concepts. Note that these are quite
unrelated, or did you ever think that an optional value was
basically the same thing as a parser?  When you understand this
abstraction then you will have a really good intuition on what a
certain kind of monad is supposed to do even if you have no idea
how it is implemented.  You're going to think: this is a monad, so
it should do this in this situation and you're going to be
right. This is the right kind of abstraction and I would kill to get
more of them.

This is just one example and Haskell's abstractions don't stop
there. In fact, many abstractions are so deceptively simple it is easy
to forget about them until we compare to how this would be done in a
language that doesn't offer them. One such concept is
'higher-order-functions', that is functions that take other functions
as arguments. This is called the 'strategy pattern' in OO design
patterns.  But in Haskell this concept is so simple that you will
never think *"hm, should I use the strategy pattern here?,"* instead
you're breathing these things without wasting the first thought on it.
That these powerful patterns become so intuitive is really
important. If you have to grab the design pattern book to recall how
exactly that abstract factory pattern works then you're unnecessarily
spending precious brain cycles whne you should, instead, be spending
them on solving your problem. Worse, you're not nearly as likely to
come up with solutions that make heavy use of these patterns because
it is much more difficult to get an intuitive understanding of
them. This is necessary, however, to creatively solve problems. If
you're still struggeling with the concepts then it's unlikely that
you'll use them to their full potential. This is why good abstractions
are so imporant and Haskell has loads of them.


## Higher-order-thinking

In his 1977 Turing Award lecture, John Backus famously asked [*"Can
Programming Be Liberated from the van Neumann
Style?"*](https://dl.acm.org/citation.cfm?id=359579). He bemoaned
the lack of abstractions inherent in imperative programming
languages and layed out the vision for a functional language in
which operations would combine programs to form new programs, thus
raising the bar of abstraction. 36 years later, we're not quite
there yet, but I think languages like Haskell are the closest we
can get at the moment. They certainly allow you to abstract from the
*"word-at-a-time"* programming most of the time and think on a
higher level.

Freeing your mind from unnecessary details lets you focus on higher
order abstractions. I think the sheer number of powerful ideas that
have come out of Haskell and similar languages (e.g.  purity, type
classes, monads, STM) indicate that Haskell makes a useful
tradeoff.


## The future is already here ...

... it is just not very evenly distributed. Haskell has driven a lot
of innovations that have slowly shown up in other languages and it is
still going strong. Of course, I am not going to claim that all
programming language innovation comes from Haskell. However, I think
that it is fair to say that Haskell is responsible for a good chunk of
new ideas and that the current bleeding edge is made up of languages
that were heavily inspired by either Haskell or a member of the ML
family. So if you're the kind of person that likes to find out about
the new possibilities sooner rather than later, I think you owe it to
yourself to check out Haskell.


## Some gripes

Is it all love and roses then? Of course not. There are some gripes I
have with Haskell and eventually I think it is going to be replaced by
an even better language. But Haskell has driven the state of the art
forward, has allowed me to evolve my thinking, and is currently the
most practical language combining a number of very innovative
features.  Additionally, I think of Haskell more as a set of ideas
than as a specific language implementation. The languages that will
eventually supersede Haskell have so much in common with it that to me
they all fall into the *Haskell camp*. If you're comming from the
traditional imperative-OO ship then learning Haskell is probably the
biggest jump you'll have to make.


## The end

So that is my super long Haskell love letter. If your interest is
piqued, I encourage you to check it out. The learning curve can be
a bit steep at times, but hey, that means you're actually learning
something new instead of the same old stuff dressed up slightly
differently!

To get started, I think [Learn you a
Haskell](http://www.learnyouahaskell.com) is a great resource.  The
[School of Haskell](https://www.fpcomplete.com/school) is also
quite nice, especially if you like to experiment with things
interactively. If you have difficulty understanding monads I
recommend [You could have invented monads (and maybe you already
have)](http://blog.sigfpe.com/2006/08/you-could-have-invented-monads-and.html). [All
about monads](http://www.haskell.org/haskellwiki/All_About_Monads)
is also quite good, but more demanding. Just keep going, you will
understand them eventually and then wonder why you found them
difficult in the first place ;). The Haskell [irc
channel](http://www.haskell.org/haskellwiki/IRC_channel) and the
super-friendly haskell-beginners and haskell-cafe [mailing
lists](http://www.haskell.org/haskellwiki/Mailing_lists#Mailing_lists_in_detail)
are also worth checking out.
