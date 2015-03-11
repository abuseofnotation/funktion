---
layout: default
---

Installation
============

browser
------------

Import the `target/funktion.js` file in your project.

node or browserify
------------
Require the library and its extensions:

    var f = require("funktion")
    var m = require("funktion/monads/monads")

F (Core)
====
The stuff we cannot live without.

`f.curry(funk, [args])`
-----------------------------------
Creates a new function that is the same as `funk`, except that if called with less arguments that it expects it returns a partially applied (bound) function that may at any time be called with the rest of the arguments. 

	var plus = f.curry(function(num1, num2){return num1+num2})
	var plus_one = plus(1)
	plus_one(1)//2
	plus_one(5)//6

Optionally you can give an array of initial `args` that will be bound to the function you are creating (this is equivalent to passing the arguments to`function.prototype.bind`).

`f.compose(f_3, f_2, f_1)`
-----------------------------------
Creates a new function that calls `f_1` first, then it calls `f_2`  with the result of `f_1` as an argument etc.

	var plus_1 = function(num){return num+1}
	
	var log = function(a){
		console.log("The result is "+a);
	}
	var plus_2 = f.compose(plus_1, plus_1)
	var plus_2_and_log = f.compose(log, plus_2)
	plus_2_and_log(2)
	//"The result is 4"


`f.map(funk, object)`
----------------------
A curried version of `map`. Applies `funk` on each of the values, encapsulated inside an array or another kind of `object`. Relies on the `object`'s `map` method if it supports it.

    map_plus_one = f.map(plus_one)
    map_plus_one([1,2,3])//[2,3,4]

M (Monads)
====

`m.bind(funk, monad)`
----------------------
A curried version of `bind`. Applies `funk` on each of the values, encapsulated inside an monad. Relies on the `monad`'s `bind` method if it supports it.

`m.maybe(value)`
----------------------
Creates a **maybe** monad.

TBC