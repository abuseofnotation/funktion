        var helpers = require("./helpers")//--
        var maybe = require("./maybe")//--
        var methods = Object.create(maybe.prototype)


	var maybeT = function(value){
                var obj = Object.create(methods)
                obj._innerMonad = value
                return Object.freeze(obj)
	}
        
	methods.funktionType = "maybeT"//--
        methods.constructor = maybeT

	//m maybe a -> ( a -> maybe b ) -> m maybe b
	methods.map = function map (funk){
            return maybeT( this._innerMonad.map((val) => 
               val === undefined ? val : funk(val)
            ) )
	}

//`flat` takes a maybe that contains another maybe and flattens it.
//In this case this means just returning the inner value.

	//m (m x) -> m x
	methods.flat = function flat (){
            return maybeT(this._innerMonad.map( (innerMaybeT) =>
               innerMaybeT === undefined ? this._innerMonad.of(undefined) : innerMaybeT._innerMonad 
            ).flat())
	}

//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap` 

	methods.tryFlat=function tryFlat (){
            return maybeT(this._innerMonad.map( (innerMaybeT) =>{
		if(innerMaybeT === undefined){
			return this._innerMonad.of(undefined)
		}else if(innerMaybeT.funktionType === "maybeT"){
			return innerMaybeT._innerMonad
		}else{
                        return this._innerMaybeT
                }
            }).tryFlat())
	}

        methods.lift = function(funk, ...args){
            if(typeof funk === 'function'){
                return maybeT(funk(this._innerMonad))
            }else if (typeof funk === 'string'){
                return maybeT(this._innerMonad[funk](...args))
            }        
        }	

        module.exports = maybeT//--
