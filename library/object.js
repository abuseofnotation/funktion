

exports.create_constructor = function create_type(methods){
	//Replace the 'of' function with a one that returns a new object
	var of = methods.of
	methods.of = function(a,b,c,d){return of.apply(Object.create(methods), arguments)}
	
	methods = add_missing_methods(methods)
	
	return methods.of;
}

var add_missing_methods = exports.add_missing_methods = function(obj){
	//"chain" AKA "bind" is equivalent to map . join 
	if(!obj.bind && typeof obj.map ==="function" && typeof obj.join ==="function"){
		obj.chain = obj.bind = function(funk){if(funk===undefined){throw "function not defined"}; return this.map(funk).join()}

	//'map' is equivalent of bind . of
	}else if(!obj.map && typeof obj.bind ==="function"){
		obj.map = function(funk){return this.bind(this.of(this))}
	}
	return obj
}
