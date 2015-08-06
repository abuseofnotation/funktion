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

}; //--

//Add aliases to map . flat as flatMap and map . tryFlat as phatMap
methods.flatMap = helpers.flatMap;
methods.phatMap = helpers.phatMap;

//Add a print function, used for debugging.
methods.print = helpers.print;

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
			return extend(funk, methods)

			//Else, return a curry-capable version of the function (again, extended with the function methods)
			;
		} else {
			var extended_funk = extend(function () {
				for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
					args[_key4] = arguments[_key4];
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

var identity = function identity(val) {
    var id = Object.create(methods);
    id._value = val;
    return Object.freeze(id);
};

var methods = {

    funktionType: "identity",

    constructor: identity,

    of: function of(val) {
        return this.constructor(val);
    },

    map: function map(funk) {
        return this.constructor(funk(this._value));
    },

    flat: function flat() {
        return this.constructor(this._value._value);
    },

    tryFlat: function tryFlat() {
        return this.constructor(this._value.funktionType === "identity" ? this._value._value : this._value);
    },

    phatMap: function phatMap(funk) {
        if (funk === undefined) {
            throw "function not defined";
        }
        return this.map(funk).tryFlat();
    },

    flatMap: function flatMap(funk) {
        if (funk === undefined) {
            throw "function not defined";
        }
        return this.map(funk).flat();
    },
    print: function print() {
        console.log(this.toString());
        return this;
    }
};

identity.prototype = methods; //--
module.exports = identity //--
;

},{}],4:[function(require,module,exports){
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
			return element !== undefined && element.constructor === Array ? [].concat(_toConsumableArray(list), _toConsumableArray(element)) : [].concat(_toConsumableArray(list), [element]);
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
		for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
			args[_key2] = arguments[_key2];
		}

		var newArray = this.slice(0);
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

	if (args.length === 1 && args[0] !== undefined && args[0].funktionType === "list") {
		return args[0]
		//Accept an array
		;
	} else if (args.length === 1 && args[0] !== undefined && args[0].constructor === Array) {
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

},{"./helpers":2}],5:[function(require,module,exports){
"use strict";

var id = require("./identity"); //--
var methods = Object.create(id.prototype); //--

var maybe = function maybe(value) {
	var obj = Object.create(methods);
	obj._value = value;
	return Object.freeze(obj);
};

//`map` takes the function and applies it to the value in the maybe, if there is one.
methods.prototype = methods; //--
methods.constructor = maybe; //--

methods.funktionType = "maybe"; //--

//m a -> ( a -> b ) -> m b
methods.map = function map(funk) {
	if (this._value !== undefined) {
		return this.constructor(funk(this._value));
	} else {
		return this;
	}
};

//`flat` takes a maybe that contains another maybe and flattens it.
//In this case this means just returning the inner value.

//m (m x) -> m x
methods.flat = function flat() {
	if (this._value !== undefined) {
		return this._value;
	} else {
		return this;
	}
};

//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`

methods.tryFlat = function tryFlat() {
	if (this._value !== undefined && this._value.funktionType === "maybe") {
		return this._value;
	} else {
		return this;
	}
};

//Finally, maybe defines one helper function which retrieves the property of an object, wrapped in a maybe:

methods.getProp = function getProp(prop) {
	var _this = this;

	return this.phatMap(function (val) {
		return _this.of(val[prop]);
	});
};

maybe.prototype = methods; //--
module.exports = maybe //--
;

},{"./identity":3}],6:[function(require,module,exports){
"use strict";

var helpers = require("./helpers"); //--
var maybe = require("./maybe"); //--
var methods = Object.create(maybe.prototype);

var maybeT = function maybeT(value) {
  var obj = Object.create(methods);
  obj._innerMonad = value;
  return Object.freeze(obj);
};

methods.funktionType = "maybeT"; //--
methods.constructor = maybeT;

//m maybe a -> ( a -> maybe b ) -> m maybe b
methods.map = function map(funk) {
  return maybeT(this._innerMonad.map(function (val) {
    return val === undefined ? val : funk(val);
  }));
};

//`flat` takes a maybe that contains another maybe and flattens it.
//In this case this means just returning the inner value.

//m (m x) -> m x
methods.flat = function flat() {
  var _this = this;

  return maybeT(this._innerMonad.map(function (innerMaybeT) {
    return innerMaybeT === undefined ? _this._innerMonad.of(undefined) : innerMaybeT._innerMonad;
  }).flat());
};

//finally we have `tryFlat` which does the same thing, but checks the types first. The shortcut to `map().tryFlat()` is called `phatMap`

methods.tryFlat = function tryFlat() {
  var _this2 = this;

  return maybeT(this._innerMonad.map(function (innerMaybeT) {
    if (innerMaybeT === undefined) {
      return _this2._innerMonad.of(undefined);
    } else if (innerMaybeT.funktionType === "maybeT") {
      return innerMaybeT._innerMonad;
    } else {
      return _this2._innerMaybeT;
    }
  }).tryFlat());
};

methods.lift = function (funk) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (typeof funk === "function") {
    return maybeT(funk(this._innerMonad));
  } else if (typeof funk === "string") {
    var _innerMonad;

    return maybeT((_innerMonad = this._innerMonad)[funk].apply(_innerMonad, args));
  }
};

module.exports = maybeT //--
;

},{"./helpers":2,"./maybe":5}],7:[function(require,module,exports){
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

},{"./helpers":2}],8:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

var f = require("./f"); //--
var id = require("./identity"); //--
var methods = Object.create(id.prototype); //--

var state = methods.constructor = function (run) {
	if (typeof run !== "function") {
		return methods.of(run);
	}
	var obj = Object.create(methods);
	obj._runState = f(run, 1);
	return Object.freeze(obj);
};

//`of` just uses the constructor and does not touch the state.

//a -> m a
methods.of = function of(input) {
	return this.constructor(function (prevState) {
		return [input, prevState];
	});
};

//`map` is done by applying the function to the value and keeping the state unchanged.

//m a -> ( a -> b ) -> m b
methods.map = function map(funk) {
	return this.constructor(this._runState.map(function (_ref) {
		var _ref2 = _slicedToArray(_ref, 2);

		var input = _ref2[0];
		var prevState = _ref2[1];
		return [funk(input), prevState];
	}));
};

//`flat` does the following:
//1. Runs the code that we loaded in the monad so, far (using the `run` function).
//2. Saves the new state object and the value which is kept by the functions so far.
//3. After doing that, it arranges those two components (the object and the value) into a yet another
//state object, which runs the mutator function of the first object, with the state that we have so, far

//m (m x) -> m x
methods.flat = function flat() {
	//Extract state mutator and value

	var _run = this.run();

	var _run2 = _slicedToArray(_run, 2);

	var stateObj = _run2[0];
	var currentState = _run2[1];

	//Compose the mutator and the value
	return this.constructor(function () {
		return stateObj._runState(currentState);
	});
};
methods.tryFlat = function tryFlat() {

	//Extract current state

	var _run3 = this.run();

	var _run32 = _slicedToArray(_run3, 2);

	var stateObj = _run32[0];
	var currentState = _run32[1];

	//Check if it is really a state
	if (stateObj.constructor === state) {
		return this.constructor(function () {
			return stateObj._runState(currentState);
		});
	} else {
		return this.constructor(function () {
			return [stateObj, currentState];
		});
	}
};

//We have the `run` function which computes the state:

methods.run = function run() {
	return this._runState();
};
//And the `save` and `load` functions are exactly what one would expect

methods.load = function load() {
	var _this = this;

	return this.flatMap(function (value) {
		return _this.constructor(function (state) {
			return [state, state];
		});
	});
};
methods.save = function save() {
	var _this2 = this;

	return this.flatMap(function (value) {
		return _this2.constructor(function (state) {
			return [value, value];
		});
	});
};
methods.loadKey = function loadKey(key) {
	var _this3 = this;

	return this.flatMap(function (value) {
		return _this3.constructor(function (state) {
			return [state[key], state];
		});
	});
};
methods.saveKey = function saveKey(key) {
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
};

state.prototype = methods; //--
module.exports = state //--
;

},{"./f":1,"./identity":3}],9:[function(require,module,exports){
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
	} }; //--

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

},{"./helpers":2}],10:[function(require,module,exports){
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

},{"../library/f":1}],11:[function(require,module,exports){
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

},{"../library/f":1,"../library/list":4}],12:[function(require,module,exports){
"use strict";

var maybeT = require("../library/maybeT");
var list = require("../library/list");
var state = require("../library/state");

QUnit.module("maybeT");

QUnit.test("list", function (assert) {
    //--
    var bc = maybeT(list({ a: "b" }, { a: "c" })).getProp("a");
    assert.deepEqual(bc._innerMonad, ["b", "c"]);
    var abc = bc.lift("reverse").lift("concat", ["a"]);
    assert.deepEqual(abc._innerMonad, ["c", "b", "a"]);
});
/*
QUnit.test("state", function(assert){//--
    maybeT(state(1))
    .map()
})

*/

},{"../library/list":4,"../library/maybeT":6,"../library/state":8}],13:[function(require,module,exports){
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

var identity = require("../library/identity"); //--
var f = require("../library/f"); //--
var list = require("../library/list"); //--
var state = require("../library/state"); //--

//To use the `maybe` monad constructor, you can require it using node:

var maybe = require("../library/maybe");

//Where the `../` is the location of the module.

//Then you will be able to wrap a value in `maybe` with:
var val = 4; //--
var maybe_val = maybe(val);

//If the 'val' is equal to *undefined* it threats the container as empty.

//You can also combine a `maybe` with an existing monad, using the `maybeT` constructor:

var maybeT = require("../library/maybeT");
var maybeList = maybeT(list(1, 2, 3));

var test = function test(maybe) {
	//--
	/*
 Basic Methods
 ---
 
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
 Helpers
 ----
 
 `getProp(propName)`
 ----
 Assuming the value inside the `maybe` is an object, this method safely retrieves one of the object's properties.
 */

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
	});
}; //--
QUnit.module("Maybe"); //--
test(maybe); //--
QUnit.module("MaybeT"); //--
test(function (val) {
	return maybeT(identity(val));
}); //--

/*
Combining with Other Monads
----
in addition to creating a `maybe` from a plain value, you can also create one from an existing monad, using the `maybet` constructor:

the resulting monad will gain all the characteristics of a `maybe` without losing the characteristics of the underlying monad.

***
*/

QUnit.test("basic", function (assert) {
	//--

	//Combining a maybe with a list, for example, creates a list where each of the values are `maybe`s
	//In the following example `map` will get called only for the first value:

	maybeT(list(1, undefined)).map(function (val) {
		assert.equal(val, 1);
	});
}); //--

QUnit.test("list", function (assert) {
	//--
	//This means you can use maybe to safely transform the list items.
	//If a list value is undefined, it will just stay undefined.

	maybeT(list({ first: { second: "value" } }, { first: { second: "other value" } }, { first: "" })).phatMap(function (val) {
		return maybeT(val.first);
	}).phatMap(function (val) {
		return maybeT(val.second);
	}).lift(function (list) {
		assert.deepEqual(list, ["value", "other value", undefined]);
	});
}); //--

/*
`lift(funk)`
----
In addition to all other methods, `maybe` values, that are created from other monads using the `maybeT` constructor
have the `lift` method which enables you to execute a function to the underlying monad:

***
*/

QUnit.test("lift", function (assert) {
	//--
	var maybeList = maybeT(list(["a", "b", "c"]));

	maybeList.lift(function (list) {
		assert.deepEqual(list, ["a", "b", "c"]);
	});

	//You can also use `lift` to call a method that is defined in the monad, by specifying the method name as a string

	maybeList.lift("concat", ["d"]).lift("reverse").lift(function (list) {
		assert.deepEqual(list, ["d", "c", "b", "a"]);
	});
}); //this is not executed
//this blows up
//While in the second case we cannot access the underlying value directly, and therefore cannot execute an action on it, if it is not there.

//won't be executed
//--

//--

/*
Under the Hood
--------------
Let's see how the type is implemented
*/

},{"../library/f":1,"../library/identity":3,"../library/list":4,"../library/maybe":5,"../library/maybeT":6,"../library/state":8}],14:[function(require,module,exports){
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

},{"../library/f":1,"../library/promise":7}],15:[function(require,module,exports){
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

},{"../library/f":1,"../library/state":8}],16:[function(require,module,exports){

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

},{"../library/f":1,"../library/stream":9}]},{},[10,11,12,13,14,15,16])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvaGVscGVycy5qcyIsImM6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L2lkZW50aXR5LmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvbGlzdC5qcyIsImM6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L21heWJlLmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvbWF5YmVULmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvcHJvbWlzZS5qcyIsImM6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L3N0YXRlLmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvc3RyZWFtLmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL2ZfdGVzdHMuanMiLCJjOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvbGlzdF90ZXN0cy5qcyIsImM6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9tYXliZVRfdGVzdHMuanMiLCJjOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvbWF5YmVfdGVzdHMuanMiLCJjOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvcHJvbWlzZV90ZXN0cy5qcyIsImM6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9zdGF0ZV90ZXN0cy5qcyIsImM6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9zdHJlYW1fdGVzdHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUEsSUFBSSxPQUFP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LFFBQU0sQ0FBQyxLQUFLLENBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBRSxDQUFBO0NBRzlCLENBQUMsQ0FBQTs7Ozs7Ozs7QUFRRixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFTLE1BQU0sRUFBQzs7QUFDaEMsTUFBTSxRQUFRLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzFCLFFBQU0sQ0FBQyxLQUFLLENBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBO0FBQzlCLFFBQU0sQ0FBQyxLQUFLLENBQUUsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBOztBQUVoQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQTtBQUNuQixRQUFNLENBQUMsS0FBSyxDQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTtBQUN4QixRQUFNLENBQUMsS0FBSyxDQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUUsQ0FBQTtDQUU1QixDQUFDLENBQUE7Ozs7OztBQU1GLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVMsTUFBTSxFQUFDOzs7OztBQUlqQyxNQUFJLEtBQUssR0FBRyxDQUFDLENBQUUsVUFBQSxHQUFHO1dBQUksR0FBRyxHQUFDLENBQUM7R0FBQSxDQUFFLENBQUE7Ozs7QUFLN0IsTUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTs7QUFFNUIsUUFBTSxDQUFDLEtBQUssQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7O0FBRTNCLE1BQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7O0FBRTVCLFFBQU0sQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENB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bnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG5cclxuY29uc3QgaWQgPSBhID0+IGEgLy8tLVxyXG5cclxuXHR2YXIgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBpdC5cclxuLy90aGlzIGlzIHZlcnkgdXNlZnVsIGlmIHlvdSBoYXZlIGEgQVBJIHdoaWNoIGV4cGVjdHMgYSBmdW5jdGlvbiwgYnV0IHlvdSB3YW50IHRvIGZlZWQgaXQgd2l0aCBhIHZhbHVlIChzZWUgdGhlIGBmbGF0bWFwYCBleGFtcGxlKS4gXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiB2YWwgPT09IHVuZGVmaW5lZCA/IGlkIDogZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpID0+IChiIC0+IGMpID0+IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkgPT4gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fS8vLS1cclxuXHJcbi8vQWRkIGFsaWFzZXMgdG8gbWFwIC4gZmxhdCBhcyBmbGF0TWFwIGFuZCBtYXAgLiB0cnlGbGF0IGFzIHBoYXRNYXBcclxuICAgICAgICBtZXRob2RzLmZsYXRNYXAgPSBoZWxwZXJzLmZsYXRNYXBcclxuICAgICAgICBtZXRob2RzLnBoYXRNYXAgPSBoZWxwZXJzLnBoYXRNYXBcclxuXHJcbi8vQWRkIGEgcHJpbnQgZnVuY3Rpb24sIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgICAgICBtZXRob2RzLnByaW50ID0gaGVscGVycy5wcmludFxyXG5cclxuLy9UaGlzIGlzIHRoZSBmdW5jdGlvbiBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgYSBmdW5jdGlvbiBhbmQgYWRkcyBhbiBhdWdtZW50ZWQgZnVuY3Rpb24gb2JqZWN0LCB3aXRob3V0IGV4dGVuZGluZyB0aGUgcHJvdG90eXBlXHJcblxyXG5cdHZhciBmID0gKGZ1bmsgPSBpZCwgbGVuZ3RoID0gZnVuay5sZW5ndGgsIGluaXRpYWxfYXJndW1lbnRzID0gW10pID0+IHtcclxuXHJcblx0XHQvL1dlIGV4cGVjdCBhIGZ1bmN0aW9uLiBJZiB3ZSBhcmUgZ2l2ZW4gYW5vdGhlciB2YWx1ZSwgbGlmdCBpdCB0byBhIGZ1bmN0aW9uXHJcblx0XHRpZih0eXBlb2YgZnVuayAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdHJldHVybiBmKCkub2YoZnVuaylcclxuXHRcdFxyXG5cdFx0Ly9JZiB0aGUgZnVuY3Rpb24gdGFrZXMganVzdCBvbmUgYXJndW1lbnQsIGp1c3QgZXh0ZW5kIGl0IHdpdGggbWV0aG9kcyBhbmQgcmV0dXJuIGl0LlxyXG5cdFx0fWVsc2UgaWYgKCBsZW5ndGggPCAyICl7XHJcblx0XHRcdHJldHVybiBleHRlbmQoZnVuaywgbWV0aG9kcylcclxuXHJcblx0XHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBleHRlbmRlZF9mdW5rID0gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciBhbGxfYXJndW1lbnRzICA9IChpbml0aWFsX2FyZ3VtZW50cykuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgbGVuZ3RoLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0XHR9LCBtZXRob2RzKVxyXG5cdFx0XHRcclxuXHRcdFx0ZXh0ZW5kZWRfZnVuay5fbGVuZ3RoID0gbGVuZ3RoIC0gaW5pdGlhbF9hcmd1bWVudHMubGVuZ3RoXHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX29yaWdpbmFsID0gZnVua1xyXG5cclxuXHRcdFx0cmV0dXJuIGV4dGVuZGVkX2Z1bmtcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGZ1bmN0aW9uIG9iamVjdCBpcyBleHRlbmRlZFxyXG5cclxuXHRmdW5jdGlvbiBleHRlbmQob2JqLCBtZXRob2RzKXtcclxuXHRcdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG5cdH1cclxuXHJcblx0XHJcblx0Zi5vZiA9IHZhbCA9PiBmKCAoKSA9PiB2YWwgKSxcclxuXHJcbi8vVGhlIGxpYnJhcnkgYWxzbyBmZWF0dXJlcyBhIHN0YW5kYXJkIGNvbXBvc2UgZnVuY3Rpb24gd2hpY2ggYWxsb3dzIHlvdSB0byBtYXAgbm9ybWFsIGZ1bmN0aW9ucyB3aXRoIG9uZSBhbm90aGVyXHJcblxyXG5cdGYuY29tcG9zZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9Db252ZXJ0IGZ1bmN0aW9ucyB0byBhbiBhcnJheSBhbmQgZmxpcCB0aGVtIChmb3IgcmlnaHQtdG8tbGVmdCBleGVjdXRpb24pXHJcblx0XHR2YXIgZnVuY3Rpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5yZXZlcnNlKClcclxuXHRcdC8vQ2hlY2sgaWYgaW5wdXQgaXMgT0s6XHJcblx0XHRmdW5jdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmdW5rKXtpZih0eXBlb2YgZnVuayAhPT0gXCJmdW5jdGlvblwiKXt0aHJvdyBuZXcgVHlwZUVycm9yKGZ1bmsrXCIgaXMgbm90IGEgZnVuY3Rpb25cIiApfX0pXHJcblx0XHQvL1JldHVybiB0aGUgZnVuY3Rpb24gd2hpY2ggY29tcG9zZXMgdGhlbVxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vVGFrZSB0aGUgaW5pdGlhbCBpbnB1dFxyXG5cdFx0XHR2YXIgaW5wdXQgPSBhcmd1bWVudHNcclxuXHRcdFx0dmFyIGNvbnRleHRcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9ucy5yZWR1Y2UoZnVuY3Rpb24ocmV0dXJuX3Jlc3VsdCwgZnVuaywgaSl7IFxyXG5cdFx0XHRcdC8vSWYgdGhpcyBpcyB0aGUgZmlyc3QgaXRlcmF0aW9uLCBhcHBseSB0aGUgYXJndW1lbnRzIHRoYXQgdGhlIHVzZXIgcHJvdmlkZWRcclxuXHRcdFx0XHQvL2Vsc2UgdXNlIHRoZSByZXR1cm4gcmVzdWx0IGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uXHJcblx0XHRcdFx0cmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsocmV0dXJuX3Jlc3VsdCkpXHJcblx0XHRcdFx0Ly9yZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuay5hcHBseShjb250ZXh0LCBbcmV0dXJuX3Jlc3VsdF0pKVxyXG5cdFx0XHR9LCB1bmRlZmluZWQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblx0bW9kdWxlLmV4cG9ydHMgPSBmLy8tLVxyXG4iLCJleHBvcnRzLnBoYXRNYXAgPSBmdW5jdGlvbiBwaGF0TWFwKGZ1bmspe1xyXG4gICAgICAgIGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpXHJcbn1cclxuXHJcbmV4cG9ydHMuZmxhdE1hcCA9IGZ1bmN0aW9uIGZsYXRNYXAoZnVuaykge1xyXG4gICAgICAgIGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcbn1cclxuZXhwb3J0cy5wcmludCA9IGZ1bmN0aW9uIHByaW50ICgpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMudG9TdHJpbmcoKSlcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG59XHJcblxyXG4iLCJ2YXIgaWRlbnRpdHkgPSBmdW5jdGlvbih2YWwpe1xyXG4gICAgdmFyIGlkID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG4gICAgaWQuX3ZhbHVlID0gdmFsXHJcbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShpZClcclxufVxyXG5cclxuXHJcbnZhciBtZXRob2RzID0ge1xyXG5cclxuICAgIGZ1bmt0aW9uVHlwZTogXCJpZGVudGl0eVwiLFxyXG5cclxuICAgIGNvbnN0cnVjdG9yIDogaWRlbnRpdHksXHJcbiAgICBcclxuICAgIG9mIDogZnVuY3Rpb24gb2YgKHZhbCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IodmFsKVxyXG4gICAgfSxcclxuXHJcbiAgICBtYXAgOiBmdW5jdGlvbiBtYXAgKGZ1bmspe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKGZ1bmsodGhpcy5fdmFsdWUpKVxyXG4gICAgfSxcclxuXHJcbiAgICBmbGF0IDogZnVuY3Rpb24gZmxhdCAoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvcih0aGlzLl92YWx1ZS5fdmFsdWUpXHJcbiAgICB9LFxyXG5cclxuICAgIHRyeUZsYXQgOiBmdW5jdGlvbiB0cnlGbGF0ICgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKCh0aGlzLl92YWx1ZS5mdW5rdGlvblR5cGUgPT09IFwiaWRlbnRpdHlcIikgPyB0aGlzLl92YWx1ZS5fdmFsdWUgOiB0aGlzLl92YWx1ZSApXHJcbiAgICB9LFxyXG5cclxuICAgIHBoYXRNYXAgOiBmdW5jdGlvbiBwaGF0TWFwKGZ1bmspe1xyXG4gICAgICAgICAgICBpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcChmdW5rKS50cnlGbGF0KClcclxuICAgIH0sXHJcblxyXG4gICAgZmxhdE1hcCA6IGZ1bmN0aW9uIGZsYXRNYXAoZnVuaykge1xyXG4gICAgICAgICAgICBpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcChmdW5rKS5mbGF0KClcclxuICAgIH0sXHJcbiAgICBwcmludCA6IGZ1bmN0aW9uIHByaW50ICgpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnRvU3RyaW5nKCkpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbn1cclxuXHJcbmlkZW50aXR5LnByb3RvdHlwZSA9IG1ldGhvZHMvLy0tXHJcbm1vZHVsZS5leHBvcnRzID0gaWRlbnRpdHkvLy0tXHJcbiIsIlxyXG5cclxudmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxudmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy90aGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIHB1dHMgaXQgaW4gYSBsaXN0LlxyXG5cclxuXHRcdC8vYS5vZihiKSAtPiBiIGFcclxuXHRcdG9mOiB2YWwgPT4gbGlzdCh2YWwpLFxyXG5cclxuLy9gbWFwYCBhcHBsaWVzIGEgZnVuY3Rpb24gdG8gZWFjaCBlbGVtZW50IG9mIHRoZSBsaXN0LCBhcyB0aGUgb25lIGZyb20gdGhlIEFycmF5IHByb3RvdHlwZVxyXG5cdFx0XHJcbi8vYGZsYXRgIHRha2VzIGEgbGlzdCBvZiBsaXN0cyBhbmQgZmxhdHRlbnMgdGhlbSB3aXRoIG9uZSBsZXZlbCBcclxuXHJcblx0XHQvLyhiIC0+IChiIC0+IGMpKS5qb2luKCkgPSBhIC0+IGJcclxuXHRcdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoIHRoaXMucmVkdWNlKChsaXN0LCBlbGVtZW50KSA9PiBbLi4ubGlzdCwgLi4uZWxlbWVudF0sIFtdKSApXHJcblx0XHR9LFxyXG5cdFx0XHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGBcclxuLy9hbmQgd2l0aCBpdCwgeW91ciBmdW5rIGNhbiByZXR1cm4gYm90aCBhIGxpc3Qgb2Ygb2JqZWN0cyBhbmQgYSBzaW5nbGUgb2JqZWN0XHJcblxyXG5cdFx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gbGlzdCggdGhpcy5yZWR1Y2UoKGxpc3QsIGVsZW1lbnQpID0+IFxyXG5cdFx0XHRcdGVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBlbGVtZW50LmNvbnN0cnVjdG9yID09PSBBcnJheT8gWy4uLmxpc3QsIC4uLmVsZW1lbnRdIDogWy4uLmxpc3QsIGVsZW1lbnRdICwgW10pXHJcblx0XHRcdClcclxuXHRcdH0sXHJcblx0XHRmdW5rdGlvblR5cGU6XCJsaXN0XCIvLy0tXHJcblxyXG5cdH0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcblxyXG4vL0FkZCBzdXBwb3J0IGZvciBhcnJheSBleHRyYXMsIHNvIHRoYXQgdGhleSByZXR1cm4gYSBsaXN0IGluc3RlYWQgb2Ygbm9ybWFsIEFycmF5XHJcblxyXG52YXIgYXJyYXlNZXRob2RzID0ge31cclxuXHJcbi8vU29tZSBmdW5jdGlvbnMgYXJlIGRpcmVjdGx5IGxpZnRlZCBmcm9tIHRoZSBBcnJheSBwcm90b3R5cGVcclxuXHJcbnZhciBpbW11dGFibGVGdW5jdGlvbnMgPSBbJ21hcCcsICdjb25jYXQnXVxyXG5cclxuaW1tdXRhYmxlRnVuY3Rpb25zLmZvckVhY2goKGZ1bmspID0+IHsgXHJcblx0YXJyYXlNZXRob2RzW2Z1bmtdID0gZnVuY3Rpb24oLi4uYXJncyl7XHJcblx0XHRcdHJldHVybiBsaXN0KEFycmF5LnByb3RvdHlwZVtmdW5rXS5hcHBseSh0aGlzLCBhcmdzKSlcclxuXHR9XHJcbn0pXHJcblxyXG4vL1RoZSB0eXBlIGFsc28gd3JhcHMgc29tZSBBcnJheSBmdW5jdGlvbnMgaW4gYSB3YXkgdGhhdCBtYWtlcyB0aGVtIGltbXV0YWJsZVxyXG5cclxudmFyIG11dGFibGVGdW5jdGlvbnMgPSBbJ3NwbGljZScsICdyZXZlcnNlJywgJ3NvcnQnXVxyXG5cclxubXV0YWJsZUZ1bmN0aW9ucy5mb3JFYWNoKChmdW5rKSA9PiB7IFxyXG5cdGFycmF5TWV0aG9kc1tmdW5rXSA9IGZ1bmN0aW9uKC4uLmFyZ3Mpe1xyXG5cdFx0XHR2YXIgbmV3QXJyYXkgPSB0aGlzLnNsaWNlKDApXHJcblx0XHRcdEFycmF5LnByb3RvdHlwZVtmdW5rXS5hcHBseShuZXdBcnJheSwgYXJncylcclxuXHRcdFx0cmV0dXJuIG5ld0FycmF5XHJcblx0fVxyXG59KVxyXG5cclxuZXh0ZW5kKG1ldGhvZHMsIGFycmF5TWV0aG9kcylcclxuXHJcbm1ldGhvZHMuZXh0cmFzID0gW11cclxuXHJcbi8vVGhpcyBpcyB0aGUgbGlzdCBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgbm9ybWFsIGFycmF5IGFuZCBhdWdtZW50cyBpdCB3aXRoIHRoZSBhYm92ZSBtZXRob2RzXHJcblx0XHJcblx0dmFyIGxpc3QgPSAoLi4uYXJncykgPT4ge1xyXG5cdFx0aWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXSAhPT0gdW5kZWZpbmVkICYmIGFyZ3NbMF0uZnVua3Rpb25UeXBlID09PSBcImxpc3RcIil7XHJcblx0XHRcdHJldHVybiBhcmdzWzBdXHJcblx0XHQvL0FjY2VwdCBhbiBhcnJheVxyXG5cdFx0fWVsc2UgaWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXSAhPT0gdW5kZWZpbmVkICYmIGFyZ3NbMF0uY29uc3RydWN0b3IgPT09IEFycmF5ICl7XHJcblx0XHRcdHJldHVybiAgT2JqZWN0LmZyZWV6ZShleHRlbmQoYXJnc1swXSwgbWV0aG9kcykpXHJcblx0XHQvL0FjY2VwdCBzZXZlcmFsIGFyZ3VtZW50c1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiBPYmplY3QuZnJlZXplKGV4dGVuZChhcmdzLCBtZXRob2RzKSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGxpc3Qgb2JqZWN0IGlzIGV4dGVuZGVkXHJcblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0XHRyZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKGZ1bmN0aW9uKG9iaiwgbWV0aG9kX25hbWUpe29ialttZXRob2RfbmFtZV0gPSBtZXRob2RzW21ldGhvZF9uYW1lXTsgcmV0dXJuIG9ian0sIG9iailcclxuXHR9XHJcbm1vZHVsZS5leHBvcnRzID0gbGlzdC8vLS1cclxuIiwiICAgICAgICB2YXIgaWQgPSByZXF1aXJlKFwiLi9pZGVudGl0eVwiKS8vLS1cclxuICAgICAgICB2YXIgbWV0aG9kcyA9IE9iamVjdC5jcmVhdGUoaWQucHJvdG90eXBlKS8vLS1cclxuXHJcblx0dmFyIG1heWJlID0gZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IE9iamVjdC5jcmVhdGUobWV0aG9kcylcclxuICAgICAgICAgICAgICAgIG9iai5fdmFsdWUgPSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUob2JqKVxyXG5cdH1cclxuXHJcbi8vYG1hcGAgdGFrZXMgdGhlIGZ1bmN0aW9uIGFuZCBhcHBsaWVzIGl0IHRvIHRoZSB2YWx1ZSBpbiB0aGUgbWF5YmUsIGlmIHRoZXJlIGlzIG9uZS5cclxuICAgICAgICBtZXRob2RzLnByb3RvdHlwZSA9IG1ldGhvZHMvLy0tXHJcbiAgICAgICAgbWV0aG9kcy5jb25zdHJ1Y3RvciA9IG1heWJlLy8tLVxyXG5cclxuXHRtZXRob2RzLmZ1bmt0aW9uVHlwZSA9IFwibWF5YmVcIi8vLS1cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtZXRob2RzLm1hcCA9IGZ1bmN0aW9uIG1hcCAoZnVuayl7XHJcblx0XHRpZih0aGlzLl92YWx1ZSAhPT0gdW5kZWZpbmVkKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoZnVuayh0aGlzLl92YWx1ZSkpXHJcblx0XHR9ZWxzZXtcdFxyXG5cdFx0XHRyZXR1cm4gdGhpcyBcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL2BmbGF0YCB0YWtlcyBhIG1heWJlIHRoYXQgY29udGFpbnMgYW5vdGhlciBtYXliZSBhbmQgZmxhdHRlbnMgaXQuXHJcbi8vSW4gdGhpcyBjYXNlIHRoaXMgbWVhbnMganVzdCByZXR1cm5pbmcgdGhlIGlubmVyIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0bWV0aG9kcy5mbGF0ID0gZnVuY3Rpb24gZmxhdCAoKXtcclxuXHRcdGlmKHRoaXMuX3ZhbHVlICE9PSB1bmRlZmluZWQpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGAgXHJcblxyXG5cdG1ldGhvZHMudHJ5RmxhdCA9IGZ1bmN0aW9uIHRyeUZsYXQgKCl7XHJcblx0XHRpZih0aGlzLl92YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuX3ZhbHVlLmZ1bmt0aW9uVHlwZSA9PT0gXCJtYXliZVwiKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcblxyXG4vL0ZpbmFsbHksIG1heWJlIGRlZmluZXMgb25lIGhlbHBlciBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgdGhlIHByb3BlcnR5IG9mIGFuIG9iamVjdCwgd3JhcHBlZCBpbiBhIG1heWJlOlxyXG5cclxuICAgICAgICBtZXRob2RzLmdldFByb3AgPSBmdW5jdGlvbiBnZXRQcm9wIChwcm9wKXtcclxuXHRcdHJldHVybiB0aGlzLnBoYXRNYXAoICh2YWwpID0+IHRoaXMub2YodmFsW3Byb3BdKSApXHJcblx0fVxyXG5cclxuXHJcblx0XHJcblxyXG4gICAgbWF5YmUucHJvdG90eXBlID0gbWV0aG9kcy8vLS1cclxuICAgIG1vZHVsZS5leHBvcnRzID0gbWF5YmUvLy0tXHJcbiIsIiAgICAgICAgdmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG4gICAgICAgIHZhciBtYXliZSA9IHJlcXVpcmUoXCIuL21heWJlXCIpLy8tLVxyXG4gICAgICAgIHZhciBtZXRob2RzID0gT2JqZWN0LmNyZWF0ZShtYXliZS5wcm90b3R5cGUpXHJcblxyXG5cclxuXHR2YXIgbWF5YmVUID0gZnVuY3Rpb24odmFsdWUpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IE9iamVjdC5jcmVhdGUobWV0aG9kcylcclxuICAgICAgICAgICAgICAgIG9iai5faW5uZXJNb25hZCA9IHZhbHVlXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShvYmopXHJcblx0fVxyXG4gICAgICAgIFxyXG5cdG1ldGhvZHMuZnVua3Rpb25UeXBlID0gXCJtYXliZVRcIi8vLS1cclxuICAgICAgICBtZXRob2RzLmNvbnN0cnVjdG9yID0gbWF5YmVUXHJcblxyXG5cdC8vbSBtYXliZSBhIC0+ICggYSAtPiBtYXliZSBiICkgLT4gbSBtYXliZSBiXHJcblx0bWV0aG9kcy5tYXAgPSBmdW5jdGlvbiBtYXAgKGZ1bmspe1xyXG4gICAgICAgICAgICByZXR1cm4gbWF5YmVUKCB0aGlzLl9pbm5lck1vbmFkLm1hcCgodmFsKSA9PiBcclxuICAgICAgICAgICAgICAgdmFsID09PSB1bmRlZmluZWQgPyB2YWwgOiBmdW5rKHZhbClcclxuICAgICAgICAgICAgKSApXHJcblx0fVxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdG1ldGhvZHMuZmxhdCA9IGZ1bmN0aW9uIGZsYXQgKCl7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXliZVQodGhpcy5faW5uZXJNb25hZC5tYXAoIChpbm5lck1heWJlVCkgPT5cclxuICAgICAgICAgICAgICAgaW5uZXJNYXliZVQgPT09IHVuZGVmaW5lZCA/IHRoaXMuX2lubmVyTW9uYWQub2YodW5kZWZpbmVkKSA6IGlubmVyTWF5YmVULl9pbm5lck1vbmFkIFxyXG4gICAgICAgICAgICApLmZsYXQoKSlcclxuXHR9XHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHRtZXRob2RzLnRyeUZsYXQ9ZnVuY3Rpb24gdHJ5RmxhdCAoKXtcclxuICAgICAgICAgICAgcmV0dXJuIG1heWJlVCh0aGlzLl9pbm5lck1vbmFkLm1hcCggKGlubmVyTWF5YmVUKSA9PntcclxuXHRcdGlmKGlubmVyTWF5YmVUID09PSB1bmRlZmluZWQpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5faW5uZXJNb25hZC5vZih1bmRlZmluZWQpXHJcblx0XHR9ZWxzZSBpZihpbm5lck1heWJlVC5mdW5rdGlvblR5cGUgPT09IFwibWF5YmVUXCIpe1xyXG5cdFx0XHRyZXR1cm4gaW5uZXJNYXliZVQuX2lubmVyTW9uYWRcclxuXHRcdH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faW5uZXJNYXliZVRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSkudHJ5RmxhdCgpKVxyXG5cdH1cclxuXHJcbiAgICAgICAgbWV0aG9kcy5saWZ0ID0gZnVuY3Rpb24oZnVuaywgLi4uYXJncyl7XHJcbiAgICAgICAgICAgIGlmKHR5cGVvZiBmdW5rID09PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBtYXliZVQoZnVuayh0aGlzLl9pbm5lck1vbmFkKSlcclxuICAgICAgICAgICAgfWVsc2UgaWYgKHR5cGVvZiBmdW5rID09PSAnc3RyaW5nJyl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF5YmVUKHRoaXMuX2lubmVyTW9uYWRbZnVua10oLi4uYXJncykpXHJcbiAgICAgICAgICAgIH0gICAgICAgIFxyXG4gICAgICAgIH1cdFxyXG5cclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IG1heWJlVC8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL1RoZSBgb2ZgIG1ldGhvZCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIHByb21pc2UsIGJ5IGltbWVkaWF0ZWx5IGNhbGxpbmcgdGhlIHJlc29sdmVyIGZ1bmN0aW9uIHdpdGggaXQuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbih2YWwpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiByZXNvbHZlKHZhbCkgKVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgbWFwYCBtZXRob2QgY3JlYXRlcyBhIG5ldyBwcm9taXNlLCBzdWNoIHRoYXQgd2hlbiB0aGUgb2xkIHByb21pc2UgaXMgcmVzb2x2ZWQsIGl0IHRha2VzIGl0cyByZXN1bHQsIFxyXG4vL2FwcGxpZXMgYGZ1bmtgIHRvIGl0IGFuZCB0aGVuIHJlc29sdmVzIGl0c2VsZiB3aXRoIHRoZSB2YWx1ZS5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IHRoaXMuX3Jlc29sdmVyKCAodmFsKSA9PiByZXNvbHZlKCBmdW5rKHZhbCkgKSApIClcclxuXHJcblx0fSxcclxuXHJcbi8vSW4gdGhpcyBjYXNlIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiBgZmxhdGAgaXMgcXVpdGUgc2ltcGxlLlxyXG5cclxuLy9FZmZlY3RpdmVseSBhbGwgd2UgaGF2ZSB0byBkbyBpcyByZXR1cm4gdGhlIHNhbWUgdmFsdWUgd2l0aCB3aGljaCB0aGUgaW5uZXIgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoLlxyXG4vL1RvIGRvIHRoaXMsIHdlIHVud3JhcCBvdXIgcHJvbWlzZSBvbmNlIHRvIGdldCB0aGUgaW5uZXIgcHJvbWlzZSB2YWx1ZSwgYW5kIHRoZW4gdW53cmFwIHRoZSBpbm5lclxyXG4vL3Byb21pc2UgaXRzZWxmIHRvIGdldCBpdHMgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IFxyXG5cdFx0XHR0aGlzLl9yZXNvbHZlcihcdChpbm5lcl9wcm9taXNlKSA9PiBcclxuXHRcdFx0XHRpbm5lcl9wcm9taXNlLl9yZXNvbHZlcigodmFsKSA9PiByZXNvbHZlKHZhbCkpXHJcblx0XHRcdCkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGB0cnlGbGF0YCBmdW5jdGlvbiBpcyBhbG1vc3QgdGhlIHNhbWU6XHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gcHJvbWlzZSggKHJlc29sdmUpID0+IFxyXG5cdFx0XHR0aGlzLl9yZXNvbHZlcihcdChpbm5lcl9wcm9taXNlKSA9PiB7IFxyXG5cdFx0XHRcdGlmKGlubmVyX3Byb21pc2UuY29uc3RydWN0b3IgPT09IHByb21pc2Upe1xyXG5cdFx0XHRcdFx0aW5uZXJfcHJvbWlzZS5fcmVzb2x2ZXIoKHZhbCkgPT4gcmVzb2x2ZSh2YWwpKVxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cmVzb2x2ZShpbm5lcl9wcm9taXNlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGBydW5gIGZ1bmN0aW9uIGp1c3QgZmVlZHMgdGhlIHJlc29sdmVyIHdpdGggYSBwbGFjZWhvbGRlciAgZnVuY3Rpb24gc28gb3VyIGNvbXB1dGF0aW9uIGNhblxyXG4vL3N0YXJ0IGV4ZWN1dGluZy5cclxuXHJcblx0cnVuOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcmVzb2x2ZXIoZnVuY3Rpb24oYSl7cmV0dXJuIGF9KVxyXG5cdH1cclxuXHRcclxuICAgIH0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBwcm9taXNlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHByb21pc2UgPSBmdW5jdGlvbihyZXNvbHZlKXtcclxuXHRcdGlmKHR5cGVvZiByZXNvbHZlICE9PSBcImZ1bmN0aW9uXCIpeyByZXR1cm4gbWV0aG9kcy5vZihyZXNvbHZlKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcblxyXG5cdFx0b2JqLl9yZXNvbHZlciA9IHJlc29sdmVcclxuXHRcdG9iai5jb25zdHJ1Y3RvciA9IHByb21pc2VcclxuXHRcdG9iai5wcm90b3R5cGUgPSBtZXRob2RzXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByb21pc2UvLy0tXHJcbiIsIlxyXG4gICAgICAgIGNvbnN0IGYgPSByZXF1aXJlKFwiLi9mXCIpLy8tLVxyXG4gICAgICAgIHZhciBpZCA9IHJlcXVpcmUoXCIuL2lkZW50aXR5XCIpLy8tLVxyXG4gICAgICAgIHZhciBtZXRob2RzID0gT2JqZWN0LmNyZWF0ZShpZC5wcm90b3R5cGUpLy8tLVxyXG5cclxuXHRjb25zdCBzdGF0ZSA9IG1ldGhvZHMuY29uc3RydWN0b3IgPSBmdW5jdGlvbihydW4pe1xyXG5cdFx0aWYodHlwZW9mIHJ1biAhPT0gXCJmdW5jdGlvblwiKXsgcmV0dXJuIG1ldGhvZHMub2YocnVuKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcblx0XHRvYmouX3J1blN0YXRlID0gZihydW4sMSlcclxuXHRcdHJldHVybiBPYmplY3QuZnJlZXplKG9iailcclxuXHR9XHJcblxyXG4vL2BvZmAganVzdCB1c2VzIHRoZSBjb25zdHJ1Y3RvciBhbmQgZG9lcyBub3QgdG91Y2ggdGhlIHN0YXRlLlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0bWV0aG9kcy5vZiA9IGZ1bmN0aW9uIG9mIChpbnB1dCl7XHJcblx0XHRyZXR1cm4gdGhpcy5jb25zdHJ1Y3RvcigocHJldlN0YXRlKSA9PiBbaW5wdXQsIHByZXZTdGF0ZV0pXHJcblx0fVxyXG5cclxuLy9gbWFwYCBpcyBkb25lIGJ5IGFwcGx5aW5nIHRoZSBmdW5jdGlvbiB0byB0aGUgdmFsdWUgYW5kIGtlZXBpbmcgdGhlIHN0YXRlIHVuY2hhbmdlZC5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtZXRob2RzLm1hcCA9IGZ1bmN0aW9uIG1hcCAoZnVuayl7XHJcblx0XHRyZXR1cm4gdGhpcy5jb25zdHJ1Y3RvciggdGhpcy5fcnVuU3RhdGUubWFwKChbaW5wdXQsIHByZXZTdGF0ZV0pID0+IFtmdW5rKGlucHV0KSwgcHJldlN0YXRlXSkpXHJcblx0fVxyXG5cdFxyXG4vL2BmbGF0YCBkb2VzIHRoZSBmb2xsb3dpbmc6XHJcbi8vMS4gUnVucyB0aGUgY29kZSB0aGF0IHdlIGxvYWRlZCBpbiB0aGUgbW9uYWQgc28sIGZhciAodXNpbmcgdGhlIGBydW5gIGZ1bmN0aW9uKS5cclxuLy8yLiBTYXZlcyB0aGUgbmV3IHN0YXRlIG9iamVjdCBhbmQgdGhlIHZhbHVlIHdoaWNoIGlzIGtlcHQgYnkgdGhlIGZ1bmN0aW9ucyBzbyBmYXIuXHJcbi8vMy4gQWZ0ZXIgZG9pbmcgdGhhdCwgaXQgYXJyYW5nZXMgdGhvc2UgdHdvIGNvbXBvbmVudHMgKHRoZSBvYmplY3QgYW5kIHRoZSB2YWx1ZSkgaW50byBhIHlldCBhbm90aGVyXHJcbi8vc3RhdGUgb2JqZWN0LCB3aGljaCBydW5zIHRoZSBtdXRhdG9yIGZ1bmN0aW9uIG9mIHRoZSBmaXJzdCBvYmplY3QsIHdpdGggdGhlIHN0YXRlIHRoYXQgd2UgaGF2ZSBzbywgZmFyXHJcblxyXG5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdG1ldGhvZHMuZmxhdCA9IGZ1bmN0aW9uIGZsYXQgKCl7XHJcblx0XHQvL0V4dHJhY3Qgc3RhdGUgbXV0YXRvciBhbmQgdmFsdWUgXHJcblx0XHRjb25zdCBbc3RhdGVPYmosIGN1cnJlbnRTdGF0ZV0gPSB0aGlzLnJ1bigpXHJcblx0XHQvL0NvbXBvc2UgdGhlIG11dGF0b3IgYW5kIHRoZSB2YWx1ZVxyXG5cdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdH1cclxuXHRtZXRob2RzLnRyeUZsYXQgPSBmdW5jdGlvbiB0cnlGbGF0ICgpe1xyXG5cclxuXHRcdC8vRXh0cmFjdCBjdXJyZW50IHN0YXRlIFxyXG5cdFx0Y29uc3QgW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdID0gdGhpcy5ydW4oKVxyXG5cdFx0XHJcblx0XHQvL0NoZWNrIGlmIGl0IGlzIHJlYWxseSBhIHN0YXRlXHJcblx0XHRpZihzdGF0ZU9iai5jb25zdHJ1Y3RvciA9PT0gc3RhdGUpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jb25zdHJ1Y3RvcigoKSA9PiBzdGF0ZU9iai5fcnVuU3RhdGUoY3VycmVudFN0YXRlKSApXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoKCkgPT4gW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbi8vV2UgaGF2ZSB0aGUgYHJ1bmAgZnVuY3Rpb24gd2hpY2ggY29tcHV0ZXMgdGhlIHN0YXRlOlxyXG5cclxuXHRtZXRob2RzLnJ1biA9IGZ1bmN0aW9uIHJ1biAoKXtcclxuXHRcdHJldHVybiB0aGlzLl9ydW5TdGF0ZSgpXHJcblx0fVxyXG4vL0FuZCB0aGUgYHNhdmVgIGFuZCBgbG9hZGAgZnVuY3Rpb25zIGFyZSBleGFjdGx5IHdoYXQgb25lIHdvdWxkIGV4cGVjdFxyXG5cclxuXHRtZXRob2RzLmxvYWQgPSBmdW5jdGlvbiBsb2FkICgpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiB0aGlzLmNvbnN0cnVjdG9yKCAoc3RhdGUpID0+IFtzdGF0ZSwgc3RhdGVdICkgKVxyXG5cdH1cclxuXHRtZXRob2RzLnNhdmUgPSBmdW5jdGlvbiBzYXZlICgpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiB0aGlzLmNvbnN0cnVjdG9yKCAoc3RhdGUpID0+IFt2YWx1ZSwgdmFsdWVdICkgKVxyXG5cdH1cclxuXHRtZXRob2RzLmxvYWRLZXkgPSBmdW5jdGlvbiBsb2FkS2V5IChrZXkpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiB0aGlzLmNvbnN0cnVjdG9yKCAoc3RhdGUpID0+IFtzdGF0ZVtrZXldLCBzdGF0ZV0gKSApXHJcblx0fVxyXG5cdG1ldGhvZHMuc2F2ZUtleSA9IGZ1bmN0aW9uIHNhdmVLZXkgKGtleSl7XHJcblx0XHRjb25zdCB3cml0ZSA9IChvYmosIGtleSwgdmFsKSA9PiB7XHJcblx0XHRcdG9iaiA9IHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgPyAgb2JqIDoge31cclxuXHRcdFx0b2JqW2tleV0gPSB2YWxcclxuXHRcdFx0cmV0dXJuIG9ialxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiB0aGlzLmNvbnN0cnVjdG9yKCAoc3RhdGUpID0+IFt2YWx1ZSwgd3JpdGUoc3RhdGUsIGtleSwgdmFsdWUpXSApIClcclxuXHR9XHJcblx0XHJcbiAgICAgICAgc3RhdGUucHJvdG90eXBlID0gbWV0aG9kcy8vLS1cclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHN0YXRlLy8tLVxyXG4iLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcbnZhciBtZXRob2RzID0gey8vLS1cclxuXHJcbi8vVGhlIGBvZmAgbWV0aG9kIHRha2VzIGEgdmFsdWUgYW5kIHdyYXBzIGl0IGluIGEgc3RyZWFtLCBieSBpbW1lZGlhdGVseSBjYWxsaW5nIHRoZSBwdXNoZXIgZnVuY3Rpb24gd2l0aCBpdC5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKHZhbCl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gcHVzaCh2YWwpIClcclxuXHR9LFxyXG5cclxuLy9UaGUgYG1hcGAgbWV0aG9kIGNyZWF0ZXMgYSBuZXcgc3RyZWFtLCBzdWNoIHRoYXQgZXZlcnkgdGltZSB0aGUgb2xkIHN0cmVhbSByZWNlaXZlcyBhIHZhbHVlLCBpdFxyXG4vL2FwcGxpZXMgYGZ1bmtgIHRvIGl0IGFuZCB0aGVuIHB1c2hlcyBpdCB0byB0aGUgbmV3IHN0cmVhbS5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gdGhpcy5fcHVzaGVyKCAodmFsKSA9PiBwdXNoKCBmdW5rKHZhbCkgKSApIClcclxuXHJcblx0fSxcclxuXHJcblxyXG4vL0luIHRoaXMgY2FzZSB0aGUgaW1wbGVtZW50YXRpb24gb2YgYGZsYXRgIGlzIHF1aXRlIHNpbXBsZS5cclxuXHJcbi8vRWZmZWN0aXZlbHkgYWxsIHdlIGhhdmUgdG8gZG8gaXMgcmV0dXJuIHRoZSBzYW1lIHZhbHVlIHdpdGggd2hpY2ggdGhlIGlubmVyIHN0cmVhbSBpcyBwdXNoZCB3aXRoLlxyXG4vL1RvIGRvIHRoaXMsIHdlIHVud3JhcCBvdXIgc3RyZWFtIG9uY2UgdG8gZ2V0IHRoZSBpbm5lciBzdHJlYW0gdmFsdWUsIGFuZCB0aGVuIHVud3JhcCB0aGUgaW5uZXJcclxuLy9zdHJlYW0gaXRzZWxmIHRvIGdldCBpdHMgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gXHJcblx0XHRcdHRoaXMuX3B1c2hlcihcdChpbm5lcl9zdHJlYW0pID0+IFxyXG5cdFx0XHRcdGlubmVyX3N0cmVhbS5fcHVzaGVyKCh2YWwpID0+IHB1c2godmFsKSlcclxuXHRcdFx0KSBcclxuXHRcdClcclxuXHR9LFxyXG5cclxuLy9UaGUgYHRyeUZsYXRgIGZ1bmN0aW9uIGlzIGFsbW9zdCB0aGUgc2FtZTpcclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiBcclxuXHRcdFx0dGhpcy5fcHVzaGVyKFx0KGlubmVyX3N0cmVhbSkgPT4geyBcclxuXHRcdFx0XHRpZihpbm5lcl9zdHJlYW0uY29uc3RydWN0b3IgPT09IHN0cmVhbSl7XHJcblx0XHRcdFx0XHRpbm5lcl9zdHJlYW0uX3B1c2hlcigodmFsKSA9PiBwdXNoKHZhbCkpXHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRwdXNoKGlubmVyX3N0cmVhbSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgcnVuYCBmdW5jdGlvbiBqdXN0IGZlZWRzIHRoZSBwdXNoZXIgd2l0aCBhIHBsYWNlaG9sZGVyICBmdW5jdGlvbiBzbyBvdXIgY29tcHV0YXRpb24gY2FuXHJcbi8vc3RhcnQgZXhlY3V0aW5nLlxyXG5cclxuXHRydW46ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiB0aGlzLl9wdXNoZXIoZnVuY3Rpb24oYSl7cmV0dXJuIGF9KVxyXG5cdH0sXHJcblx0XHJcbi8vQWZ0ZXIgdGhlc2UgYXJlIGRvbmUsIGFsbCB3ZSBuZWVkIHRvIGRvIGlzIGltcGxlbWVudCB0aGUgdHJhZGl0aW9uYWwgSlMgYXJyYXkgZnVuY3Rpb25zXHJcblxyXG4vL2BGb3JFYWNoYCBpcyBhbG1vc3QgdGhlIHNhbWUgYXMgYG1hcGAsIGV4Y2VwdCB3ZSBkb24ndCBwdXNoIGBmdW5rKHZhbClgIC0gdGhlIHJlc3VsdCBvZiB0aGUgdHJhbnNmb3JtYXRpb25cclxuLy90byB0aGUgbmV3IHN0cmVhbSwgYnV0IHdlIHB1c2ggYHZhbGAgaW5zdGVhZC5cclxuXHJcblx0Zm9yRWFjaDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiB0aGlzLl9wdXNoZXIoICh2YWwpID0+IHsgXHJcblx0XHRcdHB1c2godmFsKSBcclxuXHRcdFx0ZnVuayh2YWwpXHJcblx0XHR9ICkgKVxyXG5cdH0sXHJcblxyXG4vL1dpdGggZmlsdGVyIHRoZSByZXN1bHQgb2YgYGZ1bmsodmFsKWAgc2hvd3MgdXMgd2hldGhlciB3ZSBuZWVkIHRvIHB1c2ggdGhlIHZhbHVlXHJcblxyXG5cdGZpbHRlcjpmdW5jdGlvbihmdW5rKXtcclxuXHRcdHJldHVybiBzdHJlYW0oIChwdXNoKSA9PiB0aGlzLl9wdXNoZXIoICh2YWwpID0+IHsgXHJcblx0XHRcdGlmKGZ1bmsodmFsKSl7cHVzaCh2YWwpfVxyXG5cdFx0fSApIClcclxuXHR9LFxyXG5cclxuXHRyZWR1Y2U6ZnVuY3Rpb24oZnVuaywgZnJvbSl7XHJcblx0XHRsZXQgYWNjdW11bGF0b3IgPSBmcm9tXHJcblx0XHR0aGlzLl9wdXNoZXIodmFsID0+IHtcclxuXHRcdFx0YWNjdW11bGF0b3IgPSBmdW5rKGFjY3VtdWxhdG9yLCB2YWwpIFxyXG5cdFx0fSlcclxuXHR9LFxyXG59Ly8tLVxyXG5cclxuLy9BZGQgYWxpYXNlcyB0byBtYXAgLiBmbGF0IGFzIGZsYXRNYXAgYW5kIG1hcCAuIHRyeUZsYXQgYXMgcGhhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMuZmxhdE1hcCA9IGhlbHBlcnMuZmxhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMucGhhdE1hcCA9IGhlbHBlcnMucGhhdE1hcFxyXG5cclxuLy9BZGQgYSBwcmludCBmdW5jdGlvbiwgdXNlZCBmb3IgZGVidWdnaW5nLlxyXG4gICAgICAgIG1ldGhvZHMucHJpbnQgPSBoZWxwZXJzLnByaW50XHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgc3RyZWFtIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cdGNvbnN0IHN0cmVhbSA9IGZ1bmN0aW9uKHB1c2gpe1xyXG5cdFx0aWYodHlwZW9mIHB1c2ggIT09IFwiZnVuY3Rpb25cIil7IHJldHVybiBtZXRob2RzLm9mKHB1c2gpIH1cclxuXHRcdGNvbnN0IG9iaiA9IE9iamVjdC5jcmVhdGUobWV0aG9kcylcclxuXHJcblx0XHRvYmouX3B1c2hlciA9IHB1c2hcclxuXHRcdG9iai5jb25zdHJ1Y3RvciA9IHN0cmVhbVxyXG5cdFx0b2JqLnByb3RvdHlwZSA9IG1ldGhvZHNcclxuXHRcdE9iamVjdC5mcmVlemUob2JqKVxyXG5cdFx0cmV0dXJuIG9ialxyXG5cdH1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc3RyZWFtXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogZnVuY3Rpb25cclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGZ1bmN0aW9uIG1vbmFkIGF1Z21lbnRzIHN0YW5kYXJkIEphdmFTY3JpcHQgZnVuY3Rpb25zIHdpdGggZmFjaWxpdGllcyBmb3IgY29tcG9zaXRpb24gYW5kIGN1cnJ5aW5nLlxyXG48IS0tbW9yZS0tPlxyXG5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiZnVuY3Rpb25zXCIpLy8tLVxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjb25zdHJ1Y3QgZnVuY3Rpb25zIGxpbmUgdGhpc1xyXG5cdFxyXG5cdFx0dmFyIHBsdXNfMSA9IGYoIChudW0pID0+IG51bSsxIClcclxuXHJcblxyXG4vL0FmdGVyIHlvdSBkbyB0aGF0LCB5b3Ugd2lsbCBzdGlsbCBiZSBhYmxlIHRvIHVzZSBgcGx1c18xYCBsaWtlIGEgbm9ybWFsIGZ1bmN0aW9uLCBidXQgeW91IGNhbiBhbHNvIGRvIHRoZSBmb2xsb3dpbmc6XHJcblxyXG5cclxuLypcclxuQ3VycnlpbmdcclxuLS0tLVxyXG5XaGVuIHlvdSBjYWxsIGEgZnVuY3Rpb24gYGZgIHdpdGggbGVzcyBhcmd1bWVudHMgdGhhdCBpdCBhY2NlcHRzLCBpdCByZXR1cm5zIGEgcGFydGlhbGx5IGFwcGxpZWRcclxuKGJvdW5kKSB2ZXJzaW9uIG9mIGl0c2VsZiB0aGF0IG1heSBhdCBhbnkgdGltZSBiZSBjYWxsZWQgd2l0aCB0aGUgcmVzdCBvZiB0aGUgYXJndW1lbnRzLlxyXG4qL1xyXG5cclxuXHRRVW5pdC50ZXN0KFwiY3VycnlcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRjb25zdCBhZGQzID0gZiggKGEsYixjKSA9PiBhK2IrYyApXHJcblx0XHRcclxuXHRcdGNvbnN0IGFkZDIgPSBhZGQzKDApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGFkZDIoMSwgMSksIDIgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBhZGQyKDUsIDUpLCAxMCApXHJcblxyXG5cdFx0Y29uc3QgcGx1czEwID0gYWRkMigxMClcclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czEwKDUpLCAxNSApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMxMCgxMCksIDIwIClcclxuXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxuYG9mKHZhbHVlKWBcclxuLS0tLVxyXG5JZiBjYWxsZWQgd2l0aCBhIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBpdCBjb25zdHJ1Y3RzIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGF0IHZhbHVlLlxyXG5JZiBjYWxsZWQgd2l0aG91dCBhcmd1bWVudHMgaXQgcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgdGhlIGFyZ3VtZW50cyBnaXZlbiB0byBpdC5cclxuKi9cclxuXHRRVW5pdC50ZXN0KFwib2ZcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRjb25zdCByZXR1cm5zOSA9IGYoKS5vZig5KVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCByZXR1cm5zOSgzKSwgOSApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHJldHVybnM5KFwiYVwiKSwgOSApXHJcblxyXG5cdFx0Y29uc3QgaWQgPSBmKCkub2YoKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBpZCgzKSwgMyApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGlkKFwiYVwiKSwgXCJhXCIgKVxyXG5cclxuXHR9KS8vLS1cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5DcmVhdGVzIGEgbmV3IGZ1bmN0aW9uIHRoYXQgY2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGZpcnN0LCB0aGVuIGNhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50OlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRcclxuLy9Zb3UgY2FuIGNyZWF0ZSBhIEZ1bmN0aW9uIE1vbmFkIGJ5IHBhc3NpbmcgYSBub3JtYWwgSmF2YVNjcmlwdCBmdW5jdGlvbiB0byB0aGUgY29uc3RydWN0b3IgKHlvdSBjYW4gd3JpdGUgdGhlIGZ1bmN0aW9uIGRpcmVjdGx5IHRoZXJlKTpcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXMxID0gZiggbnVtID0+IG51bSsxIClcclxuXHJcblxyXG4vL1RoZW4gbWFraW5nIGFub3RoZXIgZnVuY3Rpb24gaXMgZWFzeTpcclxuXHJcblx0XHR2YXIgcGx1czIgPSBwbHVzMS5tYXAocGx1czEpIFxyXG5cclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czIoMCksIDIgKVxyXG5cdFx0XHJcblx0XHR2YXIgcGx1czQgPSBwbHVzMi5tYXAocGx1czIpXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzNCgxKSwgNSApXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAgZXhjZXB0IHRoYXQgaWYgYGZ1bmtgIHJldHVybnMgYW5vdGhlciBmdW5jdGlvbiBpdCByZXR1cm5zIGEgdGhpcmQgZnVuY3Rpb24gd2hpY2g6XHJcbjEuIENhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdC5cclxuMi4gQ2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnRcclxuMy4gQ2FsbHMgdGhlIGZ1bmN0aW9uIHJldHVybmVkIGJ5IGBmdW5rYCB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50IGFuZCByZXR1cm5zIHRoZSByZXN1bHQgb2YgdGhlIHNlY29uZCBjYWxsLlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9Zb3UgY2FuIHVzZSBgcGhhdE1hcGAgdG8gbW9kZWwgc2ltcGxlIGlmLXRoZW4gc3RhdGVtZW50cy4gVGhlIGZvbGxvd2luZyBleGFtcGxlIHVzZXMgaXQgaW4gY29tYmluYXRpb24gb2YgdGhlIGN1cnJ5aW5nIGZ1bmN0aW9uYWxpdHk6XHJcblx0XHRcclxuXHRcdHZhciBjb25jYXQgPSBmKCAoc3RyMSwgc3RyMikgPT4gc3RyMSArIHN0cjIpXHJcblxyXG5cdFx0dmFyIG1ha2VNZXNzYWdlID0gZihwYXJzZUludCwgMSlcclxuXHRcdFx0LmZsYXRNYXAoKG51bSkgPT4gaXNOYU4obnVtKT8gZihcIkVycm9yLiBOb3QgYSBudW1iZXJcIikgOiBjb25jYXQoXCJUaGUgbnVtYmVyIGlzIFwiKSApXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIjFcIiksIFwiVGhlIG51bWJlciBpcyAxXCIpXHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIyXCIpLCBcIlRoZSBudW1iZXIgaXMgMlwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiWVwiKSwgXCJFcnJvci4gTm90IGEgbnVtYmVyXCIpXHJcblxyXG4vKlxyXG5cclxuYHBoYXRNYXBgIGlzIHNpbWlsYXIgdG8gdGhlIGA+Pj1gIGZ1bmN0aW9uIGluIEhhc2tlbGwsIHdoaWNoIGlzIHRoZSBidWlsZGluZyBibG9jayBvZiB0aGUgaW5mYW1vdXMgYGRvYCBub3RhdGlvblxyXG5JdCBjYW4gYmUgdXNlZCB0byB3cml0ZSBwcm9ncmFtcyB3aXRob3V0IHVzaW5nIGFzc2lnbm1lbnQuXHRcclxuXHJcbkZvciBleGFtcGxlIGlmIHdlIGhhdmUgdGhlIGZvbGxvd2luZyBmdW5jdGlvbiBpbiBIYXNrZWxsOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gZG8gIFxyXG5cdFx0XHRhIDwtICgqMikgIFxyXG5cdFx0XHRiIDwtICgrMTApICBcclxuXHRcdFx0cmV0dXJuIChhK2IpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cclxuV2hlbiB3ZSBkZXN1Z2FyIGl0LCB0aGlzIGJlY29tZXM6XHJcblxyXG5cdFx0YWRkU3R1ZmYgPSAoKjIpID4+PSBcXGEgLT5cclxuXHRcdFx0XHQoKzEwKSA+Pj0gXFxiIC0+XHJcblx0XHRcdFx0XHRyZXR1cm4gKGErYilcclxuXHJcbm9yIGluIEphdmFTY3JpcHQgdGVybXM6XHJcblxyXG4qL1xyXG5cclxuXHRcdHZhciBhZGRTdHVmZiA9IGYoIG51bSA9PiBudW0gKiAyIClcclxuXHRcdFx0LmZsYXRNYXAoIGEgPT4gZiggbnVtID0+IG51bSArIDEwIClcclxuXHRcdFx0XHQuZmxhdE1hcCggYiA9PiBmLm9mKGEgKyBiKSApIFxyXG5cdFx0XHQpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBsaXN0IFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYGxpc3RgIHR5cGUsIGF1Z21lbnRzIHRoZSBzdGFuZGFyZCBKYXZhU2NyaXB0IGFycmF5cywgbWFraW5nIHRoZW0gaW1tdXRhYmxlIGFuZCBhZGRpbmcgYWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5IHRvIHRoZW1cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIkxpc3RcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgbGlzdGAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbGlzdCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2xpc3RcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY3JlYXRlIGEgYGxpc3RgIGZyb20gYXJyYXkgbGlrZSB0aGlzXHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoWzEsMiwzXSlcclxuLy9vciBsaWtlIHRoaXM6XHJcblx0XHR2YXIgbXlfbGlzdCA9IGxpc3QoMSwyLDMpXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcblN0YW5kYXJkIGFycmF5IG1ldGhvZC4gRXhlY3V0ZXMgYGZ1bmtgIGZvciBlYWNoIG9mIHRoZSB2YWx1ZXMgaW4gdGhlIGxpc3QgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbGlzdC5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdHZhciBwZW9wbGUgPSBsaXN0KCB7bmFtZTpcImpvaG5cIiwgYWdlOjI0LCBvY2N1cGF0aW9uOlwiZmFybWVyXCJ9LCB7bmFtZTpcImNoYXJsaWVcIiwgYWdlOjIyLCBvY2N1cGF0aW9uOlwicGx1bWJlclwifSlcclxuXHR2YXIgbmFtZXMgPSBwZW9wbGUubWFwKChwZXJzb24pID0+IHBlcnNvbi5uYW1lIClcclxuXHRhc3NlcnQuZGVlcEVxdWFsKG5hbWVzLCBbXCJqb2huXCIsIFwiY2hhcmxpZVwiXSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgbGlzdCBvciBhbiBhcnJheSBpdCBmbGF0dGVucyB0aGUgcmVzdWx0cyBpbnRvIG9uZSBhcnJheVxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcclxuXHR2YXIgb2NjdXBhdGlvbnMgPSBsaXN0KFsgXHJcblx0XHR7b2NjdXBhdGlvbjpcImZhcm1lclwiLCBwZW9wbGU6W1wiam9oblwiLCBcInNhbVwiLCBcImNoYXJsaWVcIl0gfSxcclxuXHRcdHtvY2N1cGF0aW9uOlwicGx1bWJlclwiLCBwZW9wbGU6W1wibGlzYVwiLCBcInNhbmRyYVwiXSB9LFxyXG5cdF0pXHJcblx0XHJcblx0dmFyIHBlb3BsZSA9IG9jY3VwYXRpb25zLnBoYXRNYXAoKG9jY3VwYXRpb24pID0+IG9jY3VwYXRpb24ucGVvcGxlKVxyXG5cdGFzc2VydC5kZWVwRXF1YWwocGVvcGxlLFtcImpvaG5cIiwgXCJzYW1cIiwgXCJjaGFybGllXCIsIFwibGlzYVwiLCBcInNhbmRyYVwiXSlcclxuXHJcbn0pLy8tLVxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuIiwidmFyIG1heWJlVCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L21heWJlVFwiKVxyXG52YXIgbGlzdCA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2xpc3RcIilcclxudmFyIHN0YXRlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvc3RhdGVcIilcclxuXHJcblFVbml0Lm1vZHVsZShcIm1heWJlVFwiKVxyXG5cclxuUVVuaXQudGVzdChcImxpc3RcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcbiAgICB2YXIgYmMgPSBtYXliZVQobGlzdCh7YTpcImJcIn0sIHthOlwiY1wifSkpLmdldFByb3AoXCJhXCIpXHJcbiAgICBhc3NlcnQuZGVlcEVxdWFsKGJjLl9pbm5lck1vbmFkLCBbXCJiXCIsIFwiY1wiXSlcclxuICAgIHZhciBhYmMgPSBiYy5saWZ0KFwicmV2ZXJzZVwiKS5saWZ0KFwiY29uY2F0XCIsIFtcImFcIl0pXHJcbiAgICBhc3NlcnQuZGVlcEVxdWFsKGFiYy5faW5uZXJNb25hZCwgW1wiY1wiLCBcImJcIiwgXCJhXCJdKVxyXG59KVxyXG4vKlxyXG5RVW5pdC50ZXN0KFwic3RhdGVcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcbiAgICBtYXliZVQoc3RhdGUoMSkpXHJcbiAgICAubWFwKClcclxufSlcclxuXHJcbiovXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogbWF5YmVcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBtYXliZWAgdHlwZSwgYWxzbyBrbm93biBhcyBgb3B0aW9uYCB0eXBlIGlzIGEgY29udGFpbmVyIGZvciBhIHZhbHVlIHRoYXQgbWF5IG5vdCBiZSB0aGVyZS4gXHJcblxyXG5UaGUgcHVycG9zZSBvZiB0aGlzIG1vbmFkIGlzIHRvIGVsaW1pbmF0ZSB0aGUgbmVlZCBmb3Igd3JpdGluZyBgbnVsbGAgY2hlY2tzLiBcclxuRnVydGhlcm1vcmUgaXQgYWxzbyBlbGltaW5hdGVzIHRoZSBwb3NzaWJpbGl0eSBvZiBtYWtpbmcgZXJyb3JzIGJ5IG1pc3NpbmcgbnVsbC1jaGVja3MuXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5cclxudmFyIGlkZW50aXR5ID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvaWRlbnRpdHlcIikvLy0tXHJcbnZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxudmFyIGxpc3QgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9saXN0XCIpLy8tLVxyXG52YXIgc3RhdGUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9zdGF0ZVwiKS8vLS1cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYG1heWJlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuICAgIHZhciBtYXliZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L21heWJlXCIpXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIHdyYXAgYSB2YWx1ZSBpbiBgbWF5YmVgIHdpdGg6XHJcbiAgICB2YXIgdmFsID0gNC8vLS1cclxuICAgIHZhciBtYXliZV92YWwgPSBtYXliZSh2YWwpXHJcblxyXG4vL0lmIHRoZSAndmFsJyBpcyBlcXVhbCB0byAqdW5kZWZpbmVkKiBpdCB0aHJlYXRzIHRoZSBjb250YWluZXIgYXMgZW1wdHkuXHJcblxyXG5cclxuLy9Zb3UgY2FuIGFsc28gY29tYmluZSBhIGBtYXliZWAgd2l0aCBhbiBleGlzdGluZyBtb25hZCwgdXNpbmcgdGhlIGBtYXliZVRgIGNvbnN0cnVjdG9yOlxyXG5cclxuICAgIHZhciBtYXliZVQgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVRcIilcclxuICAgIGNvbnN0IG1heWJlTGlzdCA9IG1heWJlVChsaXN0KDEsMiwzKSlcclxuXHJcblxyXG52YXIgdGVzdCA9IChtYXliZSk9PnsvLy0tXHJcbi8qXHJcbkJhc2ljIE1ldGhvZHNcclxuLS0tXHJcblxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIGBmdW5rYCB3aXRoIHRoZSBgbWF5YmVgJ3MgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGJ1dCBvbmx5IGlmIHRoZSB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSAqdW5kZWZpbmVkKiwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbWF5YmUuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vVHJhZGl0aW9uYWxseSwgaWYgd2UgaGF2ZSBhIHZhbHVlIHRoYXQgbWF5IGJlIHVuZGVmaW5lZCB3ZSBkbyBhIG51bGwgY2hlY2sgYmVmb3JlIGRvaW5nIHNvbWV0aGluZyB3aXRoIGl0OlxyXG5cclxuXHR2YXIgb2JqID0ge30vLy0tXHJcblx0dmFyIGdldF9wcm9wZXJ0eSA9IGYoKG9iamVjdCkgPT4gb2JqZWN0LnByb3BlcnR5KS8vLS1cclxuXHRcclxuXHR2YXIgdmFsID0gZ2V0X3Byb3BlcnR5KG9iailcclxuXHRcclxuXHRpZih2YWwgIT09IHVuZGVmaW5lZCl7XHJcblx0XHR2YWwgPSB2YWwudG9TdHJpbmcoKVxyXG5cdH1cclxuXHRhc3NlcnQuZXF1YWwodmFsLCB1bmRlZmluZWQpIFxyXG5cclxuLy9XaXRoIGBtYXBgIHRoaXMgY2FuIGJlIHdyaXR0ZW4gbGlrZSB0aGlzXHJcblxyXG4gXHR2YXIgbWF5YmVfZ2V0X3Byb3BlcnR5ID0gZ2V0X3Byb3BlcnR5Lm1hcChtYXliZSlcclxuXHRtYXliZV9nZXRfcHJvcGVydHkob2JqKS5tYXAoKHZhbCkgPT4ge1xyXG5cdFx0YXNzZXJ0Lm9rKGZhbHNlKS8vLS1cclxuXHRcdHZhbC50b1N0cmluZygpLy90aGlzIGlzIG5vdCBleGVjdXRlZFxyXG5cdH0pXHJcblxyXG4vL1RoZSBiaWdnZXN0IGJlbmVmaXQgd2UgZ2V0IGlzIHRoYXQgaW4gdGhlIGZpcnN0IGNhc2Ugd2UgY2FuIGVhc2lseSBmb3JnZXQgdGhlIG51bGwgY2hlY2s6XHJcblx0XHJcblx0YXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe1xyXG5cdFx0Z2V0X3Byb3BlcnR5KG9iaikudG9TdHJpbmcoKSAgLy90aGlzIGJsb3dzIHVwXHJcblx0fSlcclxuXHJcbi8vV2hpbGUgaW4gdGhlIHNlY29uZCBjYXNlIHdlIGNhbm5vdCBhY2Nlc3MgdGhlIHVuZGVybHlpbmcgdmFsdWUgZGlyZWN0bHksIGFuZCB0aGVyZWZvcmUgY2Fubm90IGV4ZWN1dGUgYW4gYWN0aW9uIG9uIGl0LCBpZiBpdCBpcyBub3QgdGhlcmUuXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblxyXG5TYW1lIGFzIGBtYXBgLCBidXQgaWYgYGZ1bmtgIHJldHVybnMgYSBgbWF5YmVgIGl0IGZsYXR0ZW5zIHRoZSB0d28gYG1heWJlc2AgaW50byBvbmUuXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJmbGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9gbWFwYCB3b3JrcyBmaW5lIGZvciBlbGltaW5hdGluZyBlcnJvcnMsIGJ1dCBpdCBkb2VzIG5vdCBzb2x2ZSBvbmUgb2YgdGhlIG1vc3QgYW5ub3lpbmcgcHJvYmxlbXMgd2l0aCBudWxsLWNoZWNrcyAtIG5lc3Rpbmc6XHJcblxyXG5cdHZhciBvYmogPSB7IGZpcnN0OiB7c2Vjb25kOlwidmFsXCIgfSB9XHJcblx0XHJcblx0bWF5YmUob2JqKVxyXG5cdFx0Lm1hcCggcm9vdCA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5tYXAoIG1heWJlRmlyc3QgPT4gbWF5YmVGaXJzdC5tYXAgKGZpcnN0ID0+IG1heWJlIChtYXliZUZpcnN0LnNlY29uZCApICkgKSBcclxuXHRcdC5tYXAoIG1heWJlTWF5YmVWYWx1ZSA9PiBtYXliZU1heWJlVmFsdWUubWFwIChtYXliZVZhbHVlID0+IG1heWJlVmFsdWUubWFwKCAodmFsdWUpPT4oIGFzc2VydC5lcXVhbCggdmFsLCBcInZhbFwiKSApICkgKSApXHJcblxyXG4vL2BwaGF0TWFwYCBkb2VzIHRoZSBmbGF0dGVuaW5nIGZvciB1cywgYW5kIGFsbG93cyB1cyB0byB3cml0ZSBjb2RlIGxpa2UgdGhpc1xyXG5cclxuXHRtYXliZShvYmopXHJcblx0XHQuZmxhdE1hcChyb290ID0+IG1heWJlKHJvb3QuZmlyc3QpKVxyXG5cdFx0LmZsYXRNYXAoZmlyc3QgPT4gbWF5YmUoZmlyc3Quc2Vjb25kKSlcclxuXHRcdC5mbGF0TWFwKHZhbCA9PiB7XHJcblx0XHRcdGFzc2VydC5lcXVhbCh2YWwsIFwidmFsXCIpXHJcblx0XHR9KVxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5IZWxwZXJzXHJcbi0tLS1cclxuXHJcbmBnZXRQcm9wKHByb3BOYW1lKWBcclxuLS0tLVxyXG5Bc3N1bWluZyB0aGUgdmFsdWUgaW5zaWRlIHRoZSBgbWF5YmVgIGlzIGFuIG9iamVjdCwgdGhpcyBtZXRob2Qgc2FmZWx5IHJldHJpZXZlcyBvbmUgb2YgdGhlIG9iamVjdCdzIHByb3BlcnRpZXMuXHJcbiovXHJcblxyXG5cclxuXHJcbi8qXHJcbkFkdmFuY2VkIFVzYWdlXHJcbi0tLS1cclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJhZHZhbmNlZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuLy8gYG1heWJlYCBjYW4gYmUgdXNlZCB3aXRoIHRoZSBmdW5jdGlvbiBtb25hZCB0byBlZmZlY3RpdmVseSBwcm9kdWNlICdzYWZlJyB2ZXJzaW9ucyBvZiBmdW5jdGlvbnNcclxuXHJcblx0dmFyIGdldCA9IGYoKHByb3AsIG9iaikgPT4gb2JqW3Byb3BdKVxyXG5cdHZhciBtYXliZUdldCA9IGdldC5tYXAobWF5YmUpXHJcblxyXG4vL1RoaXMgY29tYmluZWQgd2l0aCB0aGUgdXNlIG9mIGN1cnJ5aW5nIG1ha2VzIGZvciBhIHZlcnkgZmx1ZW50IHN0eWxlIG9mIGNvZGluZzpcclxuXHJcblx0dmFyIGdldEZpcnN0U2Vjb25kID0gKHJvb3QpID0+IG1heWJlKHJvb3QpLnBoYXRNYXAobWF5YmVHZXQoJ2ZpcnN0JykpLnBoYXRNYXAobWF5YmVHZXQoJ3NlY29uZCcpKVxyXG5cdFxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ2YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwib3RoZXJfdmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwib3RoZXJfdmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDogXCJcIiB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIndoYXRldmVyXCIpICkvL3dvbid0IGJlIGV4ZWN1dGVkIFxyXG59KS8vLS1cclxuXHJcbn0vLy0tXHJcblFVbml0Lm1vZHVsZShcIk1heWJlXCIpLy8tLVxyXG50ZXN0KG1heWJlKS8vLS1cclxuUVVuaXQubW9kdWxlKFwiTWF5YmVUXCIpLy8tLVxyXG50ZXN0KCh2YWwpPT5tYXliZVQoaWRlbnRpdHkodmFsKSkpLy8tLVxyXG5cclxuICAgIFxyXG4vKlxyXG5Db21iaW5pbmcgd2l0aCBPdGhlciBNb25hZHNcclxuLS0tLVxyXG5pbiBhZGRpdGlvbiB0byBjcmVhdGluZyBhIGBtYXliZWAgZnJvbSBhIHBsYWluIHZhbHVlLCB5b3UgY2FuIGFsc28gY3JlYXRlIG9uZSBmcm9tIGFuIGV4aXN0aW5nIG1vbmFkLCB1c2luZyB0aGUgYG1heWJldGAgY29uc3RydWN0b3I6XHJcblxyXG50aGUgcmVzdWx0aW5nIG1vbmFkIHdpbGwgZ2FpbiBhbGwgdGhlIGNoYXJhY3RlcmlzdGljcyBvZiBhIGBtYXliZWAgd2l0aG91dCBsb3NpbmcgdGhlIGNoYXJhY3RlcmlzdGljcyBvZiB0aGUgdW5kZXJseWluZyBtb25hZC5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImJhc2ljXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4gICAgXHJcbi8vQ29tYmluaW5nIGEgbWF5YmUgd2l0aCBhIGxpc3QsIGZvciBleGFtcGxlLCBjcmVhdGVzIGEgbGlzdCB3aGVyZSBlYWNoIG9mIHRoZSB2YWx1ZXMgYXJlIGBtYXliZWBzXHJcbi8vSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlIGBtYXBgIHdpbGwgZ2V0IGNhbGxlZCBvbmx5IGZvciB0aGUgZmlyc3QgdmFsdWU6XHJcblxyXG4gICAgbWF5YmVUKGxpc3QoMSwgdW5kZWZpbmVkKSkubWFwKCh2YWwpPT57XHJcbiAgICAgICAgYXNzZXJ0LmVxdWFsKHZhbCwgMSkgICBcclxuICAgIH0pXHJcblxyXG59KS8vLS1cclxuXHJcblFVbml0LnRlc3QoXCJsaXN0XCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4vL1RoaXMgbWVhbnMgeW91IGNhbiB1c2UgbWF5YmUgdG8gc2FmZWx5IHRyYW5zZm9ybSB0aGUgbGlzdCBpdGVtcy5cclxuLy9JZiBhIGxpc3QgdmFsdWUgaXMgdW5kZWZpbmVkLCBpdCB3aWxsIGp1c3Qgc3RheSB1bmRlZmluZWQuXHJcblxyXG4gICAgbWF5YmVUKGxpc3Qoe2ZpcnN0Onsgc2Vjb25kOlwidmFsdWVcIiB9IH0sIHtmaXJzdDp7IHNlY29uZDpcIm90aGVyIHZhbHVlXCIgfSB9LCB7IGZpcnN0OlwiXCJ9ICkpXHJcbiAgICAgICAgLnBoYXRNYXAoKHZhbCk9PiBtYXliZVQodmFsLmZpcnN0KSApXHJcbiAgICAgICAgLnBoYXRNYXAoKHZhbCk9PiBtYXliZVQodmFsLnNlY29uZCkgKVxyXG4gICAgICAgIC5saWZ0KGxpc3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChsaXN0LCBbXCJ2YWx1ZVwiLCBcIm90aGVyIHZhbHVlXCIsIHVuZGVmaW5lZF0pXHJcbiAgICAgICAgfSlcclxufSkvLy0tXHJcblxyXG5cclxuLypcclxuYGxpZnQoZnVuaylgXHJcbi0tLS1cclxuSW4gYWRkaXRpb24gdG8gYWxsIG90aGVyIG1ldGhvZHMsIGBtYXliZWAgdmFsdWVzLCB0aGF0IGFyZSBjcmVhdGVkIGZyb20gb3RoZXIgbW9uYWRzIHVzaW5nIHRoZSBgbWF5YmVUYCBjb25zdHJ1Y3RvclxyXG5oYXZlIHRoZSBgbGlmdGAgbWV0aG9kIHdoaWNoIGVuYWJsZXMgeW91IHRvIGV4ZWN1dGUgYSBmdW5jdGlvbiB0byB0aGUgdW5kZXJseWluZyBtb25hZDpcclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImxpZnRcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcbiAgICBjb25zdCBtYXliZUxpc3QgPSBtYXliZVQobGlzdChbXCJhXCIsXCJiXCIsXCJjXCJdKSlcclxuICAgIFxyXG4gICAgbWF5YmVMaXN0LmxpZnQoKGxpc3QpID0+e1xyXG4gICAgICAgIGFzc2VydC5kZWVwRXF1YWwobGlzdCwgW1wiYVwiLCBcImJcIiwgXCJjXCJdKVxyXG4gICAgfSlcclxuXHJcbi8vWW91IGNhbiBhbHNvIHVzZSBgbGlmdGAgdG8gY2FsbCBhIG1ldGhvZCB0aGF0IGlzIGRlZmluZWQgaW4gdGhlIG1vbmFkLCBieSBzcGVjaWZ5aW5nIHRoZSBtZXRob2QgbmFtZSBhcyBhIHN0cmluZ1xyXG5cclxuICAgIG1heWJlTGlzdFxyXG4gICAgICAgIC5saWZ0KFwiY29uY2F0XCIsIFtcImRcIl0pXHJcbiAgICAgICAgLmxpZnQoXCJyZXZlcnNlXCIpXHJcbiAgICAgICAgLmxpZnQoKGxpc3QpID0+IHtcclxuICAgICAgICAgICAgYXNzZXJ0LmRlZXBFcXVhbChsaXN0LCBbXCJkXCIsIFwiY1wiLCBcImJcIiwgXCJhXCJdKVxyXG4gICAgICAgIH0pXHJcblxyXG59KS8vLS1cclxuXHJcblxyXG5cclxuXHJcblxyXG4vKlxyXG5VbmRlciB0aGUgSG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBwcm9taXNlIFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHByb21pc2VgIHR5cGUsIGFsc28ga25vd24gYXMgYGZ1dHVyZWAgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgd2hpY2ggd2lsbCBiZSByZXNvbHZlZCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUsIFxyXG52aWEgYW4gYXN5bmNocm9ub3VzIG9wZXJhdGlvbi4gXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJQcm9taXNlXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYHByb21pc2VgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdHZhciBwcm9taXNlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvcHJvbWlzZVwiKVxyXG5cdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UbyBjcmVhdGUgYSBgcHJvbWlzZWAgcGFzcyBhIGZ1bmN0aW9uIHdoaWNoIGFjY2VwdHMgYSBjYWxsYmFjayBhbmQgY2FsbHMgdGhhdCBjYWxsYmFjayB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWU6XHJcblxyXG5cdHZhciBteV9wcm9taXNlID0gcHJvbWlzZSggKHJlc29sdmUpID0+ICBcclxuXHRcdHNldFRpbWVvdXQoKCkgPT4geyByZXNvbHZlKDUpIH0sMTAwMCkgIFxyXG5cdClcclxuXHJcbi8vIEluIG1vc3QgY2FzZXMgeW91IHdpbGwgYmUgY3JlYXRpbmcgcHJvbWlzZXMgdXNpbmcgaGVscGVyIGZ1bmN0aW9ucyBsaWtlOlxyXG5cclxuXHRjb25zdCBnZXRVcmwgPSAodXJsKSA9PiBwcm9taXNlKCAocmVzb2x2ZSkgPT4ge1xyXG5cdCAgY29uc3QgcnEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxyXG4gIFx0ICBycS5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKEpTT04ucGFyc2UocnEucmVzcG9uc2VUZXh0KSlcclxuXHQgIHJxLm9wZW4oXCJHRVRcIix1cmwsdHJ1ZSk7XHJcblx0ICBycS5zZW5kKCk7XHJcblx0fSlcclxuLypcclxuYHJ1bigpYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIHRoZSBwcm9taXNlIGFuZCBmZXRjaGVzIHRoZSBkYXRhLlxyXG5cclxuKioqXHJcbkZvciBleGFtcGxlIHRvIG1ha2UgYSBwcm9taXNlIGFuZCBydW4gaXQgaW1tZWRpYXRlbHkgZG86XHJcbiovXHJcblx0Z2V0VXJsKFwicGVvcGxlLmpzb25cIikucnVuKClcclxuXHQvL1tcclxuXHQvLyAgeyBcIm5hbWVcIjpcImpvaG5cIiwgXCJvY2N1cGF0aW9uXCI6XCJwcm9ncmFtbWVyXCJ9LFxyXG4gXHQvLyAge1wibmFtZVwiOlwiamVuXCIsIFwib2NjdXBhdGlvblwiOlwiYWRtaW5cIn1cclxuXHQvL11cclxuXHJcblx0Z2V0VXJsKFwib2NjdXBhdGlvbnMuanNvblwiKS5ydW4oKVxyXG5cdC8ve1xyXG5cdC8vICBcInByb2dyYW1tZXJcIjogXCJ3cml0ZXMgY29kZVwiXHJcblx0Ly8gIFwiYWRtaW5cIjogXCJtYW5hZ2VzIGluZnJhc3RydWN0dXJlXCJcclxuXHQvL31cclxuXHJcbi8qXHJcbi8vTm90ZSB0aGF0IHdlIHdpbGwgYmUgdXNpbmcgdGhlIGRhdGEgZnJvbSB0aGVzZSB0d28gZmlsZXMgaW4gdGhlIG5leHQgZXhhbXBsZXMuIFxyXG5cclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5SZXR1cm5zIGEgbmV3IHByb21pc2UsIHdoaWNoIGFwcGxpZXMgYGZ1bmtgIHRvIHRoZSBkYXRhIHdoZW4geW91IHJ1biBpdC5cclxuXHJcbioqKlxyXG5UaGUgZnVuY3Rpb24gY2FuIGJlIHVzZWQgYm90aCBmb3IgbWFuaXB1bGF0aW5nIHRoZSBkYXRhIHlvdSBmZXRjaCBhbmQgZm9yIHJ1bm5pbmcgc2lkZSBlZmZlY3RzICBcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Y29uc3Qgc3RvcCA9IGFzc2VydC5hc3luYygpLy8tLVxyXG5cdGdldFVybChcInBlb3BsZS5qc29uXCIpXHJcblx0ICBcclxuXHQgIC8vVXNpbmcgXCJtYXBcIiBmb3IgbWFuaXB1bGF0aW5nIGRhdGFcclxuXHQgIC5tYXAoKHBlb3BsZSkgPT4gcGVvcGxlLm1hcCgocGVyc29uKSA9PiBwZXJzb24ubmFtZSkpXHJcblxyXG5cdCAgLy9Vc2luZyBcIm1hcFwiIGZvciB0cmlnZ2VyaW5nIHNpZGUgZWZmZWN0cyBcclxuXHQgIC5tYXAobmFtZXMgPT4ge1xyXG5cdCAgICBhc3NlcnQuZGVlcEVxdWFsKG5hbWVzLCBbJ2pvaG4nLCAnamVuJ10pXHJcblx0ICAgIHN0b3AoKS8vLS1cclxuXHQgIH0pLnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcbkEgbW9yZSBwb3dlcmZ1bCB2ZXJzaW9uIG9mIGBtYXBgIHdoaWNoIGNhbiBhbGxvd3MgeW91IHRvIGNoYWluIHNldmVyYWwgc3RlcHMgb2YgdGhlIGFzeWNocm9ub3VzIGNvbXB1dGF0aW9ucyB0b2dldGhlci5cclxuS25vd24gYXMgYHRoZW5gIGZvciB0cmFkaXRpb25hbCBwcm9taXNlIGxpYnJhcmllcy5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Y29uc3QgZG9uZSA9IGFzc2VydC5hc3luYygpLy8tLVx0XHJcblxyXG4vL0ZvciBleGFtcGxlIGhlcmUgaXMgYSBmdW5jdGlvbiB3aGljaCByZXRyaWV2ZXMgYSBwZXJzb24ncyBvY2N1cGF0aW9uIGZyb20gdGhlIGBwZW9wbGUuanNvbmAgZmlsZVxyXG4vL2FuZCB0aGVuIHJldHJpZXZlcyB0aGUgb2NjdXBhdGlvbidzIGRlc2NyaXB0aW9uIGZyb20gYG9jY3VwYXRpb25zLmpzb25gLiBcclxuXHJcblx0Y29uc3QgZ2V0T2NjdXBhdGlvbkRlc2NyaXB0aW9uID0gKG5hbWUpID0+IGdldFVybChcInBlb3BsZS5qc29uXCIpXHJcblxyXG5cdCAgLy9SZXRyaWV2ZSBwZXJzb24gZGF0YVxyXG5cdCAgLnBoYXRNYXAoKHBlb3BsZSkgPT4gcGVvcGxlLmZpbHRlciggcGVyc29uID0+IHBlcnNvbi5uYW1lID09PSBuYW1lIClbMF0pXHJcblxyXG5cdCAgLy9SZXRyaWV2ZSBpdHMgb2NjdXBhdGlvblxyXG5cdCAgLnBoYXRNYXAoIChwZXJzb24pID0+IGdldFVybChcIm9jY3VwYXRpb25zLmpzb25cIilcclxuXHQgICAgLm1hcChvY2N1cGF0aW9ucyA9PiBvY2N1cGF0aW9uc1twZXJzb24ub2NjdXBhdGlvbl0pIClcclxuXHJcbi8vSGVyZSBpcyBob3cgdGhlIGZ1bmN0aW9uIGlzIHVzZWQ6XHJcblxyXG5cdGdldE9jY3VwYXRpb25EZXNjcmlwdGlvbihcImpvaG5cIikubWFwKChkZXNjKSA9PiB7IFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGRlc2MsIFwid3JpdGVzIGNvZGVcIikgXHJcblx0XHRkb25lKCkvLy0tXHJcblx0fSkucnVuKClcclxuXHRcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IHN0YXRlXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgc3RhdGVgIHR5cGUsIGlzIGEgY29udGFpbmVyIHdoaWNoIGVuY2Fwc3VsYXRlcyBhIHN0YXRlZnVsIGZ1bmN0aW9uLiBJdCBiYXNpY2FsbHkgYWxsb3dzIHlvdSB0byBjb21wb3NlIGZ1bmN0aW9ucyxcclxubGlrZSB5b3UgY2FuIGRvIHdpdGggdGhlIGBmYCB0eXBlLCBleGNlcHQgd2l0aCBpdCBhbnkgZnVuY3Rpb24gY2FuIGFjY2VzcyBhbiBhZGRpdGlvbmFsIFwidmFyaWFibGVcIiBiZXNpZGVzIGl0c1xyXG5pbnB1dCBhcmd1bWVudChzKSAtIHRoZSBzdGF0ZS4gXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJTdGF0ZVwiKS8vLS1cclxuXHJcbi8vVG8gdXNlIHRoZSBgc3RhdGVgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIHN0YXRlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvc3RhdGVcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9JbiB0aGUgY29udGV4dCBvZiB0aGlzIHR5cGUgYSBzdGF0ZSBpcyByZXByZXNlbnRlZCBieSBhIGZ1bmN0aW9uIHRoYXQgYWNjZXB0cyBhIHN0YXRlIFxyXG4vL2FuZCByZXR1cm5zIGEgbGlzdCB3aGljaCBjb250YWlucyBhIHZhbHVlIGFuZCBhIG5ldyBzdGF0ZS4gU28gZm9yIGV4YW1wbGU6XHJcblxyXG5cdHN0YXRlKCh2YWwpID0+IFt2YWwrMSwgdmFsXSlcclxuXHJcbi8vQ3JlYXRlcyBhIG5ldyBzdGF0ZWZ1bCBjb21wdXRhdGlvbiB3aGljaCBpbmNyZW1lbnRzIHRoZSBpbnB1dCBhcmd1bWVudCBhbmQgdGhlbiBzYXZlcyBpdCBpbiB0aGUgc3RhdGUuXHJcblxyXG5cclxuLypcclxuYG9mKHZhbHVlKWBcclxuLS0tLVxyXG5BY2NlcHRzIGEgdmFsdWUgYW5kIHdyYXBzIGluIGEgc3RhdGUgY29udGFpbmVyXHJcbiovXHJcblx0UVVuaXQudGVzdChcIm9mXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0YXNzZXJ0LmV4cGVjdCgwKS8vLS1cclxuXHRcdGNvbnN0IHN0YXRlNSA9IHN0YXRlKCkub2YoNSlcclxuXHR9KS8vLS1cclxuXHJcbi8vTm90ZSB0aGF0IHRoZSBmb2xsb3dpbmcgY29kZSBkb2VzIG5vdCBwdXQgYDVgIGluIHRoZSBzdGF0ZS5cclxuLy9SYXRoZXIgaXQgY3JlYXRlcyBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYDVgIGFuZCBkb2VzIG5vdCBpbnRlcmFjdCB3aXRoIHRoZSBzdGF0ZS4gXHJcblxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5FeGVjdXRlcyBgZnVua2Agd2l0aCB0aGUgZW5jYXBzdWxhdGVkIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBhbmQgd3JhcHMgdGhlIHJlc3VsdCBpbiBhIG5ldyBgc3RhdGVgIG9iamVjdCwgXHJcbndpdGhvdXQgYWNjZXNzaW5nIHRoZSBzdGF0ZVxyXG5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9PbmUgb2YgdGhlIG1haW4gYmVuZWZpdHMgb2YgdGhlIGBzdGF0ZWAgdHlwZXMgaXMgdGhhdCBpdCBhbGxvd3MgeW91IHRvIG1peCBwdXJlIGZ1bmN0aW9ucyB3aXRoIHVucHVyZSBvbmVzLCBcclxuLy9JbiB0aGUgc2FtZSB3YXkgdGhhdCBwcm9taXNlcyBhbGxvdyB1cyB0byBtaXggYXN5Y2hyb25vdXMgZnVuY3Rpb25zIHdpdGggc3luY2hyb25vdXMgb25lcy5cclxuLy9NYXAgYWxsb3dzIHVzIHRvIGFwcGx5IGFueSBmdW5jdGlvbiBvbiBvdXIgdmFsdWUgYW5kIHRvIGNvbnN1bWUgdGhlIHJlc3VsdCBpbiBhbm90aGVyIGZ1bmN0aW9uLlxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKDUpXHJcblx0XHQubWFwKCh2YWwpID0+IHZhbCsxKVxyXG5cdFx0Lm1hcCgodmFsKSA9PiB7XHJcblx0XHRcdGFzc2VydC5lcXVhbCh2YWwsIDYpXHJcblx0XHRcdHJldHVybiB2YWwgKiAyXHJcblx0XHR9KVxyXG5cdFx0Lm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLCAxMikpXHJcblx0XHQucnVuKClcclxufSkvLy0tXHJcblxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAsIGV4Y2VwdCB0aGF0IGlmIGBmdW5rYCByZXR1cm5zIGEgbmV3IHN0YXRlIG9iamVjdCBpdCBtZXJnZXMgdGhlIHR3byBzdGF0ZXMgaW50byBvbmUuXHJcblRodXMgYGZsYXRNYXBgIHNpbXVsYXRlcyBtYW5pcHVsYXRpb24gb2YgbXV0YWJsZSBzdGF0ZS5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwicGhhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vRm9yIGV4YW1wbGUsIGhlcmUgaXMgYSBmdW5jdGlvbiB0aGF0IFxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKFwidmFsdWVcIilcclxuXHRcdC8vV3JpdGUgdGhlIHZhbHVlIGluIHRoZSBzdGF0ZVxyXG5cdFx0LnBoYXRNYXAoIHZhbHVlID0+IHN0YXRlKCBfID0+IFtcIm5ldyBcIit2YWx1ZSAsIFwiaW5pdGlhbCBcIit2YWx1ZV0pIClcclxuXHJcblx0XHQvL21hbmlwdWxhdGUgdGhlIHZhbHVlXHJcblx0XHQucGhhdE1hcCggdmFsID0+IHZhbC50b1VwcGVyQ2FzZSgpLnNwbGl0KFwiXCIpLmpvaW4oXCItXCIpIClcclxuXHRcdFxyXG5cdFx0Ly9XZSBjYW4gYWNjZXNzIHRoZSBzdGF0ZSBhdCBhbnkgdGltZS5cclxuXHRcdC5waGF0TWFwKCB2YWwgPT4gc3RhdGUoc3QgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwoIHZhbCwgXCJOLUUtVy0gLVYtQS1MLVUtRVwiKVxyXG5cdFx0XHRhc3NlcnQuZXF1YWwoIHN0LCBcImluaXRpYWwgdmFsdWVcIilcclxuXHRcdH0pKS5ydW4oKVxyXG59KS8vLS1cclxuXHJcbi8qXHJcblxyXG5gc2F2ZSgpIC8gbG9hZCgpYFxyXG4tLS0tXHJcblNob3J0aGFuZHMgZm9yIHRoZSBtb3N0IGNvbW1vbiBzdGF0ZSBvcGVyYXRpb25zOiBcclxuLSBgc2F2ZWAgY29waWVzIHRoZSBjdXJyZW50bHkgZW5jYXBzdWxhdGVkIHZhbHVlIGludG8gdGhlIHN0YXRlXHJcbi0gYGxvYWRgIGp1c3QgcmV0dXJucyB0aGUgY3VycmVudCBzdGF0ZVxyXG4qKipcclxuKi9cclxuXHJcblxyXG5RVW5pdC50ZXN0KFwic2F2ZS9sb2FkXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuXHR2YXIgbXlTdGF0ZSA9IHN0YXRlKDUpXHJcblx0LnBoYXRNYXAoICh2YWwpID0+IHZhbCsxICkgLy82XHJcblx0LnNhdmVLZXkoXCJzdDFcIilcclxuXHRcclxuXHQucGhhdE1hcCggKHZhbCkgPT4gdmFsKjIgKS8vMTJcclxuXHQuc2F2ZUtleShcInN0MlwiKVxyXG5cdFxyXG5cdC5sb2FkKClcclxuXHQubWFwKCAoc3RhdGUpID0+IHtcclxuXHRcdGFzc2VydC5lcXVhbChzdGF0ZS5zdDEsIDYpXHJcblx0XHRhc3NlcnQuZXF1YWwoc3RhdGUuc3QyLCAxMilcclxuXHR9KS5ydW4oKVxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcblxyXG5cclxuIiwiXHJcbi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogc3RyZWFtIFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHN0cmVhbWAgdHlwZSwgYWxzbyBrbm93biBhcyBhIGxhenkgbGlzdCBpcyBhIGNvbnRhaW5lciBmb3IgYSBsaXN0IG9mIHZhbHVlcyB3aGljaCBjb21lIGFzeW5jaHJvbm91c2x5LlxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwic3RyZWFtXCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYHN0cmVhbWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0dmFyIHN0cmVhbSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0cmVhbVwiKVxyXG5cdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UbyBjcmVhdGUgYSBgc3RyZWFtYCBwYXNzIGEgZnVuY3Rpb24gd2hpY2ggYWNjZXB0cyBhIGNhbGxiYWNrIGFuZCBjYWxscyB0aGF0IGNhbGxiYWNrIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZTpcclxuXHJcblx0Y29uc3QgY2xpY2tTdHJlYW0gPSBzdHJlYW0oIChwdXNoKSA9PiB7IGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcHVzaCl9KVxyXG5cdHdpbmRvdy5jbGlja1N0cmVhbSA9IGNsaWNrU3RyZWFtXHJcblxyXG4vLyBMaWtlIHByb21pc2VzLCBzdHJlYW1zIGFyZSBhbHNvIGNyZWF0ZWQgd2l0aCBhIGhlbHBlclxyXG5cclxuXHRjb25zdCBjb3VudFRvID0gKHJhbmdlKSA9PiBzdHJlYW0oIChwdXNoKSA9PiB7XHJcblx0XHRmb3IgKGxldCBpID0gMTsgaTw9IHJhbmdlOyBpKyspe1xyXG5cdFx0XHRwdXNoKGkpXHJcblx0XHR9XHJcblx0fSlcclxuLypcclxuYHJ1bigpYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIHRoZSBzdHJlYW0gYW5kIGZldGNoZXMgdGhlIGRhdGEuXHJcblxyXG4qKipcclxuXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuUmV0dXJucyBhIG5ldyBzdHJlYW0sIHdoaWNoIGFwcGxpZXMgYGZ1bmtgIHRvIHRoZSBkYXRhIHdoZW4geW91IHJ1biBpdC5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRjb25zdCBzdG9wID0gYXNzZXJ0LmFzeW5jKCkvLy0tXHJcblx0dmFyIHB1c2hUb1N0cmVhbSA9IHVuZGVmaW5lZFxyXG5cdGNvbnN0IG15U3RyZWFtID0gc3RyZWFtKHB1c2ggPT57IHB1c2hUb1N0cmVhbSA9IHB1c2h9KVxyXG5cdFx0Lm1hcCh2YWwgPT4gdmFsKjIpXHJcblx0XHQubWFwKHZhbCA9PiBhc3NlcnQuZXF1YWwodmFsLCAxMCkpXHJcblx0XHQucnVuKClcclxuXHRcclxuXHRwdXNoVG9TdHJlYW0oNSlcclxuXHRzdG9wKClcclxufSkvLy0tXHJcblxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuQSBtb3JlIHBvd2VyZnVsIHZlcnNpb24gb2YgYG1hcGAgd2hpY2ggY2FuIGFsbG93cyB5b3UgdG8gY2hhaW4gc2V2ZXJhbCBzdGVwcyBvZiB0aGUgYXN5Y2hyb25vdXMgY29tcHV0YXRpb25zIHRvZ2V0aGVyLlxyXG5Lbm93biBhcyBgdGhlbmAgZm9yIHRyYWRpdGlvbmFsIHN0cmVhbSBsaWJyYXJpZXMuXHJcblxyXG4qKipcclxuKi9cclxuXHJcbi8vUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Ly9jb25zdCBkb25lID0gYXNzZXJ0LmFzeW5jKCkvLy0tXHRcclxuLy99KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuIl19
