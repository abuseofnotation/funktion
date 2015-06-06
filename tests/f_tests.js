/*
---
category: tutorial
title: function
layout: post
---

The function monad augments standard JavaScript functions with composition and currying.
<!--more-->

*/
QUnit.module("functions")//--


//To use the monad constructor, you can require it using node:
		
		var f = require("../library/f")
		var funktion = require("../library/funktion")

//Where the `../` is the location of the module.

//Then you will be able to construct functions line this
	
		var plus_1 = f( (num) => num+1 )


//After you do that, you will still be able to use `plus_1` like a normal function, but you can also do the following:


/*
Currying
----
When you call a function `f` with less arguments that it accepts, it returns a partially applied
(bound) version of itself that may at any time be called with the rest of the arguments.
*/

	QUnit.test("curry", function(assert){//--
		var add_3 = f(function(a,b,c){return a+b+c})
		
		var add_2 = add_3(0)
		assert.equal(typeof add_2, "function", "curried functions return other functions when the arguments are not enough")
		
		assert.equal(add_2(1)(1), 2, "when the arguments are enough a result is returned.")
	})//--

/*
map(funk)
----
creates a new function that calls the original function first, then calls `funk` with the result of the original function as an argument:
*/
	QUnit.test("map", function(assert){//--
		
//You can create a Function Monad by passing a normal JavaScript function to the constructor (you can write the function directly there):
		
		var plus_1 = f( (num) => num+1 )


//Then making another funxtion is easy:

		var plus_2 = plus_1.map(plus_1) 

		assert.equal(plus_2(0), 2, "New functions can be composed from other functions.")
		
		var plus_4 = plus_2.map(plus_2)

		assert.equal(plus_4(1), 5, "composed functions can be composed again.")

	})//--

/*
flatMap(funk)
----
A more powerful version of `map`. Accepts a funktion which returns another function. Returns a function which calls the original function first,
and then it
1. Calls `funk` with the result of the original function as an argument
2. Calls the function returned by `funk`, with the same argument and returns the result of the second call.
*/
	QUnit.test("flatMap", function(assert){//--

//You can use `flatMap` to model simple if-then statements. The following example uses it in combination of the currying functionality:
		
		var concat = f((str1, str2) => str1 + str2)
		var _parseInt = (num) => parseInt(num)
		var makeMessage = f(_parseInt).flatMap((num) => {console.log("num "+num); 
		return isNaN(num)? f("Invalid number") : concat("The number is ")} )
		
		assert.equal(makeMessage("1"), "The number is 1")
		assert.equal(makeMessage("2"), "The number is 2")
		assert.equal(makeMessage("Not a number"), "Invalid number")

/*

`flatMap` is similar to the `>>=` function in Haskell, which is the building block of the infamous `do` notation
It can be used to write programs without using assignment.	

For example if we have the following function in Haskell:

		addStuff = do  
			a <- (*2)  
			b <- (+10)  
			return (a+b)
		
		assert.equal(addStuff(3), 19)


When we desugar it, this becomes:

		addStuff = (*2) >>= \a ->
				(+10) >>= \b ->
					return (a+b)

or in JavaScript terms:

*/

		var addStuff = f( (num) => num * 2 ).flatMap( (a) =>
				  f( (num) => num + 10 ).flatMap( (b) =>
					f.of(a + b) ) )
		
		assert.equal(addStuff(3), 19)

	})//--
