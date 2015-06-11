(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var helpers = require('./helpers'); //--

/*
under the hood
--------------
Let's see how the type is implemented
*/
var f_methods = helpers.add_missing_methods({ //--

	//the `of` method, takes a value and creates a function that returns it.
	//this is very useful if you have a api which expects a function, but you want to feed it with a value (see the `flatmap` example).

	//a.of(b) -> b a
	of: function of(val) {
		return f(function () {
			return val;
		});
	},

	//`map` just wires the original function and the new one together:

	//(a -> b).map(b -> c) = a -> c
	map: function map(funk) {
		var _this = this;

		if (funk === undefined) {
			throw new TypeError();
		}
		return f(function () {
			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			return funk(_this.apply(undefined, args));
		}, this._length);
	},

	//`flat` creates a function that:
	//1. Calls the original function with the supplied arguments
	//2. Calls the resulting function (and it has to be one) with the same arguments

	//(b -> (b -> c)).join() = a -> b
	flat: function flat() {
		var _this2 = this;

		return f(function () {
			for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
				args[_key2] = arguments[_key2];
			}

			return _this2.apply(undefined, args).apply(undefined, args);
		}, this._length);
	},

	//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`

	tryFlat: function tryFlat() {
		var _this3 = this;

		return f(function () {
			for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
				args[_key3] = arguments[_key3];
			}

			var result = _this3.apply(undefined, args);
			if (typeof result !== 'function') {
				return result;
			} else {
				return result.apply(undefined, args);
			}
		});
	}

});

var id = function id(a) {
	return a;
};

//This is the function constructor. It takes a function and adds an augmented function object, without extending the prototype

var f = function f() {
	var funk = arguments[0] === undefined ? id : arguments[0];
	var length = arguments[1] === undefined ? funk.length : arguments[1];
	var initial_arguments = arguments[2] === undefined ? [] : arguments[2];
	return (function () {

		//We expect a function. If we are given another value, lift it to a function
		if (typeof funk !== 'function') {
			return f().of(funk)

			//If the function takes just one argument, just extend it with methods and return it.
			;
		} else if (length < 2) {
			return extend(funk, f_methods)

			//Else, return a curry-capable version of the function (again, extended with the function methods)
			;
		} else {
			var extended_funk = extend(function () {
				for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
					args[_key4] = arguments[_key4];
				}

				var all_arguments = initial_arguments.concat(args);
				return all_arguments.length >= length ? funk.apply(undefined, _toConsumableArray(all_arguments)) : f(funk, length, all_arguments);
			}, f_methods);

			extended_funk._length = length - initial_arguments.length;
			extended_funk._original = funk;

			return extended_funk;
		}
	})();
};

//Here is the function with which the function object is extended

function extend(obj, methods) {
	return Object.keys(methods).reduce(function (obj, method_name) {
		obj[method_name] = methods[method_name];return obj;
	}, obj);
}

f.of = function (val) {
	return f(function () {
		return val;
	});
},

//The library also features a standard compose function which allows you to map normal functions with one another

f.compose = function () {

	//Convert functions to an array and flip them (for right-to-left execution)
	var functions = Array.prototype.slice.call(arguments).reverse();
	//Check if input is OK:
	functions.forEach(function (funk) {
		if (typeof funk !== 'function') {
			throw new TypeError(funk + ' is not a function');
		}
	});
	//Return the function which composes them
	return function () {
		//Take the initial input
		var input = arguments;
		var context;
		return functions.reduce(function (return_result, funk, i) {
			//If this is the first iteration, apply the arguments that the user provided
			//else use the return result from the previous function
			return i === 0 ? funk.apply(context, input) : funk(return_result);
			//return (i ===0?funk.apply(context, input): funk.apply(context, [return_result]))
		}, undefined);
	};
};

module.exports = f //--
;

},{"./helpers":3}],2:[function(require,module,exports){
//var m = require("./m")
"use strict";

var f = require("./f");
var maybe = require("./maybe");
//var state = require("./state")
//var promise = require("./promise")
module.exports = {
	//	m:m,
	f: f,
	maybe: maybe
	//	promise:promise,
	//	state:state
};

//window.promise = promise
window.f = f;
//window.m = m
window.maybe = maybe
//window.state = state
;

},{"./f":1,"./maybe":5}],3:[function(require,module,exports){
"use strict";

exports.create_constructor = function create_type(methods) {
	//Replace the 'of' function with a one that returns a new object
	var of = methods.of;
	methods.of = function (a, b, c, d) {
		return of.apply(Object.create(methods), arguments);
	};

	methods = add_missing_methods(methods);

	return methods.of;
};

var add_missing_methods = exports.add_missing_methods = function (obj) {
	//"chain" AKA "flatMap" is equivalent to map . join

	obj.chain = obj.flatMap = function (funk) {
		if (funk === undefined) {
			throw "function not defined";
		}
		return this.map(funk).flat();
	};

	/*
 "then" AKA "phatMap" is the relaxed version of "flatMap" which acts on the object only if the types match
 "phatMap" therefore can be used as both "map" and "flatMap", except in the cases when you specifically want to create a nested object.
 In these cases you can do so by simply using "map" expricitly.
 */

	obj.then = obj.phatMap = function (funk) {
		if (funk === undefined) {
			throw "function not defined";
		}
		return this.map(funk).tryFlat();
	};

	return obj;
};

},{}],4:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var helpers = require("./helpers"); //--

/*
under the hood
--------------
Let's see how the type is implemented
*/
var list_methods = helpers.add_missing_methods({ //--

	//the `of` method, takes a value and puts it in a list.

	//a.of(b) -> b a
	of: function of(val) {
		return list(val);
	},

	//`map` applies a function to each element of the list
	map: function map(funk) {
		return list(Array.prototype.map.call(this, funk));
	},

	//`flat` takes a list of lists and flattens them with one level

	//(b -> (b -> c)).join() = a -> b
	flat: function flat() {
		return list(this.reduce(function (list, element) {
			return [].concat(_toConsumableArray(list), _toConsumableArray(element));
		}, []));
	},

	//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`
	//and with it, your funk can return both a list of objects and a single object

	tryFlat: function tryFlat() {
		return list(this.reduce(function (list, element) {
			return element.constructor === Array ? [].concat(_toConsumableArray(list), _toConsumableArray(element)) : [].concat(_toConsumableArray(list), [element]);
		}, []));
	}

});

//This is the list constructor. It takes normal array and augments it with the above methods

var list = function list() {
	for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
		args[_key] = arguments[_key];
	}

	//Accept an array
	if (args.length === 1 && args[0].constructor === Array) {
		return Object.freeze(extend(args[0], list_methods))
		//Accept several arguments
		;
	} else {
		return Object.freeze(extend(args, list_methods));
	}
};

//Here is the function with which the list object is extended

function extend(obj, methods) {
	return Object.keys(methods).reduce(function (obj, method_name) {
		obj[method_name] = methods[method_name];return obj;
	}, obj);
}
module.exports = list //--
;

},{"./helpers":3}],5:[function(require,module,exports){
"use strict";

var helpers = require("./helpers"); //--
/*                                            
Under the hood                                
--------------                                
Let's see how this type is implemented     
*/

var maybe_proto = helpers.add_missing_methods({ //--

	//the `of` method, takes a value and wraps it in a `maybe`.
	//In this case we do this by just calling the constructor.

	//a -> m a
	of: function of(input) {
		return maybe(input);
	},

	//`map` takes the function and applies it to the value in the maybe, if there is one.

	//m a -> ( a -> b ) -> m b
	map: function map(funk) {
		if (this !== nothing) {
			return maybe(funk(this._value));
		} else {
			return this;
		}
	},

	//`flat` takes a maybe that contains another maybe and flattens it.
	//In this case this means just returning the inner value.

	//m (m x) -> m x
	flat: function flat() {
		if (this !== nothing) {
			return this._value;
		} else {
			return this;
		}
	},

	//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`

	tryFlat: function tryFlat() {
		if (this !== nothing && this._value.constructor === maybe) {
			return this._value;
		} else {
			return this;
		}
	}

}); //--

//In case you are interested, here is how the maybe constructor is implemented

var maybe = function maybe(value) {
	if (value === undefined) {
		return nothing;
	} else {
		var obj = Object.create(maybe_proto);
		obj._value = value;
		obj.constructor = maybe;
		Object.freeze(obj);
		return obj;
	}
};

var nothing = Object.create(maybe_proto); //--
nothing.constructor = maybe; //--
Object.freeze(nothing); //--
maybe.nothing = nothing; //--

module.exports = maybe //--
;

},{"./helpers":3}],6:[function(require,module,exports){
"use strict";

var f = require("./f");

var helpers = require("./helpers");

var state_proto = helpers.add_missing_methods({

	//As usual, the `of` function is trivial

	//a -> m a
	of: function of(input) {
		return state(input);
	},

	//`map` is done by applying the function to the value and keeping the state unchanged.

	//m a -> ( a -> b ) -> m b
	map: function map(funk) {
		return state(funk(this._value)(this._state), this._state);
	},

	//`flat` looks a little bit difficult, because we have to take care of an extra value,
	//but it is actually nothing more than a function that turns:

	/*
 {
 	_value:{
 		_value:x,
 		_state:s2
 	}
 	state:s1
 }
 
 into:
 
 {
 	_value:x,
 	state: s1 => s2
 }
 
 */

	//m (m x) -> m x
	flat: function flat() {
		console.log(this._value._state({}));
		return state(this._value._value, this._state.map(this._value._state));
	},
	tryFlat: function tryFlat() {

		if (this._value.prototype === state_proto) {

			return state(this._value._value, this._state.map(this._value._state));
		} else {
			return this;
		}
	},

	//We have the `run` function which computes the state:

	run: function run() {
		return this._state({});
	}

});

//In case you are interested, here is how the state constructor is implemented

var state = function state(value, _state) {
	var obj = Object.create(state_proto);
	obj._value = value;
	obj._state = f(_state, 1);
	obj.constructor = _state;
	obj.prototype = state_proto;
	Object.freeze(obj);
	return obj;
};

state.write = f(function (key, val, state) {
	state[key] = val;return state;
});
module.exports = state //--
;

},{"./f":1,"./helpers":3}],7:[function(require,module,exports){
/*---
category: tutorial
title: function
layout: post
---

The function monad augments standard JavaScript functions with composition and currying.
<!--more-->

*/
"use strict";

QUnit.module("functions"); //--

//To use the monad constructor, you can require it using node:

var f = require("../library/f");
var funktion = require("../library/funktion");

//Where the `../` is the location of the module.

//Then you will be able to construct functions line this

var plus_1 = f(function (num) {
		return num + 1;
});

//After you do that, you will still be able to use `plus_1` like a normal function, but you can also do the following:

/*
Currying
----
When you call a function `f` with less arguments that it accepts, it returns a partially applied
(bound) version of itself that may at any time be called with the rest of the arguments.
*/

QUnit.test("curry", function (assert) {
		//--
		var add_3 = f(function (a, b, c) {
				return a + b + c;
		});

		var add_2 = add_3(0);
		assert.equal(typeof add_2, "function", "curried functions return other functions when the arguments are not enough");

		assert.equal(add_2(1)(1), 2, "when the arguments are enough a result is returned.");
}); //--

/*
map(funk)
----
creates a new function that calls the original function first, then calls `funk` with the result of the original function as an argument:
*/
QUnit.test("map", function (assert) {
		//--

		//You can create a Function Monad by passing a normal JavaScript function to the constructor (you can write the function directly there):

		var plus_1 = f(function (num) {
				return num + 1;
		});

		//Then making another funxtion is easy:

		var plus_2 = plus_1.map(plus_1);

		assert.equal(plus_2(0), 2, "New functions can be composed from other functions.");

		var plus_4 = plus_2.map(plus_2);

		assert.equal(plus_4(1), 5, "composed functions can be composed again.");
}); //--

/*
flatMap(funk)
----
A more powerful version of `map`. Accepts a funktion which returns another function. Returns a function which calls the original function first,
and then it
1. Calls `funk` with the result of the original function as an argument
2. Calls the function returned by `funk`, with the same argument and returns the result of the second call.
*/
QUnit.test("flatMap", function (assert) {
		//--

		//You can use `flatMap` to model simple if-then statements. The following example uses it in combination of the currying functionality:

		var concat = f(function (str1, str2) {
				return str1 + str2;
		});
		var makeMessage = f(parseInt, 1).flatMap(function (num) {
				console.log("num " + num);
				return isNaN(num) ? f("Invalid number") : concat("The number is ");
		});

		assert.equal(makeMessage("1"), "The number is 1");
		assert.equal(makeMessage("2"), "The number is 2");
		assert.equal(makeMessage("Not a number"), "Invalid number");

		/*
  
  `flatMap` is similar to the `>>=` function in Haskell, which is the building block of the infamous `do` notation
  It can be used to write programs without using assignment.	
  
  For example if we have the following function in Haskell:
  
  		addStuff = do  
  			a <- (*2)  
  			b <- (+10)  
  			return (a+b)
  		
  		assert.equal(addStuff(3), 19)
  
  
  When we desugar it, this becomes:
  
  		addStuff = (*2) >>= \a ->
  				(+10) >>= \b ->
  					return (a+b)
  
  or in JavaScript terms:
  
  */

		var addStuff = f(function (num) {
				return num * 2;
		}).flatMap(function (a) {
				return f(function (num) {
						return num + 10;
				}).flatMap(function (b) {
						return f.of(a + b);
				});
		});

		assert.equal(addStuff(3), 19);
}); //--

},{"../library/f":1,"../library/funktion":2}],8:[function(require,module,exports){
/*---
category: tutorial
title: list 
layout: post
---

The `list` type, augments the standard JavaScript arrays, making them immutable and adding additional functionality to them

<!--more-->
*/
"use strict";

QUnit.module("List"); //--

//To use the `list` monad constructor, you can require it using node:

var list = require("../library/list");
var f = require("../library/f"); //--

//Where the `../` is the location of the module.

//Then you will be able to create a `list` from array like this
var my_list = list([1, 2, 3]);
//or like this:
var my_list = list(1, 2, 3);

/*
map(funk)
----
Standard array method. Executes `funk` for each of the values in the list and wraps the result in a new list.

***
*/
QUnit.test("map", function (assert) {
	//--
	var people = list({ name: "john", age: 24, occupation: "farmer" }, { name: "charlie", age: 22, occupation: "plumber" });
	var names = people.map(function (person) {
		return person.name;
	});
	assert.deepEqual(names, ["john", "charlie"]);
}); //--

/*
phatMap(funk)
----

Same as `map`, but if `funk` returns a list or an array it flattens the results into one array

***
*/

QUnit.test("flatMap", function (assert) {
	//--

	var occupations = list([{ occupation: "farmer", people: ["john", "sam", "charlie"] }, { occupation: "plumber", people: ["lisa", "sandra"] }]);

	var people = occupations.phatMap(function (occupation) {
		return occupation.people;
	});
	assert.deepEqual(people, ["john", "sam", "charlie", "lisa", "sandra"]);
}); //--

},{"../library/f":1,"../library/list":4}],9:[function(require,module,exports){
/*---
category: tutorial
title: maybe
layout: post
---

The `maybe` type, also known as `option` type is a container for a value that may not be there. 

The purpose of this monad is to eliminate the need for writing `null` checks. furthermore it also eliminates the possibility of making errors by missing null-checks.

<!--more-->
*/
"use strict";

QUnit.module("Maybe"); //--

//To use the `maybe` monad constructor, you can require it using node:

var maybe = require("../library/maybe");
var f = require("../library/f"); //--

//Where the `../` is the location of the module.

//Then you will be able to wrap a value in `maybe` with:
var val = 4; //--
var maybe_val = maybe(val);

//If the 'val' is equal to *undefined* it threats the container as empty.

/*
map(funk)
----
Executes `funk` with the `maybe`'s value as an argument, but only if the value is different from *undefined*, and wraps the result in a new maybe.

***
*/
QUnit.test("map", function (assert) {
	//--

	//Traditionally, if we have a value that may be undefined we do a null check before doing something with it:

	var obj = {}; //--
	var get_property = f(function (object) {
		return object.property;
	}); //--

	var val = get_property(obj);

	if (val !== undefined) {
		val = val.toString();
	}
	assert.equal(val, undefined);

	//With `map` this can be written like this

	var maybe_get_property = get_property.map(maybe);

	maybe_get_property(obj).map(function (val) {
		assert.ok(false); //--
		val.toString();
	});

	//The biggest benefit we get is that in the first case we can easily forget the null check:

	assert.throws(function () {
		get_property(obj).toString();
	});
}); //--

/*
phatMap(funk)
----

Same as `map`, but if `funk` returns a `maybe` it flattens the two `maybes` into one.

***
*/

QUnit.test("flatMap", function (assert) {
	//--

	//`map` works fine for eliminating errors, but does not solve one of the most annoying things there are with null-checks - nesting:

	var obj = { first: { second: "val" } };

	maybe(obj).map(function (root) {
		return maybe(root.first);
	}).map(function (maybeFirst) {
		return maybeFirst.map(function (first) {
			return maybe(maybeFirst.second);
		});
	}).map(function (maybeMaybeValue) {
		return maybeMaybeValue.map(function (maybeValue) {
			return maybeValue.map(function (value) {
				return assert.equal(val, "val");
			});
		});
	});

	//`phatMap` does the flattening for us, and allows us to write code like this

	maybe(obj).flatMap(function (root) {
		return maybe(root.first);
	}).flatMap(function (first) {
		return maybe(first.second);
	}).flatMap(function (val) {
		assert.equal(val, "val");
	});
}); //--

/*
Advanced Usage
----
*/

QUnit.test("advanced", function (assert) {
	//--
	// `maybe` can be used with the function monad to effectively produce 'safe' versions of functions

	var get = f(function (prop, obj) {
		return obj[prop];
	});
	var maybeGet = get.map(maybe);

	//This combined with the use of currying makes for a very fluent style of coding:

	var getFirstSecond = function getFirstSecond(root) {
		return maybe(root).phatMap(maybeGet("first")).phatMap(maybeGet("second"));
	};

	getFirstSecond({ first: { second: "value" } }).map(function (val) {
		return assert.equal(val, "value");
	});
	getFirstSecond({ first: { second: "other_value" } }).map(function (val) {
		return assert.equal(val, "other_value");
	});
	getFirstSecond({ first: "" }).map(function (val) {
		return assert.equal(val, "whatever");
	});
}); //this is not executed
//this blows up
//While in the second case we cannot access the underlying value directly, and therefore cannot execute an action on it, if it is not there.

//won't be executed

//--

},{"../library/f":1,"../library/maybe":5}],10:[function(require,module,exports){
/*---
category: tutorial
title: state
layout: post
---

The `state` type, also 

<!--more-->
*/
"use strict";

QUnit.module("State"); //--

//To use the `state` monad constructor, you can require it using node:

var state = require("../library/state");
var f = require("../library/f"); //--

//Where the `../` is the location of the module.

//Then you will be able to wrap a value in `state` with:

/*
map(funk)
----
Executes `funk` with the `state`'s value as an argument, but only if the value is different from *undefined*, and wraps the result in a new state.

***
*/
QUnit.test("state", function (assert) {

	var my_state = state(5).phatMap(function (val) {
		return function (current_state) {
			return val + 1;
		};
	}).phatMap(function (val) {
		return function (current_state) {
			return state(val, state.write("key", val));
		};
	}).run();
	assert.deepEqual(my_state, { key: 6 });
});

},{"../library/f":1,"../library/state":6}]},{},[7,8,9,10])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvZnVua3Rpb24uanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9oZWxwZXJzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvbGlzdC5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L21heWJlLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvc3RhdGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvZl90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9saXN0X3Rlc3RzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL21heWJlX3Rlc3RzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL3N0YXRlX3Rlc3RzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7Ozs7OztBQU9qQyxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUM7Ozs7OztBQU0zQyxHQUFFLEVBQUUsWUFBQSxHQUFHO1NBQUksQ0FBQyxDQUFFO1VBQU0sR0FBRztHQUFBLENBQUU7RUFBQTs7Ozs7QUFLekIsSUFBRyxFQUFFLGFBQVMsSUFBSSxFQUFDOzs7QUFDbEIsTUFBRyxJQUFJLEtBQUssU0FBUyxFQUFDO0FBQUMsU0FBTSxJQUFJLFNBQVMsRUFBQSxDQUFBO0dBQUM7QUFDM0MsU0FBTyxDQUFDLENBQUU7cUNBQUksSUFBSTtBQUFKLFFBQUk7OztVQUFLLElBQUksQ0FBRSx1QkFBUSxJQUFJLENBQUMsQ0FBRTtHQUFBLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFBO0VBQzVEOzs7Ozs7O0FBT0QsS0FBSSxFQUFDLGdCQUFVOzs7QUFDZCxTQUFPLENBQUMsQ0FBRTtzQ0FBSSxJQUFJO0FBQUosUUFBSTs7O1VBQUssd0JBQVEsSUFBSSxDQUFDLGtCQUFJLElBQUksQ0FBQztHQUFBLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxDQUFBO0VBQzdEOzs7O0FBSUQsUUFBTyxFQUFDLG1CQUFVOzs7QUFDakIsU0FBTyxDQUFDLENBQUUsWUFBYTtzQ0FBVCxJQUFJO0FBQUosUUFBSTs7O0FBQ2pCLE9BQUksTUFBTSxHQUFHLHdCQUFRLElBQUksQ0FBQyxDQUFBO0FBQzFCLE9BQUcsT0FBTyxNQUFNLEtBQUssVUFBVSxFQUFDO0FBQy9CLFdBQU8sTUFBTSxDQUFBO0lBQ2IsTUFBSTtBQUNKLFdBQU8sTUFBTSxrQkFBSSxJQUFJLENBQUMsQ0FBQTtJQUN0QjtHQUNELENBQUMsQ0FBQTtFQUNGOztDQUVELENBQUMsQ0FBQTs7QUFFRixJQUFJLEVBQUUsR0FBRyxTQUFMLEVBQUUsQ0FBWSxDQUFDLEVBQUM7QUFBQyxRQUFPLENBQUMsQ0FBQTtDQUFDLENBQUE7Ozs7QUFLOUIsSUFBSSxDQUFDLEdBQUcsU0FBSixDQUFDO0tBQUksSUFBSSxnQ0FBRyxFQUFFO0tBQUUsTUFBTSxnQ0FBRyxJQUFJLENBQUMsTUFBTTtLQUFFLGlCQUFpQixnQ0FBRyxFQUFFO3FCQUFLOzs7QUFHcEUsTUFBRyxPQUFPLElBQUksS0FBSyxVQUFVLEVBQUM7QUFDN0IsVUFBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDOzs7SUFBQTtHQUduQixNQUFLLElBQUssTUFBTSxHQUFHLENBQUMsRUFBRTtBQUN0QixVQUFPLE1BQU0sQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDOzs7SUFBQTtHQUc5QixNQUFJO0FBQ0osT0FBSSxhQUFhLEdBQUcsTUFBTSxDQUFFLFlBQWE7dUNBQVQsSUFBSTtBQUFKLFNBQUk7OztBQUNuQyxRQUFJLGFBQWEsR0FBSSxBQUFDLGlCQUFpQixDQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNyRCxXQUFPLGFBQWEsQ0FBQyxNQUFNLElBQUUsTUFBTSxHQUFDLElBQUkscUNBQUksYUFBYSxFQUFDLEdBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUE7SUFDekYsRUFBRSxTQUFTLENBQUMsQ0FBQTs7QUFFYixnQkFBYSxDQUFDLE9BQU8sR0FBRyxNQUFNLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFBO0FBQ3pELGdCQUFhLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTs7QUFFOUIsVUFBTyxhQUFhLENBQUE7R0FDcEI7RUFDRDtDQUFBLENBQUE7Ozs7QUFJRCxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFDO0FBQzVCLFFBQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBUyxHQUFHLEVBQUUsV0FBVyxFQUFDO0FBQUMsS0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxBQUFDLE9BQU8sR0FBRyxDQUFBO0VBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtDQUN4SDs7QUFHRCxDQUFDLENBQUMsRUFBRSxHQUFHLFVBQUEsR0FBRztRQUFJLENBQUMsQ0FBRTtTQUFNLEdBQUc7RUFBQSxDQUFFO0NBQUE7Ozs7QUFJNUIsQ0FBQyxDQUFDLE9BQU8sR0FBRyxZQUFVOzs7QUFHckIsS0FBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFBOztBQUUvRCxVQUFTLENBQUMsT0FBTyxDQUFDLFVBQVMsSUFBSSxFQUFDO0FBQUMsTUFBRyxPQUFPLElBQUksS0FBSyxVQUFVLEVBQUM7QUFBQyxTQUFNLElBQUksU0FBUyxDQUFDLElBQUksR0FBQyxvQkFBb0IsQ0FBRSxDQUFBO0dBQUM7RUFBQyxDQUFDLENBQUE7O0FBRWxILFFBQU8sWUFBVTs7QUFFaEIsTUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFBO0FBQ3JCLE1BQUksT0FBTyxDQUFBO0FBQ1gsU0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVMsYUFBYSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUM7OztBQUd2RCxVQUFRLENBQUMsS0FBSSxDQUFDLEdBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDOztHQUUvRCxFQUFFLFNBQVMsQ0FBQyxDQUFBO0VBQ2IsQ0FBQTtDQUNELENBQUE7O0FBR0QsTUFBTSxDQUFDLE9BQU8sR0FBRyxDQUFDO0FBQUEsQ0FBQTs7Ozs7O0FDM0duQixJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUE7QUFDdEIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFBOzs7QUFHOUIsTUFBTSxDQUFDLE9BQU8sR0FBRzs7QUFFaEIsRUFBQyxFQUFDLENBQUM7QUFDSCxNQUFLLEVBQUMsS0FBSzs7O0FBQUEsQ0FHWCxDQUFBOzs7QUFHRCxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFWixNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUs7O0FBQUEsQ0FBQTs7Ozs7QUNkcEIsT0FBTyxDQUFDLGtCQUFrQixHQUFHLFNBQVMsV0FBVyxDQUFDLE9BQU8sRUFBQzs7QUFFekQsS0FBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQTtBQUNuQixRQUFPLENBQUMsRUFBRSxHQUFHLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsU0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUE7RUFBQyxDQUFBOztBQUVsRixRQUFPLEdBQUcsbUJBQW1CLENBQUMsT0FBTyxDQUFDLENBQUE7O0FBRXRDLFFBQU8sT0FBTyxDQUFDLEVBQUUsQ0FBQztDQUNsQixDQUFBOztBQUVELElBQUksbUJBQW1CLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixHQUFHLFVBQVMsR0FBRyxFQUFDOzs7QUFHcEUsSUFBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsT0FBTyxHQUFHLFVBQVMsSUFBSSxFQUFDO0FBQ3ZDLE1BQUcsSUFBSSxLQUFHLFNBQVMsRUFBQztBQUFDLFNBQU0sc0JBQXNCLENBQUE7R0FBQztBQUNsRCxTQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7RUFDNUIsQ0FBQTs7Ozs7Ozs7QUFRRCxJQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEdBQUcsVUFBUyxJQUFJLEVBQUM7QUFDdEMsTUFBRyxJQUFJLEtBQUcsU0FBUyxFQUFDO0FBQUMsU0FBTSxzQkFBc0IsQ0FBQTtHQUFDO0FBQ2xELFNBQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtFQUMvQixDQUFBOztBQUVELFFBQU8sR0FBRyxDQUFBO0NBQ1YsQ0FBQTs7Ozs7OztBQzlCRCxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7Ozs7Ozs7QUFPbEMsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOzs7OztBQUs3QyxHQUFFLEVBQUUsWUFBQSxHQUFHO1NBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQztFQUFBOzs7QUFHcEIsSUFBRyxFQUFDLGFBQVMsSUFBSSxFQUFDO0FBQ2pCLFNBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQTtFQUNqRDs7Ozs7QUFLRCxLQUFJLEVBQUMsZ0JBQVU7QUFDZCxTQUFPLElBQUksQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQUMsSUFBSSxFQUFFLE9BQU87dUNBQVMsSUFBSSxzQkFBSyxPQUFPO0dBQUMsRUFBRSxFQUFFLENBQUMsQ0FBRSxDQUFBO0VBQ3hFOzs7OztBQUtELFFBQU8sRUFBQyxtQkFBVTtBQUNqQixTQUFPLElBQUksQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQUMsSUFBSSxFQUFFLE9BQU87VUFDdEMsT0FBTyxDQUFDLFdBQVcsS0FBSyxLQUFLLGdDQUFNLElBQUksc0JBQUssT0FBTyxrQ0FBUSxJQUFJLElBQUUsT0FBTyxFQUFDO0dBQUEsRUFBRyxFQUFFLENBQUMsQ0FDL0UsQ0FBQTtFQUNEOztDQUVELENBQUMsQ0FBQTs7OztBQUlGLElBQUksSUFBSSxHQUFHLFNBQVAsSUFBSSxHQUFnQjttQ0FBVCxJQUFJO0FBQUosTUFBSTs7OztBQUVsQixLQUFHLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEtBQUssS0FBSyxFQUFFO0FBQ3RELFNBQVEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDOztHQUFBO0VBRXBELE1BQUk7QUFDSixTQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFBO0VBQ2hEO0NBQ0QsQ0FBQTs7OztBQUlELFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUM7QUFDNUIsUUFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFTLEdBQUcsRUFBRSxXQUFXLEVBQUM7QUFBQyxLQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEFBQUMsT0FBTyxHQUFHLENBQUE7RUFBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0NBQ3hIO0FBQ0YsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJO0FBQUEsQ0FBQTs7Ozs7QUN4RHJCLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7Ozs7OztBQU9sQyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUM7Ozs7OztBQU03QyxHQUFFLEVBQUMsWUFBUyxLQUFLLEVBQUM7QUFDakIsU0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7RUFDbkI7Ozs7O0FBS0QsSUFBRyxFQUFDLGFBQVMsSUFBSSxFQUFDO0FBQ2pCLE1BQUcsSUFBSSxLQUFLLE9BQU8sRUFBQztBQUNuQixVQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7R0FDL0IsTUFBSTtBQUNKLFVBQU8sSUFBSSxDQUFBO0dBQ1g7RUFDRDs7Ozs7O0FBTUQsS0FBSSxFQUFDLGdCQUFVO0FBQ2QsTUFBRyxJQUFJLEtBQUssT0FBTyxFQUFDO0FBQ25CLFVBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQTtHQUNsQixNQUFJO0FBQ0osVUFBTyxJQUFJLENBQUE7R0FDWDtFQUNEOzs7O0FBSUQsUUFBTyxFQUFDLG1CQUFVO0FBQ2pCLE1BQUcsSUFBSSxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUM7QUFDeEQsVUFBTyxJQUFJLENBQUMsTUFBTSxDQUFBO0dBQ2xCLE1BQUk7QUFDSixVQUFPLElBQUksQ0FBQTtHQUNYO0VBQ0Q7O0NBRUQsQ0FBQyxDQUFBOzs7O0FBS0QsSUFBSSxLQUFLLEdBQUcsU0FBUixLQUFLLENBQVksS0FBSyxFQUFDO0FBQzFCLEtBQUksS0FBSyxLQUFLLFNBQVMsRUFBQztBQUN2QixTQUFPLE9BQU8sQ0FBQTtFQUNkLE1BQUk7QUFDSixNQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFBO0FBQ3BDLEtBQUcsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFBO0FBQ2xCLEtBQUcsQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFBO0FBQ3ZCLFFBQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDbEIsU0FBTyxHQUFHLENBQUE7RUFDVjtDQUNELENBQUE7O0FBRUYsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUN4QyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtBQUMzQixNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQ3RCLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBOztBQUV2QixNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUs7QUFBQSxDQUFBOzs7OztBQ3hFdEIsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBOztBQUd0QixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBRWxDLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQzs7Ozs7QUFLN0MsR0FBRSxFQUFDLFlBQVMsS0FBSyxFQUFDO0FBQ2pCLFNBQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO0VBQ25COzs7OztBQUtELElBQUcsRUFBQyxhQUFTLElBQUksRUFBQztBQUNqQixTQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7RUFDekQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXdCRCxLQUFJLEVBQUMsZ0JBQVU7QUFDZCxTQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDbkMsU0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO0VBQ3JFO0FBQ0QsUUFBTyxFQUFDLG1CQUFVOztBQUVqQixNQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxLQUFLLFdBQVcsRUFBQzs7QUFFeEMsVUFBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO0dBQ3JFLE1BQUk7QUFDSixVQUFPLElBQUksQ0FBQTtHQUNYO0VBQ0Q7Ozs7QUFJRCxJQUFHLEVBQUMsZUFBVTtBQUNiLFNBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtFQUN0Qjs7Q0FHRCxDQUFDLENBQUE7Ozs7QUFJRCxJQUFJLEtBQUssR0FBRyxlQUFTLEtBQUssRUFBRSxNQUFLLEVBQUM7QUFDakMsS0FBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQTtBQUNwQyxJQUFHLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQTtBQUNsQixJQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxNQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDeEIsSUFBRyxDQUFDLFdBQVcsR0FBRyxNQUFLLENBQUE7QUFDdkIsSUFBRyxDQUFDLFNBQVMsR0FBRyxXQUFXLENBQUE7QUFDM0IsT0FBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNsQixRQUFPLEdBQUcsQ0FBQTtDQUNWLENBQUE7O0FBRUYsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsVUFBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBQztBQUFFLE1BQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQUFBQyxPQUFPLEtBQUssQ0FBQztDQUFDLENBQUMsQ0FBQTtBQUM1RSxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUs7QUFBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUNyRXRCLEtBQUssQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUE7Ozs7QUFLdkIsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0FBQy9CLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFBOzs7Ozs7QUFNN0MsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFFLFVBQUMsR0FBRztTQUFLLEdBQUcsR0FBQyxDQUFDO0NBQUEsQ0FBRSxDQUFBOzs7Ozs7Ozs7OztBQWFqQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFTLE1BQU0sRUFBQzs7QUFDbkMsTUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFVBQVMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUM7QUFBQyxXQUFPLENBQUMsR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFBO0dBQUMsQ0FBQyxDQUFBOztBQUU1QyxNQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDcEIsUUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssRUFBRSxVQUFVLEVBQUUsNEVBQTRFLENBQUMsQ0FBQTs7QUFFcEgsUUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLHFEQUFxRCxDQUFDLENBQUE7Q0FDbkYsQ0FBQyxDQUFBOzs7Ozs7O0FBT0YsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBUyxNQUFNLEVBQUM7Ozs7O0FBSWpDLE1BQUksTUFBTSxHQUFHLENBQUMsQ0FBRSxVQUFDLEdBQUc7V0FBSyxHQUFHLEdBQUMsQ0FBQztHQUFBLENBQUUsQ0FBQTs7OztBQUtoQyxNQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFBOztBQUUvQixRQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUscURBQXFELENBQUMsQ0FBQTs7QUFFakYsTUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQTs7QUFFL0IsUUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLDJDQUEyQyxDQUFDLENBQUE7Q0FFdkUsQ0FBQyxDQUFBOzs7Ozs7Ozs7O0FBVUYsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBUyxNQUFNLEVBQUM7Ozs7O0FBSXJDLE1BQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxVQUFDLElBQUksRUFBRSxJQUFJO1dBQUssSUFBSSxHQUFHLElBQUk7R0FBQSxDQUFDLENBQUE7QUFDM0MsTUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxHQUFHLEVBQUs7QUFBQyxXQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzRSxXQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtHQUFDLENBQUUsQ0FBQTs7QUFFcEUsUUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQTtBQUNqRCxRQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFBO0FBQ2pELFFBQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCM0QsTUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFFLFVBQUMsR0FBRztXQUFLLEdBQUcsR0FBRyxDQUFDO0dBQUEsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxVQUFDLENBQUM7V0FDNUMsQ0FBQyxDQUFFLFVBQUMsR0FBRzthQUFLLEdBQUcsR0FBRyxFQUFFO0tBQUEsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxVQUFDLENBQUM7YUFDbkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQUEsQ0FBRTtHQUFBLENBQUUsQ0FBQTs7QUFFbEIsUUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7Q0FFN0IsQ0FBQyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUM3R0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTs7OztBQU1sQixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQTtBQUNyQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7Ozs7O0FBSy9CLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTs7QUFFM0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUE7Ozs7Ozs7OztBQVMzQixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFTLE1BQU0sRUFBQzs7QUFDakMsS0FBSSxNQUFNLEdBQUcsSUFBSSxDQUFFLEVBQUMsSUFBSSxFQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUMsRUFBRSxFQUFFLFVBQVUsRUFBQyxRQUFRLEVBQUMsRUFBRSxFQUFDLElBQUksRUFBQyxTQUFTLEVBQUUsR0FBRyxFQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQTtBQUM5RyxLQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUMsTUFBTTtTQUFLLE1BQU0sQ0FBQyxJQUFJO0VBQUEsQ0FBRSxDQUFBO0FBQ2hELE9BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUE7Q0FFNUMsQ0FBQyxDQUFBOzs7Ozs7Ozs7OztBQVdGLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVMsTUFBTSxFQUFDOzs7QUFFckMsS0FBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQ3RCLEVBQUMsVUFBVSxFQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQ3pELEVBQUMsVUFBVSxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FDbEQsQ0FBQyxDQUFBOztBQUVGLEtBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBQyxVQUFVO1NBQUssVUFBVSxDQUFDLE1BQU07RUFBQSxDQUFDLENBQUE7QUFDbkUsT0FBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtDQUVyRSxDQUFDLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDL0NGLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUE7Ozs7QUFNbkIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUE7QUFDdkMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFBOzs7OztBQUsvQixJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUE7QUFDWCxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7Ozs7Ozs7Ozs7O0FBVzVCLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVMsTUFBTSxFQUFDOzs7OztBQUlqQyxLQUFJLEdBQUcsR0FBRyxFQUFFLENBQUE7QUFDWixLQUFJLFlBQVksR0FBRyxDQUFDLENBQUMsVUFBQyxNQUFNO1NBQUssTUFBTSxDQUFDLFFBQVE7RUFBQSxDQUFDLENBQUE7O0FBRWpELEtBQUksR0FBRyxHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQTs7QUFFM0IsS0FBRyxHQUFHLEtBQUssU0FBUyxFQUFDO0FBQ3BCLEtBQUcsR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUE7RUFDcEI7QUFDRCxPQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQTs7OztBQUkzQixLQUFJLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7O0FBRWpELG1CQUFrQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEdBQUcsRUFBSztBQUNwQyxRQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ2hCLEtBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtFQUNkLENBQUMsQ0FBQTs7OztBQUlGLE9BQU0sQ0FBQyxNQUFNLENBQUMsWUFBVTtBQUN2QixjQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUE7RUFDNUIsQ0FBQyxDQUFBO0NBSUYsQ0FBQyxDQUFBOzs7Ozs7Ozs7OztBQVdGLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVMsTUFBTSxFQUFDOzs7OztBQUlyQyxLQUFJLEdBQUcsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFDLE1BQU0sRUFBQyxLQUFLLEVBQUUsRUFBRSxDQUFBOztBQUVwQyxNQUFLLENBQUMsR0FBRyxDQUFDLENBQ1IsR0FBRyxDQUFFLFVBQUMsSUFBSTtTQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0VBQUEsQ0FBQyxDQUNqQyxHQUFHLENBQUUsVUFBQyxVQUFVO1NBQUssVUFBVSxDQUFDLEdBQUcsQ0FBRSxVQUFBLEtBQUs7VUFBSSxLQUFLLENBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBRTtHQUFBLENBQUU7RUFBQSxDQUFFLENBQzdFLEdBQUcsQ0FBRSxVQUFDLGVBQWU7U0FBSyxlQUFlLENBQUMsR0FBRyxDQUFHLFVBQUUsVUFBVTtVQUFLLFVBQVUsQ0FBQyxHQUFHLENBQUUsVUFBQyxLQUFLO1dBQUssTUFBTSxDQUFDLEtBQUssQ0FBRSxHQUFHLEVBQUUsS0FBSyxDQUFDO0lBQUUsQ0FBRTtHQUFBLENBQUU7RUFBQSxDQUFFLENBQUE7Ozs7QUFJL0gsTUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUNSLE9BQU8sQ0FBQyxVQUFDLElBQUk7U0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztFQUFBLENBQUMsQ0FDcEMsT0FBTyxDQUFDLFVBQUMsS0FBSztTQUFLLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0VBQUEsQ0FBQyxDQUN2QyxPQUFPLENBQUMsVUFBQyxHQUFHLEVBQUs7QUFDakIsUUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUE7RUFDeEIsQ0FBQyxDQUFBO0NBRUgsQ0FBQyxDQUFBOzs7Ozs7O0FBT0YsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBUyxNQUFNLEVBQUM7Ozs7QUFHdEMsS0FBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLFVBQUMsSUFBSSxFQUFFLEdBQUc7U0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDO0VBQUEsQ0FBQyxDQUFBO0FBQ3JDLEtBQUksUUFBUSxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7Ozs7QUFJN0IsS0FBSSxjQUFjLEdBQUcsU0FBakIsY0FBYyxDQUFJLElBQUk7U0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7RUFBQSxDQUFBOztBQUVqRyxlQUFjLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBQyxNQUFNLEVBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEdBQUc7U0FBSyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBQyxPQUFPLENBQUM7RUFBQSxDQUFDLENBQUE7QUFDcEYsZUFBYyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUMsTUFBTSxFQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxHQUFHO1NBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUMsYUFBYSxDQUFDO0VBQUEsQ0FBQyxDQUFBO0FBQ2hHLGVBQWMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLEdBQUc7U0FBSyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBQyxVQUFVLENBQUM7RUFBQSxDQUFFLENBQUE7Q0FFekUsQ0FBQyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM3R0YsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQTs7OztBQU1uQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtBQUN2QyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7Ozs7Ozs7Ozs7Ozs7QUFhakMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBUyxNQUFNLEVBQUM7O0FBRW5DLEtBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FDdEIsT0FBTyxDQUFDLFVBQUMsR0FBRztTQUFLLFVBQUMsYUFBYTtVQUFLLEdBQUcsR0FBQyxDQUFDO0dBQUE7RUFBQSxDQUFDLENBQzFDLE9BQU8sQ0FBQyxVQUFDLEdBQUc7U0FBSyxVQUFDLGFBQWE7VUFBSyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0dBQUE7RUFBQSxDQUFDLENBQ3hFLEdBQUcsRUFBRSxDQUFBO0FBQ04sT0FBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsRUFBQyxHQUFHLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQTtDQUVuQyxDQUFDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cdHZhciBmX21ldGhvZHMgPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCBjcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGl0LlxyXG4vL3RoaXMgaXMgdmVyeSB1c2VmdWwgaWYgeW91IGhhdmUgYSBhcGkgd2hpY2ggZXhwZWN0cyBhIGZ1bmN0aW9uLCBidXQgeW91IHdhbnQgdG8gZmVlZCBpdCB3aXRoIGEgdmFsdWUgKHNlZSB0aGUgYGZsYXRtYXBgIGV4YW1wbGUpLiBcclxuXHJcblx0XHQvL2Eub2YoYikgLT4gYiBhXHJcblx0XHRvZjogdmFsID0+IGYoICgpID0+IHZhbCApLFxyXG5cclxuLy9gbWFwYCBqdXN0IHdpcmVzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhbmQgdGhlIG5ldyBvbmUgdG9nZXRoZXI6XHJcblxyXG5cdFx0Ly8oYSAtPiBiKS5tYXAoYiAtPiBjKSA9IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkuam9pbigpID0gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcblx0dmFyIGlkID0gZnVuY3Rpb24oYSl7cmV0dXJuIGF9XHJcblxyXG5cclxuLy9UaGlzIGlzIHRoZSBmdW5jdGlvbiBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgYSBmdW5jdGlvbiBhbmQgYWRkcyBhbiBhdWdtZW50ZWQgZnVuY3Rpb24gb2JqZWN0LCB3aXRob3V0IGV4dGVuZGluZyB0aGUgcHJvdG90eXBlXHJcblxyXG5cdHZhciBmID0gKGZ1bmsgPSBpZCwgbGVuZ3RoID0gZnVuay5sZW5ndGgsIGluaXRpYWxfYXJndW1lbnRzID0gW10pID0+IHtcclxuXHJcblx0XHQvL1dlIGV4cGVjdCBhIGZ1bmN0aW9uLiBJZiB3ZSBhcmUgZ2l2ZW4gYW5vdGhlciB2YWx1ZSwgbGlmdCBpdCB0byBhIGZ1bmN0aW9uXHJcblx0XHRpZih0eXBlb2YgZnVuayAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdHJldHVybiBmKCkub2YoZnVuaylcclxuXHRcdFxyXG5cdFx0Ly9JZiB0aGUgZnVuY3Rpb24gdGFrZXMganVzdCBvbmUgYXJndW1lbnQsIGp1c3QgZXh0ZW5kIGl0IHdpdGggbWV0aG9kcyBhbmQgcmV0dXJuIGl0LlxyXG5cdFx0fWVsc2UgaWYgKCBsZW5ndGggPCAyICl7XHJcblx0XHRcdHJldHVybiBleHRlbmQoZnVuaywgZl9tZXRob2RzKVxyXG5cclxuXHRcdC8vRWxzZSwgcmV0dXJuIGEgY3VycnktY2FwYWJsZSB2ZXJzaW9uIG9mIHRoZSBmdW5jdGlvbiAoYWdhaW4sIGV4dGVuZGVkIHdpdGggdGhlIGZ1bmN0aW9uIG1ldGhvZHMpXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0dmFyIGV4dGVuZGVkX2Z1bmsgPSBleHRlbmQoICguLi5hcmdzKSA9PiB7XHJcblx0XHRcdFx0dmFyIGFsbF9hcmd1bWVudHMgID0gKGluaXRpYWxfYXJndW1lbnRzKS5jb25jYXQoYXJncylcdFxyXG5cdFx0XHRcdHJldHVybiBhbGxfYXJndW1lbnRzLmxlbmd0aD49bGVuZ3RoP2Z1bmsoLi4uYWxsX2FyZ3VtZW50cyk6ZihmdW5rLCBsZW5ndGgsIGFsbF9hcmd1bWVudHMpXHJcblx0XHRcdH0sIGZfbWV0aG9kcylcclxuXHRcdFx0XHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX2xlbmd0aCA9IGxlbmd0aCAtIGluaXRpYWxfYXJndW1lbnRzLmxlbmd0aFxyXG5cdFx0XHRleHRlbmRlZF9mdW5rLl9vcmlnaW5hbCA9IGZ1bmtcclxuXHJcblx0XHRcdHJldHVybiBleHRlbmRlZF9mdW5rXHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9IZXJlIGlzIHRoZSBmdW5jdGlvbiB3aXRoIHdoaWNoIHRoZSBmdW5jdGlvbiBvYmplY3QgaXMgZXh0ZW5kZWRcclxuXHJcblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0XHRyZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKGZ1bmN0aW9uKG9iaiwgbWV0aG9kX25hbWUpe29ialttZXRob2RfbmFtZV0gPSBtZXRob2RzW21ldGhvZF9uYW1lXTsgcmV0dXJuIG9ian0sIG9iailcclxuXHR9XHJcblxyXG5cdFxyXG5cdGYub2YgPSB2YWwgPT4gZiggKCkgPT4gdmFsICksXHJcblxyXG4vL1RoZSBsaWJyYXJ5IGFsc28gZmVhdHVyZXMgYSBzdGFuZGFyZCBjb21wb3NlIGZ1bmN0aW9uIHdoaWNoIGFsbG93cyB5b3UgdG8gbWFwIG5vcm1hbCBmdW5jdGlvbnMgd2l0aCBvbmUgYW5vdGhlclxyXG5cclxuXHRmLmNvbXBvc2UgPSBmdW5jdGlvbigpe1xyXG5cclxuXHRcdC8vQ29udmVydCBmdW5jdGlvbnMgdG8gYW4gYXJyYXkgYW5kIGZsaXAgdGhlbSAoZm9yIHJpZ2h0LXRvLWxlZnQgZXhlY3V0aW9uKVxyXG5cdFx0dmFyIGZ1bmN0aW9ucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykucmV2ZXJzZSgpXHJcblx0XHQvL0NoZWNrIGlmIGlucHV0IGlzIE9LOlxyXG5cdFx0ZnVuY3Rpb25zLmZvckVhY2goZnVuY3Rpb24oZnVuayl7aWYodHlwZW9mIGZ1bmsgIT09IFwiZnVuY3Rpb25cIil7dGhyb3cgbmV3IFR5cGVFcnJvcihmdW5rK1wiIGlzIG5vdCBhIGZ1bmN0aW9uXCIgKX19KVxyXG5cdFx0Ly9SZXR1cm4gdGhlIGZ1bmN0aW9uIHdoaWNoIGNvbXBvc2VzIHRoZW1cclxuXHRcdHJldHVybiBmdW5jdGlvbigpe1xyXG5cdFx0XHQvL1Rha2UgdGhlIGluaXRpYWwgaW5wdXRcclxuXHRcdFx0dmFyIGlucHV0ID0gYXJndW1lbnRzXHJcblx0XHRcdHZhciBjb250ZXh0XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbnMucmVkdWNlKGZ1bmN0aW9uKHJldHVybl9yZXN1bHQsIGZ1bmssIGkpeyBcclxuXHRcdFx0XHQvL0lmIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZXJhdGlvbiwgYXBwbHkgdGhlIGFyZ3VtZW50cyB0aGF0IHRoZSB1c2VyIHByb3ZpZGVkXHJcblx0XHRcdFx0Ly9lbHNlIHVzZSB0aGUgcmV0dXJuIHJlc3VsdCBmcm9tIHRoZSBwcmV2aW91cyBmdW5jdGlvblxyXG5cdFx0XHRcdHJldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rKHJldHVybl9yZXN1bHQpKVxyXG5cdFx0XHRcdC8vcmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsuYXBwbHkoY29udGV4dCwgW3JldHVybl9yZXN1bHRdKSlcclxuXHRcdFx0fSwgdW5kZWZpbmVkKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cdG1vZHVsZS5leHBvcnRzID0gZi8vLS1cclxuIiwiLy92YXIgbSA9IHJlcXVpcmUoXCIuL21cIilcclxudmFyIGYgPSByZXF1aXJlKFwiLi9mXCIpXHJcbnZhciBtYXliZSA9IHJlcXVpcmUoXCIuL21heWJlXCIpXHJcbi8vdmFyIHN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVcIilcclxuLy92YXIgcHJvbWlzZSA9IHJlcXVpcmUoXCIuL3Byb21pc2VcIilcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbi8vXHRtOm0sXHJcblx0ZjpmLFxyXG5cdG1heWJlOm1heWJlXHJcbi8vXHRwcm9taXNlOnByb21pc2UsXHJcbi8vXHRzdGF0ZTpzdGF0ZVxyXG59XHJcblxyXG4vL3dpbmRvdy5wcm9taXNlID0gcHJvbWlzZVxyXG53aW5kb3cuZiA9IGZcclxuLy93aW5kb3cubSA9IG1cclxud2luZG93Lm1heWJlID0gbWF5YmVcclxuLy93aW5kb3cuc3RhdGUgPSBzdGF0ZSBcclxuIiwiXHJcblxyXG5leHBvcnRzLmNyZWF0ZV9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uIGNyZWF0ZV90eXBlKG1ldGhvZHMpe1xyXG5cdC8vUmVwbGFjZSB0aGUgJ29mJyBmdW5jdGlvbiB3aXRoIGEgb25lIHRoYXQgcmV0dXJucyBhIG5ldyBvYmplY3RcclxuXHR2YXIgb2YgPSBtZXRob2RzLm9mXHJcblx0bWV0aG9kcy5vZiA9IGZ1bmN0aW9uKGEsYixjLGQpe3JldHVybiBvZi5hcHBseShPYmplY3QuY3JlYXRlKG1ldGhvZHMpLCBhcmd1bWVudHMpfVxyXG5cdFxyXG5cdG1ldGhvZHMgPSBhZGRfbWlzc2luZ19tZXRob2RzKG1ldGhvZHMpXHJcblx0XHJcblx0cmV0dXJuIG1ldGhvZHMub2Y7XHJcbn1cclxuXHJcbnZhciBhZGRfbWlzc2luZ19tZXRob2RzID0gZXhwb3J0cy5hZGRfbWlzc2luZ19tZXRob2RzID0gZnVuY3Rpb24ob2JqKXtcclxuXHQvL1wiY2hhaW5cIiBBS0EgXCJmbGF0TWFwXCIgaXMgZXF1aXZhbGVudCB0byBtYXAgLiBqb2luIFxyXG5cdFxyXG5cdG9iai5jaGFpbiA9IG9iai5mbGF0TWFwID0gZnVuY3Rpb24oZnVuayl7XHJcblx0XHRpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcblx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcblx0fVxyXG5cclxuXHQvKlxyXG5cdFwidGhlblwiIEFLQSBcInBoYXRNYXBcIiBpcyB0aGUgcmVsYXhlZCB2ZXJzaW9uIG9mIFwiZmxhdE1hcFwiIHdoaWNoIGFjdHMgb24gdGhlIG9iamVjdCBvbmx5IGlmIHRoZSB0eXBlcyBtYXRjaFxyXG5cdFwicGhhdE1hcFwiIHRoZXJlZm9yZSBjYW4gYmUgdXNlZCBhcyBib3RoIFwibWFwXCIgYW5kIFwiZmxhdE1hcFwiLCBleGNlcHQgaW4gdGhlIGNhc2VzIHdoZW4geW91IHNwZWNpZmljYWxseSB3YW50IHRvIGNyZWF0ZSBhIG5lc3RlZCBvYmplY3QuXHJcblx0SW4gdGhlc2UgY2FzZXMgeW91IGNhbiBkbyBzbyBieSBzaW1wbHkgdXNpbmcgXCJtYXBcIiBleHByaWNpdGx5LlxyXG5cdCovXHJcblxyXG5cdG9iai50aGVuID0gb2JqLnBoYXRNYXAgPSBmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdHJldHVybiB0aGlzLm1hcChmdW5rKS50cnlGbGF0KClcclxuXHR9XHJcblx0XHJcblx0cmV0dXJuIG9ialxyXG59XHJcbiIsIlxyXG5cclxudmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG52YXIgbGlzdF9tZXRob2RzID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgcHV0cyBpdCBpbiBhIGxpc3QuXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiBsaXN0KHZhbCksXHJcblxyXG4vL2BtYXBgIGFwcGxpZXMgYSBmdW5jdGlvbiB0byBlYWNoIGVsZW1lbnQgb2YgdGhlIGxpc3QgXHJcblx0XHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRcdHJldHVybiBsaXN0KEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5rKSlcclxuXHRcdH0sXHJcblx0XHRcclxuLy9gZmxhdGAgdGFrZXMgYSBsaXN0IG9mIGxpc3RzIGFuZCBmbGF0dGVucyB0aGVtIHdpdGggb25lIGxldmVsIFxyXG5cclxuXHRcdC8vKGIgLT4gKGIgLT4gYykpLmpvaW4oKSA9IGEgLT4gYlxyXG5cdFx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gbGlzdCggdGhpcy5yZWR1Y2UoKGxpc3QsIGVsZW1lbnQpID0+IFsuLi5saXN0LCAuLi5lbGVtZW50XSwgW10pIClcclxuXHRcdH0sXHJcblx0XHRcclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYFxyXG4vL2FuZCB3aXRoIGl0LCB5b3VyIGZ1bmsgY2FuIHJldHVybiBib3RoIGEgbGlzdCBvZiBvYmplY3RzIGFuZCBhIHNpbmdsZSBvYmplY3RcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBsaXN0KCB0aGlzLnJlZHVjZSgobGlzdCwgZWxlbWVudCkgPT4gXHJcblx0XHRcdFx0ZWxlbWVudC5jb25zdHJ1Y3RvciA9PT0gQXJyYXk/IFsuLi5saXN0LCAuLi5lbGVtZW50XSA6IFsuLi5saXN0LCBlbGVtZW50XSAsIFtdKVxyXG5cdFx0XHQpXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG4vL1RoaXMgaXMgdGhlIGxpc3QgY29uc3RydWN0b3IuIEl0IHRha2VzIG5vcm1hbCBhcnJheSBhbmQgYXVnbWVudHMgaXQgd2l0aCB0aGUgYWJvdmUgbWV0aG9kc1xyXG5cclxuXHR2YXIgbGlzdCA9ICguLi5hcmdzKSA9PiB7XHJcblx0XHQvL0FjY2VwdCBhbiBhcnJheVxyXG5cdFx0aWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkgKXtcclxuXHRcdFx0cmV0dXJuICBPYmplY3QuZnJlZXplKGV4dGVuZChhcmdzWzBdLCBsaXN0X21ldGhvZHMpKVxyXG5cdFx0Ly9BY2NlcHQgc2V2ZXJhbCBhcmd1bWVudHNcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShleHRlbmQoYXJncywgbGlzdF9tZXRob2RzKSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGxpc3Qgb2JqZWN0IGlzIGV4dGVuZGVkXHJcblxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3QvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuLyogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5VbmRlciB0aGUgaG9vZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbi0tLS0tLS0tLS0tLS0tICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuTGV0J3Mgc2VlIGhvdyB0aGlzIHR5cGUgaXMgaW1wbGVtZW50ZWQgICAgIFxyXG4qLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG52YXIgbWF5YmVfcHJvdG8gPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIGBtYXliZWAuXHJcbi8vSW4gdGhpcyBjYXNlIHdlIGRvIHRoaXMgYnkganVzdCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3Rvci5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBtYXliZShpbnB1dClcclxuXHR9LFxyXG5cclxuLy9gbWFwYCB0YWtlcyB0aGUgZnVuY3Rpb24gYW5kIGFwcGxpZXMgaXQgdG8gdGhlIHZhbHVlIGluIHRoZSBtYXliZSwgaWYgdGhlcmUgaXMgb25lLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gbWF5YmUoZnVuayh0aGlzLl92YWx1ZSkpXHJcblx0XHR9ZWxzZXtcdFxyXG5cdFx0XHRyZXR1cm4gdGhpcyBcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nICYmIHRoaXMuX3ZhbHVlLmNvbnN0cnVjdG9yID09PSBtYXliZSl7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG59KS8vLS1cclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBtYXliZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHJcblx0dmFyIG1heWJlID0gZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpe1xyXG5cdFx0XHRyZXR1cm4gbm90aGluZ1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1heWJlX3Byb3RvKVxyXG5cdFx0XHRvYmouX3ZhbHVlID0gdmFsdWVcclxuXHRcdFx0b2JqLmNvbnN0cnVjdG9yID0gbWF5YmVcclxuXHRcdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRcdHJldHVybiBvYmpcclxuXHRcdH1cclxuXHR9XHJcblxyXG52YXIgbm90aGluZyA9IE9iamVjdC5jcmVhdGUobWF5YmVfcHJvdG8pLy8tLVxyXG5ub3RoaW5nLmNvbnN0cnVjdG9yID0gbWF5YmUvLy0tXHJcbk9iamVjdC5mcmVlemUobm90aGluZykvLy0tXHJcbm1heWJlLm5vdGhpbmcgPSBub3RoaW5nLy8tLVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtYXliZS8vLS1cclxuIiwidmFyIGYgPSByZXF1aXJlKFwiLi9mXCIpXHJcblxyXG5cclxudmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpXHJcblxyXG52YXIgc3RhdGVfcHJvdG8gPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoe1xyXG5cclxuLy9BcyB1c3VhbCwgdGhlIGBvZmAgZnVuY3Rpb24gaXMgdHJpdmlhbFxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24oaW5wdXQpe1xyXG5cdFx0cmV0dXJuIHN0YXRlKGlucHV0KVxyXG5cdH0sXHJcblxyXG4vL2BtYXBgIGlzIGRvbmUgYnkgYXBwbHlpbmcgdGhlIGZ1bmN0aW9uIHRvIHRoZSB2YWx1ZSBhbmQga2VlcGluZyB0aGUgc3RhdGUgdW5jaGFuZ2VkLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdHJldHVybiBzdGF0ZShmdW5rKHRoaXMuX3ZhbHVlKSh0aGlzLl9zdGF0ZSksIHRoaXMuX3N0YXRlKVxyXG5cdH0sXHJcblx0XHJcbi8vYGZsYXRgIGxvb2tzIGEgbGl0dGxlIGJpdCBkaWZmaWN1bHQsIGJlY2F1c2Ugd2UgaGF2ZSB0byB0YWtlIGNhcmUgb2YgYW4gZXh0cmEgdmFsdWUsXHJcbi8vYnV0IGl0IGlzIGFjdHVhbGx5IG5vdGhpbmcgbW9yZSB0aGFuIGEgZnVuY3Rpb24gdGhhdCB0dXJuczpcclxuXHJcblx0LypcclxuXHR7XHJcblx0XHRfdmFsdWU6e1xyXG5cdFx0XHRfdmFsdWU6eCxcclxuXHRcdFx0X3N0YXRlOnMyXHJcblx0XHR9XHJcblx0XHRzdGF0ZTpzMVxyXG5cdH1cclxuXHRcclxuaW50bzpcclxuXHRcclxuXHR7XHJcblx0XHRfdmFsdWU6eCxcclxuXHRcdHN0YXRlOiBzMSA9PiBzMlxyXG5cdH1cclxuXHRcclxuXHQqL1xyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0Y29uc29sZS5sb2codGhpcy5fdmFsdWUuX3N0YXRlKHt9KSlcclxuXHRcdHJldHVybiBzdGF0ZSh0aGlzLl92YWx1ZS5fdmFsdWUsIHRoaXMuX3N0YXRlLm1hcCh0aGlzLl92YWx1ZS5fc3RhdGUpKVxyXG5cdH0sXHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHJcblx0XHRpZih0aGlzLl92YWx1ZS5wcm90b3R5cGUgPT09IHN0YXRlX3Byb3RvKXtcclxuXHRcdFx0XHJcblx0XHRcdHJldHVybiBzdGF0ZSh0aGlzLl92YWx1ZS5fdmFsdWUsIHRoaXMuX3N0YXRlLm1hcCh0aGlzLl92YWx1ZS5fc3RhdGUpKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHRcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9XZSBoYXZlIHRoZSBgcnVuYCBmdW5jdGlvbiB3aGljaCBjb21wdXRlcyB0aGUgc3RhdGU6XHJcblxyXG5cdHJ1bjpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuX3N0YXRlKHt9KVxyXG5cdH1cclxuXHRcclxuXHRcclxufSlcclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBzdGF0ZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHR2YXIgc3RhdGUgPSBmdW5jdGlvbih2YWx1ZSwgc3RhdGUpe1xyXG5cdFx0dmFyIG9iaiA9IE9iamVjdC5jcmVhdGUoc3RhdGVfcHJvdG8pXHJcblx0XHRvYmouX3ZhbHVlID0gdmFsdWVcclxuXHRcdG9iai5fc3RhdGUgPSBmKHN0YXRlLCAxKVxyXG5cdFx0b2JqLmNvbnN0cnVjdG9yID0gc3RhdGVcclxuXHRcdG9iai5wcm90b3R5cGUgPSBzdGF0ZV9wcm90b1xyXG5cdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRyZXR1cm4gb2JqXHJcblx0fVxyXG5cclxuc3RhdGUud3JpdGUgPSBmKGZ1bmN0aW9uKGtleSwgdmFsLCBzdGF0ZSl7IHN0YXRlW2tleV0gPSB2YWw7IHJldHVybiBzdGF0ZTt9KVxyXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlLy8tLVxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IGZ1bmN0aW9uXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBmdW5jdGlvbiBtb25hZCBhdWdtZW50cyBzdGFuZGFyZCBKYXZhU2NyaXB0IGZ1bmN0aW9ucyB3aXRoIGNvbXBvc2l0aW9uIGFuZCBjdXJyeWluZy5cclxuPCEtLW1vcmUtLT5cclxuXHJcbiovXHJcblFVbml0Lm1vZHVsZShcImZ1bmN0aW9uc1wiKS8vLS1cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIilcclxuXHRcdHZhciBmdW5rdGlvbiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2Z1bmt0aW9uXCIpXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIGNvbnN0cnVjdCBmdW5jdGlvbnMgbGluZSB0aGlzXHJcblx0XHJcblx0XHR2YXIgcGx1c18xID0gZiggKG51bSkgPT4gbnVtKzEgKVxyXG5cclxuXHJcbi8vQWZ0ZXIgeW91IGRvIHRoYXQsIHlvdSB3aWxsIHN0aWxsIGJlIGFibGUgdG8gdXNlIGBwbHVzXzFgIGxpa2UgYSBub3JtYWwgZnVuY3Rpb24sIGJ1dCB5b3UgY2FuIGFsc28gZG8gdGhlIGZvbGxvd2luZzpcclxuXHJcblxyXG4vKlxyXG5DdXJyeWluZ1xyXG4tLS0tXHJcbldoZW4geW91IGNhbGwgYSBmdW5jdGlvbiBgZmAgd2l0aCBsZXNzIGFyZ3VtZW50cyB0aGF0IGl0IGFjY2VwdHMsIGl0IHJldHVybnMgYSBwYXJ0aWFsbHkgYXBwbGllZFxyXG4oYm91bmQpIHZlcnNpb24gb2YgaXRzZWxmIHRoYXQgbWF5IGF0IGFueSB0aW1lIGJlIGNhbGxlZCB3aXRoIHRoZSByZXN0IG9mIHRoZSBhcmd1bWVudHMuXHJcbiovXHJcblxyXG5cdFFVbml0LnRlc3QoXCJjdXJyeVwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdHZhciBhZGRfMyA9IGYoZnVuY3Rpb24oYSxiLGMpe3JldHVybiBhK2IrY30pXHJcblx0XHRcclxuXHRcdHZhciBhZGRfMiA9IGFkZF8zKDApXHJcblx0XHRhc3NlcnQuZXF1YWwodHlwZW9mIGFkZF8yLCBcImZ1bmN0aW9uXCIsIFwiY3VycmllZCBmdW5jdGlvbnMgcmV0dXJuIG90aGVyIGZ1bmN0aW9ucyB3aGVuIHRoZSBhcmd1bWVudHMgYXJlIG5vdCBlbm91Z2hcIilcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGFkZF8yKDEpKDEpLCAyLCBcIndoZW4gdGhlIGFyZ3VtZW50cyBhcmUgZW5vdWdoIGEgcmVzdWx0IGlzIHJldHVybmVkLlwiKVxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxubWFwKGZ1bmspXHJcbi0tLS1cclxuY3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdCwgdGhlbiBjYWxscyBgZnVua2Agd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudDpcclxuKi9cclxuXHRRVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0XHJcbi8vWW91IGNhbiBjcmVhdGUgYSBGdW5jdGlvbiBNb25hZCBieSBwYXNzaW5nIGEgbm9ybWFsIEphdmFTY3JpcHQgZnVuY3Rpb24gdG8gdGhlIGNvbnN0cnVjdG9yICh5b3UgY2FuIHdyaXRlIHRoZSBmdW5jdGlvbiBkaXJlY3RseSB0aGVyZSk6XHJcblx0XHRcclxuXHRcdHZhciBwbHVzXzEgPSBmKCAobnVtKSA9PiBudW0rMSApXHJcblxyXG5cclxuLy9UaGVuIG1ha2luZyBhbm90aGVyIGZ1bnh0aW9uIGlzIGVhc3k6XHJcblxyXG5cdFx0dmFyIHBsdXNfMiA9IHBsdXNfMS5tYXAocGx1c18xKSBcclxuXHJcblx0XHRhc3NlcnQuZXF1YWwocGx1c18yKDApLCAyLCBcIk5ldyBmdW5jdGlvbnMgY2FuIGJlIGNvbXBvc2VkIGZyb20gb3RoZXIgZnVuY3Rpb25zLlwiKVxyXG5cdFx0XHJcblx0XHR2YXIgcGx1c180ID0gcGx1c18yLm1hcChwbHVzXzIpXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKHBsdXNfNCgxKSwgNSwgXCJjb21wb3NlZCBmdW5jdGlvbnMgY2FuIGJlIGNvbXBvc2VkIGFnYWluLlwiKVxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbmZsYXRNYXAoZnVuaylcclxuLS0tLVxyXG5BIG1vcmUgcG93ZXJmdWwgdmVyc2lvbiBvZiBgbWFwYC4gQWNjZXB0cyBhIGZ1bmt0aW9uIHdoaWNoIHJldHVybnMgYW5vdGhlciBmdW5jdGlvbi4gUmV0dXJucyBhIGZ1bmN0aW9uIHdoaWNoIGNhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdCxcclxuYW5kIHRoZW4gaXRcclxuMS4gQ2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnRcclxuMi4gQ2FsbHMgdGhlIGZ1bmN0aW9uIHJldHVybmVkIGJ5IGBmdW5rYCwgd2l0aCB0aGUgc2FtZSBhcmd1bWVudCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0IG9mIHRoZSBzZWNvbmQgY2FsbC5cclxuKi9cclxuXHRRVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vWW91IGNhbiB1c2UgYGZsYXRNYXBgIHRvIG1vZGVsIHNpbXBsZSBpZi10aGVuIHN0YXRlbWVudHMuIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSB1c2VzIGl0IGluIGNvbWJpbmF0aW9uIG9mIHRoZSBjdXJyeWluZyBmdW5jdGlvbmFsaXR5OlxyXG5cdFx0XHJcblx0XHR2YXIgY29uY2F0ID0gZigoc3RyMSwgc3RyMikgPT4gc3RyMSArIHN0cjIpXHJcblx0XHR2YXIgbWFrZU1lc3NhZ2UgPSBmKHBhcnNlSW50LCAxKS5mbGF0TWFwKChudW0pID0+IHtjb25zb2xlLmxvZyhcIm51bSBcIitudW0pOyBcclxuXHRcdHJldHVybiBpc05hTihudW0pPyBmKFwiSW52YWxpZCBudW1iZXJcIikgOiBjb25jYXQoXCJUaGUgbnVtYmVyIGlzIFwiKX0gKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIxXCIpLCBcIlRoZSBudW1iZXIgaXMgMVwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMlwiKSwgXCJUaGUgbnVtYmVyIGlzIDJcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIk5vdCBhIG51bWJlclwiKSwgXCJJbnZhbGlkIG51bWJlclwiKVxyXG5cclxuLypcclxuXHJcbmBmbGF0TWFwYCBpcyBzaW1pbGFyIHRvIHRoZSBgPj49YCBmdW5jdGlvbiBpbiBIYXNrZWxsLCB3aGljaCBpcyB0aGUgYnVpbGRpbmcgYmxvY2sgb2YgdGhlIGluZmFtb3VzIGBkb2Agbm90YXRpb25cclxuSXQgY2FuIGJlIHVzZWQgdG8gd3JpdGUgcHJvZ3JhbXMgd2l0aG91dCB1c2luZyBhc3NpZ25tZW50Llx0XHJcblxyXG5Gb3IgZXhhbXBsZSBpZiB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaW4gSGFza2VsbDpcclxuXHJcblx0XHRhZGRTdHVmZiA9IGRvICBcclxuXHRcdFx0YSA8LSAoKjIpICBcclxuXHRcdFx0YiA8LSAoKzEwKSAgXHJcblx0XHRcdHJldHVybiAoYStiKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHJcbldoZW4gd2UgZGVzdWdhciBpdCwgdGhpcyBiZWNvbWVzOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gKCoyKSA+Pj0gXFxhIC0+XHJcblx0XHRcdFx0KCsxMCkgPj49IFxcYiAtPlxyXG5cdFx0XHRcdFx0cmV0dXJuIChhK2IpXHJcblxyXG5vciBpbiBKYXZhU2NyaXB0IHRlcm1zOlxyXG5cclxuKi9cclxuXHJcblx0XHR2YXIgYWRkU3R1ZmYgPSBmKCAobnVtKSA9PiBudW0gKiAyICkuZmxhdE1hcCggKGEpID0+XHJcblx0XHRcdFx0ICBmKCAobnVtKSA9PiBudW0gKyAxMCApLmZsYXRNYXAoIChiKSA9PlxyXG5cdFx0XHRcdFx0Zi5vZihhICsgYikgKSApXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cdH0pLy8tLVxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IGxpc3QgXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgbGlzdGAgdHlwZSwgYXVnbWVudHMgdGhlIHN0YW5kYXJkIEphdmFTY3JpcHQgYXJyYXlzLCBtYWtpbmcgdGhlbSBpbW11dGFibGUgYW5kIGFkZGluZyBhZGRpdGlvbmFsIGZ1bmN0aW9uYWxpdHkgdG8gdGhlbVxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiTGlzdFwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBsaXN0YCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBsaXN0ID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbGlzdFwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjcmVhdGUgYSBgbGlzdGAgZnJvbSBhcnJheSBsaWtlIHRoaXNcclxuXHRcdHZhciBteV9saXN0ID0gbGlzdChbMSwyLDNdKVxyXG4vL29yIGxpa2UgdGhpczpcclxuXHRcdHZhciBteV9saXN0ID0gbGlzdCgxLDIsMylcclxuXHJcbi8qXHJcbm1hcChmdW5rKVxyXG4tLS0tXHJcblN0YW5kYXJkIGFycmF5IG1ldGhvZC4gRXhlY3V0ZXMgYGZ1bmtgIGZvciBlYWNoIG9mIHRoZSB2YWx1ZXMgaW4gdGhlIGxpc3QgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbGlzdC5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdHZhciBwZW9wbGUgPSBsaXN0KCB7bmFtZTpcImpvaG5cIiwgYWdlOjI0LCBvY2N1cGF0aW9uOlwiZmFybWVyXCJ9LCB7bmFtZTpcImNoYXJsaWVcIiwgYWdlOjIyLCBvY2N1cGF0aW9uOlwicGx1bWJlclwifSlcclxuXHR2YXIgbmFtZXMgPSBwZW9wbGUubWFwKChwZXJzb24pID0+IHBlcnNvbi5uYW1lIClcclxuXHRhc3NlcnQuZGVlcEVxdWFsKG5hbWVzLCBbXCJqb2huXCIsIFwiY2hhcmxpZVwiXSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxucGhhdE1hcChmdW5rKVxyXG4tLS0tXHJcblxyXG5TYW1lIGFzIGBtYXBgLCBidXQgaWYgYGZ1bmtgIHJldHVybnMgYSBsaXN0IG9yIGFuIGFycmF5IGl0IGZsYXR0ZW5zIHRoZSByZXN1bHRzIGludG8gb25lIGFycmF5XHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJmbGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFxyXG5cdHZhciBvY2N1cGF0aW9ucyA9IGxpc3QoWyBcclxuXHRcdHtvY2N1cGF0aW9uOlwiZmFybWVyXCIsIHBlb3BsZTpbXCJqb2huXCIsIFwic2FtXCIsIFwiY2hhcmxpZVwiXSB9LFxyXG5cdFx0e29jY3VwYXRpb246XCJwbHVtYmVyXCIsIHBlb3BsZTpbXCJsaXNhXCIsIFwic2FuZHJhXCJdIH0sXHJcblx0XSlcclxuXHRcclxuXHR2YXIgcGVvcGxlID0gb2NjdXBhdGlvbnMucGhhdE1hcCgob2NjdXBhdGlvbikgPT4gb2NjdXBhdGlvbi5wZW9wbGUpXHJcblx0YXNzZXJ0LmRlZXBFcXVhbChwZW9wbGUsW1wiam9oblwiLCBcInNhbVwiLCBcImNoYXJsaWVcIiwgXCJsaXNhXCIsIFwic2FuZHJhXCJdKVxyXG5cclxufSkvLy0tXHJcblxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IG1heWJlXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgbWF5YmVgIHR5cGUsIGFsc28ga25vd24gYXMgYG9wdGlvbmAgdHlwZSBpcyBhIGNvbnRhaW5lciBmb3IgYSB2YWx1ZSB0aGF0IG1heSBub3QgYmUgdGhlcmUuIFxyXG5cclxuVGhlIHB1cnBvc2Ugb2YgdGhpcyBtb25hZCBpcyB0byBlbGltaW5hdGUgdGhlIG5lZWQgZm9yIHdyaXRpbmcgYG51bGxgIGNoZWNrcy4gZnVydGhlcm1vcmUgaXQgYWxzbyBlbGltaW5hdGVzIHRoZSBwb3NzaWJpbGl0eSBvZiBtYWtpbmcgZXJyb3JzIGJ5IG1pc3NpbmcgbnVsbC1jaGVja3MuXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJNYXliZVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBtYXliZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbWF5YmUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byB3cmFwIGEgdmFsdWUgaW4gYG1heWJlYCB3aXRoOlxyXG5cdFx0dmFyIHZhbCA9IDQvLy0tXHJcblx0XHR2YXIgbWF5YmVfdmFsID0gbWF5YmUodmFsKVxyXG5cclxuLy9JZiB0aGUgJ3ZhbCcgaXMgZXF1YWwgdG8gKnVuZGVmaW5lZCogaXQgdGhyZWF0cyB0aGUgY29udGFpbmVyIGFzIGVtcHR5LlxyXG5cclxuLypcclxubWFwKGZ1bmspXHJcbi0tLS1cclxuRXhlY3V0ZXMgYGZ1bmtgIHdpdGggdGhlIGBtYXliZWAncyB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgYnV0IG9ubHkgaWYgdGhlIHZhbHVlIGlzIGRpZmZlcmVudCBmcm9tICp1bmRlZmluZWQqLCBhbmQgd3JhcHMgdGhlIHJlc3VsdCBpbiBhIG5ldyBtYXliZS5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9UcmFkaXRpb25hbGx5LCBpZiB3ZSBoYXZlIGEgdmFsdWUgdGhhdCBtYXkgYmUgdW5kZWZpbmVkIHdlIGRvIGEgbnVsbCBjaGVjayBiZWZvcmUgZG9pbmcgc29tZXRoaW5nIHdpdGggaXQ6XHJcblxyXG5cdHZhciBvYmogPSB7fS8vLS1cclxuXHR2YXIgZ2V0X3Byb3BlcnR5ID0gZigob2JqZWN0KSA9PiBvYmplY3QucHJvcGVydHkpLy8tLVxyXG5cdFxyXG5cdHZhciB2YWwgPSBnZXRfcHJvcGVydHkob2JqKVxyXG5cdFxyXG5cdGlmKHZhbCAhPT0gdW5kZWZpbmVkKXtcclxuXHRcdHZhbCA9IHZhbC50b1N0cmluZygpXHJcblx0fVxyXG5cdGFzc2VydC5lcXVhbCh2YWwsIHVuZGVmaW5lZCkgXHJcblxyXG4vL1dpdGggYG1hcGAgdGhpcyBjYW4gYmUgd3JpdHRlbiBsaWtlIHRoaXNcclxuXHJcbiBcdHZhciBtYXliZV9nZXRfcHJvcGVydHkgPSBnZXRfcHJvcGVydHkubWFwKG1heWJlKVxyXG5cclxuXHRtYXliZV9nZXRfcHJvcGVydHkob2JqKS5tYXAoKHZhbCkgPT4ge1xyXG5cdFx0YXNzZXJ0Lm9rKGZhbHNlKS8vLS1cclxuXHRcdHZhbC50b1N0cmluZygpLy90aGlzIGlzIG5vdCBleGVjdXRlZFxyXG5cdH0pXHJcblxyXG4vL1RoZSBiaWdnZXN0IGJlbmVmaXQgd2UgZ2V0IGlzIHRoYXQgaW4gdGhlIGZpcnN0IGNhc2Ugd2UgY2FuIGVhc2lseSBmb3JnZXQgdGhlIG51bGwgY2hlY2s6XHJcblx0XHJcblx0YXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe1xyXG5cdFx0Z2V0X3Byb3BlcnR5KG9iaikudG9TdHJpbmcoKSAgLy90aGlzIGJsb3dzIHVwXHJcblx0fSlcclxuXHJcbi8vV2hpbGUgaW4gdGhlIHNlY29uZCBjYXNlIHdlIGNhbm5vdCBhY2Nlc3MgdGhlIHVuZGVybHlpbmcgdmFsdWUgZGlyZWN0bHksIGFuZCB0aGVyZWZvcmUgY2Fubm90IGV4ZWN1dGUgYW4gYWN0aW9uIG9uIGl0LCBpZiBpdCBpcyBub3QgdGhlcmUuXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnBoYXRNYXAoZnVuaylcclxuLS0tLVxyXG5cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgYG1heWJlYCBpdCBmbGF0dGVucyB0aGUgdHdvIGBtYXliZXNgIGludG8gb25lLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vYG1hcGAgd29ya3MgZmluZSBmb3IgZWxpbWluYXRpbmcgZXJyb3JzLCBidXQgZG9lcyBub3Qgc29sdmUgb25lIG9mIHRoZSBtb3N0IGFubm95aW5nIHRoaW5ncyB0aGVyZSBhcmUgd2l0aCBudWxsLWNoZWNrcyAtIG5lc3Rpbmc6XHJcblxyXG5cdHZhciBvYmogPSB7IGZpcnN0OiB7c2Vjb25kOlwidmFsXCIgfSB9XHJcblx0XHJcblx0bWF5YmUob2JqKVxyXG5cdFx0Lm1hcCggKHJvb3QpID0+IG1heWJlKHJvb3QuZmlyc3QpKVxyXG5cdFx0Lm1hcCggKG1heWJlRmlyc3QpID0+IG1heWJlRmlyc3QubWFwIChmaXJzdCA9PiBtYXliZSAoIG1heWJlRmlyc3Quc2Vjb25kICkgKSApIFxyXG5cdFx0Lm1hcCggKG1heWJlTWF5YmVWYWx1ZSkgPT4gbWF5YmVNYXliZVZhbHVlLm1hcCAoICggbWF5YmVWYWx1ZSkgPT4gbWF5YmVWYWx1ZS5tYXAoICh2YWx1ZSk9PiggYXNzZXJ0LmVxdWFsKCB2YWwsIFwidmFsXCIpICkgKSApIClcclxuXHJcbi8vYHBoYXRNYXBgIGRvZXMgdGhlIGZsYXR0ZW5pbmcgZm9yIHVzLCBhbmQgYWxsb3dzIHVzIHRvIHdyaXRlIGNvZGUgbGlrZSB0aGlzXHJcblxyXG5cdG1heWJlKG9iailcclxuXHRcdC5mbGF0TWFwKChyb290KSA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5mbGF0TWFwKChmaXJzdCkgPT4gbWF5YmUoZmlyc3Quc2Vjb25kKSlcclxuXHRcdC5mbGF0TWFwKCh2YWwpID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKHZhbCwgXCJ2YWxcIilcclxuXHRcdH0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbkFkdmFuY2VkIFVzYWdlXHJcbi0tLS1cclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJhZHZhbmNlZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuLy8gYG1heWJlYCBjYW4gYmUgdXNlZCB3aXRoIHRoZSBmdW5jdGlvbiBtb25hZCB0byBlZmZlY3RpdmVseSBwcm9kdWNlICdzYWZlJyB2ZXJzaW9ucyBvZiBmdW5jdGlvbnNcclxuXHJcblx0dmFyIGdldCA9IGYoKHByb3AsIG9iaikgPT4gb2JqW3Byb3BdKVxyXG5cdHZhciBtYXliZUdldCA9IGdldC5tYXAobWF5YmUpXHJcblxyXG4vL1RoaXMgY29tYmluZWQgd2l0aCB0aGUgdXNlIG9mIGN1cnJ5aW5nIG1ha2VzIGZvciBhIHZlcnkgZmx1ZW50IHN0eWxlIG9mIGNvZGluZzpcclxuXHJcblx0dmFyIGdldEZpcnN0U2Vjb25kID0gKHJvb3QpID0+IG1heWJlKHJvb3QpLnBoYXRNYXAobWF5YmVHZXQoJ2ZpcnN0JykpLnBoYXRNYXAobWF5YmVHZXQoJ3NlY29uZCcpKVxyXG5cdFxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ2YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwib3RoZXJfdmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwib3RoZXJfdmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDogXCJcIiB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIndoYXRldmVyXCIpICkvL3dvbid0IGJlIGV4ZWN1dGVkIFxyXG5cclxufSkvLy0tXHJcblxyXG5cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogc3RhdGVcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBzdGF0ZWAgdHlwZSwgYWxzbyBcclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIlN0YXRlXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYHN0YXRlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBzdGF0ZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0YXRlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIHdyYXAgYSB2YWx1ZSBpbiBgc3RhdGVgIHdpdGg6XHJcblxyXG4vKlxyXG5tYXAoZnVuaylcclxuLS0tLVxyXG5FeGVjdXRlcyBgZnVua2Agd2l0aCB0aGUgYHN0YXRlYCdzIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBidXQgb25seSBpZiB0aGUgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gKnVuZGVmaW5lZCosIGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IHN0YXRlLlxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJzdGF0ZVwiLCBmdW5jdGlvbihhc3NlcnQpe1xyXG5cclxuXHR2YXIgbXlfc3RhdGUgPSBzdGF0ZSg1KVxyXG5cdC5waGF0TWFwKCh2YWwpID0+IChjdXJyZW50X3N0YXRlKSA9PiB2YWwrMSlcclxuXHQucGhhdE1hcCgodmFsKSA9PiAoY3VycmVudF9zdGF0ZSkgPT4gc3RhdGUodmFsLCBzdGF0ZS53cml0ZShcImtleVwiLCB2YWwpKSlcclxuXHQucnVuKClcclxuXHRhc3NlcnQuZGVlcEVxdWFsKG15X3N0YXRlLCB7a2V5OjZ9KVxyXG5cclxufSlcclxuIl19
