---
title: Type-level Programming in TypeScript - Tools of the Trade
summary: A look at the various TypeScript features that enable type-level programming
date: 2018-03-11
draft: true
---

In the [last post] we looked at [typeful-redux]'s internals and looked
at how the TypeScript type system is leveraged to infer types in a neat
way. In this current post I want to take a look at what features the
TypeScript type system offers to enable type level programming.

## Generics aka Parametric Polymorphism

## Type Inference

## Recursive Types

## Intersection Types

## Union Types

## Index Types

## Mapped Types

## `keyof` and Lookup Types

## Conditinal Types

[Conditional types] is a brand new (unreleased at the time of writing)
addition to TypeScript 2.8. It essentially gives an `if` statement
at the type level along with the ability to *ask questions at the type level*.
This enables some very powerful constructs which were not possible
before.


[Intersection types]: https://github.com/Microsoft/TypeScript/pull/3622
[Conditional types]: https://github.com/Microsoft/TypeScript/pull/21316
[last post]: /posts/typeful-redux-internals.html
[typeful-redux]: https://github.com/paulkoerbitz/typeful-redux