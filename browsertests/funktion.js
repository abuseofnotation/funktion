(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var helpers = require('./helpers'); //--

var id = function id(a) {
	return a;
}; //--

var methods = { //--

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
			return funk(_this.apply(undefined, arguments));
		}, this._length);
	},

	//`flat` creates a function that:
	//1. Calls the original function with the supplied arguments
	//2. Calls the resulting function (and it has to be one) with the same arguments

	//(b -> (b -> c)) => a -> b
	flat: function flat() {
		var _this2 = this;

		return f(function () {
			return _this2.apply(undefined, arguments).apply(undefined, arguments);
		}, this._length);
	},

	//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`

	tryFlat: function tryFlat() {
		var _this3 = this;

		return f(function () {
			var result = _this3.apply(undefined, arguments);
			if (typeof result !== 'function') {
				return result;
			} else {
				return result.apply(undefined, arguments);
			}
		});
	}

}; //--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
methods.flatMap = helpers.flatMap;
methods.phatMap = helpers.phatMap;

//Add a print function, used for debugging.
methods.print = helpers.print;

//This is the function constructor. It takes a function and adds an augmented function object, without extending the prototype

var f = function f() {
	var funk = arguments.length <= 0 || arguments[0] === undefined ? id : arguments[0];
	var length = arguments.length <= 1 || arguments[1] === undefined ? funk.length : arguments[1];
	var initial_arguments = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];
	return (function () {

		//We expect a function. If we are given another value, lift it to a function
		if (typeof funk !== 'function') {
			return f().of(funk)

			//If the function takes just one argument, just extend it with methods and return it.
			;
		} else if (length < 2) {
			return extend(funk, methods)

			//Else, return a curry-capable version of the function (again, extended with the function methods)
			;
		} else {
			var extended_funk = extend(function () {
				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				var all_arguments = initial_arguments.concat(args);
				return all_arguments.length >= length ? funk.apply(undefined, _toConsumableArray(all_arguments)) : f(funk, length, all_arguments);
			}, methods);

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

exports.phatMap = function phatMap(funk) {
        if (funk === undefined) {
                throw "function not defined";
        }
        return this.map(funk).tryFlat();
};

exports.flatMap = function flatMap(funk) {
        if (funk === undefined) {
                throw "function not defined";
        }
        return this.map(funk).flat();
};
exports.print = function print() {
        console.log(this.toString());
        return this;
};

},{}],3:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var helpers = require("./helpers"); //--

var methods = { //--

	//the `of` method, takes a value and puts it in a list.

	//a.of(b) -> b a
	of: function of(val) {
		return list(val);
	},

	//`map` applies a function to each element of the list, as the one from the Array prototype

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
	},
	funktionType: "list" //--

}; //--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
methods.flatMap = helpers.flatMap;
methods.phatMap = helpers.phatMap;

//Add a print function, used for debugging.
methods.print = helpers.print;

//Add support for array extras, so that they return a list instead of normal Array

methods.extras = {};

//Some functions are directly lifted from the Array prototype

var immutableFunctions = ["map", "concat"];

immutableFunctions.forEach(function (funk) {
	methods.extras[funk] = function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return list(Array.prototype[funk].apply(this, args));
	};
});

//The type also wraps some Array functions in a way that makes them immutable

var mutableFunctions = ["splice", "reverse", "sort"];

mutableFunctions.forEach(function (funk) {
	methods.extras[funk] = function () {
		var newArray = this.slice(0);

		for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			args[_key2] = arguments[_key2];
		}

		Array.prototype[funk].apply(newArray, args);
		return newArray;
	};
});

extend(methods, methods.extras);

//This is the list constructor. It takes normal array and augments it with the above methods

var list = function list() {
	for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
		args[_key3] = arguments[_key3];
	}

	if (args.length === 1 && args[0].funktionType === "list") {
		return args[0]
		//Accept an array
		;
	} else if (args.length === 1 && args[0].constructor === Array) {
		return Object.freeze(extend(args[0], methods))
		//Accept several arguments
		;
	} else {
		return Object.freeze(extend(args, methods));
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
var methods = { //--

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
		if (this !== nothing && this._value.funktionType === "maybe") {
			return this._value;
		} else {
			return this;
		}
	},

	funktionType: "maybe", //--

	//Finally, the type has some helper functions:

	filter: function filter(funk) {
		return funk(this._value) ? this : nothing;
	},

	reduce: function reduce(funk) {
		return funk(this._value);
	},

	get: function get(prop) {
		return maybe(this.map(function (val) {
			return val[prop];
		}));
	}

}; //--

methods.extras = [methods.get, methods.filter];

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
methods.flatMap = helpers.flatMap;
methods.phatMap = helpers.phatMap;

//Add a print function, used for debugging.
methods.print = helpers.print;

//In case you are interested, here is how the maybe constructor is implemented

var maybe = function maybe(value) {
	if (value === undefined) {
		return nothing;
	} else {
		var obj = Object.create(methods);
		obj._value = value;
		obj.constructor = maybe;
		Object.freeze(obj);
		return obj;
	}
};

var nothing = Object.create(methods); //--
nothing.constructor = maybe; //--
Object.freeze(nothing); //--
maybe.nothing = nothing; //--

maybe.prototype = methods;
module.exports = maybe //--
;

},{"./helpers":2}],5:[function(require,module,exports){
"use strict";

var helpers = require("./helpers"); //--
var maybe = require("./maybe"); //--
var methods = { //--

	//The `of` method, takes a value and wraps it in a `maybe`.
	//In this case we do this by just calling the constructor.

	//a -> m a
	of: function of(input) {},

	//`map` takes the function and applies it to the value in the maybe, if there is one.

	//m maybe a -> ( a -> maybe b ) -> m maybe b
	map: function map(funk) {
		return maybeT(this._value.map(function (val) {
			return val === undefined ? val : funk(val);
		}));
	},

	//`flat` takes a maybe that contains another maybe and flattens it.
	//In this case this means just returning the inner value.

	//m (m x) -> m x
	flat: function flat() {},

	//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`

	tryFlat: function tryFlat() {
		return maybeT(this._value.map(function (val) {
			if (val.funktionType === "maybe") {
				return val._value;
			} else {
				return val;
			}
		}));
	},

	funktionType: "maybe" //--

}; //--

maybe.prototype.extras.forEach(function (method) {
	methods[method.name] = method;
});

//In case you are interested, here is how the maybe constructor is implemented

var maybeT = function maybeT(monadValue) {
	var obj = Object.create(methods);
	obj._value = monadValue;
	obj.constructor = maybeT;
	Object.freeze(obj);
	return obj;
};

module.exports = maybeT //--
;

},{"./helpers":2,"./maybe":4}],6:[function(require,module,exports){
"use strict";

var helpers = require("./helpers"); //--
var methods = { //--

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

}; //--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
methods.flatMap = helpers.flatMap;
methods.phatMap = helpers.phatMap;

//Add a print function, used for debugging.
methods.print = helpers.print;

//In case you are interested, here is how the promise constructor is implemented

var promise = function promise(resolve) {
	if (typeof resolve !== "function") {
		return methods.of(resolve);
	}
	var obj = Object.create(methods);

	obj._resolver = resolve;
	obj.constructor = promise;
	obj.prototype = methods;
	Object.freeze(obj);
	return obj;
};

module.exports = promise //--
;

},{"./helpers":2}],7:[function(require,module,exports){
"use strict";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var f = require("./f"); //--

var helpers = require("./helpers"); //--

var methods = { //--

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
	}

}; //--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
methods.flatMap = helpers.flatMap;
methods.phatMap = helpers.phatMap;

//Add a print function, used for debugging.
methods.print = helpers.print;

//In case you are interested, here is how the state constructor is implemented

var state = function state(run) {
	if (typeof run !== "function") {
		return methods.of(run);
	}
	var obj = Object.create(methods);
	obj._runState = f(run, 1);
	obj.constructor = state;
	obj.prototype = methods;
	Object.freeze(obj);
	return obj;
};

module.exports = state //--
;

},{"./f":1,"./helpers":2}],8:[function(require,module,exports){
"use strict";

var helpers = require("./helpers"); //--
var methods = { //--

	//The `of` method takes a value and wraps it in a stream, by immediately calling the pusher function with it.

	//a -> m a
	of: function of(val) {
		return stream(function (push) {
			return push(val);
		});
	},

	//The `map` method creates a new stream, such that every time the old stream receives a value, it
	//applies `funk` to it and then pushes it to the new stream.

	//m a -> ( a -> b ) -> m b
	map: function map(funk) {
		var _this = this;

		return stream(function (push) {
			return _this._pusher(function (val) {
				return push(funk(val));
			});
		});
	},

	//In this case the implementation of `flat` is quite simple.

	//Effectively all we have to do is return the same value with which the inner stream is pushd with.
	//To do this, we unwrap our stream once to get the inner stream value, and then unwrap the inner
	//stream itself to get its value.

	//m (m x) -> m x
	flat: function flat() {
		var _this2 = this;

		return stream(function (push) {
			return _this2._pusher(function (inner_stream) {
				return inner_stream._pusher(function (val) {
					return push(val);
				});
			});
		});
	},

	//The `tryFlat` function is almost the same:

	//m (m x) -> m x
	tryFlat: function tryFlat() {
		var _this3 = this;

		return stream(function (push) {
			return _this3._pusher(function (inner_stream) {
				if (inner_stream.constructor === stream) {
					inner_stream._pusher(function (val) {
						return push(val);
					});
				} else {
					push(inner_stream);
				}
			});
		});
	},

	//The `run` function just feeds the pusher with a placeholder  function so our computation can
	//start executing.

	run: function run() {
		return this._pusher(function (a) {
			return a;
		});
	},

	//After these are done, all we need to do is implement the traditional JS array functions

	//`ForEach` is almost the same as `map`, except we don't push `funk(val)` - the result of the transformation
	//to the new stream, but we push `val` instead.

	forEach: function forEach(funk) {
		var _this4 = this;

		return stream(function (push) {
			return _this4._pusher(function (val) {
				push(val);
				funk(val);
			});
		});
	},

	//With filter the result of `funk(val)` shows us whether we need to push the value

	filter: function filter(funk) {
		var _this5 = this;

		return stream(function (push) {
			return _this5._pusher(function (val) {
				if (funk(val)) {
					push(val);
				}
			});
		});
	},

	reduce: function reduce(funk, from) {
		var accumulator = from;
		this._pusher(function (val) {
			accumulator = funk(accumulator, val);
		});
	}
}; //--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
methods.flatMap = helpers.flatMap;
methods.phatMap = helpers.phatMap;

//Add a print function, used for debugging.
methods.print = helpers.print;

//In case you are interested, here is how the stream constructor is implemented

var stream = function stream(push) {
	if (typeof push !== "function") {
		return methods.of(push);
	}
	var obj = Object.create(methods);

	obj._pusher = push;
	obj.constructor = stream;
	obj.prototype = methods;
	Object.freeze(obj);
	return obj;
};

module.exports = stream;

},{"./helpers":2}],9:[function(require,module,exports){
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

},{"../library/f":1}],10:[function(require,module,exports){
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

},{"../library/f":1,"../library/list":3}],11:[function(require,module,exports){
"use strict";

var maybeT = require("../library/maybeT");
var list = require("../library/list");

QUnit.module("maybeT");

QUnit.test("map", function (assert) {
    //--
    var maybeList = maybeT(list(1, 2, 3));
    assert.expect(1);
    assert.deepEqual(maybeT(list({ a: "b" }, { a: "c" })).get("a")._value._value, ["b", "c"]);
});

},{"../library/list":3,"../library/maybeT":5}],12:[function(require,module,exports){
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

},{"../library/f":1,"../library/maybe":4}],13:[function(require,module,exports){
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

},{"../library/f":1,"../library/promise":6}],14:[function(require,module,exports){
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

},{"../library/f":1,"../library/state":7}],15:[function(require,module,exports){

/*---
category: tutorial
title: stream 
layout: post
---

The `stream` type, also known as a lazy list is a container for a list of values which come asynchronously.

<!--more-->
*/
"use strict";

QUnit.module("stream"); //--

//To use the `stream` monad constructor, you can require it using node:

var stream = require("../library/stream");
var f = require("../library/f"); //--

//Where the `../` is the location of the module.

//To create a `stream` pass a function which accepts a callback and calls that callback with the specified value:

var clickStream = stream(function (push) {
	document.addEventListener("click", push);
});
window.clickStream = clickStream;

// Like promises, streams are also created with a helper

var countTo = function countTo(range) {
	return stream(function (push) {
		for (var i = 1; i <= range; i++) {
			push(i);
		}
	});
};
/*
`run()`
----
Executes the stream and fetches the data.

***

`map(funk)`
----
Returns a new stream, which applies `funk` to the data when you run it.

***
*/

QUnit.test("map", function (assert) {
	//--
	var stop = assert.async(); //--
	var pushToStream = undefined;
	var myStream = stream(function (push) {
		pushToStream = push;
	}).map(function (val) {
		return val * 2;
	}).map(function (val) {
		return assert.equal(val, 10);
	}).run();

	pushToStream(5);
	stop();
}); //--

/*
`phatMap(funk)`
----
A more powerful version of `map` which can allows you to chain several steps of the asychronous computations together.
Known as `then` for traditional stream libraries.

***
*/

//QUnit.test("phatMap", function(assert){//--
//const done = assert.async()//--	
//})//--

/*
under the hood
--------------
Let's see how the type is implemented
*/

},{"../library/f":1,"../library/stream":8}]},{},[9,10,11,12,13,14,15])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2YuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2hlbHBlcnMuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2xpc3QuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L21heWJlLmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9tYXliZVQuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L3Byb21pc2UuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L3N0YXRlLmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9zdHJlYW0uanMiLCJkOi9wci9mdW5rdGlvbi90ZXN0cy9mX3Rlc3RzLmpzIiwiZDovcHIvZnVua3Rpb24vdGVzdHMvbGlzdF90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL21heWJlVF90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL21heWJlX3Rlc3RzLmpzIiwiZDovcHIvZnVua3Rpb24vdGVzdHMvcHJvbWlzZV90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL3N0YXRlX3Rlc3RzLmpzIiwiZDovcHIvZnVua3Rpb24vdGVzdHMvc3RyZWFtX3Rlc3RzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7QUFHbEMsSUFBTSxFQUFFLEdBQUcsU0FBTCxFQUFFLENBQUcsQ0FBQztRQUFJLENBQUM7Q0FBQSxDQUFBOztBQUVoQixJQUFJLE9BQU8sR0FBRzs7Ozs7O0FBTWIsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLEdBQUcsS0FBSyxTQUFTLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBRTtVQUFNLEdB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QUMsS0FBSyxDQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUUsQ0FBQTtDQUc5QixDQUFDLENBQUE7Ozs7Ozs7O0FBUUYsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBUyxNQUFNLEVBQUM7O0FBQ2hDLE1BQU0sUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUMxQixRQUFNLENBQUMsS0FBSyxDQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTtBQUM5QixRQUFNLENBQUMsS0FBSyxDQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTs7QUFFaEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUE7QUFDbkIsUUFBTSxDQUFDLEtBQUssQ0FBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7QUFDeEIsUUFBTSxDQUFDLEtBQUssQ0FBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFFLENBQUE7Q0FFNUIsQ0FBQyxDQUFBOzs7Ozs7QUFNRixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFTLE1BQU0sRUFBQzs7Ozs7QUFJakMsTUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFFLFVBQUEsR0FBRztXQUFJLEdBQUcsR0FBQyxDQUFDO0dBQUEsQ0FBRSxDQUFBOzs7O0FBSzdCLE1BQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7O0FBRTVCLFFBQU0sQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBOztBQUUzQixNQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBOztBQUU1QixRQUFNLENBQUMsS0FBSyxDQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUs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QUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtDQUFDLENBQUMsQ0FBQTtBQUNsRixNQUFNLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQTs7OztBQUloQyxJQUFNLE9BQU8sR0FBRyxTQUFWLE9BQU8sQ0FBSSxLQUFLO1FBQUssTUFBTSxDQUFFLFVBQUMsSUFBSSxFQUFLO0FBQzVDLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUM7QUFDOUIsT0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ1A7RUFDRCxDQUFDO0NBQUEsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7O0FBZUgsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBUyxNQUFNLEVBQUM7O0FBQ2pDLEtBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUMzQixLQUFJLFlBQVksR0FBRyxTQUFTLENBQUE7QUFDNUIsS0FBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFVBQUEsSUFBSSxFQUFHO0FBQUUsY0FBWSxHQUFHLElBQUksQ0FBQTtFQUFDLENBQUMsQ0FDcEQsR0FBRyxDQUFDLFVBQUEsR0FBRztTQUFJLEdBQUcsR0FBQyxDQUFDO0VBQUEsQ0FBQyxDQUNqQixHQUFHLENBQUMsVUFBQSxHQUFHO1NBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO0VBQUEsQ0FBQyxDQUNqQyxHQUFHLEVBQUUsQ0FBQTs7QUFFUCxhQUFZLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDZixLQUFJLEVBQUUsQ0FBQTtDQUNOLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG5cclxuY29uc3QgaWQgPSBhID0+IGEgLy8tLVxyXG5cclxuXHR2YXIgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBpdC5cclxuLy90aGlzIGlzIHZlcnkgdXNlZnVsIGlmIHlvdSBoYXZlIGEgQVBJIHdoaWNoIGV4cGVjdHMgYSBmdW5jdGlvbiwgYnV0IHlvdSB3YW50IHRvIGZlZWQgaXQgd2l0aCBhIHZhbHVlIChzZWUgdGhlIGBmbGF0bWFwYCBleGFtcGxlKS4gXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiB2YWwgPT09IHVuZGVmaW5lZCA/IGlkIDogZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpID0+IChiIC0+IGMpID0+IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkgPT4gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fS8vLS1cclxuXHJcbi8vQWRkIGFsaWFzZXMgdG8gbWFwIC4gZmxhdCBhcyBmbGF0TWFwIGFuZCBtYXAgLiB0cnlGbGF0IGFzIHBoYXRNYXBcclxuICAgICAgICBtZXRob2RzLmZsYXRNYXAgPSBoZWxwZXJzLmZsYXRNYXBcclxuICAgICAgICBtZXRob2RzLnBoYXRNYXAgPSBoZWxwZXJzLnBoYXRNYXBcclxuXHJcbi8vQWRkIGEgcHJpbnQgZnVuY3Rpb24sIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgICAgICBtZXRob2RzLnByaW50ID0gaGVscGVycy5wcmludFxyXG5cclxuLy9UaGlzIGlzIHRoZSBmdW5jdGlvbiBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgYSBmdW5jdGlvbiBhbmQgYWRkcyBhbiBhdWdtZW50ZWQgZnVuY3Rpb24gb2JqZWN0LCB3aXRob3V0IGV4dGVuZGluZyB0aGUgcHJvdG90eXBlXHJcblxyXG5cdHZhciBmID0gKGZ1bmsgPSBpZCwgbGVuZ3RoID0gZnVuay5sZW5ndGgsIGluaXRpYWxfYXJndW1lbnRzID0gW10pID0+IHtcclxuXHJcblx0XHQvL1dlIGV4cGVjdCBhIGZ1bmN0aW9uLiBJZiB3ZSBhcmUgZ2l2ZW4gYW5vdGhlciB2YWx1ZSwgbGlmdCBpdCB0byBhIGZ1bmN0aW9uXHJcblx0XHRpZih0eXBlb2YgZnVuayAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdHJldHVybiBmKCkub2YoZnVuaylcclxuXHRcdFxyXG5cdFx0Ly9JZiB0aGUgZnVuY3Rpb24gdGFrZXMganVzdCBvbmUgYXJndW1lbnQsIGp1c3QgZXh0ZW5kIGl0IHdpdGggbWV0aG9kcyBhbmQgcmV0dXJuIGl0LlxyXG5cdFx0fWVsc2UgaWYgKCBsZW5ndGggPCAyICl7XHJcblx0XHRcdHJldHVybiBleHRlbmQoZnVuaywgbWV0aG9kcylcclxuXHJcblx0XHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBleHRlbmRlZF9mdW5rID0gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciBhbGxfYXJndW1lbnRzICA9IChpbml0aWFsX2FyZ3VtZW50cykuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgbGVuZ3RoLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0XHR9LCBtZXRob2RzKVxyXG5cdFx0XHRcclxuXHRcdFx0ZXh0ZW5kZWRfZnVuay5fbGVuZ3RoID0gbGVuZ3RoIC0gaW5pdGlhbF9hcmd1bWVudHMubGVuZ3RoXHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX29yaWdpbmFsID0gZnVua1xyXG5cclxuXHRcdFx0cmV0dXJuIGV4dGVuZGVkX2Z1bmtcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGZ1bmN0aW9uIG9iamVjdCBpcyBleHRlbmRlZFxyXG5cclxuXHRmdW5jdGlvbiBleHRlbmQob2JqLCBtZXRob2RzKXtcclxuXHRcdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG5cdH1cclxuXHJcblx0XHJcblx0Zi5vZiA9IHZhbCA9PiBmKCAoKSA9PiB2YWwgKSxcclxuXHJcbi8vVGhlIGxpYnJhcnkgYWxzbyBmZWF0dXJlcyBhIHN0YW5kYXJkIGNvbXBvc2UgZnVuY3Rpb24gd2hpY2ggYWxsb3dzIHlvdSB0byBtYXAgbm9ybWFsIGZ1bmN0aW9ucyB3aXRoIG9uZSBhbm90aGVyXHJcblxyXG5cdGYuY29tcG9zZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9Db252ZXJ0IGZ1bmN0aW9ucyB0byBhbiBhcnJheSBhbmQgZmxpcCB0aGVtIChmb3IgcmlnaHQtdG8tbGVmdCBleGVjdXRpb24pXHJcblx0XHR2YXIgZnVuY3Rpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5yZXZlcnNlKClcclxuXHRcdC8vQ2hlY2sgaWYgaW5wdXQgaXMgT0s6XHJcblx0XHRmdW5jdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmdW5rKXtpZih0eXBlb2YgZnVuayAhPT0gXCJmdW5jdGlvblwiKXt0aHJvdyBuZXcgVHlwZUVycm9yKGZ1bmsrXCIgaXMgbm90IGEgZnVuY3Rpb25cIiApfX0pXHJcblx0XHQvL1JldHVybiB0aGUgZnVuY3Rpb24gd2hpY2ggY29tcG9zZXMgdGhlbVxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vVGFrZSB0aGUgaW5pdGlhbCBpbnB1dFxyXG5cdFx0XHR2YXIgaW5wdXQgPSBhcmd1bWVudHNcclxuXHRcdFx0dmFyIGNvbnRleHRcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9ucy5yZWR1Y2UoZnVuY3Rpb24ocmV0dXJuX3Jlc3VsdCwgZnVuaywgaSl7IFxyXG5cdFx0XHRcdC8vSWYgdGhpcyBpcyB0aGUgZmlyc3QgaXRlcmF0aW9uLCBhcHBseSB0aGUgYXJndW1lbnRzIHRoYXQgdGhlIHVzZXIgcHJvdmlkZWRcclxuXHRcdFx0XHQvL2Vsc2UgdXNlIHRoZSByZXR1cm4gcmVzdWx0IGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uXHJcblx0XHRcdFx0cmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsocmV0dXJuX3Jlc3VsdCkpXHJcblx0XHRcdFx0Ly9yZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuay5hcHBseShjb250ZXh0LCBbcmV0dXJuX3Jlc3VsdF0pKVxyXG5cdFx0XHR9LCB1bmRlZmluZWQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblx0bW9kdWxlLmV4cG9ydHMgPSBmLy8tLVxyXG4iLCJleHBvcnRzLnBoYXRNYXAgPSBmdW5jdGlvbiBwaGF0TWFwKGZ1bmspe1xyXG4gICAgICAgIGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpXHJcbn1cclxuXHJcbmV4cG9ydHMuZmxhdE1hcCA9IGZ1bmN0aW9uIGZsYXRNYXAoZnVuaykge1xyXG4gICAgICAgIGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcbn1cclxuZXhwb3J0cy5wcmludCA9IGZ1bmN0aW9uIHByaW50ICgpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMudG9TdHJpbmcoKSlcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG59XHJcblxyXG4iLCJcclxuXHJcbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuXHJcbnZhciBtZXRob2RzID0gey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCBwdXRzIGl0IGluIGEgbGlzdC5cclxuXHJcblx0XHQvL2Eub2YoYikgLT4gYiBhXHJcblx0XHRvZjogdmFsID0+IGxpc3QodmFsKSxcclxuXHJcbi8vYG1hcGAgYXBwbGllcyBhIGZ1bmN0aW9uIHRvIGVhY2ggZWxlbWVudCBvZiB0aGUgbGlzdCwgYXMgdGhlIG9uZSBmcm9tIHRoZSBBcnJheSBwcm90b3R5cGVcclxuXHRcdFxyXG4vL2BmbGF0YCB0YWtlcyBhIGxpc3Qgb2YgbGlzdHMgYW5kIGZsYXR0ZW5zIHRoZW0gd2l0aCBvbmUgbGV2ZWwgXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkuam9pbigpID0gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBsaXN0KCB0aGlzLnJlZHVjZSgobGlzdCwgZWxlbWVudCkgPT4gWy4uLmxpc3QsIC4uLmVsZW1lbnRdLCBbXSkgKVxyXG5cdFx0fSxcclxuXHRcdFxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgXHJcbi8vYW5kIHdpdGggaXQsIHlvdXIgZnVuayBjYW4gcmV0dXJuIGJvdGggYSBsaXN0IG9mIG9iamVjdHMgYW5kIGEgc2luZ2xlIG9iamVjdFxyXG5cclxuXHRcdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoIHRoaXMucmVkdWNlKChsaXN0LCBlbGVtZW50KSA9PiBcclxuXHRcdFx0XHRlbGVtZW50LmNvbnN0cnVjdG9yID09PSBBcnJheT8gWy4uLmxpc3QsIC4uLmVsZW1lbnRdIDogWy4uLmxpc3QsIGVsZW1lbnRdICwgW10pXHJcblx0XHRcdClcclxuXHRcdH0sXHJcblx0XHRmdW5rdGlvblR5cGU6XCJsaXN0XCIvLy0tXHJcblxyXG5cdH0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcblxyXG4vL0FkZCBzdXBwb3J0IGZvciBhcnJheSBleHRyYXMsIHNvIHRoYXQgdGhleSByZXR1cm4gYSBsaXN0IGluc3RlYWQgb2Ygbm9ybWFsIEFycmF5XHJcblxyXG5tZXRob2RzLmV4dHJhcyA9IHt9XHJcblxyXG4vL1NvbWUgZnVuY3Rpb25zIGFyZSBkaXJlY3RseSBsaWZ0ZWQgZnJvbSB0aGUgQXJyYXkgcHJvdG90eXBlXHJcblxyXG52YXIgaW1tdXRhYmxlRnVuY3Rpb25zID0gWydtYXAnLCAnY29uY2F0J11cclxuXHJcbmltbXV0YWJsZUZ1bmN0aW9ucy5mb3JFYWNoKChmdW5rKSA9PiB7IFxyXG5cdG1ldGhvZHMuZXh0cmFzW2Z1bmtdID0gZnVuY3Rpb24oLi4uYXJncyl7XHJcblx0XHRcdHJldHVybiBsaXN0KEFycmF5LnByb3RvdHlwZVtmdW5rXS5hcHBseSh0aGlzLCBhcmdzKSlcclxuXHR9XHJcbn0pXHJcblxyXG4vL1RoZSB0eXBlIGFsc28gd3JhcHMgc29tZSBBcnJheSBmdW5jdGlvbnMgaW4gYSB3YXkgdGhhdCBtYWtlcyB0aGVtIGltbXV0YWJsZVxyXG5cclxudmFyIG11dGFibGVGdW5jdGlvbnMgPSBbJ3NwbGljZScsICdyZXZlcnNlJywgJ3NvcnQnXVxyXG5cclxubXV0YWJsZUZ1bmN0aW9ucy5mb3JFYWNoKChmdW5rKSA9PiB7IFxyXG5cdG1ldGhvZHMuZXh0cmFzW2Z1bmtdID0gZnVuY3Rpb24oLi4uYXJncyl7XHJcblx0XHRcdHZhciBuZXdBcnJheSA9IHRoaXMuc2xpY2UoMClcclxuXHRcdFx0QXJyYXkucHJvdG90eXBlW2Z1bmtdLmFwcGx5KG5ld0FycmF5LCBhcmdzKVxyXG5cdFx0XHRyZXR1cm4gbmV3QXJyYXlcclxuXHR9XHJcbn0pXHJcblxyXG5leHRlbmQobWV0aG9kcywgbWV0aG9kcy5leHRyYXMpXHJcblxyXG4vL1RoaXMgaXMgdGhlIGxpc3QgY29uc3RydWN0b3IuIEl0IHRha2VzIG5vcm1hbCBhcnJheSBhbmQgYXVnbWVudHMgaXQgd2l0aCB0aGUgYWJvdmUgbWV0aG9kc1xyXG5cdFxyXG5cdHZhciBsaXN0ID0gKC4uLmFyZ3MpID0+IHtcclxuXHRcdGlmKGFyZ3MubGVuZ3RoID09PSAxICYmIGFyZ3NbMF0uZnVua3Rpb25UeXBlID09PSBcImxpc3RcIil7XHJcblx0XHRcdHJldHVybiBhcmdzWzBdXHJcblx0XHQvL0FjY2VwdCBhbiBhcnJheVxyXG5cdFx0fWVsc2UgaWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkgKXtcclxuXHRcdFx0cmV0dXJuICBPYmplY3QuZnJlZXplKGV4dGVuZChhcmdzWzBdLCBtZXRob2RzKSlcclxuXHRcdC8vQWNjZXB0IHNldmVyYWwgYXJndW1lbnRzXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIE9iamVjdC5mcmVlemUoZXh0ZW5kKGFyZ3MsIG1ldGhvZHMpKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbi8vSGVyZSBpcyB0aGUgZnVuY3Rpb24gd2l0aCB3aGljaCB0aGUgbGlzdCBvYmplY3QgaXMgZXh0ZW5kZWRcclxuXHRmdW5jdGlvbiBleHRlbmQob2JqLCBtZXRob2RzKXtcclxuXHRcdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG5cdH1cclxubW9kdWxlLmV4cG9ydHMgPSBsaXN0Ly8tLVxyXG4iLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcbnZhciBtZXRob2RzID0gey8vLS1cclxuXHJcbi8vVGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIGBtYXliZWAuXHJcbi8vSW4gdGhpcyBjYXNlIHdlIGRvIHRoaXMgYnkganVzdCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3Rvci5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBtYXliZShpbnB1dClcclxuXHR9LFxyXG5cclxuLy9gbWFwYCB0YWtlcyB0aGUgZnVuY3Rpb24gYW5kIGFwcGxpZXMgaXQgdG8gdGhlIHZhbHVlIGluIHRoZSBtYXliZSwgaWYgdGhlcmUgaXMgb25lLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gbWF5YmUoZnVuayh0aGlzLl92YWx1ZSkpXHJcblx0XHR9ZWxzZXtcdFxyXG5cdFx0XHRyZXR1cm4gdGhpcyBcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nICYmIHRoaXMuX3ZhbHVlLmZ1bmt0aW9uVHlwZSA9PT0gXCJtYXliZVwiKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHR9LFxyXG5cdFxyXG5cdGZ1bmt0aW9uVHlwZTpcIm1heWJlXCIsLy8tLVxyXG5cclxuLy9GaW5hbGx5LCB0aGUgdHlwZSBoYXMgc29tZSBoZWxwZXIgZnVuY3Rpb25zOlxyXG5cclxuXHRmaWx0ZXI6ZnVuY3Rpb24gZmlsdGVyIChmdW5rKXtcclxuXHRcdHJldHVybiBmdW5rKHRoaXMuX3ZhbHVlKSA/IHRoaXMgOiBub3RoaW5nXHJcblx0fSxcclxuXHJcblx0cmVkdWNlOmZ1bmN0aW9uIHJlZHVjZSAoZnVuayl7XHJcblx0XHRyZXR1cm4gZnVuayh0aGlzLl92YWx1ZSlcclxuXHR9LFxyXG5cclxuXHRnZXQ6ZnVuY3Rpb24gZ2V0IChwcm9wKXtcclxuXHRcdHJldHVybiBtYXliZSh0aGlzLm1hcCggKHZhbCkgPT4gdmFsW3Byb3BdICkpXHJcblx0fSxcclxuXHJcblxyXG5cdFxyXG4gICAgfS8vLS1cclxuXHJcbm1ldGhvZHMuZXh0cmFzID0gW21ldGhvZHMuZ2V0LCBtZXRob2RzLmZpbHRlcl1cclxuXHJcbi8vQWRkIGFsaWFzZXMgdG8gbWFwIC4gZmxhdCBhcyBmbGF0TWFwIGFuZCBtYXAgLiB0cnlGbGF0IGFzIHBoYXRNYXBcclxuICAgICAgICBtZXRob2RzLmZsYXRNYXAgPSBoZWxwZXJzLmZsYXRNYXBcclxuICAgICAgICBtZXRob2RzLnBoYXRNYXAgPSBoZWxwZXJzLnBoYXRNYXBcclxuXHJcbi8vQWRkIGEgcHJpbnQgZnVuY3Rpb24sIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgICAgICBtZXRob2RzLnByaW50ID0gaGVscGVycy5wcmludFxyXG5cclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBtYXliZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHJcblx0dmFyIG1heWJlID0gZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpe1xyXG5cdFx0XHRyZXR1cm4gbm90aGluZ1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcblx0XHRcdG9iai5fdmFsdWUgPSB2YWx1ZVxyXG5cdFx0XHRvYmouY29uc3RydWN0b3IgPSBtYXliZVxyXG5cdFx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdFx0cmV0dXJuIG9ialxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbnZhciBub3RoaW5nID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKS8vLS1cclxubm90aGluZy5jb25zdHJ1Y3RvciA9IG1heWJlLy8tLVxyXG5PYmplY3QuZnJlZXplKG5vdGhpbmcpLy8tLVxyXG5tYXliZS5ub3RoaW5nID0gbm90aGluZy8vLS1cclxuXHJcbm1heWJlLnByb3RvdHlwZSA9IG1ldGhvZHNcclxubW9kdWxlLmV4cG9ydHMgPSBtYXliZS8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgbWF5YmUgPSByZXF1aXJlKFwiLi9tYXliZVwiKS8vLS1cclxudmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy9UaGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIHdyYXBzIGl0IGluIGEgYG1heWJlYC5cclxuLy9JbiB0aGlzIGNhc2Ugd2UgZG8gdGhpcyBieSBqdXN0IGNhbGxpbmcgdGhlIGNvbnN0cnVjdG9yLlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24oaW5wdXQpe1xyXG5cdH0sXHJcblxyXG4vL2BtYXBgIHRha2VzIHRoZSBmdW5jdGlvbiBhbmQgYXBwbGllcyBpdCB0byB0aGUgdmFsdWUgaW4gdGhlIG1heWJlLCBpZiB0aGVyZSBpcyBvbmUuXHJcblxyXG5cdC8vbSBtYXliZSBhIC0+ICggYSAtPiBtYXliZSBiICkgLT4gbSBtYXliZSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG4gICAgICAgICAgICByZXR1cm4gbWF5YmVUKCB0aGlzLl92YWx1ZS5tYXAoKHZhbCkgPT4ge1xyXG4gICAgICAgICAgICAgICByZXR1cm4gdmFsID09PSB1bmRlZmluZWQ/IHZhbDpmdW5rKHZhbClcclxuICAgICAgICAgICAgfSkgKVxyXG5cdH0sXHJcblxyXG4vL2BmbGF0YCB0YWtlcyBhIG1heWJlIHRoYXQgY29udGFpbnMgYW5vdGhlciBtYXliZSBhbmQgZmxhdHRlbnMgaXQuXHJcbi8vSW4gdGhpcyBjYXNlIHRoaXMgbWVhbnMganVzdCByZXR1cm5pbmcgdGhlIGlubmVyIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdH0sXHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXliZVQodGhpcy5fdmFsdWUubWFwKCAodmFsKSA9PntcclxuXHRcdGlmKHZhbC5mdW5rdGlvblR5cGUgPT09IFwibWF5YmVcIil7XHJcblx0XHRcdHJldHVybiB2YWwuX3ZhbHVlXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHZhbFxyXG5cdFx0fVxyXG4gICAgICAgICAgICB9KSlcclxuXHR9LFxyXG5cdFxyXG5cdGZ1bmt0aW9uVHlwZTpcIm1heWJlXCIvLy0tXHJcblx0XHJcbiAgICB9Ly8tLVxyXG5cclxubWF5YmUucHJvdG90eXBlLmV4dHJhcy5mb3JFYWNoKChtZXRob2QpPT57XHJcbiAgICBtZXRob2RzW21ldGhvZC5uYW1lXSA9IG1ldGhvZFxyXG59KVxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIG1heWJlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cclxuXHR2YXIgbWF5YmVUID0gZnVuY3Rpb24obW9uYWRWYWx1ZSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG4gICAgICAgICAgICAgICAgb2JqLl92YWx1ZSA9IG1vbmFkVmFsdWVcclxuICAgICAgICAgICAgICAgIG9iai5jb25zdHJ1Y3RvciA9IG1heWJlVFxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZShvYmopXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb2JqXHJcblx0fVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtYXliZVQvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy9UaGUgYG9mYCBtZXRob2QgdGFrZXMgYSB2YWx1ZSBhbmQgd3JhcHMgaXQgaW4gYSBwcm9taXNlLCBieSBpbW1lZGlhdGVseSBjYWxsaW5nIHRoZSByZXNvbHZlciBmdW5jdGlvbiB3aXRoIGl0LlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24odmFsKXtcclxuXHRcdHJldHVybiBwcm9taXNlKCAocmVzb2x2ZSkgPT4gcmVzb2x2ZSh2YWwpIClcclxuXHR9LFxyXG5cclxuLy9UaGUgYG1hcGAgbWV0aG9kIGNyZWF0ZXMgYSBuZXcgcHJvbWlzZSwgc3VjaCB0aGF0IHdoZW4gdGhlIG9sZCBwcm9taXNlIGlzIHJlc29sdmVkLCBpdCB0YWtlcyBpdHMgcmVzdWx0LCBcclxuLy9hcHBsaWVzIGBmdW5rYCB0byBpdCBhbmQgdGhlbiByZXNvbHZlcyBpdHNlbGYgd2l0aCB0aGUgdmFsdWUuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiB0aGlzLl9yZXNvbHZlciggKHZhbCkgPT4gcmVzb2x2ZSggZnVuayh2YWwpICkgKSApXHJcblxyXG5cdH0sXHJcblxyXG4vL0luIHRoaXMgY2FzZSB0aGUgaW1wbGVtZW50YXRpb24gb2YgYGZsYXRgIGlzIHF1aXRlIHNpbXBsZS5cclxuXHJcbi8vRWZmZWN0aXZlbHkgYWxsIHdlIGhhdmUgdG8gZG8gaXMgcmV0dXJuIHRoZSBzYW1lIHZhbHVlIHdpdGggd2hpY2ggdGhlIGlubmVyIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aC5cclxuLy9UbyBkbyB0aGlzLCB3ZSB1bndyYXAgb3VyIHByb21pc2Ugb25jZSB0byBnZXQgdGhlIGlubmVyIHByb21pc2UgdmFsdWUsIGFuZCB0aGVuIHVud3JhcCB0aGUgaW5uZXJcclxuLy9wcm9taXNlIGl0c2VsZiB0byBnZXQgaXRzIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiBcclxuXHRcdFx0dGhpcy5fcmVzb2x2ZXIoXHQoaW5uZXJfcHJvbWlzZSkgPT4gXHJcblx0XHRcdFx0aW5uZXJfcHJvbWlzZS5fcmVzb2x2ZXIoKHZhbCkgPT4gcmVzb2x2ZSh2YWwpKVxyXG5cdFx0XHQpIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgdHJ5RmxhdGAgZnVuY3Rpb24gaXMgYWxtb3N0IHRoZSBzYW1lOlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiBcclxuXHRcdFx0dGhpcy5fcmVzb2x2ZXIoXHQoaW5uZXJfcHJvbWlzZSkgPT4geyBcclxuXHRcdFx0XHRpZihpbm5lcl9wcm9taXNlLmNvbnN0cnVjdG9yID09PSBwcm9taXNlKXtcclxuXHRcdFx0XHRcdGlubmVyX3Byb21pc2UuX3Jlc29sdmVyKCh2YWwpID0+IHJlc29sdmUodmFsKSlcclxuXHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdHJlc29sdmUoaW5uZXJfcHJvbWlzZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgcnVuYCBmdW5jdGlvbiBqdXN0IGZlZWRzIHRoZSByZXNvbHZlciB3aXRoIGEgcGxhY2Vob2xkZXIgIGZ1bmN0aW9uIHNvIG91ciBjb21wdXRhdGlvbiBjYW5cclxuLy9zdGFydCBleGVjdXRpbmcuXHJcblxyXG5cdHJ1bjpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuX3Jlc29sdmVyKGZ1bmN0aW9uKGEpe3JldHVybiBhfSlcclxuXHR9XHJcblx0XHJcbiAgICB9Ly8tLVxyXG5cclxuLy9BZGQgYWxpYXNlcyB0byBtYXAgLiBmbGF0IGFzIGZsYXRNYXAgYW5kIG1hcCAuIHRyeUZsYXQgYXMgcGhhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMuZmxhdE1hcCA9IGhlbHBlcnMuZmxhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMucGhhdE1hcCA9IGhlbHBlcnMucGhhdE1hcFxyXG5cclxuLy9BZGQgYSBwcmludCBmdW5jdGlvbiwgdXNlZCBmb3IgZGVidWdnaW5nLlxyXG4gICAgICAgIG1ldGhvZHMucHJpbnQgPSBoZWxwZXJzLnByaW50XHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHRjb25zdCBwcm9taXNlID0gZnVuY3Rpb24ocmVzb2x2ZSl7XHJcblx0XHRpZih0eXBlb2YgcmVzb2x2ZSAhPT0gXCJmdW5jdGlvblwiKXsgcmV0dXJuIG1ldGhvZHMub2YocmVzb2x2ZSkgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG5cclxuXHRcdG9iai5fcmVzb2x2ZXIgPSByZXNvbHZlXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBwcm9taXNlXHJcblx0XHRvYmoucHJvdG90eXBlID0gbWV0aG9kc1xyXG5cdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRyZXR1cm4gb2JqXHJcblx0fVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwcm9taXNlLy8tLVxyXG4iLCJcclxuY29uc3QgZiA9IHJlcXVpcmUoXCIuL2ZcIikvLy0tXHJcblxyXG5jb25zdCBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuXHJcbmNvbnN0IG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy9gb2ZgIGp1c3QgdXNlcyB0aGUgY29uc3RydWN0b3IgYW5kIGRvZXMgbm90IHRvdWNoIHRoZSBzdGF0ZS5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBzdGF0ZSgocHJldlN0YXRlKSA9PiBbaW5wdXQsIHByZXZTdGF0ZV0pXHJcblx0fSxcclxuXHJcbi8vYG1hcGAgaXMgZG9uZSBieSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gdGhlIHZhbHVlIGFuZCBrZWVwaW5nIHRoZSBzdGF0ZSB1bmNoYW5nZWQuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0YXRlKCB0aGlzLl9ydW5TdGF0ZS5tYXAoKFtpbnB1dCwgcHJldlN0YXRlXSkgPT4gW2Z1bmsoaW5wdXQpLCBwcmV2U3RhdGVdKSlcclxuXHR9LFxyXG5cdFxyXG4vL2BmbGF0YCBkb2VzIHRoZSBmb2xsb3dpbmc6XHJcbi8vMS4gUnVucyB0aGUgY29kZSB0aGF0IHdlIGxvYWRlZCBpbiB0aGUgbW9uYWQgc28sIGZhciAodXNpbmcgdGhlIGBydW5gIGZ1bmN0aW9uKS5cclxuLy8yLiBTYXZlcyB0aGUgbmV3IHN0YXRlIG9iamVjdCBhbmQgdGhlIHZhbHVlIHdoaWNoIGlzIGtlcHQgYnkgdGhlIGZ1bmN0aW9ucyBzbyBmYXIuXHJcbi8vMy4gQWZ0ZXIgZG9pbmcgdGhhdCwgaXQgYXJyYW5nZXMgdGhvc2UgdHdvIGNvbXBvbmVudHMgKHRoZSBvYmplY3QgYW5kIHRoZSB2YWx1ZSkgaW50byBhIHlldCBhbm90aGVyXHJcbi8vc3RhdGUgb2JqZWN0LCB3aGljaCBydW5zIHRoZSBtdXRhdG9yIGZ1bmN0aW9uIG9mIHRoZSBmaXJzdCBvYmplY3QsIHdpdGggdGhlIHN0YXRlIHRoYXQgd2UgaGF2ZSBzbywgZmFyXHJcblxyXG5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdC8vRXh0cmFjdCBzdGF0ZSBtdXRhdG9yIGFuZCB2YWx1ZSBcclxuXHRcdGNvbnN0IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSA9IHRoaXMucnVuKClcclxuXHRcdC8vQ29tcG9zZSB0aGUgbXV0YXRvciBhbmQgdGhlIHZhbHVlXHJcblx0XHRyZXR1cm4gc3RhdGUoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdH0sXHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cclxuXHRcdC8vRXh0cmFjdCBjdXJyZW50IHN0YXRlIFxyXG5cdFx0Y29uc3QgW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdID0gdGhpcy5ydW4oKVxyXG5cdFx0XHJcblx0XHQvL0NoZWNrIGlmIGl0IGlzIHJlYWxseSBhIHN0YXRlXHJcblx0XHRpZihzdGF0ZU9iai5jb25zdHJ1Y3RvciA9PT0gc3RhdGUpe1xyXG5cdFx0XHRyZXR1cm4gc3RhdGUoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiBzdGF0ZSgoKSA9PiBbc3RhdGVPYmosIGN1cnJlbnRTdGF0ZV0pXHJcblx0XHR9XHJcblx0fSxcclxuXHJcbi8vV2UgaGF2ZSB0aGUgYHJ1bmAgZnVuY3Rpb24gd2hpY2ggY29tcHV0ZXMgdGhlIHN0YXRlOlxyXG5cclxuXHRydW46ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLl9ydW5TdGF0ZSgpXHJcblx0fSxcclxuLy9BbmQgdGhlIGBzYXZlYCBhbmQgYGxvYWRgIGZ1bmN0aW9ucyBhcmUgZXhhY3RseSB3aGF0IG9uZSB3b3VsZCBleHBlY3RcclxuXHJcblx0bG9hZDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiBzdGF0ZSggKHN0YXRlKSA9PiBbc3RhdGUsIHN0YXRlXSApIClcclxuXHR9LFxyXG5cdHNhdmU6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gc3RhdGUoIChzdGF0ZSkgPT4gW3ZhbHVlLCB2YWx1ZV0gKSApXHJcblx0fSxcclxuXHRsb2FkS2V5OmZ1bmN0aW9uKGtleSl7XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHN0YXRlKCAoc3RhdGUpID0+IFtzdGF0ZVtrZXldLCBzdGF0ZV0gKSApXHJcblx0fSxcclxuXHRzYXZlS2V5OmZ1bmN0aW9uKGtleSl7XHJcblx0XHRjb25zdCB3cml0ZSA9IChvYmosIGtleSwgdmFsKSA9PiB7XHJcblx0XHRcdG9iaiA9IHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgPyAgb2JqIDoge31cclxuXHRcdFx0b2JqW2tleV0gPSB2YWxcclxuXHRcdFx0cmV0dXJuIG9ialxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiBzdGF0ZSggKHN0YXRlKSA9PiBbdmFsdWUsIHdyaXRlKHN0YXRlLCBrZXksIHZhbHVlKV0gKSApXHJcblx0fVxyXG5cdFxyXG4gICAgfS8vLS1cclxuXHJcbi8vQWRkIGFsaWFzZXMgdG8gbWFwIC4gZmxhdCBhcyBmbGF0TWFwIGFuZCBtYXAgLiB0cnlGbGF0IGFzIHBoYXRNYXBcclxuICAgICAgICBtZXRob2RzLmZsYXRNYXAgPSBoZWxwZXJzLmZsYXRNYXBcclxuICAgICAgICBtZXRob2RzLnBoYXRNYXAgPSBoZWxwZXJzLnBoYXRNYXBcclxuXHJcbi8vQWRkIGEgcHJpbnQgZnVuY3Rpb24sIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgICAgICBtZXRob2RzLnByaW50ID0gaGVscGVycy5wcmludFxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIHN0YXRlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHN0YXRlID0gZnVuY3Rpb24ocnVuKXtcclxuXHRcdGlmKHR5cGVvZiBydW4gIT09IFwiZnVuY3Rpb25cIil7IHJldHVybiBtZXRob2RzLm9mKHJ1bikgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG5cdFx0b2JqLl9ydW5TdGF0ZSA9IGYocnVuLDEpXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBzdGF0ZVxyXG5cdFx0b2JqLnByb3RvdHlwZSA9IG1ldGhvZHNcclxuXHRcdE9iamVjdC5mcmVlemUob2JqKVxyXG5cdFx0cmV0dXJuIG9ialxyXG5cdH1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc3RhdGUvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy9UaGUgYG9mYCBtZXRob2QgdGFrZXMgYSB2YWx1ZSBhbmQgd3JhcHMgaXQgaW4gYSBzdHJlYW0sIGJ5IGltbWVkaWF0ZWx5IGNhbGxpbmcgdGhlIHB1c2hlciBmdW5jdGlvbiB3aXRoIGl0LlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24odmFsKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiBwdXNoKHZhbCkgKVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgbWFwYCBtZXRob2QgY3JlYXRlcyBhIG5ldyBzdHJlYW0sIHN1Y2ggdGhhdCBldmVyeSB0aW1lIHRoZSBvbGQgc3RyZWFtIHJlY2VpdmVzIGEgdmFsdWUsIGl0XHJcbi8vYXBwbGllcyBgZnVua2AgdG8gaXQgYW5kIHRoZW4gcHVzaGVzIGl0IHRvIHRoZSBuZXcgc3RyZWFtLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiB0aGlzLl9wdXNoZXIoICh2YWwpID0+IHB1c2goIGZ1bmsodmFsKSApICkgKVxyXG5cclxuXHR9LFxyXG5cclxuXHJcbi8vSW4gdGhpcyBjYXNlIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBgZmxhdGAgaXMgcXVpdGUgc2ltcGxlLlxyXG5cclxuLy9FZmZlY3RpdmVseSBhbGwgd2UgaGF2ZSB0byBkbyBpcyByZXR1cm4gdGhlIHNhbWUgdmFsdWUgd2l0aCB3aGljaCB0aGUgaW5uZXIgc3RyZWFtIGlzIHB1c2hkIHdpdGguXHJcbi8vVG8gZG8gdGhpcywgd2UgdW53cmFwIG91ciBzdHJlYW0gb25jZSB0byBnZXQgdGhlIGlubmVyIHN0cmVhbSB2YWx1ZSwgYW5kIHRoZW4gdW53cmFwIHRoZSBpbm5lclxyXG4vL3N0cmVhbSBpdHNlbGYgdG8gZ2V0IGl0cyB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiBcclxuXHRcdFx0dGhpcy5fcHVzaGVyKFx0KGlubmVyX3N0cmVhbSkgPT4gXHJcblx0XHRcdFx0aW5uZXJfc3RyZWFtLl9wdXNoZXIoKHZhbCkgPT4gcHVzaCh2YWwpKVxyXG5cdFx0XHQpIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgdHJ5RmxhdGAgZnVuY3Rpb24gaXMgYWxtb3N0IHRoZSBzYW1lOlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IFxyXG5cdFx0XHR0aGlzLl9wdXNoZXIoXHQoaW5uZXJfc3RyZWFtKSA9PiB7IFxyXG5cdFx0XHRcdGlmKGlubmVyX3N0cmVhbS5jb25zdHJ1Y3RvciA9PT0gc3RyZWFtKXtcclxuXHRcdFx0XHRcdGlubmVyX3N0cmVhbS5fcHVzaGVyKCh2YWwpID0+IHB1c2godmFsKSlcclxuXHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdHB1c2goaW5uZXJfc3RyZWFtKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGBydW5gIGZ1bmN0aW9uIGp1c3QgZmVlZHMgdGhlIHB1c2hlciB3aXRoIGEgcGxhY2Vob2xkZXIgIGZ1bmN0aW9uIHNvIG91ciBjb21wdXRhdGlvbiBjYW5cclxuLy9zdGFydCBleGVjdXRpbmcuXHJcblxyXG5cdHJ1bjpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuX3B1c2hlcihmdW5jdGlvbihhKXtyZXR1cm4gYX0pXHJcblx0fSxcclxuXHRcclxuLy9BZnRlciB0aGVzZSBhcmUgZG9uZSwgYWxsIHdlIG5lZWQgdG8gZG8gaXMgaW1wbGVtZW50IHRoZSB0cmFkaXRpb25hbCBKUyBhcnJheSBmdW5jdGlvbnNcclxuXHJcbi8vYEZvckVhY2hgIGlzIGFsbW9zdCB0aGUgc2FtZSBhcyBgbWFwYCwgZXhjZXB0IHdlIGRvbid0IHB1c2ggYGZ1bmsodmFsKWAgLSB0aGUgcmVzdWx0IG9mIHRoZSB0cmFuc2Zvcm1hdGlvblxyXG4vL3RvIHRoZSBuZXcgc3RyZWFtLCBidXQgd2UgcHVzaCBgdmFsYCBpbnN0ZWFkLlxyXG5cclxuXHRmb3JFYWNoOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IHRoaXMuX3B1c2hlciggKHZhbCkgPT4geyBcclxuXHRcdFx0cHVzaCh2YWwpIFxyXG5cdFx0XHRmdW5rKHZhbClcclxuXHRcdH0gKSApXHJcblx0fSxcclxuXHJcbi8vV2l0aCBmaWx0ZXIgdGhlIHJlc3VsdCBvZiBgZnVuayh2YWwpYCBzaG93cyB1cyB3aGV0aGVyIHdlIG5lZWQgdG8gcHVzaCB0aGUgdmFsdWVcclxuXHJcblx0ZmlsdGVyOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IHRoaXMuX3B1c2hlciggKHZhbCkgPT4geyBcclxuXHRcdFx0aWYoZnVuayh2YWwpKXtwdXNoKHZhbCl9XHJcblx0XHR9ICkgKVxyXG5cdH0sXHJcblxyXG5cdHJlZHVjZTpmdW5jdGlvbihmdW5rLCBmcm9tKXtcclxuXHRcdGxldCBhY2N1bXVsYXRvciA9IGZyb21cclxuXHRcdHRoaXMuX3B1c2hlcih2YWwgPT4ge1xyXG5cdFx0XHRhY2N1bXVsYXRvciA9IGZ1bmsoYWNjdW11bGF0b3IsIHZhbCkgXHJcblx0XHR9KVxyXG5cdH0sXHJcbn0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBzdHJlYW0gY29uc3RydWN0b3IgaXMgaW1wbGVtZW50ZWRcclxuXHJcblx0Y29uc3Qgc3RyZWFtID0gZnVuY3Rpb24ocHVzaCl7XHJcblx0XHRpZih0eXBlb2YgcHVzaCAhPT0gXCJmdW5jdGlvblwiKXsgcmV0dXJuIG1ldGhvZHMub2YocHVzaCkgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG5cclxuXHRcdG9iai5fcHVzaGVyID0gcHVzaFxyXG5cdFx0b2JqLmNvbnN0cnVjdG9yID0gc3RyZWFtXHJcblx0XHRvYmoucHJvdG90eXBlID0gbWV0aG9kc1xyXG5cdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRyZXR1cm4gb2JqXHJcblx0fVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzdHJlYW1cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBmdW5jdGlvblxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgZnVuY3Rpb24gbW9uYWQgYXVnbWVudHMgc3RhbmRhcmQgSmF2YVNjcmlwdCBmdW5jdGlvbnMgd2l0aCBmYWNpbGl0aWVzIGZvciBjb21wb3NpdGlvbiBhbmQgY3VycnlpbmcuXHJcbjwhLS1tb3JlLS0+XHJcblxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJmdW5jdGlvbnNcIikvLy0tXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIGNvbnN0cnVjdCBmdW5jdGlvbnMgbGluZSB0aGlzXHJcblx0XHJcblx0XHR2YXIgcGx1c18xID0gZiggKG51bSkgPT4gbnVtKzEgKVxyXG5cclxuXHJcbi8vQWZ0ZXIgeW91IGRvIHRoYXQsIHlvdSB3aWxsIHN0aWxsIGJlIGFibGUgdG8gdXNlIGBwbHVzXzFgIGxpa2UgYSBub3JtYWwgZnVuY3Rpb24sIGJ1dCB5b3UgY2FuIGFsc28gZG8gdGhlIGZvbGxvd2luZzpcclxuXHJcblxyXG4vKlxyXG5DdXJyeWluZ1xyXG4tLS0tXHJcbldoZW4geW91IGNhbGwgYSBmdW5jdGlvbiBgZmAgd2l0aCBsZXNzIGFyZ3VtZW50cyB0aGF0IGl0IGFjY2VwdHMsIGl0IHJldHVybnMgYSBwYXJ0aWFsbHkgYXBwbGllZFxyXG4oYm91bmQpIHZlcnNpb24gb2YgaXRzZWxmIHRoYXQgbWF5IGF0IGFueSB0aW1lIGJlIGNhbGxlZCB3aXRoIHRoZSByZXN0IG9mIHRoZSBhcmd1bWVudHMuXHJcbiovXHJcblxyXG5cdFFVbml0LnRlc3QoXCJjdXJyeVwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdGNvbnN0IGFkZDMgPSBmKCAoYSxiLGMpID0+IGErYitjIClcclxuXHRcdFxyXG5cdFx0Y29uc3QgYWRkMiA9IGFkZDMoMClcclxuXHRcdGFzc2VydC5lcXVhbCggYWRkMigxLCAxKSwgMiApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGFkZDIoNSwgNSksIDEwIClcclxuXHJcblx0XHRjb25zdCBwbHVzMTAgPSBhZGQyKDEwKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzMTAoNSksIDE1IClcclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czEwKDEwKSwgMjAgKVxyXG5cclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG5gb2YodmFsdWUpYFxyXG4tLS0tXHJcbklmIGNhbGxlZCB3aXRoIGEgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGl0IGNvbnN0cnVjdHMgYSBmdW5jdGlvbiB0aGF0IGFsd2F5cyByZXR1cm5zIHRoYXQgdmFsdWUuXHJcbklmIGNhbGxlZCB3aXRob3V0IGFyZ3VtZW50cyBpdCByZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGUgYXJndW1lbnRzIGdpdmVuIHRvIGl0LlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJvZlwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdGNvbnN0IHJldHVybnM5ID0gZigpLm9mKDkpXHJcblx0XHRhc3NlcnQuZXF1YWwoIHJldHVybnM5KDMpLCA5IClcclxuXHRcdGFzc2VydC5lcXVhbCggcmV0dXJuczkoXCJhXCIpLCA5IClcclxuXHJcblx0XHRjb25zdCBpZCA9IGYoKS5vZigpXHJcblx0XHRhc3NlcnQuZXF1YWwoIGlkKDMpLCAzIClcclxuXHRcdGFzc2VydC5lcXVhbCggaWQoXCJhXCIpLCBcImFcIiApXHJcblxyXG5cdH0pLy8tLVxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkNyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QsIHRoZW4gY2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnQ6XHJcbiovXHJcblx0UVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdFxyXG4vL1lvdSBjYW4gY3JlYXRlIGEgRnVuY3Rpb24gTW9uYWQgYnkgcGFzc2luZyBhIG5vcm1hbCBKYXZhU2NyaXB0IGZ1bmN0aW9uIHRvIHRoZSBjb25zdHJ1Y3RvciAoeW91IGNhbiB3cml0ZSB0aGUgZnVuY3Rpb24gZGlyZWN0bHkgdGhlcmUpOlxyXG5cdFx0XHJcblx0XHR2YXIgcGx1czEgPSBmKCBudW0gPT4gbnVtKzEgKVxyXG5cclxuXHJcbi8vVGhlbiBtYWtpbmcgYW5vdGhlciBmdW5jdGlvbiBpcyBlYXN5OlxyXG5cclxuXHRcdHZhciBwbHVzMiA9IHBsdXMxLm1hcChwbHVzMSkgXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzMigwKSwgMiApXHJcblx0XHRcclxuXHRcdHZhciBwbHVzNCA9IHBsdXMyLm1hcChwbHVzMilcclxuXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXM0KDEpLCA1IClcclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG5cclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuU2FtZSBhcyBgbWFwYCBleGNlcHQgdGhhdCBpZiBgZnVua2AgcmV0dXJucyBhbm90aGVyIGZ1bmN0aW9uIGl0IHJldHVybnMgYSB0aGlyZCBmdW5jdGlvbiB3aGljaDpcclxuMS4gQ2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGZpcnN0LlxyXG4yLiBDYWxscyBgZnVua2Agd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudFxyXG4zLiBDYWxscyB0aGUgZnVuY3Rpb24gcmV0dXJuZWQgYnkgYGZ1bmtgIHdpdGggdGhlIHNhbWUgYXJndW1lbnQgYW5kIHJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgc2Vjb25kIGNhbGwuXHJcbiovXHJcblx0UVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1lvdSBjYW4gdXNlIGBwaGF0TWFwYCB0byBtb2RlbCBzaW1wbGUgaWYtdGhlbiBzdGF0ZW1lbnRzLiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgdXNlcyBpdCBpbiBjb21iaW5hdGlvbiBvZiB0aGUgY3VycnlpbmcgZnVuY3Rpb25hbGl0eTpcclxuXHRcdFxyXG5cdFx0dmFyIGNvbmNhdCA9IGYoIChzdHIxLCBzdHIyKSA9PiBzdHIxICsgc3RyMilcclxuXHJcblx0XHR2YXIgbWFrZU1lc3NhZ2UgPSBmKHBhcnNlSW50LCAxKVxyXG5cdFx0XHQuZmxhdE1hcCgobnVtKSA9PiBpc05hTihudW0pPyBmKFwiRXJyb3IuIE5vdCBhIG51bWJlclwiKSA6IGNvbmNhdChcIlRoZSBudW1iZXIgaXMgXCIpIClcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMVwiKSwgXCJUaGUgbnVtYmVyIGlzIDFcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIjJcIiksIFwiVGhlIG51bWJlciBpcyAyXCIpXHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCJZXCIpLCBcIkVycm9yLiBOb3QgYSBudW1iZXJcIilcclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcGAgaXMgc2ltaWxhciB0byB0aGUgYD4+PWAgZnVuY3Rpb24gaW4gSGFza2VsbCwgd2hpY2ggaXMgdGhlIGJ1aWxkaW5nIGJsb2NrIG9mIHRoZSBpbmZhbW91cyBgZG9gIG5vdGF0aW9uXHJcbkl0IGNhbiBiZSB1c2VkIHRvIHdyaXRlIHByb2dyYW1zIHdpdGhvdXQgdXNpbmcgYXNzaWdubWVudC5cdFxyXG5cclxuRm9yIGV4YW1wbGUgaWYgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIGZ1bmN0aW9uIGluIEhhc2tlbGw6XHJcblxyXG5cdFx0YWRkU3R1ZmYgPSBkbyAgXHJcblx0XHRcdGEgPC0gKCoyKSAgXHJcblx0XHRcdGIgPC0gKCsxMCkgIFxyXG5cdFx0XHRyZXR1cm4gKGErYilcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGFkZFN0dWZmKDMpLCAxOSlcclxuXHJcblxyXG5XaGVuIHdlIGRlc3VnYXIgaXQsIHRoaXMgYmVjb21lczpcclxuXHJcblx0XHRhZGRTdHVmZiA9ICgqMikgPj49IFxcYSAtPlxyXG5cdFx0XHRcdCgrMTApID4+PSBcXGIgLT5cclxuXHRcdFx0XHRcdHJldHVybiAoYStiKVxyXG5cclxub3IgaW4gSmF2YVNjcmlwdCB0ZXJtczpcclxuXHJcbiovXHJcblxyXG5cdFx0dmFyIGFkZFN0dWZmID0gZiggbnVtID0+IG51bSAqIDIgKVxyXG5cdFx0XHQuZmxhdE1hcCggYSA9PiBmKCBudW0gPT4gbnVtICsgMTAgKVxyXG5cdFx0XHRcdC5mbGF0TWFwKCBiID0+IGYub2YoYSArIGIpICkgXHJcblx0XHRcdClcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGFkZFN0dWZmKDMpLCAxOSlcclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IGxpc3QgXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgbGlzdGAgdHlwZSwgYXVnbWVudHMgdGhlIHN0YW5kYXJkIEphdmFTY3JpcHQgYXJyYXlzLCBtYWtpbmcgdGhlbSBpbW11dGFibGUgYW5kIGFkZGluZyBhZGRpdGlvbmFsIGZ1bmN0aW9uYWxpdHkgdG8gdGhlbVxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiTGlzdFwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBsaXN0YCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBsaXN0ID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbGlzdFwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjcmVhdGUgYSBgbGlzdGAgZnJvbSBhcnJheSBsaWtlIHRoaXNcclxuXHRcdHZhciBteV9saXN0ID0gbGlzdChbMSwyLDNdKVxyXG4vL29yIGxpa2UgdGhpczpcclxuXHRcdHZhciBteV9saXN0ID0gbGlzdCgxLDIsMylcclxuXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuU3RhbmRhcmQgYXJyYXkgbWV0aG9kLiBFeGVjdXRlcyBgZnVua2AgZm9yIGVhY2ggb2YgdGhlIHZhbHVlcyBpbiB0aGUgbGlzdCBhbmQgd3JhcHMgdGhlIHJlc3VsdCBpbiBhIG5ldyBsaXN0LlxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0dmFyIHBlb3BsZSA9IGxpc3QoIHtuYW1lOlwiam9oblwiLCBhZ2U6MjQsIG9jY3VwYXRpb246XCJmYXJtZXJcIn0sIHtuYW1lOlwiY2hhcmxpZVwiLCBhZ2U6MjIsIG9jY3VwYXRpb246XCJwbHVtYmVyXCJ9KVxyXG5cdHZhciBuYW1lcyA9IHBlb3BsZS5tYXAoKHBlcnNvbikgPT4gcGVyc29uLm5hbWUgKVxyXG5cdGFzc2VydC5kZWVwRXF1YWwobmFtZXMsIFtcImpvaG5cIiwgXCJjaGFybGllXCJdKVxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgLCBidXQgaWYgYGZ1bmtgIHJldHVybnMgYSBsaXN0IG9yIGFuIGFycmF5IGl0IGZsYXR0ZW5zIHRoZSByZXN1bHRzIGludG8gb25lIGFycmF5XHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJmbGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFxyXG5cdHZhciBvY2N1cGF0aW9ucyA9IGxpc3QoWyBcclxuXHRcdHtvY2N1cGF0aW9uOlwiZmFybWVyXCIsIHBlb3BsZTpbXCJqb2huXCIsIFwic2FtXCIsIFwiY2hhcmxpZVwiXSB9LFxyXG5cdFx0e29jY3VwYXRpb246XCJwbHVtYmVyXCIsIHBlb3BsZTpbXCJsaXNhXCIsIFwic2FuZHJhXCJdIH0sXHJcblx0XSlcclxuXHRcclxuXHR2YXIgcGVvcGxlID0gb2NjdXBhdGlvbnMucGhhdE1hcCgob2NjdXBhdGlvbikgPT4gb2NjdXBhdGlvbi5wZW9wbGUpXHJcblx0YXNzZXJ0LmRlZXBFcXVhbChwZW9wbGUsW1wiam9oblwiLCBcInNhbVwiLCBcImNoYXJsaWVcIiwgXCJsaXNhXCIsIFwic2FuZHJhXCJdKVxyXG5cclxufSkvLy0tXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcblxyXG4iLCJ2YXIgbWF5YmVUID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbWF5YmVUXCIpXHJcbnZhciBsaXN0ID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbGlzdFwiKVxyXG5cclxuUVVuaXQubW9kdWxlKFwibWF5YmVUXCIpXHJcblxyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4gICAgY29uc3QgbWF5YmVMaXN0ID0gbWF5YmVUKGxpc3QoMSwyLDMpKVxyXG4gICAgYXNzZXJ0LmV4cGVjdCgxKVxyXG4gICAgYXNzZXJ0LmRlZXBFcXVhbChtYXliZVQobGlzdCh7YTpcImJcIn0sIHthOlwiY1wifSkpLmdldChcImFcIikuX3ZhbHVlLl92YWx1ZSwgW1wiYlwiLCBcImNcIl0pXHJcbn0pXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogbWF5YmVcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBtYXliZWAgdHlwZSwgYWxzbyBrbm93biBhcyBgb3B0aW9uYCB0eXBlIGlzIGEgY29udGFpbmVyIGZvciBhIHZhbHVlIHRoYXQgbWF5IG5vdCBiZSB0aGVyZS4gXHJcblxyXG5UaGUgcHVycG9zZSBvZiB0aGlzIG1vbmFkIGlzIHRvIGVsaW1pbmF0ZSB0aGUgbmVlZCBmb3Igd3JpdGluZyBgbnVsbGAgY2hlY2tzLiBcclxuRnVydGhlcm1vcmUgaXQgYWxzbyBlbGltaW5hdGVzIHRoZSBwb3NzaWJpbGl0eSBvZiBtYWtpbmcgZXJyb3JzIGJ5IG1pc3NpbmcgbnVsbC1jaGVja3MuXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJNYXliZVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBtYXliZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbWF5YmUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byB3cmFwIGEgdmFsdWUgaW4gYG1heWJlYCB3aXRoOlxyXG5cdFx0dmFyIHZhbCA9IDQvLy0tXHJcblx0XHR2YXIgbWF5YmVfdmFsID0gbWF5YmUodmFsKVxyXG5cclxuLy9JZiB0aGUgJ3ZhbCcgaXMgZXF1YWwgdG8gKnVuZGVmaW5lZCogaXQgdGhyZWF0cyB0aGUgY29udGFpbmVyIGFzIGVtcHR5LlxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5FeGVjdXRlcyBgZnVua2Agd2l0aCB0aGUgYG1heWJlYCdzIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBidXQgb25seSBpZiB0aGUgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gKnVuZGVmaW5lZCosIGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IG1heWJlLlxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1RyYWRpdGlvbmFsbHksIGlmIHdlIGhhdmUgYSB2YWx1ZSB0aGF0IG1heSBiZSB1bmRlZmluZWQgd2UgZG8gYSBudWxsIGNoZWNrIGJlZm9yZSBkb2luZyBzb21ldGhpbmcgd2l0aCBpdDpcclxuXHJcblx0dmFyIG9iaiA9IHt9Ly8tLVxyXG5cdHZhciBnZXRfcHJvcGVydHkgPSBmKChvYmplY3QpID0+IG9iamVjdC5wcm9wZXJ0eSkvLy0tXHJcblx0XHJcblx0dmFyIHZhbCA9IGdldF9wcm9wZXJ0eShvYmopXHJcblx0XHJcblx0aWYodmFsICE9PSB1bmRlZmluZWQpe1xyXG5cdFx0dmFsID0gdmFsLnRvU3RyaW5nKClcclxuXHR9XHJcblx0YXNzZXJ0LmVxdWFsKHZhbCwgdW5kZWZpbmVkKSBcclxuXHJcbi8vV2l0aCBgbWFwYCB0aGlzIGNhbiBiZSB3cml0dGVuIGxpa2UgdGhpc1xyXG5cclxuIFx0dmFyIG1heWJlX2dldF9wcm9wZXJ0eSA9IGdldF9wcm9wZXJ0eS5tYXAobWF5YmUpXHJcblxyXG5cdG1heWJlX2dldF9wcm9wZXJ0eShvYmopLm1hcCgodmFsKSA9PiB7XHJcblx0XHRhc3NlcnQub2soZmFsc2UpLy8tLVxyXG5cdFx0dmFsLnRvU3RyaW5nKCkvL3RoaXMgaXMgbm90IGV4ZWN1dGVkXHJcblx0fSlcclxuXHJcbi8vVGhlIGJpZ2dlc3QgYmVuZWZpdCB3ZSBnZXQgaXMgdGhhdCBpbiB0aGUgZmlyc3QgY2FzZSB3ZSBjYW4gZWFzaWx5IGZvcmdldCB0aGUgbnVsbCBjaGVjazpcclxuXHRcclxuXHRhc3NlcnQudGhyb3dzKGZ1bmN0aW9uKCl7XHJcblx0XHRnZXRfcHJvcGVydHkob2JqKS50b1N0cmluZygpICAvL3RoaXMgYmxvd3MgdXBcclxuXHR9KVxyXG5cclxuLy9XaGlsZSBpbiB0aGUgc2Vjb25kIGNhc2Ugd2UgY2Fubm90IGFjY2VzcyB0aGUgdW5kZXJseWluZyB2YWx1ZSBkaXJlY3RseSwgYW5kIHRoZXJlZm9yZSBjYW5ub3QgZXhlY3V0ZSBhbiBhY3Rpb24gb24gaXQsIGlmIGl0IGlzIG5vdCB0aGVyZS5cclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuXHJcblNhbWUgYXMgYG1hcGAsIGJ1dCBpZiBgZnVua2AgcmV0dXJucyBhIGBtYXliZWAgaXQgZmxhdHRlbnMgdGhlIHR3byBgbWF5YmVzYCBpbnRvIG9uZS5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL2BtYXBgIHdvcmtzIGZpbmUgZm9yIGVsaW1pbmF0aW5nIGVycm9ycywgYnV0IGl0IGRvZXMgbm90IHNvbHZlIG9uZSBvZiB0aGUgbW9zdCBhbm5veWluZyBwcm9ibGVtcyB3aXRoIG51bGwtY2hlY2tzIC0gbmVzdGluZzpcclxuXHJcblx0dmFyIG9iaiA9IHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWxcIiB9IH1cclxuXHRcclxuXHRtYXliZShvYmopXHJcblx0XHQubWFwKCByb290ID0+IG1heWJlKHJvb3QuZmlyc3QpKVxyXG5cdFx0Lm1hcCggbWF5YmVGaXJzdCA9PiBtYXliZUZpcnN0Lm1hcCAoZmlyc3QgPT4gbWF5YmUgKG1heWJlRmlyc3Quc2Vjb25kICkgKSApIFxyXG5cdFx0Lm1hcCggbWF5YmVNYXliZVZhbHVlID0+IG1heWJlTWF5YmVWYWx1ZS5tYXAgKG1heWJlVmFsdWUgPT4gbWF5YmVWYWx1ZS5tYXAoICh2YWx1ZSk9PiggYXNzZXJ0LmVxdWFsKCB2YWwsIFwidmFsXCIpICkgKSApIClcclxuXHJcbi8vYHBoYXRNYXBgIGRvZXMgdGhlIGZsYXR0ZW5pbmcgZm9yIHVzLCBhbmQgYWxsb3dzIHVzIHRvIHdyaXRlIGNvZGUgbGlrZSB0aGlzXHJcblxyXG5cdG1heWJlKG9iailcclxuXHRcdC5mbGF0TWFwKHJvb3QgPT4gbWF5YmUocm9vdC5maXJzdCkpXHJcblx0XHQuZmxhdE1hcChmaXJzdCA9PiBtYXliZShmaXJzdC5zZWNvbmQpKVxyXG5cdFx0LmZsYXRNYXAodmFsID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKHZhbCwgXCJ2YWxcIilcclxuXHRcdH0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbkFkdmFuY2VkIFVzYWdlXHJcbi0tLS1cclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJhZHZhbmNlZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuLy8gYG1heWJlYCBjYW4gYmUgdXNlZCB3aXRoIHRoZSBmdW5jdGlvbiBtb25hZCB0byBlZmZlY3RpdmVseSBwcm9kdWNlICdzYWZlJyB2ZXJzaW9ucyBvZiBmdW5jdGlvbnNcclxuXHJcblx0dmFyIGdldCA9IGYoKHByb3AsIG9iaikgPT4gb2JqW3Byb3BdKVxyXG5cdHZhciBtYXliZUdldCA9IGdldC5tYXAobWF5YmUpXHJcblxyXG4vL1RoaXMgY29tYmluZWQgd2l0aCB0aGUgdXNlIG9mIGN1cnJ5aW5nIG1ha2VzIGZvciBhIHZlcnkgZmx1ZW50IHN0eWxlIG9mIGNvZGluZzpcclxuXHJcblx0dmFyIGdldEZpcnN0U2Vjb25kID0gKHJvb3QpID0+IG1heWJlKHJvb3QpLnBoYXRNYXAobWF5YmVHZXQoJ2ZpcnN0JykpLnBoYXRNYXAobWF5YmVHZXQoJ3NlY29uZCcpKVxyXG5cdFxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ2YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwib3RoZXJfdmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwib3RoZXJfdmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDogXCJcIiB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIndoYXRldmVyXCIpICkvL3dvbid0IGJlIGV4ZWN1dGVkIFxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBwcm9taXNlIFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHByb21pc2VgIHR5cGUsIGFsc28ga25vd24gYXMgYGZ1dHVyZWAgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgd2hpY2ggd2lsbCBiZSByZXNvbHZlZCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUsIFxyXG52aWEgYW4gYXN5bmNocm9ub3VzIG9wZXJhdGlvbi4gXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJQcm9taXNlXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYHByb21pc2VgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdHZhciBwcm9taXNlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvcHJvbWlzZVwiKVxyXG5cdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UbyBjcmVhdGUgYSBgcHJvbWlzZWAgcGFzcyBhIGZ1bmN0aW9uIHdoaWNoIGFjY2VwdHMgYSBjYWxsYmFjayBhbmQgY2FsbHMgdGhhdCBjYWxsYmFjayB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWU6XHJcblxyXG5cdHZhciBteV9wcm9taXNlID0gcHJvbWlzZSggKHJlc29sdmUpID0+ICBcclxuXHRcdHNldFRpbWVvdXQoKCkgPT4geyByZXNvbHZlKDUpIH0sMTAwMCkgIFxyXG5cdClcclxuXHJcbi8vIEluIG1vc3QgY2FzZXMgeW91IHdpbGwgYmUgY3JlYXRpbmcgcHJvbWlzZXMgdXNpbmcgaGVscGVyIGZ1bmN0aW9ucyBsaWtlOlxyXG5cclxuXHRjb25zdCBnZXRVcmwgPSAodXJsKSA9PiBwcm9taXNlKCAocmVzb2x2ZSkgPT4ge1xyXG5cdCAgY29uc3QgcnEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxyXG4gIFx0ICBycS5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKEpTT04ucGFyc2UocnEucmVzcG9uc2VUZXh0KSlcclxuXHQgIHJxLm9wZW4oXCJHRVRcIix1cmwsdHJ1ZSk7XHJcblx0ICBycS5zZW5kKCk7XHJcblx0fSlcclxuLypcclxuYHJ1bigpYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIHRoZSBwcm9taXNlIGFuZCBmZXRjaGVzIHRoZSBkYXRhLlxyXG5cclxuKioqXHJcbkZvciBleGFtcGxlIHRvIG1ha2UgYSBwcm9taXNlIGFuZCBydW4gaXQgaW1tZWRpYXRlbHkgZG86XHJcbiovXHJcblx0Z2V0VXJsKFwicGVvcGxlLmpzb25cIikucnVuKClcclxuXHQvL1tcclxuXHQvLyAgeyBcIm5hbWVcIjpcImpvaG5cIiwgXCJvY2N1cGF0aW9uXCI6XCJwcm9ncmFtbWVyXCJ9LFxyXG4gXHQvLyAge1wibmFtZVwiOlwiamVuXCIsIFwib2NjdXBhdGlvblwiOlwiYWRtaW5cIn1cclxuXHQvL11cclxuXHJcblx0Z2V0VXJsKFwib2NjdXBhdGlvbnMuanNvblwiKS5ydW4oKVxyXG5cdC8ve1xyXG5cdC8vICBcInByb2dyYW1tZXJcIjogXCJ3cml0ZXMgY29kZVwiXHJcblx0Ly8gIFwiYWRtaW5cIjogXCJtYW5hZ2VzIGluZnJhc3RydWN0dXJlXCJcclxuXHQvL31cclxuXHJcbi8qXHJcbi8vTm90ZSB0aGF0IHdlIHdpbGwgYmUgdXNpbmcgdGhlIGRhdGEgZnJvbSB0aGVzZSB0d28gZmlsZXMgaW4gdGhlIG5leHQgZXhhbXBsZXMuIFxyXG5cclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5SZXR1cm5zIGEgbmV3IHByb21pc2UsIHdoaWNoIGFwcGxpZXMgYGZ1bmtgIHRvIHRoZSBkYXRhIHdoZW4geW91IHJ1biBpdC5cclxuXHJcbioqKlxyXG5UaGUgZnVuY3Rpb24gY2FuIGJlIHVzZWQgYm90aCBmb3IgbWFuaXB1bGF0aW5nIHRoZSBkYXRhIHlvdSBmZXRjaCBhbmQgZm9yIHJ1bm5pbmcgc2lkZSBlZmZlY3RzICBcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Y29uc3Qgc3RvcCA9IGFzc2VydC5hc3luYygpLy8tLVxyXG5cdGdldFVybChcInBlb3BsZS5qc29uXCIpXHJcblx0ICBcclxuXHQgIC8vVXNpbmcgXCJtYXBcIiBmb3IgbWFuaXB1bGF0aW5nIGRhdGFcclxuXHQgIC5tYXAoKHBlb3BsZSkgPT4gcGVvcGxlLm1hcCgocGVyc29uKSA9PiBwZXJzb24ubmFtZSkpXHJcblxyXG5cdCAgLy9Vc2luZyBcIm1hcFwiIGZvciB0cmlnZ2VyaW5nIHNpZGUgZWZmZWN0cyBcclxuXHQgIC5tYXAobmFtZXMgPT4ge1xyXG5cdCAgICBhc3NlcnQuZGVlcEVxdWFsKG5hbWVzLCBbJ2pvaG4nLCAnamVuJ10pXHJcblx0ICAgIHN0b3AoKS8vLS1cclxuXHQgIH0pLnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcbkEgbW9yZSBwb3dlcmZ1bCB2ZXJzaW9uIG9mIGBtYXBgIHdoaWNoIGNhbiBhbGxvd3MgeW91IHRvIGNoYWluIHNldmVyYWwgc3RlcHMgb2YgdGhlIGFzeWNocm9ub3VzIGNvbXB1dGF0aW9ucyB0b2dldGhlci5cclxuS25vd24gYXMgYHRoZW5gIGZvciB0cmFkaXRpb25hbCBwcm9taXNlIGxpYnJhcmllcy5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Y29uc3QgZG9uZSA9IGFzc2VydC5hc3luYygpLy8tLVx0XHJcblxyXG4vL0ZvciBleGFtcGxlIGhlcmUgaXMgYSBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgYSBwZXJzb24ncyBvY2N1cGF0aW9uIGZyb20gdGhlIGBwZW9wbGUuanNvbmAgZmlsZVxyXG4vL2FuZCB0aGVuIHJldHJpZXZlcyB0aGUgb2NjdXBhdGlvbidzIGRlc2NyaXB0aW9uIGZyb20gYG9jY3VwYXRpb25zLmpzb25gLiBcclxuXHJcblx0Y29uc3QgZ2V0T2NjdXBhdGlvbkRlc2NyaXB0aW9uID0gKG5hbWUpID0+IGdldFVybChcInBlb3BsZS5qc29uXCIpXHJcblxyXG5cdCAgLy9SZXRyaWV2ZSBwZXJzb24gZGF0YVxyXG5cdCAgLnBoYXRNYXAoKHBlb3BsZSkgPT4gcGVvcGxlLmZpbHRlciggcGVyc29uID0+IHBlcnNvbi5uYW1lID09PSBuYW1lIClbMF0pXHJcblxyXG5cdCAgLy9SZXRyaWV2ZSBpdHMgb2NjdXBhdGlvblxyXG5cdCAgLnBoYXRNYXAoIChwZXJzb24pID0+IGdldFVybChcIm9jY3VwYXRpb25zLmpzb25cIilcclxuXHQgICAgLm1hcChvY2N1cGF0aW9ucyA9PiBvY2N1cGF0aW9uc1twZXJzb24ub2NjdXBhdGlvbl0pIClcclxuXHJcbi8vSGVyZSBpcyBob3cgdGhlIGZ1bmN0aW9uIGlzIHVzZWQ6XHJcblxyXG5cdGdldE9jY3VwYXRpb25EZXNjcmlwdGlvbihcImpvaG5cIikubWFwKChkZXNjKSA9PiB7IFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGRlc2MsIFwid3JpdGVzIGNvZGVcIikgXHJcblx0XHRkb25lKCkvLy0tXHJcblx0fSkucnVuKClcclxuXHRcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IHN0YXRlXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgc3RhdGVgIHR5cGUsIGlzIGEgY29udGFpbmVyIHdoaWNoIGVuY2Fwc3VsYXRlcyBhIHN0YXRlZnVsIGZ1bmN0aW9uLiBJdCBiYXNpY2FsbHkgYWxsb3dzIHlvdSB0byBjb21wb3NlIGZ1bmN0aW9ucyxcclxubGlrZSB5b3UgY2FuIGRvIHdpdGggdGhlIGBmYCB0eXBlLCBleGNlcHQgd2l0aCBpdCBhbnkgZnVuY3Rpb24gY2FuIGFjY2VzcyBhbiBhZGRpdGlvbmFsIFwidmFyaWFibGVcIiBiZXNpZGVzIGl0c1xyXG5pbnB1dCBhcmd1bWVudChzKSAtIHRoZSBzdGF0ZS4gXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJTdGF0ZVwiKS8vLS1cclxuXHJcbi8vVG8gdXNlIHRoZSBgc3RhdGVgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIHN0YXRlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvc3RhdGVcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9JbiB0aGUgY29udGV4dCBvZiB0aGlzIHR5cGUgYSBzdGF0ZSBpcyByZXByZXNlbnRlZCBieSBhIGZ1bmN0aW9uIHRoYXQgYWNjZXB0cyBhIHN0YXRlIFxyXG4vL2FuZCByZXR1cm5zIGEgbGlzdCB3aGljaCBjb250YWlucyBhIHZhbHVlIGFuZCBhIG5ldyBzdGF0ZS4gU28gZm9yIGV4YW1wbGU6XHJcblxyXG5cdHN0YXRlKCh2YWwpID0+IFt2YWwrMSwgdmFsXSlcclxuXHJcbi8vQ3JlYXRlcyBhIG5ldyBzdGF0ZWZ1bCBjb21wdXRhdGlvbiB3aGljaCBpbmNyZW1lbnRzIHRoZSBpbnB1dCBhcmd1bWVudCBhbmQgdGhlbiBzYXZlcyBpdCBpbiB0aGUgc3RhdGUuXHJcblxyXG5cclxuLypcclxuYG9mKHZhbHVlKWBcclxuLS0tLVxyXG5BY2NlcHRzIGEgdmFsdWUgYW5kIHdyYXBzIGluIGEgc3RhdGUgY29udGFpbmVyXHJcbiovXHJcblx0UVVuaXQudGVzdChcIm9mXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0YXNzZXJ0LmV4cGVjdCgwKS8vLS1cclxuXHRcdGNvbnN0IHN0YXRlNSA9IHN0YXRlKCkub2YoNSlcclxuXHR9KS8vLS1cclxuXHJcbi8vTm90ZSB0aGF0IHRoZSBmb2xsb3dpbmcgY29kZSBkb2VzIG5vdCBwdXQgYDVgIGluIHRoZSBzdGF0ZS5cclxuLy9SYXRoZXIgaXQgY3JlYXRlcyBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYDVgIGFuZCBkb2VzIG5vdCBpbnRlcmFjdCB3aXRoIHRoZSBzdGF0ZS4gXHJcblxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5FeGVjdXRlcyBgZnVua2Agd2l0aCB0aGUgZW5jYXBzdWxhdGVkIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBhbmQgd3JhcHMgdGhlIHJlc3VsdCBpbiBhIG5ldyBgc3RhdGVgIG9iamVjdCwgXHJcbndpdGhvdXQgYWNjZXNzaW5nIHRoZSBzdGF0ZVxyXG5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9PbmUgb2YgdGhlIG1haW4gYmVuZWZpdHMgb2YgdGhlIGBzdGF0ZWAgdHlwZXMgaXMgdGhhdCBpdCBhbGxvd3MgeW91IHRvIG1peCBwdXJlIGZ1bmN0aW9ucyB3aXRoIHVucHVyZSBvbmVzLCBcclxuLy9JbiB0aGUgc2FtZSB3YXkgdGhhdCBwcm9taXNlcyBhbGxvdyB1cyB0byBtaXggYXN5Y2hyb25vdXMgZnVuY3Rpb25zIHdpdGggc3luY2hyb25vdXMgb25lcy5cclxuLy9NYXAgYWxsb3dzIHVzIHRvIGFwcGx5IGFueSBmdW5jdGlvbiBvbiBvdXIgdmFsdWUgYW5kIHRvIGNvbnN1bWUgdGhlIHJlc3VsdCBpbiBhbm90aGVyIGZ1bmN0aW9uLlxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKDUpXHJcblx0XHQubWFwKCh2YWwpID0+IHZhbCsxKVxyXG5cdFx0Lm1hcCgodmFsKSA9PiB7XHJcblx0XHRcdGFzc2VydC5lcXVhbCh2YWwsIDYpXHJcblx0XHRcdHJldHVybiB2YWwgKiAyXHJcblx0XHR9KVxyXG5cdFx0Lm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLCAxMikpXHJcblx0XHQucnVuKClcclxufSkvLy0tXHJcblxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAsIGV4Y2VwdCB0aGF0IGlmIGBmdW5rYCByZXR1cm5zIGEgbmV3IHN0YXRlIG9iamVjdCBpdCBtZXJnZXMgdGhlIHR3byBzdGF0ZXMgaW50byBvbmUuXHJcblRodXMgYGZsYXRNYXBgIHNpbXVsYXRlcyBtYW5pcHVsYXRpb24gb2YgbXV0YWJsZSBzdGF0ZS5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwicGhhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vRm9yIGV4YW1wbGUsIGhlcmUgaXMgYSBmdW5jdGlvbiB0aGF0IFxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKFwidmFsdWVcIilcclxuXHRcdC8vV3JpdGUgdGhlIHZhbHVlIGluIHRoZSBzdGF0ZVxyXG5cdFx0LnBoYXRNYXAoIHZhbHVlID0+IHN0YXRlKCBfID0+IFtcIm5ldyBcIit2YWx1ZSAsIFwiaW5pdGlhbCBcIit2YWx1ZV0pIClcclxuXHJcblx0XHQvL21hbmlwdWxhdGUgdGhlIHZhbHVlXHJcblx0XHQucGhhdE1hcCggdmFsID0+IHZhbC50b1VwcGVyQ2FzZSgpLnNwbGl0KFwiXCIpLmpvaW4oXCItXCIpIClcclxuXHRcdFxyXG5cdFx0Ly9XZSBjYW4gYWNjZXNzIHRoZSBzdGF0ZSBhdCBhbnkgdGltZS5cclxuXHRcdC5waGF0TWFwKCB2YWwgPT4gc3RhdGUoc3QgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwoIHZhbCwgXCJOLUUtVy0gLVYtQS1MLVUtRVwiKVxyXG5cdFx0XHRhc3NlcnQuZXF1YWwoIHN0LCBcImluaXRpYWwgdmFsdWVcIilcclxuXHRcdH0pKS5ydW4oKVxyXG59KS8vLS1cclxuXHJcbi8qXHJcblxyXG5gc2F2ZSgpIC8gbG9hZCgpYFxyXG4tLS0tXHJcblNob3J0aGFuZHMgZm9yIHRoZSBtb3N0IGNvbW1vbiBzdGF0ZSBvcGVyYXRpb25zOiBcclxuLSBgc2F2ZWAgY29waWVzIHRoZSBjdXJyZW50bHkgZW5jYXBzdWxhdGVkIHZhbHVlIGludG8gdGhlIHN0YXRlXHJcbi0gYGxvYWRgIGp1c3QgcmV0dXJucyB0aGUgY3VycmVudCBzdGF0ZVxyXG4qKipcclxuKi9cclxuXHJcblxyXG5RVW5pdC50ZXN0KFwic2F2ZS9sb2FkXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKDUpXHJcblx0LnBoYXRNYXAoICh2YWwpID0+IHZhbCsxICkgLy82XHJcblx0LnNhdmVLZXkoXCJzdDFcIilcclxuXHRcclxuXHQucGhhdE1hcCggKHZhbCkgPT4gdmFsKjIgKS8vMTJcclxuXHQuc2F2ZUtleShcInN0MlwiKVxyXG5cdFxyXG5cdC5sb2FkKClcclxuXHQubWFwKCAoc3RhdGUpID0+IHtcclxuXHRcdGFzc2VydC5lcXVhbChzdGF0ZS5zdDEsIDYpXHJcblx0XHRhc3NlcnQuZXF1YWwoc3RhdGUuc3QyLCAxMilcclxuXHR9KS5ydW4oKVxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcblxyXG5cclxuIiwiXHJcbi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogc3RyZWFtIFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHN0cmVhbWAgdHlwZSwgYWxzbyBrbm93biBhcyBhIGxhenkgbGlzdCBpcyBhIGNvbnRhaW5lciBmb3IgYSBsaXN0IG9mIHZhbHVlcyB3aGljaCBjb21lIGFzeW5jaHJvbm91c2x5LlxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwic3RyZWFtXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYHN0cmVhbWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0dmFyIHN0cmVhbSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0cmVhbVwiKVxyXG5cdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UbyBjcmVhdGUgYSBgc3RyZWFtYCBwYXNzIGEgZnVuY3Rpb24gd2hpY2ggYWNjZXB0cyBhIGNhbGxiYWNrIGFuZCBjYWxscyB0aGF0IGNhbGxiYWNrIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZTpcclxuXHJcblx0Y29uc3QgY2xpY2tTdHJlYW0gPSBzdHJlYW0oIChwdXNoKSA9PiB7IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcHVzaCl9KVxyXG5cdHdpbmRvdy5jbGlja1N0cmVhbSA9IGNsaWNrU3RyZWFtXHJcblxyXG4vLyBMaWtlIHByb21pc2VzLCBzdHJlYW1zIGFyZSBhbHNvIGNyZWF0ZWQgd2l0aCBhIGhlbHBlclxyXG5cclxuXHRjb25zdCBjb3VudFRvID0gKHJhbmdlKSA9PiBzdHJlYW0oIChwdXNoKSA9PiB7XHJcblx0XHRmb3IgKGxldCBpID0gMTsgaTw9IHJhbmdlOyBpKyspe1xyXG5cdFx0XHRwdXNoKGkpXHJcblx0XHR9XHJcblx0fSlcclxuLypcclxuYHJ1bigpYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIHRoZSBzdHJlYW0gYW5kIGZldGNoZXMgdGhlIGRhdGEuXHJcblxyXG4qKipcclxuXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuUmV0dXJucyBhIG5ldyBzdHJlYW0sIHdoaWNoIGFwcGxpZXMgYGZ1bmtgIHRvIHRoZSBkYXRhIHdoZW4geW91IHJ1biBpdC5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRjb25zdCBzdG9wID0gYXNzZXJ0LmFzeW5jKCkvLy0tXHJcblx0dmFyIHB1c2hUb1N0cmVhbSA9IHVuZGVmaW5lZFxyXG5cdGNvbnN0IG15U3RyZWFtID0gc3RyZWFtKHB1c2ggPT57IHB1c2hUb1N0cmVhbSA9IHB1c2h9KVxyXG5cdFx0Lm1hcCh2YWwgPT4gdmFsKjIpXHJcblx0XHQubWFwKHZhbCA9PiBhc3NlcnQuZXF1YWwodmFsLCAxMCkpXHJcblx0XHQucnVuKClcclxuXHRcclxuXHRwdXNoVG9TdHJlYW0oNSlcclxuXHRzdG9wKClcclxufSkvLy0tXHJcblxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuQSBtb3JlIHBvd2VyZnVsIHZlcnNpb24gb2YgYG1hcGAgd2hpY2ggY2FuIGFsbG93cyB5b3UgdG8gY2hhaW4gc2V2ZXJhbCBzdGVwcyBvZiB0aGUgYXN5Y2hyb25vdXMgY29tcHV0YXRpb25zIHRvZ2V0aGVyLlxyXG5Lbm93biBhcyBgdGhlbmAgZm9yIHRyYWRpdGlvbmFsIHN0cmVhbSBsaWJyYXJpZXMuXHJcblxyXG4qKipcclxuKi9cclxuXHJcbi8vUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Ly9jb25zdCBkb25lID0gYXNzZXJ0LmFzeW5jKCkvLy0tXHRcclxuLy99KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuIl19
