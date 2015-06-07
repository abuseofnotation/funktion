/*---
category: tutorial
title: list 
layout: post
---

The `list` type, augments the standard JavaScript arrays, making them immutable and adding additional functionality to them

<!--more-->
*/
QUnit.module("List")//--



//To use the `list` monad constructor, you can require it using node:
		
		var list = require("../library/list")
		var f = require("../library/f")//--

//Where the `../` is the location of the module.

//Then you will be able to create a `list` from array like this
		var my_list = list([1,2,3])
//or like this:
		var my_list = list(1,2,3)

/*
map(funk)
----
Standard array method. Executes `funk` for each of the values in the list and wraps the result in a new list.

***
*/
QUnit.test("map", function(assert){//--
	var people = list( {name:"john", age:24, occupation:"farmer"}, {name:"charlie", age:22, occupation:"plumber"})
	var names = people.map((person) => person.name )
	assert.deepEqual(names, ["john", "charlie"])

})//--

/*
phatMap(funk)
----

Same as `map`, but if `funk` returns a list or an array it flattens the results into one array

***
*/

QUnit.test("flatMap", function(assert){//--
	
	var occupations = list([ 
		{occupation:"farmer", people:["john", "sam", "charlie"] },
		{occupation:"plumber", people:["lisa", "sandra"] },
	])
	
	var people = occupations.phatMap((occupation) => occupation.people)
	assert.deepEqual(people,["john", "sam", "charlie", "lisa", "sandra"])

})//--

