var helpers = require("./helpers")//--
var methods = {//--

//The `of` method, takes a value and wraps it in a `maybe`.
//In this case we do this by just calling the constructor.

	//a -> m a
	of:function(input){
		return maybe(input)
	},

//`map` takes the function and applies it to the value in the maybe, if there is one.

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		if(this !== nothing){
			return maybe(funk(this._value))
		}else{	
			return this 
		}
	},

//`flat` takes a maybe that contains another maybe and flattens it.
//In this case this means just returning the inner value.

	//m (m x) -> m x
	flat:function(){
		if(this !== nothing){
			return this._value
		}else{
			return this
		}
	},

//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap` 

	tryFlat:function(){
		if(this !== nothing && this._value.funktionType === "maybe"){
			return this._value
		}else{
			return this
		}
	},
	
	funktionType:"maybe",//--

//Finally, the type has some helper functions:

	filter:function filter (funk){
		return funk(this._value) ? this : nothing
	},

	reduce:function reduce (funk){
		return funk(this._value)
	},

        getProp:function getProp (prop){
		return this.phatMap( (val) => this.of(val[prop]) )
	},


	
    }//--

methods.extras = [methods.getProp]

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
        methods.flatMap = helpers.flatMap
        methods.phatMap = helpers.phatMap

//Add a print function, used for debugging.
        methods.print = helpers.print


//In case you are interested, here is how the maybe constructor is implemented


	var maybe = function(value){
		if (value === undefined){
			return nothing
		}else{
			var obj = Object.create(methods)
			obj._value = value
			obj.constructor = maybe
			Object.freeze(obj)
			return obj
		}
	}

var nothing = Object.create(methods)//--
nothing.constructor = maybe//--
Object.freeze(nothing)//--
maybe.nothing = nothing//--

maybe.prototype = methods
module.exports = maybe//--
