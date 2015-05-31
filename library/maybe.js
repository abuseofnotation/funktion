var create_object = require("./helpers")

var maybe = create_object.create_constructor({
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
			if(Object.getPrototypeOf(this) !==Object.getPrototypeOf(this._value)){throw "Illegal join operation.\n"+JSON.stringify(this)+"\n is not the same as \n"+JSON.stringify(this._value)}
			return this.of(this._value._value)
		}
		return this.of(this._value)
	}
	
	//
	
})

maybe.from_null = function(val){
	if(val===null||val===undefined){
		return maybe(new Error("The value is "+val))
	}else{
		return maybe(val)
	}
}

module.exports = maybe
