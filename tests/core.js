


QUnit.module("Core")


QUnit.test("Compose", function(assert){
	var plus_1 = function(num){return num+1}
	var times_2 = function(num){return num*2}
	var plus_2 = f.compose(plus_1, plus_1)
	var plus_4 = f.compose(plus_2, plus_2)
	plus_4_times_2 = f.compose(times_2, plus_4)
	
	assert.equal(plus_2(0), 2, "Functions can be composed from other functions.")
	assert.equal(plus_4(1), 5, "Composed functions can be composed again.")
	assert.equal(plus_4_times_2(1), 10, "And again")

})


QUnit.test("Curry", function(assert){
	var add_3 = f.curry(function(a,b,c){return a+b+c})
	var add_2 = add_3(0)
	assert.equal(typeof add_2, "function", "Curried functions return other functions when the arguments are not enough")
	assert.equal(add_2(1)(1), 2, "When the arguments are enough a result is returned.")
	

})