


QUnit.module("Monads")


var mget = f.curry(function (prop, obj){
	return o.maybe(obj[prop])   
})

var get = f.curry(function (prop, obj){
	return obj[prop]   
})


QUnit.test("Maybe", function(assert){ 
	
	assert.expect(3)
  // var get_a_b_c = function(obj){ return f.maybe(obj).chain(mget("a")).chain(mget("b")).chain(mget("c"))}

   var get_a_b_c = f.compose(m.bind(mget("c")), m.bind(mget("b")), f.map(get("a")), o.maybe) 

    var get_a_b_c_alt = function(obj){return o.maybe(obj).map(mget("a")).join().map(mget("b")).join().map(mget("c")).join()}


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

QUnit.test("Compose", function(assert){

	var get_a_b_c = m.compose(mget("c"), mget("b"), mget("a"))

	var a_b_c = {a:{b:{c:"foo"}}}

    get_a_b_c(o.maybe(a_b_c)).map(function(foo){
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
