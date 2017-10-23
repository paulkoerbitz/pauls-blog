---
title: Why Lisp? A Clojure Newbie Perspective
summary: Lisp is powerful because its a programmable programming language
date: 2011-10-12
---

Should I learn Lisp? When I asked myself this question I found many
good articles that explained why Lisp is different and what is
different about it. Why these differences are worthwhile was a little
harder to understand and I generally didn't find a very good
explanation what the big advantage of Lisp is. I am a little surprised
by this. After all, if homoiconicity and macros are the thing that
really sets Lisp apart and puts it at the far end of the power
continuum of programming languages, wouldn't you expect the web to be
full of descriptions of the actual _benefits_ of these features?  I
would, but didn't find much. For example, Eric Raymond
[How To Become A Hacker](http://catb.org/%7Eesr/faqs/hacker-howto.html)
_"LISP is worth learning for a different reason — the
profound enlightenment experience you will have when you finally get
it. That experience will make you a better programmer for the rest of
your days, even if you never actually use LISP itself a lot."_ That
sounds nice, but a profound enlightenment experience is a little
abstract and I am not sure it's enough to convince everyone to learn
Lisp. Paul Graham, who probably sold me on learning Lisp,
[writes](http://paulgraham.com/avg.html) _"But
I think I can give a kind of argument that might be convincing. The
source code of the Viaweb editor was probably about 20-25%
macros. Macros are harder to write than ordinary Lisp functions, and
it's considered to be bad style to use them when they're not
necessary. So every macro in that code is there because it has to
be. What that means is that at least 20-25% of the code in this
program is doing things that you can't easily do in any other
language. However skeptical the Blub programmer might be about my
claims for the mysterious powers of Lisp, this ought to make him
curious. We weren't writing this code for our own amusement. We were a
tiny startup, programming as hard as we could in order to put
technical barriers between us and our competitors."_ Well, you might
find this convincing, or you might not. I found it intriguing that
_Lisp has something that no other language has, or ever could
have_. But it still says terribly little about what _benefits_ you
have from using Lisp. Only know _Blub_?  Sorry, can't explain.

I did not find these accounts entirely convincing but I was
intrigued. If these very smart people are advertising Lisp, then
clearly there must be _something_ to it. Yet, I have always wondered
how I myself would explain what it was that made Lisp special and why
it would be a good use of one's time to learn it? Simply saying _"it's
powerful but you won't understand until you try it yourself"_ was
unsatisfactory. Of course, you only ever _really_ understand something
yourself when you experience it first hand, but there had to be _some_
tangible benefits that could be understood without first learning the
language. Since I have learned Clojure and have witnessed how the
ecosystem around it grows, I think I understand a little better. Let
me try to explain why I think macros make Lisps incredibly powerful
and why this power increases with wider adoption.

The original Lisp was incredibly insightful. Paul Graham lists nine
original ideas that set Lisp apart when it appeared. Most of these
ideas have since been adopted by other languages, which make it all
the more clear how good these features were and how unbelievably ahead
of its time Lisp once was. Most have been copied, except for one:
Macros. Macros are what still sets Lisps apart. Marcos mean that you
can manipulate the language at compile time. The reason Lisp-type
macros haven't found their way in to other languages is that to have
powerful macros you need to have a language that can easily be
manipulated by the language. The way to achieve this to write the
language in its own data structures, to make it _homoiconic_. This
is the characterizing feature of Lisps and a language implementing it
would be considered a Lisp.

But what good are macros? With all the benefits that macros provide I
have not seen an account that lets me understand their benefits
without understanding them first. As Paul Graham writes that if you
only understand _Blub_ then you cannot really understand the power of
Macros. [This post](http://www.defmacro.org/ramblings/lisp.html)
attempts to explain the power of Lisps macros and its
homoiconic nature via XML. This is a nice idea, still for me it didn't
really click.

Macros, plain and simple, give you the possibility to modify the
source code before compilation. I read that the first thing you would
have to understand is that Lisp macros are nothing like macros in
other languages. Of course they are different, but this mislead me for
a long time thinking that macros in Lisp served an alltogether
different purpose than macros in, say C++. That's wrong, they do the
same thing. The difference between C++ macros and Lisp macros is that
Lisp macros are _macros done right_. They avoid all these nasty
problems that come with C++ macros and that make people advise you to
never use them.

Ok, you say. That's it? C++ macros done right? Ok, great, don't have
to learn Lisp if that's _all there is to it_. Wait. It might not seem
like much but macros done right yield extreme power. In fact macros
yield a lot of power in C++, too. Not the same power, mind you, but
still considerable. They allow you, for example, to introduce a
[FOR_EACH](http://www.boost.org/doc/libs/1_47_0/doc/html/foreach.html)
loop in C++. Only that they are so complicated that we can only let
experts, those that are capable of writing Boost-strenghs libraries,
handle them. With lisp macros everyone can write the equivalent all
the time.

Well, you might say, my favorite language already has _for_each_. Just
get a languae that was designed right, then you won't need macros,
won't have to learn Lisp, and can get on with your life. The point is
that for_each is not the point. If there was indeed a language that
already did all things perfectly, we would indeed not need macros. But
our needs and demands of a language evolve. Today it might be
_for_each_, tomorrow we might want to use
[pattern matching](http://en.wikipedia.org/wiki/Pattern_matching)
and next month we might want to have
[gradual typing](http://ecee.colorado.edu/%7Esiek/gradualtyping.html)
or a special
[built-in language to write SQL queries](http://en.wikipedia.org/wiki/Language_Integrated_Query).
The power of Lisp is that it gives you the means
to do this. You can write your favorite language extension _as a
library_. And you can get others favorite language extensions _as a
library_.

Why does this matter? For one this allows a language to evolve
extremely quickly, because not one person or a comittee has to do and
decide everything. Somebody might say "I like X, but it doesn't have
pattern matching and I really want pattern matching." If X is a Lisp
then they can just write an awesome
[pattern matching library](https://github.com/clojure/core.match).
Or they might say "I want to
[type some parts of X to get the benefits of compile-time type checking](http://docs.racket-lang.org/ts-guide/index.html)"
and if X is a Lisp then they can do
that. An yet somebody else might want a sepcial
[built in way to write SQL queries](https://github.com/LauJensen/clojureql),
and they can do that. So with Lisp macros
people can do all these things and the don't have to petition the
language designer. And other people can just use these solutions,
improve upon them or come up with better ones.

But there is something else. Language designers must be unbelievably
smart, I am in awe of them. But even these unbelievably smart people
cannot possibly forsee every use of their language or every problem
people will encounter. Eventually, it will turn out that some of their
design decisions were not perfect and it would make sense to change
them. What will happen then? Sometimes they will bring togehter more
smart people, form a comittee and decide what direction to
take. Sometimes they might make that decision by themselves or with a
few people they know and trust. Either way, if the language has seen
any kind of adoption, the following process of adopting the new
version of the language is painful and slow. This because if a
language introduces backward-incompatible changes a project will have
to comply with them fully or it can't work with the new version. It's
impossible to have some part of a project work with the new version
and some part with the old version. What's more the process of
deciding on new features is painful and slow because everyone knows
how hard these changes are and that they can therefore not be made
lightly. This is a trerrible climate for innovation. If you can keep
core of a language as small as possible, this doesn't need to
happen. The less there is to design the fewer design decisions you can
get wrong. And if the rest of the language is provided as libraries
then changing something there is not as painful. Projects can adopt
step by step and you can effectively keep both versions of the
language around. In fact you can have many versions of the language
around and let peole sort out which one works well. Making language
extensions and changes is cheap. This is a climate that is great for
innovation and means the language can keep evolving.

So why Lisp, or in my case Clojure? I have found that learning the
language is difficult at first, as you have to wrap your head around a
few new concepts and get over all these parentheses. But it is also
incredibly rewarding to work with a language that gives you so much
power. Introducing your own syntactic sugar is nice, it is awesome to
see how fast the language can evolve and to have a language that gives
you so much power that you could give it your own gradual type system
is just incredible.

### tl;dr

Lisp is different because it has a powerful macro system. Macros mean
that everyone can extend the language _as a library_. This means the
language can evolve extremely fast _and can keep doing so_ in the
future. Compare this to the new C++ Standard (hey,
[only took 8 years](http://en.wikipedia.org/wiki/C%2B%2B#C.2FC.2B.2B_standards)
or the transition from Python 2 to 3.

