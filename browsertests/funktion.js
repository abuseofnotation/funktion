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

var arrayMethods = {};

//Some functions are directly lifted from the Array prototype

var immutableFunctions = ["map", "concat"];

immutableFunctions.forEach(function (funk) {
	arrayMethods[funk] = function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return list(Array.prototype[funk].apply(this, args));
	};
});

//The type also wraps some Array functions in a way that makes them immutable

var mutableFunctions = ["splice", "reverse", "sort"];

mutableFunctions.forEach(function (funk) {
	arrayMethods[funk] = function () {
		var newArray = this.slice(0);

		for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			args[_key2] = arguments[_key2];
		}

		Array.prototype[funk].apply(newArray, args);
		return newArray;
	};
});

extend(methods, arrayMethods);

methods.extras = [];

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

	getProp: function getProp(prop) {
		var _this = this;

		return this.phatMap(function (val) {
			return _this.of(val[prop]);
		});
	}

}; //--

methods.extras = [methods.getProp];

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
  of: function of(input) {
    return maybeT(input);
  },

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
  flat: function flat() {
    return maybeT(this._value.map(function (val) {
      return val._value;
    }));
  },

  //finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`

  tryFlat: function tryFlat() {
    return maybeT(this._value.map(function (val) {
      if (val.funktionType === "maybeT") {
        return val._value;
      } else {
        return val;
      }
    }));
  },
  lift: function lift(funk) {
    if (typeof funk === "function") {
      return maybeT(funk(this._value));
    } else if (typeof funk === "string") {
      var _value;

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return maybeT((_value = this._value)[funk].apply(_value, args));
    }
  },
  funktionType: "maybeT" //--

}; //--

//In case you are interested, here is how the maybe constructor is implemented
maybe.prototype.extras.forEach(function (method) {
  methods[method.name] = method;
});

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
methods.flatMap = helpers.flatMap;
methods.phatMap = helpers.phatMap;

//Add a print function, used for debugging.
methods.print = helpers.print;

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
		var _this = this;

		return this.flatMap(function (value) {
			return _this.constructor(function (state) {
				return [state, state];
			});
		});
	},
	save: function save() {
		var _this2 = this;

		return this.flatMap(function (value) {
			return _this2.constructor(function (state) {
				return [value, value];
			});
		});
	},
	loadKey: function loadKey(key) {
		var _this3 = this;

		return this.flatMap(function (value) {
			return _this3.constructor(function (state) {
				return [state[key], state];
			});
		});
	},
	saveKey: function saveKey(key) {
		var _this4 = this;

		var write = function write(obj, key, val) {
			obj = typeof obj === "object" ? obj : {};
			obj[key] = val;
			return obj;
		};
		return this.flatMap(function (value) {
			return _this4.constructor(function (state) {
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

var state = methods.constructor = function (run) {
	if (typeof run !== "function") {
		return methods.of(run);
	}
	var obj = Object.create(methods);
	obj._runState = f(run, 1);
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
var state = require("../library/state");

QUnit.module("maybeT");

QUnit.test("list", function (assert) {
    //--
    var bc = maybeT(list({ a: "b" }, { a: "c" })).getProp("a");
    assert.deepEqual(bc._value, ["b", "c"]);
    var abc = bc.lift("reverse").lift("concat", ["a"]);
    assert.deepEqual(abc._value, ["c", "b", "a"]);
});
/*
QUnit.test("state", function(assert){//--
    maybeT(state(1))
    .map()
})

*/

},{"../library/list":3,"../library/maybeT":5,"../library/state":7}],12:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2YuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2hlbHBlcnMuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2xpc3QuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L21heWJlLmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9tYXliZVQuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L3Byb21pc2UuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L3N0YXRlLmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9zdHJlYW0uanMiLCJkOi9wci9mdW5rdGlvbi90ZXN0cy9mX3Rlc3RzLmpzIiwiZDovcHIvZnVua3Rpb24vdGVzdHMvbGlzdF90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL21heWJlVF90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL21heWJlX3Rlc3RzLmpzIiwiZDovcHIvZnVua3Rpb24vdGVzdHMvcHJvbWlzZV90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL3N0YXRlX3Rlc3RzLmpzIiwiZDovcHIvZnVua3Rpb24vdGVzdHMvc3RyZWFtX3Rlc3RzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7QUFHbEMsSUFBTSxFQUFFLEdBQUcsU0FBTCxFQUFFLENBQUcsQ0FBQztRQUFJLENBQUM7Q0FBQSxDQUFBOztBQUVoQixJQUFJLE9BQU8sR0FBRzs7Ozs7O0FBTWIsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLEdBQUcsS0FBSyxTQUFTLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBRTtVQUFNLEdB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QU0vQixJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUUsVUFBQyxHQUFHO1NBQUssR0FBRyxHQUFDLENBQUM7Q0FBQSxDQUFFLENBQUE7Ozs7Ozs7Ozs7O0FBYWpDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVMsTUFBTSxFQUFDOztBQUNuQyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUUsVUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUM7V0FBSyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7R0FBQSxDQUFFLENBQUE7O0FBRWxDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNwQixRQUFNLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7QUFDN0IsUUFBTSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBRSxDQUFBOztBQUU5QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDdkIsUUFBTSxDQUFDLEtBQUssQ0FBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFFLENBQUE7QUFDN0IsUUFBTSxDQUFDLEtBQUssQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFFLENBQUE7Q0FHOUIsQ0FBQyxDQUFBOzs7Ozs7OztBQVFGLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsTUFBTSxFQUFDOztBQUNoQyxNQUFNLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDMUIsUUFBTSxDQUFDLEtBQUssQ0FBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7QUFDOUIsUUFBTSxDQUFDLEtBQUssQ0FBRSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7O0FBRWhDLE1BQU0s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LEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUM7QUFDOUIsT0FBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO0dBQ1A7RUFDRCxDQUFDO0NBQUEsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7O0FBZUgsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBUyxNQUFNLEVBQUM7O0FBQ2pDLEtBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQTtBQUMzQixLQUFJLFlBQVksR0FBRyxTQUFTLENBQUE7QUFDNUIsS0FBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLFVBQUEsSUFBSSxFQUFHO0FBQUUsY0FBWSxHQUFHLElBQUksQ0FBQTtFQUFDLENBQUMsQ0FDcEQsR0FBRyxDQUFDLFVBQUEsR0FBRztTQUFJLEdBQUcsR0FBQyxDQUFDO0VBQUEsQ0FBQyxDQUNqQixHQUFHLENBQUMsVUFBQSxHQUFHO1NBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO0VBQUEsQ0FBQyxDQUNqQyxHQUFHLEVBQUUsQ0FBQTs7QUFFUCxhQUFZLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDZixLQUFJLEVBQUUsQ0FBQTtDQUNOLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG5cclxuY29uc3QgaWQgPSBhID0+IGEgLy8tLVxyXG5cclxuXHR2YXIgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBpdC5cclxuLy90aGlzIGlzIHZlcnkgdXNlZnVsIGlmIHlvdSBoYXZlIGEgQVBJIHdoaWNoIGV4cGVjdHMgYSBmdW5jdGlvbiwgYnV0IHlvdSB3YW50IHRvIGZlZWQgaXQgd2l0aCBhIHZhbHVlIChzZWUgdGhlIGBmbGF0bWFwYCBleGFtcGxlKS4gXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiB2YWwgPT09IHVuZGVmaW5lZCA/IGlkIDogZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpID0+IChiIC0+IGMpID0+IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkgPT4gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fS8vLS1cclxuXHJcbi8vQWRkIGFsaWFzZXMgdG8gbWFwIC4gZmxhdCBhcyBmbGF0TWFwIGFuZCBtYXAgLiB0cnlGbGF0IGFzIHBoYXRNYXBcclxuICAgICAgICBtZXRob2RzLmZsYXRNYXAgPSBoZWxwZXJzLmZsYXRNYXBcclxuICAgICAgICBtZXRob2RzLnBoYXRNYXAgPSBoZWxwZXJzLnBoYXRNYXBcclxuXHJcbi8vQWRkIGEgcHJpbnQgZnVuY3Rpb24sIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgICAgICBtZXRob2RzLnByaW50ID0gaGVscGVycy5wcmludFxyXG5cclxuLy9UaGlzIGlzIHRoZSBmdW5jdGlvbiBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgYSBmdW5jdGlvbiBhbmQgYWRkcyBhbiBhdWdtZW50ZWQgZnVuY3Rpb24gb2JqZWN0LCB3aXRob3V0IGV4dGVuZGluZyB0aGUgcHJvdG90eXBlXHJcblxyXG5cdHZhciBmID0gKGZ1bmsgPSBpZCwgbGVuZ3RoID0gZnVuay5sZW5ndGgsIGluaXRpYWxfYXJndW1lbnRzID0gW10pID0+IHtcclxuXHJcblx0XHQvL1dlIGV4cGVjdCBhIGZ1bmN0aW9uLiBJZiB3ZSBhcmUgZ2l2ZW4gYW5vdGhlciB2YWx1ZSwgbGlmdCBpdCB0byBhIGZ1bmN0aW9uXHJcblx0XHRpZih0eXBlb2YgZnVuayAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdHJldHVybiBmKCkub2YoZnVuaylcclxuXHRcdFxyXG5cdFx0Ly9JZiB0aGUgZnVuY3Rpb24gdGFrZXMganVzdCBvbmUgYXJndW1lbnQsIGp1c3QgZXh0ZW5kIGl0IHdpdGggbWV0aG9kcyBhbmQgcmV0dXJuIGl0LlxyXG5cdFx0fWVsc2UgaWYgKCBsZW5ndGggPCAyICl7XHJcblx0XHRcdHJldHVybiBleHRlbmQoZnVuaywgbWV0aG9kcylcclxuXHJcblx0XHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBleHRlbmRlZF9mdW5rID0gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciBhbGxfYXJndW1lbnRzICA9IChpbml0aWFsX2FyZ3VtZW50cykuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgbGVuZ3RoLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0XHR9LCBtZXRob2RzKVxyXG5cdFx0XHRcclxuXHRcdFx0ZXh0ZW5kZWRfZnVuay5fbGVuZ3RoID0gbGVuZ3RoIC0gaW5pdGlhbF9hcmd1bWVudHMubGVuZ3RoXHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX29yaWdpbmFsID0gZnVua1xyXG5cclxuXHRcdFx0cmV0dXJuIGV4dGVuZGVkX2Z1bmtcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGZ1bmN0aW9uIG9iamVjdCBpcyBleHRlbmRlZFxyXG5cclxuXHRmdW5jdGlvbiBleHRlbmQob2JqLCBtZXRob2RzKXtcclxuXHRcdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG5cdH1cclxuXHJcblx0XHJcblx0Zi5vZiA9IHZhbCA9PiBmKCAoKSA9PiB2YWwgKSxcclxuXHJcbi8vVGhlIGxpYnJhcnkgYWxzbyBmZWF0dXJlcyBhIHN0YW5kYXJkIGNvbXBvc2UgZnVuY3Rpb24gd2hpY2ggYWxsb3dzIHlvdSB0byBtYXAgbm9ybWFsIGZ1bmN0aW9ucyB3aXRoIG9uZSBhbm90aGVyXHJcblxyXG5cdGYuY29tcG9zZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9Db252ZXJ0IGZ1bmN0aW9ucyB0byBhbiBhcnJheSBhbmQgZmxpcCB0aGVtIChmb3IgcmlnaHQtdG8tbGVmdCBleGVjdXRpb24pXHJcblx0XHR2YXIgZnVuY3Rpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5yZXZlcnNlKClcclxuXHRcdC8vQ2hlY2sgaWYgaW5wdXQgaXMgT0s6XHJcblx0XHRmdW5jdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmdW5rKXtpZih0eXBlb2YgZnVuayAhPT0gXCJmdW5jdGlvblwiKXt0aHJvdyBuZXcgVHlwZUVycm9yKGZ1bmsrXCIgaXMgbm90IGEgZnVuY3Rpb25cIiApfX0pXHJcblx0XHQvL1JldHVybiB0aGUgZnVuY3Rpb24gd2hpY2ggY29tcG9zZXMgdGhlbVxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vVGFrZSB0aGUgaW5pdGlhbCBpbnB1dFxyXG5cdFx0XHR2YXIgaW5wdXQgPSBhcmd1bWVudHNcclxuXHRcdFx0dmFyIGNvbnRleHRcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9ucy5yZWR1Y2UoZnVuY3Rpb24ocmV0dXJuX3Jlc3VsdCwgZnVuaywgaSl7IFxyXG5cdFx0XHRcdC8vSWYgdGhpcyBpcyB0aGUgZmlyc3QgaXRlcmF0aW9uLCBhcHBseSB0aGUgYXJndW1lbnRzIHRoYXQgdGhlIHVzZXIgcHJvdmlkZWRcclxuXHRcdFx0XHQvL2Vsc2UgdXNlIHRoZSByZXR1cm4gcmVzdWx0IGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uXHJcblx0XHRcdFx0cmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsocmV0dXJuX3Jlc3VsdCkpXHJcblx0XHRcdFx0Ly9yZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuay5hcHBseShjb250ZXh0LCBbcmV0dXJuX3Jlc3VsdF0pKVxyXG5cdFx0XHR9LCB1bmRlZmluZWQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblx0bW9kdWxlLmV4cG9ydHMgPSBmLy8tLVxyXG4iLCJleHBvcnRzLnBoYXRNYXAgPSBmdW5jdGlvbiBwaGF0TWFwKGZ1bmspe1xyXG4gICAgICAgIGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpXHJcbn1cclxuXHJcbmV4cG9ydHMuZmxhdE1hcCA9IGZ1bmN0aW9uIGZsYXRNYXAoZnVuaykge1xyXG4gICAgICAgIGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcbn1cclxuZXhwb3J0cy5wcmludCA9IGZ1bmN0aW9uIHByaW50ICgpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMudG9TdHJpbmcoKSlcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG59XHJcblxyXG4iLCJcclxuXHJcbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuXHJcbnZhciBtZXRob2RzID0gey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCBwdXRzIGl0IGluIGEgbGlzdC5cclxuXHJcblx0XHQvL2Eub2YoYikgLT4gYiBhXHJcblx0XHRvZjogdmFsID0+IGxpc3QodmFsKSxcclxuXHJcbi8vYG1hcGAgYXBwbGllcyBhIGZ1bmN0aW9uIHRvIGVhY2ggZWxlbWVudCBvZiB0aGUgbGlzdCwgYXMgdGhlIG9uZSBmcm9tIHRoZSBBcnJheSBwcm90b3R5cGVcclxuXHRcdFxyXG4vL2BmbGF0YCB0YWtlcyBhIGxpc3Qgb2YgbGlzdHMgYW5kIGZsYXR0ZW5zIHRoZW0gd2l0aCBvbmUgbGV2ZWwgXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkuam9pbigpID0gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBsaXN0KCB0aGlzLnJlZHVjZSgobGlzdCwgZWxlbWVudCkgPT4gWy4uLmxpc3QsIC4uLmVsZW1lbnRdLCBbXSkgKVxyXG5cdFx0fSxcclxuXHRcdFxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgXHJcbi8vYW5kIHdpdGggaXQsIHlvdXIgZnVuayBjYW4gcmV0dXJuIGJvdGggYSBsaXN0IG9mIG9iamVjdHMgYW5kIGEgc2luZ2xlIG9iamVjdFxyXG5cclxuXHRcdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoIHRoaXMucmVkdWNlKChsaXN0LCBlbGVtZW50KSA9PiBcclxuXHRcdFx0XHRlbGVtZW50LmNvbnN0cnVjdG9yID09PSBBcnJheT8gWy4uLmxpc3QsIC4uLmVsZW1lbnRdIDogWy4uLmxpc3QsIGVsZW1lbnRdICwgW10pXHJcblx0XHRcdClcclxuXHRcdH0sXHJcblx0XHRmdW5rdGlvblR5cGU6XCJsaXN0XCIvLy0tXHJcblxyXG5cdH0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcblxyXG4vL0FkZCBzdXBwb3J0IGZvciBhcnJheSBleHRyYXMsIHNvIHRoYXQgdGhleSByZXR1cm4gYSBsaXN0IGluc3RlYWQgb2Ygbm9ybWFsIEFycmF5XHJcblxyXG52YXIgYXJyYXlNZXRob2RzID0ge31cclxuXHJcbi8vU29tZSBmdW5jdGlvbnMgYXJlIGRpcmVjdGx5IGxpZnRlZCBmcm9tIHRoZSBBcnJheSBwcm90b3R5cGVcclxuXHJcbnZhciBpbW11dGFibGVGdW5jdGlvbnMgPSBbJ21hcCcsICdjb25jYXQnXVxyXG5cclxuaW1tdXRhYmxlRnVuY3Rpb25zLmZvckVhY2goKGZ1bmspID0+IHsgXHJcblx0YXJyYXlNZXRob2RzW2Z1bmtdID0gZnVuY3Rpb24oLi4uYXJncyl7XHJcblx0XHRcdHJldHVybiBsaXN0KEFycmF5LnByb3RvdHlwZVtmdW5rXS5hcHBseSh0aGlzLCBhcmdzKSlcclxuXHR9XHJcbn0pXHJcblxyXG4vL1RoZSB0eXBlIGFsc28gd3JhcHMgc29tZSBBcnJheSBmdW5jdGlvbnMgaW4gYSB3YXkgdGhhdCBtYWtlcyB0aGVtIGltbXV0YWJsZVxyXG5cclxudmFyIG11dGFibGVGdW5jdGlvbnMgPSBbJ3NwbGljZScsICdyZXZlcnNlJywgJ3NvcnQnXVxyXG5cclxubXV0YWJsZUZ1bmN0aW9ucy5mb3JFYWNoKChmdW5rKSA9PiB7IFxyXG5cdGFycmF5TWV0aG9kc1tmdW5rXSA9IGZ1bmN0aW9uKC4uLmFyZ3Mpe1xyXG5cdFx0XHR2YXIgbmV3QXJyYXkgPSB0aGlzLnNsaWNlKDApXHJcblx0XHRcdEFycmF5LnByb3RvdHlwZVtmdW5rXS5hcHBseShuZXdBcnJheSwgYXJncylcclxuXHRcdFx0cmV0dXJuIG5ld0FycmF5XHJcblx0fVxyXG59KVxyXG5cclxuZXh0ZW5kKG1ldGhvZHMsIGFycmF5TWV0aG9kcylcclxuXHJcbm1ldGhvZHMuZXh0cmFzID0gW11cclxuXHJcbi8vVGhpcyBpcyB0aGUgbGlzdCBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgbm9ybWFsIGFycmF5IGFuZCBhdWdtZW50cyBpdCB3aXRoIHRoZSBhYm92ZSBtZXRob2RzXHJcblx0XHJcblx0dmFyIGxpc3QgPSAoLi4uYXJncykgPT4ge1xyXG5cdFx0aWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXS5mdW5rdGlvblR5cGUgPT09IFwibGlzdFwiKXtcclxuXHRcdFx0cmV0dXJuIGFyZ3NbMF1cclxuXHRcdC8vQWNjZXB0IGFuIGFycmF5XHJcblx0XHR9ZWxzZSBpZihhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdLmNvbnN0cnVjdG9yID09PSBBcnJheSApe1xyXG5cdFx0XHRyZXR1cm4gIE9iamVjdC5mcmVlemUoZXh0ZW5kKGFyZ3NbMF0sIG1ldGhvZHMpKVxyXG5cdFx0Ly9BY2NlcHQgc2V2ZXJhbCBhcmd1bWVudHNcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShleHRlbmQoYXJncywgbWV0aG9kcykpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9IZXJlIGlzIHRoZSBmdW5jdGlvbiB3aXRoIHdoaWNoIHRoZSBsaXN0IG9iamVjdCBpcyBleHRlbmRlZFxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3QvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy9UaGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIHdyYXBzIGl0IGluIGEgYG1heWJlYC5cclxuLy9JbiB0aGlzIGNhc2Ugd2UgZG8gdGhpcyBieSBqdXN0IGNhbGxpbmcgdGhlIGNvbnN0cnVjdG9yLlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24oaW5wdXQpe1xyXG5cdFx0cmV0dXJuIG1heWJlKGlucHV0KVxyXG5cdH0sXHJcblxyXG4vL2BtYXBgIHRha2VzIHRoZSBmdW5jdGlvbiBhbmQgYXBwbGllcyBpdCB0byB0aGUgdmFsdWUgaW4gdGhlIG1heWJlLCBpZiB0aGVyZSBpcyBvbmUuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0aWYodGhpcyAhPT0gbm90aGluZyl7XHJcblx0XHRcdHJldHVybiBtYXliZShmdW5rKHRoaXMuX3ZhbHVlKSlcclxuXHRcdH1lbHNle1x0XHJcblx0XHRcdHJldHVybiB0aGlzIFxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL2BmbGF0YCB0YWtlcyBhIG1heWJlIHRoYXQgY29udGFpbnMgYW5vdGhlciBtYXliZSBhbmQgZmxhdHRlbnMgaXQuXHJcbi8vSW4gdGhpcyBjYXNlIHRoaXMgbWVhbnMganVzdCByZXR1cm5pbmcgdGhlIGlubmVyIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0aWYodGhpcyAhPT0gbm90aGluZyl7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fSxcclxuXHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGAgXHJcblxyXG5cdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcgJiYgdGhpcy5fdmFsdWUuZnVua3Rpb25UeXBlID09PSBcIm1heWJlXCIpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH0sXHJcblx0XHJcblx0ZnVua3Rpb25UeXBlOlwibWF5YmVcIiwvLy0tXHJcblxyXG4vL0ZpbmFsbHksIHRoZSB0eXBlIGhhcyBzb21lIGhlbHBlciBmdW5jdGlvbnM6XHJcblxyXG5cdGZpbHRlcjpmdW5jdGlvbiBmaWx0ZXIgKGZ1bmspe1xyXG5cdFx0cmV0dXJuIGZ1bmsodGhpcy5fdmFsdWUpID8gdGhpcyA6IG5vdGhpbmdcclxuXHR9LFxyXG5cclxuXHRyZWR1Y2U6ZnVuY3Rpb24gcmVkdWNlIChmdW5rKXtcclxuXHRcdHJldHVybiBmdW5rKHRoaXMuX3ZhbHVlKVxyXG5cdH0sXHJcblxyXG4gICAgICAgIGdldFByb3A6ZnVuY3Rpb24gZ2V0UHJvcCAocHJvcCl7XHJcblx0XHRyZXR1cm4gdGhpcy5waGF0TWFwKCAodmFsKSA9PiB0aGlzLm9mKHZhbFtwcm9wXSkgKVxyXG5cdH0sXHJcblxyXG5cclxuXHRcclxuICAgIH0vLy0tXHJcblxyXG5tZXRob2RzLmV4dHJhcyA9IFttZXRob2RzLmdldFByb3BdXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgbWF5YmUgY29uc3RydWN0b3IgaXMgaW1wbGVtZW50ZWRcclxuXHJcblxyXG5cdHZhciBtYXliZSA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRcdGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKXtcclxuXHRcdFx0cmV0dXJuIG5vdGhpbmdcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR2YXIgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG5cdFx0XHRvYmouX3ZhbHVlID0gdmFsdWVcclxuXHRcdFx0b2JqLmNvbnN0cnVjdG9yID0gbWF5YmVcclxuXHRcdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRcdHJldHVybiBvYmpcclxuXHRcdH1cclxuXHR9XHJcblxyXG52YXIgbm90aGluZyA9IE9iamVjdC5jcmVhdGUobWV0aG9kcykvLy0tXHJcbm5vdGhpbmcuY29uc3RydWN0b3IgPSBtYXliZS8vLS1cclxuT2JqZWN0LmZyZWV6ZShub3RoaW5nKS8vLS1cclxubWF5YmUubm90aGluZyA9IG5vdGhpbmcvLy0tXHJcblxyXG5tYXliZS5wcm90b3R5cGUgPSBtZXRob2RzXHJcbm1vZHVsZS5leHBvcnRzID0gbWF5YmUvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIG1heWJlID0gcmVxdWlyZShcIi4vbWF5YmVcIikvLy0tXHJcbnZhciBtZXRob2RzID0gey8vLS1cclxuXHJcbi8vVGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIGBtYXliZWAuXHJcbi8vSW4gdGhpcyBjYXNlIHdlIGRvIHRoaXMgYnkganVzdCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3Rvci5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuICAgICAgICAgICAgcmV0dXJuIG1heWJlVChpbnB1dClcclxuXHR9LFxyXG5cclxuLy9gbWFwYCB0YWtlcyB0aGUgZnVuY3Rpb24gYW5kIGFwcGxpZXMgaXQgdG8gdGhlIHZhbHVlIGluIHRoZSBtYXliZSwgaWYgdGhlcmUgaXMgb25lLlxyXG5cclxuXHQvL20gbWF5YmUgYSAtPiAoIGEgLT4gbWF5YmUgYiApIC0+IG0gbWF5YmUgYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuICAgICAgICAgICAgcmV0dXJuIG1heWJlVCggdGhpcy5fdmFsdWUubWFwKCh2YWwpID0+IHtcclxuICAgICAgICAgICAgICAgcmV0dXJuIHZhbCA9PT0gdW5kZWZpbmVkPyB2YWw6ZnVuayh2YWwpXHJcbiAgICAgICAgICAgIH0pIClcclxuXHR9LFxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgcmV0dXJuIG1heWJlVCh0aGlzLl92YWx1ZS5tYXAoICh2YWwpID0+e1xyXG5cdFx0XHRyZXR1cm4gdmFsLl92YWx1ZVxyXG4gICAgICAgICAgICB9KSlcclxuXHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICByZXR1cm4gbWF5YmVUKHRoaXMuX3ZhbHVlLm1hcCggKHZhbCkgPT57XHJcblx0XHRpZih2YWwuZnVua3Rpb25UeXBlID09PSBcIm1heWJlVFwiKXtcclxuXHRcdFx0cmV0dXJuIHZhbC5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdmFsXHJcblx0XHR9XHJcbiAgICAgICAgICAgIH0pKVxyXG5cdH0sXHJcbiAgICAgICAgbGlmdDpmdW5jdGlvbihmdW5rLCAuLi5hcmdzKXtcclxuICAgICAgICAgICAgaWYodHlwZW9mIGZ1bmsgPT09ICdmdW5jdGlvbicpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1heWJlVChmdW5rKHRoaXMuX3ZhbHVlKSlcclxuICAgICAgICAgICAgfWVsc2UgaWYgKHR5cGVvZiBmdW5rID09PSAnc3RyaW5nJyl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF5YmVUKHRoaXMuX3ZhbHVlW2Z1bmtdKC4uLmFyZ3MpKVxyXG4gICAgICAgICAgICB9ICAgICAgICBcclxuICAgICAgICB9LFx0XHJcblx0ZnVua3Rpb25UeXBlOlwibWF5YmVUXCIvLy0tXHJcblx0XHJcbiAgICB9Ly8tLVxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIG1heWJlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcbiAgICBtYXliZS5wcm90b3R5cGUuZXh0cmFzLmZvckVhY2goKG1ldGhvZCkgPT4ge1xyXG4gICAgICAgIG1ldGhvZHNbbWV0aG9kLm5hbWVdID0gbWV0aG9kXHJcbiAgICB9KVxyXG5cclxuLy9BZGQgYWxpYXNlcyB0byBtYXAgLiBmbGF0IGFzIGZsYXRNYXAgYW5kIG1hcCAuIHRyeUZsYXQgYXMgcGhhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMuZmxhdE1hcCA9IGhlbHBlcnMuZmxhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMucGhhdE1hcCA9IGhlbHBlcnMucGhhdE1hcFxyXG5cclxuLy9BZGQgYSBwcmludCBmdW5jdGlvbiwgdXNlZCBmb3IgZGVidWdnaW5nLlxyXG4gICAgICAgIG1ldGhvZHMucHJpbnQgPSBoZWxwZXJzLnByaW50XHJcblxyXG5cdHZhciBtYXliZVQgPSBmdW5jdGlvbihtb25hZFZhbHVlKXtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcbiAgICAgICAgICAgICAgICBvYmouX3ZhbHVlID0gbW9uYWRWYWx1ZVxyXG4gICAgICAgICAgICAgICAgb2JqLmNvbnN0cnVjdG9yID0gbWF5YmVUXHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZnJlZXplKG9iailcclxuICAgICAgICAgICAgICAgIHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1heWJlVC8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL1RoZSBgb2ZgIG1ldGhvZCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIHByb21pc2UsIGJ5IGltbWVkaWF0ZWx5IGNhbGxpbmcgdGhlIHJlc29sdmVyIGZ1bmN0aW9uIHdpdGggaXQuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbih2YWwpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiByZXNvbHZlKHZhbCkgKVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgbWFwYCBtZXRob2QgY3JlYXRlcyBhIG5ldyBwcm9taXNlLCBzdWNoIHRoYXQgd2hlbiB0aGUgb2xkIHByb21pc2UgaXMgcmVzb2x2ZWQsIGl0IHRha2VzIGl0cyByZXN1bHQsIFxyXG4vL2FwcGxpZXMgYGZ1bmtgIHRvIGl0IGFuZCB0aGVuIHJlc29sdmVzIGl0c2VsZiB3aXRoIHRoZSB2YWx1ZS5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IHRoaXMuX3Jlc29sdmVyKCAodmFsKSA9PiByZXNvbHZlKCBmdW5rKHZhbCkgKSApIClcclxuXHJcblx0fSxcclxuXHJcbi8vSW4gdGhpcyBjYXNlIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBgZmxhdGAgaXMgcXVpdGUgc2ltcGxlLlxyXG5cclxuLy9FZmZlY3RpdmVseSBhbGwgd2UgaGF2ZSB0byBkbyBpcyByZXR1cm4gdGhlIHNhbWUgdmFsdWUgd2l0aCB3aGljaCB0aGUgaW5uZXIgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoLlxyXG4vL1RvIGRvIHRoaXMsIHdlIHVud3JhcCBvdXIgcHJvbWlzZSBvbmNlIHRvIGdldCB0aGUgaW5uZXIgcHJvbWlzZSB2YWx1ZSwgYW5kIHRoZW4gdW53cmFwIHRoZSBpbm5lclxyXG4vL3Byb21pc2UgaXRzZWxmIHRvIGdldCBpdHMgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IFxyXG5cdFx0XHR0aGlzLl9yZXNvbHZlcihcdChpbm5lcl9wcm9taXNlKSA9PiBcclxuXHRcdFx0XHRpbm5lcl9wcm9taXNlLl9yZXNvbHZlcigodmFsKSA9PiByZXNvbHZlKHZhbCkpXHJcblx0XHRcdCkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGB0cnlGbGF0YCBmdW5jdGlvbiBpcyBhbG1vc3QgdGhlIHNhbWU6XHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IFxyXG5cdFx0XHR0aGlzLl9yZXNvbHZlcihcdChpbm5lcl9wcm9taXNlKSA9PiB7IFxyXG5cdFx0XHRcdGlmKGlubmVyX3Byb21pc2UuY29uc3RydWN0b3IgPT09IHByb21pc2Upe1xyXG5cdFx0XHRcdFx0aW5uZXJfcHJvbWlzZS5fcmVzb2x2ZXIoKHZhbCkgPT4gcmVzb2x2ZSh2YWwpKVxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cmVzb2x2ZShpbm5lcl9wcm9taXNlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGBydW5gIGZ1bmN0aW9uIGp1c3QgZmVlZHMgdGhlIHJlc29sdmVyIHdpdGggYSBwbGFjZWhvbGRlciAgZnVuY3Rpb24gc28gb3VyIGNvbXB1dGF0aW9uIGNhblxyXG4vL3N0YXJ0IGV4ZWN1dGluZy5cclxuXHJcblx0cnVuOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcmVzb2x2ZXIoZnVuY3Rpb24oYSl7cmV0dXJuIGF9KVxyXG5cdH1cclxuXHRcclxuICAgIH0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHByb21pc2UgPSBmdW5jdGlvbihyZXNvbHZlKXtcclxuXHRcdGlmKHR5cGVvZiByZXNvbHZlICE9PSBcImZ1bmN0aW9uXCIpeyByZXR1cm4gbWV0aG9kcy5vZihyZXNvbHZlKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcblxyXG5cdFx0b2JqLl9yZXNvbHZlciA9IHJlc29sdmVcclxuXHRcdG9iai5jb25zdHJ1Y3RvciA9IHByb21pc2VcclxuXHRcdG9iai5wcm90b3R5cGUgPSBtZXRob2RzXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByb21pc2UvLy0tXHJcbiIsIlxyXG5jb25zdCBmID0gcmVxdWlyZShcIi4vZlwiKS8vLS1cclxuXHJcbmNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuY29uc3QgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL2BvZmAganVzdCB1c2VzIHRoZSBjb25zdHJ1Y3RvciBhbmQgZG9lcyBub3QgdG91Y2ggdGhlIHN0YXRlLlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24oaW5wdXQpe1xyXG5cdFx0cmV0dXJuIHN0YXRlKChwcmV2U3RhdGUpID0+IFtpbnB1dCwgcHJldlN0YXRlXSlcclxuXHR9LFxyXG5cclxuLy9gbWFwYCBpcyBkb25lIGJ5IGFwcGx5aW5nIHRoZSBmdW5jdGlvbiB0byB0aGUgdmFsdWUgYW5kIGtlZXBpbmcgdGhlIHN0YXRlIHVuY2hhbmdlZC5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RhdGUoIHRoaXMuX3J1blN0YXRlLm1hcCgoW2lucHV0LCBwcmV2U3RhdGVdKSA9PiBbZnVuayhpbnB1dCksIHByZXZTdGF0ZV0pKVxyXG5cdH0sXHJcblx0XHJcbi8vYGZsYXRgIGRvZXMgdGhlIGZvbGxvd2luZzpcclxuLy8xLiBSdW5zIHRoZSBjb2RlIHRoYXQgd2UgbG9hZGVkIGluIHRoZSBtb25hZCBzbywgZmFyICh1c2luZyB0aGUgYHJ1bmAgZnVuY3Rpb24pLlxyXG4vLzIuIFNhdmVzIHRoZSBuZXcgc3RhdGUgb2JqZWN0IGFuZCB0aGUgdmFsdWUgd2hpY2ggaXMga2VwdCBieSB0aGUgZnVuY3Rpb25zIHNvIGZhci5cclxuLy8zLiBBZnRlciBkb2luZyB0aGF0LCBpdCBhcnJhbmdlcyB0aG9zZSB0d28gY29tcG9uZW50cyAodGhlIG9iamVjdCBhbmQgdGhlIHZhbHVlKSBpbnRvIGEgeWV0IGFub3RoZXJcclxuLy9zdGF0ZSBvYmplY3QsIHdoaWNoIHJ1bnMgdGhlIG11dGF0b3IgZnVuY3Rpb24gb2YgdGhlIGZpcnN0IG9iamVjdCwgd2l0aCB0aGUgc3RhdGUgdGhhdCB3ZSBoYXZlIHNvLCBmYXJcclxuXHJcblxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0Ly9FeHRyYWN0IHN0YXRlIG11dGF0b3IgYW5kIHZhbHVlIFxyXG5cdFx0Y29uc3QgW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdID0gdGhpcy5ydW4oKVxyXG5cdFx0Ly9Db21wb3NlIHRoZSBtdXRhdG9yIGFuZCB0aGUgdmFsdWVcclxuXHRcdHJldHVybiBzdGF0ZSgoKSA9PiBzdGF0ZU9iai5fcnVuU3RhdGUoY3VycmVudFN0YXRlKSApXHJcblx0fSxcclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9FeHRyYWN0IGN1cnJlbnQgc3RhdGUgXHJcblx0XHRjb25zdCBbc3RhdGVPYmosIGN1cnJlbnRTdGF0ZV0gPSB0aGlzLnJ1bigpXHJcblx0XHRcclxuXHRcdC8vQ2hlY2sgaWYgaXQgaXMgcmVhbGx5IGEgc3RhdGVcclxuXHRcdGlmKHN0YXRlT2JqLmNvbnN0cnVjdG9yID09PSBzdGF0ZSl7XHJcblx0XHRcdHJldHVybiBzdGF0ZSgoKSA9PiBzdGF0ZU9iai5fcnVuU3RhdGUoY3VycmVudFN0YXRlKSApXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHN0YXRlKCgpID0+IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSlcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9XZSBoYXZlIHRoZSBgcnVuYCBmdW5jdGlvbiB3aGljaCBjb21wdXRlcyB0aGUgc3RhdGU6XHJcblxyXG5cdHJ1bjpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuX3J1blN0YXRlKClcclxuXHR9LFxyXG4vL0FuZCB0aGUgYHNhdmVgIGFuZCBgbG9hZGAgZnVuY3Rpb25zIGFyZSBleGFjdGx5IHdoYXQgb25lIHdvdWxkIGV4cGVjdFxyXG5cclxuXHRsb2FkOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHRoaXMuY29uc3RydWN0b3IoIChzdGF0ZSkgPT4gW3N0YXRlLCBzdGF0ZV0gKSApXHJcblx0fSxcclxuXHRzYXZlOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHRoaXMuY29uc3RydWN0b3IoIChzdGF0ZSkgPT4gW3ZhbHVlLCB2YWx1ZV0gKSApXHJcblx0fSxcclxuXHRsb2FkS2V5OmZ1bmN0aW9uKGtleSl7XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHRoaXMuY29uc3RydWN0b3IoIChzdGF0ZSkgPT4gW3N0YXRlW2tleV0sIHN0YXRlXSApIClcclxuXHR9LFxyXG5cdHNhdmVLZXk6ZnVuY3Rpb24oa2V5KXtcclxuXHRcdGNvbnN0IHdyaXRlID0gKG9iaiwga2V5LCB2YWwpID0+IHtcclxuXHRcdFx0b2JqID0gdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiA/ICBvYmogOiB7fVxyXG5cdFx0XHRvYmpba2V5XSA9IHZhbFxyXG5cdFx0XHRyZXR1cm4gb2JqXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHRoaXMuY29uc3RydWN0b3IoIChzdGF0ZSkgPT4gW3ZhbHVlLCB3cml0ZShzdGF0ZSwga2V5LCB2YWx1ZSldICkgKVxyXG5cdH1cclxuXHRcclxuICAgIH0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBzdGF0ZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHRjb25zdCBzdGF0ZSA9IG1ldGhvZHMuY29uc3RydWN0b3IgPSBmdW5jdGlvbihydW4pe1xyXG5cdFx0aWYodHlwZW9mIHJ1biAhPT0gXCJmdW5jdGlvblwiKXsgcmV0dXJuIG1ldGhvZHMub2YocnVuKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcblx0XHRvYmouX3J1blN0YXRlID0gZihydW4sMSlcclxuXHRcdG9iai5wcm90b3R5cGUgPSBtZXRob2RzXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlLy8tLVxyXG4iLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcbnZhciBtZXRob2RzID0gey8vLS1cclxuXHJcbi8vVGhlIGBvZmAgbWV0aG9kIHRha2VzIGEgdmFsdWUgYW5kIHdyYXBzIGl0IGluIGEgc3RyZWFtLCBieSBpbW1lZGlhdGVseSBjYWxsaW5nIHRoZSBwdXNoZXIgZnVuY3Rpb24gd2l0aCBpdC5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKHZhbCl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gcHVzaCh2YWwpIClcclxuXHR9LFxyXG5cclxuLy9UaGUgYG1hcGAgbWV0aG9kIGNyZWF0ZXMgYSBuZXcgc3RyZWFtLCBzdWNoIHRoYXQgZXZlcnkgdGltZSB0aGUgb2xkIHN0cmVhbSByZWNlaXZlcyBhIHZhbHVlLCBpdFxyXG4vL2FwcGxpZXMgYGZ1bmtgIHRvIGl0IGFuZCB0aGVuIHB1c2hlcyBpdCB0byB0aGUgbmV3IHN0cmVhbS5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gdGhpcy5fcHVzaGVyKCAodmFsKSA9PiBwdXNoKCBmdW5rKHZhbCkgKSApIClcclxuXHJcblx0fSxcclxuXHJcblxyXG4vL0luIHRoaXMgY2FzZSB0aGUgaW1wbGVtZW50YXRpb24gb2YgYGZsYXRgIGlzIHF1aXRlIHNpbXBsZS5cclxuXHJcbi8vRWZmZWN0aXZlbHkgYWxsIHdlIGhhdmUgdG8gZG8gaXMgcmV0dXJuIHRoZSBzYW1lIHZhbHVlIHdpdGggd2hpY2ggdGhlIGlubmVyIHN0cmVhbSBpcyBwdXNoZCB3aXRoLlxyXG4vL1RvIGRvIHRoaXMsIHdlIHVud3JhcCBvdXIgc3RyZWFtIG9uY2UgdG8gZ2V0IHRoZSBpbm5lciBzdHJlYW0gdmFsdWUsIGFuZCB0aGVuIHVud3JhcCB0aGUgaW5uZXJcclxuLy9zdHJlYW0gaXRzZWxmIHRvIGdldCBpdHMgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gXHJcblx0XHRcdHRoaXMuX3B1c2hlcihcdChpbm5lcl9zdHJlYW0pID0+IFxyXG5cdFx0XHRcdGlubmVyX3N0cmVhbS5fcHVzaGVyKCh2YWwpID0+IHB1c2godmFsKSlcclxuXHRcdFx0KSBcclxuXHRcdClcclxuXHR9LFxyXG5cclxuLy9UaGUgYHRyeUZsYXRgIGZ1bmN0aW9uIGlzIGFsbW9zdCB0aGUgc2FtZTpcclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiBcclxuXHRcdFx0dGhpcy5fcHVzaGVyKFx0KGlubmVyX3N0cmVhbSkgPT4geyBcclxuXHRcdFx0XHRpZihpbm5lcl9zdHJlYW0uY29uc3RydWN0b3IgPT09IHN0cmVhbSl7XHJcblx0XHRcdFx0XHRpbm5lcl9zdHJlYW0uX3B1c2hlcigodmFsKSA9PiBwdXNoKHZhbCkpXHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRwdXNoKGlubmVyX3N0cmVhbSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgcnVuYCBmdW5jdGlvbiBqdXN0IGZlZWRzIHRoZSBwdXNoZXIgd2l0aCBhIHBsYWNlaG9sZGVyICBmdW5jdGlvbiBzbyBvdXIgY29tcHV0YXRpb24gY2FuXHJcbi8vc3RhcnQgZXhlY3V0aW5nLlxyXG5cclxuXHRydW46ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLl9wdXNoZXIoZnVuY3Rpb24oYSl7cmV0dXJuIGF9KVxyXG5cdH0sXHJcblx0XHJcbi8vQWZ0ZXIgdGhlc2UgYXJlIGRvbmUsIGFsbCB3ZSBuZWVkIHRvIGRvIGlzIGltcGxlbWVudCB0aGUgdHJhZGl0aW9uYWwgSlMgYXJyYXkgZnVuY3Rpb25zXHJcblxyXG4vL2BGb3JFYWNoYCBpcyBhbG1vc3QgdGhlIHNhbWUgYXMgYG1hcGAsIGV4Y2VwdCB3ZSBkb24ndCBwdXNoIGBmdW5rKHZhbClgIC0gdGhlIHJlc3VsdCBvZiB0aGUgdHJhbnNmb3JtYXRpb25cclxuLy90byB0aGUgbmV3IHN0cmVhbSwgYnV0IHdlIHB1c2ggYHZhbGAgaW5zdGVhZC5cclxuXHJcblx0Zm9yRWFjaDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiB0aGlzLl9wdXNoZXIoICh2YWwpID0+IHsgXHJcblx0XHRcdHB1c2godmFsKSBcclxuXHRcdFx0ZnVuayh2YWwpXHJcblx0XHR9ICkgKVxyXG5cdH0sXHJcblxyXG4vL1dpdGggZmlsdGVyIHRoZSByZXN1bHQgb2YgYGZ1bmsodmFsKWAgc2hvd3MgdXMgd2hldGhlciB3ZSBuZWVkIHRvIHB1c2ggdGhlIHZhbHVlXHJcblxyXG5cdGZpbHRlcjpmdW5jdGlvbihmdW5rKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiB0aGlzLl9wdXNoZXIoICh2YWwpID0+IHsgXHJcblx0XHRcdGlmKGZ1bmsodmFsKSl7cHVzaCh2YWwpfVxyXG5cdFx0fSApIClcclxuXHR9LFxyXG5cclxuXHRyZWR1Y2U6ZnVuY3Rpb24oZnVuaywgZnJvbSl7XHJcblx0XHRsZXQgYWNjdW11bGF0b3IgPSBmcm9tXHJcblx0XHR0aGlzLl9wdXNoZXIodmFsID0+IHtcclxuXHRcdFx0YWNjdW11bGF0b3IgPSBmdW5rKGFjY3VtdWxhdG9yLCB2YWwpIFxyXG5cdFx0fSlcclxuXHR9LFxyXG59Ly8tLVxyXG5cclxuLy9BZGQgYWxpYXNlcyB0byBtYXAgLiBmbGF0IGFzIGZsYXRNYXAgYW5kIG1hcCAuIHRyeUZsYXQgYXMgcGhhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMuZmxhdE1hcCA9IGhlbHBlcnMuZmxhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMucGhhdE1hcCA9IGhlbHBlcnMucGhhdE1hcFxyXG5cclxuLy9BZGQgYSBwcmludCBmdW5jdGlvbiwgdXNlZCBmb3IgZGVidWdnaW5nLlxyXG4gICAgICAgIG1ldGhvZHMucHJpbnQgPSBoZWxwZXJzLnByaW50XHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgc3RyZWFtIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHN0cmVhbSA9IGZ1bmN0aW9uKHB1c2gpe1xyXG5cdFx0aWYodHlwZW9mIHB1c2ggIT09IFwiZnVuY3Rpb25cIil7IHJldHVybiBtZXRob2RzLm9mKHB1c2gpIH1cclxuXHRcdGNvbnN0IG9iaiA9IE9iamVjdC5jcmVhdGUobWV0aG9kcylcclxuXHJcblx0XHRvYmouX3B1c2hlciA9IHB1c2hcclxuXHRcdG9iai5jb25zdHJ1Y3RvciA9IHN0cmVhbVxyXG5cdFx0b2JqLnByb3RvdHlwZSA9IG1ldGhvZHNcclxuXHRcdE9iamVjdC5mcmVlemUob2JqKVxyXG5cdFx0cmV0dXJuIG9ialxyXG5cdH1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc3RyZWFtXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogZnVuY3Rpb25cclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGZ1bmN0aW9uIG1vbmFkIGF1Z21lbnRzIHN0YW5kYXJkIEphdmFTY3JpcHQgZnVuY3Rpb25zIHdpdGggZmFjaWxpdGllcyBmb3IgY29tcG9zaXRpb24gYW5kIGN1cnJ5aW5nLlxyXG48IS0tbW9yZS0tPlxyXG5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiZnVuY3Rpb25zXCIpLy8tLVxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjb25zdHJ1Y3QgZnVuY3Rpb25zIGxpbmUgdGhpc1xyXG5cdFxyXG5cdFx0dmFyIHBsdXNfMSA9IGYoIChudW0pID0+IG51bSsxIClcclxuXHJcblxyXG4vL0FmdGVyIHlvdSBkbyB0aGF0LCB5b3Ugd2lsbCBzdGlsbCBiZSBhYmxlIHRvIHVzZSBgcGx1c18xYCBsaWtlIGEgbm9ybWFsIGZ1bmN0aW9uLCBidXQgeW91IGNhbiBhbHNvIGRvIHRoZSBmb2xsb3dpbmc6XHJcblxyXG5cclxuLypcclxuQ3VycnlpbmdcclxuLS0tLVxyXG5XaGVuIHlvdSBjYWxsIGEgZnVuY3Rpb24gYGZgIHdpdGggbGVzcyBhcmd1bWVudHMgdGhhdCBpdCBhY2NlcHRzLCBpdCByZXR1cm5zIGEgcGFydGlhbGx5IGFwcGxpZWRcclxuKGJvdW5kKSB2ZXJzaW9uIG9mIGl0c2VsZiB0aGF0IG1heSBhdCBhbnkgdGltZSBiZSBjYWxsZWQgd2l0aCB0aGUgcmVzdCBvZiB0aGUgYXJndW1lbnRzLlxyXG4qL1xyXG5cclxuXHRRVW5pdC50ZXN0KFwiY3VycnlcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRjb25zdCBhZGQzID0gZiggKGEsYixjKSA9PiBhK2IrYyApXHJcblx0XHRcclxuXHRcdGNvbnN0IGFkZDIgPSBhZGQzKDApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGFkZDIoMSwgMSksIDIgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBhZGQyKDUsIDUpLCAxMCApXHJcblxyXG5cdFx0Y29uc3QgcGx1czEwID0gYWRkMigxMClcclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czEwKDUpLCAxNSApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMxMCgxMCksIDIwIClcclxuXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxuYG9mKHZhbHVlKWBcclxuLS0tLVxyXG5JZiBjYWxsZWQgd2l0aCBhIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBpdCBjb25zdHJ1Y3RzIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGF0IHZhbHVlLlxyXG5JZiBjYWxsZWQgd2l0aG91dCBhcmd1bWVudHMgaXQgcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgdGhlIGFyZ3VtZW50cyBnaXZlbiB0byBpdC5cclxuKi9cclxuXHRRVW5pdC50ZXN0KFwib2ZcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRjb25zdCByZXR1cm5zOSA9IGYoKS5vZig5KVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCByZXR1cm5zOSgzKSwgOSApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHJldHVybnM5KFwiYVwiKSwgOSApXHJcblxyXG5cdFx0Y29uc3QgaWQgPSBmKCkub2YoKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBpZCgzKSwgMyApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGlkKFwiYVwiKSwgXCJhXCIgKVxyXG5cclxuXHR9KS8vLS1cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5DcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGZpcnN0LCB0aGVuIGNhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50OlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRcclxuLy9Zb3UgY2FuIGNyZWF0ZSBhIEZ1bmN0aW9uIE1vbmFkIGJ5IHBhc3NpbmcgYSBub3JtYWwgSmF2YVNjcmlwdCBmdW5jdGlvbiB0byB0aGUgY29uc3RydWN0b3IgKHlvdSBjYW4gd3JpdGUgdGhlIGZ1bmN0aW9uIGRpcmVjdGx5IHRoZXJlKTpcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXMxID0gZiggbnVtID0+IG51bSsxIClcclxuXHJcblxyXG4vL1RoZW4gbWFraW5nIGFub3RoZXIgZnVuY3Rpb24gaXMgZWFzeTpcclxuXHJcblx0XHR2YXIgcGx1czIgPSBwbHVzMS5tYXAocGx1czEpIFxyXG5cclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czIoMCksIDIgKVxyXG5cdFx0XHJcblx0XHR2YXIgcGx1czQgPSBwbHVzMi5tYXAocGx1czIpXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzNCgxKSwgNSApXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAgZXhjZXB0IHRoYXQgaWYgYGZ1bmtgIHJldHVybnMgYW5vdGhlciBmdW5jdGlvbiBpdCByZXR1cm5zIGEgdGhpcmQgZnVuY3Rpb24gd2hpY2g6XHJcbjEuIENhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdC5cclxuMi4gQ2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnRcclxuMy4gQ2FsbHMgdGhlIGZ1bmN0aW9uIHJldHVybmVkIGJ5IGBmdW5rYCB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50IGFuZCByZXR1cm5zIHRoZSByZXN1bHQgb2YgdGhlIHNlY29uZCBjYWxsLlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9Zb3UgY2FuIHVzZSBgcGhhdE1hcGAgdG8gbW9kZWwgc2ltcGxlIGlmLXRoZW4gc3RhdGVtZW50cy4gVGhlIGZvbGxvd2luZyBleGFtcGxlIHVzZXMgaXQgaW4gY29tYmluYXRpb24gb2YgdGhlIGN1cnJ5aW5nIGZ1bmN0aW9uYWxpdHk6XHJcblx0XHRcclxuXHRcdHZhciBjb25jYXQgPSBmKCAoc3RyMSwgc3RyMikgPT4gc3RyMSArIHN0cjIpXHJcblxyXG5cdFx0dmFyIG1ha2VNZXNzYWdlID0gZihwYXJzZUludCwgMSlcclxuXHRcdFx0LmZsYXRNYXAoKG51bSkgPT4gaXNOYU4obnVtKT8gZihcIkVycm9yLiBOb3QgYSBudW1iZXJcIikgOiBjb25jYXQoXCJUaGUgbnVtYmVyIGlzIFwiKSApXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIjFcIiksIFwiVGhlIG51bWJlciBpcyAxXCIpXHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIyXCIpLCBcIlRoZSBudW1iZXIgaXMgMlwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiWVwiKSwgXCJFcnJvci4gTm90IGEgbnVtYmVyXCIpXHJcblxyXG4vKlxyXG5cclxuYHBoYXRNYXBgIGlzIHNpbWlsYXIgdG8gdGhlIGA+Pj1gIGZ1bmN0aW9uIGluIEhhc2tlbGwsIHdoaWNoIGlzIHRoZSBidWlsZGluZyBibG9jayBvZiB0aGUgaW5mYW1vdXMgYGRvYCBub3RhdGlvblxyXG5JdCBjYW4gYmUgdXNlZCB0byB3cml0ZSBwcm9ncmFtcyB3aXRob3V0IHVzaW5nIGFzc2lnbm1lbnQuXHRcclxuXHJcbkZvciBleGFtcGxlIGlmIHdlIGhhdmUgdGhlIGZvbGxvd2luZyBmdW5jdGlvbiBpbiBIYXNrZWxsOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gZG8gIFxyXG5cdFx0XHRhIDwtICgqMikgIFxyXG5cdFx0XHRiIDwtICgrMTApICBcclxuXHRcdFx0cmV0dXJuIChhK2IpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cclxuV2hlbiB3ZSBkZXN1Z2FyIGl0LCB0aGlzIGJlY29tZXM6XHJcblxyXG5cdFx0YWRkU3R1ZmYgPSAoKjIpID4+PSBcXGEgLT5cclxuXHRcdFx0XHQoKzEwKSA+Pj0gXFxiIC0+XHJcblx0XHRcdFx0XHRyZXR1cm4gKGErYilcclxuXHJcbm9yIGluIEphdmFTY3JpcHQgdGVybXM6XHJcblxyXG4qL1xyXG5cclxuXHRcdHZhciBhZGRTdHVmZiA9IGYoIG51bSA9PiBudW0gKiAyIClcclxuXHRcdFx0LmZsYXRNYXAoIGEgPT4gZiggbnVtID0+IG51bSArIDEwIClcclxuXHRcdFx0XHQuZmxhdE1hcCggYiA9PiBmLm9mKGEgKyBiKSApIFxyXG5cdFx0XHQpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBsaXN0IFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYGxpc3RgIHR5cGUsIGF1Z21lbnRzIHRoZSBzdGFuZGFyZCBKYXZhU2NyaXB0IGFycmF5cywgbWFraW5nIHRoZW0gaW1tdXRhYmxlIGFuZCBhZGRpbmcgYWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5IHRvIHRoZW1cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIkxpc3RcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgbGlzdGAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbGlzdCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2xpc3RcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY3JlYXRlIGEgYGxpc3RgIGZyb20gYXJyYXkgbGlrZSB0aGlzXHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoWzEsMiwzXSlcclxuLy9vciBsaWtlIHRoaXM6XHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoMSwyLDMpXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcblN0YW5kYXJkIGFycmF5IG1ldGhvZC4gRXhlY3V0ZXMgYGZ1bmtgIGZvciBlYWNoIG9mIHRoZSB2YWx1ZXMgaW4gdGhlIGxpc3QgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbGlzdC5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdHZhciBwZW9wbGUgPSBsaXN0KCB7bmFtZTpcImpvaG5cIiwgYWdlOjI0LCBvY2N1cGF0aW9uOlwiZmFybWVyXCJ9LCB7bmFtZTpcImNoYXJsaWVcIiwgYWdlOjIyLCBvY2N1cGF0aW9uOlwicGx1bWJlclwifSlcclxuXHR2YXIgbmFtZXMgPSBwZW9wbGUubWFwKChwZXJzb24pID0+IHBlcnNvbi5uYW1lIClcclxuXHRhc3NlcnQuZGVlcEVxdWFsKG5hbWVzLCBbXCJqb2huXCIsIFwiY2hhcmxpZVwiXSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgbGlzdCBvciBhbiBhcnJheSBpdCBmbGF0dGVucyB0aGUgcmVzdWx0cyBpbnRvIG9uZSBhcnJheVxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcclxuXHR2YXIgb2NjdXBhdGlvbnMgPSBsaXN0KFsgXHJcblx0XHR7b2NjdXBhdGlvbjpcImZhcm1lclwiLCBwZW9wbGU6W1wiam9oblwiLCBcInNhbVwiLCBcImNoYXJsaWVcIl0gfSxcclxuXHRcdHtvY2N1cGF0aW9uOlwicGx1bWJlclwiLCBwZW9wbGU6W1wibGlzYVwiLCBcInNhbmRyYVwiXSB9LFxyXG5cdF0pXHJcblx0XHJcblx0dmFyIHBlb3BsZSA9IG9jY3VwYXRpb25zLnBoYXRNYXAoKG9jY3VwYXRpb24pID0+IG9jY3VwYXRpb24ucGVvcGxlKVxyXG5cdGFzc2VydC5kZWVwRXF1YWwocGVvcGxlLFtcImpvaG5cIiwgXCJzYW1cIiwgXCJjaGFybGllXCIsIFwibGlzYVwiLCBcInNhbmRyYVwiXSlcclxuXHJcbn0pLy8tLVxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuIiwidmFyIG1heWJlVCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L21heWJlVFwiKVxyXG52YXIgbGlzdCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2xpc3RcIilcclxudmFyIHN0YXRlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvc3RhdGVcIilcclxuXHJcblFVbml0Lm1vZHVsZShcIm1heWJlVFwiKVxyXG5cclxuUVVuaXQudGVzdChcImxpc3RcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcbiAgICB2YXIgYmMgPSBtYXliZVQobGlzdCh7YTpcImJcIn0sIHthOlwiY1wifSkpLmdldFByb3AoXCJhXCIpXHJcbiAgICBhc3NlcnQuZGVlcEVxdWFsKGJjLl92YWx1ZSwgW1wiYlwiLCBcImNcIl0pXHJcbiAgICB2YXIgYWJjID0gYmMubGlmdChcInJldmVyc2VcIikubGlmdChcImNvbmNhdFwiLCBbXCJhXCJdKVxyXG4gICAgYXNzZXJ0LmRlZXBFcXVhbChhYmMuX3ZhbHVlLCBbXCJjXCIsIFwiYlwiLCBcImFcIl0pXHJcbn0pXHJcbi8qXHJcblFVbml0LnRlc3QoXCJzdGF0ZVwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuICAgIG1heWJlVChzdGF0ZSgxKSlcclxuICAgIC5tYXAoKVxyXG59KVxyXG5cclxuKi9cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBtYXliZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYG1heWJlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBvcHRpb25gIHR5cGUgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgdGhhdCBtYXkgbm90IGJlIHRoZXJlLiBcclxuXHJcblRoZSBwdXJwb3NlIG9mIHRoaXMgbW9uYWQgaXMgdG8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB3cml0aW5nIGBudWxsYCBjaGVja3MuIFxyXG5GdXJ0aGVybW9yZSBpdCBhbHNvIGVsaW1pbmF0ZXMgdGhlIHBvc3NpYmlsaXR5IG9mIG1ha2luZyBlcnJvcnMgYnkgbWlzc2luZyBudWxsLWNoZWNrcy5cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIk1heWJlXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYG1heWJlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBtYXliZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L21heWJlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIHdyYXAgYSB2YWx1ZSBpbiBgbWF5YmVgIHdpdGg6XHJcblx0XHR2YXIgdmFsID0gNC8vLS1cclxuXHRcdHZhciBtYXliZV92YWwgPSBtYXliZSh2YWwpXHJcblxyXG4vL0lmIHRoZSAndmFsJyBpcyBlcXVhbCB0byAqdW5kZWZpbmVkKiBpdCB0aHJlYXRzIHRoZSBjb250YWluZXIgYXMgZW1wdHkuXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIGBmdW5rYCB3aXRoIHRoZSBgbWF5YmVgJ3MgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGJ1dCBvbmx5IGlmIHRoZSB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSAqdW5kZWZpbmVkKiwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbWF5YmUuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vVHJhZGl0aW9uYWxseSwgaWYgd2UgaGF2ZSBhIHZhbHVlIHRoYXQgbWF5IGJlIHVuZGVmaW5lZCB3ZSBkbyBhIG51bGwgY2hlY2sgYmVmb3JlIGRvaW5nIHNvbWV0aGluZyB3aXRoIGl0OlxyXG5cclxuXHR2YXIgb2JqID0ge30vLy0tXHJcblx0dmFyIGdldF9wcm9wZXJ0eSA9IGYoKG9iamVjdCkgPT4gb2JqZWN0LnByb3BlcnR5KS8vLS1cclxuXHRcclxuXHR2YXIgdmFsID0gZ2V0X3Byb3BlcnR5KG9iailcclxuXHRcclxuXHRpZih2YWwgIT09IHVuZGVmaW5lZCl7XHJcblx0XHR2YWwgPSB2YWwudG9TdHJpbmcoKVxyXG5cdH1cclxuXHRhc3NlcnQuZXF1YWwodmFsLCB1bmRlZmluZWQpIFxyXG5cclxuLy9XaXRoIGBtYXBgIHRoaXMgY2FuIGJlIHdyaXR0ZW4gbGlrZSB0aGlzXHJcblxyXG4gXHR2YXIgbWF5YmVfZ2V0X3Byb3BlcnR5ID0gZ2V0X3Byb3BlcnR5Lm1hcChtYXliZSlcclxuXHJcblx0bWF5YmVfZ2V0X3Byb3BlcnR5KG9iaikubWFwKCh2YWwpID0+IHtcclxuXHRcdGFzc2VydC5vayhmYWxzZSkvLy0tXHJcblx0XHR2YWwudG9TdHJpbmcoKS8vdGhpcyBpcyBub3QgZXhlY3V0ZWRcclxuXHR9KVxyXG5cclxuLy9UaGUgYmlnZ2VzdCBiZW5lZml0IHdlIGdldCBpcyB0aGF0IGluIHRoZSBmaXJzdCBjYXNlIHdlIGNhbiBlYXNpbHkgZm9yZ2V0IHRoZSBudWxsIGNoZWNrOlxyXG5cdFxyXG5cdGFzc2VydC50aHJvd3MoZnVuY3Rpb24oKXtcclxuXHRcdGdldF9wcm9wZXJ0eShvYmopLnRvU3RyaW5nKCkgIC8vdGhpcyBibG93cyB1cFxyXG5cdH0pXHJcblxyXG4vL1doaWxlIGluIHRoZSBzZWNvbmQgY2FzZSB3ZSBjYW5ub3QgYWNjZXNzIHRoZSB1bmRlcmx5aW5nIHZhbHVlIGRpcmVjdGx5LCBhbmQgdGhlcmVmb3JlIGNhbm5vdCBleGVjdXRlIGFuIGFjdGlvbiBvbiBpdCwgaWYgaXQgaXMgbm90IHRoZXJlLlxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgYG1heWJlYCBpdCBmbGF0dGVucyB0aGUgdHdvIGBtYXliZXNgIGludG8gb25lLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vYG1hcGAgd29ya3MgZmluZSBmb3IgZWxpbWluYXRpbmcgZXJyb3JzLCBidXQgaXQgZG9lcyBub3Qgc29sdmUgb25lIG9mIHRoZSBtb3N0IGFubm95aW5nIHByb2JsZW1zIHdpdGggbnVsbC1jaGVja3MgLSBuZXN0aW5nOlxyXG5cclxuXHR2YXIgb2JqID0geyBmaXJzdDoge3NlY29uZDpcInZhbFwiIH0gfVxyXG5cdFxyXG5cdG1heWJlKG9iailcclxuXHRcdC5tYXAoIHJvb3QgPT4gbWF5YmUocm9vdC5maXJzdCkpXHJcblx0XHQubWFwKCBtYXliZUZpcnN0ID0+IG1heWJlRmlyc3QubWFwIChmaXJzdCA9PiBtYXliZSAobWF5YmVGaXJzdC5zZWNvbmQgKSApICkgXHJcblx0XHQubWFwKCBtYXliZU1heWJlVmFsdWUgPT4gbWF5YmVNYXliZVZhbHVlLm1hcCAobWF5YmVWYWx1ZSA9PiBtYXliZVZhbHVlLm1hcCggKHZhbHVlKT0+KCBhc3NlcnQuZXF1YWwoIHZhbCwgXCJ2YWxcIikgKSApICkgKVxyXG5cclxuLy9gcGhhdE1hcGAgZG9lcyB0aGUgZmxhdHRlbmluZyBmb3IgdXMsIGFuZCBhbGxvd3MgdXMgdG8gd3JpdGUgY29kZSBsaWtlIHRoaXNcclxuXHJcblx0bWF5YmUob2JqKVxyXG5cdFx0LmZsYXRNYXAocm9vdCA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5mbGF0TWFwKGZpcnN0ID0+IG1heWJlKGZpcnN0LnNlY29uZCkpXHJcblx0XHQuZmxhdE1hcCh2YWwgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwodmFsLCBcInZhbFwiKVxyXG5cdFx0fSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuQWR2YW5jZWQgVXNhZ2VcclxuLS0tLVxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImFkdmFuY2VkXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4vLyBgbWF5YmVgIGNhbiBiZSB1c2VkIHdpdGggdGhlIGZ1bmN0aW9uIG1vbmFkIHRvIGVmZmVjdGl2ZWx5IHByb2R1Y2UgJ3NhZmUnIHZlcnNpb25zIG9mIGZ1bmN0aW9uc1xyXG5cclxuXHR2YXIgZ2V0ID0gZigocHJvcCwgb2JqKSA9PiBvYmpbcHJvcF0pXHJcblx0dmFyIG1heWJlR2V0ID0gZ2V0Lm1hcChtYXliZSlcclxuXHJcbi8vVGhpcyBjb21iaW5lZCB3aXRoIHRoZSB1c2Ugb2YgY3VycnlpbmcgbWFrZXMgZm9yIGEgdmVyeSBmbHVlbnQgc3R5bGUgb2YgY29kaW5nOlxyXG5cclxuXHR2YXIgZ2V0Rmlyc3RTZWNvbmQgPSAocm9vdCkgPT4gbWF5YmUocm9vdCkucGhhdE1hcChtYXliZUdldCgnZmlyc3QnKSkucGhhdE1hcChtYXliZUdldCgnc2Vjb25kJykpXHJcblx0XHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDoge3NlY29uZDpcInZhbHVlXCIgfSB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcInZhbHVlXCIpKVxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJvdGhlcl92YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJvdGhlcl92YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiBcIlwiIH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwid2hhdGV2ZXJcIikgKS8vd29uJ3QgYmUgZXhlY3V0ZWQgXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcblxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IHByb21pc2UgXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgcHJvbWlzZWAgdHlwZSwgYWxzbyBrbm93biBhcyBgZnV0dXJlYCBpcyBhIGNvbnRhaW5lciBmb3IgYSB2YWx1ZSB3aGljaCB3aWxsIGJlIHJlc29sdmVkIGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZSwgXHJcbnZpYSBhbiBhc3luY2hyb25vdXMgb3BlcmF0aW9uLiBcclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIlByb21pc2VcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgcHJvbWlzZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0dmFyIHByb21pc2UgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9wcm9taXNlXCIpXHJcblx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RvIGNyZWF0ZSBhIGBwcm9taXNlYCBwYXNzIGEgZnVuY3Rpb24gd2hpY2ggYWNjZXB0cyBhIGNhbGxiYWNrIGFuZCBjYWxscyB0aGF0IGNhbGxiYWNrIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZTpcclxuXHJcblx0dmFyIG15X3Byb21pc2UgPSBwcm9taXNlKCAocmVzb2x2ZSkgPT4gIFxyXG5cdFx0c2V0VGltZW91dCgoKSA9PiB7IHJlc29sdmUoNSkgfSwxMDAwKSAgXHJcblx0KVxyXG5cclxuLy8gSW4gbW9zdCBjYXNlcyB5b3Ugd2lsbCBiZSBjcmVhdGluZyBwcm9taXNlcyB1c2luZyBoZWxwZXIgZnVuY3Rpb25zIGxpa2U6XHJcblxyXG5cdGNvbnN0IGdldFVybCA9ICh1cmwpID0+IHByb21pc2UoIChyZXNvbHZlKSA9PiB7XHJcblx0ICBjb25zdCBycSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXHJcbiAgXHQgIHJxLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoSlNPTi5wYXJzZShycS5yZXNwb25zZVRleHQpKVxyXG5cdCAgcnEub3BlbihcIkdFVFwiLHVybCx0cnVlKTtcclxuXHQgIHJxLnNlbmQoKTtcclxuXHR9KVxyXG4vKlxyXG5gcnVuKClgXHJcbi0tLS1cclxuRXhlY3V0ZXMgdGhlIHByb21pc2UgYW5kIGZldGNoZXMgdGhlIGRhdGEuXHJcblxyXG4qKipcclxuRm9yIGV4YW1wbGUgdG8gbWFrZSBhIHByb21pc2UgYW5kIHJ1biBpdCBpbW1lZGlhdGVseSBkbzpcclxuKi9cclxuXHRnZXRVcmwoXCJwZW9wbGUuanNvblwiKS5ydW4oKVxyXG5cdC8vW1xyXG5cdC8vICB7IFwibmFtZVwiOlwiam9oblwiLCBcIm9jY3VwYXRpb25cIjpcInByb2dyYW1tZXJcIn0sXHJcbiBcdC8vICB7XCJuYW1lXCI6XCJqZW5cIiwgXCJvY2N1cGF0aW9uXCI6XCJhZG1pblwifVxyXG5cdC8vXVxyXG5cclxuXHRnZXRVcmwoXCJvY2N1cGF0aW9ucy5qc29uXCIpLnJ1bigpXHJcblx0Ly97XHJcblx0Ly8gIFwicHJvZ3JhbW1lclwiOiBcIndyaXRlcyBjb2RlXCJcclxuXHQvLyAgXCJhZG1pblwiOiBcIm1hbmFnZXMgaW5mcmFzdHJ1Y3R1cmVcIlxyXG5cdC8vfVxyXG5cclxuLypcclxuLy9Ob3RlIHRoYXQgd2Ugd2lsbCBiZSB1c2luZyB0aGUgZGF0YSBmcm9tIHRoZXNlIHR3byBmaWxlcyBpbiB0aGUgbmV4dCBleGFtcGxlcy4gXHJcblxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcblJldHVybnMgYSBuZXcgcHJvbWlzZSwgd2hpY2ggYXBwbGllcyBgZnVua2AgdG8gdGhlIGRhdGEgd2hlbiB5b3UgcnVuIGl0LlxyXG5cclxuKioqXHJcblRoZSBmdW5jdGlvbiBjYW4gYmUgdXNlZCBib3RoIGZvciBtYW5pcHVsYXRpbmcgdGhlIGRhdGEgeW91IGZldGNoIGFuZCBmb3IgcnVubmluZyBzaWRlIGVmZmVjdHMgIFxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRjb25zdCBzdG9wID0gYXNzZXJ0LmFzeW5jKCkvLy0tXHJcblx0Z2V0VXJsKFwicGVvcGxlLmpzb25cIilcclxuXHQgIFxyXG5cdCAgLy9Vc2luZyBcIm1hcFwiIGZvciBtYW5pcHVsYXRpbmcgZGF0YVxyXG5cdCAgLm1hcCgocGVvcGxlKSA9PiBwZW9wbGUubWFwKChwZXJzb24pID0+IHBlcnNvbi5uYW1lKSlcclxuXHJcblx0ICAvL1VzaW5nIFwibWFwXCIgZm9yIHRyaWdnZXJpbmcgc2lkZSBlZmZlY3RzIFxyXG5cdCAgLm1hcChuYW1lcyA9PiB7XHJcblx0ICAgIGFzc2VydC5kZWVwRXF1YWwobmFtZXMsIFsnam9obicsICdqZW4nXSlcclxuXHQgICAgc3RvcCgpLy8tLVxyXG5cdCAgfSkucnVuKClcclxufSkvLy0tXHJcblxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuQSBtb3JlIHBvd2VyZnVsIHZlcnNpb24gb2YgYG1hcGAgd2hpY2ggY2FuIGFsbG93cyB5b3UgdG8gY2hhaW4gc2V2ZXJhbCBzdGVwcyBvZiB0aGUgYXN5Y2hyb25vdXMgY29tcHV0YXRpb25zIHRvZ2V0aGVyLlxyXG5Lbm93biBhcyBgdGhlbmAgZm9yIHRyYWRpdGlvbmFsIHByb21pc2UgbGlicmFyaWVzLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwicGhhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRjb25zdCBkb25lID0gYXNzZXJ0LmFzeW5jKCkvLy0tXHRcclxuXHJcbi8vRm9yIGV4YW1wbGUgaGVyZSBpcyBhIGZ1bmN0aW9uIHdoaWNoIHJldHJpZXZlcyBhIHBlcnNvbidzIG9jY3VwYXRpb24gZnJvbSB0aGUgYHBlb3BsZS5qc29uYCBmaWxlXHJcbi8vYW5kIHRoZW4gcmV0cmlldmVzIHRoZSBvY2N1cGF0aW9uJ3MgZGVzY3JpcHRpb24gZnJvbSBgb2NjdXBhdGlvbnMuanNvbmAuIFxyXG5cclxuXHRjb25zdCBnZXRPY2N1cGF0aW9uRGVzY3JpcHRpb24gPSAobmFtZSkgPT4gZ2V0VXJsKFwicGVvcGxlLmpzb25cIilcclxuXHJcblx0ICAvL1JldHJpZXZlIHBlcnNvbiBkYXRhXHJcblx0ICAucGhhdE1hcCgocGVvcGxlKSA9PiBwZW9wbGUuZmlsdGVyKCBwZXJzb24gPT4gcGVyc29uLm5hbWUgPT09IG5hbWUgKVswXSlcclxuXHJcblx0ICAvL1JldHJpZXZlIGl0cyBvY2N1cGF0aW9uXHJcblx0ICAucGhhdE1hcCggKHBlcnNvbikgPT4gZ2V0VXJsKFwib2NjdXBhdGlvbnMuanNvblwiKVxyXG5cdCAgICAubWFwKG9jY3VwYXRpb25zID0+IG9jY3VwYXRpb25zW3BlcnNvbi5vY2N1cGF0aW9uXSkgKVxyXG5cclxuLy9IZXJlIGlzIGhvdyB0aGUgZnVuY3Rpb24gaXMgdXNlZDpcclxuXHJcblx0Z2V0T2NjdXBhdGlvbkRlc2NyaXB0aW9uKFwiam9oblwiKS5tYXAoKGRlc2MpID0+IHsgXHJcblx0XHRhc3NlcnQuZXF1YWwoZGVzYywgXCJ3cml0ZXMgY29kZVwiKSBcclxuXHRcdGRvbmUoKS8vLS1cclxuXHR9KS5ydW4oKVxyXG5cdFxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogc3RhdGVcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBzdGF0ZWAgdHlwZSwgaXMgYSBjb250YWluZXIgd2hpY2ggZW5jYXBzdWxhdGVzIGEgc3RhdGVmdWwgZnVuY3Rpb24uIEl0IGJhc2ljYWxseSBhbGxvd3MgeW91IHRvIGNvbXBvc2UgZnVuY3Rpb25zLFxyXG5saWtlIHlvdSBjYW4gZG8gd2l0aCB0aGUgYGZgIHR5cGUsIGV4Y2VwdCB3aXRoIGl0IGFueSBmdW5jdGlvbiBjYW4gYWNjZXNzIGFuIGFkZGl0aW9uYWwgXCJ2YXJpYWJsZVwiIGJlc2lkZXMgaXRzXHJcbmlucHV0IGFyZ3VtZW50KHMpIC0gdGhlIHN0YXRlLiBcclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIlN0YXRlXCIpLy8tLVxyXG5cclxuLy9UbyB1c2UgdGhlIGBzdGF0ZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgc3RhdGUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9zdGF0ZVwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL0luIHRoZSBjb250ZXh0IG9mIHRoaXMgdHlwZSBhIHN0YXRlIGlzIHJlcHJlc2VudGVkIGJ5IGEgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIGEgc3RhdGUgXHJcbi8vYW5kIHJldHVybnMgYSBsaXN0IHdoaWNoIGNvbnRhaW5zIGEgdmFsdWUgYW5kIGEgbmV3IHN0YXRlLiBTbyBmb3IgZXhhbXBsZTpcclxuXHJcblx0c3RhdGUoKHZhbCkgPT4gW3ZhbCsxLCB2YWxdKVxyXG5cclxuLy9DcmVhdGVzIGEgbmV3IHN0YXRlZnVsIGNvbXB1dGF0aW9uIHdoaWNoIGluY3JlbWVudHMgdGhlIGlucHV0IGFyZ3VtZW50IGFuZCB0aGVuIHNhdmVzIGl0IGluIHRoZSBzdGF0ZS5cclxuXHJcblxyXG4vKlxyXG5gb2YodmFsdWUpYFxyXG4tLS0tXHJcbkFjY2VwdHMgYSB2YWx1ZSBhbmQgd3JhcHMgaW4gYSBzdGF0ZSBjb250YWluZXJcclxuKi9cclxuXHRRVW5pdC50ZXN0KFwib2ZcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRhc3NlcnQuZXhwZWN0KDApLy8tLVxyXG5cdFx0Y29uc3Qgc3RhdGU1ID0gc3RhdGUoKS5vZig1KVxyXG5cdH0pLy8tLVxyXG5cclxuLy9Ob3RlIHRoYXQgdGhlIGZvbGxvd2luZyBjb2RlIGRvZXMgbm90IHB1dCBgNWAgaW4gdGhlIHN0YXRlLlxyXG4vL1JhdGhlciBpdCBjcmVhdGVzIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBgNWAgYW5kIGRvZXMgbm90IGludGVyYWN0IHdpdGggdGhlIHN0YXRlLiBcclxuXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIGBmdW5rYCB3aXRoIHRoZSBlbmNhcHN1bGF0ZWQgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IGBzdGF0ZWAgb2JqZWN0LCBcclxud2l0aG91dCBhY2Nlc3NpbmcgdGhlIHN0YXRlXHJcblxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL09uZSBvZiB0aGUgbWFpbiBiZW5lZml0cyBvZiB0aGUgYHN0YXRlYCB0eXBlcyBpcyB0aGF0IGl0IGFsbG93cyB5b3UgdG8gbWl4IHB1cmUgZnVuY3Rpb25zIHdpdGggdW5wdXJlIG9uZXMsIFxyXG4vL0luIHRoZSBzYW1lIHdheSB0aGF0IHByb21pc2VzIGFsbG93IHVzIHRvIG1peCBhc3ljaHJvbm91cyBmdW5jdGlvbnMgd2l0aCBzeW5jaHJvbm91cyBvbmVzLlxyXG4vL01hcCBhbGxvd3MgdXMgdG8gYXBwbHkgYW55IGZ1bmN0aW9uIG9uIG91ciB2YWx1ZSBhbmQgdG8gY29uc3VtZSB0aGUgcmVzdWx0IGluIGFub3RoZXIgZnVuY3Rpb24uXHJcblxyXG5cdHZhciBteVN0YXRlID0gc3RhdGUoNSlcclxuXHRcdC5tYXAoKHZhbCkgPT4gdmFsKzEpXHJcblx0XHQubWFwKCh2YWwpID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKHZhbCwgNilcclxuXHRcdFx0cmV0dXJuIHZhbCAqIDJcclxuXHRcdH0pXHJcblx0XHQubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsIDEyKSlcclxuXHRcdC5ydW4oKVxyXG59KS8vLS1cclxuXHJcblxyXG4vKlxyXG5cclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuU2FtZSBhcyBgbWFwYCwgZXhjZXB0IHRoYXQgaWYgYGZ1bmtgIHJldHVybnMgYSBuZXcgc3RhdGUgb2JqZWN0IGl0IG1lcmdlcyB0aGUgdHdvIHN0YXRlcyBpbnRvIG9uZS5cclxuVGh1cyBgZmxhdE1hcGAgc2ltdWxhdGVzIG1hbmlwdWxhdGlvbiBvZiBtdXRhYmxlIHN0YXRlLlxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9Gb3IgZXhhbXBsZSwgaGVyZSBpcyBhIGZ1bmN0aW9uIHRoYXQgXHJcblxyXG5cdHZhciBteVN0YXRlID0gc3RhdGUoXCJ2YWx1ZVwiKVxyXG5cdFx0Ly9Xcml0ZSB0aGUgdmFsdWUgaW4gdGhlIHN0YXRlXHJcblx0XHQucGhhdE1hcCggdmFsdWUgPT4gc3RhdGUoIF8gPT4gW1wibmV3IFwiK3ZhbHVlICwgXCJpbml0aWFsIFwiK3ZhbHVlXSkgKVxyXG5cclxuXHRcdC8vbWFuaXB1bGF0ZSB0aGUgdmFsdWVcclxuXHRcdC5waGF0TWFwKCB2YWwgPT4gdmFsLnRvVXBwZXJDYXNlKCkuc3BsaXQoXCJcIikuam9pbihcIi1cIikgKVxyXG5cdFx0XHJcblx0XHQvL1dlIGNhbiBhY2Nlc3MgdGhlIHN0YXRlIGF0IGFueSB0aW1lLlxyXG5cdFx0LnBoYXRNYXAoIHZhbCA9PiBzdGF0ZShzdCA9PiB7XHJcblx0XHRcdGFzc2VydC5lcXVhbCggdmFsLCBcIk4tRS1XLSAtVi1BLUwtVS1FXCIpXHJcblx0XHRcdGFzc2VydC5lcXVhbCggc3QsIFwiaW5pdGlhbCB2YWx1ZVwiKVxyXG5cdFx0fSkpLnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuLypcclxuXHJcbmBzYXZlKCkgLyBsb2FkKClgXHJcbi0tLS1cclxuU2hvcnRoYW5kcyBmb3IgdGhlIG1vc3QgY29tbW9uIHN0YXRlIG9wZXJhdGlvbnM6IFxyXG4tIGBzYXZlYCBjb3BpZXMgdGhlIGN1cnJlbnRseSBlbmNhcHN1bGF0ZWQgdmFsdWUgaW50byB0aGUgc3RhdGVcclxuLSBgbG9hZGAganVzdCByZXR1cm5zIHRoZSBjdXJyZW50IHN0YXRlXHJcbioqKlxyXG4qL1xyXG5cclxuXHJcblFVbml0LnRlc3QoXCJzYXZlL2xvYWRcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG5cdHZhciBteVN0YXRlID0gc3RhdGUoNSlcclxuXHQucGhhdE1hcCggKHZhbCkgPT4gdmFsKzEgKSAvLzZcclxuXHQuc2F2ZUtleShcInN0MVwiKVxyXG5cdFxyXG5cdC5waGF0TWFwKCAodmFsKSA9PiB2YWwqMiApLy8xMlxyXG5cdC5zYXZlS2V5KFwic3QyXCIpXHJcblx0XHJcblx0LmxvYWQoKVxyXG5cdC5tYXAoIChzdGF0ZSkgPT4ge1xyXG5cdFx0YXNzZXJ0LmVxdWFsKHN0YXRlLnN0MSwgNilcclxuXHRcdGFzc2VydC5lcXVhbChzdGF0ZS5zdDIsIDEyKVxyXG5cdH0pLnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcblxyXG4iLCJcclxuLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBzdHJlYW0gXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgc3RyZWFtYCB0eXBlLCBhbHNvIGtub3duIGFzIGEgbGF6eSBsaXN0IGlzIGEgY29udGFpbmVyIGZvciBhIGxpc3Qgb2YgdmFsdWVzIHdoaWNoIGNvbWUgYXN5bmNocm9ub3VzbHkuXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJzdHJlYW1cIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgc3RyZWFtYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHR2YXIgc3RyZWFtID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvc3RyZWFtXCIpXHJcblx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RvIGNyZWF0ZSBhIGBzdHJlYW1gIHBhc3MgYSBmdW5jdGlvbiB3aGljaCBhY2NlcHRzIGEgY2FsbGJhY2sgYW5kIGNhbGxzIHRoYXQgY2FsbGJhY2sgd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlOlxyXG5cclxuXHRjb25zdCBjbGlja1N0cmVhbSA9IHN0cmVhbSggKHB1c2gpID0+IHsgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBwdXNoKX0pXHJcblx0d2luZG93LmNsaWNrU3RyZWFtID0gY2xpY2tTdHJlYW1cclxuXHJcbi8vIExpa2UgcHJvbWlzZXMsIHN0cmVhbXMgYXJlIGFsc28gY3JlYXRlZCB3aXRoIGEgaGVscGVyXHJcblxyXG5cdGNvbnN0IGNvdW50VG8gPSAocmFuZ2UpID0+IHN0cmVhbSggKHB1c2gpID0+IHtcclxuXHRcdGZvciAobGV0IGkgPSAxOyBpPD0gcmFuZ2U7IGkrKyl7XHJcblx0XHRcdHB1c2goaSlcclxuXHRcdH1cclxuXHR9KVxyXG4vKlxyXG5gcnVuKClgXHJcbi0tLS1cclxuRXhlY3V0ZXMgdGhlIHN0cmVhbSBhbmQgZmV0Y2hlcyB0aGUgZGF0YS5cclxuXHJcbioqKlxyXG5cclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5SZXR1cm5zIGEgbmV3IHN0cmVhbSwgd2hpY2ggYXBwbGllcyBgZnVua2AgdG8gdGhlIGRhdGEgd2hlbiB5b3UgcnVuIGl0LlxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdGNvbnN0IHN0b3AgPSBhc3NlcnQuYXN5bmMoKS8vLS1cclxuXHR2YXIgcHVzaFRvU3RyZWFtID0gdW5kZWZpbmVkXHJcblx0Y29uc3QgbXlTdHJlYW0gPSBzdHJlYW0ocHVzaCA9PnsgcHVzaFRvU3RyZWFtID0gcHVzaH0pXHJcblx0XHQubWFwKHZhbCA9PiB2YWwqMilcclxuXHRcdC5tYXAodmFsID0+IGFzc2VydC5lcXVhbCh2YWwsIDEwKSlcclxuXHRcdC5ydW4oKVxyXG5cdFxyXG5cdHB1c2hUb1N0cmVhbSg1KVxyXG5cdHN0b3AoKVxyXG59KS8vLS1cclxuXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5BIG1vcmUgcG93ZXJmdWwgdmVyc2lvbiBvZiBgbWFwYCB3aGljaCBjYW4gYWxsb3dzIHlvdSB0byBjaGFpbiBzZXZlcmFsIHN0ZXBzIG9mIHRoZSBhc3ljaHJvbm91cyBjb21wdXRhdGlvbnMgdG9nZXRoZXIuXHJcbktub3duIGFzIGB0aGVuYCBmb3IgdHJhZGl0aW9uYWwgc3RyZWFtIGxpYnJhcmllcy5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuLy9RVW5pdC50ZXN0KFwicGhhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHQvL2NvbnN0IGRvbmUgPSBhc3NlcnQuYXN5bmMoKS8vLS1cdFxyXG4vL30pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG4iXX0=
