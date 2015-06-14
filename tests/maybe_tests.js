/*---
category: tutorial
title: maybe
layout: post
---

The `maybe` type, also known as `option` type is a container for a value that may not be there. 

The purpose of this monad is to eliminate the need for writing `null` checks. furthermore it also eliminates the possibility of making errors by missing null-checks.

<!--more-->
*/
QUnit.module("Maybe")//--



//To use the `maybe` monad constructor, you can require it using node:
		
		var maybe = require("../library/maybe")
		var f = require("../library/f")//--

//Where the `../` is the location of the module.

//Then you will be able to wrap a value in `maybe` with:
		var val = 4//--
		var maybe_val = maybe(val)

//If the 'val' is equal to *undefined* it threats the container as empty.

/*
`map(funk)`
----
Executes `funk` with the `maybe`'s value as an argument, but only if the value is different from *undefined*, and wraps the result in a new maybe.

***
*/
QUnit.test("map", function(assert){//--

//Traditionally, if we have a value that may be undefined we do a null check before doing something with it:

	var obj = {}//--
	var get_property = f((object) => object.property)//--
	
	var val = get_property(obj)
	
	if(val !== undefined){
		val = val.toString()
	}
	assert.equal(val, undefined) 

//With `map` this can be written like this

 	var maybe_get_property = get_property.map(maybe)

	maybe_get_property(obj).map((val) => {
		assert.ok(false)//--
		val.toString()//this is not executed
	})

//The biggest benefit we get is that in the first case we can easily forget the null check:
	
	assert.throws(function(){
		get_property(obj).toString()  //this blows up
	})

//While in the second case we cannot access the underlying value directly, and therefore cannot execute an action on it, if it is not there.

})//--

/*
`phatMap(funk)`
----

Same as `map`, but if `funk` returns a `maybe` it flattens the two `maybes` into one.

***
*/

QUnit.test("flatMap", function(assert){//--

//`map` works fine for eliminating errors, but it does not solve one of the most annoying problems with null-checks - nesting:

	var obj = { first: {second:"val" } }
	
	maybe(obj)
		.map( root => maybe(root.first))
		.map( maybeFirst => maybeFirst.map (first => maybe (maybeFirst.second ) ) ) 
		.map( maybeMaybeValue => maybeMaybeValue.map (maybeValue => maybeValue.map( (value)=>( assert.equal( val, "val") ) ) ) )

//`phatMap` does the flattening for us, and allows us to write code like this

	maybe(obj)
		.flatMap(root => maybe(root.first))
		.flatMap(first => maybe(first.second))
		.flatMap(val => {
			assert.equal(val, "val")
		})

})//--

/*
Advanced Usage
----
*/

QUnit.test("advanced", function(assert){//--
// `maybe` can be used with the function monad to effectively produce 'safe' versions of functions

	var get = f((prop, obj) => obj[prop])
	var maybeGet = get.map(maybe)

//This combined with the use of currying makes for a very fluent style of coding:

	var getFirstSecond = (root) => maybe(root).phatMap(maybeGet('first')).phatMap(maybeGet('second'))
	
	getFirstSecond({ first: {second:"value" } }).map((val) => assert.equal(val,"value"))
	getFirstSecond({ first: {second:"other_value" } }).map((val) => assert.equal(val,"other_value"))
	getFirstSecond({ first: "" }).map((val) => assert.equal(val,"whatever") )//won't be executed 

})//--


/*
under the hood
--------------
Let's see how the type is implemented
*/


