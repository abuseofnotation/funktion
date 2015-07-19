var helpers = require("./helpers")//--
var maybe = require("./maybe")//--
var methods = {//--

//The `of` method, takes a value and wraps it in a `maybe`.
//In this case we do this by just calling the constructor.

	//a -> m a
	of:function(input){
            return maybeT(input)
	},

//`map` takes the function and applies it to the value in the maybe, if there is one.

	//m maybe a -> ( a -> maybe b ) -> m maybe b
	map:function(funk){
            return maybeT( this._value.map((val) => {
               return val === undefined? val:funk(val)
            }) )
	},

//`flat` takes a maybe that contains another maybe and flattens it.
//In this case this means just returning the inner value.

	//m (m x) -> m x
	flat:function(){
            return maybeT(this._value.map( (val) =>{
			return val._value
            }))
	},

//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap` 

	tryFlat:function(){
            return maybeT(this._value.map( (val) =>{
		if(val.funktionType === "maybeT"){
			return val._value
		}else{
			return val
		}
            }))
	},
        lift:function(funk, ...args){
            if(typeof funk === 'function'){
                return maybeT(funk(this._value))
            }else if (typeof funk === 'string'){
                return maybeT(this._value[funk](...args))
            }        
        },	
	funktionType:"maybeT"//--
	
    }//--

//In case you are interested, here is how the maybe constructor is implemented
    maybe.prototype.extras.forEach((method) => {
        methods[method.name] = method
    })

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
        methods.flatMap = helpers.flatMap
        methods.phatMap = helpers.phatMap

//Add a print function, used for debugging.
        methods.print = helpers.print

	var maybeT = function(monadValue){
                var obj = Object.create(methods)
                obj._value = monadValue
                obj.constructor = maybeT
                Object.freeze(obj)
                return obj
	}

module.exports = maybeT//--
