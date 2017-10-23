---
title: List tricks in Python
summary: Rocking lists in Python as if it was a functional language
date: 2011-12-16
---

Flattening a list of lists

```{.python}
>>> sum([[1],[2],[3],[4]], [])
[1,2,3,4]
```

Transposing a list of lists
```{.python}
>>> zip(*[[1,2],[3,4]])
[(1,3),(2,4)]
```
