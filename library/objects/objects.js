var f = require("../core/core")
function create_type(methods){
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

	return methods;
}

module.exports = {
	state:create_type(require("./state")),
	maybe:create_type(require("./maybe")),
}
