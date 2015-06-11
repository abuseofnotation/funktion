var helpers = require("./helpers")//--

/*
under the hood
--------------
Let's see how the type is implemented
*/
	var f_methods = helpers.add_missing_methods({//--

//the `of` method, takes a value and creates a function that returns it.
//this is very useful if you have a api which expects a function, but you want to feed it with a value (see the `flatmap` example). 

		//a.of(b) -> b a
		of: val => f( () => val ),

//`map` just wires the original function and the new one together:

		//(a -> b) => (b -> c) => a -> c
		map: function(funk){ 
			if(funk === undefined){throw new TypeError}
			return f( (...args) => funk( this(...args) ), this._length ) 
		},

//`flat` creates a function that: 
//1. Calls the original function with the supplied arguments
//2. Calls the resulting function (and it has to be one) with the same arguments

		//(b -> (b -> c)) => a -> b
		flat:function(){
			return f( (...args) => this(...args)(...args), this._length ) 
		},

//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap` 

		tryFlat:function(){
			return f( (...args) => {
				var result = this(...args)
				if(typeof result !== 'function'){
					return result
				}else{
					return result(...args)
				}
			}) 
		}

	})

	var id = function(a){return a}


//This is the function constructor. It takes a function and adds an augmented function object, without extending the prototype

	var f = (funk = id, length = funk.length, initial_arguments = []) => {

		//We expect a function. If we are given another value, lift it to a function
		if(typeof funk !== 'function'){
			return f().of(funk)
		
		//If the function takes just one argument, just extend it with methods and return it.
		}else if ( length < 2 ){
			return extend(funk, f_methods)

		//Else, return a curry-capable version of the function (again, extended with the function methods)
		}else{
			var extended_funk = extend( (...args) => {
				var all_arguments  = (initial_arguments).concat(args)	
				return all_arguments.length>=length?funk(...all_arguments):f(funk, length, all_arguments)
			}, f_methods)
			
			extended_funk._length = length - initial_arguments.length
			extended_funk._original = funk

			return extended_funk
		}
	}

//Here is the function with which the function object is extended

	function extend(obj, methods){
		return Object.keys(methods).reduce(function(obj, method_name){obj[method_name] = methods[method_name]; return obj}, obj)
	}

	
	f.of = val => f( () => val ),

//The library also features a standard compose function which allows you to map normal functions with one another

	f.compose = function(){

		//Convert functions to an array and flip them (for right-to-left execution)
		var functions = Array.prototype.slice.call(arguments).reverse()
		//Check if input is OK:
		functions.forEach(function(funk){if(typeof funk !== "function"){throw new TypeError(funk+" is not a function" )}})
		//Return the function which composes them
		return function(){
			//Take the initial input
			var input = arguments
			var context
			return functions.reduce(function(return_result, funk, i){ 
				//If this is the first iteration, apply the arguments that the user provided
				//else use the return result from the previous function
				return (i ===0?funk.apply(context, input): funk(return_result))
				//return (i ===0?funk.apply(context, input): funk.apply(context, [return_result]))
			}, undefined)
		}
	}


	module.exports = f//--
