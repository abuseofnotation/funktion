/*
---
category: tutorial
title: Function Monad
layout: post
---
*/

var f = require("../library/f")

QUnit.module("functions")

QUnit.test("map", function(assert){
	
	var plus_1 = f( (num) => num+1 )

	var times_2 = f( (num) => num*2 )

	var plus_2 = plus_1.map(plus_1) 

	var plus_4 = plus_2.map(plus_2)
	
	assert.equal(plus_2(0), 2, "functions can be composed from other functions.")
	assert.equal(plus_4(1), 5, "composed functions can be composed again.")

})


QUnit.test("flatMap", function(assert){

	/*

	//The function must do the following (in Haskell terms)

	addStuff = do  
		a <- (*2)  
		b <- (+10)  
		return (a+b)
	addStuff 3 //19

	//When we desugar it, this becomes:

	addStuff = (*2) >>= \a ->
			(+10) >>= \b ->
				return (a+b)

	or...

	*/

	var addStuff = f( (num) => num * 2 ).flatMap( (a) =>
		          f( (num) => num + 10 ).flatMap( (b) =>
		        	f.of(a + b) ) )
	
	assert.equal(addStuff(3), 19)

})

 QUnit.test("then", function(assert){
 	assert.expect(0)

 	f().then(function(input){
 		console.log(input)
 		return 5
 	})

 	.then(function(input){
 		console.log(input)
 		return function(input){
 			console.log(input)
 			return input +1
 		}		
 	})(4)

 })

QUnit.test("curry", function(assert){
	var add_3 = f(function(a,b,c){return a+b+c})
	var add_2 = add_3(0)
	assert.equal(typeof add_2, "function", "curried functions return other functions when the arguments are not enough")
	assert.equal(add_2(1)(1), 2, "when the arguments are enough a result is returned.")
	
})
