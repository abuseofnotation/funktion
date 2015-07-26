

var helpers = require("./helpers")//--

var methods = {//--

//the `of` method, takes a value and puts it in a list.

		//a.of(b) -> b a
		of: val => list(val),

//`map` applies a function to each element of the list, as the one from the Array prototype
		
//`flat` takes a list of lists and flattens them with one level 

		//(b -> (b -> c)).join() = a -> b
		flat:function(){
			return list( this.reduce((list, element) => [...list, ...element], []) )
		},
		
//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`
//and with it, your funk can return both a list of objects and a single object

		tryFlat:function(){
			return list( this.reduce((list, element) => 
				element !== undefined && element.constructor === Array? [...list, ...element] : [...list, element] , [])
			)
		},
		funktionType:"list"//--

	}//--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
        methods.flatMap = helpers.flatMap
        methods.phatMap = helpers.phatMap

//Add a print function, used for debugging.
        methods.print = helpers.print


//Add support for array extras, so that they return a list instead of normal Array

var arrayMethods = {}

//Some functions are directly lifted from the Array prototype

var immutableFunctions = ['map', 'concat']

immutableFunctions.forEach((funk) => { 
	arrayMethods[funk] = function(...args){
			return list(Array.prototype[funk].apply(this, args))
	}
})

//The type also wraps some Array functions in a way that makes them immutable

var mutableFunctions = ['splice', 'reverse', 'sort']

mutableFunctions.forEach((funk) => { 
	arrayMethods[funk] = function(...args){
			var newArray = this.slice(0)
			Array.prototype[funk].apply(newArray, args)
			return newArray
	}
})

extend(methods, arrayMethods)

methods.extras = []

//This is the list constructor. It takes normal array and augments it with the above methods
	
	var list = (...args) => {
		if(args.length === 1 && args[0] !== undefined && args[0].funktionType === "list"){
			return args[0]
		//Accept an array
		}else if(args.length === 1 && args[0] !== undefined && args[0].constructor === Array ){
			return  Object.freeze(extend(args[0], methods))
		//Accept several arguments
		}else{
			return Object.freeze(extend(args, methods))
		}
	}

//Here is the function with which the list object is extended
	function extend(obj, methods){
		return Object.keys(methods).reduce(function(obj, method_name){obj[method_name] = methods[method_name]; return obj}, obj)
	}
module.exports = list//--
