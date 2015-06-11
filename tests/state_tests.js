/*---
category: tutorial
title: state
layout: post
---

The `state` type, also 

<!--more-->
*/
QUnit.module("State")//--



//To use the `state` monad constructor, you can require it using node:
		
		var state = require("../library/state")
		var f = require("../library/f")//--

//Where the `../` is the location of the module.

//Then you will be able to wrap a value in `state` with:

/*
map(funk)
----
Executes `funk` with the `state`'s value as an argument, but only if the value is different from *undefined*, and wraps the result in a new state.

***
*/
QUnit.test("state", function(assert){

	var my_state = state(5)
	.phatMap((val) => (current_state) => val+1)
	.phatMap((val) => (current_state) => state(val, state.write("key", val)))
	.run()
	assert.deepEqual(my_state, {key:6})

})
