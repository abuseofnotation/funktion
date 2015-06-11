
var f = require("./f")


var helpers = require("./helpers")

var state_proto = helpers.add_missing_methods({

//As usual, the `of` function is trivial

	//a -> m a
	of:function(input){
		return state((prevState) => [input, prevState])
	},

//`map` is done by applying the function to the value and keeping the state unchanged.

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		return state( this._state.map(([input, prevState]) => [funk(input), prevState]))
	},
	
//`flat` looks a little bit difficult, because we have to take care of an extra value,

	//m (m x) -> m x
	flat:function(){
		return  this._state({})[0]
	},
	tryFlat:function(){
		return  this._state({})[0]
	},

//We have the `run` function which computes the state:

	run:function(){
		return this._state({})[0]
	},
	get:function(){
		return this._state({})[1]({})
	}
	
	
})

//In case you are interested, here is how the state constructor is implemented

	var state = function(state){
		var obj = Object.create(state_proto)
		obj._state = f(state, 1)
		obj.constructor = state
		obj.prototype = state_proto
		Object.freeze(obj)
		return obj
	}

state.write = f(function(key, val, state){ state[key] = val; return state;})
module.exports = state//--
