        var id = require("./identity")//--
        var methods = Object.create(id.prototype)//--

	var maybe = function(value){
                var obj = Object.create(methods)
                obj._value = value
                return Object.freeze(obj)
	}

//`map` takes the function and applies it to the value in the maybe, if there is one.
        methods.prototype = methods//--
        methods.constructor = maybe//--

	methods.funktionType = "maybe"//--

	//m a -> ( a -> b ) -> m b
	methods.map = function map (funk){
		if(this._value !== undefined){
			return this.constructor(funk(this._value))
		}else{	
			return this 
		}
	}

//`flat` takes a maybe that contains another maybe and flattens it.
//In this case this means just returning the inner value.

	//m (m x) -> m x
	methods.flat = function flat (){
		if(this._value !== undefined){
			return this._value
		}else{
			return this
		}
	}

//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap` 

	methods.tryFlat = function tryFlat (){
		if(this._value !== undefined && this._value.funktionType === "maybe"){
			return this._value
		}else{
			return this
		}
	}
	

//Finally, maybe defines one helper function which retrieves the property of an object, wrapped in a maybe:

        methods.getProp = function getProp (prop){
		return this.phatMap( (val) => this.of(val[prop]) )
	}


	

    maybe.prototype = methods//--
    module.exports = maybe//--
