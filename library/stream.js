var helpers = require("./helpers")//--
var methods = {//--

//The `of` method takes a value and wraps it in a stream, by immediately calling the pusher function with it.

	//a -> m a
	of:function(val){
		return stream( (push) => push(val) )
	},

//The `map` method creates a new stream, such that every time the old stream receives a value, it
//applies `funk` to it and then pushes it to the new stream.

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		return stream( (push) => this._pusher( (val) => push( funk(val) ) ) )

	},


//In this case the implementation of `flat` is quite simple.

//Effectively all we have to do is return the same value with which the inner stream is pushd with.
//To do this, we unwrap our stream once to get the inner stream value, and then unwrap the inner
//stream itself to get its value.

	//m (m x) -> m x
	flat:function(){
		return stream( (push) => 
			this._pusher(	(inner_stream) => 
				inner_stream._pusher((val) => push(val))
			) 
		)
	},

//The `tryFlat` function is almost the same:

	//m (m x) -> m x
	tryFlat:function(){
		return stream( (push) => 
			this._pusher(	(inner_stream) => { 
				if(inner_stream.constructor === stream){
					inner_stream._pusher((val) => push(val))
				}else{
					push(inner_stream)
				}
			}) 
		)
	},

//The `run` function just feeds the pusher with a placeholder  function so our computation can
//start executing.

	run:function(){
		return this._pusher(function(a){return a})
	},
	
//After these are done, all we need to do is implement the traditional JS array functions

//`ForEach` is almost the same as `map`, except we don't push `funk(val)` - the result of the transformation
//to the new stream, but we push `val` instead.

	forEach:function(funk){
		return stream( (push) => this._pusher( (val) => { 
			push(val) 
			funk(val)
		} ) )
	},

//With filter the result of `funk(val)` shows us whether we need to push the value

	filter:function(funk){
		return stream( (push) => this._pusher( (val) => { 
			if(funk(val)){push(val)}
		} ) )
	},

	reduce:function(funk, from){
		let accumulator = from
		this._pusher(val => {
			accumulator = funk(accumulator, val) 
		})
	},
}//--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
        methods.flatMap = helpers.flatMap
        methods.phatMap = helpers.phatMap

//Add a print function, used for debugging.
        methods.print = helpers.print

//In case you are interested, here is how the stream constructor is implemented

	const stream = function(push){
		if(typeof push !== "function"){ return methods.of(push) }
		const obj = Object.create(methods)

		obj._pusher = push
		obj.constructor = stream
		obj.prototype = methods
		Object.freeze(obj)
		return obj
	}

module.exports = stream
