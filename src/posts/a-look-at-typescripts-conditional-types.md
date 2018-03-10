---
title: A Look at TypeScript's Conditional Types
summary: A first look at TypeScript 2.8's conditional types and what you can do with them
date: 2018-03-11
---

[TypeScript 2.8] introduces a fantastic new feature called
[conditional types] which is going to make TypeScript's type system
even more powerful and enable a huge range of type orperators which
were previously not possible. Let's take a look at how this exciting
new feature works and what we can do with it.

Conditional types essentially give you an `if` statement along with
the ability to *ask questions at the type level*. This enables some
very powerful constructs which were not possible before. Conditional
types look as follows:

```TypeScript
    T extends U ? X : Y
```

In Anders Hejlsberg's words this *adds the ability to express non-uniform type
mappings*. Before conditional types, there was basically no way to make
an either-or decision in type operators, now there is.

The *question* in the conditional type is the `extends` check - if `T extends U`
then the resulting type is `X`, otherwise it is `Y`. A type `extends` another
type if it is assignable to it, or in some sense "at least as big as" the other type. If
`T extends U` you can *do everything with `T` that you can do with `U`* or
*use `T` everywhere you can use `U`*.

Here is a very simple (and slightly silly) example for using conditional types:

```TypeScript
type IsNumberType<T> = T extends number ? "yes" : "no";

type Yes = IsNumberType<3>; // type "yes"
type No = IsNumberType<"foo">; // type "no"
```

A more interesting and more useful example is to implement JavaScript's
`typeof` operator at TypeScript's type level:

```TypeScript
type TypeName<T> =
    T extends string ? "string" :
    T extends number ? "number" :
    T extends boolean ? "boolean" :
    T extends undefined ? "undefined" :
    T extends Function ? "function" :
    "object";

type T0 = TypeName<string>;  // "string"
type T1 = TypeName<"a">;  // "string"
type T2 = TypeName<true>;  // "boolean"
type T3 = TypeName<() => void>;  // "function"
type T4 = TypeName<string[]>;  // "object"
```

## The *Distributive Rule* of Conditional and Union Types

One interesting rule about conditional types is how they interact with
union types. A conditional types *distributes over* a union type with
the following distribution law:

```TypeScript
(A | B) extends T ? X : U = (A extends T ? X : U) | (B extends T ? X : U)
```

Let's see how we can apply this law to the `TypeName` operator defined
above:

```TypeScript
TypeName<string | (() => void)>
= (string | (() => void)) extends string ? "string" :
  (string | (() => void)) extends number ? "number" :
  (string | (() => void)) extends boolean ? "boolean" :
  (string | (() => void)) extends undefined ? "undefined" :
  (string | (() => void)) extends Function ? "function" :
  "object";
= (string extends string ? "string" :
   string extends number ? "number" :
   string extends boolean ? "boolean" :
   string extends undefined ? "undefined" :
   string extends Function ? "function" :
   "object")
  |
  ((() => void) extends string ? "string" :
   (() => void) extends number ? "number" :
   (() => void) extends boolean ? "boolean" :
   (() => void) extends undefined ? "undefined" :
   (() => void) extends Function ? "function" :
   "object")
= "string" | "function"
```

So we have a substitution rule by which we can evaluate conditional types
where the argument is a union type.

### The `Diff` Type Operator

An interesting and useful application of this distribution rule is to
*remove cases* from union types. For example, it is easy to write a
`Diff` type operator which relies on this rule:

```TypeScript
type Diff<T, U> = T extends U ? never : T;
```

This might seem confusing at first (it certainly did to me!), but makes
sense when looking at an example:

```TypeScript
Diff<"a" | "b" | "c", "a" | "b">
= ("a" | "b" | "c") extends ("a" | "b") ? never : ("a" | "b" | "c")
=   "a" extends ("a" | "b") ? never : "a"
  | "b" extends ("a" | "b") ? never : "b"
  | "c" extends ("a" | "b") ? never : "c"
=   never
  | never
  | "c"
= "c"
```

### The `NonNullable` Type Operator

A useful application to this the `NonNullable` type operator which
removes the types `null` and `undefined` from a union type:

```TypeScript
type NonNullable<T> = Diff<T, null | undefined>;

type Foo = NonNullable<string | null | undefined>; // Foo = string;
```

It would seem like we could the inverse of the `Partial` type operator
with this technique - namely making all parameters on an object required.
However, this is not the case:

```TypeScript
type AlmostNonPartial<T extends object> =
    { [KEY in keyof T]: NonNullable<T[KEY]>; };

type Bar = AlmostNonPartial<{ a?: number; b?: string; }>;
// o_O - a and b are still optional on Bar:
// Bar = { a?: number | undefined; b?: string | undefined; }
```

Fear not - rescue is in sight, TypeScript 2.8 also provides
[better control over mapped type modifiers], with which
we can write the NonPartial operator:

```TypeScript
// notice the -? which removes the ? modifier
type NonPartial<T extends object> =
    { [KEY in keyof T]-?: T[KEY]; };

type Bar = NonPartial<{ a?: number; b?: string; }>;
// Bar now has the right type:
// Bar = { a: number; b: string; }
```


## Leveraging Recursive Types to implement `DeepReadonly`

In TypeScript type mappings can be recursive under certain
conditions. Using recursive type definitions and conditional
types, we can implement the coveted `DeepReadonly` type operator with
conditional and recursive types:

```TypeScript
type DeepReadonly<T> =
    T extends any[] ? DeepReadonlyArray<T[number]> :
    T extends object ? DeepReadonlyObject<T> :
    T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
    readonly [KEY in keyof T>]: DeepReadonly<T[KEY]>;
};
```

So with conditional types, we can now write type operators we could not
previously write and probably simplify a few other ones which were
possible but difficult to write. What's more, in another PR, the
ability to infer type parameters within conditional types was added to
the upcomming 2.8 release. With this ability we can basically pattern
match on types and extract for example the return type of a function
or that of a function parameter. More on this next time.

[TypeScript 2.8]: https://github.com/Microsoft/TypeScript/milestone/61
[conditional types]: https://github.com/Microsoft/TypeScript/pull/21316
[last post]: /posts/typeful-redux-internals.html
[type mappings can be recursive]: https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540