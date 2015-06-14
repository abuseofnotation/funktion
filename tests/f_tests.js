/*---
category: tutorial
title: function
layout: post
---

The function monad augments standard JavaScript functions with facilities for composition and currying.
<!--more-->

*/
QUnit.module("functions")//--


//To use the monad constructor, you can require it using node:
		
		var f = require("../library/f")

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
		const add3 = f( (a,b,c) => a+b+c )
		
		const add2 = add3(0)
		assert.equal( add2(1, 1), 2 )
		assert.equal( add2(5, 5), 10 )

		const plus10 = add2(10)
		assert.equal( plus10(5), 15 )
		assert.equal( plus10(10), 20 )


	})//--

/*
`of(value)`
----
If called with a value as an argument, it constructs a function that always returns that value.
If called without arguments it returns a function that always returns the arguments given to it.
*/
	QUnit.test("of", function(assert){//--
		const returns9 = f().of(9)
		assert.equal( returns9(3), 9 )
		assert.equal( returns9("a"), 9 )

		const id = f().of()
		assert.equal( id(3), 3 )
		assert.equal( id("a"), "a" )

	})//--
/*
`map(funk)`
----
Creates a new function that calls the original function first, then calls `funk` with the result of the original function as an argument:
*/
	QUnit.test("map", function(assert){//--
		
//You can create a Function Monad by passing a normal JavaScript function to the constructor (you can write the function directly there):
		
		var plus1 = f( num => num+1 )


//Then making another function is easy:

		var plus2 = plus1.map(plus1) 

		assert.equal( plus2(0), 2 )
		
		var plus4 = plus2.map(plus2)

		assert.equal( plus4(1), 5 )

	})//--

/*

`phatMap(funk)`
----
Same as `map` except that if `funk` returns another function it returns a third function which:
1. Calls the original function first.
2. Calls `funk` with the result of the original function as an argument
3. Calls the function returned by `funk` with the same argument and returns the result of the second call.
*/
	QUnit.test("phatMap", function(assert){//--

//You can use `phatMap` to model simple if-then statements. The following example uses it in combination of the currying functionality:
		
		var concat = f( (str1, str2) => str1 + str2)

		var makeMessage = f(parseInt, 1)
			.flatMap((num) => isNaN(num)? f("Error. Not a number") : concat("The number is ") )
		
		assert.equal(makeMessage("1"), "The number is 1")
		assert.equal(makeMessage("2"), "The number is 2")
		assert.equal(makeMessage("Y"), "Error. Not a number")

/*

`phatMap` is similar to the `>>=` function in Haskell, which is the building block of the infamous `do` notation
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

		var addStuff = f( num => num * 2 )
			.flatMap( a => f( num => num + 10 )
				.flatMap( b => f.of(a + b) ) 
			)
		
		assert.equal(addStuff(3), 19)

	})//--

/*
under the hood
--------------
Let's see how the type is implemented
*/

