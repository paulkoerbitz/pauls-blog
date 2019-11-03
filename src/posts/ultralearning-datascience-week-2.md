---
title: Ultralearning Data Science - Week 2
summary: Report from the second week of the "ultralearning" data science project
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-11-03
---

## How the Second Week Went

I started the second week by learning about what the competition
winners did in the Rossmann store sales Kaggle
challenge. There were a lot of different interesting things
to learn from, I found it especially interesting how the experts
approached the challenge, the questions they asked and how they also
struggle to come up with the best possible model, to decide which
features to engineer and to pick, etc. One thing that stood out was
that basically everyone was using XGBoost as their model of choice.

My goal was to take a few easy wins which I could copy from the best
competitors. Using XGBoost seemed like an obvious chioce, since this
this was the model that basically everyone was using and touting as
the best around. I thought that by using XGBoost, I could easily improve
my scores across the competitions I was in and check off my first goal
for this week.

Alas adopting XGBoost was a lot more challenging than I imagined.
The first roadblock I hit was that the model was training really
slowly and not parallelizing at all. I fumbled around with the
parameters and tried to run xgboost both on paperspace as well
as on the in-built kaggle notebooks. I finally figured out at
least at one parameter setting (using the sklearn-based API) under
which training would actually parallelize.

Having xgboost run in parallel, the much bigger challenge was
to actually improve the submission results. I imagined that I
would basically plugin the new model where random forests had
worked and *bingo* collect higher Kaggle scores. To my grave
disappointment, this could not have been further from what
happend - xgboost *did not really work* and produced model
estimates that did not work well on the training set, worse
on the validation set and horrible on the test set. I struggled
to figure out why this was, trying drifferent avenues such
as plotting residuals and analyzing feature importance and
dropping features. None of this showed the much hoped-for
improvements, I basically made zero progress with this approach.

I was stuck and needed a different approach to figure out how
to make xgboost work, so I turned to the xgboost scripts available
on Kaggle and ran those. They worked, but unfortunately, I am
not sure why - in fact this script is using several approaches
that the fastai course warned against! Even worse, when I tried
to port the approach directly over to my script, I could (finally)
reproduce the good results on the validation set, the results
on the leaderboard were still horrible! I am relatively sure that
this must be due to a bug in my submission code, but I haven't
tracked it down and harvested that sweet leaderboard rank enhancement
karma 😔!

All of this was very frustrating, I was basically poking around
in the dark, not really understanding what I was doing. It was
also really time consuming and what's more, I don't have
anything to show for my efforts - I haven't been able to improve
my scores nor have entered new competitions as I had planned
at the end of last week.

My overall takeaway from this somewhat botched week is that I
need to step back and focus more on the basics again. One
good thing I did during this week was watch lectures 4 and
5 of the fastai ML course which had some good suggestions
on how to deal with feature importance, what to look for in
a validation and test set, how to make trees generalize better
etc. This overlaps a lot with what I got from the winner of
the Rossmann competition. It also seems to be something that
is really holding me back - I am stumbling around instead
of confidently knowing what will improve my model and why.
So instead of spending more time on XGBoost, I will focus
on basic data and feature analysis, building solid
validation and test sets and making my training, prediction
and submission workflow rock solid. I want to have a workflow
where I am pretty sure that if my model is performing
well on the validation set, it will also perform well on the
test set.

### Results

In terms of tangible results, I haven't made big advances this
week.

#### Submitted to Three Kaggle Challenges

The results at the kaggle challenges are still like last week:

1. [Titanic](https://www.kaggle.com/c/titanic):
    categorization accuracy 0.77033, position 7499 / 12930, 58th percentile.

2. [Rossmann](https://www.kaggle.com/c/rossmann-store-sales): RMSPE 0.20313,
    position 2783 / 3303, 85th percentile.

3. [House Prices](https://www.kaggle.com/c/house-prices-advanced-regression-techniques):
    RMSLE of 0.15678, position 3229 / 4854, 67th percentile

#### Watched Lectures 4 and 5

I've watched the lectures 4 and 5 and practiced retrieval via
the question book method and open recall. This worked well. I
find open recall to be pretty strenuous, which is probably indicative
that it works well and is good work.

#### Concepts and Anki Flash Cards

I haven't written anything about learned concepts yet and haven't created any
Anki flash cards.

## My Plan for Next Week

Here are my goals for the comming third week:

1. Practice setting up a good validation set for my current three Kaggle challenges. If
    a model does well on the validation set, it should do well on the leader board!
2. Solidify my training and submission workflow. Make sure that it is fully reproducible
    and that "stupid" errors during experimentation don't kreep into training, validation
    and submission!
3. Apply feature selection and engineering techniques to improve my random forest models
    from week 1.
4. Watch lectures 6 and maybe lecture 7 (if useful).
5. Open recall and write down everything I have learned so far.

To a successful third week of ultralearning!