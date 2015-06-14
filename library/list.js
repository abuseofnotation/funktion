

var helpers = require("./helpers")//--

var list_methods = helpers.add_missing_methods({//--

//the `of` method, takes a value and puts it in a list.

		//a.of(b) -> b a
		of: val => list(val),

//`map` applies a function to each element of the list 
		map:function(funk){
			return list(Array.prototype.map.call(this, funk))
		},
		
//`flat` takes a list of lists and flattens them with one level 

		//(b -> (b -> c)).join() = a -> b
		flat:function(){
			return list( this.reduce((list, element) => [...list, ...element], []) )
		},
		
//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`
//and with it, your funk can return both a list of objects and a single object

		tryFlat:function(){
			return list( this.reduce((list, element) => 
				element.constructor === Array? [...list, ...element] : [...list, element] , [])
			)
		}

	})

//This is the list constructor. It takes normal array and augments it with the above methods

	var list = (...args) => {
		//Accept an array
		if(args.length === 1 && args[0].constructor === Array ){
			return  Object.freeze(extend(args[0], list_methods))
		//Accept several arguments
		}else{
			return Object.freeze(extend(args, list_methods))
		}
	}

//Here is the function with which the list object is extended

	function extend(obj, methods){
		return Object.keys(methods).reduce(function(obj, method_name){obj[method_name] = methods[method_name]; return obj}, obj)
	}
module.exports = list//--
