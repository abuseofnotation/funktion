module.exports = {
	//a -> m a
	of:function(input){
		this._value = input;
		return this;
	},
	//m a -> ( a -> b ) -> m b
	map:function(funk){
		return this.of((!(this._value instanceof Error))?funk(this._value):this._value)
	},
	//m (m x) -> m x
	join:function(){
		if(!(this._value instanceof Error)){
			if(Object.getPrototypeOf(this) !==Object.getPrototypeOf(this._value)){throw "Illegal join operation."}
			return this.of(this._value._value)
		}
		return this.of(this._value)
	}
	
	//
	
}
