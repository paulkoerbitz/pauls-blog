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
In doing so, I've come across some resources that weren't as clear as I 
would have liked, so here is my own attempt at explaining it. Countless 
others have no doubt done a better job at this before me, but I want to
try.

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
to compute the derivatives we want first in very simple and then in
increasingly complex neural networks. In slightly more detail we'll
take the following steps:

1. Start with a single-layer, single-neuron network
2. Add a second single-neuron layer
3. Handle many neurons per layer
4. Move to an arbitrary number of layers
5. Bring everything together to the backpropagation algorithm
6. Vectorize computations across multiple samples to make them fast

Of theses steps, I would say that step 3 is the most difficult, but
I would also say that backpropagation is not really *difficult* - it's not
using anything more involved than matrix products and the chain rule.
However, what is certainly very *tedious* is to understand the notation
with all the different indices that we need. My hope is that introducing
everything in different layers, it becomes more approachable.

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
transformation $a = g(z)$. Typical choices for the non-linear
activartion function would be the sigmoid, ReLU or $\tanh$ functions.
$a$ is called the *activation* and is
also the output of the model. If we also received the output variable
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

Now, to *fit* our simple neural network, we would change the parameters
$w$ and $b$ so that our output $a$ becomes closer to the observed output
variable $y$. To do this we want to compute the derivatives of the cost
function with respect to the parameters, $\par{C}{w}$ and $\par{C}{b}$.

In this simple network case finding the derivatives is
pretty straight forward, we just need to apply the [chain rule] and
decompose $\par{C}{w}$ and $\par{C}{b}$ into three sub-derivatives:

\\[
    \par{C}{w} = \par{C}{a} \par{a}{z} \par{z}{w}
\\]

$\par{C}{a}=C'(a)$ is the derivative of the cost function with respect to
the output of the network - this derivative will depend on the
specific cost function. $\par{a}{z}=\par{}{z}g(z)=g'(z)$ is
the derivative of the non-linear activation function (e.g. the sigmoid
or relu function). Finally, $\par{z}{w}=\par{}{w}(wx+b)=x$ is the
derivative of the linear layer, so we get

$$
    \par{C}{w} = C'(a) g'(z) x.
$$

Finding the derivative $\par{C}{b}$ is very similar:

$$
    \par{C}{b} = \par{C}{a} \par{a}{z} \par{z}{b} = C'(a) g'(z) \par{}{b}(wx + b) = C'(a) g'(z)
$$

So we see that for a single-layer, single-neuron neural network, finding
the desired derivatives is pretty easy, we just need the derivatives of
the cost function $C$ and the activation function $g$. We can also observe
that the $\par{C}{z} = \par{C}{a}\par{a}{z}$ part of the derivative is
the same in both $\par{C}{w}$ and $\par{C}{b}$. This is an important
observation, since we want to avoid re-computations in our algorithm. We
will also see that this part will come up again and again, prompting us
to give it a sepcial name $\delta := \par{C}{z} = C'(a)g'(z)$.

## Moving to Two Layers 

Now that we have derived the derivatives for the simplest possible neural
net, let's make things slightly more interesting by moving to a network
with a single hidden layer. Each layer will still consist of a single
neuron.

<div class="center">
![](/images/nn-2.svg "Simplest two-layer neural network")
</div>

With more than one layer, we need introduce notation to distinguish
the variables and parameters from the different layers. We'll do this
by adding \\(\,\cdot\,^l\\) superscripts to $a$, $z$, $w$ and $b$.

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
starting with the computation of $z^2$ is basically the same as before,
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


These are essentially the same as the partial derivatives in the single
layer case (except that we have a few extra $\,\cdot\,^2$). We've also
re-used $\delta^2 := \par{C}{z^2} = C'(a^2)g'(z^2)$, the common term
in both derivatives which we've also introduced in the single-layer case.
Furthermore, now
$\par{z^2}{w^2} = \par{}{w^2} w^2a^1 + b^2 = a^1$ and 
$\par{z^2}{b^2} = \par{}{b^2} w^2a^1 + b^2 = 1$ which is also analogous
to the single-layer case.

How about the partial derivatives $\par{C}{w^1}$ and $\par{C}{b^1}$? To
understand how these derivatives will look we need to ask ourselves how
$w^1$ and $b^1$ affect the cost function. Looking at the computational
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
\par{C}{z^1}=\par{C}{z^2}\par{z^2}{z^1}=\delta^2 \par{z^2}{z^1}.
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
the $L$-th layer is the networks output. It will also be convenient to consider
the input variable $x$ the activation of the zeroth layer so that $a^0:=x$ are
synonyms.

To move to L layers, we basically need to replace the $2$s in the above
equations with $L$ or $l+1$ and the $1$s with $l$. To compute the output
of our $L$-layer neural network, we'll compute the linear and non-linear
transformations for all $l=1,\ldots,L$:

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

just as we've defined $\delta^2$ and $\delta^1$ before. Then the
desired  derivatives are easily found:

$$
\begin{aligned}
\par{C}{w^l} &= \par{C}{z^l}\par{z^l}{w^l} = \delta^l \par{z^l}{w^l} = \delta^l a^{l-1} \\\\
\par{C}{b^l} &= \par{C}{z^l}\par{z^l}{w^l} = \delta^l \par{z^l}{w^l} = \delta^l,
\end{aligned}
$$

where I've used the fact that 
$\par{z^l}{w^l} = \par{}{w^l} w^l a^{l-1} + b^l = a^{l-1}$ and 
$\par{z^l}{b^l} = \par{}{b^l} w^l a^{l-1} + b^l = 1$ just as in the two layer
case.

Now we need to find an expression of $\delta^l$:

$$
\begin{aligned}
\delta^l 
    & = \par{C}{z^l} \\\\
    & = \par{C}{z^{l+1}} \par{z^{l+1}}{z^l} \\\\
    & = \delta^{l+1}\par{z^{l+1}}{z^l} \\\\
    & = \delta^{l+1} \par{}{z^l} (w^{l+1} g(z^l) + b^{l+1}) \\\\
    & = \delta^{l+1} w^{l+1} g'(z^l)\\\
\delta^L
    & = \par{C}{z^L} = C'(a^L)g'(z^L).
\end{aligned}
$$

These are basically adaptations of the expressions for $\delta^1$ and $\delta^2$
for $l$ and $L$.

Now that we have all the building blocks, we can compute all the derivatives
for all $w^l$ and $b^l$. First we need to compute $\delta^L$ for the last layer:

$$
\begin{aligned}
\delta^L &= C'(a^L)g'(z^L) \\\\
\par{C}{w^L} &= \delta^L a^{L-1} \\\\
\par{C}{b^L} &= \delta^L.
\end{aligned}
$$

Now we can move backwards from the last layer to the first by computing the following for all $l=L-1,\ldots,1$:

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
the $l$-th layer, so $a^l$ is a $n_l\times 1$ vector (I write can 
because they *can* also still be scalars or $1\times 1$ vectors, 
most notably the output layer may be scalar).  As a consequence, 
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
of the weight matrices $w^l_{ij}$ and the bias vectors $b^l_i$ and so
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
$\delta^l_k = \par{C}{z^l_k}$ and $\delta^l = \par{C}{z^l}$ in vector notation.

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
since it is is the start of the recurrent formula. $z^L$ is now a $n_L\times 1$ vector and so is $\delta^L$. The $i$-th component of this vector is

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
choose a small sample of all training data (say 64 input output pairs)
and compute the cost function and gradients based on this sample and
update the parameters accordingly. In fact, this is just what *stochastic*
in stochastic gradient descent refers to.

Either way, to do this we are relying on the assumption that the cost
function can be approximated by averaging over the value of the cost
function for the observations in the sample. We can then compute all 
the output values, cost function and derivatives for the observation
in the sample and then compute the averages of the derivatives to update
the parameters in (stochastic) gradient descent.

### Matrix-Wise Forward Propagation

However, it is
computationally advantageous to turn these observations instead into
matrices and process them one mini-batch at a time. 
To do this, let's first observe that so far, we've had a vector of input variables
$x$ which is a $n_0 \times 1$ vector. Now, if we group $m$ observations
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

For the activation function, just like we applied $g$ to every element 
of the vector $z^1$, so we can also apply it to every element of the 
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
\par{C}{b^l} = \frac{1}{m} \sum_{j=1}^m \delta^{l\,(j)}.
$$

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

So this was my hopefully easy to follow-along with explanation of the
backpropagation algorithm. There is a lot of notation and so it certainly
does take some perserverance to get through it all, but I hope that
each step is well explained and easy to follow along with. 

I must say that it took me much longer to write this post and work out
all the steps of backprop in presentation worthy form than I had ever
imagined. So while I do think that backpropagation is pretty straight
forward, there is certainly a lot of care needed to get all the details
right. If you've red this far, thanks for reading this. If you think 
this explanation could be improved in some way I'd be happy to know.

<!--
Next the vectorized formulas for $\delta^l$ based on $\delta^{l+1}$,
again just copied from before:

$$
\delta^l = {W^{l+1}}^T \delta^{l+1} \odot g'(z^l).
$$

Now we can use these to compute $\par{C}{w^l_{ij}}$ and 
$par{C}{b^l_i}$:



now we actually have everything together! We first compute 
$\delta^L$, $\par{C}{w^L_{ij}}$ and $\par{C}{b^L_i}$ and then, 
going from layers $L-1$ to $1$ compute $\delta^l$ based on 
$\delta^{l+1}$ and then $w^l_{ij}$ and $b^l_i$ based on it. 
To finish up, let's collect the forumlas and also write them 
in vector form so we can compute things efficiently:


In the general case for each layer we'll have weight matrices
$W^l$ which are $n_l \times n_{l-1}$ matrices and bias vectors
$b^l$ which are $n_l \times 1$ vectors, where $n_l$ is the size
of the $l$-th layer. What we want is to update each entry in the
matrices $W^l$ and $b^l$ with the right derivative! So by writing 
$\par{C}{W^l}$ or $\par{C}{b^l}$
I really mean a matrix of derivatives $\par{C}{w^l_{ij}}$ or
a vector $\par{C}{b^l_i}$. 

Additionally, both the output and the
intermediate layers can have more than one entry, so $\par{C}{z^L}$
and $\par{z^{k+1}}{z^k}$ are more complicated as well.

Let's start at the last computational step and compute $\par{C}{z^L}$
first.

$$
\par{C}{z^L_i} 
    = \par{}{z^L_j} C(a^L_1,\dots,a^L_{n_L}) 
    = \sum_{j=1}^{n_L}\underbrace{\par{C}{a^L_j}}_{C_j}\par{a^L_j}{z^L_i} 
    = \sum_{j=1}^{n_L} C_j \underbrace{\par{}{z_i^L}g^L(z_j^L)}_{=0\text{ for } i\neq j} 
    = C_i g_z^L(z_i^L)
$$


Here $C_i := \par{C}{a_i^L}$ is the partial derivative of $C$ with respect to
its $i$-th argument and $g^L_z$ is the derivative of $g^L$. If we look at the
vectorized notation we have

$$
\par{C}{z^L} = \nabla C \odot g^L_z(z^L)
$$

where $\nabla C$ is the vector of partial derivatives or gradient of $C$, 
$\odot$ is the element-wise product between $\nabla C$ and $g^L_z(z^L)$.

Next for the derivatives of $\par{z^{l+1}}{z^l}$ we find

$$
\begin{aligned}
\par{z^{l+1}_i}{z^l_j} 
    & = \par{}{z^l_j} z^{l+1}_i \\\\
    & = \par{}{z^l_j} [W^{l+1} g^l(z^l) + b^{l+1}]_i \\\\
    & = \par{}{z^l_j} \left(\sum_k w_{i k}^{l+1} g^l(z_k^l) + b_i^{l+1}\right) \\\\
    & = \sum_k w_{i k}^{l+1} \underbrace{\par{}{z^l_j} g^l(z_k^l)}_{=0\text{ for } k\neq j} +  \par{}{z^l_j} b_i^{l+1} \\\\
    & = w^{l+1}_{ij}g_z^l(z^l_j)
\end{aligned}
$$

So in the vectorized representation we have

$$
\par{z^{l+1}}{z^l} 
    = W^{l+1} \odot G_z^l(z^l) = W^{l+1} \odot 
        \left[\begin{matrix} \vdots \\\\ g_z^l(z^l)^T \\\\\vdots \end{matrix} \right]
$$

Now for $\par{C}{w^l}$ we get the following derivatives

$$
\par{C}{w^l_{ij}} = \par{C}{z^L}\par{z^L}{z^{L-1}} \cdots \par{z^{l+1}}{z^l} \par{z^l}{w^l_{ij}}
$$

We've already seen how to compute 
$\par{C}{z^L}\par{z^L}{z^{L-1}} \cdots \par{z^{l+1}}{z^l}$,
so let's look at $\par{z_k^l}{w^l_{ij}}$

$$
\par{z_k^l}{w^l_{ij}} 
    = \par{}{w^l_{ij}} z_k^l 
    = \par{}{w^l_{ij}} \left[W^l a^{l-1} + b^l\right]_k
    = \begin{cases} a^{l-1}_j & k = i \\\\ 0 & k \ne i\end{cases}
$$

The situation is almost the same for $\par{z^l_k}{b^l_i}$:

$$
\par{z_k^l}{b^l_{i}} 
    = \par{}{b^l_{i}} z_k^l 
    = \par{}{b^l_{i}} [W^l a^{l-1} + b^l]_k
    = \begin{cases} 1 & k = i \\\\ 0 & k \ne i \end{cases}
$$

This allows us to give the vectorized version of $\par{z^l}{W^l}$:



$$
\def\p#1#2#3{\par{z_{#1}^l}{w^l_{#2 #3}}}
\par{z^l}{W^l} 
    = \sum_{k=1}^{n_l} \par{z^l_k}{W^l}
    = \sum_{k=1}^{n_l} 
    \mat
        {\p{k}{1}{1}}
        {\p{k}{1}{n_{l-1}}}
        {\p{k}{n_l}{1}}
        {\p{k}{n_l}{n_{l-1}}}
    = \mat
        {\p{1}{1}{1}}
        {\p{1}{1}{n_{l-1}}}
        {\p{n_l}{n_l}{1}}
        {\p{n_l}{n_l}{n_{l-1}}}
$$

And similarly for $\par{z^l}{b^l}$:

$$
\gdef\pvec#1#2{\begin{bmatrix} #1 \\\\ \vdots \\\\ #2 \end{bmatrix}}
\begin{aligned}
\par{z^l}{b^l} 
    & = \sum_{k=1}^{n_l} \par{z^l_k}{b^l}
    & = \sum_{k=1}^{n_l} \pvec{\par{z_k^l}{b^l_1}}{\par{z_k^l}{b^l_{n_l}}}
    & = \pvec{\par{z_1^l}{b^l_1}}{\par{z_{n_l}^l}{b^l_{n_l}}}
\end{aligned}
$$

We've split the partial derivative $\par{C}{z^1}$ into 
$\par{C}{z^2} \par{z^2}{z^1}$. This way we can re-use the already
computed $\delta^2 = \par{C}{z^2}$ and just need to compute 
$\par{z^2}{z^1}$. Fortunately, this partial derivative is also
shared by both $\par{C}{w^1}$ and $\par{C}{b^1}$. In fact, 
Now these full partial derivatives are starting to look a little bit
tedious and we can start to make some observations. The parameters
$w$ and $b$ affect the linear transformation $z$ but don't affect 

Similarly, if we move to the derivatives of the first layer 
$\par{C}{w^1}$ and $\par{C}{b^1}$, we see that the partial
derivative $\par{C}{a^2}\par{a^2}{z^2}=\par{C}{z^2}$ is
the same as the one we computed for the second layer but
we need an extra term $\par{z^2}{z^1}$ when moving from the
second layer to the first. In total we can write all derivatives
more compactly as follows:

$$
\begin{aligned} 
\par{C}{w^2} &= \par{C}{z^2}\par{z^2}{w^2} \\\\
\par{C}{b^2} &= \par{C}{z^2}\par{z^2}{b^2} \\\\
\par{C}{w^1} &= \par{C}{z^2}\par{z^2}{z^1}\par{z^1}{w^1}\\\\
\par{C}{b^1} &= \par{C}{z^2}\par{z^2}{z^1}\par{z^1}{b^1}
\end{aligned}
$$
-->

<!--
## The General Setup

A neural network takes an input vector $x$ and applies a series of 
transformations to it before outputting another vector. A plain
(non-convolutional, non-recurrent) neural network takes the input
$x$ and first applies a linear transformation $z^1=W^1x + b^1$, then
a non-linear transformation $g^1$ to compute an *activation* $a^1 = g^1(z^1)$. 
We can then feed $a^1$ to the next linear transformation $z^2 = W^2 a^1 + b^1$ and then feed $z^2$ to the next non-linear activation $a^2=g^2(z^2)$
and so on.
In a deep network, we will do this multiple times in a row for different 
*layers*. We'll index the layers by \\(l = 1,\ldots,L \\) and will also index 
the linear functions, weights and activations with the respective layer. 
Therefore, we can compute the values for the next layer $l$ given the
outputs from the last layer as follows:

$$
    \begin{aligned}
    z^l &= W^la^{l-1} + b^l\\\\
    a^l &= g^l(z^l)
    \end{aligned}
$$

When we reach the last layer the output of the neural network is the
last activation $a^L=g^L(z^L)$. This output goes into the cost 
function which we'll call \\(C(a^L)\\). This is the function we want to minimize and we want to find the right \\(W^1,\ldots,W^L\\) and 
\\(b^1,\ldots,b^L\\) to minimize it.


Visually, a neural network is often presented
as follows:

![](/images/nn0.svg "Simplest possible neural network")

In this visualization, each node stands for an *activation*, starting with
eight activations in input layer (layer 0). We denote
these inputs as $x$ or $a^0$. This layer
is transformed to six activations $a^1$ in the first hidden layer. These
are transformed to another six activations $a^2$ in the first hidden layer,
which are transformed to another six $a^3$ in the third hidden layer which
are mapped to a single output activation $a^4$.

A different way to visualize a neural network is with a computational graph.
Instead of showing the activations, it shows all the intermediate quantities
and parameters which go into the computation and direct dependencies
between these quantities with arrows. For the five layer network shown above
the computational graph looks as follows.

<div class="mermaid">
graph LR
    W1(W1) -> z1(z1)
    x(x = a0) -> z1
    b1(b1) -> z1
    z1 -> a1(a1)
    W2(W2) -> z2(z2)
    a1 -> z2
    b2(b2) -> z2
    z2 -> a2(a2)
    W3(W3) -> z3(z3)
    a2 -> z3
    b3(b3) -> z3
    z3 -> a3(a3)
    W4(W4) -> z4(z4)
    a3 -> z4
    b4 -> z4
    z4 -> a4(a4)
    a4 -> C(C)
</div>

This computational graph is a very useful for us, because it directly
shows the quantities which we need to compute for the output of the 
neural network and analyze to obtain the derivatives.

### What We Want

To fit the neural network, we want to minimize the cost function \\(C(a^L)\\)
by changing the weights \\(W^l\\) and biases \\(b^l\\). To minimize \\(C\\)
with gradient descent, we need to compute the following gradients of \\(C\\) with
respect to \\(W^l\\) and \\(b^l\\):

\\[
    \frac{\partial C}{\partial W^l}, \: 
    \frac{\partial C}{\partial b^l}
\\]

With these derivatives, we can use gradient descent to update the weights and biases to get better parameter values:

$$
    \begin{aligned}
    W^l &:= W^l - \eta \frac{\partial C}{\partial W^l} \\\\
    b^l &:= b^l - \eta \frac{\partial C}{\partial b^l} 
    \end{aligned}
$$

Of course \\(W^l\\) are matrices and \\(b^l\\) are vectors. By writing
\\(\frac{\partial C}{\partial W^l}\\) and \\(\frac{\partial C}{\partial b^l}\\)
I mean the matrices of partial deriviatives:

\\[
    \begin{aligned}
    \frac{\partial C}{\partial W^l} &= 
        \left[ 
            \begin{matrix}
            \frac{\partial C}{\partial w_{1 1}} & \dots & \frac{\partial C}{\partial w_{1 n_{l-1}}} \\\\
            \vdots & \ddots & \vdots \\\\
            \frac{\partial C}{\partial w_{n_l 1}} & \dots & \frac{\partial C}{\partial w_{n_l n_{l-1}}} \\\\
            \end{matrix}
        \right]
    \\\\
    \\\\
    \frac{\partial C}{\partial b^l} &= 
        \left[ 
            \begin{matrix}
            \frac{\partial C}{\partial b_1} \\\\
            \vdots \\\\
            \frac{\partial C}{\partial b_{n_l}} \\\\
            \end{matrix}
        \right]
    \end{aligned}
\\]

This is quite heavy on notation and complex to think about, so
let's first focus on neural nets with a single neuron per layer. In this
case, both \\(W^l\\) and \\(b^l\\) are scalars. We will later see, that
the equations from these case carry over to multi-neuron case.

Now let's handle each partial derivative in turn:

\\[
    \begin{aligned}
    \frac{\partial C}{\partial a}
        & = \frac{\partial}{\partial a} \left(-y \ln a - (1 - y) \ln (1 - a) \right)
          = -\frac{y}{a} + \frac{1-y}{1-a}
          = \frac{a-y}{a(1-a)} 
    \\\\
    \frac{\partial a}{\partial z}
        & = \frac{\partial}{\partial z} \sigma(z) = \sigma'(z) = \sigma(z)(1 - \sigma(z))
    \\\\
    \frac{\partial z}{\partial w}
        & = \frac{\partial}{\partial w} \left(w x + b\right) = x
    \end{aligned}
\\]

Putting things back together, we get the following expression
for our desired derivative \\(\frac{\partial C}{\partial w}\\):

\\[
    \begin{aligned}
    \frac{\partial C}{\partial w} 
        & = \frac{\partial C}{\partial a} 
          \frac{\partial a}{\partial z} 
          \frac{\partial z}{\partial w} 
        =   \frac{a-y}{a(1-a)} 
            \sigma(z)(1 - \sigma(z))
            x
        \\\\
        & = \frac{\sigma(z)-y}{\sigma(z)(1-\sigma(z))} 
            \sigma(z)(1 - \sigma(z))
            x
        = (\sigma(z) - y) x
    \end{aligned}
\\]

The derivation of \\(\frac{\partial C}{\partial b}\\) is very 
similar:

\\[
    \frac{\partial C}{\partial b} = \frac{\partial C}{\partial a} \frac{\partial a}{\partial z} \frac{\partial z}{\partial b}
\\]

Now \\(\frac{\partial C}{\partial a}\\) and \\(\frac{\partial a}{\partial z}\\) 
are the same as before, only \\(\frac{\partial z}{\partial b}\\) is different:

\\[
    \frac{\partial z}{\partial b} = \frac{\partial }{\partial b} (wx + b) = 1
\\]

Putting this back together we get:

\\[
     \frac{\partial C}{\partial b} = \frac{\partial C}{\partial a} \frac{\partial a}{\partial z} \frac{\partial z}{\partial b} = (\sigma(z) - y) 
\\]







## Putting It All Together

what I'll address here:
- full matrix derivatives of everything

Now that we've done the hard work of finding all the derivatives, let's put
things back together and see how we actually compute all the gradients and
derivatives.

We'll start by computing $\par{C}{z^L}$, the partial derivative of the
cost function with respect to the last linear combination of the previous
layer.

$$
\par{C}{z^L} = \nabla C \odot g^L_z(z^L)
$$

Now we can compute $\par{C}{W^L}$ and $\par{C}{b^L}$:

$$
\begin{aligned}
\par{C}{W^L} 
    & = \par{C}{z^L} \par{z^L}{W^L} 
      = \nabla C \odot g^L_z(z^L) 
    \\\\
\par{C}{b^L}
    & = \par{C}{z^L} \par{z^L}{b^L} 
      = \nabla C \odot g^L_z(z^L) \mathbb{1}
\end{aligned}
$$


## Backpropagation and Gradient Descent

So far this discussion has focused on how to compute the gradients, let's
see how one can pracitcally compute gradients and update parameters via
gradient descent when training a neural network.

This we'll discuss here:

- What is computed in a networks forward pass and what can be cached
- how we compute the gradients step by step
- What role the different observations $(x, y)$ play

## Open questions and things to address:

- dimensions of matrix math
- why do we use $\par{}{z^l}$ and not other partial derivatives?
- Notation on partial derivatives and rules needed

-->

[chain rule]: https://en.wikipedia.org/wiki/Chain_rule
[multivariate chain rule]: https://en.wikipedia.org/wiki/Chain_rule#Multivariable_case