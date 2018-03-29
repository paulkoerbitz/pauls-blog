---
title: Announcing tslint-auto-disable
summary: A small tool to make adopting TSLint and stricter rules easier
date: 2018-03-29
---

I've written a small new tool called [tslint-auto-disable] with the
goal to make adopting TSLint or stricter TSLint rules for existing
large code bases easier. tslint-auto-disable is a command line tool that
automatically inserts a comment `// tslint:disable-next-line` before lines
failing to comply with TSLint rules.

[TSLint] is a fantastic static analysis tool which offers a wide range
of linting rules to make code cleaner, safer and to avoid potential
bugs.

Unfortunately, adopting TSLint initially or adopting new rules in an
existing code base with a few 10K lines of code can challenging. Either
all offending lines need to be fixed right away - this can be a significant
amount of work - or the error level must be dropped to warning and we must live
with a potentially large number of warnings. The trouble here is that the
new rules are not enforced for new code and that we can
drown in a sea of warnings and fail to identify new issues which may be
real problems.

This is where [tslint-auto-disable] comes in: When adopting TSLint or
adopting new rules, one can run `tslint-auto-disable` once to insert
disable comments above the offending lines. This makes the code base
pass the linting step, meaning that linting rules can be enforced
immediately for new code. Existing code which does not comply with
the rules will be littered with disable comments, these can be cleaned
up over time.

If you're using TSLint and you've been hesitant to adopt new rules due
to the amount of work involved with fixing all the problems in an existing
code base, give [tslint-auto-disable] a try - I would love to hear your
feedback on it.

[tslint-auto-disable]: https://github.com/paulkoerbitz/tslint-auto-disable
[TSLint]: https://palantir.github.io/tslint/