---
title: Ultralearning Data Science - Week 1
summary: Report from the first week of "ultralearning" data science
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-10-27
---

## How the First Week Went

I'm writing this post at the tail end of my first *"ultralearning"* week
where I'm trying to learn data science.

Overall, the week went pretty well. I spent about 14 hours on the project -
a bit less than what I had intended, but there were some unforseen things
which made it impossible to meet my full committment. I've worked pretty
concentratedly, being aware of the limitied time and setting timer has
worked in the first week - so I'll keep doing it.

I've watched three lectures of the fast.ai machine learning introduction
course and have practiced the question book method and open recall which
worked really well to remember what was in the lectures.

I also submitted to three Kaggle challenges as planed. I really stumbled
through the kaggle submissions and as a result, the submissions were really
low quality - at least it should not be too hard to improve them.  *My biggest
challenge is that I don't know at all what to do to improve my predictions.*
I fumbled around with some random forest parameters to improve the results on
the validation set, but this was really just try and error.  I'm also stumbling
more than I thought working with numpy and pandas, getting a routine when working
on the kaggle challenges will make this work faster.

I'm happy with my progress, given that I've only worked on this for approximately
14 hours, which is less than two days of full time work. There is of course
a lot to be done.

### Results

In terms of tangible results, I have the following to show

#### Submitted to Three Kaggle Challenges

1. [Titanic](https://www.kaggle.com/c/titanic):
    categorization accuracy 0.77033, position 7499 / 12930, 58th percentile.

2. [Rossmann](https://www.kaggle.com/c/rossmann-store-sales): RMSPE 0.20313,
    position 2783 / 3303, 85th percentile.

3. [House Prices](https://www.kaggle.com/c/house-prices-advanced-regression-techniques):
    RMSLE of 0.15678, position 3229 / 4854, 67th percentile

#### Watched the First Three Lectures

I've watched the lectures and practiced retrieval via the question book method
and open recall. This worked well.

#### Concepts and Anki Flash Cards

I haven't written anything about learned concepts yet and haven't created any
Anki flash cards.

### Log

Here are some very brief notes I took on the days of the week:

#### Monday 2019-10-21

- First Kaggle submission
- Installed anaconda, got jupyter to run

#### Tuesday 2019-10-22

- Went through the jupyter notebook of lecture one
- Open recall on the notes
- Tried to apply the learnings from the lecture to the Titanic challenge
    + Hard time to figure out why I was getting continuous values,
        needed to use RandomForestClassifier instead of RandomForestRegressor
    + then had a hard time why my random forest classifier was working
        very badly - interestingly when splitting the training data into
        training and validation it worked much better.

#### Wednesday 2019-10-23

- Figured out that the prediction on titanic was bad because it used
    the passenger id as one of the independent variables, after dropping it
- watched the last 20 minutes of lecture 1
- started watching lecture 2
- pretty busy day, maria throwing up in the evening, so didn't get to much (1hr overall)
- joined a bunch of Kaggle competitions, among them home prices and rossmann sales predictions

#### Thursday 2019-10-24

- At home in the morning, so couldn't do anything there
- finished watching lecture 2

#### Friday 2019-10-25

- Open recall on lecture 2
- Hit a problem running the notebooks on my machine and lost some time on this
- did some reading on xgboost and the rossmann kaggle challenge

#### Saturday 2019-10-26

- Briefly worked and submitted the first entry on the Rossmann challenge

#### Sunday 2019-10-27

- Watched lecture 3
- Worked on and submitted the
    [House Prices: Advanced Regression Techniques](https://www.kaggle.com/c/house-prices-advanced-regression-techniques)
- Wrote achievements and planning blog post (this thing ;))

## My Plan for Next Week

Here are my goals for the comming second week:

1. Improve my results in the three challenges
2. Participate in three new Kaggle challenges
3. Watch lectures 4 and 5 of the fast ai ML lectures and practice retrieval
4. Create Anki flash cards on concepts I've learned.

To a successful second week of ultralearning!