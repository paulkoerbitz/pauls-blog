---
title: Efficient Quicksort in Haskell
summary: An in-place quicksort implementation in Haskell
date: 2013-09-09
---

The Haskell wiki gives as one of the examples of the elegance of Haskell
the following as a quicksort implementation in Haskell:

~~~{.Haskell}
qsort :: Ord a => [a] -> [a]
qsort []    = []
qsort (h:t) = qsort (filter (<= h) t) ++ [h] ++ qsort (filter (> h) t)
~~~

In terms of elegance, this solution is indeed hard to beat. It is as
close to Wikipedia's description of the essence of quicksort as code
can get:^[[Wikipedia article on quicksort](http://en.wikipedia.org/wiki/Quicksort).]

> Quicksort first divides a large list into two smaller sub-lists: the low elements and the high elements.
> Quicksort can then recursively sort the sub-lists.

However, [you can
argue](http://augustss.blogspot.de/2007/08/quicksort-in-haskell-quicksort-is.html)
that this is not the *real* quicksort, because the beauty of quicksort
is that it works in-place and does not require O(n) extra space as the
version given above does. Therefore, the question is sometimes raised
how the *real quicksort* would look in Haskell, given that it
generally eschews mutuability and in-place update. There are of course
various implementations floating around on the interwebs, but I wanted
to see how an implementation using unboxed vectors looks like and how
that compares in performance to a version in C++'s.

## A Haskell Implementation

An efficient Quicksort implementation consists of two parts, the
*partition* function, which rearranges the elements of an array
so that the left part is less-or-equal to the pivot and the right
part is greater and the main function which does the recursive calls
on the sub-parts. Here is my Haskell version:

~~~{.Haskell}
{-# LANGUAGE BangPatterns, ScopedTypeVariables #-}
module Main where
import           Control.Monad.Primitive
import           Control.Applicative ((<$>))
import qualified Data.Vector.Unboxed as V
import qualified Data.Vector.Unboxed.Mutable as M
import           System.Environment (getArgs)
import           System.Clock
import           System.Exit (exitFailure, exitSuccess)
import           Control.DeepSeq (deepseq)
import qualified Data.ByteString as BS
import           Data.ByteString.Char8 (readInt)

partition :: (PrimMonad m, Ord a, M.Unbox a) => Int -> M.MVector (PrimState m) a -> m Int
partition !pi !v = do
    pv <- M.unsafeRead v pi
    M.unsafeSwap v pi lastIdx
    pi' <- go pv 0 0
    M.unsafeSwap v pi' lastIdx
    return pi'
  where
    !lastIdx = M.length v - 1

    go !pv i !si | i < lastIdx =
       do iv <- M.unsafeRead v i
          if iv < pv
            then M.unsafeSwap v i si >> go pv (i+1) (si+1)
            else go pv (i+1) si
    go _   _ !si                = return si

qsort :: (PrimMonad m, Ord a, M.Unbox a) => M.MVector (PrimState m) a -> m ()
qsort v | M.length v < 2 = return ()
qsort v                    = do
    let !pi = M.length v `div` 2
    pi' <- partition pi v
    qsort (M.unsafeSlice 0 pi' v)
    qsort (M.unsafeSlice (pi'+1) (M.length v - (pi'+1)) v)

main :: IO ()
main = do
    args <- getArgs
    if length args < 2
      then putStrLn "Usage: qsort RUNS FILENAME" >> exitFailure
      else return ()
    let (nRuns::Int) = read (args !! 0)
    nums <- V.unfoldr (\s -> readInt $ BS.dropWhile isWs s) <$> BS.readFile (args !! 1)
    loop nRuns (do nums' <- V.thaw nums
                   start <- getTime ProcessCPUTime
                   qsort nums'
                   time <- getTime ProcessCPUTime - start
                   putStrLn $ show $ fromIntegral (sec time) +
                                     ((fromIntegral $ nsec time) / 1000000000))
    exitSuccess
  where
    loop 0 _ = return ()
    loop n a = a >> loop (n-1) a

    isWs !c = c == 10 || c == 20 || c == 9
~~~

All in all I'd say this is a pretty direct translation from the imperative
version. For comparison, here is an implementation in C++:

~~~{.Cpp}
#include <iostream>
#include <sstream>
#include <vector>
#include <cstdlib>
#include <fstream>

template<class T>
void swap(std::vector<T>& arr, size_t i1, size_t i2)
{
  T buff = arr[i1];
  arr[i1] = arr[i2];
  arr[i2] = buff;
}

template<class T>
size_t partition(std::vector<T>& arr, size_t lo, size_t hi, size_t pi)
{
  swap(arr, pi, hi);
  T pv = arr[hi];
  size_t si=lo;
  for (size_t i=lo; i<hi; ++i) {
    if (arr[i] < pv) {
      swap(arr, i, si++);
    }
  }
  swap(arr, si, hi);
  return si;
}

template<class T>
void qsort(std::vector<T>& arr, size_t lo, size_t hi)
{
  size_t n = hi-lo+1;
  if (n < 2)
    return;
  size_t pi = partition(arr, lo, hi, lo + (hi-lo)/2);
  qsort(arr, lo,   pi-1);
  qsort(arr, pi+1, hi);
}

int main(int ac, char** av)
{
  if (ac <= 2)
  {
    std::cerr << "Usage: qsort RUNS FILENAME" << std::endl;
    exit(1);
  }
  int nRuns = atoi(av[1]);

  std::ifstream infile(av[2]);
  if (!infile.good())
  {
    std::cerr << "Can't open file: " << av[2] << std::endl;
    exit(1);
  }

  std::vector<int> input;
  while (infile.good())
  {
    int i;
    infile >> i;
    input.push_back(i);
  }

  for (int n=0; n < nRuns; ++n)
  {
    std::vector<int> unsorted(input);
    auto start = clock();
    qsort(unsorted, 0, unsorted.size()-1);
    auto end = clock();
    printf("%11.9f\n", ((double) (end-start)) / CLOCKS_PER_SEC);
  }
  return 0;
}
~~~

Let's see how the two versions compare in terms of performance. For
the comparison I generated 10.000.000 random integers, and measured
the time it takes to sort them 50 times. The C++ version averages
about 0.87 seconds while the Haskell version takes about 1.3
seconds. Not a bad result, but of course I would like the Haskell
version to be just as fast. However, with my limited optimization
skills I wasn't able to eek out any more performance of the Haskell
version.

[AUGS]: http://augustuss.wordpress.com