var helpers = require("./helpers")//--
var methods = {//--

//The `of` method takes a value and wraps it in a promise, by immediately calling the resolver function with it.

	//a -> m a
	of:function(val){
		return promise( (resolve) => resolve(val) )
	},

//The `map` method creates a new promise, such that when the old promise is resolved, it takes its result, 
//applies `funk` to it and then resolves itself with the value.

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		return promise( (resolve) => this._resolver( (val) => resolve( funk(val) ) ) )

	},

//In this case the implementation of `flat` is quite simple.

//Effectively all we have to do is return the same value with which the inner promise is resolved with.
//To do this, we unwrap our promise once to get the inner promise value, and then unwrap the inner
//promise itself to get its value.

	//m (m x) -> m x
	flat:function(){
		return promise( (resolve) => 
			this._resolver(	(inner_promise) => 
				inner_promise._resolver((val) => resolve(val))
			) 
		)
	},

//The `tryFlat` function is almost the same:

	//m (m x) -> m x
	tryFlat:function(){
		return promise( (resolve) => 
			this._resolver(	(inner_promise) => { 
				if(inner_promise.constructor === promise){
					inner_promise._resolver((val) => resolve(val))
				}else{
					resolve(inner_promise)
				}
			}) 
		)
	},

//The `run` function just feeds the resolver with a placeholder  function so our computation can
//start executing.

	run:function(){
		return this._resolver(function(a){return a})
	}
	
    }//--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
        methods.flatMap = helpers.flatMap
        methods.phatMap = helpers.phatMap

//Add a print function, used for debugging.
        methods.print = helpers.print

//In case you are interested, here is how the promise constructor is implemented

	const promise = function(resolve){
		if(typeof resolve !== "function"){ return methods.of(resolve) }
		const obj = Object.create(methods)

		obj._resolver = resolve
		obj.constructor = promise
		obj.prototype = methods
		Object.freeze(obj)
		return obj
	}

module.exports = promise//--
