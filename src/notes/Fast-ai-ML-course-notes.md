---
title: Notes on the Fast.ai Introduction to Machine Learning course
summary: My notes and comments Notes on the Fast.ai Introduction to Machine Learning course
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-12-11
---

In the first seven weeks of my [ultralearning data science][ulds] project,
I watched the twelve lectures from the [Introduction to Machine Learning for Coders][fastaiml]
course. Here are my notes on what I learned from this course.

## Overview and Summary

The course mostly covers two main topics: _random forests_
and _neural networks_. I would say that random forests are
covered in some depth, for neural networks the course gives
a brief introduction into building a simple network for the
MNIST dataset and doing some sentiment analysis using logisitic
regression.

More than the theoretical models, the course gives a very
hands-on approach, immediately jumping into Kaggle competitions
and discussing practical aspects of data science / machine
learning such as the importance of picking a good validation set
or ways to wrangle data using the pandas library. This I would say
is the big value of the course: it doesn't spent time on theoretical
concepts not really needed for practical work but dives
right in. This comes at the expense of glossing over a lot of
concepts and risks giving a very superficial understanding, but
it firmly maintains the goal of getting the student ready to apply
the models right away and build understanding once some practical
results have been achieved. What is also great is that the course
encourages practical applications (_"submit to Kaggle every day"_)
and actively publishing ones learnings which of course bodes very
well with the [ultralearning principles][ultralearning].

In a little more detail, the course covers the following topics
and aspects:

1. Random Forests: How to use them, how they work, how to interpret them and where they are limited.
2. Neural Nets: Brief application to MNIST, gradient descent & stochastic gradient descent, how to do this with pytorch and what is under the highest level of abstractions, a brief look at embedding matrices and application to structured
   data problems.
3. Practical Advice: Importance of a good validation set and some advice on how to do this, subsampling data to keep things performant, overparameterizing models and using regularization instead of using more restricted models, fitting parameters
   instead of relying on theoretical parameter sets, doing exploratory data analysis
   and some feature engineering.
4. Sentiment Analysis in NLP using naïve Bayes and the term-document matrix as well
   as logistic regression.
5. Python basics and scientific programming concepts such as vectorized computations and broadcasting, OOP.

Here is my mindmap overview over the topics covered in this
course:

![](/images/FastAiReview_4.png "Mindmap for the Introduction to Machine Learning for Coders course")

A strength of the course is that it approaches the whole subject from a
very pragmatic angle and tries to de-complicate and de-mystify things
where it can. It does what it can to make topic accessible. It touches
on a ton of small things that arise in practice which more theoretical
courses never really get into and which can make progress difficult
initially.

A weakness of the course is that it seems unstructured and chaotic
jumping across and touching on many topics very briefly to then
go elsewhere. Overall, one could say there is not that much ground
covered given the time of the lectures.

## 1. Random Forests

### Intro to Random Forests

A _decision tree_ is a simple model which repeatedly splits a dataset
into two parts. Its prediction for each part is the mean of the target
variable of the samples in that part. It will split the parts according
to a decision criteria, typically the _Gini impurity_, with the goal of
reducing the error of the predictions.

_Random Forests_ are _ensembles_ of _decision trees_, i.e. a number of
decision trees which are different because they all get a different,
randomly selected (=bootstraped) part of the data. A random forest
makes a prediction by making a prediction with each decision tree, then
averaging the overall predictions. Since the trees are all different,
they will make different random errors which will cancel out in the
averaging process and make an overall better predictions.

#### Overfitting

Like any model, _random forests_ can *overfit* the training data, i.e.
reduce the _training error_ by fitting details of the training set
which will not _generalize_ well to the validation or test set
(=unseen data). There are a number of parameters by which we can
control the amount of overfitting:

- *Number of trees:* More trees enable a better self-correction
    and will generally make a better prediction (up to a point).
- *Number of samples per tree:* If each tree only sees a smaller
    subset of the data, the trees will vary more and the averaging
    will have a stronger effect of improving generalization.
- *Maximum tree depth:* By default, trees grow to unlimited depth,
    however this can be limited.
- *Minimum samples per leaf:* By default, trees will split a dataset
    until there is a single sample per leaf, this can be required
    to be coarser.
- *Number of features per split:* Instead of allowing every tree
    to consider all features for every split, a number of features
    that a tree can choose to split on can be chosen at random.
    This generates a higher variability in trees, making the averaging
    more effective.

#### Out-of-Bag Score

Random forests offer a special test to check if they are overfitting:
the *out-of-bag* score. This is a clever trick that relies on the fact
that each tree in a random forest is trained on only some of the training
data. The *out-of-bag* score is the error message by using each tree
to predict the target variable on the training data that it wasn't trained
on. The out-of-bag score is a reliable estimate for how the model will
perform on similar but unseen data. When comparing against the score on
the validation set, it can also indicate if the model is overfitting (then
it should perform similarly bad on the validation and out-of-bag set) or
if the validation set is different from the training data (then the out-of-bag
score will be better than the score on the validation set).

### Interpreting Decision Trees and Random Forests

#### Feature Contributions

When looking at a single predicted value, the *feature contributions*
describe how each feature contributed to the predicted value. The initial
prediction (without looking at any features) is the mean, then each decision
taken based on a feature modifies this prediction somewhat. In a random
forest, the predictions of all trees can be averaged. These contributions
can be visualized in a *waterfall chart*.

#### Confidence Based on Prediction Variance

The *confidence* of a prediction can be analyzed by computing the standard
deviation of the predictions of the different trees in a random forest.
A smaller standard deviation means all trees predict a similar value,
indicating higher confidence.

#### Feature Importance

Sci-kit learn provides the `feature_importance_` variable on a trained
model, indicating which feature is important for predictions. This can
be used to remove unimportant features and make the model smaller.

#### Removing Redundant Features

A *dendrogram* is based on the *rank correlation* of the different features
in a model. It can be used to identify which features are similar (based
on their rank correlation) and could likely be removed from the model. Here's
an example from the [second notebook][jupyter-nb-2]:

![](/images/dendrogram.png "Dendrogram showing feature similarity based on rank correlation")

#### Partial Dependence Plots

*Partial dependence plots* show how varying one or two independent variables
affect the dependent variable. They are obtained by holding all except for one
or two variables fixed and varying the remaining variables from the minimum to
their maximum values. Here are two examples of such plots`:

![](/images/pdplot1.png "Partial dependence plot of a single variable")

![](/images/pdplot2.png "Partial dependence plot of two variables")


#### Extrapolation

One thing random forests cannot do is to *extrapolate data*, i.e. make predictions
for dependent variable which are outside of the training data that the random forest has been trained on. This is because a random forest is basically a stepwise
approximation function. One way of dealing with this is to identify the variables
which will fall outside of the training set (e.g. dates) and to mitigate the
depencence on this data, e.g. either by deleting the features or capturing their
content via feature engineering (e.g. include a linear trend as a feature).

### Building Random Forests from Scratch

Build a simple but correct random forest implementation from scratch in python.
This creates two classes, `DecisionTree` and `TreeEnsemble`.

`TreeEnsemble` builds an ensemble of `DecisionTree`s (=the random forest).
The constructor creates n decision trees via the `create_tree` method.
`create_tree` randomly selects a number of rows from the dataset to hand
to each tree and creates n `DecisionTree`s, storing them in an instance variable
`predict` calls the predict function of all trees and averages the result.

`DecisionTree` recursively builds a decision tree, storing the variable
to split on, the split point, the predicted value (mean), the score as well as the left and right sub-trees (which are again `DecisionTree`s). It uses the `find_varsplit` and `find_better_split` to do so. `find_varsplit` is the
higher-level method, it iterates over all features and looks for a better
split using `find_better_split` for each feature. If the `DecisionTree`
is not a leaf it then creates left and right `DecisionTree`s. To avoid copying
the data, it identifies the indices that the left and right trees should
process and hands those to the child trees so that the children can use
views instead of copying the data. `find_better_split` iterates over all
values for a given feature in order and tries all split points to see if
they improve the overall error (which is the sum of the two errors weighted
by the datapoints for each sight). The `predict` method checks if the decision
tree is a leaf and returns the nodes value (=the mean of its datapoints) if
it is, otherwise it checks if the item to predict is left or right of the
nodes split point and returns the prediction of the left or right child,
accordingly.

## 2. Neural Nets

### Logisitic Regression

### Regularization

### Embedding Matrices

## 3. Practical Advice

Throughout the lectures, there are quite a few pieces of practical advice.
This is maybe the most important and valuable part of the course and something
that is less present in other courses. Here are my most important take aways:

### How to learn

You learn by (a) doing things and (b) explaining them, so
- Apply everything you learn to practical problems, e.g. Kaggle challenges and
- Write blogposts / kaggle kernels from the very beginning

### Generalization and Validation Sets

The most important question in machine learning is __*does it generalize*__, i.e.
does a model trained on training data also perform well on data that it hasn't
seen. To test this *the most important idea in machine learning* is to split the
training data into a *training set* and a *validation set*. The training set is
used to train the model, the validation set is used to test the trained model with
the goal to see if the model performs well on data that it hasn't seen.

It is important that the validation set is differs from the test set in the same
way as the future data that the model will work on differs from the training data.
Therefore, randomly sampling the validation set from the training data maybe
inadequate if the unseen data that the model will work on is not the same as the
data that the training set is from. For example, if we want to predict store sales
for the next six week, the validation set could be the last six weeks of the training data, _not_ a random sample.

One way to test if the validation / test set is different from the training set
is to see if we can predict it: label data in the validation set with 1, data in
the training set with 0 and train a classifier. Can the classifier predict what
data is in the validation and what is in the training set? If so, which features
does it use to predict this? Can we make the model independent of these features?

### Subsample to go Fast

When exploring data, its imortant to keep things fast to be able to experiment
interactively. Subsample the data if it is too large to make sure that things
are fast and responsive.

### Overparameterize, then Regularize

In classical statistics, people tried to use the smallest models possible in
order go get better generalization results. According to Jeremy, in modern
machine learning it is better to overparameterize (i.e. use a model with lots
of parameters) and to use regularization to prevent overfitting.

## 4. NLP / Sentiment Analysis

### Term-Document Matrix

### Naïve Bayes

### Logisitic Regression


## 5. Programming Python

There are also some tips and tricks and discussions on how to do things in
python. Since I came to this course with decent python and scientific computing
knowledge I didn't feel like I learned so much here, I'll focus on what was new-ish
for me or I think is useful to come back to.

### Numpy / Pandas

### Element-wise Operations and Broadcasting

[ulds]: /posts/ultralearning-datascience.html
[fastaiml]: /
[ultralearning]: /posts/ultralearning-book-summary.html
[jupyter-nb-2]: /