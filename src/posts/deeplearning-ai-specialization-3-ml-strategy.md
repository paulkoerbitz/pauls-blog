---
title: Notes on DeepLearning.ai Specialization - Structuring Machine Learning Projects
summary: Some Notes on the third course of the DeepLearning.ai Specialization
author: Paul Koerbitz <paul@koerbitz.me>
date: 2023-09-10
---

I just completed the third part of the DeepLearning.ai specialization on Coursera.
I'm writing these notes as a summary to remember better and be able to review things
quickly.

## Resources

TODO [My notes (PDF of notes I took on the Remarkable 2)](../../images/deeplearning-spec-3/notes.pdf)

Slides from the lecture

- [Week 1](../../images/deeplearning-spec-3/C3_W1.pdf)
- [Week 2](../../images/deeplearning-spec-3/C3_W2.pdf)


## Week 1

### Why ML Strategy?

- If results are not satisfactory, there are *lots* of things to try
- Many of those things will be expensive, take time
- ML strategy is about *what of these* should you try to improve

*Orthogonalization*

- Decompose potential actions into orthogonal directions
- Know what actions to take based on the problem you have

### 4 core assumptions in ML

1. You can fit the training set on the cost function well, otherwise use
    - a more powerful network / architecture (layers, hidden units, batch normalization, activations, ...)
    - better optimization (algorithm, initialization, longer runs, more compute)
    - more input features

2. Fit dev set on cost function well, otherwise
    - apply regularization / reduce overfitting training set
    - get a bigger training set
    - address data-mismatch between training and dev set

3. Fit test set on cost function well
    - Get a bigger dev set?

4. Perform well in the real world
    - Use different cost function?


### Single number evolution metrics

- Single number evaluation metric makes it much faster to evaluate and compare models
- Ex: F1 score (harmonic mean of precision and recall)

### Optimizing vs Satisficing metrics

- Optimizing metric: Maximize / minimize this number
- Satisficing metric: aka Guard rail metric. Meet a certain threshold.

Ex: When considering accuracy, running time and memory consumption, makes sense to make accuracy the
optimizing metric and running time and memory consumption satisficing metrics (as long as some
threshold is met it's OK)

### Train / dev / test set distributions

- *Important: dev, test (and prod) have to come from the same distribution*
- Otherwise you're shooting on the wrong target
- May be OK for training set to be from different distribution

Examples of what not to do:
- Dev set: US, UK, Europe, Test set: India, China, Asia
- Dev set: middle-income zip codes, Test set: low-income zip codes
- Dev set: cat pictures from internet, Test set: cat pictures from users

Guideline: Choose dev *and* test set to reflect data you want to do well on.

### Dev & test set sizes

- Dev set: big enough to detect differences between different models
- Test set: big enough to give high confidence in real-world performance

### When to change the cost function

- If it doesn't capture well what you really want to achieve
- If doing well on your cost function in dev and test does not mean doing well in your application
   then change the cost function.

### Bayes Error & comparing to human level performance

- Bayes error: error on best possible performance
   - This is frequently $>0%$
- Human level performance
   - Often the best proxy for Bayes error (=best human level performance possible, e.g. team of experts)
   - Humans are pretty good at a lot of tasks, esp. natural perception
- While worse than humans, you can
   - Get labled data from humans
   - Gain insight via manual error analysis
   - Better analyze bias & variance

- *Avoidable bias:* Difference between Bayes error and training error

#### Surpassing human level performance

- Not impossible
- Especially on tasks where there is a lot of structured data (e.g. pCTR, product recommendations,
    predicting transit time, credit scoring)

## Week 2

### Error Analysis

- How do you decide if you want to try a certain avenue? E.g. making your cat classifier better on
  dogs?
- Evaluate the ROI via error analysis - look at 100 mislabled examples. How many of these are dogs?
    - Evaluate multiple ideas in parallel with a spreadsheet (e.g. dogs, big cats, blurry images, mislabled, ...)

- *Strategy: Build first system quickly, then iterate on most promising ideas*

#### Cleaning up wrong lables

- DL algos robust to *random* errors in training set
    - systematic errors are a different topic
- On dev / test set: analyze ROI - is it worth it?

### Training & Testing on different distributions

- Can be OK, but algo might struggle on data it hasn't seen at all
- Introduces "data mismatch" as a new error type. This can be analyzed by additionally having a
   train-dev set (a dev set that has the same distribution of the training set)
   - Can the measure (1) bias, (2) variance (on train-dev), (3) data mismatch (between train-dev and dev) and (4) overfitting dev set (on test set)
- Can augment training data, e.g. with synthesized examples,
    - but need to be careful to not synthesize from a small pool, otherwise algo will overfit that

#### Adressing data mismatch

- Carry out error analysis to understand differences
- Make training data more similar (e.g. synthesize, get more training data, ...)


### Transfer Learning

- Learn on task (a), then swap out last (or a few / add a few) layers of already trained network and
    fine-tune on task (b)
- Depending on how much data you have for task (b) train only the last layer(s) or the full network

Transfer learning makes sense if:
- Input data to the two tasks is the same
- You have much more data for task (a) than for task (b)
- Tasks are similar / low-level features from task (a) will be useful for task (b)


### Multi-task learning

- Learn multiple tasks at once, a "multi-headed model"
- Example: multi-object classification (is it a car, a cat, a dog, ...)
- Loss function: just sum over the individual losses $\frac{1}{m}\sum_{i=1}^m\sum_{j=1}^n L\left(y_j^{(i)}, \hat{y}_j^{(i)}\right)$
    - Using examples with only some lables present: Just use loss functions for those and ignore the rest
      (don't sum over all $j$)

Multi-task learning makes sense if:
- The different tasks could benefit fromt he same low-level features
- Amount of data for each task is roughly similar
- Can train a NN big enough to handle all tasks


### End-to-End Deep Learning

- Instead of breaking a task into a sequence of tasks and have a "pipeline", just train a single
    network from end-to-end
- Works well if there is lots of data
- Breaking into individual tasks works better if (a) these are simple and well-understood and (b)
    you have good data for them
- Example: Face-ID (currently) works better if broken into two tasks:
    1. identify bounding box of face
    2. compare face to DB of faces (is this the same image?)
