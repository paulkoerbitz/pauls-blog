---
title: Notes on DeepLearning.ai Specialization - Improving Deep Neural Nets
summary: Some Notes on the second course of the DeepLearning.ai Specialization
author: Paul Koerbitz <paul@koerbitz.me>
date: 2023-09-03
---

I just completed the second part of the DeepLearning.ai specialization on Coursera.
I'm writing these notes as a summary to remember better and be able to review things
quickly.

## Resources

[My notes (PDF of notes I took on the Remarkable 2)](../../images/deeplearning-spec-2/notes.pdf)

Slides from the lecture

- [Week 1](../../images/deeplearning-spec-2/C2_W1.pdf)
- [Week 2](../../images/deeplearning-spec-2/C2_W2.pdf)
- [Week 3](../../images/deeplearning-spec-2/C2_W3.pdf)

Jupyter notebooks

- [Week 1 - Initialization](../../images/deeplearning-spec-2/Initialization.ipynb)
- [Week 1 - Regularization](../../images/deeplearning-spec-2/Regularization.ipynb)
- [Week 1 - Gradient Checking](../../images/deeplearning-spec-2/Gradient_Checking.ipynb)
- [Week 2 - Optimization methods](../../images/deeplearning-spec-2/Optimization_methods.ipynb)
- [Week 3 - Tensorflow introduction](../../images/deeplearning-spec-2/Tensorflow_introduction.ipynb)

## Notes

Here is a summary of the topics and notes I took for them

### Bias-Variance tradeoff or Underfit vs Overfit

- To get an understanding of bias and variance of our model, we need to split the training data into training, dev and (maybe) test set
  - We need a test set if we want to get an unbiased estimate of our models real-world performance
- 70%/30% or 60%/20%/20% split rules may or may not apply - you just need enough data in dev and test sets to estimate the fit
  - e.g. on a training set of 10M examples, maybe 100K enough for dev / test set
- High bias seems to be a synoym for underfitting the training set
- High variance seems to be a synonym for overfitting

What to do against high bias (underfitting)?
- More powerful model (e.g. more layers / hidden units / different architecture)
- Better optimization algorithm
- Better initialization
- Tune learning rate

What to do against high variance (overfitting)?
- Regularization (L2, dropout, early stopping)
- Larger / more diverse training set


### Regularization

#### L2 Regularization

- Adds a cost term $\frac{\lambda}{2m}\sum_{i=0}^n w_i^2$ to the cost function
- This creates a linear term for the parameters in the gradient
- Sometimes called "weight decay"

#### Dropout

- Drops random neurons in the hidden layers of the network
- Hyperparameter $\text{keepprob}$ which keeps neurons alive
- Scale activations by $1 / \text{keepprob}$ after dropping
- During backprop
    - Drop the same neurons as during forward prop from the gradient of the activations $dA$
    - Scale the gradient of the activations $dA$ by $\text{keepprob}.

### Normalizing Inputs

- Having inputs on the same scale speeds up learning
- Shape of cost function should be more uniform, making it easier for gradient descent to point to the minimum
- Need to normalize data in the same way during dev/test/production!

### Vanishing & Exploding Gradients, Initializations

- Gradients in earlier layers depend multiplicatively on gradients of later layers
- If gradients of later layers are all (or most) $> 1$ the gradient will explode
- If gradients of later layers are all (or most) $< 1$ the gradient will vanish
- Parameter initialization can help with this
- Don't initialize parameters to 0 or large values. This will lead to vanishing or exploding gradients, respectively
- Recommended: *He* initialization: $\text{Var}(w^l_{ij})=\frac{2}{k^{l-1}}$ (where $k^l$ is the number of nodes in layer $l$).

### Numerical Approximation and Gradient Checking

- It's easy to get gradient implementation wrong, we can use the numerical approximation to check it:

$$
\frac{dJ}{d\theta_i} \approx d\tilde{\theta}_i = \frac{J(\theta + \epsilon_i) - J(\theta - \epsilon_i)}{2\epsilon}
$$

Where $\epsilon_i$ is the $i$-th unit vector multplied by $\epsilon$.

To validate if the actual implementation close enough, check

$$
\frac{\Vert d\tilde{\theta} - d\theta \Vert_2}{\Vert d\tilde{\theta} \Vert_2 + \Vert d\theta \Vert_2} \approx \leq 10^{-7}
$$

### Mini-Batch Gradient Descent

- Instead of doing gradient descent on (a) the full batch of training examples or (b) a single example (stochastic gradient descent) do it on small batches (e.g. 64 - 2048 items)
- Uses vectorization, forwardprop and backprop can process a whole mini-batch at a time, so tends to be faster
- Cost function and gradients will be less smooth than with full-batch => use momentum or ADAM
- Tune mini-batch size (another hyperparameter), ideally so problem fits into GPU memory

### Exponentially weighted averages

Keep an exponentially weighted average of $\theta$'s by computing

$$
v_t = \beta v_{t-1} + (1-\beta)\theta_t
$$

Intuition is that $v_t$ is the velocity and $\theta_t$. $\beta$ controls how quickly velocity changes. Approximately we're averaging over $\frac{1}{1-\beta}$
values. (E.g. 10 values for $\beta=0.9$)

When $v_0=0$ we can use a bias correction term $\tilde{v}_t = \frac{v_t}{1-\beta^t}$.

This is a very memory-efficient way of maintaining a running average (only need to remember one term).

### Gradient Descent with Momentum

Use exponentially weighted average on the gradients.


\\[\begin{aligned}
v_{dW} &= \beta v_{dW} + (1 - \beta)dW \\\\
v_{db} &= \beta v_{db} + (1 - \beta)db \\\\
W &:= W - \alpha v_{dW} \\\\
b &:= b - \alpha v_{db} \\\\
\end{aligned}\\]


Smoothes over fluctuations, helps with stochastic or mini-batch gradient descent.

### RMSProp

An alternative way of smoothing out gradient updates.

\\[\begin{aligned}
S_{dW} &= \beta_2 S_{dW} + (1-\beta_2)dW^2 \\\\
S_{db} &= \beta_2 S_{db} + (1-\beta_2)db^2 \\\\
W      &:= W - \alpha\frac{dW}{\sqrt{S_{dW} + \epsilon}} \\\\
b      &:= b - \alpha\frac{db}{\sqrt{S_{db} + \epsilon}}
\end{aligned}\\]

### Adam Optimization

- Uses both momentum and RMSprop together

$$
\gdef\corr#1{#1^{\text{corrected}}}
$$

\\[\begin{aligned}
v_{dW} & = \beta_1 v_{dW} + (1-\beta_1) dW \\\\
v_{db} & = \beta_1 v_{db} + (1-\beta_1) db \\\\
S_{dW} & = \beta_2 S_{dW} + (1-\beta_2) dW^2 \\\\
S_{db} & = \beta_2 S_{db} + (1-\beta_2) db^2 \\\\
\corr{v_{dW}} &= \frac{v_{dW}}{1-\beta_1^t}\\\\
\corr{v_{db}} &= \frac{v_{db}}{1-\beta_1^t}\\\\
\corr{S_{dW}} &= \frac{S_{dW}}{1-\beta_2^t}\\\\
\corr{S_{db}} &= \frac{S_{db}}{1-\beta_2^t}\\\\
W &:= W - \alpha \frac{\corr{v_{dW}}}{\sqrt{\corr{S_{dW}} + \epsilon}} \\\\
b &:= b - \alpha \frac{\corr{v_{db}}}{\sqrt{\corr{S_{db}} + \epsilon}}
\end{aligned}\\]

[Adam paper](https://arxiv.org/abs/1412.6980)

- Hyperparameters: typically tune $\alpha$, leave $\beta_1 = 0.9$, $\beta_2 = 0.999$ and $\epsilon = 10^{-8}$.

### Learning Rate Decay

- Can be useful to decrease learning rate as learning progresses, to take smaller steps near the minimum
- There are different schemes
    - e.g. $\alpha = \frac{1}{1 + \text{decay_rate}\text{epoch_num}}\alpha_0$
    - stepwise manual decay
    - exponential decay


### Local optima & Saddle points

- Because there are many parameters, optimizers of NNs unlikely to get stuck in a local optima
    - E.g. in 20000 dimensions, it is unlikely that a point is a minimum along all dimensions if its not a global minimum
- However, saddle points or plateaus are a problem, they can make learning very slow

### Hyperparameter Search

#### Hyperparameters and their Priorities

- Not all hyperparameters are created equal / have the same priority
- P0: $\alpha$
- P1: #hidden_units, $\beta$ (momentum), mini-batch size
- P2: #layers, learning rate decay
- P3: Adam parameters ($\beta_1, \beta_2,\epsilon$)

#### How to search for Hyperparameters

- Don't search on a grid, search with random values
    - Allows to try out many more values for each hyperparameter
- Consider a coarse-to-fine approach: First search a larger space, then zoom in on the space that works best

#### Picking an appropriate scale

- Some parameters are OK to search for in linear scale, eg. #hidden_units
- Others need a log scale, e.g. $\alpha, \beta$.
    - When wanting to search $\alpha \in [0.0001, 0.1]$ it doesn't make sense to search linearly,
      search in log-scale instead
    - Sample exponent in $a\in[-4, -1]$, then set $\alpha$ to $10^a$.
    - Similar for $\beta$, when wanting to search in $[0.9, 0.999]$ search for $1-\beta$ with the
      above method instead

### Panda vs Caviar Strategy

- Panda strategy: babysit one model, try different optimization strategies one after another

- Caviar strategy: try many approaches at once, then pick the winners

Use caviar strategy when you can (=enough computational power for the data set), panda when you must.

### Normalized Batch / Batch Norm

  - Instead of learning the mean and scale of each layer implicitly, learn them as explicit parameters
  - Normalize each $z_j^{(l)}$ to have 0 mean and variance 1. Normalization is done over the different examples in each mini-batch
      - For test / prod, compute normalization parameters as exponentially weighted averages over the mini-batches
  - Then scale by $\gamma_j^{(l)}$, shift by $\beta_j^{(l)}$, these are learned parameters
  - Because we explicitly shift, we don't need the bias units $b$

  Intuition:
  - Batch normalization works because later layers see less shifts in their inputs (because these are now explicitly controlled / learned)
      - Changes in the input layer is sometimes referred to as "covariance shift"
  - This can speed up learning in later layers, because they need to adopt less to rapid changes in
     the previous layers.

### Softmax Regression

- Softmax layer can be used for multi-class classification. Outputs a vector of $n \times 1$
- Somewhat unusual layer since it acts on the whole vector

$$\text{softmax}_i = \frac{\exp{a^{(L)}_i}}{\sum_{j=0}^{k^{(L)}}\exp{a^{(L)}_j}}$$

### ML Frameworks and TensorFlow

- Many different frameworks to choose from, many viable alternatives
- Choose a framework that
  - Is nice to code in (reading and writing)
  - Has good performance
  - Is truely open (open source + good governance)
