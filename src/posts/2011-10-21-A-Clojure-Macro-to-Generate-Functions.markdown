---
title: A Clojure Macro to Generate Functions
summary: Programmatically generating functions in Clojure
date: 2011-10-21
---

Prompted by [this question]("http://stackoverflow.com/q/7852351/346587")
on Stackoverflow I thought a little bit about macros that generate functions. Here is what I came up with:

~~~~ {.Clojure}
(defmacro make-placeholders [n]
  `(map eval
        '~(for [cntr (range 0 n)]
           `(defn ~(symbol (str "_" cntr))
               {:placeholder true} [& args] (nth args ~cntr)))))
~~~~

This is macro generates functions `_0 .. _n-1` that calls nth on the list
of the arguments following it, so `(_2 1 2 3 4)` returns 3. I have not
made up my mind if it is really a good idea to do this, but for now it's
 a clever hack - maybe I'll use it until I discover why it's a bad
idea...
