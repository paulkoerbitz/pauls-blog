---
title: Ultralearning Data Science - Week 3
summary: Report from the third week of the "ultralearning" data science project
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-11-10
---

## How the Third Week Went

I spent the third week on setting up and analyzing the validation
set on the Rossmann store sales challenge. A relatively large part
of this time was spent finding a good split of the training data
into training and validation set. Another large part was spent
training different models, submitting the predictions to Kaggle
and comparing the results on the validation set versus those on
the Kaggle leaderboard. I'm somewhat happy with the result, plotting
the results on the validation set vs the results on the public
leaderboard lies on a nice line, indicating that the validation set
is useful to assess models and predict the results on the leaderboard
well. This was my first goal for this week and I'm happy that it was
achieved, even if I didn't go quite as far as I had hoped.

I also watched lecture 6 of the fast.ai lectures, but I didn't
do open recall on this lecture, nor did I create any Anki cards
so far. What is hampering me from doing this that I'm not learning
all that many new concepts right now, I'm training much more skills
and trying things out, this is hard to capture on flash cards. But
I still think this could be used in a useful way for some things.

In this week, I wasn't quite able to put in the full time I had planned, ending the week with just short of 9 hours spent on the
project vs the 15 that I aimed for. I had a few things come up on
my social calendar which kept me from reaching this goal. This is
somewhat a problem with my planning, that I can basically only
reach it if I don't have anything else come up. Still, I think it
is better to shoot for this goal and sometimes miss it than to
aim lower and then meet the goal but put in less time and effort
overall.


## Thoughts on my Progress so far

With three weeks in, I was also evaluating my progress so far.

On the one hand, I do think that I have made significant progress
given that I've only spend three weeks. I am also happy that I have
worked consistently and concentratedly on this project, always trying
to make progress towards my current goal. I am absolutely sure that
I have made much more practical progress than I would have if I had
spent more time watching lectures, doing more theoretical exercises
or reviewed concepts.

On the other hand, what I am doing does not quite feel like
_ultralearning_. For this, my work does not quite feel intense
and focused enough and right now it is also hard to imagine that
my progress on this project would impress anyone in any way.

#### What Improvements Can I Make?

1. Be (even more) disciplined about time, aiming to increase the amount of time spent to 15-20 hours per week. This is challenging with my other committments and I'm not sure I can make this happen, but the amount of time spent does feel like one of the things blocking more progress.
2. Get more feedback. It often feels like I'm stumbling in the dark and that more coaching and feedback would help. Being evaluated would also increase my motivation to reach certain goals. I will search my personal network if I can find a mentor.
3. Write to get feedback. Another approach that could help to get more feedback would be to post in a more prominent way the things I'm trying to do and get feedback for that. For example, when trying to find a good validation set, I could create a kernel on Kaggle on an ongoing challenge and see if I can get some comments.
4. Improve focus by setting clearer mini goals. Although I've been pretty disciplined and worked diligently on the tasks I set out, I think I can sometimes squeeze out a bit more effort and concentration by having clearly stated goals every time I start working on something.
5. Be more disciplined about retrieval and retention. Every time I watch a lecture, I will perform an open recall session right afterwards. I will also start creating Anki
cards and review them.
6. Do exploratory data analysis. I think one thing that is holding me back is not understanding the data and my model results well enough. One obvious step is to invest more in explorartory data analysis to fix this.

## My Plan for Week 4

My plan for the fourth week is as follows:

1. Look for a mentor by contacting potential people in my network.
2. Complete the validation dataset analysis for the Rossmann competition by
    - running the same models on a random validation set and comparing results.
    - trying to predict the test set and see if the validation set is driven by
        the same variables.
3. Try to improve the random forest models in the Rossmann challenge by
    - predicting the log sales instead of sales
    - simplifying the random forest models by throwing out correlated features
    - doing some amount of feature engineering as pointed out by the Rossmann challenge     winner
    - giving XGBoost another shot on the Rossmann data
4. Do open recall on things learned so far and write Anki cards
5. Watch lectures 7 and 8 of the fast ai course, perform open recall and write Anki    cards on useful concepts.

To a successful fourth week of ultralearning!