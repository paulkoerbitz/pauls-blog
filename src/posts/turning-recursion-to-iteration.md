---
title: Turning Recursion into Iteration
summary: Tips and tricks for converting recursive algorihms into iterative algorithms
date: 2019-03-27
draft: true
---

Tom Moertels blog

## The Trampoline

```JavaScript
const trampoline = f => {
    while (f instanceof Function) {
        f = f();
    }
    return f;
}

const factorial_jump = (result, n) => {
    if (n <= 1) {
        return result;
    } else {
        return () => factorial_jump(result * n, n -  1);
    }
}

const factorial = n => trampoline(factorial_jump(1, n));

const cumulative_sum_jump = (result, n) => {
    if (n <= 0) {
        return result;
    } else {
        return () => cumulative_sum_jump(result + n, n - 1);
    }
}

const cumulative_sum = n => trampoline(cumulative_sum_jump(0, n));
```