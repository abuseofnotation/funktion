/*
---
category: tutorial
title: maybe monad
layout: post
---

The `maybe` type, also known as `option` type is a container for a value that may or not be there. 

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
map(funk)
----
Executes the function with the `maybe`'s value as an argument, but only if the value is different from *undefined*.

*/
QUnit.test("map", function(assert){//--

//If you have access to a value that may be undefined you have to do a null check before doing something with it:

	var obj = {}//--
	var get_property = f((object) => object.property)
	
	var val = get_property(obj)
	
	if(val !== undefined){
		val = val.toString()
	}
	assert.equal(val, undefined) 

//However we may easily forget the null check
	
	assert.throws(function(){
		get_property(obj).toString()  //this blows up
	})
    
//if you use **maybe** you cannot access the underlying value directly, and therefore you cannot execute an action on it, if it is not there.

 	var maybe_get_property = get_property.map(maybe)

	var function_called = false
	maybe_get_property(obj).map((val) => {
		assert.ok(false)
		val.toString()//this is not executed
	})
})//--

/*
flatMap(funk)
----
Same as map, but allows for nes

*/

QUnit.test("flatMap", function(assert){//--
	var get = f((prop, obj) => obj[prop])

	var obj = { first: {second:{third:"val"} } }
	
	maybe(obj)
		.flatMap((obj) => maybe(obj.first))
		.flatMap((obj) => maybe(obj.second))
		.flatMap((obj) => maybe(obj.third))
		.flatMap((val) => {
			assert.equal(val, "val")
		})
	
	var maybe_get = get.map(maybe)


	

})



