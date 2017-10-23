---
title: Undo, Redo, Asynchronous Updates, Immutability and the Command Pattern
summary: Discussing the trade-offs between using two patterns to implement undo functionality.
date: 2017-01-27
tags: programming, patterns, trade-offs, event sourcing, undo-redo
draft: true
---

Undo/Redo is a nice UI pattern that is very convenient for users and
allows an application to reduce annoying confirmation dialogs. Indeed,
undo/redo is expected by users in many applications (and would
probably also be expected in others if they chose to provide it).

There are two essential patterns which are typically used to implement
undo/redo functionality. This post will discuss the trade offs between
the two, especially in light of asynchornous (bi-directional) updates
which may fail.

## The Immutability Pattern

One easy way to implement undo-redo is to use immutable (aka
persistent) data structures to maintain application state. To
1implement undo, we simply remember a number of old states and change
the application state back to the old state when the user desires to
undo an action. Using persistent data structures makes this cheaper
than it sounds, as much of the state is usually shared and so the
amount of extra storage space required to do this is typically more
proportional to the amount of state changed rather than the amount
of all application state. A clear advantage of this pattern is
that it is almost trivial to implement.

We can visualize how this pattern looks as follows:

## The Command Pattern

The other common way to implement undo-redo is to use the command
pattern, where state changes are stored as data.^[The command pattern
is strongly related to the idea of *event sourcing* which also aims to
store the events which lead to state changes as data.] In order to be
able to implement undo functionality, the state changes (aka *events*
or *actions*) must be stored in such a way that they can be reversed.
For example, when implementing undo via the command pattern in a text
editor, remembering that state change that text was deleted will do
us no good if we don't also remember *what text was deleted*.

Without taking other considerations into account, this pattern is
somewhat more challenging to implement than the immutability pattern.
We can't change the application state directly but must store it as
data, must implement a function that takes such data, a state change
and produces new data and must also store enough information to
compute the inverse of this action. Clearly this is a bit more
challenging than just moving the 'current state' pointer back or
forth one position.

We can visualize the command pattern as follows:


## Enter Server Updates ...

## ... Which Can Fail

## Enter Bidirectional Updates and History Invalidation

The story becomes even more interesting if we consider the
possibility that an application can not only push updates to
a server but also receive updates from it. A good example here
would be a collaborative editor (think Google Docs) where the
user can push updates to a server (and other users) but can
at the same time receive updates from it. In this case we
must integrate the two state histories in some way, which
we can visualize like this:

An interesting question is now how undo should handle changes which
were created by other users. While I am not sure that this is the only
sensible answer, a common approach is to disallow a user from undoing
the changes of another user. This makes sense if we think about the
text editor example: User A is making some stylistic changes on page 3
(e.g. applying cursive styling to some text), while user B is typing
up a new page after page 6 at a frenetic pace (which A might not be
aware of). After looking at the text for a while user A decides that
he doesn't like the cursive after all and hits the undo button. Now
**clearly** the undo button should not undo all the hard work that
user B has performed while A was looking at cursive text, hence the
desire to disallow users from undoing other users changes.

But how should we handle the spliced-together history if we can only
undo our own changes? The radical answer is to only allow changes up
to the first point in history where we have a change from a different
user. This works but may not be very satisfying for the users as it
basically disables the undo functionality if users are working at the
same time.

A better approach is to move back in the history and only undo our own
changes while skipping the ones by others. This is a bit harder than
it sounds as it is possible that some actions might not be possible to
undo after applying the other users changes. As an example, consider
that instead of frenetically typing text, user B decides to delete the
text that user A has just made cursive. Clearly undoing the
application of cursive style by user A does not make sense now that
the text is gone. Thus we need to check some kind of precondition
to verify that undoing a change still makes sense.

## Conclusion

So there we have it, two ways of implementing undo/redo along with
some advantages and disadvantages. Using immutable data structures
is simpler when there are no other requirements besides undo/redo,
but when asynchronous updates come into play it generally becomes
much easier to rely on the command pattern. Thinking about these
concepts and how they relate to each other, I can't help but think
that there must be some interesting conditions under which
they are equivalent and that there is a somewhat deeper
connection, but that is probably the story of another post!
