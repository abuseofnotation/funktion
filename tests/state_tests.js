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
	.phatMap(function(val){console.log(1);return val+1})
	.phatMap(function(val){console.log(2);return state(val, state.write("key", val))})
	.run()
	assert.deepEqual(my_state, {key:6})

	function put_input_in_state(a_state){
		return a_state.flatMap(function(array){
			if(array.length===0){return a_state}
			var el = array.pop()
			return put_input_in_state(state(array, state.write(el, true)))
		})

	}
	//var unique = f().map(state).map(put_input_in_state).map(state.run).map(Object.keys)
	var unique = (arr) => Object.keys(put_input_in_state(state(arr)).run())

//	var unique = f.compose(Object.keys, state.run, put_input_in_state, state)
	assert.deepEqual(unique(["1","2","2","3"]), ["1","2","3"])
})
