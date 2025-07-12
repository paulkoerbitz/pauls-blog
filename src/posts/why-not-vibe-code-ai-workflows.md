---
title: Why can't I vibe-code AI workflows?
summary: Why do none of the popular AI workflow automation tools use AI to automate AI workflow creation?
author: Paul Koerbitz <paul@koerbitz.me>
date: 2025-07-12
---

I've been playing around with AI workflow automation tools like [n8n], [lindy] and [make] a bit. For
all the glory that youtuber after youtuber heaps upon them and claims that they will replace you
real soon now, I find them fairly basic and frustrating. They are just no-code tools. Sure a
non-programmer can program a certain amount of automation with them and using LLM APIs they can
solve some problems that were previously not solvable. Still, apart from having access to those LLMs,
I don't really see what is new here.

This got me to think: why do none of the popular AI workflow automation builders use AI to automate
workflow creation? Instead, creating these workflows is increadibly tedious, it has all the disadvantages
that no-coding tools have. The main advantage of these tools is that they come readily configured
with a vast number of intergations for other software tools. Apart from this, configuring a workflow is
at least as time consuming as programming one and the workflow automation tools don't supply a lot of
tools to handle the brittleness of LLM intergrations. They also don't seem to offer much in the way of
automated testing, monitoring or alerting.

With workflow building being pretty cumbersome, I really wonder why none offer building these workflows
using natural language? Internally they have to have some sort of internal language or data structure
and generating these should not be that hard. It seems pretty ironic that influencers herald the AI
revolution that these tools bring, yet they don't use AI to ease the incredibly tedious workflow creation.

[n8n]: https://n8n.io
[lindy]: https://lindy.ai
[make]: https://make.com
