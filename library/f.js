var helpers = require("./helpers")


var f_methods = helpers.add_missing_methods({

	// a.of(b) -> b a
	of: val => f( () => val ),


	// (a -> b).map(b -> c) = a -> c
	map: function(funk){ 
		return f( (...args) => funk( this(...args) ) ) 
	},
	
	
	// (b -> (b -> c)).join() = a -> b
	flat:function(){
		return f( (...args) => this(...args)(...args) ) 
	},

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


//Function constructor. Takes a function and adds some additional features to it, without extending the prototype
var f = (funk = id, initial_arguments) => {
	
	//We expect a function. If we are given another value, lift it to a function
	if(typeof funk !== 'function'){
		return f().of(funk)
	
	//If the function takes just one argument, just extend it with methods and return it.
	}else if(funk.length < 2){
		return extend(funk, f_methods)

	//Else, return a curry-capable version of the function (again, extended with the function methods)
	}else{
		return extend( (...args) => {
			var all_arguments  = (initial_arguments||[]).concat(args)	
			return all_arguments.length>=funk.length?funk(...all_arguments):f(funk, all_arguments)
		}, f_methods)
	
	}
}


f.of = function(val){return function(){return val}},

f.curry = function curry(funk, initial_arguments){

	//do not do anything if the function takes one argument
	if(funk.length === 1){return funk}

	//save context
	var context = this

	//construct curried function
	return function(){  
		var all_arguments = (initial_arguments||[]).concat(Array.prototype.slice.call(arguments, 0))
		return all_arguments.length>=funk.length?funk.apply(context, all_arguments):curry(funk, all_arguments)
	}
}


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


function extend(obj, methods){
	return Object.keys(methods).reduce(function(obj, method_name){obj[method_name] = methods[method_name]; return obj}, obj)
}
module.exports = f
