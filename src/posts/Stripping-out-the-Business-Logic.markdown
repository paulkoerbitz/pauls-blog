---
title: Stripping out the Business Logic
summary: An exploration of the central aspects of business programming with the objective to abstract them and focus programming around them.
date: 2013-08-07
---

What I am writing day-in and day-out can probably best be described as
*business programs*.  To me *business programs* are programs whose
essential purpose it is to keep track of some state, control
processes, make decisions, and communicate with external services.
One question that intrigues me is how one can seperate out the
*business logic* from the rest of the program.

Business logic is, as the name implies, about business first and logic
second, and since business needs can change on a whim, the business
logic needs to change too, usually much more often than the rest of
the application. Furthermore, the business logic is the raison d'être
of the whole application, so it makes sense to have this logic in one
place instead of intermingling it with implementation specific
logic. Finally, when I write such programs it always seems I have to
do way too much work to achieve what I want. To me, seperating out the
business logic into a seperate domain specific language (DSL), module,
workflow pattern, or whatever, holds the promise that to create
additional functionality I only need to implement that functionality
in the business logic DSL or module, reducing the amount of work
needed and thus speeding up development considerably.

However, while there is surely some interest in this topic, I have yet
to find the best way to achieve this. As far as I can tell there may
be a lot of activity, but this activity doesn't result in well
communicated solutions that are easy to comprehend. Maybe I just don't
get it, but I have yet to find somebody to tell me: this is how you do
it. It seems that quite often business logic is simply mixed with the
rest of the application. In this post I want to explore several
possibilities of how business logic can be seperated from the rest of
the application and described concisely.


## Goals

In an ideal world, the representation of the business logic should
fulfill the following criteria:

Succinct

:   Since one of the objectives is to have the business logic in one
    place, the representation of it should be as small as
    possible. Boilerplate and verboseness should be avoided.

Unambiguous

:   Each instance of a representation should have only one meaning.
    This may seem obvious, but as far as I understand this is not
    necessarily true for [BPMN][BPMN]. This means that a *rountrip
    translation* (representation $\rightarrow$ program $\rightarrow$
    representation) should at least be theoretically possible and lead
    to equivalent results.

Easy to understand

:   The representation of the business logic should convey the logic
    to a reasonably intelligent reader. The reader should not have to
    have intimate knowledge with how this representation is translated
    to a program in order to understand what will happen.

Testable

:   Since the representation will contain the entire business logic,
    which will change often and might be complex, it is important that
    this logic is easily testable to make sure we got everything right.

Representable

:   The representation should be easily representable in the language
    one is working with. If it is it becomes easier to serialize and
    deserialize a representation along with its state and to display
    it to a (support) user.

Complete

:   We should be able to represent everything we want to represent
    in this representation, otherwise we'll have to work around it
    at which point we would have probably better done without it.


## Some Possible Solutions

### Finite-State Machines

[Finite-state machines][FSM] are sometimes[^1]^,^[^2] suggested for
this task. Finite-state machines are well understood, easy to draw
and are able to model all processes which only have a, well, finite
number of states. On a high level, this should include all sensible
business processes. However, once we include storing and modifying
arbitrary data in our application, we are clearly out of finite-state
machine territory. Therefore, to describe *all* of the business logic
we will clearly need some extension to finite state machines. If that
extension is *ad-hoc* then we might lose the benefits that finite-state
machines provide in the first place.


### Workflow Languages

There are also a large number of workflow languages, many of which are
found in some enterprise software vendors packages.[^5]^,^[^6] To me
the most interesting are the *Business Process Modell and
Notation*^[[Business Process Modell and Notation website][BPMN].] and
the *Yet Another Workflow Language*[^3] which was created by Arthur
ter Hofstede, an academic how studies the field and has written an
influential review paper.[^4] These languages seem interesting and
have clearly some industry weight behind them, it seems fairly
difficult to find good introductory material on them that is not (a) a
1000-page tome of a standard or (b) some software vendors sales pitch
documents. Some of these languages also have problems, for example
there seems to be no general unambiguous way to translate BPMN into
a program.[^7]

Overall, I am a little disappointed with the quality of the
introductory information that I have found so far. The most promising
document seems to be the review paper by ter Hofstede and the
YAWL language.


### A Process DSL

What we have done at work is that we have basically defined an
expression language that is a C++ DSL. With this language you
can write expressions such as

~~~{.cpp}
if_(customerHasValidEmailAddress())
.then_(completeLogin())
.else_(sendVerificationEmail() and showEmailVerificationPage())
~~~

and so on. Each of the mentioned steps has to be implemented in
the host language to perform the desired action. This means of
course that the implementation burden is still there, but at
least steps that are already defined can be reused in a different
context.

One problem I see with this approach is that there is no way to store
state inside the process description, in essence this is a language
that has boolean expressions and stores everything else in global
state. This also means that for every new piece of state, however
temporary, requires a new *thing* that can contain it. I have found
that this can limit reuse and sometimes make these processes
confusing. But this DSL seems essentially like an implementation
of the previously described workflow languages.


### A More Powerful DSL

This is where I would like to go. A DSL that can hold some temporary
state, where variables can be bound and reused at a later state.
Ideally, this DSL would also permit a way to manage the data model
directly, so that it would essentially be able to implement the
entire business logic without having to fall back to implementations
in the host language all the time. Alas, right now, this is only
an idea and I am not sure how it will work.


## Outlook

This post has barely scratched the surface of the task of abstracting
out the business language into a seperate representation. I hope I
have transmitted the idea of why this is desireable and outlined a
few of the possible approaches that I have found during my inital
research of the topic. In future posts I hope that I'll be able to
explore some of these approaches in more depth.


[YAWL]: http://www.yawl.org/ "Yet Another Workflow Language"

[BPMN]: http://www.bpmn.org/ "Business Process Model and Notation"

[FSM]: http://en.wikipedia.org/wiki/Finite_state_machine "Wikipedia: Finite State Machines"

[^1]: [My question](http://stackoverflow.com/questions/11327564/web-development-complex-processes-are-state-machines-the-only-way-to-go) on stackoverflow about a year ago on the same topic.

[^2]: Shopify technical blog: [Why developers should be force-fed finite state machines](http://www.shopify.com/technology/3383012-why-developers-should-be-force-fed-state-machines).

[^3]: [Yet Another Workflow Language website](http://www.yawlfoundation.org).

[^4]: [Workflow Patterns](http://eprints.qut.edu.au/9950/1/9950.pdf) review
      paper by of workflow pattern systems by Arthur ter Hofstede.

[^5]: [Spring Web Flow Reference Guide](http://static.springsource.org/spring-webflow/docs/2.0.x/reference/html/index.html).

[^6]: [OS Workflow](https://java.net/projects/osworkflow).

[^7]: [Why BPEL is not the holy grail for BPM](http://www.infoq.com/articles/bpelbpm).
