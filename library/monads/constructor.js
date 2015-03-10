var c = require("../compose")
module.exports = function(methods){

	return function(a,b,c,d){return add_methods(methods.pure.apply(this, arguments))}

	function add_methods(monad){
		monad.map = c(add_methods, methods.map.bind(null, monad))
		monad.join = c(add_methods, methods.join.bind(null, monad))
		//monad.chain = monad.bind = c(add_methods, methods.join, methods.map.bind(null, monad))
		monad.chain = monad.bind = function(funk){if(funk===undefined){throw "function not defined"}; return monad.map(funk).join()}

		return monad;
	}
}