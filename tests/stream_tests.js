
/*---
category: tutorial
title: stream 
layout: post
---

The `stream` type, also known as a lazy list is a container for a list of values which come asynchronously.

<!--more-->
*/
QUnit.module("stream")//--



//To use the `stream` monad constructor, you can require it using node:
		
	var stream = require("../library/stream")
	var f = require("../library/f")//--

//Where the `../` is the location of the module.

//To create a `stream` pass a function which accepts a callback and calls that callback with the specified value:

	const clickStream = stream( (push) => { document.addEventListener('click', push)})
	window.clickStream = clickStream

// Like promises, streams are also created with a helper

	const countTo = (range) => stream( (push) => {
		for (let i = 1; i<= range; i++){
			push(i)
		}
	})
/*
`run()`
----
Executes the stream and fetches the data.

***

`map(funk)`
----
Returns a new stream, which applies `funk` to the data when you run it.

***
*/

QUnit.test("map", function(assert){//--
	const stop = assert.async()//--
	var pushToStream = undefined
	const myStream = stream(push =>{ pushToStream = push})
		.map(val => val*2)
		.map(val => assert.equal(val, 10))
		.run()
	
	pushToStream(5)
	stop()
})//--


/*
`phatMap(funk)`
----
A more powerful version of `map` which can allows you to chain several steps of the asychronous computations together.
Known as `then` for traditional stream libraries.

***
*/

//QUnit.test("phatMap", function(assert){//--
	//const done = assert.async()//--	
//})//--

/*
under the hood
--------------
Let's see how the type is implemented
*/
