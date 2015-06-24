/*---
category: tutorial
title: promise 
layout: post
---

The `promise` type, also known as `future` is a container for a value which will be resolved at some point in the future, 
via an asynchronous operation. 

<!--more-->
*/
QUnit.module("Promise")//--



//To use the `promise` monad constructor, you can require it using node:
		
		var promise = require("../library/promise")
		var f = require("../library/f")//--

//Where the `../` is the location of the module.

//To create a `promise` pass a function which accepts a callback and calls that callback with the specified value:
		var my_promise = promise( (resolve) =>  
			setTimeout(() => { resolve(5) },1000)  
		)

/*
`map(funk)`
- ---

***
*/

QUnit.module("promises")

QUnit.test("then", function(assert){
	var done = assert.async()
	var p = promise(function(resolve){
		setTimeout(function(){
			resolve(1)

		}, 1000)
	})
	.flatMap(function(val){  
		return promise(function(resolve){
			setTimeout(function(){
				resolve(val + 1)
			}, 1000)  
		})
	
	
	})
	.map(function(val){
		assert.equal(val, 2, 'Chained computation returns correct value')
		done()
	})

	console.log(p)
	p.run()
	

})

