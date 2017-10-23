---
title: Solving the Expression Problem in Haskell and Java
summary: A second look at the expression problem discussed
         in the previous post and ways of solving it in Haskell and Java
date: 2014-06-14
---

After my [last
post](/posts/Sum-Types-Visitors-and-the-Expression-Problem.html) on
the expression problem, I thought that I would explore ways to solve
it in the next post and that I would write that post shortly after. I
knew how the solution worked in Haskell and that solutions existed for
OO languages, so that post should not have been terribly hard to
write. Well, here we are five months later and I am finally getting
around to writing the post ;).


## Expression Problem Recap

The term *Expression Problem* was coined by Philip Waldler in a
[mail][Expression Problem] to the Java Generics mailing list. The goal
is to be able to define datatypes by cases and functions over these
datatypes in a way that is extensible: one should be able to add both
new cases and new functions without touching or recompiling old code
and while maintaining static type safety.

As an example I'll reuse the simple expression language from the last
post. To represent such an expression language we will have a number
of variants to capture the different types of expressions, for example
literal integers, addition, and multiplication. To work with this
representation we will have different functions to transform such
expressions, for example evaluating or pretty-printing them.

Once we have defined the cases and functions how difficult will it be
to add new cases and new functions? Statically type-checked functional
languages make it easy to add new functions (see [last post]) while
the object oriented languages make it easy to add new cases. The
default approach in both languages does not make it easy^[Easy here
means that no code needs to be changed / dublicated and type-safety is
maintained.] to either add new cases or new functions. That means that
the default approach in both languages does not solve the Expression
Problem. However, it turns out that solutions are possible in both
types of languages. This post will describe a possible solution in
both Haskell and Java.


## A Haskell Solution

The key to solving the Expression Problem in Haskell is to define
typeclasses for the desired functions and make the datatypes instances
of these typeclasses. We also define the different variants as their
own datatypes, though this is not strictly necessary yet. For our
expression language the setup looks as follows:

~~~{.Haskell}
data Lit = Lit Int
data Add l r = Add l r

class Eval x where
  eval :: x -> Int

instance Eval Lit where
  eval (Lit x) = x

instance (Eval l, Eval r) => Eval (Add l r) where
  eval (Add l r) = eval l + eval r
~~~

The extension that is typically easy in functional languages is to add
a new function over the datatype. With the setup as above, we now add
a new typeclass which contains the function as a method and add instances
for each of our datatypes. Compared to the standard approach in functional
languages, this requires slightly more code, but is still fairly clear:

~~~{.Haskell}
class PPrint x where
  pprint :: x -> String

instance PPrint Lit where
  pprint (Lit x) = show x

instance (PPrint l, PPrint r) => PPrint (Add l r) where
  pprint (Add l r) = "(" ++ pprint l ++ " + " ++ pprint r ++ ")"
~~~

OK, so adding new functions is still easy, how about adding new cases?
Adding a new case is the interesting part, because this is the side of
the Expression Problem which the standard approach in Haskell can't
handle. However, with the setup we have introduced above this becomes
quite easy: we just add a new datatype and then add instances for each
of our typeclasses:

~~~{.Haskell}
data Mult l r = Mult l r

instance (Eval l, Eval r) => Eval (Mult l r) where
  eval (Mult l r) = eval l * eval r

instance (PPrint l, PPrint r) => PPrint (Mult l r) where
  pprint (Mult l r) = pprint l ++ " * " ++ pprint r
~~~

OK, so this approach lets us indeed add new cases and new functions
without having to modify existing code. Note that we also have type
safety: in the code below both `eval` and `pprint` can be called on
both `threePlus5` and `threePlus5Times7` because these operations are
defined on each of the datatypes. Had we forgotten to derive a
typeclass instance for one of the cases `Lit`, `Add` or `Mult` the
compiler would bark. The full code is available at this [gist].

~~~{.Haskell}
threePlus5 = Add (Lit 3) (Lit 5)
threePlus5Times7 = Mult threePlus5 (Lit 7)

main = do
  putStrLn $ pprint threePlus5 ++ " = " ++ show (eval threePlus5)
  putStrLn $ pprint threePlus5Times7 ++ " = " ++ show (eval threePlus5Times7)
~~~


## A Java Solution

Solving the Expression Problem in classical (statically typed) OO
languages is a bit more difficult. The solution I'll present here is
taken from the paper [Extensibility for the masses (PDF)] which has
won the ECOOP 2012 best paper award. The idea is to use *object
algebras* which implement so-called *algebraic signatures*. We will
use the same example as above. The algebraic signature for the
expression language looks as follows:^[Note the similarity to type
classes!]

~~~
signature E
    lit:  Int -> E
    add:  E x E -> E
~~~

The general idea is this: we will represent the above signature as an
interface which is parameterized over `E`. To actually use objects
created with this interface we'll instantiate `E` to a concrete
interface, for example to `Eval` and call the operations provided by
this interface (`eval()`). However, code creating objects with the above
interface does not need to know what `E` is and can thus be completely
generic.

In case this is a bit confusing (it certainly was to me), let's look
at a piece of code which will hopefully make this idea somwhat clearer:

~~~{.Java}
interface Alg1<E> {
    E lit(int x);
    E add(E l, E r);
}

class Impl1<E> {
    public static <E> E make3Plus5(Alg1<E> f) {
        return f.add(f.lit(3), f.lit(5));
    }
}

interface Eval {
    int eval();
}

class ELit implements Eval {
    private int x;
    public ELit(int x) { this.x = x; }
    public int eval() { return x; }
}

class EAdd implements Eval {
    private Eval l, r;
    public EAdd(Eval l, Eval r) { this.l = l; this.r = r; }
    public int eval() { return l.eval() + r.eval(); }
}

class Alg1EvalFactory implements Alg1<Eval> {
    public Eval lit(int x) { return new ELit(x); }
    public Eval add(Eval l, Eval r) { return new EAdd(l, r); }
}

class Impl2 {
    static int eval3Plus5() {
        return Impl1.make3Plus5(new Alg1EvalFactory()).eval();
    }
}
~~~

So we first define a generic interface called `Alg1` which represents
the algebraic signature above.^[The paper calls such interfaces
*object algebras* and goes a bit into the category theoretical
motivations for these terms which I'm ignoring here.]  Programs such
as `make3Plus5` can use this interface completely generically without
needing to know what `E` acutally is.

Only when we acutally want to use the objects created from the `Alg1`
interface do we need to define a concrete interface such as `Eval` and
classes that implement it. We also need a class that implements
`Alg1<E>`, in the code above this is `Alg1EvalFactory`. An instance of
this factory is passed to the generic program `make3Plus5` which then
produces an object which implements `Eval` so that we can call the
`eval()` method on it.

Comparing this approach to the Haskell one there are some
similarities: The `interface Eval` here plays the role of the
`typeclass Eval` in the Haskell version and the classes `ELit` and
`EAdd` correspond to the instance declarations. The piece that is
missing from the Haskell version is the `Alg1` interface and its
implementation, but I think there are some similarities to what the
Haskell compiler does behind the scenes.^[Clearly the Haskell code is
considerably easier to understand and - I would argue - also more
elegant, but let's not get into that.]

Now let's check if we can extend this setup with both new functions
and new variants. First, adding new functions is fairly easy: The
interface `Alg1` can stay unchanged, we merely need to create a new
interface `PPrint` which will take the place of `Eval` and
corresponding classes `PLit` and `PAdd` that implement this
interface. To actually make use of `Alg1` instantiated to this new
interface we also need a new factory.

~~~{.Java}
interface PPrint {
    public String pprint();
}

class PLit implements PPrint {
    private int x;
    public PLit(int x) { this.x = x; }
    public String pprint() { return Integer.valueOf(x).toString(); }
}

class PAdd implements PPrint {
    private PPrint l, r;
    public PAdd(PPrint l, PPrint r) { this.l = l; this.r = r; }
    public String pprint() { return "(" + l.pprint() + " + " + r.pprint() + ")"; }
}

class Alg1PPrintFactory implements Alg1<PPrint> {
    public PPrint lit(int x) { return new PLit(x); }
    public PPrint add(PPrint l, PPrint r) { return new PAdd(l, r); }
}

class Impl3 {
    static String pprint3Plus5() {
        return Impl1.make3Plus5(new Alg1PPrintFactory()).pprint();
    }
}
~~~

This may look like a lot of code, but again, this roughly corresponds
to the Haskell version. We did not need to duplicate any code (apart
from the usual boilerplate that is required by Java). Also note that
we were able to reuse `make3Plus5` from above even though we're now
using a new operation on its result!

So we can add new functions over the datatype cases. To add new cases
we need to extend the signature `Alg1` to `Alg2` to accomodate the new
case. We then need to add classes that implement the concrete
interfaces `Eval` and `PPrint` for this new cases. Furthermore, we
also need new factories which implement the interface `Alg2<Eval>` and
`Alg2<PPrint>`. Again, this is slightly more code than one would love
to write, but it is completely extensible (note for example that we
are reusing `make3Plus5` unchanged with a factory that implements
`Alg2<E>`):

~~~{.Java}
interface Alg2<E> extends Alg1<E> {
    E mult(E l, E r);
}

class EMult implements Eval {
    private Eval l, r;
    public EMult(Eval l, Eval r) { this.l = l; this.r = r; }
    public int eval() { return l.eval() * r.eval(); }
}

class PMult implements PPrint {
    private PPrint l, r;
    public PMult(PPrint l, PPrint r) { this.l = l; this.r = r; }
    public String pprint() { return l.pprint() + " * " + r.pprint(); }
}

class Alg2EvalFactory extends Alg1EvalFactory implements Alg2<Eval> {
    public Eval mult(Eval l, Eval r) { return new EMult(l, r); }
}

class Alg2PPrintFactory extends Alg1PPrintFactory implements Alg2<PPrint> {
    public PPrint mult(PPrint l, PPrint r) { return new PMult(l, r); }
}

class Impl4<E> {
    // a client program using Alg2 (which uses a function using Alg1!)
    public static <E> E make3Plus5Times7(Alg2<E> f) {
        return f.mult(Impl1.make3Plus5(f), f.lit(7));
    }

    public static int eval3Plus5Times7() {
        return make3Plus5Times7(new Alg2EvalFactory()).eval();
    }

    public static String pprint3Plus5Times7() {
        return make3Plus5Times7(new Alg2PPrintFactory()).pprint();
    }
}
~~~

For completeness, here is a main method which uses the above and gives
the same output as the Haskell version. The full code can be found at
this [gist].

~~~{.Java}
public class Main {
    public static void main(String[] args)
    {
        System.out.println(Impl3.pprint3Plus5() + " = "
                           + Integer.valueOf(Impl2.eval3Plus5()).toString());
        System.out.println(Impl4.pprint3Plus5Times7() + " = "
                           + Integer.valueOf(Impl4.eval3Plus5Times7()).toString());
    }
}
~~~


## Conclusion

So this post gave a quick demonstration of how the Expression Problem
can be solved both in Haskell and Java. I think it is pretty cool that
the Expression Problem is actually solvable in a language like Java
because I first thought that that wasn't the case. On the one hand the
Java version seems pretty heavyweight in terms of additional
complexity. I therefore doubt that I would reach for this solution in
practice unless I was certain in advance that solving the Expression
Problem is important for a particular application and that it would
justify the conceptual overhead. On the other hand this solution
doesn't feel conceptually much heavier than the visitor pattern and
this solution solves both sides of the Expression Problem while the
visitor pattern only solves one.

In the end I just wish I could use Haskell ;).


[last post]: /posts/Sum-Types-Visitors-and-the-Expression-Problem.html

[Expression Problem]: http://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt

[visitor pattern]: https://en.wikipedia.org/wiki/Visitor_pattern

[Extensibility for the masses (PDF)]: http://www.cs.utexas.edu/~wcook/Drafts/2012/ecoop2012.pdf

[LtU Extensibility for the masses discussion]: http://lambda-the-ultimate.org/node/4572

[gist]: https://gist.github.com/paulkoerbitz/106277417325fd43a64c