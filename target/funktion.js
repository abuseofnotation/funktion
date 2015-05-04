(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.compose = function(){

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

exports.curry = function curry(funk, initial_arguments){
	var context = this
	return function(){  
		var all_arguments = (initial_arguments||[]).concat(Array.prototype.slice.call(arguments, 0))
		return all_arguments.length>=funk.length?funk.apply(context, all_arguments):curry(funk, all_arguments)
	}
}

},{}],2:[function(require,module,exports){
var m = require("./m")
var f = require("./f")
var may = require("./may")
var st = require("./st")
module.exports = {
	m:m,
	f:f,
	may:may,
	st:st
}


window.f = f
window.m = m
window.may = may
window.st = st 

},{"./f":1,"./m":3,"./may":4,"./st":5}],3:[function(require,module,exports){
var f = require("./f")

var bind = exports.bind = f.curry(function(funk, monad){
		if(typeof funk!=="function"){throw funk+" is not a function"}
		if(typeof monad.bind!=="function"){throw monad+" is not a monad"}
		return monad.bind(funk)
})

var map = exports.map = f.curry(function(funk, monad){
		if(typeof funk!=="function"){throw funk+" is not a function"}
		if(typeof monad.map!=="function"){throw monad+" is not a monad"}
		return monad.map(funk)
}) 

exports.then_compose = function(){
	var args = Array.prototype.map.call(arguments, function(funk){ return bind(funk)})
	return f.compose.apply(this, args) 

}

exports.make = function create_type(methods){
	//Replace the 'of' function with a one that returns a new object
	var of = methods.of
	methods.of = function(a,b,c,d){return of.apply(Object.create(methods), arguments)}
	
	//"chain" AKA "bind" is equivalent to map . join 
	if(!methods.bind && typeof methods.map ==="function" && typeof methods.join ==="function"){
		methods.chain = methods.bind = function(funk){if(funk===undefined){throw "function not defined"}; return this.map(funk).join()}

	//'map' is equivalent of bind . of
	}else if(!methods.map && typeof methods.bind ==="function"){
		methods.map = function(funk){return this.bind()}
	}

	return methods.of;
}

},{"./f":1}],4:[function(require,module,exports){
monads = require("./m")

maybe = monads.make({
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

},{"./m":3}],5:[function(require,module,exports){
var monads = require("./m")
var f = require("./f")

var state = monads.make({
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

state.write = f.curry(function(key, val, state){ state[key] = val; return state;})

module.exports = state

},{"./f":1,"./m":3}]},{},[1,2,3,4,5])


//# sourceMappingURL=funktion.map