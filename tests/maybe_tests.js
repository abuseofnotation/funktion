/*---
category: tutorial
title: maybe
layout: post
---

The `maybe` type, also known as `option` type is a container for a value that may not be there. 

The purpose of this monad is to eliminate the need for writing `null` checks. 
Furthermore it also eliminates the possibility of making errors by missing null-checks.

<!--more-->
*/

var identity = require("../library/identity")//--
var f = require("../library/f")//--
var list = require("../library/list")//--
var state = require("../library/state")//--


//To use the `maybe` monad constructor, you can require it using node:
		
    var maybe = require("../library/maybe")

//Where the `../` is the location of the module.

//Then you will be able to wrap a value in `maybe` with:
    var val = 4//--
    var maybe_val = maybe(val)

//If the 'val' is equal to *undefined* it threats the container as empty.


//You can also combine a `maybe` with an existing monad, using the `maybeT` constructor:

    var maybeT = require("../library/maybeT")
    const maybeList = maybeT(list(1,2,3))


var test = (maybe)=>{//--
/*
Basic Methods
---

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
Helpers
----

`getProp(propName)`
----
Assuming the value inside the `maybe` is an object, this method safely retrieves one of the object's properties.
*/



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

}//--
QUnit.module("Maybe")//--
test(maybe)//--
QUnit.module("MaybeT")//--
test((val)=>maybeT(identity(val)))//--

    
/*
Combining with Other Monads
----
in addition to creating a `maybe` from a plain value, you can also create one from an existing monad, using the `maybet` constructor:

the resulting monad will gain all the characteristics of a `maybe` without losing the characteristics of the underlying monad.

***
*/

QUnit.test("basic", function(assert){//--
    
//Combining a maybe with a list, for example, creates a list where each of the values are `maybe`s
//In the following example `map` will get called only for the first value:

    maybeT(list(1, undefined)).map((val)=>{
        assert.equal(val, 1)   
    })

})//--

QUnit.test("list", function(assert){//--
//This means you can use maybe to safely transform the list items.
//If a list value is undefined, it will just stay undefined.

    maybeT(list({first:{ second:"value" } }, {first:{ second:"other value" } }, { first:""} ))
        .phatMap((val)=> maybeT(val.first) )
        .phatMap((val)=> maybeT(val.second) )
        .lift(list => {
                assert.deepEqual(list, ["value", "other value", undefined])
        })
})//--


/*
`lift(funk)`
----
In addition to all other methods, `maybe` values, that are created from other monads using the `maybeT` constructor
have the `lift` method which enables you to execute a function to the underlying monad:

***
*/

QUnit.test("lift", function(assert){//--
    const maybeList = maybeT(list(["a","b","c"]))
    
    maybeList.lift((list) =>{
        assert.deepEqual(list, ["a", "b", "c"])
    })

//You can also use `lift` to call a method that is defined in the monad, by specifying the method name as a string

    maybeList
        .lift("concat", ["d"])
        .lift("reverse")
        .lift((list) => {
            assert.deepEqual(list, ["d", "c", "b", "a"])
        })

})//--





/*
Under the Hood
--------------
Let's see how the type is implemented
*/


