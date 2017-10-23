---
title: Let Your Prompt Tell You When To Pull
summary: Modify your zsh prompt so that it tells you when your remote branch has new commits
date: 2013-08-20
---

During the last weeks, I have on numerous occasions simply forgotten to
check repositories for updates. I have then often
re-implemented functionality (after swearing that whoever was
responsible for it hadn't done it yet) that was in fact already
implemented in the remote repository.

This is of course quite terrible, mostly because it makes me feel like
an absolute idiot (rightly so?) and because it makes me waste time
(admittedly the functionality had been quite small, otherwise I probably
would have pulled, but still). So I set out to modify my [zsh][ZSH]
prompt so that it will inform me when the remote repository is
ahead of my local repository. The solution turned out to be quite
simple, I just had to add

~~~
ZSH_THEME_GIT_PROMPT_BEHIND_REMOTE="%{$fg_bold[red]%}↓↓↓%{$reset_color%}"
ZSH_THEME_GIT_PROMPT_AHEAD_REMOTE="%{$fg_bold[red]%}↑↑↑%{$reset_color%}"
ZSH_THEME_GIT_PROMPT_DIVERGED_REMOTE="%{$fg_bold[red]%}↕↕↕%{$reset_color%}"
~~~

to my current zsh scheme.

Now, whenever a remote repository that I am tracking has new functionality
my prompt informs me by showing me something along these lines:

![](/images/zsh_screenshot.png "My zsh prompt")


[ZSH]: http://www.yawl.org/ "Yet Another Workflow Language"
