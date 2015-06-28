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

// In most cases you will be creating promises using helper functions like:

	const getUrl = (url) => promise( (resolve) => {
	  const rq = new XMLHttpRequest()
  	  rq.onload = () => resolve(JSON.parse(rq.responseText))
	  rq.open("GET",url,true);
	  rq.send();
	})
/*
`run()`
----
Executes the promise and fetches the data.

***
For example to make a promise and run it immediately do:
*/
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

/*
//Note that we will be using the data from these two files in the next examples. 

`map(funk)`
----
Returns a new promise, which applies `funk` to the data when you run it.

***
The function can be used both for manipulating the data you fetch and for running side effects  
*/

QUnit.test("map", function(assert){//--
	const stop = assert.async()//--
	getUrl("people.json")
	  
	  //Using "map" for manipulating data
	  .map((people) => people.map((person) => person.name))

	  //Using "map" for triggering side effects 
	  .map(names => {
	    assert.deepEqual(names, ['john', 'jen'])
	    stop()//--
	  }).run()
})//--


/*
`phatMap(funk)`
----
A more powerful version of `map` which can allows you to chain several steps of the asychronous computations together.
Known as `then` for traditional promise libraries.

***
*/

QUnit.test("phatMap", function(assert){//--
	const done = assert.async()//--	

//For example here is a function which retrieves a person's occupation from the `people.json` file
//and then retrieves the occupation's description from `occupations.json`. 

	const getOccupationDescription = (name) => getUrl("people.json")

	  //Retrieve person data
	  .phatMap((people) => people.filter( person => person.name === name )[0])

	  //Retrieve its occupation
	  .phatMap( (person) => getUrl("occupations.json")
	    .map(occupations => occupations[person.occupation]) )

//Here is how the function is used:

	getOccupationDescription("john").map((desc) => { 
		assert.equal(desc, "writes code") 
		done()//--
	}).run()
	

})//--

/*
under the hood
--------------
Let's see how the type is implemented
*/
