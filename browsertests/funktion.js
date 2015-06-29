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

var listMethods = helpers.add_missing_methods({ //--

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

});

//Some functions are directly lifted from the Array prototype

var immutableFunctions = ["map", "concat"];

immutableFunctions.forEach(function (funk) {
	listMethods[funk] = function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return list(Array.prototype[funk].apply(this, args));
	};
});

//The type also wraps some Array functions in a way that makes them immutable

var mutableFunctions = ["splice", "reverse", "sort"];

mutableFunctions.forEach(function (funk) {
	listMethods[funk] = function () {
		for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			args[_key2] = arguments[_key2];
		}

		var newArray = this.slice(0);
		Array.prototype[funk].apply(newArray, args);
		return newArray;
	};
});

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
		return Object.freeze(extend(args[0], listMethods))
		//Accept several arguments
		;
	} else {
		return Object.freeze(extend(args, listMethods));
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
		return maybe(this._value[prop]);
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
"use strict";

var helpers = require("./helpers"); //--
var streamProto = helpers.add_missing_methods({ //--

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
	} }); //--

//In case you are interested, here is how the stream constructor is implemented

var stream = function stream(push) {
	if (typeof push !== "function") {
		return streamProto.of(push);
	}
	var obj = Object.create(streamProto);

	obj._pusher = push;
	obj.constructor = stream;
	obj.prototype = streamProto;
	Object.freeze(obj);
	return obj;
};

module.exports = stream;

},{"./helpers":2}],8:[function(require,module,exports){
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

},{"../library/f":1}],9:[function(require,module,exports){
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

},{"../library/f":1,"../library/list":3}],10:[function(require,module,exports){
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

},{"../library/f":1,"../library/maybe":4}],11:[function(require,module,exports){
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

},{"../library/f":1,"../library/promise":5}],12:[function(require,module,exports){
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

},{"../library/f":1,"../library/state":6}],13:[function(require,module,exports){

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

},{"../library/f":1,"../library/stream":7}]},{},[8,9,10,11,12,13])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvaGVscGVycy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L2xpc3QuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9tYXliZS5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L3Byb21pc2UuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9zdGF0ZS5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L3N0cmVhbS5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9mX3Rlc3RzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL2xpc3RfdGVzdHMuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvbWF5YmVfdGVzdHMuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvcHJvbWlzZV90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9zdGF0ZV90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9zdHJlYW1fdGVzdHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUEsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBOztBQUdsQyxJQUFNLEVBQUUsR0FBRyxTQUFMLEVBQUUsQ0FBRyxDQUFDO1FBQUksQ0FBQztDQUFBLENBQUE7O0FBRWhCLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQzs7Ozs7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QTs7OztBQUloQyxJQUFNLE9BQU8sR0FBRyxTQUFWLE9BQU8sQ0FBSSxLQUFLO1FBQUssTUFBTSxDQUFFLFVBQUMsSUFBSSxFQUFLO0FBQzVDLE9BQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUM7QUFDOUIsT0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ1A7RUFDRCxDQUFDO0NBQUEsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7O0FBZUgsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBUyxNQUFNLEVBQUM7O0FBQ2pDLEtBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUMzQixLQUFJLFlBQVksR0FBRyxTQUFTLENBQUE7QUFDNUIsS0FBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFVBQUEsSUFBSSxFQUFHO0FBQUUsY0FBWSxHQUFHLElBQUksQ0FBQTtFQUFDLENBQUMsQ0FDcEQsR0FBRyxDQUFDLFVBQUEsR0FBRztTQUFJLEdBQUcsR0FBQyxDQUFDO0VBQUEsQ0FBQyxDQUNqQixHQUFHLENBQUMsVUFBQSxHQUFHO1NBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO0VBQUEsQ0FBQyxDQUNqQyxHQUFHLEVBQUUsQ0FBQTs7QUFFUCxhQUFZLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDZixLQUFJLEVBQUUsQ0FBQTtDQUNOLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG5cclxuY29uc3QgaWQgPSBhID0+IGEgLy8tLVxyXG5cclxuXHR2YXIgZl9tZXRob2RzID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBpdC5cclxuLy90aGlzIGlzIHZlcnkgdXNlZnVsIGlmIHlvdSBoYXZlIGEgQVBJIHdoaWNoIGV4cGVjdHMgYSBmdW5jdGlvbiwgYnV0IHlvdSB3YW50IHRvIGZlZWQgaXQgd2l0aCBhIHZhbHVlIChzZWUgdGhlIGBmbGF0bWFwYCBleGFtcGxlKS4gXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiB2YWwgPT09IHVuZGVmaW5lZCA/IGlkIDogZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpID0+IChiIC0+IGMpID0+IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkgPT4gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbi8vVGhpcyBpcyB0aGUgZnVuY3Rpb24gY29uc3RydWN0b3IuIEl0IHRha2VzIGEgZnVuY3Rpb24gYW5kIGFkZHMgYW4gYXVnbWVudGVkIGZ1bmN0aW9uIG9iamVjdCwgd2l0aG91dCBleHRlbmRpbmcgdGhlIHByb3RvdHlwZVxyXG5cclxuXHR2YXIgZiA9IChmdW5rID0gaWQsIGxlbmd0aCA9IGZ1bmsubGVuZ3RoLCBpbml0aWFsX2FyZ3VtZW50cyA9IFtdKSA9PiB7XHJcblxyXG5cdFx0Ly9XZSBleHBlY3QgYSBmdW5jdGlvbi4gSWYgd2UgYXJlIGdpdmVuIGFub3RoZXIgdmFsdWUsIGxpZnQgaXQgdG8gYSBmdW5jdGlvblxyXG5cdFx0aWYodHlwZW9mIGZ1bmsgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRyZXR1cm4gZigpLm9mKGZ1bmspXHJcblx0XHRcclxuXHRcdC8vSWYgdGhlIGZ1bmN0aW9uIHRha2VzIGp1c3Qgb25lIGFyZ3VtZW50LCBqdXN0IGV4dGVuZCBpdCB3aXRoIG1ldGhvZHMgYW5kIHJldHVybiBpdC5cclxuXHRcdH1lbHNlIGlmICggbGVuZ3RoIDwgMiApe1xyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kKGZ1bmssIGZfbWV0aG9kcylcclxuXHJcblx0XHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBleHRlbmRlZF9mdW5rID0gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciBhbGxfYXJndW1lbnRzICA9IChpbml0aWFsX2FyZ3VtZW50cykuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgbGVuZ3RoLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0XHR9LCBmX21ldGhvZHMpXHJcblx0XHRcdFxyXG5cdFx0XHRleHRlbmRlZF9mdW5rLl9sZW5ndGggPSBsZW5ndGggLSBpbml0aWFsX2FyZ3VtZW50cy5sZW5ndGhcclxuXHRcdFx0ZXh0ZW5kZWRfZnVuay5fb3JpZ2luYWwgPSBmdW5rXHJcblxyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kZWRfZnVua1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbi8vSGVyZSBpcyB0aGUgZnVuY3Rpb24gd2l0aCB3aGljaCB0aGUgZnVuY3Rpb24gb2JqZWN0IGlzIGV4dGVuZGVkXHJcblxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5cclxuXHRcclxuXHRmLm9mID0gdmFsID0+IGYoICgpID0+IHZhbCApLFxyXG5cclxuLy9UaGUgbGlicmFyeSBhbHNvIGZlYXR1cmVzIGEgc3RhbmRhcmQgY29tcG9zZSBmdW5jdGlvbiB3aGljaCBhbGxvd3MgeW91IHRvIG1hcCBub3JtYWwgZnVuY3Rpb25zIHdpdGggb25lIGFub3RoZXJcclxuXHJcblx0Zi5jb21wb3NlID0gZnVuY3Rpb24oKXtcclxuXHJcblx0XHQvL0NvbnZlcnQgZnVuY3Rpb25zIHRvIGFuIGFycmF5IGFuZCBmbGlwIHRoZW0gKGZvciByaWdodC10by1sZWZ0IGV4ZWN1dGlvbilcclxuXHRcdHZhciBmdW5jdGlvbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLnJldmVyc2UoKVxyXG5cdFx0Ly9DaGVjayBpZiBpbnB1dCBpcyBPSzpcclxuXHRcdGZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmspe2lmKHR5cGVvZiBmdW5rICE9PSBcImZ1bmN0aW9uXCIpe3Rocm93IG5ldyBUeXBlRXJyb3IoZnVuaytcIiBpcyBub3QgYSBmdW5jdGlvblwiICl9fSlcclxuXHRcdC8vUmV0dXJuIHRoZSBmdW5jdGlvbiB3aGljaCBjb21wb3NlcyB0aGVtXHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcclxuXHRcdFx0Ly9UYWtlIHRoZSBpbml0aWFsIGlucHV0XHJcblx0XHRcdHZhciBpbnB1dCA9IGFyZ3VtZW50c1xyXG5cdFx0XHR2YXIgY29udGV4dFxyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb25zLnJlZHVjZShmdW5jdGlvbihyZXR1cm5fcmVzdWx0LCBmdW5rLCBpKXsgXHJcblx0XHRcdFx0Ly9JZiB0aGlzIGlzIHRoZSBmaXJzdCBpdGVyYXRpb24sIGFwcGx5IHRoZSBhcmd1bWVudHMgdGhhdCB0aGUgdXNlciBwcm92aWRlZFxyXG5cdFx0XHRcdC8vZWxzZSB1c2UgdGhlIHJldHVybiByZXN1bHQgZnJvbSB0aGUgcHJldmlvdXMgZnVuY3Rpb25cclxuXHRcdFx0XHRyZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuayhyZXR1cm5fcmVzdWx0KSlcclxuXHRcdFx0XHQvL3JldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rLmFwcGx5KGNvbnRleHQsIFtyZXR1cm5fcmVzdWx0XSkpXHJcblx0XHRcdH0sIHVuZGVmaW5lZClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cclxuXHRtb2R1bGUuZXhwb3J0cyA9IGYvLy0tXHJcbiIsInZhciBhZGRfbWlzc2luZ19tZXRob2RzID0gZXhwb3J0cy5hZGRfbWlzc2luZ19tZXRob2RzID0gZnVuY3Rpb24ob2JqKXtcclxuXHQvL1wiY2hhaW5cIiBBS0EgXCJmbGF0TWFwXCIgaXMgZXF1aXZhbGVudCB0byBtYXAgLiBqb2luIFxyXG5cdFxyXG5cdG9iai5jaGFpbiA9IG9iai5mbGF0TWFwID0gZnVuY3Rpb24gZmxhdE1hcChmdW5rKSB7XHJcblx0XHRpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcblx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcblx0fVxyXG5cclxuXHQvKlxyXG5cdFwidGhlblwiIEFLQSBcInBoYXRNYXBcIiBpcyB0aGUgcmVsYXhlZCB2ZXJzaW9uIG9mIFwiZmxhdE1hcFwiIHdoaWNoIGFjdHMgb24gdGhlIG9iamVjdCBvbmx5IGlmIHRoZSB0eXBlcyBtYXRjaFxyXG5cdFwicGhhdE1hcFwiIHRoZXJlZm9yZSBjYW4gYmUgdXNlZCBhcyBib3RoIFwibWFwXCIgYW5kIFwiZmxhdE1hcFwiLCBleGNlcHQgaW4gdGhlIGNhc2VzIHdoZW4geW91IHNwZWNpZmljYWxseSB3YW50IHRvIGNyZWF0ZSBhIG5lc3RlZCBvYmplY3QuXHJcblx0SW4gdGhlc2UgY2FzZXMgeW91IGNhbiBkbyBzbyBieSBzaW1wbHkgdXNpbmcgXCJtYXBcIiBleHByaWNpdGx5LlxyXG5cdCovXHJcblxyXG5cdG9iai50aGVuID0gb2JqLnBoYXRNYXAgPSBmdW5jdGlvbiBwaGF0TWFwKGZ1bmspe1xyXG5cdFx0aWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG5cdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmspLnRyeUZsYXQoKVxyXG5cdH0sXHJcblxyXG5cdG9iai5waGF0TWFwMiA9IGZ1bmN0aW9uIHBoYXRNYXAyKGZ1bmspIHtcclxuXHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdHRoaXMucGhhdE1hcCgoaW5uZXIpID0+IHtcclxuXHRcdFx0aWYodHlwZW9mIGlubmVyLnBoYXRNYXAgIT09ICdmdW5jdGlvbicpe3Rocm93IFwiSW5uZXIgb2JqZWN0IGRvZXMgbm90IGhhdmUgJ3BoYXRNYXAnXCJ9XHJcblx0XHRcdGlubmVyLnBoYXRNYXAoZnVuaylcclxuXHRcdH0pXHJcblx0fSxcclxuXHRcclxuXHRvYmoucHJpbnQgPSBmdW5jdGlvbigpe1xyXG5cdFx0Y29uc29sZS5sb2codGhpcy50b1N0cmluZygpKVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG5cdHJldHVybiBvYmpcclxufVxyXG4iLCJcclxuXHJcbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuXHJcbnZhciBsaXN0TWV0aG9kcyA9IGhlbHBlcnMuYWRkX21pc3NpbmdfbWV0aG9kcyh7Ly8tLVxyXG5cclxuLy90aGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIHB1dHMgaXQgaW4gYSBsaXN0LlxyXG5cclxuXHRcdC8vYS5vZihiKSAtPiBiIGFcclxuXHRcdG9mOiB2YWwgPT4gbGlzdCh2YWwpLFxyXG5cclxuLy9gbWFwYCBhcHBsaWVzIGEgZnVuY3Rpb24gdG8gZWFjaCBlbGVtZW50IG9mIHRoZSBsaXN0LCBhcyB0aGUgb25lIGZyb20gdGhlIEFycmF5IHByb3RvdHlwZVxyXG5cdFx0XHJcbi8vYGZsYXRgIHRha2VzIGEgbGlzdCBvZiBsaXN0cyBhbmQgZmxhdHRlbnMgdGhlbSB3aXRoIG9uZSBsZXZlbCBcclxuXHJcblx0XHQvLyhiIC0+IChiIC0+IGMpKS5qb2luKCkgPSBhIC0+IGJcclxuXHRcdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoIHRoaXMucmVkdWNlKChsaXN0LCBlbGVtZW50KSA9PiBbLi4ubGlzdCwgLi4uZWxlbWVudF0sIFtdKSApXHJcblx0XHR9LFxyXG5cdFx0XHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGBcclxuLy9hbmQgd2l0aCBpdCwgeW91ciBmdW5rIGNhbiByZXR1cm4gYm90aCBhIGxpc3Qgb2Ygb2JqZWN0cyBhbmQgYSBzaW5nbGUgb2JqZWN0XHJcblxyXG5cdFx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gbGlzdCggdGhpcy5yZWR1Y2UoKGxpc3QsIGVsZW1lbnQpID0+IFxyXG5cdFx0XHRcdGVsZW1lbnQuY29uc3RydWN0b3IgPT09IEFycmF5PyBbLi4ubGlzdCwgLi4uZWxlbWVudF0gOiBbLi4ubGlzdCwgZWxlbWVudF0gLCBbXSlcclxuXHRcdFx0KVxyXG5cdFx0fSxcclxuXHRcdGZ1bmt0aW9uVHlwZTpcImxpc3RcIi8vLS1cclxuXHJcblx0fSlcclxuXHJcbi8vU29tZSBmdW5jdGlvbnMgYXJlIGRpcmVjdGx5IGxpZnRlZCBmcm9tIHRoZSBBcnJheSBwcm90b3R5cGVcclxuXHJcbnZhciBpbW11dGFibGVGdW5jdGlvbnMgPSBbJ21hcCcsICdjb25jYXQnXVxyXG5cclxuaW1tdXRhYmxlRnVuY3Rpb25zLmZvckVhY2goKGZ1bmspID0+IHsgXHJcblx0bGlzdE1ldGhvZHNbZnVua10gPSBmdW5jdGlvbiguLi5hcmdzKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoQXJyYXkucHJvdG90eXBlW2Z1bmtdLmFwcGx5KHRoaXMsIGFyZ3MpKVxyXG5cdH1cclxufSlcclxuXHJcbi8vVGhlIHR5cGUgYWxzbyB3cmFwcyBzb21lIEFycmF5IGZ1bmN0aW9ucyBpbiBhIHdheSB0aGF0IG1ha2VzIHRoZW0gaW1tdXRhYmxlXHJcblxyXG52YXIgbXV0YWJsZUZ1bmN0aW9ucyA9IFsnc3BsaWNlJywgJ3JldmVyc2UnLCAnc29ydCddXHJcblxyXG5tdXRhYmxlRnVuY3Rpb25zLmZvckVhY2goKGZ1bmspID0+IHsgXHJcblx0bGlzdE1ldGhvZHNbZnVua10gPSBmdW5jdGlvbiguLi5hcmdzKXtcclxuXHRcdFx0dmFyIG5ld0FycmF5ID0gdGhpcy5zbGljZSgwKVxyXG5cdFx0XHRBcnJheS5wcm90b3R5cGVbZnVua10uYXBwbHkobmV3QXJyYXksIGFyZ3MpXHJcblx0XHRcdHJldHVybiBuZXdBcnJheVxyXG5cdH1cclxufSlcclxuXHJcbi8vVGhpcyBpcyB0aGUgbGlzdCBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgbm9ybWFsIGFycmF5IGFuZCBhdWdtZW50cyBpdCB3aXRoIHRoZSBhYm92ZSBtZXRob2RzXHJcblx0XHJcblx0dmFyIGxpc3QgPSAoLi4uYXJncykgPT4ge1xyXG5cdFx0aWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXS5mdW5rdGlvblR5cGUgPT09IFwibGlzdFwiKXtcclxuXHRcdFx0cmV0dXJuIGFyZ3NbMF1cclxuXHRcdC8vQWNjZXB0IGFuIGFycmF5XHJcblx0XHR9ZWxzZSBpZihhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdLmNvbnN0cnVjdG9yID09PSBBcnJheSApe1xyXG5cdFx0XHRyZXR1cm4gIE9iamVjdC5mcmVlemUoZXh0ZW5kKGFyZ3NbMF0sIGxpc3RNZXRob2RzKSlcclxuXHRcdC8vQWNjZXB0IHNldmVyYWwgYXJndW1lbnRzXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIE9iamVjdC5mcmVlemUoZXh0ZW5kKGFyZ3MsIGxpc3RNZXRob2RzKSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGxpc3Qgb2JqZWN0IGlzIGV4dGVuZGVkXHJcblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0XHRyZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKGZ1bmN0aW9uKG9iaiwgbWV0aG9kX25hbWUpe29ialttZXRob2RfbmFtZV0gPSBtZXRob2RzW21ldGhvZF9uYW1lXTsgcmV0dXJuIG9ian0sIG9iailcclxuXHR9XHJcbm1vZHVsZS5leHBvcnRzID0gbGlzdC8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgbWF5YmVfcHJvdG8gPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vVGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIGBtYXliZWAuXHJcbi8vSW4gdGhpcyBjYXNlIHdlIGRvIHRoaXMgYnkganVzdCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3Rvci5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBtYXliZShpbnB1dClcclxuXHR9LFxyXG5cclxuLy9gbWFwYCB0YWtlcyB0aGUgZnVuY3Rpb24gYW5kIGFwcGxpZXMgaXQgdG8gdGhlIHZhbHVlIGluIHRoZSBtYXliZSwgaWYgdGhlcmUgaXMgb25lLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gbWF5YmUoZnVuayh0aGlzLl92YWx1ZSkpXHJcblx0XHR9ZWxzZXtcdFxyXG5cdFx0XHRyZXR1cm4gdGhpcyBcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nICYmIHRoaXMuX3ZhbHVlLmNvbnN0cnVjdG9yID09PSBtYXliZSl7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fSxcclxuXHRcclxuXHRmdW5rdGlvblR5cGU6XCJtYXliZVwiLC8vLS1cclxuXHJcbi8vRmluYWxseSwgdGhlIHR5cGUgaGFzIHNvbWUgaGVscGVyIGZ1bmN0aW9uczpcclxuXHJcblx0ZmlsdGVyOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIGZ1bmsodGhpcy5fdmFsdWUpID8gdGhpcyA6IG5vdGhpbmdcclxuXHR9LFxyXG5cclxuXHRyZWR1Y2U6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gZnVuayh0aGlzLl92YWx1ZSlcclxuXHR9LFxyXG5cclxuXHRnZXQ6ZnVuY3Rpb24ocHJvcCl7XHJcblx0XHRyZXR1cm4gbWF5YmUodGhpcy5fdmFsdWVbcHJvcF0pXHJcblx0fVxyXG5cclxuXHJcblx0XHJcbn0pLy8tLVxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIG1heWJlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cclxuXHR2YXIgbWF5YmUgPSBmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCl7XHJcblx0XHRcdHJldHVybiBub3RoaW5nXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0dmFyIG9iaiA9IE9iamVjdC5jcmVhdGUobWF5YmVfcHJvdG8pXHJcblx0XHRcdG9iai5fdmFsdWUgPSB2YWx1ZVxyXG5cdFx0XHRvYmouY29uc3RydWN0b3IgPSBtYXliZVxyXG5cdFx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdFx0cmV0dXJuIG9ialxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbnZhciBub3RoaW5nID0gT2JqZWN0LmNyZWF0ZShtYXliZV9wcm90bykvLy0tXHJcbm5vdGhpbmcuY29uc3RydWN0b3IgPSBtYXliZS8vLS1cclxuT2JqZWN0LmZyZWV6ZShub3RoaW5nKS8vLS1cclxubWF5YmUubm90aGluZyA9IG5vdGhpbmcvLy0tXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1heWJlLy8tLVxyXG4iLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcbnZhciBwcm9taXNlUHJvdG8gPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vVGhlIGBvZmAgbWV0aG9kIHRha2VzIGEgdmFsdWUgYW5kIHdyYXBzIGl0IGluIGEgcHJvbWlzZSwgYnkgaW1tZWRpYXRlbHkgY2FsbGluZyB0aGUgcmVzb2x2ZXIgZnVuY3Rpb24gd2l0aCBpdC5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKHZhbCl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IHJlc29sdmUodmFsKSApXHJcblx0fSxcclxuXHJcbi8vVGhlIGBtYXBgIG1ldGhvZCBjcmVhdGVzIGEgbmV3IHByb21pc2UsIHN1Y2ggdGhhdCB3aGVuIHRoZSBvbGQgcHJvbWlzZSBpcyByZXNvbHZlZCwgaXQgdGFrZXMgaXRzIHJlc3VsdCwgXHJcbi8vYXBwbGllcyBgZnVua2AgdG8gaXQgYW5kIHRoZW4gcmVzb2x2ZXMgaXRzZWxmIHdpdGggdGhlIHZhbHVlLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdHJldHVybiBwcm9taXNlKCAocmVzb2x2ZSkgPT4gdGhpcy5fcmVzb2x2ZXIoICh2YWwpID0+IHJlc29sdmUoIGZ1bmsodmFsKSApICkgKVxyXG5cclxuXHR9LFxyXG5cclxuLy9JbiB0aGlzIGNhc2UgdGhlIGltcGxlbWVudGF0aW9uIG9mIGBmbGF0YCBpcyBxdWl0ZSBzaW1wbGUuXHJcblxyXG4vL0VmZmVjdGl2ZWx5IGFsbCB3ZSBoYXZlIHRvIGRvIGlzIHJldHVybiB0aGUgc2FtZSB2YWx1ZSB3aXRoIHdoaWNoIHRoZSBpbm5lciBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGguXHJcbi8vVG8gZG8gdGhpcywgd2UgdW53cmFwIG91ciBwcm9taXNlIG9uY2UgdG8gZ2V0IHRoZSBpbm5lciBwcm9taXNlIHZhbHVlLCBhbmQgdGhlbiB1bndyYXAgdGhlIGlubmVyXHJcbi8vcHJvbWlzZSBpdHNlbGYgdG8gZ2V0IGl0cyB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBwcm9taXNlKCAocmVzb2x2ZSkgPT4gXHJcblx0XHRcdHRoaXMuX3Jlc29sdmVyKFx0KGlubmVyX3Byb21pc2UpID0+IFxyXG5cdFx0XHRcdGlubmVyX3Byb21pc2UuX3Jlc29sdmVyKCh2YWwpID0+IHJlc29sdmUodmFsKSlcclxuXHRcdFx0KSBcclxuXHRcdClcclxuXHR9LFxyXG5cclxuLy9UaGUgYHRyeUZsYXRgIGZ1bmN0aW9uIGlzIGFsbW9zdCB0aGUgc2FtZTpcclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBwcm9taXNlKCAocmVzb2x2ZSkgPT4gXHJcblx0XHRcdHRoaXMuX3Jlc29sdmVyKFx0KGlubmVyX3Byb21pc2UpID0+IHsgXHJcblx0XHRcdFx0aWYoaW5uZXJfcHJvbWlzZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZSl7XHJcblx0XHRcdFx0XHRpbm5lcl9wcm9taXNlLl9yZXNvbHZlcigodmFsKSA9PiByZXNvbHZlKHZhbCkpXHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXNvbHZlKGlubmVyX3Byb21pc2UpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdClcclxuXHR9LFxyXG5cclxuLy9UaGUgYHJ1bmAgZnVuY3Rpb24ganVzdCBmZWVkcyB0aGUgcmVzb2x2ZXIgd2l0aCBhIHBsYWNlaG9sZGVyICBmdW5jdGlvbiBzbyBvdXIgY29tcHV0YXRpb24gY2FuXHJcbi8vc3RhcnQgZXhlY3V0aW5nLlxyXG5cclxuXHRydW46ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLl9yZXNvbHZlcihmdW5jdGlvbihhKXtyZXR1cm4gYX0pXHJcblx0fVxyXG5cdFxyXG59KS8vLS1cclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHByb21pc2UgPSBmdW5jdGlvbihyZXNvbHZlKXtcclxuXHRcdGlmKHR5cGVvZiByZXNvbHZlICE9PSBcImZ1bmN0aW9uXCIpeyByZXR1cm4gcHJvbWlzZVByb3RvLm9mKHJlc29sdmUpIH1cclxuXHRcdGNvbnN0IG9iaiA9IE9iamVjdC5jcmVhdGUocHJvbWlzZVByb3RvKVxyXG5cclxuXHRcdG9iai5fcmVzb2x2ZXIgPSByZXNvbHZlXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBwcm9taXNlXHJcblx0XHRvYmoucHJvdG90eXBlID0gcHJvbWlzZVByb3RvXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByb21pc2UvLy0tXHJcbiIsIlxyXG5jb25zdCBmID0gcmVxdWlyZShcIi4vZlwiKS8vLS1cclxuXHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuY29uc3Qgc3RhdGVQcm90byA9IGhlbHBlcnMuYWRkX21pc3NpbmdfbWV0aG9kcyh7Ly8tLVxyXG5cclxuLy9gb2ZgIGp1c3QgdXNlcyB0aGUgY29uc3RydWN0b3IgYW5kIGRvZXMgbm90IHRvdWNoIHRoZSBzdGF0ZS5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBzdGF0ZSgocHJldlN0YXRlKSA9PiBbaW5wdXQsIHByZXZTdGF0ZV0pXHJcblx0fSxcclxuXHJcbi8vYG1hcGAgaXMgZG9uZSBieSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gdGhlIHZhbHVlIGFuZCBrZWVwaW5nIHRoZSBzdGF0ZSB1bmNoYW5nZWQuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0YXRlKCB0aGlzLl9ydW5TdGF0ZS5tYXAoKFtpbnB1dCwgcHJldlN0YXRlXSkgPT4gW2Z1bmsoaW5wdXQpLCBwcmV2U3RhdGVdKSlcclxuXHR9LFxyXG5cdFxyXG4vL2BmbGF0YCBkb2VzIHRoZSBmb2xsb3dpbmc6XHJcbi8vMS4gUnVucyB0aGUgY29kZSB0aGF0IHdlIGxvYWRlZCBpbiB0aGUgbW9uYWQgc28sIGZhciAodXNpbmcgdGhlIGBydW5gIGZ1bmN0aW9uKS5cclxuLy8yLiBTYXZlcyB0aGUgbmV3IHN0YXRlIG9iamVjdCBhbmQgdGhlIHZhbHVlIHdoaWNoIGlzIGtlcHQgYnkgdGhlIGZ1bmN0aW9ucyBzbyBmYXIuXHJcbi8vMy4gQWZ0ZXIgZG9pbmcgdGhhdCwgaXQgYXJyYW5nZXMgdGhvc2UgdHdvIGNvbXBvbmVudHMgKHRoZSBvYmplY3QgYW5kIHRoZSB2YWx1ZSkgaW50byBhIHlldCBhbm90aGVyXHJcbi8vc3RhdGUgb2JqZWN0LCB3aGljaCBydW5zIHRoZSBtdXRhdG9yIGZ1bmN0aW9uIG9mIHRoZSBmaXJzdCBvYmplY3QsIHdpdGggdGhlIHN0YXRlIHRoYXQgd2UgaGF2ZSBzbywgZmFyXHJcblxyXG5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdC8vRXh0cmFjdCBzdGF0ZSBtdXRhdG9yIGFuZCB2YWx1ZSBcclxuXHRcdGNvbnN0IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSA9IHRoaXMucnVuKClcclxuXHRcdC8vQ29tcG9zZSB0aGUgbXV0YXRvciBhbmQgdGhlIHZhbHVlXHJcblx0XHRyZXR1cm4gc3RhdGUoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdH0sXHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cclxuXHRcdC8vRXh0cmFjdCBjdXJyZW50IHN0YXRlIFxyXG5cdFx0Y29uc3QgW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdID0gdGhpcy5ydW4oKVxyXG5cdFx0XHJcblx0XHQvL0NoZWNrIGlmIGl0IGlzIHJlYWxseSBhIHN0YXRlXHJcblx0XHRpZihzdGF0ZU9iai5jb25zdHJ1Y3RvciA9PT0gc3RhdGUpe1xyXG5cdFx0XHRyZXR1cm4gc3RhdGUoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiBzdGF0ZSgoKSA9PiBbc3RhdGVPYmosIGN1cnJlbnRTdGF0ZV0pXHJcblx0XHR9XHJcblx0fSxcclxuXHJcbi8vV2UgaGF2ZSB0aGUgYHJ1bmAgZnVuY3Rpb24gd2hpY2ggY29tcHV0ZXMgdGhlIHN0YXRlOlxyXG5cclxuXHRydW46ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLl9ydW5TdGF0ZSgpXHJcblx0fSxcclxuLy9BbmQgdGhlIGBzYXZlYCBhbmQgYGxvYWRgIGZ1bmN0aW9ucyBhcmUgZXhhY3RseSB3aGF0IG9uZSB3b3VsZCBleHBlY3RcclxuXHJcblx0bG9hZDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiBzdGF0ZSggKHN0YXRlKSA9PiBbc3RhdGUsIHN0YXRlXSApIClcclxuXHR9LFxyXG5cdHNhdmU6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gc3RhdGUoIChzdGF0ZSkgPT4gW3ZhbHVlLCB2YWx1ZV0gKSApXHJcblx0fSxcclxuXHRsb2FkS2V5OmZ1bmN0aW9uKGtleSl7XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHN0YXRlKCAoc3RhdGUpID0+IFtzdGF0ZVtrZXldLCBzdGF0ZV0gKSApXHJcblx0fSxcclxuXHRzYXZlS2V5OmZ1bmN0aW9uKGtleSl7XHJcblx0XHRjb25zdCB3cml0ZSA9IChvYmosIGtleSwgdmFsKSA9PiB7XHJcblx0XHRcdG9iaiA9IHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgPyAgb2JqIDoge31cclxuXHRcdFx0b2JqW2tleV0gPSB2YWxcclxuXHRcdFx0cmV0dXJuIG9ialxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiBzdGF0ZSggKHN0YXRlKSA9PiBbdmFsdWUsIHdyaXRlKHN0YXRlLCBrZXksIHZhbHVlKV0gKSApXHJcblx0fSxcclxuXHR0b1N0cmluZzpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMucnVuKCkpXHJcblx0fVxyXG5cdFxyXG59KVxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIHN0YXRlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHN0YXRlID0gZnVuY3Rpb24ocnVuKXtcclxuXHRcdGlmKHR5cGVvZiBydW4gIT09IFwiZnVuY3Rpb25cIil7IHJldHVybiBzdGF0ZVByb3RvLm9mKHJ1bikgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShzdGF0ZVByb3RvKVxyXG5cdFx0b2JqLl9ydW5TdGF0ZSA9IGYocnVuLDEpXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBzdGF0ZVxyXG5cdFx0b2JqLnByb3RvdHlwZSA9IHN0YXRlUHJvdG9cclxuXHRcdE9iamVjdC5mcmVlemUob2JqKVxyXG5cdFx0cmV0dXJuIG9ialxyXG5cdH1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc3RhdGUvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIHN0cmVhbVByb3RvID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL1RoZSBgb2ZgIG1ldGhvZCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIHN0cmVhbSwgYnkgaW1tZWRpYXRlbHkgY2FsbGluZyB0aGUgcHVzaGVyIGZ1bmN0aW9uIHdpdGggaXQuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbih2YWwpe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IHB1c2godmFsKSApXHJcblx0fSxcclxuXHJcbi8vVGhlIGBtYXBgIG1ldGhvZCBjcmVhdGVzIGEgbmV3IHN0cmVhbSwgc3VjaCB0aGF0IGV2ZXJ5IHRpbWUgdGhlIG9sZCBzdHJlYW0gcmVjZWl2ZXMgYSB2YWx1ZSwgaXRcclxuLy9hcHBsaWVzIGBmdW5rYCB0byBpdCBhbmQgdGhlbiBwdXNoZXMgaXQgdG8gdGhlIG5ldyBzdHJlYW0uXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IHRoaXMuX3B1c2hlciggKHZhbCkgPT4gcHVzaCggZnVuayh2YWwpICkgKSApXHJcblxyXG5cdH0sXHJcblxyXG5cclxuLy9JbiB0aGlzIGNhc2UgdGhlIGltcGxlbWVudGF0aW9uIG9mIGBmbGF0YCBpcyBxdWl0ZSBzaW1wbGUuXHJcblxyXG4vL0VmZmVjdGl2ZWx5IGFsbCB3ZSBoYXZlIHRvIGRvIGlzIHJldHVybiB0aGUgc2FtZSB2YWx1ZSB3aXRoIHdoaWNoIHRoZSBpbm5lciBzdHJlYW0gaXMgcHVzaGQgd2l0aC5cclxuLy9UbyBkbyB0aGlzLCB3ZSB1bndyYXAgb3VyIHN0cmVhbSBvbmNlIHRvIGdldCB0aGUgaW5uZXIgc3RyZWFtIHZhbHVlLCBhbmQgdGhlbiB1bndyYXAgdGhlIGlubmVyXHJcbi8vc3RyZWFtIGl0c2VsZiB0byBnZXQgaXRzIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IFxyXG5cdFx0XHR0aGlzLl9wdXNoZXIoXHQoaW5uZXJfc3RyZWFtKSA9PiBcclxuXHRcdFx0XHRpbm5lcl9zdHJlYW0uX3B1c2hlcigodmFsKSA9PiBwdXNoKHZhbCkpXHJcblx0XHRcdCkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGB0cnlGbGF0YCBmdW5jdGlvbiBpcyBhbG1vc3QgdGhlIHNhbWU6XHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gXHJcblx0XHRcdHRoaXMuX3B1c2hlcihcdChpbm5lcl9zdHJlYW0pID0+IHsgXHJcblx0XHRcdFx0aWYoaW5uZXJfc3RyZWFtLmNvbnN0cnVjdG9yID09PSBzdHJlYW0pe1xyXG5cdFx0XHRcdFx0aW5uZXJfc3RyZWFtLl9wdXNoZXIoKHZhbCkgPT4gcHVzaCh2YWwpKVxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cHVzaChpbm5lcl9zdHJlYW0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdClcclxuXHR9LFxyXG5cclxuLy9UaGUgYHJ1bmAgZnVuY3Rpb24ganVzdCBmZWVkcyB0aGUgcHVzaGVyIHdpdGggYSBwbGFjZWhvbGRlciAgZnVuY3Rpb24gc28gb3VyIGNvbXB1dGF0aW9uIGNhblxyXG4vL3N0YXJ0IGV4ZWN1dGluZy5cclxuXHJcblx0cnVuOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcHVzaGVyKGZ1bmN0aW9uKGEpe3JldHVybiBhfSlcclxuXHR9LFxyXG5cdFxyXG4vL0FmdGVyIHRoZXNlIGFyZSBkb25lLCBhbGwgd2UgbmVlZCB0byBkbyBpcyBpbXBsZW1lbnQgdGhlIHRyYWRpdGlvbmFsIEpTIGFycmF5IGZ1bmN0aW9uc1xyXG5cclxuLy9gRm9yRWFjaGAgaXMgYWxtb3N0IHRoZSBzYW1lIGFzIGBtYXBgLCBleGNlcHQgd2UgZG9uJ3QgcHVzaCBgZnVuayh2YWwpYCAtIHRoZSByZXN1bHQgb2YgdGhlIHRyYW5zZm9ybWF0aW9uXHJcbi8vdG8gdGhlIG5ldyBzdHJlYW0sIGJ1dCB3ZSBwdXNoIGB2YWxgIGluc3RlYWQuXHJcblxyXG5cdGZvckVhY2g6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gdGhpcy5fcHVzaGVyKCAodmFsKSA9PiB7IFxyXG5cdFx0XHRwdXNoKHZhbCkgXHJcblx0XHRcdGZ1bmsodmFsKVxyXG5cdFx0fSApIClcclxuXHR9LFxyXG5cclxuLy9XaXRoIGZpbHRlciB0aGUgcmVzdWx0IG9mIGBmdW5rKHZhbClgIHNob3dzIHVzIHdoZXRoZXIgd2UgbmVlZCB0byBwdXNoIHRoZSB2YWx1ZVxyXG5cclxuXHRmaWx0ZXI6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gdGhpcy5fcHVzaGVyKCAodmFsKSA9PiB7IFxyXG5cdFx0XHRpZihmdW5rKHZhbCkpe3B1c2godmFsKX1cclxuXHRcdH0gKSApXHJcblx0fSxcclxuXHJcblx0cmVkdWNlOmZ1bmN0aW9uKGZ1bmssIGZyb20pe1xyXG5cdFx0bGV0IGFjY3VtdWxhdG9yID0gZnJvbVxyXG5cdFx0dGhpcy5fcHVzaGVyKHZhbCA9PiB7XHJcblx0XHRcdGFjY3VtdWxhdG9yID0gZnVuayhhY2N1bXVsYXRvciwgdmFsKSBcclxuXHRcdH0pXHJcblx0fSxcclxufSkvLy0tXHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgc3RyZWFtIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHN0cmVhbSA9IGZ1bmN0aW9uKHB1c2gpe1xyXG5cdFx0aWYodHlwZW9mIHB1c2ggIT09IFwiZnVuY3Rpb25cIil7IHJldHVybiBzdHJlYW1Qcm90by5vZihwdXNoKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKHN0cmVhbVByb3RvKVxyXG5cclxuXHRcdG9iai5fcHVzaGVyID0gcHVzaFxyXG5cdFx0b2JqLmNvbnN0cnVjdG9yID0gc3RyZWFtXHJcblx0XHRvYmoucHJvdG90eXBlID0gc3RyZWFtUHJvdG9cclxuXHRcdE9iamVjdC5mcmVlemUob2JqKVxyXG5cdFx0cmV0dXJuIG9ialxyXG5cdH1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc3RyZWFtXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogZnVuY3Rpb25cclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGZ1bmN0aW9uIG1vbmFkIGF1Z21lbnRzIHN0YW5kYXJkIEphdmFTY3JpcHQgZnVuY3Rpb25zIHdpdGggZmFjaWxpdGllcyBmb3IgY29tcG9zaXRpb24gYW5kIGN1cnJ5aW5nLlxyXG48IS0tbW9yZS0tPlxyXG5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiZnVuY3Rpb25zXCIpLy8tLVxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjb25zdHJ1Y3QgZnVuY3Rpb25zIGxpbmUgdGhpc1xyXG5cdFxyXG5cdFx0dmFyIHBsdXNfMSA9IGYoIChudW0pID0+IG51bSsxIClcclxuXHJcblxyXG4vL0FmdGVyIHlvdSBkbyB0aGF0LCB5b3Ugd2lsbCBzdGlsbCBiZSBhYmxlIHRvIHVzZSBgcGx1c18xYCBsaWtlIGEgbm9ybWFsIGZ1bmN0aW9uLCBidXQgeW91IGNhbiBhbHNvIGRvIHRoZSBmb2xsb3dpbmc6XHJcblxyXG5cclxuLypcclxuQ3VycnlpbmdcclxuLS0tLVxyXG5XaGVuIHlvdSBjYWxsIGEgZnVuY3Rpb24gYGZgIHdpdGggbGVzcyBhcmd1bWVudHMgdGhhdCBpdCBhY2NlcHRzLCBpdCByZXR1cm5zIGEgcGFydGlhbGx5IGFwcGxpZWRcclxuKGJvdW5kKSB2ZXJzaW9uIG9mIGl0c2VsZiB0aGF0IG1heSBhdCBhbnkgdGltZSBiZSBjYWxsZWQgd2l0aCB0aGUgcmVzdCBvZiB0aGUgYXJndW1lbnRzLlxyXG4qL1xyXG5cclxuXHRRVW5pdC50ZXN0KFwiY3VycnlcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRjb25zdCBhZGQzID0gZiggKGEsYixjKSA9PiBhK2IrYyApXHJcblx0XHRcclxuXHRcdGNvbnN0IGFkZDIgPSBhZGQzKDApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGFkZDIoMSwgMSksIDIgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBhZGQyKDUsIDUpLCAxMCApXHJcblxyXG5cdFx0Y29uc3QgcGx1czEwID0gYWRkMigxMClcclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czEwKDUpLCAxNSApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMxMCgxMCksIDIwIClcclxuXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxuYG9mKHZhbHVlKWBcclxuLS0tLVxyXG5JZiBjYWxsZWQgd2l0aCBhIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBpdCBjb25zdHJ1Y3RzIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGF0IHZhbHVlLlxyXG5JZiBjYWxsZWQgd2l0aG91dCBhcmd1bWVudHMgaXQgcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgdGhlIGFyZ3VtZW50cyBnaXZlbiB0byBpdC5cclxuKi9cclxuXHRRVW5pdC50ZXN0KFwib2ZcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRjb25zdCByZXR1cm5zOSA9IGYoKS5vZig5KVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCByZXR1cm5zOSgzKSwgOSApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHJldHVybnM5KFwiYVwiKSwgOSApXHJcblxyXG5cdFx0Y29uc3QgaWQgPSBmKCkub2YoKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBpZCgzKSwgMyApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGlkKFwiYVwiKSwgXCJhXCIgKVxyXG5cclxuXHR9KS8vLS1cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5DcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGZpcnN0LCB0aGVuIGNhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50OlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRcclxuLy9Zb3UgY2FuIGNyZWF0ZSBhIEZ1bmN0aW9uIE1vbmFkIGJ5IHBhc3NpbmcgYSBub3JtYWwgSmF2YVNjcmlwdCBmdW5jdGlvbiB0byB0aGUgY29uc3RydWN0b3IgKHlvdSBjYW4gd3JpdGUgdGhlIGZ1bmN0aW9uIGRpcmVjdGx5IHRoZXJlKTpcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXMxID0gZiggbnVtID0+IG51bSsxIClcclxuXHJcblxyXG4vL1RoZW4gbWFraW5nIGFub3RoZXIgZnVuY3Rpb24gaXMgZWFzeTpcclxuXHJcblx0XHR2YXIgcGx1czIgPSBwbHVzMS5tYXAocGx1czEpIFxyXG5cclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czIoMCksIDIgKVxyXG5cdFx0XHJcblx0XHR2YXIgcGx1czQgPSBwbHVzMi5tYXAocGx1czIpXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzNCgxKSwgNSApXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAgZXhjZXB0IHRoYXQgaWYgYGZ1bmtgIHJldHVybnMgYW5vdGhlciBmdW5jdGlvbiBpdCByZXR1cm5zIGEgdGhpcmQgZnVuY3Rpb24gd2hpY2g6XHJcbjEuIENhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdC5cclxuMi4gQ2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnRcclxuMy4gQ2FsbHMgdGhlIGZ1bmN0aW9uIHJldHVybmVkIGJ5IGBmdW5rYCB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50IGFuZCByZXR1cm5zIHRoZSByZXN1bHQgb2YgdGhlIHNlY29uZCBjYWxsLlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9Zb3UgY2FuIHVzZSBgcGhhdE1hcGAgdG8gbW9kZWwgc2ltcGxlIGlmLXRoZW4gc3RhdGVtZW50cy4gVGhlIGZvbGxvd2luZyBleGFtcGxlIHVzZXMgaXQgaW4gY29tYmluYXRpb24gb2YgdGhlIGN1cnJ5aW5nIGZ1bmN0aW9uYWxpdHk6XHJcblx0XHRcclxuXHRcdHZhciBjb25jYXQgPSBmKCAoc3RyMSwgc3RyMikgPT4gc3RyMSArIHN0cjIpXHJcblxyXG5cdFx0dmFyIG1ha2VNZXNzYWdlID0gZihwYXJzZUludCwgMSlcclxuXHRcdFx0LmZsYXRNYXAoKG51bSkgPT4gaXNOYU4obnVtKT8gZihcIkVycm9yLiBOb3QgYSBudW1iZXJcIikgOiBjb25jYXQoXCJUaGUgbnVtYmVyIGlzIFwiKSApXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIjFcIiksIFwiVGhlIG51bWJlciBpcyAxXCIpXHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIyXCIpLCBcIlRoZSBudW1iZXIgaXMgMlwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiWVwiKSwgXCJFcnJvci4gTm90IGEgbnVtYmVyXCIpXHJcblxyXG4vKlxyXG5cclxuYHBoYXRNYXBgIGlzIHNpbWlsYXIgdG8gdGhlIGA+Pj1gIGZ1bmN0aW9uIGluIEhhc2tlbGwsIHdoaWNoIGlzIHRoZSBidWlsZGluZyBibG9jayBvZiB0aGUgaW5mYW1vdXMgYGRvYCBub3RhdGlvblxyXG5JdCBjYW4gYmUgdXNlZCB0byB3cml0ZSBwcm9ncmFtcyB3aXRob3V0IHVzaW5nIGFzc2lnbm1lbnQuXHRcclxuXHJcbkZvciBleGFtcGxlIGlmIHdlIGhhdmUgdGhlIGZvbGxvd2luZyBmdW5jdGlvbiBpbiBIYXNrZWxsOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gZG8gIFxyXG5cdFx0XHRhIDwtICgqMikgIFxyXG5cdFx0XHRiIDwtICgrMTApICBcclxuXHRcdFx0cmV0dXJuIChhK2IpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cclxuV2hlbiB3ZSBkZXN1Z2FyIGl0LCB0aGlzIGJlY29tZXM6XHJcblxyXG5cdFx0YWRkU3R1ZmYgPSAoKjIpID4+PSBcXGEgLT5cclxuXHRcdFx0XHQoKzEwKSA+Pj0gXFxiIC0+XHJcblx0XHRcdFx0XHRyZXR1cm4gKGErYilcclxuXHJcbm9yIGluIEphdmFTY3JpcHQgdGVybXM6XHJcblxyXG4qL1xyXG5cclxuXHRcdHZhciBhZGRTdHVmZiA9IGYoIG51bSA9PiBudW0gKiAyIClcclxuXHRcdFx0LmZsYXRNYXAoIGEgPT4gZiggbnVtID0+IG51bSArIDEwIClcclxuXHRcdFx0XHQuZmxhdE1hcCggYiA9PiBmLm9mKGEgKyBiKSApIFxyXG5cdFx0XHQpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBsaXN0IFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYGxpc3RgIHR5cGUsIGF1Z21lbnRzIHRoZSBzdGFuZGFyZCBKYXZhU2NyaXB0IGFycmF5cywgbWFraW5nIHRoZW0gaW1tdXRhYmxlIGFuZCBhZGRpbmcgYWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5IHRvIHRoZW1cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIkxpc3RcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgbGlzdGAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbGlzdCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2xpc3RcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY3JlYXRlIGEgYGxpc3RgIGZyb20gYXJyYXkgbGlrZSB0aGlzXHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoWzEsMiwzXSlcclxuLy9vciBsaWtlIHRoaXM6XHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoMSwyLDMpXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcblN0YW5kYXJkIGFycmF5IG1ldGhvZC4gRXhlY3V0ZXMgYGZ1bmtgIGZvciBlYWNoIG9mIHRoZSB2YWx1ZXMgaW4gdGhlIGxpc3QgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbGlzdC5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdHZhciBwZW9wbGUgPSBsaXN0KCB7bmFtZTpcImpvaG5cIiwgYWdlOjI0LCBvY2N1cGF0aW9uOlwiZmFybWVyXCJ9LCB7bmFtZTpcImNoYXJsaWVcIiwgYWdlOjIyLCBvY2N1cGF0aW9uOlwicGx1bWJlclwifSlcclxuXHR2YXIgbmFtZXMgPSBwZW9wbGUubWFwKChwZXJzb24pID0+IHBlcnNvbi5uYW1lIClcclxuXHRhc3NlcnQuZGVlcEVxdWFsKG5hbWVzLCBbXCJqb2huXCIsIFwiY2hhcmxpZVwiXSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgbGlzdCBvciBhbiBhcnJheSBpdCBmbGF0dGVucyB0aGUgcmVzdWx0cyBpbnRvIG9uZSBhcnJheVxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcclxuXHR2YXIgb2NjdXBhdGlvbnMgPSBsaXN0KFsgXHJcblx0XHR7b2NjdXBhdGlvbjpcImZhcm1lclwiLCBwZW9wbGU6W1wiam9oblwiLCBcInNhbVwiLCBcImNoYXJsaWVcIl0gfSxcclxuXHRcdHtvY2N1cGF0aW9uOlwicGx1bWJlclwiLCBwZW9wbGU6W1wibGlzYVwiLCBcInNhbmRyYVwiXSB9LFxyXG5cdF0pXHJcblx0XHJcblx0dmFyIHBlb3BsZSA9IG9jY3VwYXRpb25zLnBoYXRNYXAoKG9jY3VwYXRpb24pID0+IG9jY3VwYXRpb24ucGVvcGxlKVxyXG5cdGFzc2VydC5kZWVwRXF1YWwocGVvcGxlLFtcImpvaG5cIiwgXCJzYW1cIiwgXCJjaGFybGllXCIsIFwibGlzYVwiLCBcInNhbmRyYVwiXSlcclxuXHJcbn0pLy8tLVxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBtYXliZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYG1heWJlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBvcHRpb25gIHR5cGUgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgdGhhdCBtYXkgbm90IGJlIHRoZXJlLiBcclxuXHJcblRoZSBwdXJwb3NlIG9mIHRoaXMgbW9uYWQgaXMgdG8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB3cml0aW5nIGBudWxsYCBjaGVja3MuIFxyXG5GdXJ0aGVybW9yZSBpdCBhbHNvIGVsaW1pbmF0ZXMgdGhlIHBvc3NpYmlsaXR5IG9mIG1ha2luZyBlcnJvcnMgYnkgbWlzc2luZyBudWxsLWNoZWNrcy5cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIk1heWJlXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYG1heWJlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBtYXliZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L21heWJlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIHdyYXAgYSB2YWx1ZSBpbiBgbWF5YmVgIHdpdGg6XHJcblx0XHR2YXIgdmFsID0gNC8vLS1cclxuXHRcdHZhciBtYXliZV92YWwgPSBtYXliZSh2YWwpXHJcblxyXG4vL0lmIHRoZSAndmFsJyBpcyBlcXVhbCB0byAqdW5kZWZpbmVkKiBpdCB0aHJlYXRzIHRoZSBjb250YWluZXIgYXMgZW1wdHkuXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIGBmdW5rYCB3aXRoIHRoZSBgbWF5YmVgJ3MgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGJ1dCBvbmx5IGlmIHRoZSB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSAqdW5kZWZpbmVkKiwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbWF5YmUuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vVHJhZGl0aW9uYWxseSwgaWYgd2UgaGF2ZSBhIHZhbHVlIHRoYXQgbWF5IGJlIHVuZGVmaW5lZCB3ZSBkbyBhIG51bGwgY2hlY2sgYmVmb3JlIGRvaW5nIHNvbWV0aGluZyB3aXRoIGl0OlxyXG5cclxuXHR2YXIgb2JqID0ge30vLy0tXHJcblx0dmFyIGdldF9wcm9wZXJ0eSA9IGYoKG9iamVjdCkgPT4gb2JqZWN0LnByb3BlcnR5KS8vLS1cclxuXHRcclxuXHR2YXIgdmFsID0gZ2V0X3Byb3BlcnR5KG9iailcclxuXHRcclxuXHRpZih2YWwgIT09IHVuZGVmaW5lZCl7XHJcblx0XHR2YWwgPSB2YWwudG9TdHJpbmcoKVxyXG5cdH1cclxuXHRhc3NlcnQuZXF1YWwodmFsLCB1bmRlZmluZWQpIFxyXG5cclxuLy9XaXRoIGBtYXBgIHRoaXMgY2FuIGJlIHdyaXR0ZW4gbGlrZSB0aGlzXHJcblxyXG4gXHR2YXIgbWF5YmVfZ2V0X3Byb3BlcnR5ID0gZ2V0X3Byb3BlcnR5Lm1hcChtYXliZSlcclxuXHJcblx0bWF5YmVfZ2V0X3Byb3BlcnR5KG9iaikubWFwKCh2YWwpID0+IHtcclxuXHRcdGFzc2VydC5vayhmYWxzZSkvLy0tXHJcblx0XHR2YWwudG9TdHJpbmcoKS8vdGhpcyBpcyBub3QgZXhlY3V0ZWRcclxuXHR9KVxyXG5cclxuLy9UaGUgYmlnZ2VzdCBiZW5lZml0IHdlIGdldCBpcyB0aGF0IGluIHRoZSBmaXJzdCBjYXNlIHdlIGNhbiBlYXNpbHkgZm9yZ2V0IHRoZSBudWxsIGNoZWNrOlxyXG5cdFxyXG5cdGFzc2VydC50aHJvd3MoZnVuY3Rpb24oKXtcclxuXHRcdGdldF9wcm9wZXJ0eShvYmopLnRvU3RyaW5nKCkgIC8vdGhpcyBibG93cyB1cFxyXG5cdH0pXHJcblxyXG4vL1doaWxlIGluIHRoZSBzZWNvbmQgY2FzZSB3ZSBjYW5ub3QgYWNjZXNzIHRoZSB1bmRlcmx5aW5nIHZhbHVlIGRpcmVjdGx5LCBhbmQgdGhlcmVmb3JlIGNhbm5vdCBleGVjdXRlIGFuIGFjdGlvbiBvbiBpdCwgaWYgaXQgaXMgbm90IHRoZXJlLlxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgYG1heWJlYCBpdCBmbGF0dGVucyB0aGUgdHdvIGBtYXliZXNgIGludG8gb25lLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vYG1hcGAgd29ya3MgZmluZSBmb3IgZWxpbWluYXRpbmcgZXJyb3JzLCBidXQgaXQgZG9lcyBub3Qgc29sdmUgb25lIG9mIHRoZSBtb3N0IGFubm95aW5nIHByb2JsZW1zIHdpdGggbnVsbC1jaGVja3MgLSBuZXN0aW5nOlxyXG5cclxuXHR2YXIgb2JqID0geyBmaXJzdDoge3NlY29uZDpcInZhbFwiIH0gfVxyXG5cdFxyXG5cdG1heWJlKG9iailcclxuXHRcdC5tYXAoIHJvb3QgPT4gbWF5YmUocm9vdC5maXJzdCkpXHJcblx0XHQubWFwKCBtYXliZUZpcnN0ID0+IG1heWJlRmlyc3QubWFwIChmaXJzdCA9PiBtYXliZSAobWF5YmVGaXJzdC5zZWNvbmQgKSApICkgXHJcblx0XHQubWFwKCBtYXliZU1heWJlVmFsdWUgPT4gbWF5YmVNYXliZVZhbHVlLm1hcCAobWF5YmVWYWx1ZSA9PiBtYXliZVZhbHVlLm1hcCggKHZhbHVlKT0+KCBhc3NlcnQuZXF1YWwoIHZhbCwgXCJ2YWxcIikgKSApICkgKVxyXG5cclxuLy9gcGhhdE1hcGAgZG9lcyB0aGUgZmxhdHRlbmluZyBmb3IgdXMsIGFuZCBhbGxvd3MgdXMgdG8gd3JpdGUgY29kZSBsaWtlIHRoaXNcclxuXHJcblx0bWF5YmUob2JqKVxyXG5cdFx0LmZsYXRNYXAocm9vdCA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5mbGF0TWFwKGZpcnN0ID0+IG1heWJlKGZpcnN0LnNlY29uZCkpXHJcblx0XHQuZmxhdE1hcCh2YWwgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwodmFsLCBcInZhbFwiKVxyXG5cdFx0fSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuQWR2YW5jZWQgVXNhZ2VcclxuLS0tLVxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImFkdmFuY2VkXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4vLyBgbWF5YmVgIGNhbiBiZSB1c2VkIHdpdGggdGhlIGZ1bmN0aW9uIG1vbmFkIHRvIGVmZmVjdGl2ZWx5IHByb2R1Y2UgJ3NhZmUnIHZlcnNpb25zIG9mIGZ1bmN0aW9uc1xyXG5cclxuXHR2YXIgZ2V0ID0gZigocHJvcCwgb2JqKSA9PiBvYmpbcHJvcF0pXHJcblx0dmFyIG1heWJlR2V0ID0gZ2V0Lm1hcChtYXliZSlcclxuXHJcbi8vVGhpcyBjb21iaW5lZCB3aXRoIHRoZSB1c2Ugb2YgY3VycnlpbmcgbWFrZXMgZm9yIGEgdmVyeSBmbHVlbnQgc3R5bGUgb2YgY29kaW5nOlxyXG5cclxuXHR2YXIgZ2V0Rmlyc3RTZWNvbmQgPSAocm9vdCkgPT4gbWF5YmUocm9vdCkucGhhdE1hcChtYXliZUdldCgnZmlyc3QnKSkucGhhdE1hcChtYXliZUdldCgnc2Vjb25kJykpXHJcblx0XHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDoge3NlY29uZDpcInZhbHVlXCIgfSB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcInZhbHVlXCIpKVxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJvdGhlcl92YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJvdGhlcl92YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiBcIlwiIH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwid2hhdGV2ZXJcIikgKS8vd29uJ3QgYmUgZXhlY3V0ZWQgXHJcblxyXG59KS8vLS1cclxuXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBwcm9taXNlIFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHByb21pc2VgIHR5cGUsIGFsc28ga25vd24gYXMgYGZ1dHVyZWAgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgd2hpY2ggd2lsbCBiZSByZXNvbHZlZCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUsIFxyXG52aWEgYW4gYXN5bmNocm9ub3VzIG9wZXJhdGlvbi4gXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJQcm9taXNlXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYHByb21pc2VgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdHZhciBwcm9taXNlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvcHJvbWlzZVwiKVxyXG5cdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UbyBjcmVhdGUgYSBgcHJvbWlzZWAgcGFzcyBhIGZ1bmN0aW9uIHdoaWNoIGFjY2VwdHMgYSBjYWxsYmFjayBhbmQgY2FsbHMgdGhhdCBjYWxsYmFjayB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWU6XHJcblxyXG5cdHZhciBteV9wcm9taXNlID0gcHJvbWlzZSggKHJlc29sdmUpID0+ICBcclxuXHRcdHNldFRpbWVvdXQoKCkgPT4geyByZXNvbHZlKDUpIH0sMTAwMCkgIFxyXG5cdClcclxuXHJcbi8vIEluIG1vc3QgY2FzZXMgeW91IHdpbGwgYmUgY3JlYXRpbmcgcHJvbWlzZXMgdXNpbmcgaGVscGVyIGZ1bmN0aW9ucyBsaWtlOlxyXG5cclxuXHRjb25zdCBnZXRVcmwgPSAodXJsKSA9PiBwcm9taXNlKCAocmVzb2x2ZSkgPT4ge1xyXG5cdCAgY29uc3QgcnEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxyXG4gIFx0ICBycS5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKEpTT04ucGFyc2UocnEucmVzcG9uc2VUZXh0KSlcclxuXHQgIHJxLm9wZW4oXCJHRVRcIix1cmwsdHJ1ZSk7XHJcblx0ICBycS5zZW5kKCk7XHJcblx0fSlcclxuLypcclxuYHJ1bigpYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIHRoZSBwcm9taXNlIGFuZCBmZXRjaGVzIHRoZSBkYXRhLlxyXG5cclxuKioqXHJcbkZvciBleGFtcGxlIHRvIG1ha2UgYSBwcm9taXNlIGFuZCBydW4gaXQgaW1tZWRpYXRlbHkgZG86XHJcbiovXHJcblx0Z2V0VXJsKFwicGVvcGxlLmpzb25cIikucnVuKClcclxuXHQvL1tcclxuXHQvLyAgeyBcIm5hbWVcIjpcImpvaG5cIiwgXCJvY2N1cGF0aW9uXCI6XCJwcm9ncmFtbWVyXCJ9LFxyXG4gXHQvLyAge1wibmFtZVwiOlwiamVuXCIsIFwib2NjdXBhdGlvblwiOlwiYWRtaW5cIn1cclxuXHQvL11cclxuXHJcblx0Z2V0VXJsKFwib2NjdXBhdGlvbnMuanNvblwiKS5ydW4oKVxyXG5cdC8ve1xyXG5cdC8vICBcInByb2dyYW1tZXJcIjogXCJ3cml0ZXMgY29kZVwiXHJcblx0Ly8gIFwiYWRtaW5cIjogXCJtYW5hZ2VzIGluZnJhc3RydWN0dXJlXCJcclxuXHQvL31cclxuXHJcbi8qXHJcbi8vTm90ZSB0aGF0IHdlIHdpbGwgYmUgdXNpbmcgdGhlIGRhdGEgZnJvbSB0aGVzZSB0d28gZmlsZXMgaW4gdGhlIG5leHQgZXhhbXBsZXMuIFxyXG5cclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5SZXR1cm5zIGEgbmV3IHByb21pc2UsIHdoaWNoIGFwcGxpZXMgYGZ1bmtgIHRvIHRoZSBkYXRhIHdoZW4geW91IHJ1biBpdC5cclxuXHJcbioqKlxyXG5UaGUgZnVuY3Rpb24gY2FuIGJlIHVzZWQgYm90aCBmb3IgbWFuaXB1bGF0aW5nIHRoZSBkYXRhIHlvdSBmZXRjaCBhbmQgZm9yIHJ1bm5pbmcgc2lkZSBlZmZlY3RzICBcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Y29uc3Qgc3RvcCA9IGFzc2VydC5hc3luYygpLy8tLVxyXG5cdGdldFVybChcInBlb3BsZS5qc29uXCIpXHJcblx0ICBcclxuXHQgIC8vVXNpbmcgXCJtYXBcIiBmb3IgbWFuaXB1bGF0aW5nIGRhdGFcclxuXHQgIC5tYXAoKHBlb3BsZSkgPT4gcGVvcGxlLm1hcCgocGVyc29uKSA9PiBwZXJzb24ubmFtZSkpXHJcblxyXG5cdCAgLy9Vc2luZyBcIm1hcFwiIGZvciB0cmlnZ2VyaW5nIHNpZGUgZWZmZWN0cyBcclxuXHQgIC5tYXAobmFtZXMgPT4ge1xyXG5cdCAgICBhc3NlcnQuZGVlcEVxdWFsKG5hbWVzLCBbJ2pvaG4nLCAnamVuJ10pXHJcblx0ICAgIHN0b3AoKS8vLS1cclxuXHQgIH0pLnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcbkEgbW9yZSBwb3dlcmZ1bCB2ZXJzaW9uIG9mIGBtYXBgIHdoaWNoIGNhbiBhbGxvd3MgeW91IHRvIGNoYWluIHNldmVyYWwgc3RlcHMgb2YgdGhlIGFzeWNocm9ub3VzIGNvbXB1dGF0aW9ucyB0b2dldGhlci5cclxuS25vd24gYXMgYHRoZW5gIGZvciB0cmFkaXRpb25hbCBwcm9taXNlIGxpYnJhcmllcy5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Y29uc3QgZG9uZSA9IGFzc2VydC5hc3luYygpLy8tLVx0XHJcblxyXG4vL0ZvciBleGFtcGxlIGhlcmUgaXMgYSBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgYSBwZXJzb24ncyBvY2N1cGF0aW9uIGZyb20gdGhlIGBwZW9wbGUuanNvbmAgZmlsZVxyXG4vL2FuZCB0aGVuIHJldHJpZXZlcyB0aGUgb2NjdXBhdGlvbidzIGRlc2NyaXB0aW9uIGZyb20gYG9jY3VwYXRpb25zLmpzb25gLiBcclxuXHJcblx0Y29uc3QgZ2V0T2NjdXBhdGlvbkRlc2NyaXB0aW9uID0gKG5hbWUpID0+IGdldFVybChcInBlb3BsZS5qc29uXCIpXHJcblxyXG5cdCAgLy9SZXRyaWV2ZSBwZXJzb24gZGF0YVxyXG5cdCAgLnBoYXRNYXAoKHBlb3BsZSkgPT4gcGVvcGxlLmZpbHRlciggcGVyc29uID0+IHBlcnNvbi5uYW1lID09PSBuYW1lIClbMF0pXHJcblxyXG5cdCAgLy9SZXRyaWV2ZSBpdHMgb2NjdXBhdGlvblxyXG5cdCAgLnBoYXRNYXAoIChwZXJzb24pID0+IGdldFVybChcIm9jY3VwYXRpb25zLmpzb25cIilcclxuXHQgICAgLm1hcChvY2N1cGF0aW9ucyA9PiBvY2N1cGF0aW9uc1twZXJzb24ub2NjdXBhdGlvbl0pIClcclxuXHJcbi8vSGVyZSBpcyBob3cgdGhlIGZ1bmN0aW9uIGlzIHVzZWQ6XHJcblxyXG5cdGdldE9jY3VwYXRpb25EZXNjcmlwdGlvbihcImpvaG5cIikubWFwKChkZXNjKSA9PiB7IFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGRlc2MsIFwid3JpdGVzIGNvZGVcIikgXHJcblx0XHRkb25lKCkvLy0tXHJcblx0fSkucnVuKClcclxuXHRcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IHN0YXRlXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgc3RhdGVgIHR5cGUsIGlzIGEgY29udGFpbmVyIHdoaWNoIGVuY2Fwc3VsYXRlcyBhIHN0YXRlZnVsIGZ1bmN0aW9uLiBJdCBiYXNpY2FsbHkgYWxsb3dzIHlvdSB0byBjb21wb3NlIGZ1bmN0aW9ucyxcclxubGlrZSB5b3UgY2FuIGRvIHdpdGggdGhlIGBmYCB0eXBlLCBleGNlcHQgd2l0aCBpdCBhbnkgZnVuY3Rpb24gY2FuIGFjY2VzcyBhbiBhZGRpdGlvbmFsIFwidmFyaWFibGVcIiBiZXNpZGVzIGl0c1xyXG5pbnB1dCBhcmd1bWVudChzKSAtIHRoZSBzdGF0ZS4gXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJTdGF0ZVwiKS8vLS1cclxuXHJcbi8vVG8gdXNlIHRoZSBgc3RhdGVgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIHN0YXRlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvc3RhdGVcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9JbiB0aGUgY29udGV4dCBvZiB0aGlzIHR5cGUgYSBzdGF0ZSBpcyByZXByZXNlbnRlZCBieSBhIGZ1bmN0aW9uIHRoYXQgYWNjZXB0cyBhIHN0YXRlIFxyXG4vL2FuZCByZXR1cm5zIGEgbGlzdCB3aGljaCBjb250YWlucyBhIHZhbHVlIGFuZCBhIG5ldyBzdGF0ZS4gU28gZm9yIGV4YW1wbGU6XHJcblxyXG5cdHN0YXRlKCh2YWwpID0+IFt2YWwrMSwgdmFsXSlcclxuXHJcbi8vQ3JlYXRlcyBhIG5ldyBzdGF0ZWZ1bCBjb21wdXRhdGlvbiB3aGljaCBpbmNyZW1lbnRzIHRoZSBpbnB1dCBhcmd1bWVudCBhbmQgdGhlbiBzYXZlcyBpdCBpbiB0aGUgc3RhdGUuXHJcblxyXG5cclxuLypcclxuYG9mKHZhbHVlKWBcclxuLS0tLVxyXG5BY2NlcHRzIGEgdmFsdWUgYW5kIHdyYXBzIGluIGEgc3RhdGUgY29udGFpbmVyXHJcbiovXHJcblx0UVVuaXQudGVzdChcIm9mXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0YXNzZXJ0LmV4cGVjdCgwKS8vLS1cclxuXHRcdGNvbnN0IHN0YXRlNSA9IHN0YXRlKCkub2YoNSlcclxuXHR9KS8vLS1cclxuXHJcbi8vTm90ZSB0aGF0IHRoZSBmb2xsb3dpbmcgY29kZSBkb2VzIG5vdCBwdXQgYDVgIGluIHRoZSBzdGF0ZS5cclxuLy9SYXRoZXIgaXQgY3JlYXRlcyBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYDVgIGFuZCBkb2VzIG5vdCBpbnRlcmFjdCB3aXRoIHRoZSBzdGF0ZS4gXHJcblxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5FeGVjdXRlcyBgZnVua2Agd2l0aCB0aGUgZW5jYXBzdWxhdGVkIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBhbmQgd3JhcHMgdGhlIHJlc3VsdCBpbiBhIG5ldyBgc3RhdGVgIG9iamVjdCwgXHJcbndpdGhvdXQgYWNjZXNzaW5nIHRoZSBzdGF0ZVxyXG5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9PbmUgb2YgdGhlIG1haW4gYmVuZWZpdHMgb2YgdGhlIGBzdGF0ZWAgdHlwZXMgaXMgdGhhdCBpdCBhbGxvd3MgeW91IHRvIG1peCBwdXJlIGZ1bmN0aW9ucyB3aXRoIHVucHVyZSBvbmVzLCBcclxuLy9JbiB0aGUgc2FtZSB3YXkgdGhhdCBwcm9taXNlcyBhbGxvdyB1cyB0byBtaXggYXN5Y2hyb25vdXMgZnVuY3Rpb25zIHdpdGggc3luY2hyb25vdXMgb25lcy5cclxuLy9NYXAgYWxsb3dzIHVzIHRvIGFwcGx5IGFueSBmdW5jdGlvbiBvbiBvdXIgdmFsdWUgYW5kIHRvIGNvbnN1bWUgdGhlIHJlc3VsdCBpbiBhbm90aGVyIGZ1bmN0aW9uLlxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKDUpXHJcblx0XHQubWFwKCh2YWwpID0+IHZhbCsxKVxyXG5cdFx0Lm1hcCgodmFsKSA9PiB7XHJcblx0XHRcdGFzc2VydC5lcXVhbCh2YWwsIDYpXHJcblx0XHRcdHJldHVybiB2YWwgKiAyXHJcblx0XHR9KVxyXG5cdFx0Lm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLCAxMikpXHJcblx0XHQucnVuKClcclxufSkvLy0tXHJcblxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAsIGV4Y2VwdCB0aGF0IGlmIGBmdW5rYCByZXR1cm5zIGEgbmV3IHN0YXRlIG9iamVjdCBpdCBtZXJnZXMgdGhlIHR3byBzdGF0ZXMgaW50byBvbmUuXHJcblRodXMgYGZsYXRNYXBgIHNpbXVsYXRlcyBtYW5pcHVsYXRpb24gb2YgbXV0YWJsZSBzdGF0ZS5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwicGhhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vRm9yIGV4YW1wbGUsIGhlcmUgaXMgYSBmdW5jdGlvbiB0aGF0IFxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKFwidmFsdWVcIilcclxuXHRcdC8vV3JpdGUgdGhlIHZhbHVlIGluIHRoZSBzdGF0ZVxyXG5cdFx0LnBoYXRNYXAoIHZhbHVlID0+IHN0YXRlKCBfID0+IFtcIm5ldyBcIit2YWx1ZSAsIFwiaW5pdGlhbCBcIit2YWx1ZV0pIClcclxuXHJcblx0XHQvL21hbmlwdWxhdGUgdGhlIHZhbHVlXHJcblx0XHQucGhhdE1hcCggdmFsID0+IHZhbC50b1VwcGVyQ2FzZSgpLnNwbGl0KFwiXCIpLmpvaW4oXCItXCIpIClcclxuXHRcdFxyXG5cdFx0Ly9XZSBjYW4gYWNjZXNzIHRoZSBzdGF0ZSBhdCBhbnkgdGltZS5cclxuXHRcdC5waGF0TWFwKCB2YWwgPT4gc3RhdGUoc3QgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwoIHZhbCwgXCJOLUUtVy0gLVYtQS1MLVUtRVwiKVxyXG5cdFx0XHRhc3NlcnQuZXF1YWwoIHN0LCBcImluaXRpYWwgdmFsdWVcIilcclxuXHRcdH0pKS5ydW4oKVxyXG59KS8vLS1cclxuXHJcbi8qXHJcblxyXG5gc2F2ZSgpIC8gbG9hZCgpYFxyXG4tLS0tXHJcblNob3J0aGFuZHMgZm9yIHRoZSBtb3N0IGNvbW1vbiBzdGF0ZSBvcGVyYXRpb25zOiBcclxuLSBgc2F2ZWAgY29waWVzIHRoZSBjdXJyZW50bHkgZW5jYXBzdWxhdGVkIHZhbHVlIGludG8gdGhlIHN0YXRlXHJcbi0gYGxvYWRgIGp1c3QgcmV0dXJucyB0aGUgY3VycmVudCBzdGF0ZVxyXG4qKipcclxuKi9cclxuXHJcblxyXG5RVW5pdC50ZXN0KFwic2F2ZS9sb2FkXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKDUpXHJcblx0LnBoYXRNYXAoICh2YWwpID0+IHZhbCsxICkgLy82XHJcblx0LnNhdmVLZXkoXCJzdDFcIilcclxuXHRcclxuXHQucGhhdE1hcCggKHZhbCkgPT4gdmFsKjIgKS8vMTJcclxuXHQuc2F2ZUtleShcInN0MlwiKVxyXG5cdFxyXG5cdC5sb2FkKClcclxuXHQubWFwKCAoc3RhdGUpID0+IHtcclxuXHRcdGFzc2VydC5lcXVhbChzdGF0ZS5zdDEsIDYpXHJcblx0XHRhc3NlcnQuZXF1YWwoc3RhdGUuc3QyLCAxMilcclxuXHR9KS5ydW4oKVxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcblxyXG5cclxuIiwiXHJcbi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogc3RyZWFtIFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHN0cmVhbWAgdHlwZSwgYWxzbyBrbm93biBhcyBhIGxhenkgbGlzdCBpcyBhIGNvbnRhaW5lciBmb3IgYSBsaXN0IG9mIHZhbHVlcyB3aGljaCBjb21lIGFzeW5jaHJvbm91c2x5LlxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwic3RyZWFtXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYHN0cmVhbWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0dmFyIHN0cmVhbSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0cmVhbVwiKVxyXG5cdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UbyBjcmVhdGUgYSBgc3RyZWFtYCBwYXNzIGEgZnVuY3Rpb24gd2hpY2ggYWNjZXB0cyBhIGNhbGxiYWNrIGFuZCBjYWxscyB0aGF0IGNhbGxiYWNrIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZTpcclxuXHJcblx0Y29uc3QgY2xpY2tTdHJlYW0gPSBzdHJlYW0oIChwdXNoKSA9PiB7IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcHVzaCl9KVxyXG5cdHdpbmRvdy5jbGlja1N0cmVhbSA9IGNsaWNrU3RyZWFtXHJcblxyXG4vLyBMaWtlIHByb21pc2VzLCBzdHJlYW1zIGFyZSBhbHNvIGNyZWF0ZWQgd2l0aCBhIGhlbHBlclxyXG5cclxuXHRjb25zdCBjb3VudFRvID0gKHJhbmdlKSA9PiBzdHJlYW0oIChwdXNoKSA9PiB7XHJcblx0XHRmb3IgKGxldCBpID0gMTsgaTw9IHJhbmdlOyBpKyspe1xyXG5cdFx0XHRwdXNoKGkpXHJcblx0XHR9XHJcblx0fSlcclxuLypcclxuYHJ1bigpYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIHRoZSBzdHJlYW0gYW5kIGZldGNoZXMgdGhlIGRhdGEuXHJcblxyXG4qKipcclxuXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuUmV0dXJucyBhIG5ldyBzdHJlYW0sIHdoaWNoIGFwcGxpZXMgYGZ1bmtgIHRvIHRoZSBkYXRhIHdoZW4geW91IHJ1biBpdC5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRjb25zdCBzdG9wID0gYXNzZXJ0LmFzeW5jKCkvLy0tXHJcblx0dmFyIHB1c2hUb1N0cmVhbSA9IHVuZGVmaW5lZFxyXG5cdGNvbnN0IG15U3RyZWFtID0gc3RyZWFtKHB1c2ggPT57IHB1c2hUb1N0cmVhbSA9IHB1c2h9KVxyXG5cdFx0Lm1hcCh2YWwgPT4gdmFsKjIpXHJcblx0XHQubWFwKHZhbCA9PiBhc3NlcnQuZXF1YWwodmFsLCAxMCkpXHJcblx0XHQucnVuKClcclxuXHRcclxuXHRwdXNoVG9TdHJlYW0oNSlcclxuXHRzdG9wKClcclxufSkvLy0tXHJcblxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuQSBtb3JlIHBvd2VyZnVsIHZlcnNpb24gb2YgYG1hcGAgd2hpY2ggY2FuIGFsbG93cyB5b3UgdG8gY2hhaW4gc2V2ZXJhbCBzdGVwcyBvZiB0aGUgYXN5Y2hyb25vdXMgY29tcHV0YXRpb25zIHRvZ2V0aGVyLlxyXG5Lbm93biBhcyBgdGhlbmAgZm9yIHRyYWRpdGlvbmFsIHN0cmVhbSBsaWJyYXJpZXMuXHJcblxyXG4qKipcclxuKi9cclxuXHJcbi8vUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Ly9jb25zdCBkb25lID0gYXNzZXJ0LmFzeW5jKCkvLy0tXHRcclxuLy99KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuIl19
