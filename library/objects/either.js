module.exports = {
	//a -> m a
	pure:function(right){
		return {_right:right}
	},
	//m a -> ( a -> b ) -> m b
	map:function(val, funk){
		new_right = (val._right!==undefined)?funk(val._right):undefined
		return {_left:val._left, _right:new_right}
	},
	//m (m x) -> m x 
	join:function(val){
		var new_val
		if(val._right!==undefined){
			new_val = val._right
		}else{
			new_val = {_left:val._left}
		}
		return new_val
	}
}
