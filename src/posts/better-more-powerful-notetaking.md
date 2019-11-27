---
title: I Want a Better Note-Taking System
summary: The notetaking app of my dreams
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-11-27
---

In my project to [learn datascience][1], I've come to the conclusion that
I need a better way to take notes than the notes I have scribbled into my
notebook so far.

What I've done so far is to write questions (based on the [question book method][2]) about
things I see in video lectures and then proceed with an [open recall][2] session
to recall as much as possible from the lecture. After the open recall I go through
the questions written earlier and answer these if I haven't answered them already
during open recall.

I've found this process to work really well for optimizing what I retain immediately
from a lecture, but currently I'm not producing persistent notes that are well suited
for future reference. In addition, I would also like to produce flash cards which I can use
to commit (parts of) the material to long term memory - why not include these directly
in the notes? Taking notes on a technical subject, I would of course like to include
sections with code, mathematical formulas and diagrams. And while we're at it, why
not give this system a powerful way to tag concepts, create concept-hierarchies and
cross-reference them?

So overall, here is a laundry list of the features which I would like to see in my
perfect note-taking application:

- store notes in plain text to support VCS and avoid vendor lock in
- support exporting notes to be converted to HTML to publish them on the web
- support code sections, ideally with syntax highlighting
- supports math sections, ideally latex based notation (I'm already familiar with that)
- supports diagrams and drawing
- define flash cards inline, export them and import them to a flash card system (e.g. Anki)
- tag concepts and build concept hierarchies, creating references to the concepts and links to them
- can have margin notes (e.g. for question book questions)
- easy linking to parts of videos (youtube, coursera)

There is support for a lot of this out there, but I don't think there is anything that
quite meets the bar. A lot of this can be done by combining [KaTeX], [mermaid] and [Markdown]
and there are nice [applications][notable] which combine these libraries to meet a lot of these
features. But I don't think the enable tagging concepts (inline in the text) and enable
cross-referencing them. Similarly, I also don't think there is support for building flash
cards (I understand that this is a bit of an esoteric requirement).

On the other hand, there is a [Racket] DSL called [Pollen] whose goal
it is to provide a programmable language to create online books. Pollen looks a lot
like something I want, but I'm not really sure if I it (a) does what I want or how
easy it is to get it to do that and (b) if I really want to buy into the Racket ecosystem
which I don't know anything about and which is surely not as active as JavaScripts.
It might be possible to combine the two and leverage things like katex, mermaid and
syntax highlighting for codeblocks from JavaScript and more advanced markup techniques
from Pollen.

I'm not sure where I will go with this but its an itch that I would like to scratch.
I think the responsible thing is to look for the currently best solution and go with
this for the time being. Maybe I'll give Pollen a go and see how that works for my
purposes.

[1]: /posts/ultralearning-datascience
[2]: /posts/ultralearning-book-summary#how-to-practice-retrieval
[notable]: https://github.com/notable/notable
[Pollen]: https://docs.racket-lang.org/pollen/
[Racket]: https://racket-lang.org/
[KaTeX]: https://katex.org/
[mermaid]: https://mermaidjs.github.io
[Markdown]: https://en.wikipedia.org/wiki/Markdown