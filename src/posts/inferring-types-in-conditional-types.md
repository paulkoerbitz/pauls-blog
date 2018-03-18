---
title: Inferring Types in Conditional Types
summary: Exploring TypeScript's new infer keyword which allows pattern matching on types
date: 2018-03-18
---

In addition to [TypeScript 2.8]'s new feature called
[conditional types] which I coverd in the [last post], TypeScript
2.8 also adds a new keyword called `infer`. It allows inferring and *extracting* a type inside of a conditional statement. This is really
exciting as it allows us to pattern match on type parameters which was
not possible in TypeScript up until now!

To revisit, conditional types essentially give you an `if` statement along with
the ability to *ask questions at the type level*. This enables some
very powerful constructs at the type level. Conditional
types look as follows:

```TypeScript
T extends U ? X : Y
```

Now we can use the `infer` keyword in the `extends` clause. With it, we
can infer a type and give it a name and we can use that name in the `then` clause (the part between `?` and `:`) of the conditional type. This allows
us for example to extract the return type of a function (this previously
required an ugly hack and couldn't be done with just a type operator in TypeScript):

```TypeScript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

With the `extends` clause, we check if `T` is a subtype of a function type
returning `R` and if so, the resulting type becomes `R`, the return type
of a function. It evaluates as follows:

```TypeScript
type T0 = (x1: string, x2: number) => string[];

// pseudo code to show how the type operator evaluates
ReturnType<T0>
    = ReturnType<(>
    = ((x1: string, x2: number) => string[]
        extends (...args: any[]) => infer R)
        ? R : never
    = ((x1: string, x2: number) => string[]
        extends (...args: any[]) => string[])
        ? string[] : never
    = string[];
```

In a similar vein, we can also extract the argument types
of a function

```TypeScript
FirstArgType<T> =
    T extends (x: infer X, ...args: any[]) => any ? X : never;

SecondArgType<T> =
    T extends (x: any, y: infer Y, ...args: any[]) => any ? Y : never;

// and so on...
```

## Inferring union and intersection types

It is possible to use the same type variable in multiple positions
as well. Consider the following:

```TypeScript
type ParameterType<T> = T extends { a: infer U, b: infer U } ? U : never;
type T1 = ParameterType<{ a: number, b: number }>; // T1 = number
type T2 = ParameterType<{ a: string, b: string }>; // T2 = string
type T3 = ParameterType<{ a: number, b: string }>; // T3 = number | string
```

At first it may seem that in the third example the condition should
not hold and that thus `T3` should be `never`, however TypeScript
can use a union type which allows both `number` and `string`. So
it will generally do that for types which are covariant.

Similarly, it will infer intersection types for type variables in
contravariant positions (generally, these are argument types):

```TypeScript
type ArgumentType<T> = T extends (x: infer U, y: infer U) => any ? U : never;
type T4 = ArgumentType<(x: number, y: number) => any>; // T4 = number
type T5 = ArgumentType<(x: string, y: string) => any>; // T5 = string
type T6 = ArgumentType<(x: number, y: string) => any>; // T6 = number & string
```

The [merged pull request] by Anders Hejlsberg's introducing
the `infer` keyword has some additional details on how conditional
types are evaluated, if you want to dig even deeper.

I am very excited that we can now infer and extract types as this
makes a lot of things much simpler in type level programming in
TypeScript!

[TypeScript 2.8]: https://github.com/Microsoft/TypeScript/milestone/61
[conditional types]: https://github.com/Microsoft/TypeScript/pull/21316
[last post]: /posts/a-look-at-typescripts-conditional-types.html
[merged pull request]: https://github.com/Microsoft/TypeScript/pull/21496
