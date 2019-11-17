---
title: Ultralearning Data Science - Week 4
summary: Report from the fourth week of the "ultralearning" data science project
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-11-17
---

## How the Fourth Week Went

In the fourth week, I finalized the comparison of time-based vs. randomly
selected validation sets for the Rossmann store sales challenge. I am
happy that the time-based validation set predicts the performance of models
on the leaderboard much better than the randomly selected validation set.
This is in line with what was discussed
in the fast.ai lectures which stressed that it was really important to
create a validation set that differed from the training set in the same
way as the training + validation set differs from the test set.
I still feel that I have much to learn in terms of selecting and evaluating
a good validation set, but I'm glad that I can apparently get this right on
at least one Kaggle challenge.

On Tuesday morning in the shower, I had the thought if it wouldn't be
possible to extract the information what part of the test set was the
public and the private part of the leaderboard. This lead me down a path
of investigating data leakage and leaderboard probing. It seems
that this is sometimes possible to extract information on the leaderboard
and I spent some time on Tuesday understanding a [perfect score](https://www.kaggle.com/olegtrott/the-perfect-score-script)
script, which cleverly extracted the 198 leaderboard labels from a 0-1
categorization competition. To do so, it predicted
0.5 for all except for 15 entries on the leaderboard and for each of the
15 entries it submitted a slightly different value. The script then observed
the public score and tries all possible 0-1 combinations for these 15
values. The submitted values were chosen such that only one combination
of labels could lead to the observed scores. I left the topic at that,
still not sure how to discover what part of the test set is the public
and what part is the private leaderboard, but somewhat I happy that I had
stumbled upon this slightly advanced topic by myself.

I spent the rest of the week doing exploratory data analysis on the
Rossmann store sales challenge, comming up with questions and trying
to answer them by looking at and analyzing the data. I mostly learned
how to use pandas in different ways and came up with some tricky ways
in how to augment the data in a vectorized way to keep this fast enough.
I'm happy that I was able to answer all questions that I could come up
with, but I still feel that I'm not really getting deep into the data
and have way more to learn on this front.

With respect to my progress and "ultralearning", I still feel much
the same way as I did at the end of last week: I am definitely making
progress and I think I'm picking up practical skills faster than I
would following lectures. On the other hand, what I'm doing certainly
doesn't feel like ultralearning based on both the intensity and the
speed of my learning process.

## Reviewing Goals for Week 4:

Looking back at my goals for week 4, here are the results:

1. Look for a mentor by contacting potential people in my network.

    *Done - did
    contact quite a few people, but haven't found anyone so far. Still on it,
    will go to a meetup on Tuesday to see if I can find somebody there.*
2. Complete the validation dataset analysis for the Rossmann competition by
    - running the same models on a random validation set and comparing results.
        *done.*
    - trying to predict the test set and see if the validation set is driven by
        the same variables.
        *not done.*
3. Try to improve the random forest models in the Rossmann challenge by
    - predicting the log sales instead of sales
    - simplifying the random forest models by throwing out correlated features
    - doing some amount of feature engineering as pointed out by the Rossmann challenge     winner
    - giving XGBoost another shot on the Rossmann data

    *Sorry to say that I didn't do any of this.*
4. Do open recall on things learned so far and write Anki cards for this

    *Wrote Anki cards, did some amount of recall, but not enough*
5. Watch lectures 7 and 8 of the fast ai course, perform open recall and write Anki    cards on useful concepts.

    *Started watching lecture 7, but didn't complete it and did not watch lecture 8.*

## My Goals for Week 5

Looking back, I think I am aiming too high and setting goals that
I am falling really short of achieving. This week I am trying to
set more achievable goals and actually try to achieve all of them:

1. Try to improve the random forest models in the Rossmann challenge by
    - predicting the log sales instead of sales
    - simplifying the random forest models by throwing out correlated features
    - doing some amount of feature engineering as pointed out by the Rossmann challenge winner
    - giving XGBoost another shot on the Rossmann data
2. Do exploratory data analysis on a new Kaggle challenge and post it publicly
3. Watch lectures 7 and 8 of fast.ai and do open recall on them
4. Write Anki Cards