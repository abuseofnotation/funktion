var add_missing_methods = exports.add_missing_methods = function(obj){
	//"chain" AKA "flatMap" is equivalent to map . join 
	
	obj.chain = obj.flatMap = function flatMap(funk) {
		if(funk===undefined){throw "function not defined"}
		return this.map(funk).flat()
	}

	/*
	"then" AKA "phatMap" is the relaxed version of "flatMap" which acts on the object only if the types match
	"phatMap" therefore can be used as both "map" and "flatMap", except in the cases when you specifically want to create a nested object.
	In these cases you can do so by simply using "map" expricitly.
	*/

	obj.then = obj.phatMap = function phatMap(funk){
		if(funk===undefined){throw "function not defined"}
		return this.map(funk).tryFlat()
	},

	obj.phatMap2 = function phatMap2(funk) {
		if(funk===undefined){throw "function not defined"}
		this.phatMap((inner) => {
			if(typeof inner.phatMap !== 'function'){throw "Inner object does not have 'phatMap'"}
			inner.phatMap(funk)
		})
	},
	
	obj.print = function(){
		console.log(this.toString())
		return this
	}

	return obj
}
