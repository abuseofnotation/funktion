var f = require("./f")


var helpers = require("./helpers")

var state_proto = helpers.add_missing_methods({

//As usual, the `of` function is trivial

	//a -> m a
	of:function(input){
		return state(input)
	},

//`map` is done by applying the function to the value and keeping the state unchanged.

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		return state(funk(this._value), this._state)
	},
	
//`flat` looks a little bit difficult, because we have to take care of an extra value,
//but it is actually nothing more than a function that turns:

	/*
	{
		_value:{
			_value:x,
			_state:s2
		}
		state:s1
	}
	
into:
	
	{
		_value:x,
		state: s1 => s2
	}
	
	*/

	//m (m x) -> m x
	flat:function(){
		console.log(this._value._state({}))
		return state(this._value._value, this._state.map(this._value._state))
	},
	tryFlat:function(){
		
		if(this._value.prototype === state_proto){
			
			return state(this._value._value, this._state.map(this._value._state))
		}else{
			return this	
		}
	},

//We have the `run` function which computes the state:

	run:function(){
		return this._state({})
	}
	
	
})

//In case you are interested, here is how the state constructor is implemented

	var state = function(value, state){
		var obj = Object.create(state_proto)
		obj._value = value
		obj._state = f(state, 1)
		obj.constructor = state
		obj.prototype = state_proto
		Object.freeze(obj)
		return obj
	}

state.write = f(function(key, val, state){ state[key] = val; return state;})
module.exports = state//--
