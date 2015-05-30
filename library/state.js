var f = require("./f")


var object = require("./object")

var state = object.create_constructor({
	//a -> m a
	of:function(input, state){
		this._value = input;
		this._state = state||function(a){return a}
		return this;
	},
	//m a -> ( a -> b ) -> m b
	map:function(funk){
		return this.of(funk(this._value), this._state)
	},
	
	run:function(){
		return this._state({})
	},
	
	
	//m (m x) -> m x
	/*
	
	{
		_value:{
			_value:x,
			_state:s2
		}
		state:s1
	}
	
	becomes:
	
	{
		_value:x,
		state: compose(s1,s2)
	}
	
	*/
	join:function(){
		if(Object.getPrototypeOf(this) !==Object.getPrototypeOf(this._value)){throw "Illegal join operation.\n"+JSON.stringify(this)+"\n is not the same as \n"+JSON.stringify(this._value)}
		return this.of(this._value._value, f.compose(this._state, this._value._state ))
	}
	
})

state.run = function(state){
	return state._state({})

}

let max = (a, b) => a > b ? a : b;

state.write = f.curry(function(key, val, state){ state[key] = val; return state;})

module.exports = state
