
        const f = require("./f")//--
        var id = require("./identity")//--
        var methods = Object.create(state.prototype)//--

	const stateT = function(value){
                var obj = Object.create(methods)
                obj._innerMonad = (prevState) => [value, prevState]
                return Object.freeze(obj)
	}
        
	methods.funktionType = "stateT"//--
        methods.constructor = stateT


//`map` is done by applying the function to the value and keeping the state unchanged.

	//m a -> ( a -> b ) -> m b
	methods.map = function map (funk){
		return this.constructor( this._innerMonad.map( (val) => funk(val) )

		//return this.constructor( this._runState.map(([input, prevState]) => [funk(input), prevState]))
	}
	
//`flat` does the following:
//1. Runs the code that we loaded in the monad so, far (using the `run` function).
//2. Saves the new state object and the value which is kept by the functions so far.
//3. After doing that, it arranges those two components (the object and the value) into a yet another
//state object, which runs the mutator function of the first object, with the state that we have so, far



	//m (m x) -> m x
	methods.flat = function flat (){
		//Extract state mutator and value 
		const [stateObj, currentState] = this.run()
		//Compose the mutator and the value
		return this.constructor(() => stateObj._runState(currentState) )
	}
	methods.tryFlat = function tryFlat (){

		//Extract current state 
		const [stateObj, currentState] = this.run()
		
		//Check if it is really a state
		if(stateObj.constructor === state){
			return this.constructor(() => stateObj._runState(currentState) )
		}else{
			return this.constructor(() => [stateObj, currentState])
		}
	}

//We have the `run` function which computes the state:

	methods.run = function run (){
		return this._runState()
	}
//And the `save` and `load` functions are exactly what one would expect

	methods.load = function load (){
		return this.flatMap( (value) => this.constructor( (state) => [state, state] ) )
	}
	methods.save = function save (){
		return this.flatMap( (value) => this.constructor( (state) => [value, value] ) )
	}
	methods.loadKey = function loadKey (key){
		return this.flatMap( (value) => this.constructor( (state) => [state[key], state] ) )
	}
	methods.saveKey = function saveKey (key){
		const write = (obj, key, val) => {
			obj = typeof obj === "object" ?  obj : {}
			obj[key] = val
			return obj
		}
		return this.flatMap( (value) => this.constructor( (state) => [value, write(state, key, value)] ) )
	}
	
        state.prototype = methods//--
        module.exports = state//--
