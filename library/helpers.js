

exports.create_constructor = function create_type(methods){
	//Replace the 'of' function with a one that returns a new object
	var of = methods.of
	methods.of = function(a,b,c,d){return of.apply(Object.create(methods), arguments)}
	
	methods = add_missing_methods(methods)
	
	return methods.of;
}

var add_missing_methods = exports.add_missing_methods = function(obj){
	//"chain" AKA "flatMap" is equivalent to map . join 
	
	if(!obj.flatMap && typeof obj.map ==="function" && typeof obj.flat ==="function"){
		obj.chain = obj.flatMap = function(funk){
			if(funk===undefined){throw "function not defined"}
			return this.map(funk).flat()}
	}
	/*
	"then" AKA "XXX" is the relaxed version of "flatMap" which acts on the object only if the types match
	"XXX" therefore can be used as both "map" and "flatMap", except in the cases when you specifically want to create a nested object.
	In these cases you can do so by simply using "map" expricitly.
	*/

	if(!obj.then && typeof obj.map ==="function" && typeof obj.tryFlat ==="function"){
		obj.then = obj.phatMap = function(funk){
			if(funk===undefined){throw "function not defined"}
			return this.map(funk).tryFlat()}
	}
	return obj
}
