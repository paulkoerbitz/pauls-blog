---
title: DeepVect - Using Deep Learning to Convert Images to SVGs
summary: First thoughts on my project to convert images to SVGs
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-12-09
---

One of the projects I want to try in my ultralearning datascience
project is to create a neural network model that can convert images
to SVG files.

## Related Works

I looked around for existing literature, models and programs that try this.

### VectorMagic

The current state-of-the-art program seems to be [VectorMagic]. The technology
behind VectorMagic is not clear, however it was created in 2007 and one of the
founders was previously working at the Stanford AI lab working on path planning
for autonomous vehicles, so it seems unlikely that it relies directly on deep
learning architectures

### Pix2Code

There is the [pix2code paper] and corresponding [github repo][pix2code github]
by Tony Beltramellif of [uizard] which does something similar trying to create
UI code for iOS and Android applications from images. There is also a follow-up
project called [code2pix] trying to improve on the initial results.

### Pointer Networks

On this [question on quora] Ian Goodfellow points out the [pointer networks]
paper which is using neural networks to predict the convex hull of a set
of points.

[question on quora]: https://www.quora.com/Can-neural-networks-output-vector-representations-such-as-SVG-of-images
[pointer networks]: https://arxiv.org/abs/1506.03134
[uizard]: https://uizard.io/
[VectorMagic]: https://vectormagic.com/
[pix2code paper]: https://arxiv.org/abs/1705.07962
[pix2code github]: https://github.com/tonybeltramelli/pix2code
[code2pix]: https://towardsdatascience.com/code2pix-deep-learning-compiler-for-graphical-user-interfaces-1256c346950b?