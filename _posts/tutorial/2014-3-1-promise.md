---
category: tutorial
title: promise 
layout: post
---

The `promise` type, also known as `future` is a container for a value which will be resolved at some point in the future, 
via an asynchronous operation. 

<!--more-->





To use the `promise` monad constructor, you can require it using node:
		
	var promise = require("../library/promise")


Where the `../` is the location of the module.

To create a `promise` pass a function which accepts a callback and calls that callback with the specified value:

	var my_promise = promise( (resolve) =>  
		setTimeout(() => { resolve(5) },1000)  
	)

 In most cases you will be creating promises using helper functions like:

	const getUrl = (url) => promise( (resolve) => {
	  const rq = new XMLHttpRequest()
  	  rq.onload = () => resolve(JSON.parse(rq.responseText))
	  rq.open("GET",url,true);
	  rq.send();
	})

`run()`
----
Executes the promise and fetches the data.

***
For example to make a promise and run it immediately do:

	getUrl("people.json").run()
	//[
	//  { "name":"john", "occupation":"programmer"},
 	//  {"name":"jen", "occupation":"admin"}
	//]

	getUrl("occupations.json").run()
	//{
	//  "programmer": "writes code"
	//  "admin": "manages infrastructure"
	//}


Note that we will be using the data from these two files in the next examples. 

`map(funk)`
----
Returns a new promise, which applies `funk` to the data when you run it.

***
The function can be used both for manipulating the data you fetch and for running side effects  




	getUrl("people.json")
	  
	  //Using "map" for manipulating data
	  .map((people) => people.map((person) => person.name))

	  //Using "map" for triggering side effects 
	  .map(names => {
	    assert.deepEqual(names, ['john', 'jen'])

	  }).run()




`phatMap(funk)`
----
A more powerful version of `map` which can allows you to chain several steps of the asychronous computations together.
Known as `then` for traditional promise libraries.

***



	

For example here is a function which retrieves a person's occupation from the `people.json` file
and then retrieves the occupation's description from `occupations.json`. 

	const getOccupationDescription = (name) => getUrl("people.json")

	  //Retrieve person data
	  .phatMap((people) => people.filter( person => person.name === name )[0])

	  //Retrieve its occupation
	  .phatMap( (person) => getUrl("occupations.json")
	    .map(occupations => occupations[person.occupation]) )

Here is how the function is used:

	getOccupationDescription("john").map((desc) => { 
		assert.equal(desc, "writes code") 

	}).run()
	




under the hood
--------------
Let's see how the type is implemented





The `of` method takes a value and wraps it in a promise, by immediately calling the resolver function with it.

	//a -> m a
	of:function(val){
		return promise( (resolve) => resolve(val) )
	},

The `map` method creates a new promise, such that when the old promise is resolved, it takes its result, 
applies `funk` to it and then resolves itself with the value.

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		return promise( (resolve) => this._resolver( (val) => resolve( funk(val) ) ) )

	},

In this case the implementation of `flat` is quite simple.

Effectively all we have to do is return the same value with which the inner promise is resolved with.
To do this, we unwrap our promise once to get the inner promise value, and then unwrap the inner
promise itself to get its value.

	//m (m x) -> m x
	flat:function(){
		return promise( (resolve) => 
			this._resolver(	(inner_promise) => 
				inner_promise._resolver((val) => resolve(val))
			) 
		)
	},

The `tryFlat` function is almost the same:

	//m (m x) -> m x
	tryFlat:function(){
		return promise( (resolve) => 
			this._resolver(	(inner_promise) => { 
				if(inner_promise.constructor === promise){
					inner_promise._resolver((val) => resolve(val))
				}else{
					resolve(inner_promise)
				}
			}) 
		)
	},

The `run` function just feeds the resolver with a placeholder  function so our computation can
start executing.

	run:function(){
		return this._resolver(function(a){return a})
	}
	


Add aliases to map . flat as flatMap and map . tryFlat as phatMap
        methods.flatMap = helpers.flatMap
        methods.phatMap = helpers.phatMap

Add a print function, used for debugging.
        methods.print = helpers.print

In case you are interested, here is how the promise constructor is implemented

	const promise = function(resolve){
		if(typeof resolve !== "function"){ return methods.of(resolve) }
		const obj = Object.create(methods)

		obj._resolver = resolve
		obj.constructor = promise
		obj.prototype = methods
		Object.freeze(obj)
		return obj
	}


