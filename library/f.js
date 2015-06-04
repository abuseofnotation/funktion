	var helpers = require("./helpers")//--

/*
Under the Hood
--------------
Let's see how the methods are implemented
*/
	var f_methods = helpers.add_missing_methods({//--

//The of method, takes a value and creates a function that returns it.
//This is very useful if you have a API which expects a function, but you want to feed it with a value (see the `flatMap` example). 

		//a.of(b) -> b a
		of: val => f( () => val ),

//`map` just wires the original function and the new one together:

		//(a -> b).map(b -> c) = a -> c
		map: function(funk){ 
			return f( (...args) => funk( this(...args) ) ) 
		},

//`flat` does the same thing, but two times

		//(b -> (b -> c)).join() = a -> b
		flat:function(){
			return f( (...args) => this(...args)(...args) ) 
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

	var f = (funk = id, initial_arguments) => {
		
		//We expect a function. If we are given another value, lift it to a function
		if(typeof funk !== 'function'){
			return f().of(funk)
		
		//If the function takes just one argument, just extend it with methods and return it.
		}else if(funk.length < 2 || initial_arguments === false){
			return extend(funk, f_methods)

		//Else, return a curry-capable version of the function (again, extended with the function methods)
		}else{
			return extend( (...args) => {
				var all_arguments  = (initial_arguments||[]).concat(args)	
				return all_arguments.length>=funk.length?funk(...all_arguments):f(funk, all_arguments)
			}, f_methods)
		
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
