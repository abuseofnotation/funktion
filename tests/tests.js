


QUnit.module("Monads")

QUnit.test("Maybe", function(assert){
    
    //The maybe monad is used to represent errors. For example this function returns a 'maybe' monad 
    
    var get = function get(prop){
        return function(obj){ return f.maybe(obj[prop]) }   
    }

    
    var get_a_b_c = function(obj){ return f.maybe(obj).chain(get("a")).chain(get("b")).chain(get("c"))}

    var get_a_b_c_alt = function(obj){return f.maybe(obj).map(get("a")).mjoin().map(get("b")).mjoin().map(get("c")).mjoin()}


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
