module.exports = {
	//a -> m a
	pure:function(input){
		return {_value:input}
	},
	//m a -> ( a -> b ) -> m b
	map:function(val, funk){
		new_val = (val._value!==undefined)?funk(val._value):undefined
		return {_value:new_val}
	},
	//m (m x) -> m x
	join:function(val){
		var new_val
		if(val._value!==undefined){
			var new_val = val._value._value
		}
		return {_value:new_val}
	}
}
