
const f = require("./f")//--

const helpers = require("./helpers")//--

const methods = {//--

//`of` just uses the constructor and does not touch the state.

	//a -> m a
	of:function(input){
		return state((prevState) => [input, prevState])
	},

//`map` is done by applying the function to the value and keeping the state unchanged.

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		return state( this._runState.map(([input, prevState]) => [funk(input), prevState]))
	},
	
//`flat` does the following:
//1. Runs the code that we loaded in the monad so, far (using the `run` function).
//2. Saves the new state object and the value which is kept by the functions so far.
//3. After doing that, it arranges those two components (the object and the value) into a yet another
//state object, which runs the mutator function of the first object, with the state that we have so, far



	//m (m x) -> m x
	flat:function(){
		//Extract state mutator and value 
		const [stateObj, currentState] = this.run()
		//Compose the mutator and the value
		return state(() => stateObj._runState(currentState) )
	},
	tryFlat:function(){

		//Extract current state 
		const [stateObj, currentState] = this.run()
		
		//Check if it is really a state
		if(stateObj.constructor === state){
			return state(() => stateObj._runState(currentState) )
		}else{
			return state(() => [stateObj, currentState])
		}
	},

//We have the `run` function which computes the state:

	run:function(){
		return this._runState()
	},
//And the `save` and `load` functions are exactly what one would expect

	load:function(){
		return this.flatMap( (value) => this.constructor( (state) => [state, state] ) )
	},
	save:function(){
		return this.flatMap( (value) => this.constructor( (state) => [value, value] ) )
	},
	loadKey:function(key){
		return this.flatMap( (value) => this.constructor( (state) => [state[key], state] ) )
	},
	saveKey:function(key){
		const write = (obj, key, val) => {
			obj = typeof obj === "object" ?  obj : {}
			obj[key] = val
			return obj
		}
		return this.flatMap( (value) => this.constructor( (state) => [value, write(state, key, value)] ) )
	}
	
    }//--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
        methods.flatMap = helpers.flatMap
        methods.phatMap = helpers.phatMap

//Add a print function, used for debugging.
        methods.print = helpers.print

//In case you are interested, here is how the state constructor is implemented

	const state = methods.constructor = function(run){
		if(typeof run !== "function"){ return methods.of(run) }
		const obj = Object.create(methods)
		obj._runState = f(run,1)
		obj.prototype = methods
		Object.freeze(obj)
		return obj
	}

module.exports = state//--
