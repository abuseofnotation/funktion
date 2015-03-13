(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(){

	//Convert functions to an array and flip them (for right-to-left execution)
	var functions = Array.prototype.slice.call(arguments).reverse()
	//Check if input is OK:
	functions.forEach(function(funk){if(typeof funk !== "function"){throw new TypeError(funk+" is not a function" )}})
	//Return the function which composes them
	return function(){
		//Take the initial input
		var input = arguments
		var context
		return functions.reduce(function(return_result, funk, i){ 
			//If this is the first iteration, apply the arguments that the user provided
			//else use the return result from the previous function
			return (i ===0?funk.apply(context, input): funk(return_result))
			//return (i ===0?funk.apply(context, input): funk.apply(context, [return_result]))
		}, undefined)
	}
}
},{}],2:[function(require,module,exports){
module.exports = {
	compose:require("./compose"),
	curry:require("./curry"),
	map:require("./map"),
	log:function(a){console.log(a);return a;}
}

},{"./compose":1,"./curry":3,"./map":4}],3:[function(require,module,exports){
module.exports = function curry(funk, initial_arguments){
	var context = this
	return function(){  
		var all_arguments = (initial_arguments||[]).concat(Array.prototype.slice.call(arguments, 0))
		return all_arguments.length>=funk.length?funk.apply(context, all_arguments):curry(funk, all_arguments)
	}
}
},{}],4:[function(require,module,exports){
var curry = require("./curry")
module.exports = curry(function(funk, monad){
		if(typeof funk!=="function"){throw funk+" is not a function"}
		if(typeof monad.map!=="function"){throw monad+" is not a monad"}
		return monad.map(funk)
}) 
},{"./curry":3}],5:[function(require,module,exports){
var monads = require("./monads/monads")
var core = require("./core/core")
var objects = require("./objects/objects")
module.exports = {
	m:monads,
	f:core,
	o:objects
}


window.f = core
window.m = monads
window.o = objects
},{"./core/core":2,"./monads/monads":8,"./objects/objects":11}],6:[function(require,module,exports){
var f = require("../core/core")
module.exports = f.curry(function(funk, monad){
		if(typeof funk!=="function"){throw funk+" is not a function"}
		if(typeof monad.bind!=="function"){throw monad+" is not a monad"}
		return monad.bind(funk)
})
},{"../core/core":2}],7:[function(require,module,exports){
var f = require("../core/core")
var bind = require("./bind.js")

module.exports = function(){
	var args = Array.prototype.map.call(arguments, function(funk){ return bind(funk)})
	return f.compose.apply(this, args) 

}
},{"../core/core":2,"./bind.js":6}],8:[function(require,module,exports){
module.exports = {
	bind:(require("./bind")),
	compose:(require("./compose"))
}
window.m = module.exports

},{"./bind":6,"./compose":7}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
var f = require("../core/core")
function create_type(methods){

	return function(a,b,c,d){return add_methods(methods.pure.apply(this, arguments))}

	function add_methods(monad){
		monad.map = f.compose(add_methods, methods.map.bind(null, monad))
		monad.join = f.compose(add_methods, methods.join.bind(null, monad))
		//monad.chain = monad.bind = c(add_methods, methods.join, methods.map.bind(null, monad))
		monad.chain = monad.bind = function(funk){if(funk===undefined){throw "function not defined"}; return monad.map(funk).join()}

		return monad;
	}
	
}

module.exports = {
	either:create_type(require("./either")),
	maybe:create_type(require("./maybe")),
}

},{"../core/core":2,"./either":9,"./maybe":10}]},{},[1,2,3,4,5,6,7,8,9,10,11])


//# sourceMappingURL=funktion.map