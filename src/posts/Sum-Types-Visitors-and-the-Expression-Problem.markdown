---
title: Sum Types, Visitors, and the Expression Problem
summary: Visitors are a complicated OO way of getting the advantages of sum types
date: 2014-01-10
---

I've heard that *the [visitor pattern] is just a poor way of getting the
benefit of sum types*^[These are also known as disjoint union or
variant types.] in functional programming circles several times. I
must admit that I never had completely thought this through, but I was
nevertheless a bit surprised when I saw that walking the AST in Rust
was implemented by what looks like a use of the visitor pattern.
Languages with sum types usually use pattern matching to achieve the
same effect and I had always considered this a superior approach. In
this blog post I try to understand the differences and similarities of
the two approaches a little better.

To set the stage, both pattern matching and the visitor pattern solve
one side of the [expression problem], which is the problem of adding
both variants of a data type and functions that act on those variants
without changing or recompiling old code and without loosing type
safety.

To make this a bit more concrete, consider a very simple expression
languages consisting of numbers and addition as an example (no post on
this topic can do without one!). We have two variants of expressions,
(1) numbers and (2) addition. Let's assume that we want to compute the
values represented by an expression as a first operation.

In Haskell a straightforward way of solving this problem is as follows

```Haskell
data Expr = Val Int | Add Expr Expr

eval :: Expr -> Int
eval (Val i)     = i
eval (Add e1 e2) = eval e1 + eval e2
```

If you're not familiar with Haskell, the first line defines a data
type with two variants, it can either be a `Val`, which holds an
`Int`, or it is an `Add` which holds two expressions. `Val` and `Add`
are called constructors of `Expr`. The `eval` function pattern-matches
and handles each case.

Now imagine that we do not only want to evaluate expressions but also
pretty-print them. Adding operations is easy in Haskell, we just
write a new function:

```Haskell
pprint :: Expr -> String
pprint (Val i)     = show i
pprint (Add e1 e2) = pprint e1 ++ " + " ++ pprint e2
```

In Java we might achieve something similar by introducing an `Expr`
class:

```Java
interface Expr {
    public int eval();
}

class Val implements Expr {
    private final int v;
    public Val(int v) { this.v = v; }
    public int eval { return v; }
}

class Add implements Expr {
    private final Expr l;
    private final Expr r;
    public Add(Expr l, Expr r) { this.l = l; this.r = r; }
    public int eval { return l.eval() + r.eval(); }
}
```

But now, if we want to add the `pprint` operation, we have to touch
every class. This is the side of the expression problem that
functional languages tend to solve better than object oriented
languages. However, the object oriented programming community has
devised the visitor pattern as a way to solve this problem:

```Java
interface ExprVisitor {
    public void visit(Val v);
    public void visit(Add a);
}

interface Expr {
    public void accept(ExprVisitor visitor);
}

class Val implements Expr {
    private int v;
    public Val(int v) { this.v = v; }
    public int val()  { return v; }
    public void accept(ExprVisitor visitor) { visitor.visit(this); }
}

class Add : public Expr {
    private Expr l;
    private Expr r;
    public Add(Expr l, Expr r) { this.l = l; this.r = r; }
    public Expr l() { return l; }
    public Expr r() { return r; }
    public void accept(ExprVisitor visitor) { visitor.visit(*this); }
}

class EvalVisitor implements ExprVisitor {
   private int result = 0;
   public int result() { return result; }
   public void visit(Val val) { result = val.val(); }
   public void visit(Add add) {
        add.l().accept(this);
        int result_l = result;
        add.r().accept(this);
        result += result_l;
    }
}
```

Ok, this is not exactly pretty, but let's not forget that this is the
side of the problem where OO languages are not good at. At least we
can pull something of. And now we are in a situation where we can add
new operations pretty easily:

```Java
class PprintVisitor extends ExprVisitor {
    private String result = "";
    public String result() { return result; }
    public void visit(Val val) override { result += val.val(); }
    public void visit(Add add) override {
        add.l().visit(this);
        result += " + ";
        add.r().visit(this);
    }
}
```

This works, but the Haskell solution is clearly more elegant. Does the visitor
pattern have any additional advantages? Well, neither approach solves the
expression problem: if we want to add a new variant, say a `Mult`, then we
have to change existing code in both cases.

I can't really think of an advantage for the visitor pattern. I've
thought of two possibilities, *default implementations* and
*almost-but-not-quite-solving-the-expression-problem*. But then
I realized that the first problem is also similarly solvable in the
pattern matching approach and that the second problem doesn't work
without loosing type safety or duplicating code:^[Both maintaining
type safety and not duplicating code are requirements in the expression
problem.]

 1. *Default implementations* are easy to implement with both
    approaches: in the visitor pattern defaults can be achieved by
    inherenting from a visitor with default implementations and
    overriding only certain methods. In the pattern-matching approach
    we would match all the constructors where we want to override the
    defaults and insert a wildcard match for the rest and call the
    default implementaiton on the bound variable.

 2. *Almost-but-not-quite-solving-the-expression-problem*: I first
    thought that we could use some inheritance based trickery to
    solve the expression problem at least for new code. But none
    of these seems to work: If we add a new variant, say `Mult`,
    it can't derive from `Expr` because then it would have to implement
    `Expr`'s accept method, which it can't sensibly do (because there
    is no right `visit` method in `ExprVisitor`).

    Thus we must introduce a new interface `Expr2`. `Expr2` cannot
    derive from `Expr`, lest we have the same problem as before. But
    the old variants don't derive from `Expr2`, so this is of limited
    use. Whichever way we twist or turn it, there is no easy way to
    solve the expression problem with this pattern.

So, as it stands, I can't really come up with an advantage for the
visitor pattern over pattern matching. If you work in a language
without sum types then it is certainly a great workaround, but in a
language that does pattern matching seems much both more concise and
more efficient.^[Due to the virtual method calls, which prevent
inlining, I would expect the visitor pattern to be much slower than a
direct function call.]


[Expression Problem]: http://homepages.inf.ed.ac.uk/wadler/papers/expression/expression.txt

[visitor pattern]: https://en.wikipedia.org/wiki/Visitor_pattern

[GoF]: http://www.rust-lang.org
