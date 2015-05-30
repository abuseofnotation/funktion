


QUnit.module("Maybe")


var mget = f.curry(function (prop, obj){
	return maybe.from_null(obj[prop])
})

var get = f.curry(function (prop, obj){
	return obj[prop]   
})


QUnit.test("Maybe", function(assert){
	
	assert.expect(3)
  // var get_a_b_c = function(obj){ return f.maybe(obj).chain(mget("a")).chain(mget("b")).chain(mget("c"))}

   var get_a_b_c = f.compose(m.bind(mget("c")), m.bind(mget("b")), m.map(get("a")), maybe) 

    var get_a_b_c_alt = function(obj){return maybe(obj).map(mget("a")).join().map(mget("b")).join().map(mget("c")).join()}


    var a_b_c = {a:{b:{c:"foo"}}} 

    get_a_b_c(a_b_c).map(function(foo){
        assert.equal(foo, "foo", "When all values are present, the routine goes to the end.")
    })

    get_a_b_c_alt(a_b_c).map(function(foo){
        assert.equal(foo, "foo", "Calling 'chain' is equivalent to calling 'map' and them 'mjoin'.")
    })
    
    var funk_executed = false
    
    get_a_b_c({a:{}}).map(function(){
        funk_executed = true
    })
    assert.equal(funk_executed, false, "When some of the values are not present, the map function is never called.")

})


QUnit.module("State")
QUnit.test("state", function(assert){
	


	var my_state = state(5)
	.map(function(val){return val+1})
	.bind(function(val){return state(val, state.write("key", val))})
	.run()
	assert.deepEqual(my_state, {key:6})

	function put_input_in_state(a_state){
		return a_state.bind(function(array){
			if(array.length===0){return a_state}
			var el = array.pop()
			return put_input_in_state(state(array, state.write(el, true)))
		})

	}
	var unique = f().map(state).map(put_input_in_state).map(state.run).map(Object.keys)


//	var unique = f.compose(Object.keys, state.run, put_input_in_state, state)
	assert.deepEqual(unique(["1","2","2","3"]), ["1","2","3"])
})



QUnit.module("promises")

QUnit.test("then", function(assert){
	var done = assert.async()
	var p = promise(function(resolve){
		setTimeout(function(){
			resolve(1)

		}, 1000)
	})
	.bind(function(val){  
		return promise(function(resolve){
			setTimeout(function(){
				resolve(val + 1)
			}, 1000)  
		})
	
	
	})
	.map(function(val){
		assert.equal(val, 2, 'Chained computation returns correct value')
		done()
	})

	console.log(p)
	p.run()
	

})


QUnit.module("functions")

QUnit.test("map", function(assert){
	
	var plus_1 = f(function(num){return num+1})
	var times_2 = f(function(num){return num*2})
	var plus_2 = plus_1.map(plus_1) 
	var plus_4 = plus_2.map(plus_2)
	
	assert.equal(plus_2(0), 2, "functions can be composed from other functions.")
	assert.equal(plus_4(1), 5, "composed functions can be composed again.")

})




QUnit.test("then", function(assert){

	/*

	//The function must do the following (in Haskell terms)

	addStuff = do  
		a <- (*2)  
		b <- (+10)  
		return (a+b)
	addStuff 3 //19

	//When we desugar it, this becomes:

	addStuff = (*2) >>= \a ->
			(+10) >>= \b ->
				return (a+b)

	or...

	*/

	var addStuff = f(function(num){return num * 2}).chain(function(a){
		return f(function(num){return num + 10}).chain(function(b){
			return f.of(a + b)
 		})

	})
	
	
	var testt = f(function(num){return num * 2})
 		.chain(function(a){
 			return function(a){
 				return a+1
 			}
 		})

	assert.equal(addStuff(3), 19)

})


QUnit.test("curry", function(assert){
	var add_3 = f(function(a,b,c){return a+b+c})
	var add_2 = add_3(0)
	assert.equal(typeof add_2, "function", "curried functions return other functions when the arguments are not enough")
	assert.equal(add_2(1)(1), 2, "when the arguments are enough a result is returned.")
	
})


QUnit.module("Helpers")

QUnit.test("Then compose", function(assert){

	var get_a_b_c = m.then_compose(mget("c"), mget("b"), mget("a"))

	var a_b_c = {a:{b:{c:"foo"}}}

    get_a_b_c(maybe(a_b_c)).map(function(foo){
        assert.equal(foo, "foo", "When all values are present, the routine goes to the end.")
    })
})




if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
