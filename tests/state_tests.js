/*---
category: tutorial
title: state
layout: post
---

The `state` type, is a container which encapsulates a stateful function. It basically allows you to compose functions,
like you can do with the `f` type, except with it any function can access an additional "variable" besides its
input argument(s) - the state. 

<!--more-->
*/
QUnit.module("State")//--

//To use the `state` monad constructor, you can require it using node:
		
		var state = require("../library/state")
		var f = require("../library/f")//--

//Where the `../` is the location of the module.

//In the context of this type a state is represented by a function that accepts a state 
//and returns a list which contains a value and a new state. So for example:

	state((val) => [val+1, val])

//Creates a new stateful computation which increments the input argument and then saves it in the state.


/*
`of(value)`
----
Accepts a value and wraps in a state container
*/
	QUnit.test("of", function(assert){//--
		assert.expect(0)//--
		const state5 = state().of(5)
	})//--

//Note that the following code does not put `5` in the state.
//Rather it creates a function which returns `5` and does not interact with the state. 


/*
`map(funk)`
----
Executes `funk` with the encapsulated value as an argument, and wraps the result in a new `state` object, 
without accessing the state


***
*/
QUnit.test("map", function(assert){//--

//One of the main benefits of the `state` types is that it allows you to mix pure functions with unpure ones, 
//In the same way that promises allow us to mix asychronous functions with synchronous ones.
//Map allows us to apply any function on our value and to consume the result in another function.

	var myState = state(5)
		.map((val) => val+1)
		.map((val) => {
			assert.equal(val, 6)
			return val * 2
		})
		.map((val) => assert.equal(val, 12))
		.run()
})//--


/*

`phatMap(funk)`
----
Same as `map`, except that if `funk` returns a new state object it merges the two states into one.
Thus `flatMap` simulates manipulation of mutable state.
***
*/

QUnit.test("phatMap", function(assert){//--

//For example, here is a function that 

	var myState = state("value")
		//Write the value in the state
		.phatMap( value => state( _ => ["new "+value , "initial "+value]) )

		//manipulate the value
		.phatMap( val => val.toUpperCase().split("").join("-") )
		
		//We can access the state at any time.
		.phatMap( val => state(st => {
			assert.equal( val, "N-E-W- -V-A-L-U-E")
			assert.equal( st, "initial value")
		})).run()
})//--

/*

`save() / load()`
----
Shorthands for the most common state operations: 
- `save` copies the currently encapsulated value into the state
- `load` just returns the current state
***
*/


QUnit.test("save/load", function(assert){//--

	var myState = state(5)
	.phatMap( (val) => val+1 ) //6
	.saveKey("st1")
	
	.phatMap( (val) => val*2 )//12
	.saveKey("st2")
	
	.load()
	.map( (state) => {
		assert.equal(state.st1, 6)
		assert.equal(state.st2, 12)
	}).run()
})//--

/*
under the hood
--------------
Let's see how the type is implemented
*/



