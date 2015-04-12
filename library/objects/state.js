var f = require("../core/core")
module.exports = {
	//a -> m a
	of:function(input, state){
		this._value = input;
		this._state = state||f.id;
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
		return this.of(this._value._value, f.compose(this._state, this._value._state ))
	}
	
}