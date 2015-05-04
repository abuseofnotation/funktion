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
