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

var add_missing_methods = exports.add_missing_methods = function (obj) {
	//"chain" AKA "flatMap" is equivalent to map . join

	obj.chain = obj.flatMap = function flatMap(funk) {
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

	obj.then = obj.phatMap = function phatMap(funk) {
		if (funk === undefined) {
			throw "function not defined";
		}
		return this.map(funk).tryFlat();
	}, obj.phatMap2 = function phatMap2(funk) {
		if (funk === undefined) {
			throw "function not defined";
		}
		this.phatMap(function (inner) {
			if (typeof inner.phatMap !== "function") {
				throw "Inner object does not have 'phatMap'";
			}
			inner.phatMap(funk);
		});
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

	//Effectively all we have to do is return the same value with which the inner promise is resolved with.
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

	//The `tryFlat` function is almost the same:

	//m (m x) -> m x
	tryFlat: function tryFlat() {
		var _this3 = this;

		return promise(function (resolve) {
			return _this3._resolver(function (inner_promise) {
				if (inner_promise.constructor === promise) {
					inner_promise._resolver(function (val) {
						return resolve(val);
					});
				} else {
					resolve(inner_promise);
				}
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

// In most cases you will be creating promises using helper functions like:

var getUrl = function getUrl(url) {
	return promise(function (resolve) {
		var rq = new XMLHttpRequest();
		rq.onload = function () {
			return resolve(JSON.parse(rq.responseText));
		};
		rq.open("GET", url, true);
		rq.send();
	});
};
/*
`run()`
----
Executes the promise and fetches the data.

***
For example to make a promise and run it immediately do:
*/
getUrl("people.json").run();
//[
//  { "name":"john", "occupation":"programmer"},
//  {"name":"jen", "occupation":"admin"}
//]

getUrl("occupations.json").run();
//{
//  "programmer": "writes code"
//  "admin": "manages infrastructure"
//}

/*
//Note that we will be using the data from these two files in the next examples. 

`map(funk)`
----
Returns a new promise, which applies `funk` to the data when you run it.

***
The function can be used both for manipulating the data you fetch and for running side effects  
*/

QUnit.test("map", function (assert) {
	//--
	var stop = assert.async(); //--
	getUrl("people.json")

	//Using "map" for manipulating data
	.map(function (people) {
		return people.map(function (person) {
			return person.name;
		});
	})

	//Using "map" for triggering side effects
	.map(function (names) {
		assert.deepEqual(names, ["john", "jen"]);
		stop();
	}).run();
}); //--

/*
`phatMap(funk)`
----
A more powerful version of `map` which can allows you to chain several steps of the asychronous computations together.
Known as `then` for traditional promise libraries.

***
*/

QUnit.test("phatMap", function (assert) {
	//--
	var done = assert.async(); //--	

	//For example here is a function which retrieves a person's occupation from the `people.json` file
	//and then retrieves the occupation's description from `occupations.json`.

	var getOccupationDescription = function getOccupationDescription(name) {
		return getUrl("people.json")

		//Retrieve person data
		.phatMap(function (people) {
			return people.filter(function (person) {
				return person.name === name;
			})[0];
		})

		//Retrieve its occupation
		.phatMap(function (person) {
			return getUrl("occupations.json").map(function (occupations) {
				return occupations[person.occupation];
			});
		});
	};

	//Here is how the function is used:

	getOccupationDescription("john").map(function (desc) {
		assert.equal(desc, "writes code");
		done();
	}).run();
}); //--
//--
//--

/*
under the hood
--------------
Let's see how the type is implemented
*/

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvaGVscGVycy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L2xpc3QuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9tYXliZS5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L3Byb21pc2UuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9zdGF0ZS5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9mX3Rlc3RzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL2xpc3RfdGVzdHMuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvbWF5YmVfdGVzdHMuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvcHJvbWlzZV90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9zdGF0ZV90ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQSxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBR2xDLElBQU0sRUFBRSxHQUFHLFNBQUwsRUFBRSxDQUFHLENBQUM7UUFBSSxDQUFDO0NBQUEsQ0FBQTs7QUFFaEIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOzs7Ozs7QUFNM0MsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLEdBQUcsS0FBSyxTQUFTLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBRTtVQUFNLEdBQUc7R0FBQSxDQUFFO0VB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QUMsQ0FBQztFQUFBLENBQUU7RUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUVkLElBQUksRUFBRSxDQUNOLEdBQUcsQ0FBRSxVQUFDLEtBQUssRUFBSztBQUNoQixRQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDMUIsUUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0VBQzNCLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtDQUNSLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG5cclxuY29uc3QgaWQgPSBhID0+IGEgLy8tLVxyXG5cclxuXHR2YXIgZl9tZXRob2RzID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBpdC5cclxuLy90aGlzIGlzIHZlcnkgdXNlZnVsIGlmIHlvdSBoYXZlIGEgQVBJIHdoaWNoIGV4cGVjdHMgYSBmdW5jdGlvbiwgYnV0IHlvdSB3YW50IHRvIGZlZWQgaXQgd2l0aCBhIHZhbHVlIChzZWUgdGhlIGBmbGF0bWFwYCBleGFtcGxlKS4gXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiB2YWwgPT09IHVuZGVmaW5lZCA/IGlkIDogZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpID0+IChiIC0+IGMpID0+IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkgPT4gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbi8vVGhpcyBpcyB0aGUgZnVuY3Rpb24gY29uc3RydWN0b3IuIEl0IHRha2VzIGEgZnVuY3Rpb24gYW5kIGFkZHMgYW4gYXVnbWVudGVkIGZ1bmN0aW9uIG9iamVjdCwgd2l0aG91dCBleHRlbmRpbmcgdGhlIHByb3RvdHlwZVxyXG5cclxuXHR2YXIgZiA9IChmdW5rID0gaWQsIGxlbmd0aCA9IGZ1bmsubGVuZ3RoLCBpbml0aWFsX2FyZ3VtZW50cyA9IFtdKSA9PiB7XHJcblxyXG5cdFx0Ly9XZSBleHBlY3QgYSBmdW5jdGlvbi4gSWYgd2UgYXJlIGdpdmVuIGFub3RoZXIgdmFsdWUsIGxpZnQgaXQgdG8gYSBmdW5jdGlvblxyXG5cdFx0aWYodHlwZW9mIGZ1bmsgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRyZXR1cm4gZigpLm9mKGZ1bmspXHJcblx0XHRcclxuXHRcdC8vSWYgdGhlIGZ1bmN0aW9uIHRha2VzIGp1c3Qgb25lIGFyZ3VtZW50LCBqdXN0IGV4dGVuZCBpdCB3aXRoIG1ldGhvZHMgYW5kIHJldHVybiBpdC5cclxuXHRcdH1lbHNlIGlmICggbGVuZ3RoIDwgMiApe1xyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kKGZ1bmssIGZfbWV0aG9kcylcclxuXHJcblx0XHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBleHRlbmRlZF9mdW5rID0gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciBhbGxfYXJndW1lbnRzICA9IChpbml0aWFsX2FyZ3VtZW50cykuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgbGVuZ3RoLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0XHR9LCBmX21ldGhvZHMpXHJcblx0XHRcdFxyXG5cdFx0XHRleHRlbmRlZF9mdW5rLl9sZW5ndGggPSBsZW5ndGggLSBpbml0aWFsX2FyZ3VtZW50cy5sZW5ndGhcclxuXHRcdFx0ZXh0ZW5kZWRfZnVuay5fb3JpZ2luYWwgPSBmdW5rXHJcblxyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kZWRfZnVua1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbi8vSGVyZSBpcyB0aGUgZnVuY3Rpb24gd2l0aCB3aGljaCB0aGUgZnVuY3Rpb24gb2JqZWN0IGlzIGV4dGVuZGVkXHJcblxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5cclxuXHRcclxuXHRmLm9mID0gdmFsID0+IGYoICgpID0+IHZhbCApLFxyXG5cclxuLy9UaGUgbGlicmFyeSBhbHNvIGZlYXR1cmVzIGEgc3RhbmRhcmQgY29tcG9zZSBmdW5jdGlvbiB3aGljaCBhbGxvd3MgeW91IHRvIG1hcCBub3JtYWwgZnVuY3Rpb25zIHdpdGggb25lIGFub3RoZXJcclxuXHJcblx0Zi5jb21wb3NlID0gZnVuY3Rpb24oKXtcclxuXHJcblx0XHQvL0NvbnZlcnQgZnVuY3Rpb25zIHRvIGFuIGFycmF5IGFuZCBmbGlwIHRoZW0gKGZvciByaWdodC10by1sZWZ0IGV4ZWN1dGlvbilcclxuXHRcdHZhciBmdW5jdGlvbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLnJldmVyc2UoKVxyXG5cdFx0Ly9DaGVjayBpZiBpbnB1dCBpcyBPSzpcclxuXHRcdGZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmspe2lmKHR5cGVvZiBmdW5rICE9PSBcImZ1bmN0aW9uXCIpe3Rocm93IG5ldyBUeXBlRXJyb3IoZnVuaytcIiBpcyBub3QgYSBmdW5jdGlvblwiICl9fSlcclxuXHRcdC8vUmV0dXJuIHRoZSBmdW5jdGlvbiB3aGljaCBjb21wb3NlcyB0aGVtXHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcclxuXHRcdFx0Ly9UYWtlIHRoZSBpbml0aWFsIGlucHV0XHJcblx0XHRcdHZhciBpbnB1dCA9IGFyZ3VtZW50c1xyXG5cdFx0XHR2YXIgY29udGV4dFxyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb25zLnJlZHVjZShmdW5jdGlvbihyZXR1cm5fcmVzdWx0LCBmdW5rLCBpKXsgXHJcblx0XHRcdFx0Ly9JZiB0aGlzIGlzIHRoZSBmaXJzdCBpdGVyYXRpb24sIGFwcGx5IHRoZSBhcmd1bWVudHMgdGhhdCB0aGUgdXNlciBwcm92aWRlZFxyXG5cdFx0XHRcdC8vZWxzZSB1c2UgdGhlIHJldHVybiByZXN1bHQgZnJvbSB0aGUgcHJldmlvdXMgZnVuY3Rpb25cclxuXHRcdFx0XHRyZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuayhyZXR1cm5fcmVzdWx0KSlcclxuXHRcdFx0XHQvL3JldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rLmFwcGx5KGNvbnRleHQsIFtyZXR1cm5fcmVzdWx0XSkpXHJcblx0XHRcdH0sIHVuZGVmaW5lZClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cclxuXHRtb2R1bGUuZXhwb3J0cyA9IGYvLy0tXHJcbiIsInZhciBhZGRfbWlzc2luZ19tZXRob2RzID0gZXhwb3J0cy5hZGRfbWlzc2luZ19tZXRob2RzID0gZnVuY3Rpb24ob2JqKXtcclxuXHQvL1wiY2hhaW5cIiBBS0EgXCJmbGF0TWFwXCIgaXMgZXF1aXZhbGVudCB0byBtYXAgLiBqb2luIFxyXG5cdFxyXG5cdG9iai5jaGFpbiA9IG9iai5mbGF0TWFwID0gZnVuY3Rpb24gZmxhdE1hcChmdW5rKSB7XHJcblx0XHRpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcblx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcblx0fVxyXG5cclxuXHQvKlxyXG5cdFwidGhlblwiIEFLQSBcInBoYXRNYXBcIiBpcyB0aGUgcmVsYXhlZCB2ZXJzaW9uIG9mIFwiZmxhdE1hcFwiIHdoaWNoIGFjdHMgb24gdGhlIG9iamVjdCBvbmx5IGlmIHRoZSB0eXBlcyBtYXRjaFxyXG5cdFwicGhhdE1hcFwiIHRoZXJlZm9yZSBjYW4gYmUgdXNlZCBhcyBib3RoIFwibWFwXCIgYW5kIFwiZmxhdE1hcFwiLCBleGNlcHQgaW4gdGhlIGNhc2VzIHdoZW4geW91IHNwZWNpZmljYWxseSB3YW50IHRvIGNyZWF0ZSBhIG5lc3RlZCBvYmplY3QuXHJcblx0SW4gdGhlc2UgY2FzZXMgeW91IGNhbiBkbyBzbyBieSBzaW1wbHkgdXNpbmcgXCJtYXBcIiBleHByaWNpdGx5LlxyXG5cdCovXHJcblxyXG5cdG9iai50aGVuID0gb2JqLnBoYXRNYXAgPSBmdW5jdGlvbiBwaGF0TWFwKGZ1bmspe1xyXG5cdFx0aWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG5cdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmspLnRyeUZsYXQoKVxyXG5cdH0sXHJcblxyXG5cdG9iai5waGF0TWFwMiA9IGZ1bmN0aW9uIHBoYXRNYXAyKGZ1bmspIHtcclxuXHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdHRoaXMucGhhdE1hcCgoaW5uZXIpID0+IHtcclxuXHRcdFx0aWYodHlwZW9mIGlubmVyLnBoYXRNYXAgIT09ICdmdW5jdGlvbicpe3Rocm93IFwiSW5uZXIgb2JqZWN0IGRvZXMgbm90IGhhdmUgJ3BoYXRNYXAnXCJ9XHJcblx0XHRcdGlubmVyLnBoYXRNYXAoZnVuaylcclxuXHRcdH0pXHJcblx0fSxcclxuXHRcclxuXHRvYmoucHJpbnQgPSBmdW5jdGlvbigpe1xyXG5cdFx0Y29uc29sZS5sb2codGhpcy50b1N0cmluZygpKVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG5cdHJldHVybiBvYmpcclxufVxyXG4iLCJcclxuXHJcbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuXHJcbnZhciBsaXN0X21ldGhvZHMgPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCBwdXRzIGl0IGluIGEgbGlzdC5cclxuXHJcblx0XHQvL2Eub2YoYikgLT4gYiBhXHJcblx0XHRvZjogdmFsID0+IGxpc3QodmFsKSxcclxuXHJcbi8vYG1hcGAgYXBwbGllcyBhIGZ1bmN0aW9uIHRvIGVhY2ggZWxlbWVudCBvZiB0aGUgbGlzdCBcclxuXHRcdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMsIGZ1bmspKVxyXG5cdFx0fSxcclxuXHRcdFxyXG4vL2BmbGF0YCB0YWtlcyBhIGxpc3Qgb2YgbGlzdHMgYW5kIGZsYXR0ZW5zIHRoZW0gd2l0aCBvbmUgbGV2ZWwgXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkuam9pbigpID0gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBsaXN0KCB0aGlzLnJlZHVjZSgobGlzdCwgZWxlbWVudCkgPT4gWy4uLmxpc3QsIC4uLmVsZW1lbnRdLCBbXSkgKVxyXG5cdFx0fSxcclxuXHRcdFxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgXHJcbi8vYW5kIHdpdGggaXQsIHlvdXIgZnVuayBjYW4gcmV0dXJuIGJvdGggYSBsaXN0IG9mIG9iamVjdHMgYW5kIGEgc2luZ2xlIG9iamVjdFxyXG5cclxuXHRcdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoIHRoaXMucmVkdWNlKChsaXN0LCBlbGVtZW50KSA9PiBcclxuXHRcdFx0XHRlbGVtZW50LmNvbnN0cnVjdG9yID09PSBBcnJheT8gWy4uLmxpc3QsIC4uLmVsZW1lbnRdIDogWy4uLmxpc3QsIGVsZW1lbnRdICwgW10pXHJcblx0XHRcdClcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbi8vVGhpcyBpcyB0aGUgbGlzdCBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgbm9ybWFsIGFycmF5IGFuZCBhdWdtZW50cyBpdCB3aXRoIHRoZSBhYm92ZSBtZXRob2RzXHJcblxyXG5cdHZhciBsaXN0ID0gKC4uLmFyZ3MpID0+IHtcclxuXHRcdC8vQWNjZXB0IGFuIGFycmF5XHJcblx0XHRpZihhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdLmNvbnN0cnVjdG9yID09PSBBcnJheSApe1xyXG5cdFx0XHRyZXR1cm4gIE9iamVjdC5mcmVlemUoZXh0ZW5kKGFyZ3NbMF0sIGxpc3RfbWV0aG9kcykpXHJcblx0XHQvL0FjY2VwdCBzZXZlcmFsIGFyZ3VtZW50c1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiBPYmplY3QuZnJlZXplKGV4dGVuZChhcmdzLCBsaXN0X21ldGhvZHMpKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbi8vSGVyZSBpcyB0aGUgZnVuY3Rpb24gd2l0aCB3aGljaCB0aGUgbGlzdCBvYmplY3QgaXMgZXh0ZW5kZWRcclxuXHJcblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0XHRyZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKGZ1bmN0aW9uKG9iaiwgbWV0aG9kX25hbWUpe29ialttZXRob2RfbmFtZV0gPSBtZXRob2RzW21ldGhvZF9uYW1lXTsgcmV0dXJuIG9ian0sIG9iailcclxuXHR9XHJcbm1vZHVsZS5leHBvcnRzID0gbGlzdC8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgbWF5YmVfcHJvdG8gPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vVGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIGBtYXliZWAuXHJcbi8vSW4gdGhpcyBjYXNlIHdlIGRvIHRoaXMgYnkganVzdCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3Rvci5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBtYXliZShpbnB1dClcclxuXHR9LFxyXG5cclxuLy9gbWFwYCB0YWtlcyB0aGUgZnVuY3Rpb24gYW5kIGFwcGxpZXMgaXQgdG8gdGhlIHZhbHVlIGluIHRoZSBtYXliZSwgaWYgdGhlcmUgaXMgb25lLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gbWF5YmUoZnVuayh0aGlzLl92YWx1ZSkpXHJcblx0XHR9ZWxzZXtcdFxyXG5cdFx0XHRyZXR1cm4gdGhpcyBcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nICYmIHRoaXMuX3ZhbHVlLmNvbnN0cnVjdG9yID09PSBtYXliZSl7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG59KS8vLS1cclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBtYXliZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHJcblx0dmFyIG1heWJlID0gZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpe1xyXG5cdFx0XHRyZXR1cm4gbm90aGluZ1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1heWJlX3Byb3RvKVxyXG5cdFx0XHRvYmouX3ZhbHVlID0gdmFsdWVcclxuXHRcdFx0b2JqLmNvbnN0cnVjdG9yID0gbWF5YmVcclxuXHRcdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRcdHJldHVybiBvYmpcclxuXHRcdH1cclxuXHR9XHJcblxyXG52YXIgbm90aGluZyA9IE9iamVjdC5jcmVhdGUobWF5YmVfcHJvdG8pLy8tLVxyXG5ub3RoaW5nLmNvbnN0cnVjdG9yID0gbWF5YmUvLy0tXHJcbk9iamVjdC5mcmVlemUobm90aGluZykvLy0tXHJcbm1heWJlLm5vdGhpbmcgPSBub3RoaW5nLy8tLVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtYXliZS8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgcHJvbWlzZVByb3RvID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL1RoZSBgb2ZgIG1ldGhvZCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIHByb21pc2UsIGJ5IGltbWVkaWF0ZWx5IGNhbGxpbmcgdGhlIHJlc29sdmVyIGZ1bmN0aW9uIHdpdGggaXQuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbih2YWwpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiByZXNvbHZlKHZhbCkgKVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgbWFwYCBtZXRob2QgY3JlYXRlcyBhIG5ldyBwcm9taXNlLCBzdWNoIHRoYXQgd2hlbiB0aGUgb2xkIHByb21pc2UgaXMgcmVzb2x2ZWQsIGl0IHRha2VzIGl0cyByZXN1bHQsIFxyXG4vL2FwcGxpZXMgYGZ1bmtgIHRvIGl0IGFuZCB0aGVuIHJlc29sdmVzIGl0c2VsZiB3aXRoIHRoZSB2YWx1ZS5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IHRoaXMuX3Jlc29sdmVyKCAodmFsKSA9PiByZXNvbHZlKCBmdW5rKHZhbCkgKSApIClcclxuXHJcblx0fSxcclxuXHJcbi8vSW4gdGhpcyBjYXNlIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBgZmxhdGAgaXMgcXVpdGUgc2ltcGxlLlxyXG5cclxuLy9FZmZlY3RpdmVseSBhbGwgd2UgaGF2ZSB0byBkbyBpcyByZXR1cm4gdGhlIHNhbWUgdmFsdWUgd2l0aCB3aGljaCB0aGUgaW5uZXIgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoLlxyXG4vL1RvIGRvIHRoaXMsIHdlIHVud3JhcCBvdXIgcHJvbWlzZSBvbmNlIHRvIGdldCB0aGUgaW5uZXIgcHJvbWlzZSB2YWx1ZSwgYW5kIHRoZW4gdW53cmFwIHRoZSBpbm5lclxyXG4vL3Byb21pc2UgaXRzZWxmIHRvIGdldCBpdHMgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IFxyXG5cdFx0XHR0aGlzLl9yZXNvbHZlcihcdChpbm5lcl9wcm9taXNlKSA9PiBcclxuXHRcdFx0XHRpbm5lcl9wcm9taXNlLl9yZXNvbHZlcigodmFsKSA9PiByZXNvbHZlKHZhbCkpXHJcblx0XHRcdCkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGB0cnlGbGF0YCBmdW5jdGlvbiBpcyBhbG1vc3QgdGhlIHNhbWU6XHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IFxyXG5cdFx0XHR0aGlzLl9yZXNvbHZlcihcdChpbm5lcl9wcm9taXNlKSA9PiB7IFxyXG5cdFx0XHRcdGlmKGlubmVyX3Byb21pc2UuY29uc3RydWN0b3IgPT09IHByb21pc2Upe1xyXG5cdFx0XHRcdFx0aW5uZXJfcHJvbWlzZS5fcmVzb2x2ZXIoKHZhbCkgPT4gcmVzb2x2ZSh2YWwpKVxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cmVzb2x2ZShpbm5lcl9wcm9taXNlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGBydW5gIGZ1bmN0aW9uIGp1c3QgZmVlZHMgdGhlIHJlc29sdmVyIHdpdGggYSBwbGFjZWhvbGRlciAgZnVuY3Rpb24gc28gb3VyIGNvbXB1dGF0aW9uIGNhblxyXG4vL3N0YXJ0IGV4ZWN1dGluZy5cclxuXHJcblx0cnVuOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcmVzb2x2ZXIoZnVuY3Rpb24oYSl7cmV0dXJuIGF9KVxyXG5cdH1cclxuXHRcclxufSkvLy0tXHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHRjb25zdCBwcm9taXNlID0gZnVuY3Rpb24ocmVzb2x2ZSl7XHJcblx0XHRpZih0eXBlb2YgcmVzb2x2ZSAhPT0gXCJmdW5jdGlvblwiKXsgcmV0dXJuIHByb21pc2VQcm90by5vZihyZXNvbHZlKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKHByb21pc2VQcm90bylcclxuXHJcblx0XHRvYmouX3Jlc29sdmVyID0gcmVzb2x2ZVxyXG5cdFx0b2JqLmNvbnN0cnVjdG9yID0gcHJvbWlzZVxyXG5cdFx0b2JqLnByb3RvdHlwZSA9IHByb21pc2VQcm90b1xyXG5cdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRyZXR1cm4gb2JqXHJcblx0fVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwcm9taXNlLy8tLVxyXG4iLCJcclxuY29uc3QgZiA9IHJlcXVpcmUoXCIuL2ZcIikvLy0tXHJcblxyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuXHJcbmNvbnN0IHN0YXRlUHJvdG8gPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vYG9mYCBqdXN0IHVzZXMgdGhlIGNvbnN0cnVjdG9yIGFuZCBkb2VzIG5vdCB0b3VjaCB0aGUgc3RhdGUuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbihpbnB1dCl7XHJcblx0XHRyZXR1cm4gc3RhdGUoKHByZXZTdGF0ZSkgPT4gW2lucHV0LCBwcmV2U3RhdGVdKVxyXG5cdH0sXHJcblxyXG4vL2BtYXBgIGlzIGRvbmUgYnkgYXBwbHlpbmcgdGhlIGZ1bmN0aW9uIHRvIHRoZSB2YWx1ZSBhbmQga2VlcGluZyB0aGUgc3RhdGUgdW5jaGFuZ2VkLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdHJldHVybiBzdGF0ZSggdGhpcy5fcnVuU3RhdGUubWFwKChbaW5wdXQsIHByZXZTdGF0ZV0pID0+IFtmdW5rKGlucHV0KSwgcHJldlN0YXRlXSkpXHJcblx0fSxcclxuXHRcclxuLy9gZmxhdGAgZG9lcyB0aGUgZm9sbG93aW5nOlxyXG4vLzEuIFJ1bnMgdGhlIGNvZGUgdGhhdCB3ZSBsb2FkZWQgaW4gdGhlIG1vbmFkIHNvLCBmYXIgKHVzaW5nIHRoZSBgcnVuYCBmdW5jdGlvbikuXHJcbi8vMi4gU2F2ZXMgdGhlIG5ldyBzdGF0ZSBvYmplY3QgYW5kIHRoZSB2YWx1ZSB3aGljaCBpcyBrZXB0IGJ5IHRoZSBmdW5jdGlvbnMgc28gZmFyLlxyXG4vLzMuIEFmdGVyIGRvaW5nIHRoYXQsIGl0IGFycmFuZ2VzIHRob3NlIHR3byBjb21wb25lbnRzICh0aGUgb2JqZWN0IGFuZCB0aGUgdmFsdWUpIGludG8gYSB5ZXQgYW5vdGhlclxyXG4vL3N0YXRlIG9iamVjdCwgd2hpY2ggcnVucyB0aGUgbXV0YXRvciBmdW5jdGlvbiBvZiB0aGUgZmlyc3Qgb2JqZWN0LCB3aXRoIHRoZSBzdGF0ZSB0aGF0IHdlIGhhdmUgc28sIGZhclxyXG5cclxuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHQvL0V4dHJhY3Qgc3RhdGUgbXV0YXRvciBhbmQgdmFsdWUgXHJcblx0XHRjb25zdCBbc3RhdGVPYmosIGN1cnJlbnRTdGF0ZV0gPSB0aGlzLnJ1bigpXHJcblx0XHQvL0NvbXBvc2UgdGhlIG11dGF0b3IgYW5kIHRoZSB2YWx1ZVxyXG5cdFx0cmV0dXJuIHN0YXRlKCgpID0+IHN0YXRlT2JqLl9ydW5TdGF0ZShjdXJyZW50U3RhdGUpIClcclxuXHR9LFxyXG5cdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHJcblx0XHQvL0V4dHJhY3QgY3VycmVudCBzdGF0ZSBcclxuXHRcdGNvbnN0IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSA9IHRoaXMucnVuKClcclxuXHRcdFxyXG5cdFx0Ly9DaGVjayBpZiBpdCBpcyByZWFsbHkgYSBzdGF0ZVxyXG5cdFx0aWYoc3RhdGVPYmouY29uc3RydWN0b3IgPT09IHN0YXRlKXtcclxuXHRcdFx0cmV0dXJuIHN0YXRlKCgpID0+IHN0YXRlT2JqLl9ydW5TdGF0ZShjdXJyZW50U3RhdGUpIClcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gc3RhdGUoKCkgPT4gW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdKVxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL1dlIGhhdmUgdGhlIGBydW5gIGZ1bmN0aW9uIHdoaWNoIGNvbXB1dGVzIHRoZSBzdGF0ZTpcclxuXHJcblx0cnVuOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcnVuU3RhdGUoKVxyXG5cdH0sXHJcbi8vQW5kIHRoZSBgc2F2ZWAgYW5kIGBsb2FkYCBmdW5jdGlvbnMgYXJlIGV4YWN0bHkgd2hhdCBvbmUgd291bGQgZXhwZWN0XHJcblxyXG5cdGxvYWQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gc3RhdGUoIChzdGF0ZSkgPT4gW3N0YXRlLCBzdGF0ZV0gKSApXHJcblx0fSxcclxuXHRzYXZlOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHN0YXRlKCAoc3RhdGUpID0+IFt2YWx1ZSwgdmFsdWVdICkgKVxyXG5cdH0sXHJcblx0bG9hZEtleTpmdW5jdGlvbihrZXkpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiBzdGF0ZSggKHN0YXRlKSA9PiBbc3RhdGVba2V5XSwgc3RhdGVdICkgKVxyXG5cdH0sXHJcblx0c2F2ZUtleTpmdW5jdGlvbihrZXkpe1xyXG5cdFx0Y29uc3Qgd3JpdGUgPSAob2JqLCBrZXksIHZhbCkgPT4ge1xyXG5cdFx0XHRvYmogPSB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiID8gIG9iaiA6IHt9XHJcblx0XHRcdG9ialtrZXldID0gdmFsXHJcblx0XHRcdHJldHVybiBvYmpcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gc3RhdGUoIChzdGF0ZSkgPT4gW3ZhbHVlLCB3cml0ZShzdGF0ZSwga2V5LCB2YWx1ZSldICkgKVxyXG5cdH0sXHJcblx0dG9TdHJpbmc6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnJ1bigpKVxyXG5cdH1cclxuXHRcclxufSlcclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBzdGF0ZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHRjb25zdCBzdGF0ZSA9IGZ1bmN0aW9uKHJ1bil7XHJcblx0XHRpZih0eXBlb2YgcnVuICE9PSBcImZ1bmN0aW9uXCIpeyByZXR1cm4gc3RhdGVQcm90by5vZihydW4pIH1cclxuXHRcdGNvbnN0IG9iaiA9IE9iamVjdC5jcmVhdGUoc3RhdGVQcm90bylcclxuXHRcdG9iai5fcnVuU3RhdGUgPSBmKHJ1biwxKVxyXG5cdFx0b2JqLmNvbnN0cnVjdG9yID0gc3RhdGVcclxuXHRcdG9iai5wcm90b3R5cGUgPSBzdGF0ZVByb3RvXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlLy8tLVxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IGZ1bmN0aW9uXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBmdW5jdGlvbiBtb25hZCBhdWdtZW50cyBzdGFuZGFyZCBKYXZhU2NyaXB0IGZ1bmN0aW9ucyB3aXRoIGZhY2lsaXRpZXMgZm9yIGNvbXBvc2l0aW9uIGFuZCBjdXJyeWluZy5cclxuPCEtLW1vcmUtLT5cclxuXHJcbiovXHJcblFVbml0Lm1vZHVsZShcImZ1bmN0aW9uc1wiKS8vLS1cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIilcclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY29uc3RydWN0IGZ1bmN0aW9ucyBsaW5lIHRoaXNcclxuXHRcclxuXHRcdHZhciBwbHVzXzEgPSBmKCAobnVtKSA9PiBudW0rMSApXHJcblxyXG5cclxuLy9BZnRlciB5b3UgZG8gdGhhdCwgeW91IHdpbGwgc3RpbGwgYmUgYWJsZSB0byB1c2UgYHBsdXNfMWAgbGlrZSBhIG5vcm1hbCBmdW5jdGlvbiwgYnV0IHlvdSBjYW4gYWxzbyBkbyB0aGUgZm9sbG93aW5nOlxyXG5cclxuXHJcbi8qXHJcbkN1cnJ5aW5nXHJcbi0tLS1cclxuV2hlbiB5b3UgY2FsbCBhIGZ1bmN0aW9uIGBmYCB3aXRoIGxlc3MgYXJndW1lbnRzIHRoYXQgaXQgYWNjZXB0cywgaXQgcmV0dXJucyBhIHBhcnRpYWxseSBhcHBsaWVkXHJcbihib3VuZCkgdmVyc2lvbiBvZiBpdHNlbGYgdGhhdCBtYXkgYXQgYW55IHRpbWUgYmUgY2FsbGVkIHdpdGggdGhlIHJlc3Qgb2YgdGhlIGFyZ3VtZW50cy5cclxuKi9cclxuXHJcblx0UVVuaXQudGVzdChcImN1cnJ5XCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0Y29uc3QgYWRkMyA9IGYoIChhLGIsYykgPT4gYStiK2MgKVxyXG5cdFx0XHJcblx0XHRjb25zdCBhZGQyID0gYWRkMygwKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBhZGQyKDEsIDEpLCAyIClcclxuXHRcdGFzc2VydC5lcXVhbCggYWRkMig1LCA1KSwgMTAgKVxyXG5cclxuXHRcdGNvbnN0IHBsdXMxMCA9IGFkZDIoMTApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMxMCg1KSwgMTUgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzMTAoMTApLCAyMCApXHJcblxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbmBvZih2YWx1ZSlgXHJcbi0tLS1cclxuSWYgY2FsbGVkIHdpdGggYSB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgaXQgY29uc3RydWN0cyBhIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgdGhhdCB2YWx1ZS5cclxuSWYgY2FsbGVkIHdpdGhvdXQgYXJndW1lbnRzIGl0IHJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGFsd2F5cyByZXR1cm5zIHRoZSBhcmd1bWVudHMgZ2l2ZW4gdG8gaXQuXHJcbiovXHJcblx0UVVuaXQudGVzdChcIm9mXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0Y29uc3QgcmV0dXJuczkgPSBmKCkub2YoOSlcclxuXHRcdGFzc2VydC5lcXVhbCggcmV0dXJuczkoMyksIDkgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCByZXR1cm5zOShcImFcIiksIDkgKVxyXG5cclxuXHRcdGNvbnN0IGlkID0gZigpLm9mKClcclxuXHRcdGFzc2VydC5lcXVhbCggaWQoMyksIDMgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBpZChcImFcIiksIFwiYVwiIClcclxuXHJcblx0fSkvLy0tXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdCwgdGhlbiBjYWxscyBgZnVua2Agd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudDpcclxuKi9cclxuXHRRVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0XHJcbi8vWW91IGNhbiBjcmVhdGUgYSBGdW5jdGlvbiBNb25hZCBieSBwYXNzaW5nIGEgbm9ybWFsIEphdmFTY3JpcHQgZnVuY3Rpb24gdG8gdGhlIGNvbnN0cnVjdG9yICh5b3UgY2FuIHdyaXRlIHRoZSBmdW5jdGlvbiBkaXJlY3RseSB0aGVyZSk6XHJcblx0XHRcclxuXHRcdHZhciBwbHVzMSA9IGYoIG51bSA9PiBudW0rMSApXHJcblxyXG5cclxuLy9UaGVuIG1ha2luZyBhbm90aGVyIGZ1bmN0aW9uIGlzIGVhc3k6XHJcblxyXG5cdFx0dmFyIHBsdXMyID0gcGx1czEubWFwKHBsdXMxKSBcclxuXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMyKDApLCAyIClcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXM0ID0gcGx1czIubWFwKHBsdXMyKVxyXG5cclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czQoMSksIDUgKVxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgIGV4Y2VwdCB0aGF0IGlmIGBmdW5rYCByZXR1cm5zIGFub3RoZXIgZnVuY3Rpb24gaXQgcmV0dXJucyBhIHRoaXJkIGZ1bmN0aW9uIHdoaWNoOlxyXG4xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QuXHJcbjIuIENhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50XHJcbjMuIENhbGxzIHRoZSBmdW5jdGlvbiByZXR1cm5lZCBieSBgZnVua2Agd2l0aCB0aGUgc2FtZSBhcmd1bWVudCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0IG9mIHRoZSBzZWNvbmQgY2FsbC5cclxuKi9cclxuXHRRVW5pdC50ZXN0KFwicGhhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vWW91IGNhbiB1c2UgYHBoYXRNYXBgIHRvIG1vZGVsIHNpbXBsZSBpZi10aGVuIHN0YXRlbWVudHMuIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSB1c2VzIGl0IGluIGNvbWJpbmF0aW9uIG9mIHRoZSBjdXJyeWluZyBmdW5jdGlvbmFsaXR5OlxyXG5cdFx0XHJcblx0XHR2YXIgY29uY2F0ID0gZiggKHN0cjEsIHN0cjIpID0+IHN0cjEgKyBzdHIyKVxyXG5cclxuXHRcdHZhciBtYWtlTWVzc2FnZSA9IGYocGFyc2VJbnQsIDEpXHJcblx0XHRcdC5mbGF0TWFwKChudW0pID0+IGlzTmFOKG51bSk/IGYoXCJFcnJvci4gTm90IGEgbnVtYmVyXCIpIDogY29uY2F0KFwiVGhlIG51bWJlciBpcyBcIikgKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIxXCIpLCBcIlRoZSBudW1iZXIgaXMgMVwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMlwiKSwgXCJUaGUgbnVtYmVyIGlzIDJcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIllcIiksIFwiRXJyb3IuIE5vdCBhIG51bWJlclwiKVxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwYCBpcyBzaW1pbGFyIHRvIHRoZSBgPj49YCBmdW5jdGlvbiBpbiBIYXNrZWxsLCB3aGljaCBpcyB0aGUgYnVpbGRpbmcgYmxvY2sgb2YgdGhlIGluZmFtb3VzIGBkb2Agbm90YXRpb25cclxuSXQgY2FuIGJlIHVzZWQgdG8gd3JpdGUgcHJvZ3JhbXMgd2l0aG91dCB1c2luZyBhc3NpZ25tZW50Llx0XHJcblxyXG5Gb3IgZXhhbXBsZSBpZiB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaW4gSGFza2VsbDpcclxuXHJcblx0XHRhZGRTdHVmZiA9IGRvICBcclxuXHRcdFx0YSA8LSAoKjIpICBcclxuXHRcdFx0YiA8LSAoKzEwKSAgXHJcblx0XHRcdHJldHVybiAoYStiKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHJcbldoZW4gd2UgZGVzdWdhciBpdCwgdGhpcyBiZWNvbWVzOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gKCoyKSA+Pj0gXFxhIC0+XHJcblx0XHRcdFx0KCsxMCkgPj49IFxcYiAtPlxyXG5cdFx0XHRcdFx0cmV0dXJuIChhK2IpXHJcblxyXG5vciBpbiBKYXZhU2NyaXB0IHRlcm1zOlxyXG5cclxuKi9cclxuXHJcblx0XHR2YXIgYWRkU3R1ZmYgPSBmKCBudW0gPT4gbnVtICogMiApXHJcblx0XHRcdC5mbGF0TWFwKCBhID0+IGYoIG51bSA9PiBudW0gKyAxMCApXHJcblx0XHRcdFx0LmZsYXRNYXAoIGIgPT4gZi5vZihhICsgYikgKSBcclxuXHRcdFx0KVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogbGlzdCBcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBsaXN0YCB0eXBlLCBhdWdtZW50cyB0aGUgc3RhbmRhcmQgSmF2YVNjcmlwdCBhcnJheXMsIG1ha2luZyB0aGVtIGltbXV0YWJsZSBhbmQgYWRkaW5nIGFkZGl0aW9uYWwgZnVuY3Rpb25hbGl0eSB0byB0aGVtXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJMaXN0XCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYGxpc3RgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIGxpc3QgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9saXN0XCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIGNyZWF0ZSBhIGBsaXN0YCBmcm9tIGFycmF5IGxpa2UgdGhpc1xyXG5cdFx0dmFyIG15X2xpc3QgPSBsaXN0KFsxLDIsM10pXHJcbi8vb3IgbGlrZSB0aGlzOlxyXG5cdFx0dmFyIG15X2xpc3QgPSBsaXN0KDEsMiwzKVxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5TdGFuZGFyZCBhcnJheSBtZXRob2QuIEV4ZWN1dGVzIGBmdW5rYCBmb3IgZWFjaCBvZiB0aGUgdmFsdWVzIGluIHRoZSBsaXN0IGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IGxpc3QuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHR2YXIgcGVvcGxlID0gbGlzdCgge25hbWU6XCJqb2huXCIsIGFnZToyNCwgb2NjdXBhdGlvbjpcImZhcm1lclwifSwge25hbWU6XCJjaGFybGllXCIsIGFnZToyMiwgb2NjdXBhdGlvbjpcInBsdW1iZXJcIn0pXHJcblx0dmFyIG5hbWVzID0gcGVvcGxlLm1hcCgocGVyc29uKSA9PiBwZXJzb24ubmFtZSApXHJcblx0YXNzZXJ0LmRlZXBFcXVhbChuYW1lcywgW1wiam9oblwiLCBcImNoYXJsaWVcIl0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAsIGJ1dCBpZiBgZnVua2AgcmV0dXJucyBhIGxpc3Qgb3IgYW4gYXJyYXkgaXQgZmxhdHRlbnMgdGhlIHJlc3VsdHMgaW50byBvbmUgYXJyYXlcclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHJcblx0dmFyIG9jY3VwYXRpb25zID0gbGlzdChbIFxyXG5cdFx0e29jY3VwYXRpb246XCJmYXJtZXJcIiwgcGVvcGxlOltcImpvaG5cIiwgXCJzYW1cIiwgXCJjaGFybGllXCJdIH0sXHJcblx0XHR7b2NjdXBhdGlvbjpcInBsdW1iZXJcIiwgcGVvcGxlOltcImxpc2FcIiwgXCJzYW5kcmFcIl0gfSxcclxuXHRdKVxyXG5cdFxyXG5cdHZhciBwZW9wbGUgPSBvY2N1cGF0aW9ucy5waGF0TWFwKChvY2N1cGF0aW9uKSA9PiBvY2N1cGF0aW9uLnBlb3BsZSlcclxuXHRhc3NlcnQuZGVlcEVxdWFsKHBlb3BsZSxbXCJqb2huXCIsIFwic2FtXCIsIFwiY2hhcmxpZVwiLCBcImxpc2FcIiwgXCJzYW5kcmFcIl0pXHJcblxyXG59KS8vLS1cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogbWF5YmVcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBtYXliZWAgdHlwZSwgYWxzbyBrbm93biBhcyBgb3B0aW9uYCB0eXBlIGlzIGEgY29udGFpbmVyIGZvciBhIHZhbHVlIHRoYXQgbWF5IG5vdCBiZSB0aGVyZS4gXHJcblxyXG5UaGUgcHVycG9zZSBvZiB0aGlzIG1vbmFkIGlzIHRvIGVsaW1pbmF0ZSB0aGUgbmVlZCBmb3Igd3JpdGluZyBgbnVsbGAgY2hlY2tzLiBcclxuRnVydGhlcm1vcmUgaXQgYWxzbyBlbGltaW5hdGVzIHRoZSBwb3NzaWJpbGl0eSBvZiBtYWtpbmcgZXJyb3JzIGJ5IG1pc3NpbmcgbnVsbC1jaGVja3MuXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJNYXliZVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBtYXliZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbWF5YmUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byB3cmFwIGEgdmFsdWUgaW4gYG1heWJlYCB3aXRoOlxyXG5cdFx0dmFyIHZhbCA9IDQvLy0tXHJcblx0XHR2YXIgbWF5YmVfdmFsID0gbWF5YmUodmFsKVxyXG5cclxuLy9JZiB0aGUgJ3ZhbCcgaXMgZXF1YWwgdG8gKnVuZGVmaW5lZCogaXQgdGhyZWF0cyB0aGUgY29udGFpbmVyIGFzIGVtcHR5LlxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5FeGVjdXRlcyBgZnVua2Agd2l0aCB0aGUgYG1heWJlYCdzIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBidXQgb25seSBpZiB0aGUgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gKnVuZGVmaW5lZCosIGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IG1heWJlLlxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1RyYWRpdGlvbmFsbHksIGlmIHdlIGhhdmUgYSB2YWx1ZSB0aGF0IG1heSBiZSB1bmRlZmluZWQgd2UgZG8gYSBudWxsIGNoZWNrIGJlZm9yZSBkb2luZyBzb21ldGhpbmcgd2l0aCBpdDpcclxuXHJcblx0dmFyIG9iaiA9IHt9Ly8tLVxyXG5cdHZhciBnZXRfcHJvcGVydHkgPSBmKChvYmplY3QpID0+IG9iamVjdC5wcm9wZXJ0eSkvLy0tXHJcblx0XHJcblx0dmFyIHZhbCA9IGdldF9wcm9wZXJ0eShvYmopXHJcblx0XHJcblx0aWYodmFsICE9PSB1bmRlZmluZWQpe1xyXG5cdFx0dmFsID0gdmFsLnRvU3RyaW5nKClcclxuXHR9XHJcblx0YXNzZXJ0LmVxdWFsKHZhbCwgdW5kZWZpbmVkKSBcclxuXHJcbi8vV2l0aCBgbWFwYCB0aGlzIGNhbiBiZSB3cml0dGVuIGxpa2UgdGhpc1xyXG5cclxuIFx0dmFyIG1heWJlX2dldF9wcm9wZXJ0eSA9IGdldF9wcm9wZXJ0eS5tYXAobWF5YmUpXHJcblxyXG5cdG1heWJlX2dldF9wcm9wZXJ0eShvYmopLm1hcCgodmFsKSA9PiB7XHJcblx0XHRhc3NlcnQub2soZmFsc2UpLy8tLVxyXG5cdFx0dmFsLnRvU3RyaW5nKCkvL3RoaXMgaXMgbm90IGV4ZWN1dGVkXHJcblx0fSlcclxuXHJcbi8vVGhlIGJpZ2dlc3QgYmVuZWZpdCB3ZSBnZXQgaXMgdGhhdCBpbiB0aGUgZmlyc3QgY2FzZSB3ZSBjYW4gZWFzaWx5IGZvcmdldCB0aGUgbnVsbCBjaGVjazpcclxuXHRcclxuXHRhc3NlcnQudGhyb3dzKGZ1bmN0aW9uKCl7XHJcblx0XHRnZXRfcHJvcGVydHkob2JqKS50b1N0cmluZygpICAvL3RoaXMgYmxvd3MgdXBcclxuXHR9KVxyXG5cclxuLy9XaGlsZSBpbiB0aGUgc2Vjb25kIGNhc2Ugd2UgY2Fubm90IGFjY2VzcyB0aGUgdW5kZXJseWluZyB2YWx1ZSBkaXJlY3RseSwgYW5kIHRoZXJlZm9yZSBjYW5ub3QgZXhlY3V0ZSBhbiBhY3Rpb24gb24gaXQsIGlmIGl0IGlzIG5vdCB0aGVyZS5cclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuXHJcblNhbWUgYXMgYG1hcGAsIGJ1dCBpZiBgZnVua2AgcmV0dXJucyBhIGBtYXliZWAgaXQgZmxhdHRlbnMgdGhlIHR3byBgbWF5YmVzYCBpbnRvIG9uZS5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL2BtYXBgIHdvcmtzIGZpbmUgZm9yIGVsaW1pbmF0aW5nIGVycm9ycywgYnV0IGl0IGRvZXMgbm90IHNvbHZlIG9uZSBvZiB0aGUgbW9zdCBhbm5veWluZyBwcm9ibGVtcyB3aXRoIG51bGwtY2hlY2tzIC0gbmVzdGluZzpcclxuXHJcblx0dmFyIG9iaiA9IHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWxcIiB9IH1cclxuXHRcclxuXHRtYXliZShvYmopXHJcblx0XHQubWFwKCByb290ID0+IG1heWJlKHJvb3QuZmlyc3QpKVxyXG5cdFx0Lm1hcCggbWF5YmVGaXJzdCA9PiBtYXliZUZpcnN0Lm1hcCAoZmlyc3QgPT4gbWF5YmUgKG1heWJlRmlyc3Quc2Vjb25kICkgKSApIFxyXG5cdFx0Lm1hcCggbWF5YmVNYXliZVZhbHVlID0+IG1heWJlTWF5YmVWYWx1ZS5tYXAgKG1heWJlVmFsdWUgPT4gbWF5YmVWYWx1ZS5tYXAoICh2YWx1ZSk9PiggYXNzZXJ0LmVxdWFsKCB2YWwsIFwidmFsXCIpICkgKSApIClcclxuXHJcbi8vYHBoYXRNYXBgIGRvZXMgdGhlIGZsYXR0ZW5pbmcgZm9yIHVzLCBhbmQgYWxsb3dzIHVzIHRvIHdyaXRlIGNvZGUgbGlrZSB0aGlzXHJcblxyXG5cdG1heWJlKG9iailcclxuXHRcdC5mbGF0TWFwKHJvb3QgPT4gbWF5YmUocm9vdC5maXJzdCkpXHJcblx0XHQuZmxhdE1hcChmaXJzdCA9PiBtYXliZShmaXJzdC5zZWNvbmQpKVxyXG5cdFx0LmZsYXRNYXAodmFsID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKHZhbCwgXCJ2YWxcIilcclxuXHRcdH0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbkFkdmFuY2VkIFVzYWdlXHJcbi0tLS1cclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJhZHZhbmNlZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuLy8gYG1heWJlYCBjYW4gYmUgdXNlZCB3aXRoIHRoZSBmdW5jdGlvbiBtb25hZCB0byBlZmZlY3RpdmVseSBwcm9kdWNlICdzYWZlJyB2ZXJzaW9ucyBvZiBmdW5jdGlvbnNcclxuXHJcblx0dmFyIGdldCA9IGYoKHByb3AsIG9iaikgPT4gb2JqW3Byb3BdKVxyXG5cdHZhciBtYXliZUdldCA9IGdldC5tYXAobWF5YmUpXHJcblxyXG4vL1RoaXMgY29tYmluZWQgd2l0aCB0aGUgdXNlIG9mIGN1cnJ5aW5nIG1ha2VzIGZvciBhIHZlcnkgZmx1ZW50IHN0eWxlIG9mIGNvZGluZzpcclxuXHJcblx0dmFyIGdldEZpcnN0U2Vjb25kID0gKHJvb3QpID0+IG1heWJlKHJvb3QpLnBoYXRNYXAobWF5YmVHZXQoJ2ZpcnN0JykpLnBoYXRNYXAobWF5YmVHZXQoJ3NlY29uZCcpKVxyXG5cdFxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ2YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwib3RoZXJfdmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwib3RoZXJfdmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDogXCJcIiB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIndoYXRldmVyXCIpICkvL3dvbid0IGJlIGV4ZWN1dGVkIFxyXG5cclxufSkvLy0tXHJcblxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogcHJvbWlzZSBcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBwcm9taXNlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBmdXR1cmVgIGlzIGEgY29udGFpbmVyIGZvciBhIHZhbHVlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLCBcclxudmlhIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiUHJvbWlzZVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBwcm9taXNlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHR2YXIgcHJvbWlzZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3Byb21pc2VcIilcclxuXHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVG8gY3JlYXRlIGEgYHByb21pc2VgIHBhc3MgYSBmdW5jdGlvbiB3aGljaCBhY2NlcHRzIGEgY2FsbGJhY2sgYW5kIGNhbGxzIHRoYXQgY2FsbGJhY2sgd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlOlxyXG5cclxuXHR2YXIgbXlfcHJvbWlzZSA9IHByb21pc2UoIChyZXNvbHZlKSA9PiAgXHJcblx0XHRzZXRUaW1lb3V0KCgpID0+IHsgcmVzb2x2ZSg1KSB9LDEwMDApICBcclxuXHQpXHJcblxyXG4vLyBJbiBtb3N0IGNhc2VzIHlvdSB3aWxsIGJlIGNyZWF0aW5nIHByb21pc2VzIHVzaW5nIGhlbHBlciBmdW5jdGlvbnMgbGlrZTpcclxuXHJcblx0Y29uc3QgZ2V0VXJsID0gKHVybCkgPT4gcHJvbWlzZSggKHJlc29sdmUpID0+IHtcclxuXHQgIGNvbnN0IHJxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcclxuICBcdCAgcnEub25sb2FkID0gKCkgPT4gcmVzb2x2ZShKU09OLnBhcnNlKHJxLnJlc3BvbnNlVGV4dCkpXHJcblx0ICBycS5vcGVuKFwiR0VUXCIsdXJsLHRydWUpO1xyXG5cdCAgcnEuc2VuZCgpO1xyXG5cdH0pXHJcbi8qXHJcbmBydW4oKWBcclxuLS0tLVxyXG5FeGVjdXRlcyB0aGUgcHJvbWlzZSBhbmQgZmV0Y2hlcyB0aGUgZGF0YS5cclxuXHJcbioqKlxyXG5Gb3IgZXhhbXBsZSB0byBtYWtlIGEgcHJvbWlzZSBhbmQgcnVuIGl0IGltbWVkaWF0ZWx5IGRvOlxyXG4qL1xyXG5cdGdldFVybChcInBlb3BsZS5qc29uXCIpLnJ1bigpXHJcblx0Ly9bXHJcblx0Ly8gIHsgXCJuYW1lXCI6XCJqb2huXCIsIFwib2NjdXBhdGlvblwiOlwicHJvZ3JhbW1lclwifSxcclxuIFx0Ly8gIHtcIm5hbWVcIjpcImplblwiLCBcIm9jY3VwYXRpb25cIjpcImFkbWluXCJ9XHJcblx0Ly9dXHJcblxyXG5cdGdldFVybChcIm9jY3VwYXRpb25zLmpzb25cIikucnVuKClcclxuXHQvL3tcclxuXHQvLyAgXCJwcm9ncmFtbWVyXCI6IFwid3JpdGVzIGNvZGVcIlxyXG5cdC8vICBcImFkbWluXCI6IFwibWFuYWdlcyBpbmZyYXN0cnVjdHVyZVwiXHJcblx0Ly99XHJcblxyXG4vKlxyXG4vL05vdGUgdGhhdCB3ZSB3aWxsIGJlIHVzaW5nIHRoZSBkYXRhIGZyb20gdGhlc2UgdHdvIGZpbGVzIGluIHRoZSBuZXh0IGV4YW1wbGVzLiBcclxuXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuUmV0dXJucyBhIG5ldyBwcm9taXNlLCB3aGljaCBhcHBsaWVzIGBmdW5rYCB0byB0aGUgZGF0YSB3aGVuIHlvdSBydW4gaXQuXHJcblxyXG4qKipcclxuVGhlIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGJvdGggZm9yIG1hbmlwdWxhdGluZyB0aGUgZGF0YSB5b3UgZmV0Y2ggYW5kIGZvciBydW5uaW5nIHNpZGUgZWZmZWN0cyAgXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdGNvbnN0IHN0b3AgPSBhc3NlcnQuYXN5bmMoKS8vLS1cclxuXHRnZXRVcmwoXCJwZW9wbGUuanNvblwiKVxyXG5cdCAgXHJcblx0ICAvL1VzaW5nIFwibWFwXCIgZm9yIG1hbmlwdWxhdGluZyBkYXRhXHJcblx0ICAubWFwKChwZW9wbGUpID0+IHBlb3BsZS5tYXAoKHBlcnNvbikgPT4gcGVyc29uLm5hbWUpKVxyXG5cclxuXHQgIC8vVXNpbmcgXCJtYXBcIiBmb3IgdHJpZ2dlcmluZyBzaWRlIGVmZmVjdHMgXHJcblx0ICAubWFwKG5hbWVzID0+IHtcclxuXHQgICAgYXNzZXJ0LmRlZXBFcXVhbChuYW1lcywgWydqb2huJywgJ2plbiddKVxyXG5cdCAgICBzdG9wKCkvLy0tXHJcblx0ICB9KS5ydW4oKVxyXG59KS8vLS1cclxuXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5BIG1vcmUgcG93ZXJmdWwgdmVyc2lvbiBvZiBgbWFwYCB3aGljaCBjYW4gYWxsb3dzIHlvdSB0byBjaGFpbiBzZXZlcmFsIHN0ZXBzIG9mIHRoZSBhc3ljaHJvbm91cyBjb21wdXRhdGlvbnMgdG9nZXRoZXIuXHJcbktub3duIGFzIGB0aGVuYCBmb3IgdHJhZGl0aW9uYWwgcHJvbWlzZSBsaWJyYXJpZXMuXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdGNvbnN0IGRvbmUgPSBhc3NlcnQuYXN5bmMoKS8vLS1cdFxyXG5cclxuLy9Gb3IgZXhhbXBsZSBoZXJlIGlzIGEgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIGEgcGVyc29uJ3Mgb2NjdXBhdGlvbiBmcm9tIHRoZSBgcGVvcGxlLmpzb25gIGZpbGVcclxuLy9hbmQgdGhlbiByZXRyaWV2ZXMgdGhlIG9jY3VwYXRpb24ncyBkZXNjcmlwdGlvbiBmcm9tIGBvY2N1cGF0aW9ucy5qc29uYC4gXHJcblxyXG5cdGNvbnN0IGdldE9jY3VwYXRpb25EZXNjcmlwdGlvbiA9IChuYW1lKSA9PiBnZXRVcmwoXCJwZW9wbGUuanNvblwiKVxyXG5cclxuXHQgIC8vUmV0cmlldmUgcGVyc29uIGRhdGFcclxuXHQgIC5waGF0TWFwKChwZW9wbGUpID0+IHBlb3BsZS5maWx0ZXIoIHBlcnNvbiA9PiBwZXJzb24ubmFtZSA9PT0gbmFtZSApWzBdKVxyXG5cclxuXHQgIC8vUmV0cmlldmUgaXRzIG9jY3VwYXRpb25cclxuXHQgIC5waGF0TWFwKCAocGVyc29uKSA9PiBnZXRVcmwoXCJvY2N1cGF0aW9ucy5qc29uXCIpXHJcblx0ICAgIC5tYXAob2NjdXBhdGlvbnMgPT4gb2NjdXBhdGlvbnNbcGVyc29uLm9jY3VwYXRpb25dKSApXHJcblxyXG4vL0hlcmUgaXMgaG93IHRoZSBmdW5jdGlvbiBpcyB1c2VkOlxyXG5cclxuXHRnZXRPY2N1cGF0aW9uRGVzY3JpcHRpb24oXCJqb2huXCIpLm1hcCgoZGVzYykgPT4geyBcclxuXHRcdGFzc2VydC5lcXVhbChkZXNjLCBcIndyaXRlcyBjb2RlXCIpIFxyXG5cdFx0ZG9uZSgpLy8tLVxyXG5cdH0pLnJ1bigpXHJcblx0XHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBzdGF0ZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHN0YXRlYCB0eXBlLCBpcyBhIGNvbnRhaW5lciB3aGljaCBlbmNhcHN1bGF0ZXMgYSBzdGF0ZWZ1bCBmdW5jdGlvbi4gSXQgYmFzaWNhbGx5IGFsbG93cyB5b3UgdG8gY29tcG9zZSBmdW5jdGlvbnMsXHJcbmxpa2UgeW91IGNhbiBkbyB3aXRoIHRoZSBgZmAgdHlwZSwgZXhjZXB0IHdpdGggaXQgYW55IGZ1bmN0aW9uIGNhbiBhY2Nlc3MgYW4gYWRkaXRpb25hbCBcInZhcmlhYmxlXCIgYmVzaWRlcyBpdHNcclxuaW5wdXQgYXJndW1lbnQocykgLSB0aGUgc3RhdGUuIFxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiU3RhdGVcIikvLy0tXHJcblxyXG4vL1RvIHVzZSB0aGUgYHN0YXRlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBzdGF0ZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0YXRlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vSW4gdGhlIGNvbnRleHQgb2YgdGhpcyB0eXBlIGEgc3RhdGUgaXMgcmVwcmVzZW50ZWQgYnkgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSBzdGF0ZSBcclxuLy9hbmQgcmV0dXJucyBhIGxpc3Qgd2hpY2ggY29udGFpbnMgYSB2YWx1ZSBhbmQgYSBuZXcgc3RhdGUuIFNvIGZvciBleGFtcGxlOlxyXG5cclxuXHRzdGF0ZSgodmFsKSA9PiBbdmFsKzEsIHZhbF0pXHJcblxyXG4vL0NyZWF0ZXMgYSBuZXcgc3RhdGVmdWwgY29tcHV0YXRpb24gd2hpY2ggaW5jcmVtZW50cyB0aGUgaW5wdXQgYXJndW1lbnQgYW5kIHRoZW4gc2F2ZXMgaXQgaW4gdGhlIHN0YXRlLlxyXG5cclxuXHJcbi8qXHJcbmBvZih2YWx1ZSlgXHJcbi0tLS1cclxuQWNjZXB0cyBhIHZhbHVlIGFuZCB3cmFwcyBpbiBhIHN0YXRlIGNvbnRhaW5lclxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJvZlwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdGFzc2VydC5leHBlY3QoMCkvLy0tXHJcblx0XHRjb25zdCBzdGF0ZTUgPSBzdGF0ZSgpLm9mKDUpXHJcblx0fSkvLy0tXHJcblxyXG4vL05vdGUgdGhhdCB0aGUgZm9sbG93aW5nIGNvZGUgZG9lcyBub3QgcHV0IGA1YCBpbiB0aGUgc3RhdGUuXHJcbi8vUmF0aGVyIGl0IGNyZWF0ZXMgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGA1YCBhbmQgZG9lcyBub3QgaW50ZXJhY3Qgd2l0aCB0aGUgc3RhdGUuIFxyXG5cclxuXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuRXhlY3V0ZXMgYGZ1bmtgIHdpdGggdGhlIGVuY2Fwc3VsYXRlZCB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgYHN0YXRlYCBvYmplY3QsIFxyXG53aXRob3V0IGFjY2Vzc2luZyB0aGUgc3RhdGVcclxuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vT25lIG9mIHRoZSBtYWluIGJlbmVmaXRzIG9mIHRoZSBgc3RhdGVgIHR5cGVzIGlzIHRoYXQgaXQgYWxsb3dzIHlvdSB0byBtaXggcHVyZSBmdW5jdGlvbnMgd2l0aCB1bnB1cmUgb25lcywgXHJcbi8vSW4gdGhlIHNhbWUgd2F5IHRoYXQgcHJvbWlzZXMgYWxsb3cgdXMgdG8gbWl4IGFzeWNocm9ub3VzIGZ1bmN0aW9ucyB3aXRoIHN5bmNocm9ub3VzIG9uZXMuXHJcbi8vTWFwIGFsbG93cyB1cyB0byBhcHBseSBhbnkgZnVuY3Rpb24gb24gb3VyIHZhbHVlIGFuZCB0byBjb25zdW1lIHRoZSByZXN1bHQgaW4gYW5vdGhlciBmdW5jdGlvbi5cclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZSg1KVxyXG5cdFx0Lm1hcCgodmFsKSA9PiB2YWwrMSlcclxuXHRcdC5tYXAoKHZhbCkgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwodmFsLCA2KVxyXG5cdFx0XHRyZXR1cm4gdmFsICogMlxyXG5cdFx0fSlcclxuXHRcdC5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCwgMTIpKVxyXG5cdFx0LnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgLCBleGNlcHQgdGhhdCBpZiBgZnVua2AgcmV0dXJucyBhIG5ldyBzdGF0ZSBvYmplY3QgaXQgbWVyZ2VzIHRoZSB0d28gc3RhdGVzIGludG8gb25lLlxyXG5UaHVzIGBmbGF0TWFwYCBzaW11bGF0ZXMgbWFuaXB1bGF0aW9uIG9mIG11dGFibGUgc3RhdGUuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL0ZvciBleGFtcGxlLCBoZXJlIGlzIGEgZnVuY3Rpb24gdGhhdCBcclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZShcInZhbHVlXCIpXHJcblx0XHQvL1dyaXRlIHRoZSB2YWx1ZSBpbiB0aGUgc3RhdGVcclxuXHRcdC5waGF0TWFwKCB2YWx1ZSA9PiBzdGF0ZSggXyA9PiBbXCJuZXcgXCIrdmFsdWUgLCBcImluaXRpYWwgXCIrdmFsdWVdKSApXHJcblxyXG5cdFx0Ly9tYW5pcHVsYXRlIHRoZSB2YWx1ZVxyXG5cdFx0LnBoYXRNYXAoIHZhbCA9PiB2YWwudG9VcHBlckNhc2UoKS5zcGxpdChcIlwiKS5qb2luKFwiLVwiKSApXHJcblx0XHRcclxuXHRcdC8vV2UgY2FuIGFjY2VzcyB0aGUgc3RhdGUgYXQgYW55IHRpbWUuXHJcblx0XHQucGhhdE1hcCggdmFsID0+IHN0YXRlKHN0ID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKCB2YWwsIFwiTi1FLVctIC1WLUEtTC1VLUVcIilcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKCBzdCwgXCJpbml0aWFsIHZhbHVlXCIpXHJcblx0XHR9KSkucnVuKClcclxufSkvLy0tXHJcblxyXG4vKlxyXG5cclxuYHNhdmUoKSAvIGxvYWQoKWBcclxuLS0tLVxyXG5TaG9ydGhhbmRzIGZvciB0aGUgbW9zdCBjb21tb24gc3RhdGUgb3BlcmF0aW9uczogXHJcbi0gYHNhdmVgIGNvcGllcyB0aGUgY3VycmVudGx5IGVuY2Fwc3VsYXRlZCB2YWx1ZSBpbnRvIHRoZSBzdGF0ZVxyXG4tIGBsb2FkYCBqdXN0IHJldHVybnMgdGhlIGN1cnJlbnQgc3RhdGVcclxuKioqXHJcbiovXHJcblxyXG5cclxuUVVuaXQudGVzdChcInNhdmUvbG9hZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZSg1KVxyXG5cdC5waGF0TWFwKCAodmFsKSA9PiB2YWwrMSApIC8vNlxyXG5cdC5zYXZlS2V5KFwic3QxXCIpXHJcblx0XHJcblx0LnBoYXRNYXAoICh2YWwpID0+IHZhbCoyICkvLzEyXHJcblx0LnNhdmVLZXkoXCJzdDJcIilcclxuXHRcclxuXHQubG9hZCgpXHJcblx0Lm1hcCggKHN0YXRlKSA9PiB7XHJcblx0XHRhc3NlcnQuZXF1YWwoc3RhdGUuc3QxLCA2KVxyXG5cdFx0YXNzZXJ0LmVxdWFsKHN0YXRlLnN0MiwgMTIpXHJcblx0fSkucnVuKClcclxufSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuXHJcbiJdfQ==
