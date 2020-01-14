---
title: You Could Have Invented Backprop
summary: An exploration of how the backpropagation algorithm works
author: Paul Koerbitz <paul@koerbitz.me>
date: 2020-01-13
---

$$
\gdef\par#1#2{\frac{\partial #1}{\partial #2}}
%% piecewise matrix definition
\gdef\mat#1#2#3#4{\begin{bmatrix} #1 & \cdots & #2 \\\\ \vdots & \ddots & \vdots \\\\ #3 & \cdots & #4 \end{bmatrix} }
$$

In my project to learn data science and machine learning, I've invariably
hit the point where I wanted to understand the backpropagation algorithm.
The resources I'm using for learning were not as clear as I would like 
on why the equations are as they are and how this makes mathematical sense.
Instead, they allude to some intuitions which didn't make a lot of sense to me,
or stated that "this is kind of the hardest math in deep learning, so don't 
worry if you don't fully understand the details". At the same time, I read that 
the backpropagation algorihm is "just the chain rule" which we've all come 
across in high school calculus.

Something didn't seem quite right here, so with my sturdy knowledge of the 
chain rule, I set out to derive backprop by myself to understand all the details 
that I felt my courses where papering
over. I discovered that while backprop wasn't exactly hard, it did take a lot of 
*getting the details right* to make the presentation manageable and 
(somewhat, hopefully) easy to follow. So I set out to write this post and 
found out just why these 
courses didn't bother stepping through all the details (which, after all, you 
propably never implement yourself and even if, you can promptly forget about 
afterwards).

Here we are two weeks later (yeah) with a post that derives the backpropagation
algorithm in detail using nothing but the chain rule and some matrix calculus.
I've really tried to not leave out any steps to make everything easy to follow
along. Backpropagation really is just using the chain rule and it is not very 
hard, so I'm going to stand by the cheesy title. However, it also cleverly 
selects "the right" variables to cache and use in subsequent computations, so 
before you run off to write your own blogpost on the one true backprop 
derivation, make sure you know what $\delta^l$ stands for! Also, if you're 
reading this and get anything out of it, please let me know as I'm really kind 
of suspecting that the only benefit of it is that *I* actually understood 
backprop.

## Why We Need Backprop

To motivate all of this, let's first understand why we need something
like the backprop algorithm at all? In supervised learning we "learn" by
fitting a model to observed data. In practice this model is a
function from input variables to output variables and the distance of
the functions predictions is measured by a cost function. To fit the
function, we change the parameters of the function to minimize the
cost function.

One good way of minimizing the cost function with neural networks is gradient
descent, for which we need the gradient of the cost function with 
respect to the parameters of the model. Since we need to do this over
and over for potentially large neural nets, we need a computationally
cheap way to compute the gradient.

## How We'll Approach Backprop

The way we'll proceed with deriving the backpropagation algorithm is
to compute the derivatives we want first in a very simple neural network
and then in networks of increasing complexity.
In slightly more detail we'll take the following steps:

1. Start with a single-layer, single-neuron network
2. Add a second single-neuron layer
3. Move to an arbitrary number of layers
4. Handle many neurons per layer
5. Bring everything together to the backpropagation algorithm
6. Vectorize computations across multiple samples to make them fast

Of theses steps, I would say that step 4 is the most difficult, but
I would also say that backpropagation is not really *difficult* - it's not
using anything more involved than matrix products and the chain rule.
However, what is certainly very *tedious* is to understand the notation
with all the different indices that we need. My hope is that introducing
things step by step, the presentation becomes more approachable.

## The Simplest Possible Neural Network

Let's start with the simplest possible neural network - a network
with a single input, single output neuron and no hidden layers.
Visually, the network looks as follows:

<div class="center">
![](/images/nn-log-reg.svg "Simplest possible neural network")
</div>

<!--
We don't have multiple layers, so we can drop the $\,\cdot\,^l$
superscripts from $W^l$ and $b^l$. Also, both $W$ and
$b$ are scalars, which I'm indicating by replacing $W$ with
$w$.
-->

Computationally, we receive a single input variable $x$ and first
apply a linear transformation $z = wx+b$ and then a non-linear
activation $a = g(z)$. Typical choices for the non-linear
activation function would be the sigmoid, ReLU or $\tanh$ functions.
$a$ is called the *activation* and is
also the output of the model. If we also received the true output variable
$y$ we can compute the cost. For example if we use a quadratic cost
function we would compute $C(a) = \frac{1}{2}(y - a)^2$ (note that this
is just an example - we will leave the precise cost function abstract).

We can also represent this in a computational graph, which shows which
variables and parameters are the inputs to the next transformation:

<div class="mermaid">
graph LR
    w(w) --> z(z)
    x(x) --> z
    b(b) --> z
    z --> a(a)
    a --> C(C)
</div>

As in the equations for $a$ and $z$, we see that $z$ depends on $w$,
$x$ and $b$, $a$ depends on $z$ and $C$ depends on $a$.

Now, to *fit* our simple neural network, we would change the parameters
$w$ and $b$ so that our output $a$ becomes closer to the observed output
variable $y$. To do this, we want to compute the derivatives of the cost
function with respect to the parameters $w$ and $b$, we write these partial
derivatives as $\par{C}{w}$ and $\par{C}{b}$.

In this simple network case finding the derivatives is
pretty straight forward, we just need to apply the [chain rule] and
decompose $\par{C}{w}$ and $\par{C}{b}$ into three sub-derivatives:

$$
\par{C}{w} = \par{C}{a} \par{a}{z} \par{z}{w}.
$$

$\par{C}{a}=C'(a)$ is the derivative of the cost function with respect to
the output of the network. $\par{a}{z}=\par{}{z}g(z)=g'(z)$ is
the derivative of the non-linear activation function (e.g. the sigmoid
or relu function). Finally, $\par{z}{w}=\par{}{w}(wx+b)=x$ is the
derivative of the linear layer, so we get

$$
\par{C}{w} = C'(a) g'(z) x.
$$

Finding the derivative $\par{C}{b}$ is very similar:

$$
    \par{C}{b} 
    = \par{C}{a} \par{a}{z} \par{z}{b} 
    = C'(a) g'(z) \underbrace{\par{}{b}(wx + b)}_{=1}
    = C'(a) g'(z)
$$

So we see that for a single-layer, single-neuron neural network, finding
the desired derivatives is pretty easy, we just need the derivatives of
the cost function $C$ and the activation function $g$. We can also observe
that the $\par{C}{z} = \par{C}{a}\par{a}{z}$ part of the derivative is
the same in both $\par{C}{w}$ and $\par{C}{b}$. This is an important
observation, since we want to avoid re-computations in our algorithm. We
will also see that this part will come up again and again, prompting us
to give it a sepcial name $\delta := \par{C}{z} = C'(a)g'(z)$. With this
definition, the equations for the partial derivatives become 
$\par{C}{w} = \delta x$ and $\par{C}{b} = \delta $.


## Moving to Two Layers 

Now that we have derived the derivatives for the simplest possible neural
net, let's make things slightly more interesting by moving to a network
with a single hidden layer. Each layer will still consist of a single
neuron.

<div class="center">
![](/images/nn-2.svg "Simplest two-layer neural network")
</div>

With more than one layer, we need introduce notation to distinguish
the variables and parameters of the different layers. We'll do this
by adding $\,\cdot\,^l$ superscripts to $a$, $z$, $w$ and $b$.

To compute the output of the network for an input \\(x\\) we now perform
the following computations:

$$
    \begin{aligned}
        z^1 &= w^1 x + b^1 \\\\
        a^1 &= g(z^1) \\\\ 
        z^2 &= w^2 a^1 + b^2 \\\\
        a^2 &= g(z^2) \\\\
    \end{aligned}
$$

Now $a^2$ is the output of the network and will be fed into the cost
function $C$. We can observe that the second part of the computations
starting with the computation of $z^2$ is basically the same as for the
first layer,
it's just different from the single-layer case because $a^1$ acts as input
to this layer instead of $x$. In fact, we can call $x=:a^0$ in which case
the equations are even more symmetric:

$$
    \begin{aligned}
        z^1 &= w^1 a^0 + b^1 \\\\
        a^1 &= g(z^1) \\\\ 
        z^2 &= w^2 a^1 + b^2 \\\\
        a^2 &= g(z^2) \\\\
    \end{aligned}
$$

The computational graph for this network looks as follows:

<div class="mermaid">
graph LR
    w1(w1) --> z1(z1)
    x(x = a0) --> z1
    b1(b1) --> z1
    z1 --> a1(a1)
    w2(w2) --> z2(z2)
    a1 --> z2
    b2(b2) --> z2
    z2 --> a2(a2)
    a2 --> C(C)
</div>

As we now have four parameters $w^2, b^2, w^1$ and $b^1$
we want to find the derivatives of $C$ with respect to these four
parameters $\par{C}{w^2},\par{C}{b^2},\par{C}{w^1}$ and $\par{C}{b^1}$.
Let's look at the derivatives for $\par{C}{w^2}$ and $\par{C}{b^2}$ first:

$$
\begin{aligned}
\par{C}{w^2} 
    &= \underbrace{\par{C}{z^2}}_{=:\delta^2} \par{z^2}{w^2} 
    = \delta^2 \par{z^2}{w^2} 
    = \delta^2 a^1 \\\\
\par{C}{b^2} 
    &= \par{C}{z^2} \par{z^2}{b^2} 
    = \delta^2 \par{z^2}{b^2}
    = \delta^2
\end{aligned}
$$


These are again very similar to the partial derivatives in the single
layer case (except that we have a few extra $\,\cdot\,^2$). We've also
re-introduced $\delta^2 := \par{C}{z^2} = C'(a^2)g'(z^2)$, the common term
in both derivatives which we've also introduced in the single-layer case.
Furthermore, now
$\par{z^2}{w^2} = \par{}{w^2} w^2a^1 + b^2 = a^1$ and 
$\par{z^2}{b^2} = \par{}{b^2} w^2a^1 + b^2 = 1$ which is also analogous
to the single-layer case.

How about the partial derivatives $\par{C}{w^1}$ and $\par{C}{b^1}$? To
understand how these derivatives will look we need to ask ourselves how
$w^1$ and $b^1$ affect the cost function $C$. Looking at the computational
graph, we see that both $w^1$ and $b^1$ affect $z^1$ which,
through $a^1, z^2$ and $a^2$, affect the cost function $C$. So if we
want to find the partial derivatives of $C$ with respect to $w^1$ and
$b^1$, we can first take the partial derivative of $C$ with respect
to $z^1$ and then the partial derivatives of $z^1$ with respect to
$w^1$ and $b^1$:

$$
    \begin{aligned}
        \par{C}{w^1} 
            &= \par{C}{z^1} \par{z^1}{w^1} 
        \\\\
        \par{C}{b^1}
            &= \par{C}{z^1} \par{z^1}{b^1} 
    \end{aligned}
$$

$\par{z^1}{w^1}$ and $\par{z^1}{b^1}$ are not hard to compute,
they are basically the same as what we've already computed in 
the single-layer case:

$$
\begin{aligned}
    \par{z^1}{w^1} &= \par{}{w^1} w^1 a^0 + b^1 = a^0 = x\\\\
    \par{z^1}{b^1} &= \par{}{b^1} w^1 x + b^1 = 1
\end{aligned}
$$

Now we're left with $\par{C}{z^1}$. By applying the chain rule
we can decompose 

$$
\par{C}{z^1}
    =\underbrace{\par{C}{z^2}}_{=\delta^2} \par{z^2}{z^1}
    =\delta^2 \par{z^2}{z^1}.
$$

In fact, if we're calling $\par{C}{z^2}$ $\delta^2$, then we
should call $\par{C}{z^1}=:\delta^1$. We're left with computing
$\par{z^2}{z^1}$:

$$
\par{z^2}{z^1} = \par{}{z^1} w^2 g(z^1) + b^2 = w^2 g'(z^1).
$$

So to compute $\par{C}{w^1}$ and $\par{C}{b^1}$ we get the following
equations:

$$
\begin{aligned}
\delta^1 &= \par{C}{z^1} = \par{C}{z^2}\par{z^2}{z^1} = \delta^2 w^2 g'(z^1) \\\\
\par{C}{w^1} &= \par{C}{z^1}\par{z^1}{w^1} = \delta^1 a^0 = \delta^1 x \\\\
\par{C}{b^1} &= \par{C}{z^1}\par{z^1}{b^1} = \delta^1
\end{aligned}
$$

## From Two to L Layers

Now that we know how to handle two layers, handling more layers isn't much
more difficult. Instead of $2$ we'll now handle $L$ layers in total, where
the $L$-th layer is the networks output. It will also be convenient to view
the input variable $x$ as the activation of the zeroth layer and make $a^0$ 
a synonym for $x$.

To move to L layers, we basically need to replace the $2$s in the
equations for the two layer case with $L$ or $l+1$ and the $1$s with $l$. 
To compute the output
of our $L$-layer neural network, we'll compute the linear and non-linear
transformations for all $l=1,\ldots,L$ as:

$$
\begin{aligned}
z^l &= w^la^{l-1} + b^l\\\\
a^l &= g^l(z^l).
\end{aligned}
$$

Now, we also want to find all the derivatives $\par{C}{w^l}$ and $\par{C}{b^l}$
for all $l=1,\ldots,L$. To do so, we first define 

$$
\delta^l := \par{C}{z^l}
$$

just as we've defined $\delta^2$ and $\delta^1$ before. Then 
the
desired derivatives $\par{C}{w^l}$ and $\par{C}{b}$ can be 
written via the chain rule as:

$$
\begin{aligned}
\par{C}{w^l} 
    &= \par{C}{z^l}\par{z^l}{w^l} 
    = \delta^l \par{z^l}{w^l} 
    = \delta^l a^{l-1}, \\\\
\par{C}{b^l} 
    &= \par{C}{z^l}\par{z^l}{w^l} 
    = \delta^l \par{z^l}{w^l} 
    = \delta^l.
\end{aligned}
$$

We've used the fact that 
$\par{z^l}{w^l} = \par{}{w^l} w^l a^{l-1} + b^l = a^{l-1}$ and 
$\par{z^l}{b^l} = \par{}{b^l} w^l a^{l-1} + b^l = 1$ just as in the two layer
case.

Now we need to find an expression for $\delta^l$:

$$
\begin{aligned}
\delta^l 
    & = \par{C}{z^l} \\\\
    & = \par{C}{z^{l+1}} \par{z^{l+1}}{z^l} \\\\
    & = \delta^{l+1}\par{z^{l+1}}{z^l} \\\\
    & = \delta^{l+1} \par{}{z^l} (w^{l+1} g(z^l) + b^{l+1}) \\\\
    & = \delta^{l+1} w^{l+1} g'(z^l),\\\\
\delta^L
    & = \par{C}{z^L} = C'(a^L)g'(z^L).
\end{aligned}
$$

Again, these are basically adaptations of the expressions for $\delta^1$ and $\delta^2$
for $l$ and $L$.

Now that we have all the building blocks, we can compute all the derivatives
for all $w^l$ and $b^l$. First we need to compute $\delta^L$ for the last layer:

$$
\delta^L = C'(a^L)g'(z^L).
$$

Now we can directly compute $\par{C}{w^L}$ and $\par{C}{b^L}$:

$$
\begin{aligned}
\par{C}{w^L} &= \delta^L a^{L-1} \\\\
\par{C}{b^L} &= \delta^L.
\end{aligned}
$$

Now we can move backwards from the last layer to the first by 
first computing $\delta^l$  based on $\delta^{l+1}$ and then
$\par{C}{w^l}$ and $\par{C}{b^l}$ for all $l=L-1,\ldots,1$:

$$
\begin{aligned}
\delta^l &= w^{l+1}\delta^{l+1}, \\\\
\par{C}{w^l} &= \delta^l a^{l-1}, \\\\
\par{C}{b^l} &= \delta^l.
\end{aligned}
$$


## Handling Layers With Multiple Nodes

Now let's address the biggest shortcomming we have in the derivation
of the derivatives so far: it only handles networks with 
single-node layers. That is not very useful! Of course, handling only
such networks was a trick to simplify notation and make the derivation
easier. Now that we've done this for these
simplistic networks, we can see how it generalizes to more realistic
networks with multiple nodes per layer.

The main thing that changes in multi-neuron networks is that all
the activations $a^0,a^1,\ldots,a^L$ (where $a^0=x$) are now be 
vectors instead of scalars. $n_l$ is the size of the dimension of 
the $l$-th layer, so $a^l$ is a $n_l\times 1$ vector.  As a consequence, 
the bias units in layer $l$ are now also $n_l\times 1$
dimensional vectors and the weight matrices $W^l$ are $n_l \times n_{l-1}$
matrices.

The update rules for $z^l$ and $a^l$ now look as follows:

$$
\begin{aligned}
\underbrace{z^l}_{n_l\times 1} 
    &= \underbrace{W^l}_{n_l \times n_{l-1}\,} 
       \underbrace{a^{l-1}}_{n_{l-1}\times 1} + \underbrace{b^l}_{n_l\times 1}
       \\\\
\underbrace{a^l}_{n_l \times 1} &= g(\underbrace{z^l}_{n_l \times 1}).
\end{aligned}
$$

Now the parameters of the model that we want to optimize are the entries
of the weight matrices $w^l_{ij}$ and entries of the bias vectors $b^l_i$ and so
we want to compute the derivatives of the cost function $C$ with respect
to these parameters. As in the uni-variate case $w^l_{ij}$ and $b^l_i$
directly influence $z^l$ and we can use the [multivariate chain rule]
to split this into two different partial derivatives:

$$
\begin{aligned}
\par{C}{w^l_{ij}} &= \sum_{k=1}^{n_l} \par{C}{z^l_k} \par{z^l_k}{w^l_{ij}}, \\\\
\par{C}{b^l_i}    &= \sum_{k=1}^{n_l} \par{C}{z^l_k} \par{z^l_k}{b^l_i}.
\end{aligned}
$$

Because $z^l$ is a vector, we need to take the partial derivative with
respect to each of its entries $z^l_k$ and sum over all the partial derivatives
(this is just what the multivariate chain rule says). $\par{C}{z^l_k}$
looks an aweful lot like $\delta^l=\par{C}{z^l}$ in the single neuron case
and so in the multi-neuron case we identify the $k$-th entry of 
$\par{C}{z^l_k}$ with $\delta^l_k$ and write $\delta^l = \par{C}{z^l}$ in vector 
notation.

Substituting these we get 

$$
\begin{aligned}
\par{C}{w^l_{ij}} &= \sum_{k=1}^{n_l} \delta^l_k \par{z^l_k}{w^l_{ij}}, \\\\
\par{C}{b^l_i}    &= \sum_{k=1}^{n_l} \delta^l_k \par{z^l_k}{b^l_i}.
\end{aligned}
$$

Now the partial derivatives $\par{z^l_k}{w^l_{ij}}$ are relatively simple to
compute:

$$
\par{z^l_k}{w^l_{ij}} 
    = \par{}{w^l_{ij}} z^l_k 
    = \par{}{w^l_{ij}} \sum_{p=1}^{n_{l-1}} w^l_{kp} a^{l-1}_p + b^l_k
    = \begin{cases}
        a_j & \text{if } i = k \\\\
        0   & \text{otherwise}
      \end{cases},
$$

where we've used the fact that $\par{}{w^l_{ij}}w^l_{kp}$ is zero unless
$i=k$ and $j=p$. The derivation for $\par{z^l_k}{b^l_i}$ is very similar:

$$
\par{z^l_k}{b^l_{i}} 
    = \par{}{b^l_{i}} z^l_k 
    = \par{}{b^l_{i}} \sum_{p=1}^{n_{l-1}} w^l_{kp} a^{l-1}_p + b^l_k
    = \begin{cases}
        1 & \text{if } i = k \\\\
        0 & \text{otherwise}
      \end{cases}.
$$

Substituting these results back into the original partial derivatives
we get these refreshingly simple formulas:

$$
\begin{aligned}
\par{C}{w^l_{ij}} 
    & = \delta^l_i a^{l-1}_j,
    \\\\
\par{C}{b^l_i}
    & = \delta^l_i.
\end{aligned}
$$

These can also be written elegantly in vector form. By dropping the
$\cdot_{ij}$ and $\cdot_i$ subscripts, we represent a whole
matrix or vector of partial derivatives:

$$
\begin{aligned}
\par{C}{W^l} &= \mat
                    {\par{C}{w^l_{11}}}
                    {\par{C}{w^l_{1 n_{l-1}}}}
                    {\par{C}{w^l_{n_l 1}}}
                    {\par{C}{w^l_{n_l n_{l-1}}}} 
              = \delta^l {a^{l-1}}^T \\\\
\par{C}{b^l} &= \begin{bmatrix}
                \par{C}{b^l_1} \\\\
                \vdots \\\\
                \par{C}{b^l_{n_l}}
                \end{bmatrix} 
              = \delta^l
\end{aligned}
$$

Now to be able to compute these derivatives, we still need to 
know how to compute $\delta^l$. We'll start with $\delta^L = \par{C}{z^L}$,
since it is is the start of the recurrent formula. Since $z^L$ and $\delta^L$
are now $n_L\times 1$ vectors, the $i$-th component of $\delta^L$ is

$$
\begin{aligned}
\delta^L_i & = \par{C}{z^L_i} = \par{}{z^L_i} C(g(z^L_1),\ldots,g(z^L_i),\ldots, g(z^L_{n_L})) \\\\
    & = C_i(g(z^L_1),\ldots,g(z^L_i),\ldots, g(z^L_{n_L})) g'(z^L_i) \\\\
    & = C_i(a^L)g'(z^L_i),
\end{aligned}
$$

where $C_i$ is the partial derivative of the cost function $C$
with respect to its $i$-th variable. Rewriting this in vector
notation we get

$$
\delta^L = \nabla C \odot g'(z^L).
$$

Here, we denote the element-wise product with $\odot$ and the
gradient of $C$ with $\nabla C$. $g'(z^L)$ is the element-wise
application of $g'$ to the vector $z^L$.

To *go back* from $\delta^{l+1}$ to $\delta^{l}$, we can again
use the multivariate chain rule:

$$
\delta^l_i 
    = \par{C}{z^l_i} 
    = \sum_{k=1}^{n_{l+1}} \underbrace{\par{C}{z^{l+1}_k} }
      _{\delta^{l+1}_k} \par{z^{l+1}_k}{z^l_i}
    = \sum_{k=1}^{n_{l+1}} \delta^{l+1}_k \par{z^{l+1}_k}{z^l_i}
$$

So now we need an expression for $\par{z^{l+1}_k}{z^l_i}$:

$$
\par{z^{l+1}_k}{z^l_i} 
    = \par{}{z^l_i} \sum_{p=1}^{n_l} w^{l+1}_{kp} g(z^l_p) + b_k
    = w^{l+1}_{ki} g'(z^l_i).
$$

Substituting this back in we get

$$
\delta^l_i 
    = \sum_{k=1}^{n_{l+1}} \delta^{l+1}_k \par{z^{l+1}_k}{z^l_i}
    = \sum_{k=1}^{n_{l+1}} 
        w_{ki}^{l+1}
        \delta^{l+1}_k
        g'(z^l_i).
$$

Which we can also write in vector form

$$
\delta^l = {W^{l+1}}^T \delta^{l+1} \odot g'(z^l).
$$

OK, now we have everything together to compute all desired 
derivatives $\par{C}{W^l}$ and $\par{C}{b^l}$. Here are
again all the formulas that we need to compute them, starting
from $\delta^L$:

$$
\begin{aligned}
\delta^L     & = \nabla C \odot g'(z^L), \\\\
\delta^l     & = {W^{l+1}}^T \delta^{l+1} \odot g'(z^l), \\\\
\par{C}{W^l} &= \delta^l {a^{l-1}}^T, \\\\
\par{C}{b^l} &= \delta^l.
\end{aligned}
$$

## Putting it All Together with Backprop and Gradient Descent

Now that we've derived all the required formulas, let's see how this
comes together to the full backpropagation and gradient descent algorithm.

### Step 1 - Forward Propagation

Given an instance of the input variables $x$, we compute the output of
the neural network by computing the following for $l=1,\ldots,L$:

$$
\begin{aligned}
z^l &= w^la^{l-1} + b^l\\\\
a^l &= g^l(z^l).
\end{aligned}
$$

The output from this pass is $a^L$, the output from the network, although
we want to hold on to all the $z^l$ and $a^l$ as we will need them in the
backward pass.

### Step 2 - Backward Propagation

Given the output of the network $a^L$ and the true observed output
variable $y$ we can compute the cost $C(a^L)$. With this we compute
the "error" of the last layer $\delta^L$ and use it to back-propagate
this to the "errors" of the pervious layers $\delta^l$. With these
$\delta^l$ and the $z^l$ and $a^l$ we've calculated in the forward
pass, we can also compute the desired deriviatives for all layers
$\par{C}{W^l}$ and $\par{C}{b^l}$:

$$
\begin{aligned}
\delta^L     & = \nabla C \odot g'(z^L), \\\\
\delta^l     & = {W^{l+1}}^T \delta^{l+1} \odot g'(z^l), \\\\
\par{C}{W^l} &= \delta^l {a^{l-1}}^T, \\\\
\par{C}{b^l} &= \delta^l.
\end{aligned}
$$


### Step 3 - Gradient Descent

Now that we have all the derivatives $\par{C}{W^l}$ and $\par{C}{b^l}$
for all $l=1,\ldots,L$, we can compute the updated weights and biases:

$$
\text{for all } l = 1,\ldots,L: \\\\
\begin{aligned}
W^l & := W^l - \eta \par{C}{W^l}, \\\\
b^l & := b^l - \eta \par{C}{b^l},
\end{aligned}
$$

where $\eta$ is our learning rate parameter.

## Vectorizing Computations Across Minibatches

There is one thing I've conveniently ignored so far: how do we go from
computing the output of the neural network for a single input variable
and computing the gradients of the cost function based on its output
to updating the models parameters. After all, the results of the network
on a single observation are an extremly coarse approximation of the cost
function. 

What we usually do in statistics is that we approximate the cost function
based on *all* observations that we have, so computing the gradients
with all observations would be appropriate. This is in fact what would
happen if we ran both forward and backward propagation on all observations
and then averaged the derivatives to update.

What we instead do in *stochastic* gradient descent is is that we randomly
choose a small sample of all training data (say 64 input-output pairs)
and compute the cost function and gradients based on this sample and
update the parameters accordingly. In fact, this is just what the word
*stochastic* in stochastic gradient descent refers to.

Either way, to do this we are relying on the assumption that the cost
function can be approximated by averaging over the value of the cost
function for the observations in the sample. We can then compute all 
the output values, cost function and derivatives for the observation
in the sample and then compute the averages of the derivatives to update
the parameters in (stochastic) gradient descent.

### Matrix-Wise Forward Propagation

It is advantageous from a computational perspective to turn these 
observations instead into matrices and process them one mini-batch at a time. 
To do this, let's first observe that so far, we've had a vector of input 
variables $x$ which is a $n_0 \times 1$ vector. Now, if we group $m$ observations
together, we'll get a $n_0 \times m$ matrix that we'll call $X$ or $A^0$:

$$
X = A^0 = \begin{bmatrix} | & & | \\\\ x^1 & \cdots & x^m \\\\ | & & | \end{bmatrix}
$$

Applying the linear transformation works directly with this $X$ matrix
and gives us a matrix $Z^1$:

$$
Z^1 = W^1 A^0 + b^1
$$

Now this equation doesn't look quite right: $W^1 A^0$ is a $n_1 \times m$
matrix and $b^1$ is a $n_1 \times 1$ vector - so we can't really add them.
To get around this, we replicate $b^1$ $m$-times to create a matrix of 
the right size and add that instead. Marix and tensor computation 
libraries (numpy, pytorch, etc.) do this automatically - a
functionality known as *broadcasting*. For this reason, and because
it is a relatively simple operation, I will ignore this issue here and
take $W^1 A^0 + b^1$ to mean "replicate the column vector $b^1$ enough
times to make this addition work".

For the activation function, we applied $g$ to every element 
of the vector $z^1$ and we can also apply it to every element of the 
matrix $Z^1$:

$$
A^1 = g(Z^1).
$$

As all the next steps are structurally the same as the first layer, we
can see that forward propagation also works with matrices which are
column-stacked vectors of the input variables. In summay, to perform
forward propagation across $m$ samples through all layers, we perform
the following computations for all layers $l=1,\ldots,L$:

$$
\begin{aligned}
Z^l & = W^l A^{l-1} + b^l \\\\
A^l & = g(Z^l).
\end{aligned}
$$

### Matrix-Wise Backward Propagation

Now that we've seen that forward propagation works in matrix
form for multiple samples, let's see how backpropagation adapts
to it. The first step is that we compute $\delta^L$:

$$
\delta^L = \nabla C (a^L) \odot g'(z^L).
$$

Which actually also easily adapts to the matrices $A^L$ and $Z^L$. 
Following the convention of using uppercase letters for the matrix 
version for $m$ samples we'll call it $\Delta^L$.

$$
\begin{aligned}
\Delta^L 
    &= \nabla C (A^L) \odot g'(Z^L)  \\\\
    &= \begin{bmatrix}
        | & & | \\\\
        \nabla C(a^{L\,(1)}) & \cdots & \nabla C(a^{L\,(m)}) \\\\
        | & & |
      \end{bmatrix}
      \odot
      \begin{bmatrix}
        | & & | \\\\
        g'(z^{L\,(1)}) & \cdots & g'(z^{L\,(m)}) \\\\
        | & & |
      \end{bmatrix}
\end{aligned}
$$

The same is true for $\Delta^l$:

$$
\begin{aligned}
\Delta^l
    &= 
    \underbrace{{W^{l+1}}^T}_{n_l \times n_{l+1}}
    \, 
    \underbrace{\Delta^{l+1}}_{n_{l+1} \times m}
    \odot
    \underbrace{g'(Z^l)}_{n_l \times m}
\end{aligned}
$$

So we'll get an $n_l \times m$ matrix here, as desired.

Now with $\Delta^l$ computed, this also gives us the matrix-form
of the derivative $\par{C}{b^l}$ as it is just $\Delta^l$. But if
we think about what we want this derivative for, we notice that
we don't really *want* a matrix here, because we want to update
the parameter vector $b^l$ in gradient descent, which is a vector,
not a matrix. Now, each column of $\Delta^l$ is $\par{C}{b^l}$ for
*one observation*. One of the prerequisites for performing gradient
descent is that our cost function can be computed as an average
over different samples. This transfers directly to the derivatives
so that we can compute the derivative $\par{C}{b^l}$ as the average
of the columns of $\Delta^l$:

$$
\par{C}{b^l} = \frac{1}{m} \sum_{j=1}^m \delta^{l\,(j)},
$$

where $\delta^{l\,(j)}$ is the $j$-th column of $\Delta^l$, so the
$\delta^l$ for the $j$-th observation.

The equation for the derivative $\par{C}{W^l}=\delta^l {a^{l-1}}^T$
does not directly translate to matrix form, as it already computes
a matrix. However, if we just substitute $\Delta^l$ for $\delta^l$
and ${A^{l-1}}^T$, we see that the matrix product sums over the
$m$ samples. We do get a new matrix of the right dimensions where
each entry is the sum of the entries for the samples in the minibatch. 
So to obtain the average of the derivatives for each
sample, we just need to devide by the number of samples:

$$
\par{C}{W^l} = \frac{1}{m} \Delta^l {A^{l-1}}^T.
$$

With this, we now have all the equations of the forward and backward
propagation steps in matrix form. This allows us to leverage
the vectorized implementations of linear algebra and deep learning
libraries to compute these two passes much faster.

## Conclusion

So this was my hopefully easy to follow-along derivation of the
backpropagation algorithm. There is a lot of notation and it 
does take some perserverance to get through it all, but I hope that
each step was well explained and easy to follow along with. 

I must say that it took me much longer to write this post and work out
all the steps of backprop in presentation worthy form than I had ever
imagined. So while I do think that backpropagation is pretty straight
forward, there is certainly a lot of care needed to get all the details
right. If you've read this far, thanks for sticking around! If you think 
this explanation could be improved in some way I'd be happy to know -
please leave a comment or get in touch via [twitter].

[twitter]: https://twitter.com/paulkoer
[chain rule]: https://en.wikipedia.org/wiki/Chain_rule
[multivariate chain rule]: https://en.wikipedia.org/wiki/Chain_rule#Multivariable_case