var create_object = require("./object")

//Function constructor. Takes a function and adds some additional features to it, without extending the prototype

var id = function(a){return a}


var f = function f(funk, initial_arguments){
	funk = funk || id
	//do not do anything if the function takes one argument
	if(funk.length === 1){return extend(funk, f_methods)}

	//save context
	var context = this

	//construct curried function
	return extend( function(){  
		var all_arguments = (initial_arguments||[]).concat(Array.prototype.slice.call(arguments, 0))
		return all_arguments.length>=funk.length?funk.apply(context, all_arguments):f(funk, all_arguments)
	}, f_methods)
}


function extend(obj, methods){
	return Object.keys(methods).reduce(function(obj, method_name){obj[method_name] = methods[method_name]; return obj}, obj)
}

var f_methods = create_object.add_missing_methods({

	
	of:function(val){return function(){return val}},

	// (a -> b).map(b -> c) = a -> c

	map:function map(funk){
		var original_function = this
		return f(function(){
			return funk.call(this, original_function.apply(this, arguments))
		})
	},
	
	// (a -> b).map(b -> (b -> c)) 

	// (b -> (b -> c)).join() = a -> b

	join:function join (){
		var outer = this
		return f(function(arg){
			var inner = outer.apply(this, arguments)
			return inner.apply(this, arguments)

		})

	}
})

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

module.exports = f
