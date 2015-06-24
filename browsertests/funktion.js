(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var helpers = require('./helpers'); //--

var id = function id(a) {
	return a;
}; //--

var f_methods = helpers.add_missing_methods({ //--

	//the `of` method, takes a value and creates a function that returns it.
	//this is very useful if you have a API which expects a function, but you want to feed it with a value (see the `flatmap` example).

	//a.of(b) -> b a
	of: function of(val) {
		return val === undefined ? id : f(function () {
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

},{"./helpers":2}],2:[function(require,module,exports){
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
	}, obj.print = function () {
		console.log(this.toString());
		return this;
	};

	return obj;
};

},{}],3:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var helpers = require("./helpers"); //--

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

},{"./helpers":2}],4:[function(require,module,exports){
"use strict";

var helpers = require("./helpers"); //--
var maybe_proto = helpers.add_missing_methods({ //--

	//The `of` method, takes a value and wraps it in a `maybe`.
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

},{"./helpers":2}],5:[function(require,module,exports){
"use strict";

var helpers = require("./helpers"); //--
var promiseProto = helpers.add_missing_methods({ //--

	//The `of` method takes a value and wraps it in a promise, by immediately calling the resolver function with it.

	//a -> m a
	of: function of(val) {
		return promise(function (resolve) {
			return resolve(val);
		});
	},

	//The `map` method creates a new promise, such that when the old promise is resolved, it takes its result,
	//applies `funk` to it and then resolves itself with the value.

	//m a -> ( a -> b ) -> m b
	map: function map(funk) {
		var _this = this;

		return promise(function (resolve) {
			return _this._resolver(function (val) {
				return resolve(funk(val));
			});
		});
	},

	//In this case the implementation of `flat` is quite simple.

	//Effectively all we have to do is return the same value with which the inner promise is resolved.
	//To do this, we unwrap our promise once to get the inner promise value, and then unwrap the inner
	//promise itself to get its value.

	//m (m x) -> m x
	flat: function flat() {
		var _this2 = this;

		return promise(function (resolve) {
			return _this2._resolver(function (inner_promise) {
				return inner_promise._resolver(function (val) {
					return resolve(val);
				});
			});
		});
	},

	//The `run` function just feeds the resolver with a placeholder  function so our computation can
	//start executing.

	run: function run() {
		return this._resolver(function (a) {
			return a;
		});
	}

}); //--

//In case you are interested, here is how the promise constructor is implemented

var promise = function promise(resolve) {
	if (typeof resolve !== "function") {
		return promiseProto.of(resolve);
	}
	var obj = Object.create(promiseProto);

	obj._resolver = resolve;
	obj.constructor = promise;
	obj.prototype = promiseProto;
	Object.freeze(obj);
	return obj;
};

module.exports = promise //--
;

},{"./helpers":2}],6:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

var f = require("./f"); //--

var helpers = require("./helpers"); //--

var stateProto = helpers.add_missing_methods({ //--

	//`of` just uses the constructor and does not touch the state.

	//a -> m a
	of: function of(input) {
		return state(function (prevState) {
			return [input, prevState];
		});
	},

	//`map` is done by applying the function to the value and keeping the state unchanged.

	//m a -> ( a -> b ) -> m b
	map: function map(funk) {
		return state(this._runState.map(function (_ref) {
			var _ref2 = _slicedToArray(_ref, 2);

			var input = _ref2[0];
			var prevState = _ref2[1];
			return [funk(input), prevState];
		}));
	},

	//`flat` does the following:
	//1. Runs the code that we loaded in the monad so, far (using the `run` function).
	//2. Saves the new state object and the value which is kept by the functions so far.
	//3. After doing that, it arranges those two components (the object and the value) into a yet another
	//state object, which runs the mutator function of the first object, with the state that we have so, far

	//m (m x) -> m x
	flat: function flat() {
		//Extract state mutator and value

		var _run = this.run();

		var _run2 = _slicedToArray(_run, 2);

		var stateObj = _run2[0];
		var currentState = _run2[1];

		//Compose the mutator and the value
		return state(function () {
			return stateObj._runState(currentState);
		});
	},
	tryFlat: function tryFlat() {

		//Extract current state

		var _run3 = this.run();

		var _run32 = _slicedToArray(_run3, 2);

		var stateObj = _run32[0];
		var currentState = _run32[1];

		//Check if it is really a state
		if (stateObj.constructor === state) {
			return state(function () {
				return stateObj._runState(currentState);
			});
		} else {
			return state(function () {
				return [stateObj, currentState];
			});
		}
	},

	//We have the `run` function which computes the state:

	run: function run() {
		return this._runState();
	},
	//And the `save` and `load` functions are exactly what one would expect

	load: function load() {
		return this.flatMap(function (value) {
			return state(function (state) {
				return [state, state];
			});
		});
	},
	save: function save() {
		return this.flatMap(function (value) {
			return state(function (state) {
				return [value, value];
			});
		});
	},
	loadKey: function loadKey(key) {
		return this.flatMap(function (value) {
			return state(function (state) {
				return [state[key], state];
			});
		});
	},
	saveKey: function saveKey(key) {
		var write = function write(obj, key, val) {
			obj = typeof obj === "object" ? obj : {};
			obj[key] = val;
			return obj;
		};
		return this.flatMap(function (value) {
			return state(function (state) {
				return [value, write(state, key, value)];
			});
		});
	},
	toString: function toString() {
		return JSON.stringify(this.run());
	}

});

//In case you are interested, here is how the state constructor is implemented

var state = function state(run) {
	if (typeof run !== "function") {
		return stateProto.of(run);
	}
	var obj = Object.create(stateProto);
	obj._runState = f(run, 1);
	obj.constructor = state;
	obj.prototype = stateProto;
	Object.freeze(obj);
	return obj;
};

module.exports = state //--
;

},{"./f":1,"./helpers":2}],7:[function(require,module,exports){
/*---
category: tutorial
title: function
layout: post
---

The function monad augments standard JavaScript functions with facilities for composition and currying.
<!--more-->

*/
"use strict";

QUnit.module("functions"); //--

//To use the monad constructor, you can require it using node:

var f = require("../library/f");

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
		var add3 = f(function (a, b, c) {
				return a + b + c;
		});

		var add2 = add3(0);
		assert.equal(add2(1, 1), 2);
		assert.equal(add2(5, 5), 10);

		var plus10 = add2(10);
		assert.equal(plus10(5), 15);
		assert.equal(plus10(10), 20);
}); //--

/*
`of(value)`
----
If called with a value as an argument, it constructs a function that always returns that value.
If called without arguments it returns a function that always returns the arguments given to it.
*/
QUnit.test("of", function (assert) {
		//--
		var returns9 = f().of(9);
		assert.equal(returns9(3), 9);
		assert.equal(returns9("a"), 9);

		var id = f().of();
		assert.equal(id(3), 3);
		assert.equal(id("a"), "a");
}); //--
/*
`map(funk)`
----
Creates a new function that calls the original function first, then calls `funk` with the result of the original function as an argument:
*/
QUnit.test("map", function (assert) {
		//--

		//You can create a Function Monad by passing a normal JavaScript function to the constructor (you can write the function directly there):

		var plus1 = f(function (num) {
				return num + 1;
		});

		//Then making another function is easy:

		var plus2 = plus1.map(plus1);

		assert.equal(plus2(0), 2);

		var plus4 = plus2.map(plus2);

		assert.equal(plus4(1), 5);
}); //--

/*

`phatMap(funk)`
----
Same as `map` except that if `funk` returns another function it returns a third function which:
1. Calls the original function first.
2. Calls `funk` with the result of the original function as an argument
3. Calls the function returned by `funk` with the same argument and returns the result of the second call.
*/
QUnit.test("phatMap", function (assert) {
		//--

		//You can use `phatMap` to model simple if-then statements. The following example uses it in combination of the currying functionality:

		var concat = f(function (str1, str2) {
				return str1 + str2;
		});

		var makeMessage = f(parseInt, 1).flatMap(function (num) {
				return isNaN(num) ? f("Error. Not a number") : concat("The number is ");
		});

		assert.equal(makeMessage("1"), "The number is 1");
		assert.equal(makeMessage("2"), "The number is 2");
		assert.equal(makeMessage("Y"), "Error. Not a number");

		/*
  
  `phatMap` is similar to the `>>=` function in Haskell, which is the building block of the infamous `do` notation
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

/*
under the hood
--------------
Let's see how the type is implemented
*/

},{"../library/f":1}],8:[function(require,module,exports){
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
`map(funk)`
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
`phatMap(funk)`
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
/*
under the hood
--------------
Let's see how the type is implemented
*/

},{"../library/f":1,"../library/list":3}],9:[function(require,module,exports){
/*---
category: tutorial
title: maybe
layout: post
---

The `maybe` type, also known as `option` type is a container for a value that may not be there. 

The purpose of this monad is to eliminate the need for writing `null` checks. 
Furthermore it also eliminates the possibility of making errors by missing null-checks.

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
`map(funk)`
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
`phatMap(funk)`
----

Same as `map`, but if `funk` returns a `maybe` it flattens the two `maybes` into one.

***
*/

QUnit.test("flatMap", function (assert) {
	//--

	//`map` works fine for eliminating errors, but it does not solve one of the most annoying problems with null-checks - nesting:

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

/*
under the hood
--------------
Let's see how the type is implemented
*/

},{"../library/f":1,"../library/maybe":4}],10:[function(require,module,exports){
/*---
category: tutorial
title: promise 
layout: post
---

The `promise` type, also known as `future` is a container for a value which will be resolved at some point in the future, 
via an asynchronous operation. 

<!--more-->
*/
"use strict";

QUnit.module("Promise"); //--

//To use the `promise` monad constructor, you can require it using node:

var promise = require("../library/promise");
var f = require("../library/f"); //--

//Where the `../` is the location of the module.

//To create a `promise` pass a function which accepts a callback and calls that callback with the specified value:
var my_promise = promise(function (resolve) {
	return setTimeout(function () {
		resolve(5);
	}, 1000);
});

/*
`map(funk)`
- ---

***
*/

QUnit.module("promises");

QUnit.test("then", function (assert) {
	var done = assert.async();
	var p = promise(function (resolve) {
		setTimeout(function () {
			resolve(1);
		}, 1000);
	}).flatMap(function (val) {
		return promise(function (resolve) {
			setTimeout(function () {
				resolve(val + 1);
			}, 1000);
		});
	}).map(function (val) {
		assert.equal(val, 2, "Chained computation returns correct value");
		done();
	});

	console.log(p);
	p.run();
});

},{"../library/f":1,"../library/promise":5}],11:[function(require,module,exports){
/*---
category: tutorial
title: state
layout: post
---

The `state` type, is a container which encapsulates a stateful function. It basically allows you to compose functions,
like you can do with the `f` type, except with it any function can access an additional "variable" besides its
input argument(s) - the state. 

<!--more-->
*/
"use strict";

QUnit.module("State"); //--

//To use the `state` monad constructor, you can require it using node:

var state = require("../library/state");
var f = require("../library/f"); //--

//Where the `../` is the location of the module.

//In the context of this type a state is represented by a function that accepts a state
//and returns a list which contains a value and a new state. So for example:

state(function (val) {
	return [val + 1, val];
});

//Creates a new stateful computation which increments the input argument and then saves it in the state.

/*
`of(value)`
----
Accepts a value and wraps in a state container
*/
QUnit.test("of", function (assert) {
	//--
	assert.expect(0); //--
	var state5 = state().of(5);
}); //--

//Note that the following code does not put `5` in the state.
//Rather it creates a function which returns `5` and does not interact with the state.

/*
`map(funk)`
----
Executes `funk` with the encapsulated value as an argument, and wraps the result in a new `state` object, 
without accessing the state


***
*/
QUnit.test("map", function (assert) {
	//--

	//One of the main benefits of the `state` types is that it allows you to mix pure functions with unpure ones,
	//In the same way that promises allow us to mix asychronous functions with synchronous ones.
	//Map allows us to apply any function on our value and to consume the result in another function.

	var myState = state(5).map(function (val) {
		return val + 1;
	}).map(function (val) {
		assert.equal(val, 6);
		return val * 2;
	}).map(function (val) {
		return assert.equal(val, 12);
	}).run();
}); //--

/*

`phatMap(funk)`
----
Same as `map`, except that if `funk` returns a new state object it merges the two states into one.
Thus `flatMap` simulates manipulation of mutable state.
***
*/

QUnit.test("phatMap", function (assert) {
	//--

	//For example, here is a function that

	var myState = state("value")
	//Write the value in the state
	.phatMap(function (value) {
		return state(function (_) {
			return ["new " + value, "initial " + value];
		});
	})

	//manipulate the value
	.phatMap(function (val) {
		return val.toUpperCase().split("").join("-");
	})

	//We can access the state at any time.
	.phatMap(function (val) {
		return state(function (st) {
			assert.equal(val, "N-E-W- -V-A-L-U-E");
			assert.equal(st, "initial value");
		});
	}).run();
}); //--

/*

`save() / load()`
----
Shorthands for the most common state operations: 
- `save` copies the currently encapsulated value into the state
- `load` just returns the current state
***
*/

QUnit.test("save/load", function (assert) {
	//--

	var myState = state(5).phatMap(function (val) {
		return val + 1;
	}) //6
	.saveKey("st1").phatMap(function (val) {
		return val * 2;
	}) //12
	.saveKey("st2").load().map(function (state) {
		assert.equal(state.st1, 6);
		assert.equal(state.st2, 12);
	}).run();
}); //--

/*
under the hood
--------------
Let's see how the type is implemented
*/

},{"../library/f":1,"../library/state":6}]},{},[7,8,9,10,11])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvaGVscGVycy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L2xpc3QuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9tYXliZS5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L3Byb21pc2UuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9zdGF0ZS5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9mX3Rlc3RzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL2xpc3RfdGVzdHMuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvbWF5YmVfdGVzdHMuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvcHJvbWlzZV90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9zdGF0ZV90ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQSxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBR2xDLElBQU0sRUFBRSxHQUFHLFNBQUwsRUFBRSxDQUFHLENBQUM7UUFBSSxDQUFDO0NBQUEsQ0FBQTs7QUFFaEIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOzs7Ozs7QUFNM0MsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLEdBQUcsS0FBSyxTQUFTLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBRTtVQUFNLEdBQUc7R0FBQSxDQUFFO0VB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QUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxQixRQUFNLENBQUMsS0FBSyxDQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTtBQUM5QixRQUFNLENBQUMsS0FBSyxDQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTs7QUFFaEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUE7QUFDbkIsUUFBTSxDQUFDLEtBQUssQ0FBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7QUFDeEIsUUFBTSxDQUFDLEtBQUssQ0FBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFFLENBQUE7Q0FFNUIsQ0FBQyxDQUFBOzs7Ozs7QUFNRixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFTLE1BQU0sRUFBQzs7Ozs7QUFJakMsTUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFFLFVBQUEsR0FBRztXQUFJLEdBQUcsR0FBQyxDQUFDO0dBQUEsQ0FBRSxDQUFBOzs7O0FBSzdCLE1BQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7O0FBRTVCLFFBQU0sQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBOztBQUUzQixNQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBOztBQUU1QixRQUFNLENBQUMsS0FBSyxDQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTtDQUUzQixDQUFDLENBQUE7Ozs7Ozs7Ozs7O0FBV0YsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBUyxNQUFNLEVBQUM7Ozs7O0FBSXJDLE1BQUksTUFBTSxHQUFHLENBQUMsQ0FBRSxVQUFDLElBQUksRUFBRSxJQUFJO1dBQUssSUFB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Q0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQTtFQUMzQixDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7Q0FDUixDQUFDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuXHJcbmNvbnN0IGlkID0gYSA9PiBhIC8vLS1cclxuXHJcblx0dmFyIGZfbWV0aG9kcyA9IGhlbHBlcnMuYWRkX21pc3NpbmdfbWV0aG9kcyh7Ly8tLVxyXG5cclxuLy90aGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgaXQuXHJcbi8vdGhpcyBpcyB2ZXJ5IHVzZWZ1bCBpZiB5b3UgaGF2ZSBhIEFQSSB3aGljaCBleHBlY3RzIGEgZnVuY3Rpb24sIGJ1dCB5b3Ugd2FudCB0byBmZWVkIGl0IHdpdGggYSB2YWx1ZSAoc2VlIHRoZSBgZmxhdG1hcGAgZXhhbXBsZSkuIFxyXG5cclxuXHRcdC8vYS5vZihiKSAtPiBiIGFcclxuXHRcdG9mOiB2YWwgPT4gdmFsID09PSB1bmRlZmluZWQgPyBpZCA6IGYoICgpID0+IHZhbCApLFxyXG5cclxuLy9gbWFwYCBqdXN0IHdpcmVzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhbmQgdGhlIG5ldyBvbmUgdG9nZXRoZXI6XHJcblxyXG5cdFx0Ly8oYSAtPiBiKSA9PiAoYiAtPiBjKSA9PiBhIC0+IGNcclxuXHRcdG1hcDogZnVuY3Rpb24oZnVuayl7IFxyXG5cdFx0XHRpZihmdW5rID09PSB1bmRlZmluZWQpe3Rocm93IG5ldyBUeXBlRXJyb3J9XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gZnVuayggdGhpcyguLi5hcmdzKSApLCB0aGlzLl9sZW5ndGggKSBcclxuXHRcdH0sXHJcblxyXG4vL2BmbGF0YCBjcmVhdGVzIGEgZnVuY3Rpb24gdGhhdDogXHJcbi8vMS4gQ2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIHdpdGggdGhlIHN1cHBsaWVkIGFyZ3VtZW50c1xyXG4vLzIuIENhbGxzIHRoZSByZXN1bHRpbmcgZnVuY3Rpb24gKGFuZCBpdCBoYXMgdG8gYmUgb25lKSB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50c1xyXG5cclxuXHRcdC8vKGIgLT4gKGIgLT4gYykpID0+IGEgLT4gYlxyXG5cdFx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHRoaXMoLi4uYXJncykoLi4uYXJncyksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGAgXHJcblxyXG5cdFx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gdGhpcyguLi5hcmdzKVxyXG5cdFx0XHRcdGlmKHR5cGVvZiByZXN1bHQgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdFxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdCguLi5hcmdzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSkgXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG4vL1RoaXMgaXMgdGhlIGZ1bmN0aW9uIGNvbnN0cnVjdG9yLiBJdCB0YWtlcyBhIGZ1bmN0aW9uIGFuZCBhZGRzIGFuIGF1Z21lbnRlZCBmdW5jdGlvbiBvYmplY3QsIHdpdGhvdXQgZXh0ZW5kaW5nIHRoZSBwcm90b3R5cGVcclxuXHJcblx0dmFyIGYgPSAoZnVuayA9IGlkLCBsZW5ndGggPSBmdW5rLmxlbmd0aCwgaW5pdGlhbF9hcmd1bWVudHMgPSBbXSkgPT4ge1xyXG5cclxuXHRcdC8vV2UgZXhwZWN0IGEgZnVuY3Rpb24uIElmIHdlIGFyZSBnaXZlbiBhbm90aGVyIHZhbHVlLCBsaWZ0IGl0IHRvIGEgZnVuY3Rpb25cclxuXHRcdGlmKHR5cGVvZiBmdW5rICE9PSAnZnVuY3Rpb24nKXtcclxuXHRcdFx0cmV0dXJuIGYoKS5vZihmdW5rKVxyXG5cdFx0XHJcblx0XHQvL0lmIHRoZSBmdW5jdGlvbiB0YWtlcyBqdXN0IG9uZSBhcmd1bWVudCwganVzdCBleHRlbmQgaXQgd2l0aCBtZXRob2RzIGFuZCByZXR1cm4gaXQuXHJcblx0XHR9ZWxzZSBpZiAoIGxlbmd0aCA8IDIgKXtcclxuXHRcdFx0cmV0dXJuIGV4dGVuZChmdW5rLCBmX21ldGhvZHMpXHJcblxyXG5cdFx0Ly9FbHNlLCByZXR1cm4gYSBjdXJyeS1jYXBhYmxlIHZlcnNpb24gb2YgdGhlIGZ1bmN0aW9uIChhZ2FpbiwgZXh0ZW5kZWQgd2l0aCB0aGUgZnVuY3Rpb24gbWV0aG9kcylcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR2YXIgZXh0ZW5kZWRfZnVuayA9IGV4dGVuZCggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0XHR2YXIgYWxsX2FyZ3VtZW50cyAgPSAoaW5pdGlhbF9hcmd1bWVudHMpLmNvbmNhdChhcmdzKVx0XHJcblx0XHRcdFx0cmV0dXJuIGFsbF9hcmd1bWVudHMubGVuZ3RoPj1sZW5ndGg/ZnVuayguLi5hbGxfYXJndW1lbnRzKTpmKGZ1bmssIGxlbmd0aCwgYWxsX2FyZ3VtZW50cylcclxuXHRcdFx0fSwgZl9tZXRob2RzKVxyXG5cdFx0XHRcclxuXHRcdFx0ZXh0ZW5kZWRfZnVuay5fbGVuZ3RoID0gbGVuZ3RoIC0gaW5pdGlhbF9hcmd1bWVudHMubGVuZ3RoXHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX29yaWdpbmFsID0gZnVua1xyXG5cclxuXHRcdFx0cmV0dXJuIGV4dGVuZGVkX2Z1bmtcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGZ1bmN0aW9uIG9iamVjdCBpcyBleHRlbmRlZFxyXG5cclxuXHRmdW5jdGlvbiBleHRlbmQob2JqLCBtZXRob2RzKXtcclxuXHRcdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG5cdH1cclxuXHJcblx0XHJcblx0Zi5vZiA9IHZhbCA9PiBmKCAoKSA9PiB2YWwgKSxcclxuXHJcbi8vVGhlIGxpYnJhcnkgYWxzbyBmZWF0dXJlcyBhIHN0YW5kYXJkIGNvbXBvc2UgZnVuY3Rpb24gd2hpY2ggYWxsb3dzIHlvdSB0byBtYXAgbm9ybWFsIGZ1bmN0aW9ucyB3aXRoIG9uZSBhbm90aGVyXHJcblxyXG5cdGYuY29tcG9zZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9Db252ZXJ0IGZ1bmN0aW9ucyB0byBhbiBhcnJheSBhbmQgZmxpcCB0aGVtIChmb3IgcmlnaHQtdG8tbGVmdCBleGVjdXRpb24pXHJcblx0XHR2YXIgZnVuY3Rpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5yZXZlcnNlKClcclxuXHRcdC8vQ2hlY2sgaWYgaW5wdXQgaXMgT0s6XHJcblx0XHRmdW5jdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmdW5rKXtpZih0eXBlb2YgZnVuayAhPT0gXCJmdW5jdGlvblwiKXt0aHJvdyBuZXcgVHlwZUVycm9yKGZ1bmsrXCIgaXMgbm90IGEgZnVuY3Rpb25cIiApfX0pXHJcblx0XHQvL1JldHVybiB0aGUgZnVuY3Rpb24gd2hpY2ggY29tcG9zZXMgdGhlbVxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vVGFrZSB0aGUgaW5pdGlhbCBpbnB1dFxyXG5cdFx0XHR2YXIgaW5wdXQgPSBhcmd1bWVudHNcclxuXHRcdFx0dmFyIGNvbnRleHRcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9ucy5yZWR1Y2UoZnVuY3Rpb24ocmV0dXJuX3Jlc3VsdCwgZnVuaywgaSl7IFxyXG5cdFx0XHRcdC8vSWYgdGhpcyBpcyB0aGUgZmlyc3QgaXRlcmF0aW9uLCBhcHBseSB0aGUgYXJndW1lbnRzIHRoYXQgdGhlIHVzZXIgcHJvdmlkZWRcclxuXHRcdFx0XHQvL2Vsc2UgdXNlIHRoZSByZXR1cm4gcmVzdWx0IGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uXHJcblx0XHRcdFx0cmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsocmV0dXJuX3Jlc3VsdCkpXHJcblx0XHRcdFx0Ly9yZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuay5hcHBseShjb250ZXh0LCBbcmV0dXJuX3Jlc3VsdF0pKVxyXG5cdFx0XHR9LCB1bmRlZmluZWQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblx0bW9kdWxlLmV4cG9ydHMgPSBmLy8tLVxyXG4iLCJcclxuXHJcbmV4cG9ydHMuY3JlYXRlX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24gY3JlYXRlX3R5cGUobWV0aG9kcyl7XHJcblx0Ly9SZXBsYWNlIHRoZSAnb2YnIGZ1bmN0aW9uIHdpdGggYSBvbmUgdGhhdCByZXR1cm5zIGEgbmV3IG9iamVjdFxyXG5cdHZhciBvZiA9IG1ldGhvZHMub2ZcclxuXHRtZXRob2RzLm9mID0gZnVuY3Rpb24oYSxiLGMsZCl7cmV0dXJuIG9mLmFwcGx5KE9iamVjdC5jcmVhdGUobWV0aG9kcyksIGFyZ3VtZW50cyl9XHJcblx0XHJcblx0bWV0aG9kcyA9IGFkZF9taXNzaW5nX21ldGhvZHMobWV0aG9kcylcclxuXHRcclxuXHRyZXR1cm4gbWV0aG9kcy5vZjtcclxufVxyXG5cclxudmFyIGFkZF9taXNzaW5nX21ldGhvZHMgPSBleHBvcnRzLmFkZF9taXNzaW5nX21ldGhvZHMgPSBmdW5jdGlvbihvYmope1xyXG5cdC8vXCJjaGFpblwiIEFLQSBcImZsYXRNYXBcIiBpcyBlcXVpdmFsZW50IHRvIG1hcCAuIGpvaW4gXHJcblx0XHJcblx0b2JqLmNoYWluID0gb2JqLmZsYXRNYXAgPSBmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdHJldHVybiB0aGlzLm1hcChmdW5rKS5mbGF0KClcclxuXHR9XHJcblxyXG5cdC8qXHJcblx0XCJ0aGVuXCIgQUtBIFwicGhhdE1hcFwiIGlzIHRoZSByZWxheGVkIHZlcnNpb24gb2YgXCJmbGF0TWFwXCIgd2hpY2ggYWN0cyBvbiB0aGUgb2JqZWN0IG9ubHkgaWYgdGhlIHR5cGVzIG1hdGNoXHJcblx0XCJwaGF0TWFwXCIgdGhlcmVmb3JlIGNhbiBiZSB1c2VkIGFzIGJvdGggXCJtYXBcIiBhbmQgXCJmbGF0TWFwXCIsIGV4Y2VwdCBpbiB0aGUgY2FzZXMgd2hlbiB5b3Ugc3BlY2lmaWNhbGx5IHdhbnQgdG8gY3JlYXRlIGEgbmVzdGVkIG9iamVjdC5cclxuXHRJbiB0aGVzZSBjYXNlcyB5b3UgY2FuIGRvIHNvIGJ5IHNpbXBseSB1c2luZyBcIm1hcFwiIGV4cHJpY2l0bHkuXHJcblx0Ki9cclxuXHJcblx0b2JqLnRoZW4gPSBvYmoucGhhdE1hcCA9IGZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0aWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG5cdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmspLnRyeUZsYXQoKVxyXG5cdH0sXHJcblx0XHJcblx0b2JqLnByaW50ID0gZnVuY3Rpb24oKXtcclxuXHRcdGNvbnNvbGUubG9nKHRoaXMudG9TdHJpbmcoKSlcclxuXHRcdHJldHVybiB0aGlzXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gb2JqXHJcbn1cclxuIiwiXHJcblxyXG52YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG52YXIgbGlzdF9tZXRob2RzID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgcHV0cyBpdCBpbiBhIGxpc3QuXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiBsaXN0KHZhbCksXHJcblxyXG4vL2BtYXBgIGFwcGxpZXMgYSBmdW5jdGlvbiB0byBlYWNoIGVsZW1lbnQgb2YgdGhlIGxpc3QgXHJcblx0XHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRcdHJldHVybiBsaXN0KEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbCh0aGlzLCBmdW5rKSlcclxuXHRcdH0sXHJcblx0XHRcclxuLy9gZmxhdGAgdGFrZXMgYSBsaXN0IG9mIGxpc3RzIGFuZCBmbGF0dGVucyB0aGVtIHdpdGggb25lIGxldmVsIFxyXG5cclxuXHRcdC8vKGIgLT4gKGIgLT4gYykpLmpvaW4oKSA9IGEgLT4gYlxyXG5cdFx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gbGlzdCggdGhpcy5yZWR1Y2UoKGxpc3QsIGVsZW1lbnQpID0+IFsuLi5saXN0LCAuLi5lbGVtZW50XSwgW10pIClcclxuXHRcdH0sXHJcblx0XHRcclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYFxyXG4vL2FuZCB3aXRoIGl0LCB5b3VyIGZ1bmsgY2FuIHJldHVybiBib3RoIGEgbGlzdCBvZiBvYmplY3RzIGFuZCBhIHNpbmdsZSBvYmplY3RcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBsaXN0KCB0aGlzLnJlZHVjZSgobGlzdCwgZWxlbWVudCkgPT4gXHJcblx0XHRcdFx0ZWxlbWVudC5jb25zdHJ1Y3RvciA9PT0gQXJyYXk/IFsuLi5saXN0LCAuLi5lbGVtZW50XSA6IFsuLi5saXN0LCBlbGVtZW50XSAsIFtdKVxyXG5cdFx0XHQpXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG4vL1RoaXMgaXMgdGhlIGxpc3QgY29uc3RydWN0b3IuIEl0IHRha2VzIG5vcm1hbCBhcnJheSBhbmQgYXVnbWVudHMgaXQgd2l0aCB0aGUgYWJvdmUgbWV0aG9kc1xyXG5cclxuXHR2YXIgbGlzdCA9ICguLi5hcmdzKSA9PiB7XHJcblx0XHQvL0FjY2VwdCBhbiBhcnJheVxyXG5cdFx0aWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkgKXtcclxuXHRcdFx0cmV0dXJuICBPYmplY3QuZnJlZXplKGV4dGVuZChhcmdzWzBdLCBsaXN0X21ldGhvZHMpKVxyXG5cdFx0Ly9BY2NlcHQgc2V2ZXJhbCBhcmd1bWVudHNcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShleHRlbmQoYXJncywgbGlzdF9tZXRob2RzKSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGxpc3Qgb2JqZWN0IGlzIGV4dGVuZGVkXHJcblxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3QvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIG1heWJlX3Byb3RvID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL1RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgd3JhcHMgaXQgaW4gYSBgbWF5YmVgLlxyXG4vL0luIHRoaXMgY2FzZSB3ZSBkbyB0aGlzIGJ5IGp1c3QgY2FsbGluZyB0aGUgY29uc3RydWN0b3IuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbihpbnB1dCl7XHJcblx0XHRyZXR1cm4gbWF5YmUoaW5wdXQpXHJcblx0fSxcclxuXHJcbi8vYG1hcGAgdGFrZXMgdGhlIGZ1bmN0aW9uIGFuZCBhcHBsaWVzIGl0IHRvIHRoZSB2YWx1ZSBpbiB0aGUgbWF5YmUsIGlmIHRoZXJlIGlzIG9uZS5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nKXtcclxuXHRcdFx0cmV0dXJuIG1heWJlKGZ1bmsodGhpcy5fdmFsdWUpKVxyXG5cdFx0fWVsc2V7XHRcclxuXHRcdFx0cmV0dXJuIHRoaXMgXHJcblx0XHR9XHJcblx0fSxcclxuXHJcbi8vYGZsYXRgIHRha2VzIGEgbWF5YmUgdGhhdCBjb250YWlucyBhbm90aGVyIG1heWJlIGFuZCBmbGF0dGVucyBpdC5cclxuLy9JbiB0aGlzIGNhc2UgdGhpcyBtZWFucyBqdXN0IHJldHVybmluZyB0aGUgaW5uZXIgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0aWYodGhpcyAhPT0gbm90aGluZyAmJiB0aGlzLl92YWx1ZS5jb25zdHJ1Y3RvciA9PT0gbWF5YmUpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxufSkvLy0tXHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgbWF5YmUgY29uc3RydWN0b3IgaXMgaW1wbGVtZW50ZWRcclxuXHJcblxyXG5cdHZhciBtYXliZSA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRcdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKXtcclxuXHRcdFx0cmV0dXJuIG5vdGhpbmdcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR2YXIgb2JqID0gT2JqZWN0LmNyZWF0ZShtYXliZV9wcm90bylcclxuXHRcdFx0b2JqLl92YWx1ZSA9IHZhbHVlXHJcblx0XHRcdG9iai5jb25zdHJ1Y3RvciA9IG1heWJlXHJcblx0XHRcdE9iamVjdC5mcmVlemUob2JqKVxyXG5cdFx0XHRyZXR1cm4gb2JqXHJcblx0XHR9XHJcblx0fVxyXG5cclxudmFyIG5vdGhpbmcgPSBPYmplY3QuY3JlYXRlKG1heWJlX3Byb3RvKS8vLS1cclxubm90aGluZy5jb25zdHJ1Y3RvciA9IG1heWJlLy8tLVxyXG5PYmplY3QuZnJlZXplKG5vdGhpbmcpLy8tLVxyXG5tYXliZS5ub3RoaW5nID0gbm90aGluZy8vLS1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbWF5YmUvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIHByb21pc2VQcm90byA9IGhlbHBlcnMuYWRkX21pc3NpbmdfbWV0aG9kcyh7Ly8tLVxyXG5cclxuLy9UaGUgYG9mYCBtZXRob2QgdGFrZXMgYSB2YWx1ZSBhbmQgd3JhcHMgaXQgaW4gYSBwcm9taXNlLCBieSBpbW1lZGlhdGVseSBjYWxsaW5nIHRoZSByZXNvbHZlciBmdW5jdGlvbiB3aXRoIGl0LlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24odmFsKXtcclxuXHRcdHJldHVybiBwcm9taXNlKCAocmVzb2x2ZSkgPT4gcmVzb2x2ZSh2YWwpIClcclxuXHR9LFxyXG5cclxuLy9UaGUgYG1hcGAgbWV0aG9kIGNyZWF0ZXMgYSBuZXcgcHJvbWlzZSwgc3VjaCB0aGF0IHdoZW4gdGhlIG9sZCBwcm9taXNlIGlzIHJlc29sdmVkLCBpdCB0YWtlcyBpdHMgcmVzdWx0LCBcclxuLy9hcHBsaWVzIGBmdW5rYCB0byBpdCBhbmQgdGhlbiByZXNvbHZlcyBpdHNlbGYgd2l0aCB0aGUgdmFsdWUuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiB0aGlzLl9yZXNvbHZlciggKHZhbCkgPT4gcmVzb2x2ZSggZnVuayh2YWwpICkgKSApXHJcblxyXG5cdH0sXHJcblxyXG4vL0luIHRoaXMgY2FzZSB0aGUgaW1wbGVtZW50YXRpb24gb2YgYGZsYXRgIGlzIHF1aXRlIHNpbXBsZS5cclxuXHJcbi8vRWZmZWN0aXZlbHkgYWxsIHdlIGhhdmUgdG8gZG8gaXMgcmV0dXJuIHRoZSBzYW1lIHZhbHVlIHdpdGggd2hpY2ggdGhlIGlubmVyIHByb21pc2UgaXMgcmVzb2x2ZWQuXHJcbi8vVG8gZG8gdGhpcywgd2UgdW53cmFwIG91ciBwcm9taXNlIG9uY2UgdG8gZ2V0IHRoZSBpbm5lciBwcm9taXNlIHZhbHVlLCBhbmQgdGhlbiB1bndyYXAgdGhlIGlubmVyXHJcbi8vcHJvbWlzZSBpdHNlbGYgdG8gZ2V0IGl0cyB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBwcm9taXNlKCAocmVzb2x2ZSkgPT4gXHJcblx0XHRcdHRoaXMuX3Jlc29sdmVyKFx0KGlubmVyX3Byb21pc2UpID0+IFxyXG5cdFx0XHRcdGlubmVyX3Byb21pc2UuX3Jlc29sdmVyKCh2YWwpID0+IHJlc29sdmUodmFsKSlcclxuXHRcdFx0KSBcclxuXHRcdClcclxuXHR9LFxyXG5cclxuLy9UaGUgYHJ1bmAgZnVuY3Rpb24ganVzdCBmZWVkcyB0aGUgcmVzb2x2ZXIgd2l0aCBhIHBsYWNlaG9sZGVyICBmdW5jdGlvbiBzbyBvdXIgY29tcHV0YXRpb24gY2FuXHJcbi8vc3RhcnQgZXhlY3V0aW5nLlxyXG5cclxuXHRydW46ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLl9yZXNvbHZlcihmdW5jdGlvbihhKXtyZXR1cm4gYX0pXHJcblx0fVxyXG5cdFxyXG59KS8vLS1cclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHByb21pc2UgPSBmdW5jdGlvbihyZXNvbHZlKXtcclxuXHRcdGlmKHR5cGVvZiByZXNvbHZlICE9PSBcImZ1bmN0aW9uXCIpeyByZXR1cm4gcHJvbWlzZVByb3RvLm9mKHJlc29sdmUpIH1cclxuXHRcdGNvbnN0IG9iaiA9IE9iamVjdC5jcmVhdGUocHJvbWlzZVByb3RvKVxyXG5cclxuXHRcdG9iai5fcmVzb2x2ZXIgPSByZXNvbHZlXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBwcm9taXNlXHJcblx0XHRvYmoucHJvdG90eXBlID0gcHJvbWlzZVByb3RvXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByb21pc2UvLy0tXHJcbiIsIlxyXG5jb25zdCBmID0gcmVxdWlyZShcIi4vZlwiKS8vLS1cclxuXHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuY29uc3Qgc3RhdGVQcm90byA9IGhlbHBlcnMuYWRkX21pc3NpbmdfbWV0aG9kcyh7Ly8tLVxyXG5cclxuLy9gb2ZgIGp1c3QgdXNlcyB0aGUgY29uc3RydWN0b3IgYW5kIGRvZXMgbm90IHRvdWNoIHRoZSBzdGF0ZS5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBzdGF0ZSgocHJldlN0YXRlKSA9PiBbaW5wdXQsIHByZXZTdGF0ZV0pXHJcblx0fSxcclxuXHJcbi8vYG1hcGAgaXMgZG9uZSBieSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gdGhlIHZhbHVlIGFuZCBrZWVwaW5nIHRoZSBzdGF0ZSB1bmNoYW5nZWQuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0YXRlKCB0aGlzLl9ydW5TdGF0ZS5tYXAoKFtpbnB1dCwgcHJldlN0YXRlXSkgPT4gW2Z1bmsoaW5wdXQpLCBwcmV2U3RhdGVdKSlcclxuXHR9LFxyXG5cdFxyXG4vL2BmbGF0YCBkb2VzIHRoZSBmb2xsb3dpbmc6XHJcbi8vMS4gUnVucyB0aGUgY29kZSB0aGF0IHdlIGxvYWRlZCBpbiB0aGUgbW9uYWQgc28sIGZhciAodXNpbmcgdGhlIGBydW5gIGZ1bmN0aW9uKS5cclxuLy8yLiBTYXZlcyB0aGUgbmV3IHN0YXRlIG9iamVjdCBhbmQgdGhlIHZhbHVlIHdoaWNoIGlzIGtlcHQgYnkgdGhlIGZ1bmN0aW9ucyBzbyBmYXIuXHJcbi8vMy4gQWZ0ZXIgZG9pbmcgdGhhdCwgaXQgYXJyYW5nZXMgdGhvc2UgdHdvIGNvbXBvbmVudHMgKHRoZSBvYmplY3QgYW5kIHRoZSB2YWx1ZSkgaW50byBhIHlldCBhbm90aGVyXHJcbi8vc3RhdGUgb2JqZWN0LCB3aGljaCBydW5zIHRoZSBtdXRhdG9yIGZ1bmN0aW9uIG9mIHRoZSBmaXJzdCBvYmplY3QsIHdpdGggdGhlIHN0YXRlIHRoYXQgd2UgaGF2ZSBzbywgZmFyXHJcblxyXG5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdC8vRXh0cmFjdCBzdGF0ZSBtdXRhdG9yIGFuZCB2YWx1ZSBcclxuXHRcdGNvbnN0IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSA9IHRoaXMucnVuKClcclxuXHRcdC8vQ29tcG9zZSB0aGUgbXV0YXRvciBhbmQgdGhlIHZhbHVlXHJcblx0XHRyZXR1cm4gc3RhdGUoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdH0sXHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cclxuXHRcdC8vRXh0cmFjdCBjdXJyZW50IHN0YXRlIFxyXG5cdFx0Y29uc3QgW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdID0gdGhpcy5ydW4oKVxyXG5cdFx0XHJcblx0XHQvL0NoZWNrIGlmIGl0IGlzIHJlYWxseSBhIHN0YXRlXHJcblx0XHRpZihzdGF0ZU9iai5jb25zdHJ1Y3RvciA9PT0gc3RhdGUpe1xyXG5cdFx0XHRyZXR1cm4gc3RhdGUoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiBzdGF0ZSgoKSA9PiBbc3RhdGVPYmosIGN1cnJlbnRTdGF0ZV0pXHJcblx0XHR9XHJcblx0fSxcclxuXHJcbi8vV2UgaGF2ZSB0aGUgYHJ1bmAgZnVuY3Rpb24gd2hpY2ggY29tcHV0ZXMgdGhlIHN0YXRlOlxyXG5cclxuXHRydW46ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLl9ydW5TdGF0ZSgpXHJcblx0fSxcclxuLy9BbmQgdGhlIGBzYXZlYCBhbmQgYGxvYWRgIGZ1bmN0aW9ucyBhcmUgZXhhY3RseSB3aGF0IG9uZSB3b3VsZCBleHBlY3RcclxuXHJcblx0bG9hZDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiBzdGF0ZSggKHN0YXRlKSA9PiBbc3RhdGUsIHN0YXRlXSApIClcclxuXHR9LFxyXG5cdHNhdmU6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gc3RhdGUoIChzdGF0ZSkgPT4gW3ZhbHVlLCB2YWx1ZV0gKSApXHJcblx0fSxcclxuXHRsb2FkS2V5OmZ1bmN0aW9uKGtleSl7XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHN0YXRlKCAoc3RhdGUpID0+IFtzdGF0ZVtrZXldLCBzdGF0ZV0gKSApXHJcblx0fSxcclxuXHRzYXZlS2V5OmZ1bmN0aW9uKGtleSl7XHJcblx0XHRjb25zdCB3cml0ZSA9IChvYmosIGtleSwgdmFsKSA9PiB7XHJcblx0XHRcdG9iaiA9IHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgPyAgb2JqIDoge31cclxuXHRcdFx0b2JqW2tleV0gPSB2YWxcclxuXHRcdFx0cmV0dXJuIG9ialxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiBzdGF0ZSggKHN0YXRlKSA9PiBbdmFsdWUsIHdyaXRlKHN0YXRlLCBrZXksIHZhbHVlKV0gKSApXHJcblx0fSxcclxuXHR0b1N0cmluZzpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMucnVuKCkpXHJcblx0fVxyXG5cdFxyXG59KVxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIHN0YXRlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHN0YXRlID0gZnVuY3Rpb24ocnVuKXtcclxuXHRcdGlmKHR5cGVvZiBydW4gIT09IFwiZnVuY3Rpb25cIil7IHJldHVybiBzdGF0ZVByb3RvLm9mKHJ1bikgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShzdGF0ZVByb3RvKVxyXG5cdFx0b2JqLl9ydW5TdGF0ZSA9IGYocnVuLDEpXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBzdGF0ZVxyXG5cdFx0b2JqLnByb3RvdHlwZSA9IHN0YXRlUHJvdG9cclxuXHRcdE9iamVjdC5mcmVlemUob2JqKVxyXG5cdFx0cmV0dXJuIG9ialxyXG5cdH1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc3RhdGUvLy0tXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogZnVuY3Rpb25cclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGZ1bmN0aW9uIG1vbmFkIGF1Z21lbnRzIHN0YW5kYXJkIEphdmFTY3JpcHQgZnVuY3Rpb25zIHdpdGggZmFjaWxpdGllcyBmb3IgY29tcG9zaXRpb24gYW5kIGN1cnJ5aW5nLlxyXG48IS0tbW9yZS0tPlxyXG5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiZnVuY3Rpb25zXCIpLy8tLVxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjb25zdHJ1Y3QgZnVuY3Rpb25zIGxpbmUgdGhpc1xyXG5cdFxyXG5cdFx0dmFyIHBsdXNfMSA9IGYoIChudW0pID0+IG51bSsxIClcclxuXHJcblxyXG4vL0FmdGVyIHlvdSBkbyB0aGF0LCB5b3Ugd2lsbCBzdGlsbCBiZSBhYmxlIHRvIHVzZSBgcGx1c18xYCBsaWtlIGEgbm9ybWFsIGZ1bmN0aW9uLCBidXQgeW91IGNhbiBhbHNvIGRvIHRoZSBmb2xsb3dpbmc6XHJcblxyXG5cclxuLypcclxuQ3VycnlpbmdcclxuLS0tLVxyXG5XaGVuIHlvdSBjYWxsIGEgZnVuY3Rpb24gYGZgIHdpdGggbGVzcyBhcmd1bWVudHMgdGhhdCBpdCBhY2NlcHRzLCBpdCByZXR1cm5zIGEgcGFydGlhbGx5IGFwcGxpZWRcclxuKGJvdW5kKSB2ZXJzaW9uIG9mIGl0c2VsZiB0aGF0IG1heSBhdCBhbnkgdGltZSBiZSBjYWxsZWQgd2l0aCB0aGUgcmVzdCBvZiB0aGUgYXJndW1lbnRzLlxyXG4qL1xyXG5cclxuXHRRVW5pdC50ZXN0KFwiY3VycnlcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRjb25zdCBhZGQzID0gZiggKGEsYixjKSA9PiBhK2IrYyApXHJcblx0XHRcclxuXHRcdGNvbnN0IGFkZDIgPSBhZGQzKDApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGFkZDIoMSwgMSksIDIgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBhZGQyKDUsIDUpLCAxMCApXHJcblxyXG5cdFx0Y29uc3QgcGx1czEwID0gYWRkMigxMClcclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czEwKDUpLCAxNSApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMxMCgxMCksIDIwIClcclxuXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxuYG9mKHZhbHVlKWBcclxuLS0tLVxyXG5JZiBjYWxsZWQgd2l0aCBhIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBpdCBjb25zdHJ1Y3RzIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGF0IHZhbHVlLlxyXG5JZiBjYWxsZWQgd2l0aG91dCBhcmd1bWVudHMgaXQgcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgdGhlIGFyZ3VtZW50cyBnaXZlbiB0byBpdC5cclxuKi9cclxuXHRRVW5pdC50ZXN0KFwib2ZcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRjb25zdCByZXR1cm5zOSA9IGYoKS5vZig5KVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCByZXR1cm5zOSgzKSwgOSApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHJldHVybnM5KFwiYVwiKSwgOSApXHJcblxyXG5cdFx0Y29uc3QgaWQgPSBmKCkub2YoKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBpZCgzKSwgMyApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGlkKFwiYVwiKSwgXCJhXCIgKVxyXG5cclxuXHR9KS8vLS1cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5DcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGZpcnN0LCB0aGVuIGNhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50OlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRcclxuLy9Zb3UgY2FuIGNyZWF0ZSBhIEZ1bmN0aW9uIE1vbmFkIGJ5IHBhc3NpbmcgYSBub3JtYWwgSmF2YVNjcmlwdCBmdW5jdGlvbiB0byB0aGUgY29uc3RydWN0b3IgKHlvdSBjYW4gd3JpdGUgdGhlIGZ1bmN0aW9uIGRpcmVjdGx5IHRoZXJlKTpcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXMxID0gZiggbnVtID0+IG51bSsxIClcclxuXHJcblxyXG4vL1RoZW4gbWFraW5nIGFub3RoZXIgZnVuY3Rpb24gaXMgZWFzeTpcclxuXHJcblx0XHR2YXIgcGx1czIgPSBwbHVzMS5tYXAocGx1czEpIFxyXG5cclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czIoMCksIDIgKVxyXG5cdFx0XHJcblx0XHR2YXIgcGx1czQgPSBwbHVzMi5tYXAocGx1czIpXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzNCgxKSwgNSApXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAgZXhjZXB0IHRoYXQgaWYgYGZ1bmtgIHJldHVybnMgYW5vdGhlciBmdW5jdGlvbiBpdCByZXR1cm5zIGEgdGhpcmQgZnVuY3Rpb24gd2hpY2g6XHJcbjEuIENhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdC5cclxuMi4gQ2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnRcclxuMy4gQ2FsbHMgdGhlIGZ1bmN0aW9uIHJldHVybmVkIGJ5IGBmdW5rYCB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50IGFuZCByZXR1cm5zIHRoZSByZXN1bHQgb2YgdGhlIHNlY29uZCBjYWxsLlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9Zb3UgY2FuIHVzZSBgcGhhdE1hcGAgdG8gbW9kZWwgc2ltcGxlIGlmLXRoZW4gc3RhdGVtZW50cy4gVGhlIGZvbGxvd2luZyBleGFtcGxlIHVzZXMgaXQgaW4gY29tYmluYXRpb24gb2YgdGhlIGN1cnJ5aW5nIGZ1bmN0aW9uYWxpdHk6XHJcblx0XHRcclxuXHRcdHZhciBjb25jYXQgPSBmKCAoc3RyMSwgc3RyMikgPT4gc3RyMSArIHN0cjIpXHJcblxyXG5cdFx0dmFyIG1ha2VNZXNzYWdlID0gZihwYXJzZUludCwgMSlcclxuXHRcdFx0LmZsYXRNYXAoKG51bSkgPT4gaXNOYU4obnVtKT8gZihcIkVycm9yLiBOb3QgYSBudW1iZXJcIikgOiBjb25jYXQoXCJUaGUgbnVtYmVyIGlzIFwiKSApXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIjFcIiksIFwiVGhlIG51bWJlciBpcyAxXCIpXHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIyXCIpLCBcIlRoZSBudW1iZXIgaXMgMlwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiWVwiKSwgXCJFcnJvci4gTm90IGEgbnVtYmVyXCIpXHJcblxyXG4vKlxyXG5cclxuYHBoYXRNYXBgIGlzIHNpbWlsYXIgdG8gdGhlIGA+Pj1gIGZ1bmN0aW9uIGluIEhhc2tlbGwsIHdoaWNoIGlzIHRoZSBidWlsZGluZyBibG9jayBvZiB0aGUgaW5mYW1vdXMgYGRvYCBub3RhdGlvblxyXG5JdCBjYW4gYmUgdXNlZCB0byB3cml0ZSBwcm9ncmFtcyB3aXRob3V0IHVzaW5nIGFzc2lnbm1lbnQuXHRcclxuXHJcbkZvciBleGFtcGxlIGlmIHdlIGhhdmUgdGhlIGZvbGxvd2luZyBmdW5jdGlvbiBpbiBIYXNrZWxsOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gZG8gIFxyXG5cdFx0XHRhIDwtICgqMikgIFxyXG5cdFx0XHRiIDwtICgrMTApICBcclxuXHRcdFx0cmV0dXJuIChhK2IpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cclxuV2hlbiB3ZSBkZXN1Z2FyIGl0LCB0aGlzIGJlY29tZXM6XHJcblxyXG5cdFx0YWRkU3R1ZmYgPSAoKjIpID4+PSBcXGEgLT5cclxuXHRcdFx0XHQoKzEwKSA+Pj0gXFxiIC0+XHJcblx0XHRcdFx0XHRyZXR1cm4gKGErYilcclxuXHJcbm9yIGluIEphdmFTY3JpcHQgdGVybXM6XHJcblxyXG4qL1xyXG5cclxuXHRcdHZhciBhZGRTdHVmZiA9IGYoIG51bSA9PiBudW0gKiAyIClcclxuXHRcdFx0LmZsYXRNYXAoIGEgPT4gZiggbnVtID0+IG51bSArIDEwIClcclxuXHRcdFx0XHQuZmxhdE1hcCggYiA9PiBmLm9mKGEgKyBiKSApIFxyXG5cdFx0XHQpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBsaXN0IFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYGxpc3RgIHR5cGUsIGF1Z21lbnRzIHRoZSBzdGFuZGFyZCBKYXZhU2NyaXB0IGFycmF5cywgbWFraW5nIHRoZW0gaW1tdXRhYmxlIGFuZCBhZGRpbmcgYWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5IHRvIHRoZW1cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIkxpc3RcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgbGlzdGAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbGlzdCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2xpc3RcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY3JlYXRlIGEgYGxpc3RgIGZyb20gYXJyYXkgbGlrZSB0aGlzXHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoWzEsMiwzXSlcclxuLy9vciBsaWtlIHRoaXM6XHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoMSwyLDMpXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcblN0YW5kYXJkIGFycmF5IG1ldGhvZC4gRXhlY3V0ZXMgYGZ1bmtgIGZvciBlYWNoIG9mIHRoZSB2YWx1ZXMgaW4gdGhlIGxpc3QgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbGlzdC5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdHZhciBwZW9wbGUgPSBsaXN0KCB7bmFtZTpcImpvaG5cIiwgYWdlOjI0LCBvY2N1cGF0aW9uOlwiZmFybWVyXCJ9LCB7bmFtZTpcImNoYXJsaWVcIiwgYWdlOjIyLCBvY2N1cGF0aW9uOlwicGx1bWJlclwifSlcclxuXHR2YXIgbmFtZXMgPSBwZW9wbGUubWFwKChwZXJzb24pID0+IHBlcnNvbi5uYW1lIClcclxuXHRhc3NlcnQuZGVlcEVxdWFsKG5hbWVzLCBbXCJqb2huXCIsIFwiY2hhcmxpZVwiXSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgbGlzdCBvciBhbiBhcnJheSBpdCBmbGF0dGVucyB0aGUgcmVzdWx0cyBpbnRvIG9uZSBhcnJheVxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcclxuXHR2YXIgb2NjdXBhdGlvbnMgPSBsaXN0KFsgXHJcblx0XHR7b2NjdXBhdGlvbjpcImZhcm1lclwiLCBwZW9wbGU6W1wiam9oblwiLCBcInNhbVwiLCBcImNoYXJsaWVcIl0gfSxcclxuXHRcdHtvY2N1cGF0aW9uOlwicGx1bWJlclwiLCBwZW9wbGU6W1wibGlzYVwiLCBcInNhbmRyYVwiXSB9LFxyXG5cdF0pXHJcblx0XHJcblx0dmFyIHBlb3BsZSA9IG9jY3VwYXRpb25zLnBoYXRNYXAoKG9jY3VwYXRpb24pID0+IG9jY3VwYXRpb24ucGVvcGxlKVxyXG5cdGFzc2VydC5kZWVwRXF1YWwocGVvcGxlLFtcImpvaG5cIiwgXCJzYW1cIiwgXCJjaGFybGllXCIsIFwibGlzYVwiLCBcInNhbmRyYVwiXSlcclxuXHJcbn0pLy8tLVxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBtYXliZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYG1heWJlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBvcHRpb25gIHR5cGUgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgdGhhdCBtYXkgbm90IGJlIHRoZXJlLiBcclxuXHJcblRoZSBwdXJwb3NlIG9mIHRoaXMgbW9uYWQgaXMgdG8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB3cml0aW5nIGBudWxsYCBjaGVja3MuIFxyXG5GdXJ0aGVybW9yZSBpdCBhbHNvIGVsaW1pbmF0ZXMgdGhlIHBvc3NpYmlsaXR5IG9mIG1ha2luZyBlcnJvcnMgYnkgbWlzc2luZyBudWxsLWNoZWNrcy5cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIk1heWJlXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYG1heWJlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBtYXliZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L21heWJlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIHdyYXAgYSB2YWx1ZSBpbiBgbWF5YmVgIHdpdGg6XHJcblx0XHR2YXIgdmFsID0gNC8vLS1cclxuXHRcdHZhciBtYXliZV92YWwgPSBtYXliZSh2YWwpXHJcblxyXG4vL0lmIHRoZSAndmFsJyBpcyBlcXVhbCB0byAqdW5kZWZpbmVkKiBpdCB0aHJlYXRzIHRoZSBjb250YWluZXIgYXMgZW1wdHkuXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIGBmdW5rYCB3aXRoIHRoZSBgbWF5YmVgJ3MgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGJ1dCBvbmx5IGlmIHRoZSB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSAqdW5kZWZpbmVkKiwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbWF5YmUuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vVHJhZGl0aW9uYWxseSwgaWYgd2UgaGF2ZSBhIHZhbHVlIHRoYXQgbWF5IGJlIHVuZGVmaW5lZCB3ZSBkbyBhIG51bGwgY2hlY2sgYmVmb3JlIGRvaW5nIHNvbWV0aGluZyB3aXRoIGl0OlxyXG5cclxuXHR2YXIgb2JqID0ge30vLy0tXHJcblx0dmFyIGdldF9wcm9wZXJ0eSA9IGYoKG9iamVjdCkgPT4gb2JqZWN0LnByb3BlcnR5KS8vLS1cclxuXHRcclxuXHR2YXIgdmFsID0gZ2V0X3Byb3BlcnR5KG9iailcclxuXHRcclxuXHRpZih2YWwgIT09IHVuZGVmaW5lZCl7XHJcblx0XHR2YWwgPSB2YWwudG9TdHJpbmcoKVxyXG5cdH1cclxuXHRhc3NlcnQuZXF1YWwodmFsLCB1bmRlZmluZWQpIFxyXG5cclxuLy9XaXRoIGBtYXBgIHRoaXMgY2FuIGJlIHdyaXR0ZW4gbGlrZSB0aGlzXHJcblxyXG4gXHR2YXIgbWF5YmVfZ2V0X3Byb3BlcnR5ID0gZ2V0X3Byb3BlcnR5Lm1hcChtYXliZSlcclxuXHJcblx0bWF5YmVfZ2V0X3Byb3BlcnR5KG9iaikubWFwKCh2YWwpID0+IHtcclxuXHRcdGFzc2VydC5vayhmYWxzZSkvLy0tXHJcblx0XHR2YWwudG9TdHJpbmcoKS8vdGhpcyBpcyBub3QgZXhlY3V0ZWRcclxuXHR9KVxyXG5cclxuLy9UaGUgYmlnZ2VzdCBiZW5lZml0IHdlIGdldCBpcyB0aGF0IGluIHRoZSBmaXJzdCBjYXNlIHdlIGNhbiBlYXNpbHkgZm9yZ2V0IHRoZSBudWxsIGNoZWNrOlxyXG5cdFxyXG5cdGFzc2VydC50aHJvd3MoZnVuY3Rpb24oKXtcclxuXHRcdGdldF9wcm9wZXJ0eShvYmopLnRvU3RyaW5nKCkgIC8vdGhpcyBibG93cyB1cFxyXG5cdH0pXHJcblxyXG4vL1doaWxlIGluIHRoZSBzZWNvbmQgY2FzZSB3ZSBjYW5ub3QgYWNjZXNzIHRoZSB1bmRlcmx5aW5nIHZhbHVlIGRpcmVjdGx5LCBhbmQgdGhlcmVmb3JlIGNhbm5vdCBleGVjdXRlIGFuIGFjdGlvbiBvbiBpdCwgaWYgaXQgaXMgbm90IHRoZXJlLlxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgYG1heWJlYCBpdCBmbGF0dGVucyB0aGUgdHdvIGBtYXliZXNgIGludG8gb25lLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vYG1hcGAgd29ya3MgZmluZSBmb3IgZWxpbWluYXRpbmcgZXJyb3JzLCBidXQgaXQgZG9lcyBub3Qgc29sdmUgb25lIG9mIHRoZSBtb3N0IGFubm95aW5nIHByb2JsZW1zIHdpdGggbnVsbC1jaGVja3MgLSBuZXN0aW5nOlxyXG5cclxuXHR2YXIgb2JqID0geyBmaXJzdDoge3NlY29uZDpcInZhbFwiIH0gfVxyXG5cdFxyXG5cdG1heWJlKG9iailcclxuXHRcdC5tYXAoIHJvb3QgPT4gbWF5YmUocm9vdC5maXJzdCkpXHJcblx0XHQubWFwKCBtYXliZUZpcnN0ID0+IG1heWJlRmlyc3QubWFwIChmaXJzdCA9PiBtYXliZSAobWF5YmVGaXJzdC5zZWNvbmQgKSApICkgXHJcblx0XHQubWFwKCBtYXliZU1heWJlVmFsdWUgPT4gbWF5YmVNYXliZVZhbHVlLm1hcCAobWF5YmVWYWx1ZSA9PiBtYXliZVZhbHVlLm1hcCggKHZhbHVlKT0+KCBhc3NlcnQuZXF1YWwoIHZhbCwgXCJ2YWxcIikgKSApICkgKVxyXG5cclxuLy9gcGhhdE1hcGAgZG9lcyB0aGUgZmxhdHRlbmluZyBmb3IgdXMsIGFuZCBhbGxvd3MgdXMgdG8gd3JpdGUgY29kZSBsaWtlIHRoaXNcclxuXHJcblx0bWF5YmUob2JqKVxyXG5cdFx0LmZsYXRNYXAocm9vdCA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5mbGF0TWFwKGZpcnN0ID0+IG1heWJlKGZpcnN0LnNlY29uZCkpXHJcblx0XHQuZmxhdE1hcCh2YWwgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwodmFsLCBcInZhbFwiKVxyXG5cdFx0fSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuQWR2YW5jZWQgVXNhZ2VcclxuLS0tLVxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImFkdmFuY2VkXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4vLyBgbWF5YmVgIGNhbiBiZSB1c2VkIHdpdGggdGhlIGZ1bmN0aW9uIG1vbmFkIHRvIGVmZmVjdGl2ZWx5IHByb2R1Y2UgJ3NhZmUnIHZlcnNpb25zIG9mIGZ1bmN0aW9uc1xyXG5cclxuXHR2YXIgZ2V0ID0gZigocHJvcCwgb2JqKSA9PiBvYmpbcHJvcF0pXHJcblx0dmFyIG1heWJlR2V0ID0gZ2V0Lm1hcChtYXliZSlcclxuXHJcbi8vVGhpcyBjb21iaW5lZCB3aXRoIHRoZSB1c2Ugb2YgY3VycnlpbmcgbWFrZXMgZm9yIGEgdmVyeSBmbHVlbnQgc3R5bGUgb2YgY29kaW5nOlxyXG5cclxuXHR2YXIgZ2V0Rmlyc3RTZWNvbmQgPSAocm9vdCkgPT4gbWF5YmUocm9vdCkucGhhdE1hcChtYXliZUdldCgnZmlyc3QnKSkucGhhdE1hcChtYXliZUdldCgnc2Vjb25kJykpXHJcblx0XHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDoge3NlY29uZDpcInZhbHVlXCIgfSB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcInZhbHVlXCIpKVxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJvdGhlcl92YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJvdGhlcl92YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiBcIlwiIH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwid2hhdGV2ZXJcIikgKS8vd29uJ3QgYmUgZXhlY3V0ZWQgXHJcblxyXG59KS8vLS1cclxuXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBwcm9taXNlIFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHByb21pc2VgIHR5cGUsIGFsc28ga25vd24gYXMgYGZ1dHVyZWAgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgd2hpY2ggd2lsbCBiZSByZXNvbHZlZCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUsIFxyXG52aWEgYW4gYXN5bmNocm9ub3VzIG9wZXJhdGlvbi4gXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJQcm9taXNlXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYHByb21pc2VgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIHByb21pc2UgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9wcm9taXNlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVG8gY3JlYXRlIGEgYHByb21pc2VgIHBhc3MgYSBmdW5jdGlvbiB3aGljaCBhY2NlcHRzIGEgY2FsbGJhY2sgYW5kIGNhbGxzIHRoYXQgY2FsbGJhY2sgd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlOlxyXG5cdFx0dmFyIG15X3Byb21pc2UgPSBwcm9taXNlKCAocmVzb2x2ZSkgPT4gIFxyXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHsgcmVzb2x2ZSg1KSB9LDEwMDApICBcclxuXHRcdClcclxuXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0gLS0tXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0Lm1vZHVsZShcInByb21pc2VzXCIpXHJcblxyXG5RVW5pdC50ZXN0KFwidGhlblwiLCBmdW5jdGlvbihhc3NlcnQpe1xyXG5cdHZhciBkb25lID0gYXNzZXJ0LmFzeW5jKClcclxuXHR2YXIgcCA9IHByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSl7XHJcblx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcblx0XHRcdHJlc29sdmUoMSlcclxuXHJcblx0XHR9LCAxMDAwKVxyXG5cdH0pXHJcblx0LmZsYXRNYXAoZnVuY3Rpb24odmFsKXsgIFxyXG5cdFx0cmV0dXJuIHByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSl7XHJcblx0XHRcdHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRyZXNvbHZlKHZhbCArIDEpXHJcblx0XHRcdH0sIDEwMDApICBcclxuXHRcdH0pXHJcblx0XHJcblx0XHJcblx0fSlcclxuXHQubWFwKGZ1bmN0aW9uKHZhbCl7XHJcblx0XHRhc3NlcnQuZXF1YWwodmFsLCAyLCAnQ2hhaW5lZCBjb21wdXRhdGlvbiByZXR1cm5zIGNvcnJlY3QgdmFsdWUnKVxyXG5cdFx0ZG9uZSgpXHJcblx0fSlcclxuXHJcblx0Y29uc29sZS5sb2cocClcclxuXHRwLnJ1bigpXHJcblx0XHJcblxyXG59KVxyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBzdGF0ZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHN0YXRlYCB0eXBlLCBpcyBhIGNvbnRhaW5lciB3aGljaCBlbmNhcHN1bGF0ZXMgYSBzdGF0ZWZ1bCBmdW5jdGlvbi4gSXQgYmFzaWNhbGx5IGFsbG93cyB5b3UgdG8gY29tcG9zZSBmdW5jdGlvbnMsXHJcbmxpa2UgeW91IGNhbiBkbyB3aXRoIHRoZSBgZmAgdHlwZSwgZXhjZXB0IHdpdGggaXQgYW55IGZ1bmN0aW9uIGNhbiBhY2Nlc3MgYW4gYWRkaXRpb25hbCBcInZhcmlhYmxlXCIgYmVzaWRlcyBpdHNcclxuaW5wdXQgYXJndW1lbnQocykgLSB0aGUgc3RhdGUuIFxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiU3RhdGVcIikvLy0tXHJcblxyXG4vL1RvIHVzZSB0aGUgYHN0YXRlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBzdGF0ZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0YXRlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vSW4gdGhlIGNvbnRleHQgb2YgdGhpcyB0eXBlIGEgc3RhdGUgaXMgcmVwcmVzZW50ZWQgYnkgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSBzdGF0ZSBcclxuLy9hbmQgcmV0dXJucyBhIGxpc3Qgd2hpY2ggY29udGFpbnMgYSB2YWx1ZSBhbmQgYSBuZXcgc3RhdGUuIFNvIGZvciBleGFtcGxlOlxyXG5cclxuXHRzdGF0ZSgodmFsKSA9PiBbdmFsKzEsIHZhbF0pXHJcblxyXG4vL0NyZWF0ZXMgYSBuZXcgc3RhdGVmdWwgY29tcHV0YXRpb24gd2hpY2ggaW5jcmVtZW50cyB0aGUgaW5wdXQgYXJndW1lbnQgYW5kIHRoZW4gc2F2ZXMgaXQgaW4gdGhlIHN0YXRlLlxyXG5cclxuXHJcbi8qXHJcbmBvZih2YWx1ZSlgXHJcbi0tLS1cclxuQWNjZXB0cyBhIHZhbHVlIGFuZCB3cmFwcyBpbiBhIHN0YXRlIGNvbnRhaW5lclxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJvZlwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdGFzc2VydC5leHBlY3QoMCkvLy0tXHJcblx0XHRjb25zdCBzdGF0ZTUgPSBzdGF0ZSgpLm9mKDUpXHJcblx0fSkvLy0tXHJcblxyXG4vL05vdGUgdGhhdCB0aGUgZm9sbG93aW5nIGNvZGUgZG9lcyBub3QgcHV0IGA1YCBpbiB0aGUgc3RhdGUuXHJcbi8vUmF0aGVyIGl0IGNyZWF0ZXMgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGA1YCBhbmQgZG9lcyBub3QgaW50ZXJhY3Qgd2l0aCB0aGUgc3RhdGUuIFxyXG5cclxuXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuRXhlY3V0ZXMgYGZ1bmtgIHdpdGggdGhlIGVuY2Fwc3VsYXRlZCB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgYHN0YXRlYCBvYmplY3QsIFxyXG53aXRob3V0IGFjY2Vzc2luZyB0aGUgc3RhdGVcclxuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vT25lIG9mIHRoZSBtYWluIGJlbmVmaXRzIG9mIHRoZSBgc3RhdGVgIHR5cGVzIGlzIHRoYXQgaXQgYWxsb3dzIHlvdSB0byBtaXggcHVyZSBmdW5jdGlvbnMgd2l0aCB1bnB1cmUgb25lcywgXHJcbi8vSW4gdGhlIHNhbWUgd2F5IHRoYXQgcHJvbWlzZXMgYWxsb3cgdXMgdG8gbWl4IGFzeWNocm9ub3VzIGZ1bmN0aW9ucyB3aXRoIHN5bmNocm9ub3VzIG9uZXMuXHJcbi8vTWFwIGFsbG93cyB1cyB0byBhcHBseSBhbnkgZnVuY3Rpb24gb24gb3VyIHZhbHVlIGFuZCB0byBjb25zdW1lIHRoZSByZXN1bHQgaW4gYW5vdGhlciBmdW5jdGlvbi5cclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZSg1KVxyXG5cdFx0Lm1hcCgodmFsKSA9PiB2YWwrMSlcclxuXHRcdC5tYXAoKHZhbCkgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwodmFsLCA2KVxyXG5cdFx0XHRyZXR1cm4gdmFsICogMlxyXG5cdFx0fSlcclxuXHRcdC5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCwgMTIpKVxyXG5cdFx0LnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgLCBleGNlcHQgdGhhdCBpZiBgZnVua2AgcmV0dXJucyBhIG5ldyBzdGF0ZSBvYmplY3QgaXQgbWVyZ2VzIHRoZSB0d28gc3RhdGVzIGludG8gb25lLlxyXG5UaHVzIGBmbGF0TWFwYCBzaW11bGF0ZXMgbWFuaXB1bGF0aW9uIG9mIG11dGFibGUgc3RhdGUuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL0ZvciBleGFtcGxlLCBoZXJlIGlzIGEgZnVuY3Rpb24gdGhhdCBcclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZShcInZhbHVlXCIpXHJcblx0XHQvL1dyaXRlIHRoZSB2YWx1ZSBpbiB0aGUgc3RhdGVcclxuXHRcdC5waGF0TWFwKCB2YWx1ZSA9PiBzdGF0ZSggXyA9PiBbXCJuZXcgXCIrdmFsdWUgLCBcImluaXRpYWwgXCIrdmFsdWVdKSApXHJcblxyXG5cdFx0Ly9tYW5pcHVsYXRlIHRoZSB2YWx1ZVxyXG5cdFx0LnBoYXRNYXAoIHZhbCA9PiB2YWwudG9VcHBlckNhc2UoKS5zcGxpdChcIlwiKS5qb2luKFwiLVwiKSApXHJcblx0XHRcclxuXHRcdC8vV2UgY2FuIGFjY2VzcyB0aGUgc3RhdGUgYXQgYW55IHRpbWUuXHJcblx0XHQucGhhdE1hcCggdmFsID0+IHN0YXRlKHN0ID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKCB2YWwsIFwiTi1FLVctIC1WLUEtTC1VLUVcIilcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKCBzdCwgXCJpbml0aWFsIHZhbHVlXCIpXHJcblx0XHR9KSkucnVuKClcclxufSkvLy0tXHJcblxyXG4vKlxyXG5cclxuYHNhdmUoKSAvIGxvYWQoKWBcclxuLS0tLVxyXG5TaG9ydGhhbmRzIGZvciB0aGUgbW9zdCBjb21tb24gc3RhdGUgb3BlcmF0aW9uczogXHJcbi0gYHNhdmVgIGNvcGllcyB0aGUgY3VycmVudGx5IGVuY2Fwc3VsYXRlZCB2YWx1ZSBpbnRvIHRoZSBzdGF0ZVxyXG4tIGBsb2FkYCBqdXN0IHJldHVybnMgdGhlIGN1cnJlbnQgc3RhdGVcclxuKioqXHJcbiovXHJcblxyXG5cclxuUVVuaXQudGVzdChcInNhdmUvbG9hZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZSg1KVxyXG5cdC5waGF0TWFwKCAodmFsKSA9PiB2YWwrMSApIC8vNlxyXG5cdC5zYXZlS2V5KFwic3QxXCIpXHJcblx0XHJcblx0LnBoYXRNYXAoICh2YWwpID0+IHZhbCoyICkvLzEyXHJcblx0LnNhdmVLZXkoXCJzdDJcIilcclxuXHRcclxuXHQubG9hZCgpXHJcblx0Lm1hcCggKHN0YXRlKSA9PiB7XHJcblx0XHRhc3NlcnQuZXF1YWwoc3RhdGUuc3QxLCA2KVxyXG5cdFx0YXNzZXJ0LmVxdWFsKHN0YXRlLnN0MiwgMTIpXHJcblx0fSkucnVuKClcclxufSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuXHJcbiJdfQ==
