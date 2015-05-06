var f = require("./f")

var bind = exports.bind = f(function(funk, monad){
		if(typeof funk!=="function"){throw funk+" is not a function"}
		if(typeof monad.bind!=="function"){throw monad+" is not a monad"}
		return monad.bind(funk)
})

var map = exports.map = f(function(funk, monad){
		if(typeof funk!=="function"){throw funk+" is not a function"}
		if(typeof monad.map!=="function"){throw monad+" is not a monad"}
		return monad.map(funk)
}) 

exports.then_compose = function(){
	var args = Array.prototype.map.call(arguments, function(funk){ return bind(funk)})
	return f.compose.apply(this, args) 
}
 
