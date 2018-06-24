---
title: Notes on Fast.ai's first lecture
summary: Some notes on the first fast ai lecture
date: 2018-06-24
---

I am following the [fast.ai MOOC] in order to improve my practical
knowledge of deep neural nets and machine learning. Here are my
notes on the first lecture.

## Lecture Overview

The lecture showcases a dogs vs cats classifier which uses the resnet34
neural network architecture. It doesn't do much explaining about how
any of this works under the hood and instead shows how to do it using
the [fast.ai python library], which is a wrapper around [pytorch], packaging
up lots of best practices and tricks in a convenient wrapper.

## Terms & Concepts

Here are the main terms that I came across during the lecture and what
they mean.

### Gradient Descent

The optimization method used to fit a neural network to its training
data. This isn't really explained much, but the idea is very simple,
a function decreases fastest in the direction of the negative gradient,
and this is used for finding a local minimum of the function.

### Learning Rate

The learning rate is a parameter to train a model when using gradient
descent, it is multiplied to the negative gradient to determine the
step size when optimizing. The learning rate is touted as a key parameter
when optimizing neural nets.

### Mini-Batch

Interestingly, when optimizing a neural net, the function and gradient
value are not computed on the full training data for every optimization
set but on a subset. This subset could be randomly drawn from the training
set or the training set could be traversed in some manner. In the later case
the traversal order should probably be random.

This has two interesting implications. First, it is of course much faster
to compute the function and gradient on a smaller sample size. Second, this
also leads to some amount of regularization, as the dataset on which
the function is optimized changes in every iteration, so this should prevent
overfitting to some degree.

The Mini-Batch size should thus be an interesting hyper parameter, however
this is not discussed in the lecture.

### Epoch

An **epoch** is a full run through the training set, so a set of iteration
of mini-batches which ends up using every sample in the training set. I
think this assumes that every sample in the training set is only used once,
so the training set seems to be traversed in orderly manner (albeit that order
may be random).

### Stochastic Gradient Descent (SGD)

Stochastic gradient descent is the practise of not using the full training
set for gradient & function value computation but only a single sample point
(true stochastic gradient descent) or a mini-batch as described above.

### Adaptive Learning Rate

Adaptive learning rate means that the learning rate changes during the course
of the optimization, typically it is decreased as the assumption is that
during later points of the optimization one is closer to the target value
and should take smaller steps. This somehow doubles the role of the gradient
(which should also be small or null when at a local minimum), but its all
experimental and seems to work.

### Stochastic Gradient Descent with Restarts (SGDR)

In this regime, the learning rate is decreased through one ore more epochs
but is then allowed to jump up again. The idea is that periodically we can jump
from one minimum to another. I don't quite understand why one would go to
the lengths of first dropping the learning rate almost to zero only to try
to "jump" afterwards (if we're going to jump somewhere else, then why wait
until we're so close to our local minimum?), but again, I guess people use
it because it works.

### Frozen and Unfrozen Layers

In the CNN used in the first lecture, all except for the last layer are initially
frozen, that means they are not optimized at all.

The idea is that since the model was already trained on ImageNet which is
a pretty similar problem, these layers are already very good for what
we want to do and training the last layer gives the most leverage. Of course
it is also much faster / easier to only train one layer instead of many
(much fewer parameters).

In the second part of the lecture the earlier layers are "unfrozen", so
included into the training to fine tune them to the current dataset.

### Activation Function

Typically the computation of each node of a layer is a linear combination
of weights and inputs of a previous layer passed through a non-linear function.
This function is called the "activation function", typically a "rectified
linear unit" (`f(x) = max(x, 0)`) is used for this.

Other common non-linear functions used are soft-max
(`exp(x_i) / (1 + exp(\sum_i=0^n x_i))`) and sigmoid
(`exp(x) / (1 + exp(x))`), most commonly used for the output layer of a
neural net.

### Activations

An *activation* is the value a node in the neural net takes for a sample.

### Precomputed Activations

In the lecture the `precompute=True` parameter is passed in in some cases.
This is an optimization on top of freezing layers: when layers are fozen,
their activations will never change. So we can simply compute all activations
for all of the training set once and the re-use these precomputed activations
when we compute the function values or gradients during optimization.

### Data Augmentation

Data augmentation means to apply some transformations / tricks to the training
or test set to generate additional data in these sets which is related but
slightly different. For images, this can include rotating, mirroring or zooming
an image.

### Test Time Augmentation

Data augmentation applied to the training set.

## Summary of the proposed approach

In summary, Jeremy / fast.ai proposes the follwoing approach for training
a convolutional neural net to classify ImageNet style image data:

1. Enable data augmentation and use `precompute=True`
2. Use `lr_find()` to find the highest learning rate where loss is still clearly improving.
3. Train the last layer from precomputed activations for 1-2 epochs.
4. Train the last layer with data augmentation (precompute=False) for 2-3 epochs with
   adaptive learning rate and cycle_len=1.
5. Unfreeze all layers
6. Set earlier layers to 3x-10x lower learning rate than next later layer.
7. Use `lr_find()` again.
8. Train full network with adaptive learning rate and `cycle_mult=2` until over-fitting.


[fast.ai MOOC]: http://course.fast.ai/
[pytorch]: https://pytorch.org/
[fast.ai python library]: https://github.com/fastai/fastai


