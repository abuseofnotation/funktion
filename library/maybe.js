var helpers = require("./helpers")//--
var maybe_proto = helpers.add_missing_methods({//--

//The `of` method, takes a value and wraps it in a `maybe`.
//In this case we do this by just calling the constructor.

	//a -> m a
	of:function(input){
		return maybe(input)
	},

//`map` takes the function and applies it to the value in the maybe, if there is one.

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		if(this !== nothing){
			return maybe(funk(this._value))
		}else{	
			return this 
		}
	},

//`flat` takes a maybe that contains another maybe and flattens it.
//In this case this means just returning the inner value.

	//m (m x) -> m x
	flat:function(){
		if(this !== nothing){
			return this._value
		}else{
			return this
		}
	},

//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap` 

	tryFlat:function(){
		if(this !== nothing && this._value.constructor === maybe){
			return this._value
		}else{
			return this
		}
	},
	
	funktionType:"maybe",//--

//Finally, the type has some helper functions:

	filter:function(funk){
		return funk(this._value) ? this : nothing
	},

	reduce:function(funk){
		return funk(this._value)
	},

	get:function(prop){
		return maybe(this._value[prop])
	}


	
})//--

//In case you are interested, here is how the maybe constructor is implemented


	var maybe = function(value){
		if (value === undefined){
			return nothing
		}else{
			var obj = Object.create(maybe_proto)
			obj._value = value
			obj.constructor = maybe
			Object.freeze(obj)
			return obj
		}
	}

var nothing = Object.create(maybe_proto)//--
nothing.constructor = maybe//--
Object.freeze(nothing)//--
maybe.nothing = nothing//--

module.exports = maybe//--
