---
title: Some Great WebAssembly Resources
summary: A list of links with short commentary that I found useful while looking into WebAssembly
author: Paul Koerbitz <paul@koerbitz.me>
date: 2019-01-28
draft: true
---

# WebAssembly Design Documents

The [WebAssembly design documents][https://github.com/WebAssembly/design] layout the design, goals and semantics of WebAssembly. They're accessible and well written and are certainly worth a good read.

# Blog Posts

## Introduction to WebAssembly by Rasmus Andersson

The [Introduction to WebAssembly][https://rsms.me/wasm-intro] by Rasmus Andersson gives a great overview of the parts found in a WebAssembly module. and some explanations on how linear memory access works.

# Posts on the Mozilla Hacks blog

## WebAssembly's post MVP future

[WebAssembly’s post-MVP future: A cartoon skill tree][https://hacks.mozilla.org/2018/10/webassemblys-post-mvp-future/]

## WebAssembly table imports… what are they?

A great [post on WebAssembly table imports][https://hacks.mozilla.org/2017/07/webassembly-table-imports-what-are-they/] by Lin Clark on the
Mozilla Hacks blog. It explains that table imports are a way to represent
function pointers in WebAssembly to make accessing and manipulating them
safe in WebAssembly.
