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

	//(a -> b) => (b -> c) => a -> c
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

	//(b -> (b -> c)) => a -> b
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

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

var f = require("./f");

var helpers = require("./helpers");

var state_proto = helpers.add_missing_methods({

	//As usual, the `of` function is trivial

	//a -> m a
	of: function of(input) {
		return state(function (prevState) {
			return [input, prevState];
		});
	},

	//`map` is done by applying the function to the value and keeping the state unchanged.

	//m a -> ( a -> b ) -> m b
	map: function map(funk) {
		return state(this._state.map(function (_ref) {
			var _ref2 = _slicedToArray(_ref, 2);

			var input = _ref2[0];
			var prevState = _ref2[1];
			return [funk(input), prevState];
		}));
	},

	//`flat` looks a little bit difficult, because we have to take care of an extra value,

	//m (m x) -> m x
	flat: function flat() {
		return this._state({})[0];
	},
	tryFlat: function tryFlat() {
		return this._state({})[0];
	},

	//We have the `run` function which computes the state:

	run: function run() {
		return this._state({})[0];
	},
	get: function get() {
		return this._state({})[1]({});
	}

});

//In case you are interested, here is how the state constructor is implemented

var state = function state(_state) {
	var obj = Object.create(state_proto);
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

	var my_state = state().of(5).map(function (val) {
		return val + 1;
	}).phatMap(function (val) {
		return state(function (current_state) {
			return [val, state.write("key", val)];
		});
	});

	assert.deepEqual(my_state.get(), { key: 6 });
});

},{"../library/f":1,"../library/state":6}]},{},[7,8,9,10])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvZnVua3Rpb24uanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9oZWxwZXJzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvbGlzdC5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L21heWJlLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvc3RhdGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvZl90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9saXN0X3Rlc3RzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL21heWJlX3Rlc3RzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL3N0YXRlX3Rlc3RzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7Ozs7OztBQU9qQyxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUM7Ozs7OztBQU0zQyxHQUFFLEVBQUUsWUFBQSxHQUFHO1NBQUksQ0FBQyxDQUFFO1VBQU0sR0FBRztHQUFBLENBQUU7RUFBQTs7Ozs7QUFLekIsSUFBRyxFQUFFLGFBQVMsSUFBSSxFQUFDOzs7QUFDbEIsTUFBRyxJQUFJLEtBQUssU0FBUyxFQUFDO0FBQUMsU0FBTSxJQUFJLFNBQVMsRUFBQSxDQUFBO0dBQUM7QUFDM0MsU0FBTyxDQUFDLENBQUU7cUNBQUksSUFB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QUFDLENBQUE7QUFDaEcsZUFBYyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUMsR0FBRztTQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFDLFVBQVUsQ0FBQztFQUFBLENBQUUsQ0FBQTtDQUV6RSxDQUFDLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzdHRixLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFBOzs7O0FBTW5CLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFBO0FBQ3ZDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTs7Ozs7Ozs7Ozs7OztBQWFqQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFTLE1BQU0sRUFBQzs7QUFFbkMsS0FBSSxRQUFRLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUMzQixHQUFHLENBQUMsVUFBQyxHQUFHO1NBQUssR0FBRyxHQUFDLENBQUM7RUFBQSxDQUFDLENBQ25CLE9BQU8sQ0FBQyxVQUFDLEdBQUc7U0FBTSxLQUFLLENBQUMsVUFBQyxhQUFhO1VBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FBQSxDQUFFO0VBQUEsQ0FBRSxDQUFBOztBQUU5RSxPQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFBO0NBRXpDLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblx0dmFyIGZfbWV0aG9kcyA9IGhlbHBlcnMuYWRkX21pc3NpbmdfbWV0aG9kcyh7Ly8tLVxyXG5cclxuLy90aGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgaXQuXHJcbi8vdGhpcyBpcyB2ZXJ5IHVzZWZ1bCBpZiB5b3UgaGF2ZSBhIGFwaSB3aGljaCBleHBlY3RzIGEgZnVuY3Rpb24sIGJ1dCB5b3Ugd2FudCB0byBmZWVkIGl0IHdpdGggYSB2YWx1ZSAoc2VlIHRoZSBgZmxhdG1hcGAgZXhhbXBsZSkuIFxyXG5cclxuXHRcdC8vYS5vZihiKSAtPiBiIGFcclxuXHRcdG9mOiB2YWwgPT4gZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpID0+IChiIC0+IGMpID0+IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkgPT4gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcblx0dmFyIGlkID0gZnVuY3Rpb24oYSl7cmV0dXJuIGF9XHJcblxyXG5cclxuLy9UaGlzIGlzIHRoZSBmdW5jdGlvbiBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgYSBmdW5jdGlvbiBhbmQgYWRkcyBhbiBhdWdtZW50ZWQgZnVuY3Rpb24gb2JqZWN0LCB3aXRob3V0IGV4dGVuZGluZyB0aGUgcHJvdG90eXBlXHJcblxyXG5cdHZhciBmID0gKGZ1bmsgPSBpZCwgbGVuZ3RoID0gZnVuay5sZW5ndGgsIGluaXRpYWxfYXJndW1lbnRzID0gW10pID0+IHtcclxuXHJcblx0XHQvL1dlIGV4cGVjdCBhIGZ1bmN0aW9uLiBJZiB3ZSBhcmUgZ2l2ZW4gYW5vdGhlciB2YWx1ZSwgbGlmdCBpdCB0byBhIGZ1bmN0aW9uXHJcblx0XHRpZih0eXBlb2YgZnVuayAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdHJldHVybiBmKCkub2YoZnVuaylcclxuXHRcdFxyXG5cdFx0Ly9JZiB0aGUgZnVuY3Rpb24gdGFrZXMganVzdCBvbmUgYXJndW1lbnQsIGp1c3QgZXh0ZW5kIGl0IHdpdGggbWV0aG9kcyBhbmQgcmV0dXJuIGl0LlxyXG5cdFx0fWVsc2UgaWYgKCBsZW5ndGggPCAyICl7XHJcblx0XHRcdHJldHVybiBleHRlbmQoZnVuaywgZl9tZXRob2RzKVxyXG5cclxuXHRcdC8vRWxzZSwgcmV0dXJuIGEgY3VycnktY2FwYWJsZSB2ZXJzaW9uIG9mIHRoZSBmdW5jdGlvbiAoYWdhaW4sIGV4dGVuZGVkIHdpdGggdGhlIGZ1bmN0aW9uIG1ldGhvZHMpXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0dmFyIGV4dGVuZGVkX2Z1bmsgPSBleHRlbmQoICguLi5hcmdzKSA9PiB7XHJcblx0XHRcdFx0dmFyIGFsbF9hcmd1bWVudHMgID0gKGluaXRpYWxfYXJndW1lbnRzKS5jb25jYXQoYXJncylcdFxyXG5cdFx0XHRcdHJldHVybiBhbGxfYXJndW1lbnRzLmxlbmd0aD49bGVuZ3RoP2Z1bmsoLi4uYWxsX2FyZ3VtZW50cyk6ZihmdW5rLCBsZW5ndGgsIGFsbF9hcmd1bWVudHMpXHJcblx0XHRcdH0sIGZfbWV0aG9kcylcclxuXHRcdFx0XHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX2xlbmd0aCA9IGxlbmd0aCAtIGluaXRpYWxfYXJndW1lbnRzLmxlbmd0aFxyXG5cdFx0XHRleHRlbmRlZF9mdW5rLl9vcmlnaW5hbCA9IGZ1bmtcclxuXHJcblx0XHRcdHJldHVybiBleHRlbmRlZF9mdW5rXHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9IZXJlIGlzIHRoZSBmdW5jdGlvbiB3aXRoIHdoaWNoIHRoZSBmdW5jdGlvbiBvYmplY3QgaXMgZXh0ZW5kZWRcclxuXHJcblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0XHRyZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKGZ1bmN0aW9uKG9iaiwgbWV0aG9kX25hbWUpe29ialttZXRob2RfbmFtZV0gPSBtZXRob2RzW21ldGhvZF9uYW1lXTsgcmV0dXJuIG9ian0sIG9iailcclxuXHR9XHJcblxyXG5cdFxyXG5cdGYub2YgPSB2YWwgPT4gZiggKCkgPT4gdmFsICksXHJcblxyXG4vL1RoZSBsaWJyYXJ5IGFsc28gZmVhdHVyZXMgYSBzdGFuZGFyZCBjb21wb3NlIGZ1bmN0aW9uIHdoaWNoIGFsbG93cyB5b3UgdG8gbWFwIG5vcm1hbCBmdW5jdGlvbnMgd2l0aCBvbmUgYW5vdGhlclxyXG5cclxuXHRmLmNvbXBvc2UgPSBmdW5jdGlvbigpe1xyXG5cclxuXHRcdC8vQ29udmVydCBmdW5jdGlvbnMgdG8gYW4gYXJyYXkgYW5kIGZsaXAgdGhlbSAoZm9yIHJpZ2h0LXRvLWxlZnQgZXhlY3V0aW9uKVxyXG5cdFx0dmFyIGZ1bmN0aW9ucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykucmV2ZXJzZSgpXHJcblx0XHQvL0NoZWNrIGlmIGlucHV0IGlzIE9LOlxyXG5cdFx0ZnVuY3Rpb25zLmZvckVhY2goZnVuY3Rpb24oZnVuayl7aWYodHlwZW9mIGZ1bmsgIT09IFwiZnVuY3Rpb25cIil7dGhyb3cgbmV3IFR5cGVFcnJvcihmdW5rK1wiIGlzIG5vdCBhIGZ1bmN0aW9uXCIgKX19KVxyXG5cdFx0Ly9SZXR1cm4gdGhlIGZ1bmN0aW9uIHdoaWNoIGNvbXBvc2VzIHRoZW1cclxuXHRcdHJldHVybiBmdW5jdGlvbigpe1xyXG5cdFx0XHQvL1Rha2UgdGhlIGluaXRpYWwgaW5wdXRcclxuXHRcdFx0dmFyIGlucHV0ID0gYXJndW1lbnRzXHJcblx0XHRcdHZhciBjb250ZXh0XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbnMucmVkdWNlKGZ1bmN0aW9uKHJldHVybl9yZXN1bHQsIGZ1bmssIGkpeyBcclxuXHRcdFx0XHQvL0lmIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZXJhdGlvbiwgYXBwbHkgdGhlIGFyZ3VtZW50cyB0aGF0IHRoZSB1c2VyIHByb3ZpZGVkXHJcblx0XHRcdFx0Ly9lbHNlIHVzZSB0aGUgcmV0dXJuIHJlc3VsdCBmcm9tIHRoZSBwcmV2aW91cyBmdW5jdGlvblxyXG5cdFx0XHRcdHJldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rKHJldHVybl9yZXN1bHQpKVxyXG5cdFx0XHRcdC8vcmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsuYXBwbHkoY29udGV4dCwgW3JldHVybl9yZXN1bHRdKSlcclxuXHRcdFx0fSwgdW5kZWZpbmVkKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cdG1vZHVsZS5leHBvcnRzID0gZi8vLS1cclxuIiwiLy92YXIgbSA9IHJlcXVpcmUoXCIuL21cIilcclxudmFyIGYgPSByZXF1aXJlKFwiLi9mXCIpXHJcbnZhciBtYXliZSA9IHJlcXVpcmUoXCIuL21heWJlXCIpXHJcbi8vdmFyIHN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVcIilcclxuLy92YXIgcHJvbWlzZSA9IHJlcXVpcmUoXCIuL3Byb21pc2VcIilcclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbi8vXHRtOm0sXHJcblx0ZjpmLFxyXG5cdG1heWJlOm1heWJlXHJcbi8vXHRwcm9taXNlOnByb21pc2UsXHJcbi8vXHRzdGF0ZTpzdGF0ZVxyXG59XHJcblxyXG4vL3dpbmRvdy5wcm9taXNlID0gcHJvbWlzZVxyXG53aW5kb3cuZiA9IGZcclxuLy93aW5kb3cubSA9IG1cclxud2luZG93Lm1heWJlID0gbWF5YmVcclxuLy93aW5kb3cuc3RhdGUgPSBzdGF0ZSBcclxuIiwiXHJcblxyXG5leHBvcnRzLmNyZWF0ZV9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uIGNyZWF0ZV90eXBlKG1ldGhvZHMpe1xyXG5cdC8vUmVwbGFjZSB0aGUgJ29mJyBmdW5jdGlvbiB3aXRoIGEgb25lIHRoYXQgcmV0dXJucyBhIG5ldyBvYmplY3RcclxuXHR2YXIgb2YgPSBtZXRob2RzLm9mXHJcblx0bWV0aG9kcy5vZiA9IGZ1bmN0aW9uKGEsYixjLGQpe3JldHVybiBvZi5hcHBseShPYmplY3QuY3JlYXRlKG1ldGhvZHMpLCBhcmd1bWVudHMpfVxyXG5cdFxyXG5cdG1ldGhvZHMgPSBhZGRfbWlzc2luZ19tZXRob2RzKG1ldGhvZHMpXHJcblx0XHJcblx0cmV0dXJuIG1ldGhvZHMub2Y7XHJcbn1cclxuXHJcbnZhciBhZGRfbWlzc2luZ19tZXRob2RzID0gZXhwb3J0cy5hZGRfbWlzc2luZ19tZXRob2RzID0gZnVuY3Rpb24ob2JqKXtcclxuXHQvL1wiY2hhaW5cIiBBS0EgXCJmbGF0TWFwXCIgaXMgZXF1aXZhbGVudCB0byBtYXAgLiBqb2luIFxyXG5cdFxyXG5cdG9iai5jaGFpbiA9IG9iai5mbGF0TWFwID0gZnVuY3Rpb24oZnVuayl7XHJcblx0XHRpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcblx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcblx0fVxyXG5cclxuXHQvKlxyXG5cdFwidGhlblwiIEFLQSBcInBoYXRNYXBcIiBpcyB0aGUgcmVsYXhlZCB2ZXJzaW9uIG9mIFwiZmxhdE1hcFwiIHdoaWNoIGFjdHMgb24gdGhlIG9iamVjdCBvbmx5IGlmIHRoZSB0eXBlcyBtYXRjaFxyXG5cdFwicGhhdE1hcFwiIHRoZXJlZm9yZSBjYW4gYmUgdXNlZCBhcyBib3RoIFwibWFwXCIgYW5kIFwiZmxhdE1hcFwiLCBleGNlcHQgaW4gdGhlIGNhc2VzIHdoZW4geW91IHNwZWNpZmljYWxseSB3YW50IHRvIGNyZWF0ZSBhIG5lc3RlZCBvYmplY3QuXHJcblx0SW4gdGhlc2UgY2FzZXMgeW91IGNhbiBkbyBzbyBieSBzaW1wbHkgdXNpbmcgXCJtYXBcIiBleHByaWNpdGx5LlxyXG5cdCovXHJcblxyXG5cdG9iai50aGVuID0gb2JqLnBoYXRNYXAgPSBmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdHJldHVybiB0aGlzLm1hcChmdW5rKS50cnlGbGF0KClcclxuXHR9XHJcblx0XHJcblx0cmV0dXJuIG9ialxyXG59XHJcbiIsIlxyXG5cclxudmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG52YXIgbGlzdF9tZXRob2RzID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgcHV0cyBpdCBpbiBhIGxpc3QuXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiBsaXN0KHZhbCksXHJcblxyXG4vL2BtYXBgIGFwcGxpZXMgYSBmdW5jdGlvbiB0byBlYWNoIGVsZW1lbnQgb2YgdGhlIGxpc3QgXHJcblx0XHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRcdHJldHVybiBsaXN0KEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5rKSlcclxuXHRcdH0sXHJcblx0XHRcclxuLy9gZmxhdGAgdGFrZXMgYSBsaXN0IG9mIGxpc3RzIGFuZCBmbGF0dGVucyB0aGVtIHdpdGggb25lIGxldmVsIFxyXG5cclxuXHRcdC8vKGIgLT4gKGIgLT4gYykpLmpvaW4oKSA9IGEgLT4gYlxyXG5cdFx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gbGlzdCggdGhpcy5yZWR1Y2UoKGxpc3QsIGVsZW1lbnQpID0+IFsuLi5saXN0LCAuLi5lbGVtZW50XSwgW10pIClcclxuXHRcdH0sXHJcblx0XHRcclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYFxyXG4vL2FuZCB3aXRoIGl0LCB5b3VyIGZ1bmsgY2FuIHJldHVybiBib3RoIGEgbGlzdCBvZiBvYmplY3RzIGFuZCBhIHNpbmdsZSBvYmplY3RcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBsaXN0KCB0aGlzLnJlZHVjZSgobGlzdCwgZWxlbWVudCkgPT4gXHJcblx0XHRcdFx0ZWxlbWVudC5jb25zdHJ1Y3RvciA9PT0gQXJyYXk/IFsuLi5saXN0LCAuLi5lbGVtZW50XSA6IFsuLi5saXN0LCBlbGVtZW50XSAsIFtdKVxyXG5cdFx0XHQpXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG4vL1RoaXMgaXMgdGhlIGxpc3QgY29uc3RydWN0b3IuIEl0IHRha2VzIG5vcm1hbCBhcnJheSBhbmQgYXVnbWVudHMgaXQgd2l0aCB0aGUgYWJvdmUgbWV0aG9kc1xyXG5cclxuXHR2YXIgbGlzdCA9ICguLi5hcmdzKSA9PiB7XHJcblx0XHQvL0FjY2VwdCBhbiBhcnJheVxyXG5cdFx0aWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkgKXtcclxuXHRcdFx0cmV0dXJuICBPYmplY3QuZnJlZXplKGV4dGVuZChhcmdzWzBdLCBsaXN0X21ldGhvZHMpKVxyXG5cdFx0Ly9BY2NlcHQgc2V2ZXJhbCBhcmd1bWVudHNcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShleHRlbmQoYXJncywgbGlzdF9tZXRob2RzKSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGxpc3Qgb2JqZWN0IGlzIGV4dGVuZGVkXHJcblxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3QvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuLyogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5VbmRlciB0aGUgaG9vZCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbi0tLS0tLS0tLS0tLS0tICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuTGV0J3Mgc2VlIGhvdyB0aGlzIHR5cGUgaXMgaW1wbGVtZW50ZWQgICAgIFxyXG4qLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG52YXIgbWF5YmVfcHJvdG8gPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIGBtYXliZWAuXHJcbi8vSW4gdGhpcyBjYXNlIHdlIGRvIHRoaXMgYnkganVzdCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3Rvci5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBtYXliZShpbnB1dClcclxuXHR9LFxyXG5cclxuLy9gbWFwYCB0YWtlcyB0aGUgZnVuY3Rpb24gYW5kIGFwcGxpZXMgaXQgdG8gdGhlIHZhbHVlIGluIHRoZSBtYXliZSwgaWYgdGhlcmUgaXMgb25lLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gbWF5YmUoZnVuayh0aGlzLl92YWx1ZSkpXHJcblx0XHR9ZWxzZXtcdFxyXG5cdFx0XHRyZXR1cm4gdGhpcyBcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nICYmIHRoaXMuX3ZhbHVlLmNvbnN0cnVjdG9yID09PSBtYXliZSl7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG59KS8vLS1cclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBtYXliZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHJcblx0dmFyIG1heWJlID0gZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpe1xyXG5cdFx0XHRyZXR1cm4gbm90aGluZ1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1heWJlX3Byb3RvKVxyXG5cdFx0XHRvYmouX3ZhbHVlID0gdmFsdWVcclxuXHRcdFx0b2JqLmNvbnN0cnVjdG9yID0gbWF5YmVcclxuXHRcdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRcdHJldHVybiBvYmpcclxuXHRcdH1cclxuXHR9XHJcblxyXG52YXIgbm90aGluZyA9IE9iamVjdC5jcmVhdGUobWF5YmVfcHJvdG8pLy8tLVxyXG5ub3RoaW5nLmNvbnN0cnVjdG9yID0gbWF5YmUvLy0tXHJcbk9iamVjdC5mcmVlemUobm90aGluZykvLy0tXHJcbm1heWJlLm5vdGhpbmcgPSBub3RoaW5nLy8tLVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtYXliZS8vLS1cclxuIiwiXHJcbnZhciBmID0gcmVxdWlyZShcIi4vZlwiKVxyXG5cclxuXHJcbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKVxyXG5cclxudmFyIHN0YXRlX3Byb3RvID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHtcclxuXHJcbi8vQXMgdXN1YWwsIHRoZSBgb2ZgIGZ1bmN0aW9uIGlzIHRyaXZpYWxcclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBzdGF0ZSgocHJldlN0YXRlKSA9PiBbaW5wdXQsIHByZXZTdGF0ZV0pXHJcblx0fSxcclxuXHJcbi8vYG1hcGAgaXMgZG9uZSBieSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gdGhlIHZhbHVlIGFuZCBrZWVwaW5nIHRoZSBzdGF0ZSB1bmNoYW5nZWQuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0YXRlKCB0aGlzLl9zdGF0ZS5tYXAoKFtpbnB1dCwgcHJldlN0YXRlXSkgPT4gW2Z1bmsoaW5wdXQpLCBwcmV2U3RhdGVdKSlcclxuXHR9LFxyXG5cdFxyXG4vL2BmbGF0YCBsb29rcyBhIGxpdHRsZSBiaXQgZGlmZmljdWx0LCBiZWNhdXNlIHdlIGhhdmUgdG8gdGFrZSBjYXJlIG9mIGFuIGV4dHJhIHZhbHVlLFxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuICB0aGlzLl9zdGF0ZSh7fSlbMF1cclxuXHR9LFxyXG5cdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiAgdGhpcy5fc3RhdGUoe30pWzBdXHJcblx0fSxcclxuXHJcbi8vV2UgaGF2ZSB0aGUgYHJ1bmAgZnVuY3Rpb24gd2hpY2ggY29tcHV0ZXMgdGhlIHN0YXRlOlxyXG5cclxuXHRydW46ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLl9zdGF0ZSh7fSlbMF1cclxuXHR9LFxyXG5cdGdldDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuX3N0YXRlKHt9KVsxXSh7fSlcclxuXHR9XHJcblx0XHJcblx0XHJcbn0pXHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgc3RhdGUgY29uc3RydWN0b3IgaXMgaW1wbGVtZW50ZWRcclxuXHJcblx0dmFyIHN0YXRlID0gZnVuY3Rpb24oc3RhdGUpe1xyXG5cdFx0dmFyIG9iaiA9IE9iamVjdC5jcmVhdGUoc3RhdGVfcHJvdG8pXHJcblx0XHRvYmouX3N0YXRlID0gZihzdGF0ZSwgMSlcclxuXHRcdG9iai5jb25zdHJ1Y3RvciA9IHN0YXRlXHJcblx0XHRvYmoucHJvdG90eXBlID0gc3RhdGVfcHJvdG9cclxuXHRcdE9iamVjdC5mcmVlemUob2JqKVxyXG5cdFx0cmV0dXJuIG9ialxyXG5cdH1cclxuXHJcbnN0YXRlLndyaXRlID0gZihmdW5jdGlvbihrZXksIHZhbCwgc3RhdGUpeyBzdGF0ZVtrZXldID0gdmFsOyByZXR1cm4gc3RhdGU7fSlcclxubW9kdWxlLmV4cG9ydHMgPSBzdGF0ZS8vLS1cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBmdW5jdGlvblxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgZnVuY3Rpb24gbW9uYWQgYXVnbWVudHMgc3RhbmRhcmQgSmF2YVNjcmlwdCBmdW5jdGlvbnMgd2l0aCBjb21wb3NpdGlvbiBhbmQgY3VycnlpbmcuXHJcbjwhLS1tb3JlLS0+XHJcblxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJmdW5jdGlvbnNcIikvLy0tXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpXHJcblx0XHR2YXIgZnVua3Rpb24gPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mdW5rdGlvblwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjb25zdHJ1Y3QgZnVuY3Rpb25zIGxpbmUgdGhpc1xyXG5cdFxyXG5cdFx0dmFyIHBsdXNfMSA9IGYoIChudW0pID0+IG51bSsxIClcclxuXHJcblxyXG4vL0FmdGVyIHlvdSBkbyB0aGF0LCB5b3Ugd2lsbCBzdGlsbCBiZSBhYmxlIHRvIHVzZSBgcGx1c18xYCBsaWtlIGEgbm9ybWFsIGZ1bmN0aW9uLCBidXQgeW91IGNhbiBhbHNvIGRvIHRoZSBmb2xsb3dpbmc6XHJcblxyXG5cclxuLypcclxuQ3VycnlpbmdcclxuLS0tLVxyXG5XaGVuIHlvdSBjYWxsIGEgZnVuY3Rpb24gYGZgIHdpdGggbGVzcyBhcmd1bWVudHMgdGhhdCBpdCBhY2NlcHRzLCBpdCByZXR1cm5zIGEgcGFydGlhbGx5IGFwcGxpZWRcclxuKGJvdW5kKSB2ZXJzaW9uIG9mIGl0c2VsZiB0aGF0IG1heSBhdCBhbnkgdGltZSBiZSBjYWxsZWQgd2l0aCB0aGUgcmVzdCBvZiB0aGUgYXJndW1lbnRzLlxyXG4qL1xyXG5cclxuXHRRVW5pdC50ZXN0KFwiY3VycnlcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHR2YXIgYWRkXzMgPSBmKGZ1bmN0aW9uKGEsYixjKXtyZXR1cm4gYStiK2N9KVxyXG5cdFx0XHJcblx0XHR2YXIgYWRkXzIgPSBhZGRfMygwKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKHR5cGVvZiBhZGRfMiwgXCJmdW5jdGlvblwiLCBcImN1cnJpZWQgZnVuY3Rpb25zIHJldHVybiBvdGhlciBmdW5jdGlvbnMgd2hlbiB0aGUgYXJndW1lbnRzIGFyZSBub3QgZW5vdWdoXCIpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRfMigxKSgxKSwgMiwgXCJ3aGVuIHRoZSBhcmd1bWVudHMgYXJlIGVub3VnaCBhIHJlc3VsdCBpcyByZXR1cm5lZC5cIilcclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbm1hcChmdW5rKVxyXG4tLS0tXHJcbmNyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QsIHRoZW4gY2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnQ6XHJcbiovXHJcblx0UVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdFxyXG4vL1lvdSBjYW4gY3JlYXRlIGEgRnVuY3Rpb24gTW9uYWQgYnkgcGFzc2luZyBhIG5vcm1hbCBKYXZhU2NyaXB0IGZ1bmN0aW9uIHRvIHRoZSBjb25zdHJ1Y3RvciAoeW91IGNhbiB3cml0ZSB0aGUgZnVuY3Rpb24gZGlyZWN0bHkgdGhlcmUpOlxyXG5cdFx0XHJcblx0XHR2YXIgcGx1c18xID0gZiggKG51bSkgPT4gbnVtKzEgKVxyXG5cclxuXHJcbi8vVGhlbiBtYWtpbmcgYW5vdGhlciBmdW54dGlvbiBpcyBlYXN5OlxyXG5cclxuXHRcdHZhciBwbHVzXzIgPSBwbHVzXzEubWFwKHBsdXNfMSkgXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKHBsdXNfMigwKSwgMiwgXCJOZXcgZnVuY3Rpb25zIGNhbiBiZSBjb21wb3NlZCBmcm9tIG90aGVyIGZ1bmN0aW9ucy5cIilcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXNfNCA9IHBsdXNfMi5tYXAocGx1c18yKVxyXG5cclxuXHRcdGFzc2VydC5lcXVhbChwbHVzXzQoMSksIDUsIFwiY29tcG9zZWQgZnVuY3Rpb25zIGNhbiBiZSBjb21wb3NlZCBhZ2Fpbi5cIilcclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG5mbGF0TWFwKGZ1bmspXHJcbi0tLS1cclxuQSBtb3JlIHBvd2VyZnVsIHZlcnNpb24gb2YgYG1hcGAuIEFjY2VwdHMgYSBmdW5rdGlvbiB3aGljaCByZXR1cm5zIGFub3RoZXIgZnVuY3Rpb24uIFJldHVybnMgYSBmdW5jdGlvbiB3aGljaCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QsXHJcbmFuZCB0aGVuIGl0XHJcbjEuIENhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50XHJcbjIuIENhbGxzIHRoZSBmdW5jdGlvbiByZXR1cm5lZCBieSBgZnVua2AsIHdpdGggdGhlIHNhbWUgYXJndW1lbnQgYW5kIHJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgc2Vjb25kIGNhbGwuXHJcbiovXHJcblx0UVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1lvdSBjYW4gdXNlIGBmbGF0TWFwYCB0byBtb2RlbCBzaW1wbGUgaWYtdGhlbiBzdGF0ZW1lbnRzLiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgdXNlcyBpdCBpbiBjb21iaW5hdGlvbiBvZiB0aGUgY3VycnlpbmcgZnVuY3Rpb25hbGl0eTpcclxuXHRcdFxyXG5cdFx0dmFyIGNvbmNhdCA9IGYoKHN0cjEsIHN0cjIpID0+IHN0cjEgKyBzdHIyKVxyXG5cdFx0dmFyIG1ha2VNZXNzYWdlID0gZihwYXJzZUludCwgMSkuZmxhdE1hcCgobnVtKSA9PiB7Y29uc29sZS5sb2coXCJudW0gXCIrbnVtKTsgXHJcblx0XHRyZXR1cm4gaXNOYU4obnVtKT8gZihcIkludmFsaWQgbnVtYmVyXCIpIDogY29uY2F0KFwiVGhlIG51bWJlciBpcyBcIil9IClcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMVwiKSwgXCJUaGUgbnVtYmVyIGlzIDFcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIjJcIiksIFwiVGhlIG51bWJlciBpcyAyXCIpXHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCJOb3QgYSBudW1iZXJcIiksIFwiSW52YWxpZCBudW1iZXJcIilcclxuXHJcbi8qXHJcblxyXG5gZmxhdE1hcGAgaXMgc2ltaWxhciB0byB0aGUgYD4+PWAgZnVuY3Rpb24gaW4gSGFza2VsbCwgd2hpY2ggaXMgdGhlIGJ1aWxkaW5nIGJsb2NrIG9mIHRoZSBpbmZhbW91cyBgZG9gIG5vdGF0aW9uXHJcbkl0IGNhbiBiZSB1c2VkIHRvIHdyaXRlIHByb2dyYW1zIHdpdGhvdXQgdXNpbmcgYXNzaWdubWVudC5cdFxyXG5cclxuRm9yIGV4YW1wbGUgaWYgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIGZ1bmN0aW9uIGluIEhhc2tlbGw6XHJcblxyXG5cdFx0YWRkU3R1ZmYgPSBkbyAgXHJcblx0XHRcdGEgPC0gKCoyKSAgXHJcblx0XHRcdGIgPC0gKCsxMCkgIFxyXG5cdFx0XHRyZXR1cm4gKGErYilcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGFkZFN0dWZmKDMpLCAxOSlcclxuXHJcblxyXG5XaGVuIHdlIGRlc3VnYXIgaXQsIHRoaXMgYmVjb21lczpcclxuXHJcblx0XHRhZGRTdHVmZiA9ICgqMikgPj49IFxcYSAtPlxyXG5cdFx0XHRcdCgrMTApID4+PSBcXGIgLT5cclxuXHRcdFx0XHRcdHJldHVybiAoYStiKVxyXG5cclxub3IgaW4gSmF2YVNjcmlwdCB0ZXJtczpcclxuXHJcbiovXHJcblxyXG5cdFx0dmFyIGFkZFN0dWZmID0gZiggKG51bSkgPT4gbnVtICogMiApLmZsYXRNYXAoIChhKSA9PlxyXG5cdFx0XHRcdCAgZiggKG51bSkgPT4gbnVtICsgMTAgKS5mbGF0TWFwKCAoYikgPT5cclxuXHRcdFx0XHRcdGYub2YoYSArIGIpICkgKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHR9KS8vLS1cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBsaXN0IFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYGxpc3RgIHR5cGUsIGF1Z21lbnRzIHRoZSBzdGFuZGFyZCBKYXZhU2NyaXB0IGFycmF5cywgbWFraW5nIHRoZW0gaW1tdXRhYmxlIGFuZCBhZGRpbmcgYWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5IHRvIHRoZW1cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIkxpc3RcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgbGlzdGAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbGlzdCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2xpc3RcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY3JlYXRlIGEgYGxpc3RgIGZyb20gYXJyYXkgbGlrZSB0aGlzXHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoWzEsMiwzXSlcclxuLy9vciBsaWtlIHRoaXM6XHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoMSwyLDMpXHJcblxyXG4vKlxyXG5tYXAoZnVuaylcclxuLS0tLVxyXG5TdGFuZGFyZCBhcnJheSBtZXRob2QuIEV4ZWN1dGVzIGBmdW5rYCBmb3IgZWFjaCBvZiB0aGUgdmFsdWVzIGluIHRoZSBsaXN0IGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IGxpc3QuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHR2YXIgcGVvcGxlID0gbGlzdCgge25hbWU6XCJqb2huXCIsIGFnZToyNCwgb2NjdXBhdGlvbjpcImZhcm1lclwifSwge25hbWU6XCJjaGFybGllXCIsIGFnZToyMiwgb2NjdXBhdGlvbjpcInBsdW1iZXJcIn0pXHJcblx0dmFyIG5hbWVzID0gcGVvcGxlLm1hcCgocGVyc29uKSA9PiBwZXJzb24ubmFtZSApXHJcblx0YXNzZXJ0LmRlZXBFcXVhbChuYW1lcywgW1wiam9oblwiLCBcImNoYXJsaWVcIl0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnBoYXRNYXAoZnVuaylcclxuLS0tLVxyXG5cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgbGlzdCBvciBhbiBhcnJheSBpdCBmbGF0dGVucyB0aGUgcmVzdWx0cyBpbnRvIG9uZSBhcnJheVxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcclxuXHR2YXIgb2NjdXBhdGlvbnMgPSBsaXN0KFsgXHJcblx0XHR7b2NjdXBhdGlvbjpcImZhcm1lclwiLCBwZW9wbGU6W1wiam9oblwiLCBcInNhbVwiLCBcImNoYXJsaWVcIl0gfSxcclxuXHRcdHtvY2N1cGF0aW9uOlwicGx1bWJlclwiLCBwZW9wbGU6W1wibGlzYVwiLCBcInNhbmRyYVwiXSB9LFxyXG5cdF0pXHJcblx0XHJcblx0dmFyIHBlb3BsZSA9IG9jY3VwYXRpb25zLnBoYXRNYXAoKG9jY3VwYXRpb24pID0+IG9jY3VwYXRpb24ucGVvcGxlKVxyXG5cdGFzc2VydC5kZWVwRXF1YWwocGVvcGxlLFtcImpvaG5cIiwgXCJzYW1cIiwgXCJjaGFybGllXCIsIFwibGlzYVwiLCBcInNhbmRyYVwiXSlcclxuXHJcbn0pLy8tLVxyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBtYXliZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYG1heWJlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBvcHRpb25gIHR5cGUgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgdGhhdCBtYXkgbm90IGJlIHRoZXJlLiBcclxuXHJcblRoZSBwdXJwb3NlIG9mIHRoaXMgbW9uYWQgaXMgdG8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB3cml0aW5nIGBudWxsYCBjaGVja3MuIGZ1cnRoZXJtb3JlIGl0IGFsc28gZWxpbWluYXRlcyB0aGUgcG9zc2liaWxpdHkgb2YgbWFraW5nIGVycm9ycyBieSBtaXNzaW5nIG51bGwtY2hlY2tzLlxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiTWF5YmVcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgbWF5YmVgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIG1heWJlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbWF5YmVcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gd3JhcCBhIHZhbHVlIGluIGBtYXliZWAgd2l0aDpcclxuXHRcdHZhciB2YWwgPSA0Ly8tLVxyXG5cdFx0dmFyIG1heWJlX3ZhbCA9IG1heWJlKHZhbClcclxuXHJcbi8vSWYgdGhlICd2YWwnIGlzIGVxdWFsIHRvICp1bmRlZmluZWQqIGl0IHRocmVhdHMgdGhlIGNvbnRhaW5lciBhcyBlbXB0eS5cclxuXHJcbi8qXHJcbm1hcChmdW5rKVxyXG4tLS0tXHJcbkV4ZWN1dGVzIGBmdW5rYCB3aXRoIHRoZSBgbWF5YmVgJ3MgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGJ1dCBvbmx5IGlmIHRoZSB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSAqdW5kZWZpbmVkKiwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbWF5YmUuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vVHJhZGl0aW9uYWxseSwgaWYgd2UgaGF2ZSBhIHZhbHVlIHRoYXQgbWF5IGJlIHVuZGVmaW5lZCB3ZSBkbyBhIG51bGwgY2hlY2sgYmVmb3JlIGRvaW5nIHNvbWV0aGluZyB3aXRoIGl0OlxyXG5cclxuXHR2YXIgb2JqID0ge30vLy0tXHJcblx0dmFyIGdldF9wcm9wZXJ0eSA9IGYoKG9iamVjdCkgPT4gb2JqZWN0LnByb3BlcnR5KS8vLS1cclxuXHRcclxuXHR2YXIgdmFsID0gZ2V0X3Byb3BlcnR5KG9iailcclxuXHRcclxuXHRpZih2YWwgIT09IHVuZGVmaW5lZCl7XHJcblx0XHR2YWwgPSB2YWwudG9TdHJpbmcoKVxyXG5cdH1cclxuXHRhc3NlcnQuZXF1YWwodmFsLCB1bmRlZmluZWQpIFxyXG5cclxuLy9XaXRoIGBtYXBgIHRoaXMgY2FuIGJlIHdyaXR0ZW4gbGlrZSB0aGlzXHJcblxyXG4gXHR2YXIgbWF5YmVfZ2V0X3Byb3BlcnR5ID0gZ2V0X3Byb3BlcnR5Lm1hcChtYXliZSlcclxuXHJcblx0bWF5YmVfZ2V0X3Byb3BlcnR5KG9iaikubWFwKCh2YWwpID0+IHtcclxuXHRcdGFzc2VydC5vayhmYWxzZSkvLy0tXHJcblx0XHR2YWwudG9TdHJpbmcoKS8vdGhpcyBpcyBub3QgZXhlY3V0ZWRcclxuXHR9KVxyXG5cclxuLy9UaGUgYmlnZ2VzdCBiZW5lZml0IHdlIGdldCBpcyB0aGF0IGluIHRoZSBmaXJzdCBjYXNlIHdlIGNhbiBlYXNpbHkgZm9yZ2V0IHRoZSBudWxsIGNoZWNrOlxyXG5cdFxyXG5cdGFzc2VydC50aHJvd3MoZnVuY3Rpb24oKXtcclxuXHRcdGdldF9wcm9wZXJ0eShvYmopLnRvU3RyaW5nKCkgIC8vdGhpcyBibG93cyB1cFxyXG5cdH0pXHJcblxyXG4vL1doaWxlIGluIHRoZSBzZWNvbmQgY2FzZSB3ZSBjYW5ub3QgYWNjZXNzIHRoZSB1bmRlcmx5aW5nIHZhbHVlIGRpcmVjdGx5LCBhbmQgdGhlcmVmb3JlIGNhbm5vdCBleGVjdXRlIGFuIGFjdGlvbiBvbiBpdCwgaWYgaXQgaXMgbm90IHRoZXJlLlxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5waGF0TWFwKGZ1bmspXHJcbi0tLS1cclxuXHJcblNhbWUgYXMgYG1hcGAsIGJ1dCBpZiBgZnVua2AgcmV0dXJucyBhIGBtYXliZWAgaXQgZmxhdHRlbnMgdGhlIHR3byBgbWF5YmVzYCBpbnRvIG9uZS5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL2BtYXBgIHdvcmtzIGZpbmUgZm9yIGVsaW1pbmF0aW5nIGVycm9ycywgYnV0IGRvZXMgbm90IHNvbHZlIG9uZSBvZiB0aGUgbW9zdCBhbm5veWluZyB0aGluZ3MgdGhlcmUgYXJlIHdpdGggbnVsbC1jaGVja3MgLSBuZXN0aW5nOlxyXG5cclxuXHR2YXIgb2JqID0geyBmaXJzdDoge3NlY29uZDpcInZhbFwiIH0gfVxyXG5cdFxyXG5cdG1heWJlKG9iailcclxuXHRcdC5tYXAoIChyb290KSA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5tYXAoIChtYXliZUZpcnN0KSA9PiBtYXliZUZpcnN0Lm1hcCAoZmlyc3QgPT4gbWF5YmUgKCBtYXliZUZpcnN0LnNlY29uZCApICkgKSBcclxuXHRcdC5tYXAoIChtYXliZU1heWJlVmFsdWUpID0+IG1heWJlTWF5YmVWYWx1ZS5tYXAgKCAoIG1heWJlVmFsdWUpID0+IG1heWJlVmFsdWUubWFwKCAodmFsdWUpPT4oIGFzc2VydC5lcXVhbCggdmFsLCBcInZhbFwiKSApICkgKSApXHJcblxyXG4vL2BwaGF0TWFwYCBkb2VzIHRoZSBmbGF0dGVuaW5nIGZvciB1cywgYW5kIGFsbG93cyB1cyB0byB3cml0ZSBjb2RlIGxpa2UgdGhpc1xyXG5cclxuXHRtYXliZShvYmopXHJcblx0XHQuZmxhdE1hcCgocm9vdCkgPT4gbWF5YmUocm9vdC5maXJzdCkpXHJcblx0XHQuZmxhdE1hcCgoZmlyc3QpID0+IG1heWJlKGZpcnN0LnNlY29uZCkpXHJcblx0XHQuZmxhdE1hcCgodmFsKSA9PiB7XHJcblx0XHRcdGFzc2VydC5lcXVhbCh2YWwsIFwidmFsXCIpXHJcblx0XHR9KVxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5BZHZhbmNlZCBVc2FnZVxyXG4tLS0tXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiYWR2YW5jZWRcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcbi8vIGBtYXliZWAgY2FuIGJlIHVzZWQgd2l0aCB0aGUgZnVuY3Rpb24gbW9uYWQgdG8gZWZmZWN0aXZlbHkgcHJvZHVjZSAnc2FmZScgdmVyc2lvbnMgb2YgZnVuY3Rpb25zXHJcblxyXG5cdHZhciBnZXQgPSBmKChwcm9wLCBvYmopID0+IG9ialtwcm9wXSlcclxuXHR2YXIgbWF5YmVHZXQgPSBnZXQubWFwKG1heWJlKVxyXG5cclxuLy9UaGlzIGNvbWJpbmVkIHdpdGggdGhlIHVzZSBvZiBjdXJyeWluZyBtYWtlcyBmb3IgYSB2ZXJ5IGZsdWVudCBzdHlsZSBvZiBjb2Rpbmc6XHJcblxyXG5cdHZhciBnZXRGaXJzdFNlY29uZCA9IChyb290KSA9PiBtYXliZShyb290KS5waGF0TWFwKG1heWJlR2V0KCdmaXJzdCcpKS5waGF0TWFwKG1heWJlR2V0KCdzZWNvbmQnKSlcclxuXHRcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwidmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwidmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDoge3NlY29uZDpcIm90aGVyX3ZhbHVlXCIgfSB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIm90aGVyX3ZhbHVlXCIpKVxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IFwiXCIgfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ3aGF0ZXZlclwiKSApLy93b24ndCBiZSBleGVjdXRlZCBcclxuXHJcbn0pLy8tLVxyXG5cclxuXHJcblxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IHN0YXRlXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgc3RhdGVgIHR5cGUsIGFsc28gXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJTdGF0ZVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBzdGF0ZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgc3RhdGUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9zdGF0ZVwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byB3cmFwIGEgdmFsdWUgaW4gYHN0YXRlYCB3aXRoOlxyXG5cclxuLypcclxubWFwKGZ1bmspXHJcbi0tLS1cclxuRXhlY3V0ZXMgYGZ1bmtgIHdpdGggdGhlIGBzdGF0ZWAncyB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgYnV0IG9ubHkgaWYgdGhlIHZhbHVlIGlzIGRpZmZlcmVudCBmcm9tICp1bmRlZmluZWQqLCBhbmQgd3JhcHMgdGhlIHJlc3VsdCBpbiBhIG5ldyBzdGF0ZS5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwic3RhdGVcIiwgZnVuY3Rpb24oYXNzZXJ0KXtcclxuXHJcblx0dmFyIG15X3N0YXRlID0gc3RhdGUoKS5vZig1KVxyXG5cdC5tYXAoKHZhbCkgPT4gdmFsKzEpXHJcblx0LnBoYXRNYXAoKHZhbCkgPT4gIHN0YXRlKChjdXJyZW50X3N0YXRlKSA9PiBbdmFsLCBzdGF0ZS53cml0ZShcImtleVwiLCB2YWwpXSApIClcclxuXHJcblx0YXNzZXJ0LmRlZXBFcXVhbChteV9zdGF0ZS5nZXQoKSwge2tleTo2fSlcclxuXHJcbn0pXHJcbiJdfQ==
