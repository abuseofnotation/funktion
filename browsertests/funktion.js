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
  if (typeof funk === "function") {
    return maybeT(funk(this._innerMonad));
  } else if (typeof funk === "string") {
    var _innerMonad;

    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

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

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2YuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2hlbHBlcnMuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2lkZW50aXR5LmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9saXN0LmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9tYXliZS5qcyIsImQ6L3ByL2Z1bmt0aW9uL2xpYnJhcnkvbWF5YmVULmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9wcm9taXNlLmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9zdGF0ZS5qcyIsImQ6L3ByL2Z1bmt0aW9uL2xpYnJhcnkvc3RyZWFtLmpzIiwiZDovcHIvZnVua3Rpb24vdGVzdHMvZl90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL2xpc3RfdGVzdHMuanMiLCJkOi9wci9mdW5rdGlvbi90ZXN0cy9tYXliZVRfdGVzdHMuanMiLCJkOi9wci9mdW5rdGlvbi90ZXN0cy9tYXliZV90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL3Byb21pc2VfdGVzdHMuanMiLCJkOi9wci9mdW5rdGlvbi90ZXN0cy9zdGF0ZV90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL3N0cmVhbV90ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQSxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBR2xDLElBQU0sRUFBRSxHQUFHLFNBQUwsRUFBRSxDQUFHLENBQUM7UUFBSSxDQUFDO0NBQUEsQ0FBQTs7QUFFaEIsSUFBSSxPQUFPLEdBQUc7Ozs7OztBQU1iLEdBQUUsRUFBRSxZQUFBLEdBQUc7U0FBSSxHQUFHLEtBQUss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S0FBSyxDQUFFLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTs7QUFFaEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUE7QUFDbkIsUUFBTSxDQUFDLEtBQUssQ0FBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7QUFDeEIsUUFBTSxDQUFDLEtBQUssQ0FBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFFLENBQUE7Q0FFNUIsQ0FBQyxDQUFBOzs7Ozs7QUFNRixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFTLE1BQU0sRUFBQzs7Ozs7QUFJakMsTUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFFLFVBQUEsR0FBRztXQUFJLEdBQUcsR0FBQyxDQUFDO0dBQUEsQ0FBRSxDQUFBOzs7O0FBSzdCLE1BQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7O0FBRTVCLFFBQU0sQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBOztBQUUzQixNQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBOztBQUU1QixRQUFNLENBQUMsS0FBSyxDQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTtDQUUzQixDQUFDLENBQUE7Ozs7Ozs7Ozs7O0FBV0YsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBUyxNQUFNLEVBQUM7Ozs7O0FBSXJDLE1BQUksTUFBTSxHQUFHLENBQUMsQ0FBRSxVQUFDLElBQUksRUFBRSxJQUFJO1dBQUssSUFBSSxHQUFHLElBQUk7R0FBQSxDQUFDLENBQUE7O0FBRTVDLE1BQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQzlCLE9BQU8sQ0FBQyxVQUFDLEdBQUc7V0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUUsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0dBQUEsQ0FBRSxDQUFBOztBQUVwRixRQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFBO0FBQ2pELFFBQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUE7QUFDakQsUUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMkJyRCxNQUFJLFFBQVEsR0FBRyxDQUFDLENBQUUsVUFBQSxHQUFHO1dBQUksR0FBRyxHQUFHLENBQUM7R0FBQSxDQUFFLENBQ2hDLE9BQU8sQ0FBRSxVQUFBLENBQUM7V0FBSSxDQUFDLENBQUUsVUFBQSxHQUFHO2FBQUksR0FBRyxHQUFHLEVBQUU7S0FBQSxDQUFFLENBQ2pDLE9BQU8sQ0FBRSxVQUFBLENBQUM7YUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7S0FBQSxDQUFFO0dBQUEsQ0FDNUIsQ0FBQTs7QUFFRixRQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQTtDQUU3QixDQUFDLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3BJSCxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBOzs7O0FBTWxCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBO0FBQ3JDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTs7Ozs7QUFLL0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFBOztBQUUzQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQTs7Ozs7Ozs7O0FBUzNCLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVMsTUFBTSxFQUFDOztBQUNqQyxLQUFJLE1BQU0sR0FBRyxJQUFJLENBQUUsRUFBQyxJQUFJLEVBQUMsTUFBTSxFQUFFLEdBQUcsRUFBQyxFQUFFLEVBQUUsVUFBVSxFQUFDLFFBQVEsRUFBQyxFQUFFLEVBQUMsSUFBSSxFQUFDLFNBQVMsRUFBRSxHQUFHLEVBQUMsRUFBRSxFQUFFLFVBQVUsRUFBQyxTQUFTLEVBQUMsQ0FBQyxDQUFBO0FBQzlHLEtBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQyxNQUFNO1NBQUssTUFBTSxDQUFDLElBQUk7RUFBQSxDQUFFLENBQUE7QUFDaEQsT0FBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQTtDQUU1QyxDQUFDLENBQUE7Ozs7Ozs7Ozs7QUFVRixLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFTLE1BQU0sRUFBQzs7O0FBRXJDLEtBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxDQUN0QixFQUFDLFVBQVUsRUFBQyxRQUFRLEVBQUUsTUFBTSxFQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsRUFBRSxFQUN6RCxFQUFDLFVBQVUsRUFBQyxTQUFTLEVBQUUsTUFBTSxFQUFDLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQ2xELENBQUMsQ0FBQTs7QUFFRixLQUFJLE1BQU0sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQUMsVUFBVTtTQUFLLFVBQVUsQ0FBQyxNQUFNO0VBQUEsQ0FBQyxDQUFBO0FBQ25FLE9BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUE7Q0FF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QUM1QyxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFDO0FBQzlCLE9BQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtHQUNQO0VBQ0QsQ0FBQztDQUFBLENBQUE7Ozs7Ozs7Ozs7Ozs7OztBQWVILEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVMsTUFBTSxFQUFDOztBQUNqQyxLQUFNLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUE7QUFDM0IsS0FBSSxZQUFZLEdBQUcsU0FBUyxDQUFBO0FBQzVCLEtBQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxVQUFBLElBQUksRUFBRztBQUFFLGNBQVksR0FBRyxJQUFJLENBQUE7RUFBQyxDQUFDLENBQ3BELEdBQUcsQ0FBQyxVQUFBLEdBQUc7U0FBSSxHQUFHLEdBQUMsQ0FBQztFQUFBLENBQUMsQ0FDakIsR0FBRyxDQUFDLFVBQUEsR0FBRztTQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztFQUFBLENBQUMsQ0FDakMsR0FBRyxFQUFFLENBQUE7O0FBRVAsYUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ2YsS0FBSSxFQUFFLENBQUE7Q0FDTixDQUFDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuXHJcbmNvbnN0IGlkID0gYSA9PiBhIC8vLS1cclxuXHJcblx0dmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy90aGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgaXQuXHJcbi8vdGhpcyBpcyB2ZXJ5IHVzZWZ1bCBpZiB5b3UgaGF2ZSBhIEFQSSB3aGljaCBleHBlY3RzIGEgZnVuY3Rpb24sIGJ1dCB5b3Ugd2FudCB0byBmZWVkIGl0IHdpdGggYSB2YWx1ZSAoc2VlIHRoZSBgZmxhdG1hcGAgZXhhbXBsZSkuIFxyXG5cclxuXHRcdC8vYS5vZihiKSAtPiBiIGFcclxuXHRcdG9mOiB2YWwgPT4gdmFsID09PSB1bmRlZmluZWQgPyBpZCA6IGYoICgpID0+IHZhbCApLFxyXG5cclxuLy9gbWFwYCBqdXN0IHdpcmVzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhbmQgdGhlIG5ldyBvbmUgdG9nZXRoZXI6XHJcblxyXG5cdFx0Ly8oYSAtPiBiKSA9PiAoYiAtPiBjKSA9PiBhIC0+IGNcclxuXHRcdG1hcDogZnVuY3Rpb24oZnVuayl7IFxyXG5cdFx0XHRpZihmdW5rID09PSB1bmRlZmluZWQpe3Rocm93IG5ldyBUeXBlRXJyb3J9XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gZnVuayggdGhpcyguLi5hcmdzKSApLCB0aGlzLl9sZW5ndGggKSBcclxuXHRcdH0sXHJcblxyXG4vL2BmbGF0YCBjcmVhdGVzIGEgZnVuY3Rpb24gdGhhdDogXHJcbi8vMS4gQ2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIHdpdGggdGhlIHN1cHBsaWVkIGFyZ3VtZW50c1xyXG4vLzIuIENhbGxzIHRoZSByZXN1bHRpbmcgZnVuY3Rpb24gKGFuZCBpdCBoYXMgdG8gYmUgb25lKSB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50c1xyXG5cclxuXHRcdC8vKGIgLT4gKGIgLT4gYykpID0+IGEgLT4gYlxyXG5cdFx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHRoaXMoLi4uYXJncykoLi4uYXJncyksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGAgXHJcblxyXG5cdFx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gdGhpcyguLi5hcmdzKVxyXG5cdFx0XHRcdGlmKHR5cGVvZiByZXN1bHQgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdFxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdCguLi5hcmdzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSkgXHJcblx0XHR9XHJcblxyXG5cdH0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcbi8vVGhpcyBpcyB0aGUgZnVuY3Rpb24gY29uc3RydWN0b3IuIEl0IHRha2VzIGEgZnVuY3Rpb24gYW5kIGFkZHMgYW4gYXVnbWVudGVkIGZ1bmN0aW9uIG9iamVjdCwgd2l0aG91dCBleHRlbmRpbmcgdGhlIHByb3RvdHlwZVxyXG5cclxuXHR2YXIgZiA9IChmdW5rID0gaWQsIGxlbmd0aCA9IGZ1bmsubGVuZ3RoLCBpbml0aWFsX2FyZ3VtZW50cyA9IFtdKSA9PiB7XHJcblxyXG5cdFx0Ly9XZSBleHBlY3QgYSBmdW5jdGlvbi4gSWYgd2UgYXJlIGdpdmVuIGFub3RoZXIgdmFsdWUsIGxpZnQgaXQgdG8gYSBmdW5jdGlvblxyXG5cdFx0aWYodHlwZW9mIGZ1bmsgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRyZXR1cm4gZigpLm9mKGZ1bmspXHJcblx0XHRcclxuXHRcdC8vSWYgdGhlIGZ1bmN0aW9uIHRha2VzIGp1c3Qgb25lIGFyZ3VtZW50LCBqdXN0IGV4dGVuZCBpdCB3aXRoIG1ldGhvZHMgYW5kIHJldHVybiBpdC5cclxuXHRcdH1lbHNlIGlmICggbGVuZ3RoIDwgMiApe1xyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kKGZ1bmssIG1ldGhvZHMpXHJcblxyXG5cdFx0Ly9FbHNlLCByZXR1cm4gYSBjdXJyeS1jYXBhYmxlIHZlcnNpb24gb2YgdGhlIGZ1bmN0aW9uIChhZ2FpbiwgZXh0ZW5kZWQgd2l0aCB0aGUgZnVuY3Rpb24gbWV0aG9kcylcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR2YXIgZXh0ZW5kZWRfZnVuayA9IGV4dGVuZCggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0XHR2YXIgYWxsX2FyZ3VtZW50cyAgPSAoaW5pdGlhbF9hcmd1bWVudHMpLmNvbmNhdChhcmdzKVx0XHJcblx0XHRcdFx0cmV0dXJuIGFsbF9hcmd1bWVudHMubGVuZ3RoPj1sZW5ndGg/ZnVuayguLi5hbGxfYXJndW1lbnRzKTpmKGZ1bmssIGxlbmd0aCwgYWxsX2FyZ3VtZW50cylcclxuXHRcdFx0fSwgbWV0aG9kcylcclxuXHRcdFx0XHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX2xlbmd0aCA9IGxlbmd0aCAtIGluaXRpYWxfYXJndW1lbnRzLmxlbmd0aFxyXG5cdFx0XHRleHRlbmRlZF9mdW5rLl9vcmlnaW5hbCA9IGZ1bmtcclxuXHJcblx0XHRcdHJldHVybiBleHRlbmRlZF9mdW5rXHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9IZXJlIGlzIHRoZSBmdW5jdGlvbiB3aXRoIHdoaWNoIHRoZSBmdW5jdGlvbiBvYmplY3QgaXMgZXh0ZW5kZWRcclxuXHJcblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0XHRyZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKGZ1bmN0aW9uKG9iaiwgbWV0aG9kX25hbWUpe29ialttZXRob2RfbmFtZV0gPSBtZXRob2RzW21ldGhvZF9uYW1lXTsgcmV0dXJuIG9ian0sIG9iailcclxuXHR9XHJcblxyXG5cdFxyXG5cdGYub2YgPSB2YWwgPT4gZiggKCkgPT4gdmFsICksXHJcblxyXG4vL1RoZSBsaWJyYXJ5IGFsc28gZmVhdHVyZXMgYSBzdGFuZGFyZCBjb21wb3NlIGZ1bmN0aW9uIHdoaWNoIGFsbG93cyB5b3UgdG8gbWFwIG5vcm1hbCBmdW5jdGlvbnMgd2l0aCBvbmUgYW5vdGhlclxyXG5cclxuXHRmLmNvbXBvc2UgPSBmdW5jdGlvbigpe1xyXG5cclxuXHRcdC8vQ29udmVydCBmdW5jdGlvbnMgdG8gYW4gYXJyYXkgYW5kIGZsaXAgdGhlbSAoZm9yIHJpZ2h0LXRvLWxlZnQgZXhlY3V0aW9uKVxyXG5cdFx0dmFyIGZ1bmN0aW9ucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykucmV2ZXJzZSgpXHJcblx0XHQvL0NoZWNrIGlmIGlucHV0IGlzIE9LOlxyXG5cdFx0ZnVuY3Rpb25zLmZvckVhY2goZnVuY3Rpb24oZnVuayl7aWYodHlwZW9mIGZ1bmsgIT09IFwiZnVuY3Rpb25cIil7dGhyb3cgbmV3IFR5cGVFcnJvcihmdW5rK1wiIGlzIG5vdCBhIGZ1bmN0aW9uXCIgKX19KVxyXG5cdFx0Ly9SZXR1cm4gdGhlIGZ1bmN0aW9uIHdoaWNoIGNvbXBvc2VzIHRoZW1cclxuXHRcdHJldHVybiBmdW5jdGlvbigpe1xyXG5cdFx0XHQvL1Rha2UgdGhlIGluaXRpYWwgaW5wdXRcclxuXHRcdFx0dmFyIGlucHV0ID0gYXJndW1lbnRzXHJcblx0XHRcdHZhciBjb250ZXh0XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbnMucmVkdWNlKGZ1bmN0aW9uKHJldHVybl9yZXN1bHQsIGZ1bmssIGkpeyBcclxuXHRcdFx0XHQvL0lmIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZXJhdGlvbiwgYXBwbHkgdGhlIGFyZ3VtZW50cyB0aGF0IHRoZSB1c2VyIHByb3ZpZGVkXHJcblx0XHRcdFx0Ly9lbHNlIHVzZSB0aGUgcmV0dXJuIHJlc3VsdCBmcm9tIHRoZSBwcmV2aW91cyBmdW5jdGlvblxyXG5cdFx0XHRcdHJldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rKHJldHVybl9yZXN1bHQpKVxyXG5cdFx0XHRcdC8vcmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsuYXBwbHkoY29udGV4dCwgW3JldHVybl9yZXN1bHRdKSlcclxuXHRcdFx0fSwgdW5kZWZpbmVkKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cdG1vZHVsZS5leHBvcnRzID0gZi8vLS1cclxuIiwiZXhwb3J0cy5waGF0TWFwID0gZnVuY3Rpb24gcGhhdE1hcChmdW5rKXtcclxuICAgICAgICBpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKGZ1bmspLnRyeUZsYXQoKVxyXG59XHJcblxyXG5leHBvcnRzLmZsYXRNYXAgPSBmdW5jdGlvbiBmbGF0TWFwKGZ1bmspIHtcclxuICAgICAgICBpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKGZ1bmspLmZsYXQoKVxyXG59XHJcbmV4cG9ydHMucHJpbnQgPSBmdW5jdGlvbiBwcmludCAoKXtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnRvU3RyaW5nKCkpXHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxufVxyXG5cclxuIiwidmFyIGlkZW50aXR5ID0gZnVuY3Rpb24odmFsKXtcclxuICAgIHZhciBpZCA9IE9iamVjdC5jcmVhdGUobWV0aG9kcylcclxuICAgIGlkLl92YWx1ZSA9IHZhbFxyXG4gICAgcmV0dXJuIE9iamVjdC5mcmVlemUoaWQpXHJcbn1cclxuXHJcblxyXG52YXIgbWV0aG9kcyA9IHtcclxuXHJcbiAgICBmdW5rdGlvblR5cGU6IFwiaWRlbnRpdHlcIixcclxuXHJcbiAgICBjb25zdHJ1Y3RvciA6IGlkZW50aXR5LFxyXG4gICAgXHJcbiAgICBvZiA6IGZ1bmN0aW9uIG9mICh2YWwpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKHZhbClcclxuICAgIH0sXHJcblxyXG4gICAgbWFwIDogZnVuY3Rpb24gbWFwIChmdW5rKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3RvcihmdW5rKHRoaXMuX3ZhbHVlKSlcclxuICAgIH0sXHJcblxyXG4gICAgZmxhdCA6IGZ1bmN0aW9uIGZsYXQgKCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IodGhpcy5fdmFsdWUuX3ZhbHVlKVxyXG4gICAgfSxcclxuXHJcbiAgICB0cnlGbGF0IDogZnVuY3Rpb24gdHJ5RmxhdCAoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3RvcigodGhpcy5fdmFsdWUuZnVua3Rpb25UeXBlID09PSBcImlkZW50aXR5XCIpID8gdGhpcy5fdmFsdWUuX3ZhbHVlIDogdGhpcy5fdmFsdWUgKVxyXG4gICAgfSxcclxuXHJcbiAgICBwaGF0TWFwIDogZnVuY3Rpb24gcGhhdE1hcChmdW5rKXtcclxuICAgICAgICAgICAgaWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpXHJcbiAgICB9LFxyXG5cclxuICAgIGZsYXRNYXAgOiBmdW5jdGlvbiBmbGF0TWFwKGZ1bmspIHtcclxuICAgICAgICAgICAgaWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcbiAgICB9LFxyXG4gICAgcHJpbnQgOiBmdW5jdGlvbiBwcmludCAoKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy50b1N0cmluZygpKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG59XHJcblxyXG5pZGVudGl0eS5wcm90b3R5cGUgPSBtZXRob2RzLy8tLVxyXG5tb2R1bGUuZXhwb3J0cyA9IGlkZW50aXR5Ly8tLVxyXG4iLCJcclxuXHJcbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuXHJcbnZhciBtZXRob2RzID0gey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCBwdXRzIGl0IGluIGEgbGlzdC5cclxuXHJcblx0XHQvL2Eub2YoYikgLT4gYiBhXHJcblx0XHRvZjogdmFsID0+IGxpc3QodmFsKSxcclxuXHJcbi8vYG1hcGAgYXBwbGllcyBhIGZ1bmN0aW9uIHRvIGVhY2ggZWxlbWVudCBvZiB0aGUgbGlzdCwgYXMgdGhlIG9uZSBmcm9tIHRoZSBBcnJheSBwcm90b3R5cGVcclxuXHRcdFxyXG4vL2BmbGF0YCB0YWtlcyBhIGxpc3Qgb2YgbGlzdHMgYW5kIGZsYXR0ZW5zIHRoZW0gd2l0aCBvbmUgbGV2ZWwgXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkuam9pbigpID0gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBsaXN0KCB0aGlzLnJlZHVjZSgobGlzdCwgZWxlbWVudCkgPT4gWy4uLmxpc3QsIC4uLmVsZW1lbnRdLCBbXSkgKVxyXG5cdFx0fSxcclxuXHRcdFxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgXHJcbi8vYW5kIHdpdGggaXQsIHlvdXIgZnVuayBjYW4gcmV0dXJuIGJvdGggYSBsaXN0IG9mIG9iamVjdHMgYW5kIGEgc2luZ2xlIG9iamVjdFxyXG5cclxuXHRcdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoIHRoaXMucmVkdWNlKChsaXN0LCBlbGVtZW50KSA9PiBcclxuXHRcdFx0XHRlbGVtZW50ICE9PSB1bmRlZmluZWQgJiYgZWxlbWVudC5jb25zdHJ1Y3RvciA9PT0gQXJyYXk/IFsuLi5saXN0LCAuLi5lbGVtZW50XSA6IFsuLi5saXN0LCBlbGVtZW50XSAsIFtdKVxyXG5cdFx0XHQpXHJcblx0XHR9LFxyXG5cdFx0ZnVua3Rpb25UeXBlOlwibGlzdFwiLy8tLVxyXG5cclxuXHR9Ly8tLVxyXG5cclxuLy9BZGQgYWxpYXNlcyB0byBtYXAgLiBmbGF0IGFzIGZsYXRNYXAgYW5kIG1hcCAuIHRyeUZsYXQgYXMgcGhhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMuZmxhdE1hcCA9IGhlbHBlcnMuZmxhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMucGhhdE1hcCA9IGhlbHBlcnMucGhhdE1hcFxyXG5cclxuLy9BZGQgYSBwcmludCBmdW5jdGlvbiwgdXNlZCBmb3IgZGVidWdnaW5nLlxyXG4gICAgICAgIG1ldGhvZHMucHJpbnQgPSBoZWxwZXJzLnByaW50XHJcblxyXG5cclxuLy9BZGQgc3VwcG9ydCBmb3IgYXJyYXkgZXh0cmFzLCBzbyB0aGF0IHRoZXkgcmV0dXJuIGEgbGlzdCBpbnN0ZWFkIG9mIG5vcm1hbCBBcnJheVxyXG5cclxudmFyIGFycmF5TWV0aG9kcyA9IHt9XHJcblxyXG4vL1NvbWUgZnVuY3Rpb25zIGFyZSBkaXJlY3RseSBsaWZ0ZWQgZnJvbSB0aGUgQXJyYXkgcHJvdG90eXBlXHJcblxyXG52YXIgaW1tdXRhYmxlRnVuY3Rpb25zID0gWydtYXAnLCAnY29uY2F0J11cclxuXHJcbmltbXV0YWJsZUZ1bmN0aW9ucy5mb3JFYWNoKChmdW5rKSA9PiB7IFxyXG5cdGFycmF5TWV0aG9kc1tmdW5rXSA9IGZ1bmN0aW9uKC4uLmFyZ3Mpe1xyXG5cdFx0XHRyZXR1cm4gbGlzdChBcnJheS5wcm90b3R5cGVbZnVua10uYXBwbHkodGhpcywgYXJncykpXHJcblx0fVxyXG59KVxyXG5cclxuLy9UaGUgdHlwZSBhbHNvIHdyYXBzIHNvbWUgQXJyYXkgZnVuY3Rpb25zIGluIGEgd2F5IHRoYXQgbWFrZXMgdGhlbSBpbW11dGFibGVcclxuXHJcbnZhciBtdXRhYmxlRnVuY3Rpb25zID0gWydzcGxpY2UnLCAncmV2ZXJzZScsICdzb3J0J11cclxuXHJcbm11dGFibGVGdW5jdGlvbnMuZm9yRWFjaCgoZnVuaykgPT4geyBcclxuXHRhcnJheU1ldGhvZHNbZnVua10gPSBmdW5jdGlvbiguLi5hcmdzKXtcclxuXHRcdFx0dmFyIG5ld0FycmF5ID0gdGhpcy5zbGljZSgwKVxyXG5cdFx0XHRBcnJheS5wcm90b3R5cGVbZnVua10uYXBwbHkobmV3QXJyYXksIGFyZ3MpXHJcblx0XHRcdHJldHVybiBuZXdBcnJheVxyXG5cdH1cclxufSlcclxuXHJcbmV4dGVuZChtZXRob2RzLCBhcnJheU1ldGhvZHMpXHJcblxyXG5tZXRob2RzLmV4dHJhcyA9IFtdXHJcblxyXG4vL1RoaXMgaXMgdGhlIGxpc3QgY29uc3RydWN0b3IuIEl0IHRha2VzIG5vcm1hbCBhcnJheSBhbmQgYXVnbWVudHMgaXQgd2l0aCB0aGUgYWJvdmUgbWV0aG9kc1xyXG5cdFxyXG5cdHZhciBsaXN0ID0gKC4uLmFyZ3MpID0+IHtcclxuXHRcdGlmKGFyZ3MubGVuZ3RoID09PSAxICYmIGFyZ3NbMF0gIT09IHVuZGVmaW5lZCAmJiBhcmdzWzBdLmZ1bmt0aW9uVHlwZSA9PT0gXCJsaXN0XCIpe1xyXG5cdFx0XHRyZXR1cm4gYXJnc1swXVxyXG5cdFx0Ly9BY2NlcHQgYW4gYXJyYXlcclxuXHRcdH1lbHNlIGlmKGFyZ3MubGVuZ3RoID09PSAxICYmIGFyZ3NbMF0gIT09IHVuZGVmaW5lZCAmJiBhcmdzWzBdLmNvbnN0cnVjdG9yID09PSBBcnJheSApe1xyXG5cdFx0XHRyZXR1cm4gIE9iamVjdC5mcmVlemUoZXh0ZW5kKGFyZ3NbMF0sIG1ldGhvZHMpKVxyXG5cdFx0Ly9BY2NlcHQgc2V2ZXJhbCBhcmd1bWVudHNcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShleHRlbmQoYXJncywgbWV0aG9kcykpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9IZXJlIGlzIHRoZSBmdW5jdGlvbiB3aXRoIHdoaWNoIHRoZSBsaXN0IG9iamVjdCBpcyBleHRlbmRlZFxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3QvLy0tXHJcbiIsIiAgICAgICAgdmFyIGlkID0gcmVxdWlyZShcIi4vaWRlbnRpdHlcIikvLy0tXHJcbiAgICAgICAgdmFyIG1ldGhvZHMgPSBPYmplY3QuY3JlYXRlKGlkLnByb3RvdHlwZSkvLy0tXHJcblxyXG5cdHZhciBtYXliZSA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcbiAgICAgICAgICAgICAgICBvYmouX3ZhbHVlID0gdmFsdWVcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKG9iailcclxuXHR9XHJcblxyXG4vL2BtYXBgIHRha2VzIHRoZSBmdW5jdGlvbiBhbmQgYXBwbGllcyBpdCB0byB0aGUgdmFsdWUgaW4gdGhlIG1heWJlLCBpZiB0aGVyZSBpcyBvbmUuXHJcbiAgICAgICAgbWV0aG9kcy5wcm90b3R5cGUgPSBtZXRob2RzLy8tLVxyXG4gICAgICAgIG1ldGhvZHMuY29uc3RydWN0b3IgPSBtYXliZS8vLS1cclxuXHJcblx0bWV0aG9kcy5mdW5rdGlvblR5cGUgPSBcIm1heWJlXCIvLy0tXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWV0aG9kcy5tYXAgPSBmdW5jdGlvbiBtYXAgKGZ1bmspe1xyXG5cdFx0aWYodGhpcy5fdmFsdWUgIT09IHVuZGVmaW5lZCl7XHJcblx0XHRcdHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKGZ1bmsodGhpcy5fdmFsdWUpKVxyXG5cdFx0fWVsc2V7XHRcclxuXHRcdFx0cmV0dXJuIHRoaXMgXHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdG1ldGhvZHMuZmxhdCA9IGZ1bmN0aW9uIGZsYXQgKCl7XHJcblx0XHRpZih0aGlzLl92YWx1ZSAhPT0gdW5kZWZpbmVkKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHRtZXRob2RzLnRyeUZsYXQgPSBmdW5jdGlvbiB0cnlGbGF0ICgpe1xyXG5cdFx0aWYodGhpcy5fdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl92YWx1ZS5mdW5rdGlvblR5cGUgPT09IFwibWF5YmVcIil7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cclxuLy9GaW5hbGx5LCBtYXliZSBkZWZpbmVzIG9uZSBoZWxwZXIgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIHRoZSBwcm9wZXJ0eSBvZiBhbiBvYmplY3QsIHdyYXBwZWQgaW4gYSBtYXliZTpcclxuXHJcbiAgICAgICAgbWV0aG9kcy5nZXRQcm9wID0gZnVuY3Rpb24gZ2V0UHJvcCAocHJvcCl7XHJcblx0XHRyZXR1cm4gdGhpcy5waGF0TWFwKCAodmFsKSA9PiB0aGlzLm9mKHZhbFtwcm9wXSkgKVxyXG5cdH1cclxuXHJcblxyXG5cdFxyXG5cclxuICAgIG1heWJlLnByb3RvdHlwZSA9IG1ldGhvZHMvLy0tXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1heWJlLy8tLVxyXG4iLCIgICAgICAgIHZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuICAgICAgICB2YXIgbWF5YmUgPSByZXF1aXJlKFwiLi9tYXliZVwiKS8vLS1cclxuICAgICAgICB2YXIgbWV0aG9kcyA9IE9iamVjdC5jcmVhdGUobWF5YmUucHJvdG90eXBlKVxyXG5cclxuXHJcblx0dmFyIG1heWJlVCA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcbiAgICAgICAgICAgICAgICBvYmouX2lubmVyTW9uYWQgPSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUob2JqKVxyXG5cdH1cclxuICAgICAgICBcclxuXHRtZXRob2RzLmZ1bmt0aW9uVHlwZSA9IFwibWF5YmVUXCIvLy0tXHJcbiAgICAgICAgbWV0aG9kcy5jb25zdHJ1Y3RvciA9IG1heWJlVFxyXG5cclxuXHQvL20gbWF5YmUgYSAtPiAoIGEgLT4gbWF5YmUgYiApIC0+IG0gbWF5YmUgYlxyXG5cdG1ldGhvZHMubWFwID0gZnVuY3Rpb24gbWFwIChmdW5rKXtcclxuICAgICAgICAgICAgcmV0dXJuIG1heWJlVCggdGhpcy5faW5uZXJNb25hZC5tYXAoKHZhbCkgPT4gXHJcbiAgICAgICAgICAgICAgIHZhbCA9PT0gdW5kZWZpbmVkID8gdmFsIDogZnVuayh2YWwpXHJcbiAgICAgICAgICAgICkgKVxyXG5cdH1cclxuXHJcbi8vYGZsYXRgIHRha2VzIGEgbWF5YmUgdGhhdCBjb250YWlucyBhbm90aGVyIG1heWJlIGFuZCBmbGF0dGVucyBpdC5cclxuLy9JbiB0aGlzIGNhc2UgdGhpcyBtZWFucyBqdXN0IHJldHVybmluZyB0aGUgaW5uZXIgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRtZXRob2RzLmZsYXQgPSBmdW5jdGlvbiBmbGF0ICgpe1xyXG4gICAgICAgICAgICByZXR1cm4gbWF5YmVUKHRoaXMuX2lubmVyTW9uYWQubWFwKCAoaW5uZXJNYXliZVQpID0+XHJcbiAgICAgICAgICAgICAgIGlubmVyTWF5YmVUID09PSB1bmRlZmluZWQgPyB0aGlzLl9pbm5lck1vbmFkLm9mKHVuZGVmaW5lZCkgOiBpbm5lck1heWJlVC5faW5uZXJNb25hZCBcclxuICAgICAgICAgICAgKS5mbGF0KCkpXHJcblx0fVxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0bWV0aG9kcy50cnlGbGF0PWZ1bmN0aW9uIHRyeUZsYXQgKCl7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXliZVQodGhpcy5faW5uZXJNb25hZC5tYXAoIChpbm5lck1heWJlVCkgPT57XHJcblx0XHRpZihpbm5lck1heWJlVCA9PT0gdW5kZWZpbmVkKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2lubmVyTW9uYWQub2YodW5kZWZpbmVkKVxyXG5cdFx0fWVsc2UgaWYoaW5uZXJNYXliZVQuZnVua3Rpb25UeXBlID09PSBcIm1heWJlVFwiKXtcclxuXHRcdFx0cmV0dXJuIGlubmVyTWF5YmVULl9pbm5lck1vbmFkXHJcblx0XHR9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lubmVyTWF5YmVUXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLnRyeUZsYXQoKSlcclxuXHR9XHJcblxyXG4gICAgICAgIG1ldGhvZHMubGlmdCA9IGZ1bmN0aW9uKGZ1bmssIC4uLmFyZ3Mpe1xyXG4gICAgICAgICAgICBpZih0eXBlb2YgZnVuayA9PT0gJ2Z1bmN0aW9uJyl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF5YmVUKGZ1bmsodGhpcy5faW5uZXJNb25hZCkpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmICh0eXBlb2YgZnVuayA9PT0gJ3N0cmluZycpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1heWJlVCh0aGlzLl9pbm5lck1vbmFkW2Z1bmtdKC4uLmFyZ3MpKVxyXG4gICAgICAgICAgICB9ICAgICAgICBcclxuICAgICAgICB9XHRcclxuXHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBtYXliZVQvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy9UaGUgYG9mYCBtZXRob2QgdGFrZXMgYSB2YWx1ZSBhbmQgd3JhcHMgaXQgaW4gYSBwcm9taXNlLCBieSBpbW1lZGlhdGVseSBjYWxsaW5nIHRoZSByZXNvbHZlciBmdW5jdGlvbiB3aXRoIGl0LlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24odmFsKXtcclxuXHRcdHJldHVybiBwcm9taXNlKCAocmVzb2x2ZSkgPT4gcmVzb2x2ZSh2YWwpIClcclxuXHR9LFxyXG5cclxuLy9UaGUgYG1hcGAgbWV0aG9kIGNyZWF0ZXMgYSBuZXcgcHJvbWlzZSwgc3VjaCB0aGF0IHdoZW4gdGhlIG9sZCBwcm9taXNlIGlzIHJlc29sdmVkLCBpdCB0YWtlcyBpdHMgcmVzdWx0LCBcclxuLy9hcHBsaWVzIGBmdW5rYCB0byBpdCBhbmQgdGhlbiByZXNvbHZlcyBpdHNlbGYgd2l0aCB0aGUgdmFsdWUuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiB0aGlzLl9yZXNvbHZlciggKHZhbCkgPT4gcmVzb2x2ZSggZnVuayh2YWwpICkgKSApXHJcblxyXG5cdH0sXHJcblxyXG4vL0luIHRoaXMgY2FzZSB0aGUgaW1wbGVtZW50YXRpb24gb2YgYGZsYXRgIGlzIHF1aXRlIHNpbXBsZS5cclxuXHJcbi8vRWZmZWN0aXZlbHkgYWxsIHdlIGhhdmUgdG8gZG8gaXMgcmV0dXJuIHRoZSBzYW1lIHZhbHVlIHdpdGggd2hpY2ggdGhlIGlubmVyIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aC5cclxuLy9UbyBkbyB0aGlzLCB3ZSB1bndyYXAgb3VyIHByb21pc2Ugb25jZSB0byBnZXQgdGhlIGlubmVyIHByb21pc2UgdmFsdWUsIGFuZCB0aGVuIHVud3JhcCB0aGUgaW5uZXJcclxuLy9wcm9taXNlIGl0c2VsZiB0byBnZXQgaXRzIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiBcclxuXHRcdFx0dGhpcy5fcmVzb2x2ZXIoXHQoaW5uZXJfcHJvbWlzZSkgPT4gXHJcblx0XHRcdFx0aW5uZXJfcHJvbWlzZS5fcmVzb2x2ZXIoKHZhbCkgPT4gcmVzb2x2ZSh2YWwpKVxyXG5cdFx0XHQpIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgdHJ5RmxhdGAgZnVuY3Rpb24gaXMgYWxtb3N0IHRoZSBzYW1lOlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiBcclxuXHRcdFx0dGhpcy5fcmVzb2x2ZXIoXHQoaW5uZXJfcHJvbWlzZSkgPT4geyBcclxuXHRcdFx0XHRpZihpbm5lcl9wcm9taXNlLmNvbnN0cnVjdG9yID09PSBwcm9taXNlKXtcclxuXHRcdFx0XHRcdGlubmVyX3Byb21pc2UuX3Jlc29sdmVyKCh2YWwpID0+IHJlc29sdmUodmFsKSlcclxuXHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdHJlc29sdmUoaW5uZXJfcHJvbWlzZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgcnVuYCBmdW5jdGlvbiBqdXN0IGZlZWRzIHRoZSByZXNvbHZlciB3aXRoIGEgcGxhY2Vob2xkZXIgIGZ1bmN0aW9uIHNvIG91ciBjb21wdXRhdGlvbiBjYW5cclxuLy9zdGFydCBleGVjdXRpbmcuXHJcblxyXG5cdHJ1bjpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuX3Jlc29sdmVyKGZ1bmN0aW9uKGEpe3JldHVybiBhfSlcclxuXHR9XHJcblx0XHJcbiAgICB9Ly8tLVxyXG5cclxuLy9BZGQgYWxpYXNlcyB0byBtYXAgLiBmbGF0IGFzIGZsYXRNYXAgYW5kIG1hcCAuIHRyeUZsYXQgYXMgcGhhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMuZmxhdE1hcCA9IGhlbHBlcnMuZmxhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMucGhhdE1hcCA9IGhlbHBlcnMucGhhdE1hcFxyXG5cclxuLy9BZGQgYSBwcmludCBmdW5jdGlvbiwgdXNlZCBmb3IgZGVidWdnaW5nLlxyXG4gICAgICAgIG1ldGhvZHMucHJpbnQgPSBoZWxwZXJzLnByaW50XHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHRjb25zdCBwcm9taXNlID0gZnVuY3Rpb24ocmVzb2x2ZSl7XHJcblx0XHRpZih0eXBlb2YgcmVzb2x2ZSAhPT0gXCJmdW5jdGlvblwiKXsgcmV0dXJuIG1ldGhvZHMub2YocmVzb2x2ZSkgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG5cclxuXHRcdG9iai5fcmVzb2x2ZXIgPSByZXNvbHZlXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBwcm9taXNlXHJcblx0XHRvYmoucHJvdG90eXBlID0gbWV0aG9kc1xyXG5cdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRyZXR1cm4gb2JqXHJcblx0fVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwcm9taXNlLy8tLVxyXG4iLCJcclxuICAgICAgICBjb25zdCBmID0gcmVxdWlyZShcIi4vZlwiKS8vLS1cclxuICAgICAgICB2YXIgaWQgPSByZXF1aXJlKFwiLi9pZGVudGl0eVwiKS8vLS1cclxuICAgICAgICB2YXIgbWV0aG9kcyA9IE9iamVjdC5jcmVhdGUoaWQucHJvdG90eXBlKS8vLS1cclxuXHJcblx0Y29uc3Qgc3RhdGUgPSBtZXRob2RzLmNvbnN0cnVjdG9yID0gZnVuY3Rpb24ocnVuKXtcclxuXHRcdGlmKHR5cGVvZiBydW4gIT09IFwiZnVuY3Rpb25cIil7IHJldHVybiBtZXRob2RzLm9mKHJ1bikgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG5cdFx0b2JqLl9ydW5TdGF0ZSA9IGYocnVuLDEpXHJcblx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShvYmopXHJcblx0fVxyXG5cclxuLy9gb2ZgIGp1c3QgdXNlcyB0aGUgY29uc3RydWN0b3IgYW5kIGRvZXMgbm90IHRvdWNoIHRoZSBzdGF0ZS5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG1ldGhvZHMub2YgPSBmdW5jdGlvbiBvZiAoaW5wdXQpe1xyXG5cdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoKHByZXZTdGF0ZSkgPT4gW2lucHV0LCBwcmV2U3RhdGVdKVxyXG5cdH1cclxuXHJcbi8vYG1hcGAgaXMgZG9uZSBieSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gdGhlIHZhbHVlIGFuZCBrZWVwaW5nIHRoZSBzdGF0ZSB1bmNoYW5nZWQuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWV0aG9kcy5tYXAgPSBmdW5jdGlvbiBtYXAgKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoIHRoaXMuX3J1blN0YXRlLm1hcCgoW2lucHV0LCBwcmV2U3RhdGVdKSA9PiBbZnVuayhpbnB1dCksIHByZXZTdGF0ZV0pKVxyXG5cdH1cclxuXHRcclxuLy9gZmxhdGAgZG9lcyB0aGUgZm9sbG93aW5nOlxyXG4vLzEuIFJ1bnMgdGhlIGNvZGUgdGhhdCB3ZSBsb2FkZWQgaW4gdGhlIG1vbmFkIHNvLCBmYXIgKHVzaW5nIHRoZSBgcnVuYCBmdW5jdGlvbikuXHJcbi8vMi4gU2F2ZXMgdGhlIG5ldyBzdGF0ZSBvYmplY3QgYW5kIHRoZSB2YWx1ZSB3aGljaCBpcyBrZXB0IGJ5IHRoZSBmdW5jdGlvbnMgc28gZmFyLlxyXG4vLzMuIEFmdGVyIGRvaW5nIHRoYXQsIGl0IGFycmFuZ2VzIHRob3NlIHR3byBjb21wb25lbnRzICh0aGUgb2JqZWN0IGFuZCB0aGUgdmFsdWUpIGludG8gYSB5ZXQgYW5vdGhlclxyXG4vL3N0YXRlIG9iamVjdCwgd2hpY2ggcnVucyB0aGUgbXV0YXRvciBmdW5jdGlvbiBvZiB0aGUgZmlyc3Qgb2JqZWN0LCB3aXRoIHRoZSBzdGF0ZSB0aGF0IHdlIGhhdmUgc28sIGZhclxyXG5cclxuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRtZXRob2RzLmZsYXQgPSBmdW5jdGlvbiBmbGF0ICgpe1xyXG5cdFx0Ly9FeHRyYWN0IHN0YXRlIG11dGF0b3IgYW5kIHZhbHVlIFxyXG5cdFx0Y29uc3QgW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdID0gdGhpcy5ydW4oKVxyXG5cdFx0Ly9Db21wb3NlIHRoZSBtdXRhdG9yIGFuZCB0aGUgdmFsdWVcclxuXHRcdHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKCgpID0+IHN0YXRlT2JqLl9ydW5TdGF0ZShjdXJyZW50U3RhdGUpIClcclxuXHR9XHJcblx0bWV0aG9kcy50cnlGbGF0ID0gZnVuY3Rpb24gdHJ5RmxhdCAoKXtcclxuXHJcblx0XHQvL0V4dHJhY3QgY3VycmVudCBzdGF0ZSBcclxuXHRcdGNvbnN0IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSA9IHRoaXMucnVuKClcclxuXHRcdFxyXG5cdFx0Ly9DaGVjayBpZiBpdCBpcyByZWFsbHkgYSBzdGF0ZVxyXG5cdFx0aWYoc3RhdGVPYmouY29uc3RydWN0b3IgPT09IHN0YXRlKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKCgpID0+IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL1dlIGhhdmUgdGhlIGBydW5gIGZ1bmN0aW9uIHdoaWNoIGNvbXB1dGVzIHRoZSBzdGF0ZTpcclxuXHJcblx0bWV0aG9kcy5ydW4gPSBmdW5jdGlvbiBydW4gKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcnVuU3RhdGUoKVxyXG5cdH1cclxuLy9BbmQgdGhlIGBzYXZlYCBhbmQgYGxvYWRgIGZ1bmN0aW9ucyBhcmUgZXhhY3RseSB3aGF0IG9uZSB3b3VsZCBleHBlY3RcclxuXHJcblx0bWV0aG9kcy5sb2FkID0gZnVuY3Rpb24gbG9hZCAoKXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gdGhpcy5jb25zdHJ1Y3RvciggKHN0YXRlKSA9PiBbc3RhdGUsIHN0YXRlXSApIClcclxuXHR9XHJcblx0bWV0aG9kcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSAoKXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gdGhpcy5jb25zdHJ1Y3RvciggKHN0YXRlKSA9PiBbdmFsdWUsIHZhbHVlXSApIClcclxuXHR9XHJcblx0bWV0aG9kcy5sb2FkS2V5ID0gZnVuY3Rpb24gbG9hZEtleSAoa2V5KXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gdGhpcy5jb25zdHJ1Y3RvciggKHN0YXRlKSA9PiBbc3RhdGVba2V5XSwgc3RhdGVdICkgKVxyXG5cdH1cclxuXHRtZXRob2RzLnNhdmVLZXkgPSBmdW5jdGlvbiBzYXZlS2V5IChrZXkpe1xyXG5cdFx0Y29uc3Qgd3JpdGUgPSAob2JqLCBrZXksIHZhbCkgPT4ge1xyXG5cdFx0XHRvYmogPSB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiID8gIG9iaiA6IHt9XHJcblx0XHRcdG9ialtrZXldID0gdmFsXHJcblx0XHRcdHJldHVybiBvYmpcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gdGhpcy5jb25zdHJ1Y3RvciggKHN0YXRlKSA9PiBbdmFsdWUsIHdyaXRlKHN0YXRlLCBrZXksIHZhbHVlKV0gKSApXHJcblx0fVxyXG5cdFxyXG4gICAgICAgIHN0YXRlLnByb3RvdHlwZSA9IG1ldGhvZHMvLy0tXHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzdGF0ZS8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL1RoZSBgb2ZgIG1ldGhvZCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIHN0cmVhbSwgYnkgaW1tZWRpYXRlbHkgY2FsbGluZyB0aGUgcHVzaGVyIGZ1bmN0aW9uIHdpdGggaXQuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbih2YWwpe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IHB1c2godmFsKSApXHJcblx0fSxcclxuXHJcbi8vVGhlIGBtYXBgIG1ldGhvZCBjcmVhdGVzIGEgbmV3IHN0cmVhbSwgc3VjaCB0aGF0IGV2ZXJ5IHRpbWUgdGhlIG9sZCBzdHJlYW0gcmVjZWl2ZXMgYSB2YWx1ZSwgaXRcclxuLy9hcHBsaWVzIGBmdW5rYCB0byBpdCBhbmQgdGhlbiBwdXNoZXMgaXQgdG8gdGhlIG5ldyBzdHJlYW0uXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IHRoaXMuX3B1c2hlciggKHZhbCkgPT4gcHVzaCggZnVuayh2YWwpICkgKSApXHJcblxyXG5cdH0sXHJcblxyXG5cclxuLy9JbiB0aGlzIGNhc2UgdGhlIGltcGxlbWVudGF0aW9uIG9mIGBmbGF0YCBpcyBxdWl0ZSBzaW1wbGUuXHJcblxyXG4vL0VmZmVjdGl2ZWx5IGFsbCB3ZSBoYXZlIHRvIGRvIGlzIHJldHVybiB0aGUgc2FtZSB2YWx1ZSB3aXRoIHdoaWNoIHRoZSBpbm5lciBzdHJlYW0gaXMgcHVzaGQgd2l0aC5cclxuLy9UbyBkbyB0aGlzLCB3ZSB1bndyYXAgb3VyIHN0cmVhbSBvbmNlIHRvIGdldCB0aGUgaW5uZXIgc3RyZWFtIHZhbHVlLCBhbmQgdGhlbiB1bndyYXAgdGhlIGlubmVyXHJcbi8vc3RyZWFtIGl0c2VsZiB0byBnZXQgaXRzIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IFxyXG5cdFx0XHR0aGlzLl9wdXNoZXIoXHQoaW5uZXJfc3RyZWFtKSA9PiBcclxuXHRcdFx0XHRpbm5lcl9zdHJlYW0uX3B1c2hlcigodmFsKSA9PiBwdXNoKHZhbCkpXHJcblx0XHRcdCkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGB0cnlGbGF0YCBmdW5jdGlvbiBpcyBhbG1vc3QgdGhlIHNhbWU6XHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gXHJcblx0XHRcdHRoaXMuX3B1c2hlcihcdChpbm5lcl9zdHJlYW0pID0+IHsgXHJcblx0XHRcdFx0aWYoaW5uZXJfc3RyZWFtLmNvbnN0cnVjdG9yID09PSBzdHJlYW0pe1xyXG5cdFx0XHRcdFx0aW5uZXJfc3RyZWFtLl9wdXNoZXIoKHZhbCkgPT4gcHVzaCh2YWwpKVxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cHVzaChpbm5lcl9zdHJlYW0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdClcclxuXHR9LFxyXG5cclxuLy9UaGUgYHJ1bmAgZnVuY3Rpb24ganVzdCBmZWVkcyB0aGUgcHVzaGVyIHdpdGggYSBwbGFjZWhvbGRlciAgZnVuY3Rpb24gc28gb3VyIGNvbXB1dGF0aW9uIGNhblxyXG4vL3N0YXJ0IGV4ZWN1dGluZy5cclxuXHJcblx0cnVuOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcHVzaGVyKGZ1bmN0aW9uKGEpe3JldHVybiBhfSlcclxuXHR9LFxyXG5cdFxyXG4vL0FmdGVyIHRoZXNlIGFyZSBkb25lLCBhbGwgd2UgbmVlZCB0byBkbyBpcyBpbXBsZW1lbnQgdGhlIHRyYWRpdGlvbmFsIEpTIGFycmF5IGZ1bmN0aW9uc1xyXG5cclxuLy9gRm9yRWFjaGAgaXMgYWxtb3N0IHRoZSBzYW1lIGFzIGBtYXBgLCBleGNlcHQgd2UgZG9uJ3QgcHVzaCBgZnVuayh2YWwpYCAtIHRoZSByZXN1bHQgb2YgdGhlIHRyYW5zZm9ybWF0aW9uXHJcbi8vdG8gdGhlIG5ldyBzdHJlYW0sIGJ1dCB3ZSBwdXNoIGB2YWxgIGluc3RlYWQuXHJcblxyXG5cdGZvckVhY2g6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gdGhpcy5fcHVzaGVyKCAodmFsKSA9PiB7IFxyXG5cdFx0XHRwdXNoKHZhbCkgXHJcblx0XHRcdGZ1bmsodmFsKVxyXG5cdFx0fSApIClcclxuXHR9LFxyXG5cclxuLy9XaXRoIGZpbHRlciB0aGUgcmVzdWx0IG9mIGBmdW5rKHZhbClgIHNob3dzIHVzIHdoZXRoZXIgd2UgbmVlZCB0byBwdXNoIHRoZSB2YWx1ZVxyXG5cclxuXHRmaWx0ZXI6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gdGhpcy5fcHVzaGVyKCAodmFsKSA9PiB7IFxyXG5cdFx0XHRpZihmdW5rKHZhbCkpe3B1c2godmFsKX1cclxuXHRcdH0gKSApXHJcblx0fSxcclxuXHJcblx0cmVkdWNlOmZ1bmN0aW9uKGZ1bmssIGZyb20pe1xyXG5cdFx0bGV0IGFjY3VtdWxhdG9yID0gZnJvbVxyXG5cdFx0dGhpcy5fcHVzaGVyKHZhbCA9PiB7XHJcblx0XHRcdGFjY3VtdWxhdG9yID0gZnVuayhhY2N1bXVsYXRvciwgdmFsKSBcclxuXHRcdH0pXHJcblx0fSxcclxufS8vLS1cclxuXHJcbi8vQWRkIGFsaWFzZXMgdG8gbWFwIC4gZmxhdCBhcyBmbGF0TWFwIGFuZCBtYXAgLiB0cnlGbGF0IGFzIHBoYXRNYXBcclxuICAgICAgICBtZXRob2RzLmZsYXRNYXAgPSBoZWxwZXJzLmZsYXRNYXBcclxuICAgICAgICBtZXRob2RzLnBoYXRNYXAgPSBoZWxwZXJzLnBoYXRNYXBcclxuXHJcbi8vQWRkIGEgcHJpbnQgZnVuY3Rpb24sIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgICAgICBtZXRob2RzLnByaW50ID0gaGVscGVycy5wcmludFxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIHN0cmVhbSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHRjb25zdCBzdHJlYW0gPSBmdW5jdGlvbihwdXNoKXtcclxuXHRcdGlmKHR5cGVvZiBwdXNoICE9PSBcImZ1bmN0aW9uXCIpeyByZXR1cm4gbWV0aG9kcy5vZihwdXNoKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcblxyXG5cdFx0b2JqLl9wdXNoZXIgPSBwdXNoXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBzdHJlYW1cclxuXHRcdG9iai5wcm90b3R5cGUgPSBtZXRob2RzXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHN0cmVhbVxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IGZ1bmN0aW9uXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBmdW5jdGlvbiBtb25hZCBhdWdtZW50cyBzdGFuZGFyZCBKYXZhU2NyaXB0IGZ1bmN0aW9ucyB3aXRoIGZhY2lsaXRpZXMgZm9yIGNvbXBvc2l0aW9uIGFuZCBjdXJyeWluZy5cclxuPCEtLW1vcmUtLT5cclxuXHJcbiovXHJcblFVbml0Lm1vZHVsZShcImZ1bmN0aW9uc1wiKS8vLS1cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIilcclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY29uc3RydWN0IGZ1bmN0aW9ucyBsaW5lIHRoaXNcclxuXHRcclxuXHRcdHZhciBwbHVzXzEgPSBmKCAobnVtKSA9PiBudW0rMSApXHJcblxyXG5cclxuLy9BZnRlciB5b3UgZG8gdGhhdCwgeW91IHdpbGwgc3RpbGwgYmUgYWJsZSB0byB1c2UgYHBsdXNfMWAgbGlrZSBhIG5vcm1hbCBmdW5jdGlvbiwgYnV0IHlvdSBjYW4gYWxzbyBkbyB0aGUgZm9sbG93aW5nOlxyXG5cclxuXHJcbi8qXHJcbkN1cnJ5aW5nXHJcbi0tLS1cclxuV2hlbiB5b3UgY2FsbCBhIGZ1bmN0aW9uIGBmYCB3aXRoIGxlc3MgYXJndW1lbnRzIHRoYXQgaXQgYWNjZXB0cywgaXQgcmV0dXJucyBhIHBhcnRpYWxseSBhcHBsaWVkXHJcbihib3VuZCkgdmVyc2lvbiBvZiBpdHNlbGYgdGhhdCBtYXkgYXQgYW55IHRpbWUgYmUgY2FsbGVkIHdpdGggdGhlIHJlc3Qgb2YgdGhlIGFyZ3VtZW50cy5cclxuKi9cclxuXHJcblx0UVVuaXQudGVzdChcImN1cnJ5XCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0Y29uc3QgYWRkMyA9IGYoIChhLGIsYykgPT4gYStiK2MgKVxyXG5cdFx0XHJcblx0XHRjb25zdCBhZGQyID0gYWRkMygwKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBhZGQyKDEsIDEpLCAyIClcclxuXHRcdGFzc2VydC5lcXVhbCggYWRkMig1LCA1KSwgMTAgKVxyXG5cclxuXHRcdGNvbnN0IHBsdXMxMCA9IGFkZDIoMTApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMxMCg1KSwgMTUgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzMTAoMTApLCAyMCApXHJcblxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbmBvZih2YWx1ZSlgXHJcbi0tLS1cclxuSWYgY2FsbGVkIHdpdGggYSB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgaXQgY29uc3RydWN0cyBhIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgdGhhdCB2YWx1ZS5cclxuSWYgY2FsbGVkIHdpdGhvdXQgYXJndW1lbnRzIGl0IHJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGFsd2F5cyByZXR1cm5zIHRoZSBhcmd1bWVudHMgZ2l2ZW4gdG8gaXQuXHJcbiovXHJcblx0UVVuaXQudGVzdChcIm9mXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0Y29uc3QgcmV0dXJuczkgPSBmKCkub2YoOSlcclxuXHRcdGFzc2VydC5lcXVhbCggcmV0dXJuczkoMyksIDkgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCByZXR1cm5zOShcImFcIiksIDkgKVxyXG5cclxuXHRcdGNvbnN0IGlkID0gZigpLm9mKClcclxuXHRcdGFzc2VydC5lcXVhbCggaWQoMyksIDMgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBpZChcImFcIiksIFwiYVwiIClcclxuXHJcblx0fSkvLy0tXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdCwgdGhlbiBjYWxscyBgZnVua2Agd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudDpcclxuKi9cclxuXHRRVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0XHJcbi8vWW91IGNhbiBjcmVhdGUgYSBGdW5jdGlvbiBNb25hZCBieSBwYXNzaW5nIGEgbm9ybWFsIEphdmFTY3JpcHQgZnVuY3Rpb24gdG8gdGhlIGNvbnN0cnVjdG9yICh5b3UgY2FuIHdyaXRlIHRoZSBmdW5jdGlvbiBkaXJlY3RseSB0aGVyZSk6XHJcblx0XHRcclxuXHRcdHZhciBwbHVzMSA9IGYoIG51bSA9PiBudW0rMSApXHJcblxyXG5cclxuLy9UaGVuIG1ha2luZyBhbm90aGVyIGZ1bmN0aW9uIGlzIGVhc3k6XHJcblxyXG5cdFx0dmFyIHBsdXMyID0gcGx1czEubWFwKHBsdXMxKSBcclxuXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMyKDApLCAyIClcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXM0ID0gcGx1czIubWFwKHBsdXMyKVxyXG5cclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czQoMSksIDUgKVxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgIGV4Y2VwdCB0aGF0IGlmIGBmdW5rYCByZXR1cm5zIGFub3RoZXIgZnVuY3Rpb24gaXQgcmV0dXJucyBhIHRoaXJkIGZ1bmN0aW9uIHdoaWNoOlxyXG4xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QuXHJcbjIuIENhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50XHJcbjMuIENhbGxzIHRoZSBmdW5jdGlvbiByZXR1cm5lZCBieSBgZnVua2Agd2l0aCB0aGUgc2FtZSBhcmd1bWVudCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0IG9mIHRoZSBzZWNvbmQgY2FsbC5cclxuKi9cclxuXHRRVW5pdC50ZXN0KFwicGhhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vWW91IGNhbiB1c2UgYHBoYXRNYXBgIHRvIG1vZGVsIHNpbXBsZSBpZi10aGVuIHN0YXRlbWVudHMuIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSB1c2VzIGl0IGluIGNvbWJpbmF0aW9uIG9mIHRoZSBjdXJyeWluZyBmdW5jdGlvbmFsaXR5OlxyXG5cdFx0XHJcblx0XHR2YXIgY29uY2F0ID0gZiggKHN0cjEsIHN0cjIpID0+IHN0cjEgKyBzdHIyKVxyXG5cclxuXHRcdHZhciBtYWtlTWVzc2FnZSA9IGYocGFyc2VJbnQsIDEpXHJcblx0XHRcdC5mbGF0TWFwKChudW0pID0+IGlzTmFOKG51bSk/IGYoXCJFcnJvci4gTm90IGEgbnVtYmVyXCIpIDogY29uY2F0KFwiVGhlIG51bWJlciBpcyBcIikgKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIxXCIpLCBcIlRoZSBudW1iZXIgaXMgMVwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMlwiKSwgXCJUaGUgbnVtYmVyIGlzIDJcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIllcIiksIFwiRXJyb3IuIE5vdCBhIG51bWJlclwiKVxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwYCBpcyBzaW1pbGFyIHRvIHRoZSBgPj49YCBmdW5jdGlvbiBpbiBIYXNrZWxsLCB3aGljaCBpcyB0aGUgYnVpbGRpbmcgYmxvY2sgb2YgdGhlIGluZmFtb3VzIGBkb2Agbm90YXRpb25cclxuSXQgY2FuIGJlIHVzZWQgdG8gd3JpdGUgcHJvZ3JhbXMgd2l0aG91dCB1c2luZyBhc3NpZ25tZW50Llx0XHJcblxyXG5Gb3IgZXhhbXBsZSBpZiB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaW4gSGFza2VsbDpcclxuXHJcblx0XHRhZGRTdHVmZiA9IGRvICBcclxuXHRcdFx0YSA8LSAoKjIpICBcclxuXHRcdFx0YiA8LSAoKzEwKSAgXHJcblx0XHRcdHJldHVybiAoYStiKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHJcbldoZW4gd2UgZGVzdWdhciBpdCwgdGhpcyBiZWNvbWVzOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gKCoyKSA+Pj0gXFxhIC0+XHJcblx0XHRcdFx0KCsxMCkgPj49IFxcYiAtPlxyXG5cdFx0XHRcdFx0cmV0dXJuIChhK2IpXHJcblxyXG5vciBpbiBKYXZhU2NyaXB0IHRlcm1zOlxyXG5cclxuKi9cclxuXHJcblx0XHR2YXIgYWRkU3R1ZmYgPSBmKCBudW0gPT4gbnVtICogMiApXHJcblx0XHRcdC5mbGF0TWFwKCBhID0+IGYoIG51bSA9PiBudW0gKyAxMCApXHJcblx0XHRcdFx0LmZsYXRNYXAoIGIgPT4gZi5vZihhICsgYikgKSBcclxuXHRcdFx0KVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogbGlzdCBcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBsaXN0YCB0eXBlLCBhdWdtZW50cyB0aGUgc3RhbmRhcmQgSmF2YVNjcmlwdCBhcnJheXMsIG1ha2luZyB0aGVtIGltbXV0YWJsZSBhbmQgYWRkaW5nIGFkZGl0aW9uYWwgZnVuY3Rpb25hbGl0eSB0byB0aGVtXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJMaXN0XCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYGxpc3RgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIGxpc3QgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9saXN0XCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIGNyZWF0ZSBhIGBsaXN0YCBmcm9tIGFycmF5IGxpa2UgdGhpc1xyXG5cdFx0dmFyIG15X2xpc3QgPSBsaXN0KFsxLDIsM10pXHJcbi8vb3IgbGlrZSB0aGlzOlxyXG5cdFx0dmFyIG15X2xpc3QgPSBsaXN0KDEsMiwzKVxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5TdGFuZGFyZCBhcnJheSBtZXRob2QuIEV4ZWN1dGVzIGBmdW5rYCBmb3IgZWFjaCBvZiB0aGUgdmFsdWVzIGluIHRoZSBsaXN0IGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IGxpc3QuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHR2YXIgcGVvcGxlID0gbGlzdCgge25hbWU6XCJqb2huXCIsIGFnZToyNCwgb2NjdXBhdGlvbjpcImZhcm1lclwifSwge25hbWU6XCJjaGFybGllXCIsIGFnZToyMiwgb2NjdXBhdGlvbjpcInBsdW1iZXJcIn0pXHJcblx0dmFyIG5hbWVzID0gcGVvcGxlLm1hcCgocGVyc29uKSA9PiBwZXJzb24ubmFtZSApXHJcblx0YXNzZXJ0LmRlZXBFcXVhbChuYW1lcywgW1wiam9oblwiLCBcImNoYXJsaWVcIl0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAsIGJ1dCBpZiBgZnVua2AgcmV0dXJucyBhIGxpc3Qgb3IgYW4gYXJyYXkgaXQgZmxhdHRlbnMgdGhlIHJlc3VsdHMgaW50byBvbmUgYXJyYXlcclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHJcblx0dmFyIG9jY3VwYXRpb25zID0gbGlzdChbIFxyXG5cdFx0e29jY3VwYXRpb246XCJmYXJtZXJcIiwgcGVvcGxlOltcImpvaG5cIiwgXCJzYW1cIiwgXCJjaGFybGllXCJdIH0sXHJcblx0XHR7b2NjdXBhdGlvbjpcInBsdW1iZXJcIiwgcGVvcGxlOltcImxpc2FcIiwgXCJzYW5kcmFcIl0gfSxcclxuXHRdKVxyXG5cdFxyXG5cdHZhciBwZW9wbGUgPSBvY2N1cGF0aW9ucy5waGF0TWFwKChvY2N1cGF0aW9uKSA9PiBvY2N1cGF0aW9uLnBlb3BsZSlcclxuXHRhc3NlcnQuZGVlcEVxdWFsKHBlb3BsZSxbXCJqb2huXCIsIFwic2FtXCIsIFwiY2hhcmxpZVwiLCBcImxpc2FcIiwgXCJzYW5kcmFcIl0pXHJcblxyXG59KS8vLS1cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcbiIsInZhciBtYXliZVQgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVRcIilcclxudmFyIGxpc3QgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9saXN0XCIpXHJcbnZhciBzdGF0ZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0YXRlXCIpXHJcblxyXG5RVW5pdC5tb2R1bGUoXCJtYXliZVRcIilcclxuXHJcblFVbml0LnRlc3QoXCJsaXN0XCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4gICAgdmFyIGJjID0gbWF5YmVUKGxpc3Qoe2E6XCJiXCJ9LCB7YTpcImNcIn0pKS5nZXRQcm9wKFwiYVwiKVxyXG4gICAgYXNzZXJ0LmRlZXBFcXVhbChiYy5faW5uZXJNb25hZCwgW1wiYlwiLCBcImNcIl0pXHJcbiAgICB2YXIgYWJjID0gYmMubGlmdChcInJldmVyc2VcIikubGlmdChcImNvbmNhdFwiLCBbXCJhXCJdKVxyXG4gICAgYXNzZXJ0LmRlZXBFcXVhbChhYmMuX2lubmVyTW9uYWQsIFtcImNcIiwgXCJiXCIsIFwiYVwiXSlcclxufSlcclxuLypcclxuUVVuaXQudGVzdChcInN0YXRlXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4gICAgbWF5YmVUKHN0YXRlKDEpKVxyXG4gICAgLm1hcCgpXHJcbn0pXHJcblxyXG4qL1xyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IG1heWJlXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgbWF5YmVgIHR5cGUsIGFsc28ga25vd24gYXMgYG9wdGlvbmAgdHlwZSBpcyBhIGNvbnRhaW5lciBmb3IgYSB2YWx1ZSB0aGF0IG1heSBub3QgYmUgdGhlcmUuIFxyXG5cclxuVGhlIHB1cnBvc2Ugb2YgdGhpcyBtb25hZCBpcyB0byBlbGltaW5hdGUgdGhlIG5lZWQgZm9yIHdyaXRpbmcgYG51bGxgIGNoZWNrcy4gXHJcbkZ1cnRoZXJtb3JlIGl0IGFsc28gZWxpbWluYXRlcyB0aGUgcG9zc2liaWxpdHkgb2YgbWFraW5nIGVycm9ycyBieSBtaXNzaW5nIG51bGwtY2hlY2tzLlxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuXHJcbnZhciBpZGVudGl0eSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2lkZW50aXR5XCIpLy8tLVxyXG52YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcbnZhciBsaXN0ID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbGlzdFwiKS8vLS1cclxudmFyIHN0YXRlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvc3RhdGVcIikvLy0tXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBtYXliZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcbiAgICB2YXIgbWF5YmUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byB3cmFwIGEgdmFsdWUgaW4gYG1heWJlYCB3aXRoOlxyXG4gICAgdmFyIHZhbCA9IDQvLy0tXHJcbiAgICB2YXIgbWF5YmVfdmFsID0gbWF5YmUodmFsKVxyXG5cclxuLy9JZiB0aGUgJ3ZhbCcgaXMgZXF1YWwgdG8gKnVuZGVmaW5lZCogaXQgdGhyZWF0cyB0aGUgY29udGFpbmVyIGFzIGVtcHR5LlxyXG5cclxuXHJcbi8vWW91IGNhbiBhbHNvIGNvbWJpbmUgYSBgbWF5YmVgIHdpdGggYW4gZXhpc3RpbmcgbW9uYWQsIHVzaW5nIHRoZSBgbWF5YmVUYCBjb25zdHJ1Y3RvcjpcclxuXHJcbiAgICB2YXIgbWF5YmVUID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbWF5YmVUXCIpXHJcbiAgICBjb25zdCBtYXliZUxpc3QgPSBtYXliZVQobGlzdCgxLDIsMykpXHJcblxyXG5cclxudmFyIHRlc3QgPSAobWF5YmUpPT57Ly8tLVxyXG4vKlxyXG5CYXNpYyBNZXRob2RzXHJcbi0tLVxyXG5cclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5FeGVjdXRlcyBgZnVua2Agd2l0aCB0aGUgYG1heWJlYCdzIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBidXQgb25seSBpZiB0aGUgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gKnVuZGVmaW5lZCosIGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IG1heWJlLlxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1RyYWRpdGlvbmFsbHksIGlmIHdlIGhhdmUgYSB2YWx1ZSB0aGF0IG1heSBiZSB1bmRlZmluZWQgd2UgZG8gYSBudWxsIGNoZWNrIGJlZm9yZSBkb2luZyBzb21ldGhpbmcgd2l0aCBpdDpcclxuXHJcblx0dmFyIG9iaiA9IHt9Ly8tLVxyXG5cdHZhciBnZXRfcHJvcGVydHkgPSBmKChvYmplY3QpID0+IG9iamVjdC5wcm9wZXJ0eSkvLy0tXHJcblx0XHJcblx0dmFyIHZhbCA9IGdldF9wcm9wZXJ0eShvYmopXHJcblx0XHJcblx0aWYodmFsICE9PSB1bmRlZmluZWQpe1xyXG5cdFx0dmFsID0gdmFsLnRvU3RyaW5nKClcclxuXHR9XHJcblx0YXNzZXJ0LmVxdWFsKHZhbCwgdW5kZWZpbmVkKSBcclxuXHJcbi8vV2l0aCBgbWFwYCB0aGlzIGNhbiBiZSB3cml0dGVuIGxpa2UgdGhpc1xyXG5cclxuIFx0dmFyIG1heWJlX2dldF9wcm9wZXJ0eSA9IGdldF9wcm9wZXJ0eS5tYXAobWF5YmUpXHJcblx0bWF5YmVfZ2V0X3Byb3BlcnR5KG9iaikubWFwKCh2YWwpID0+IHtcclxuXHRcdGFzc2VydC5vayhmYWxzZSkvLy0tXHJcblx0XHR2YWwudG9TdHJpbmcoKS8vdGhpcyBpcyBub3QgZXhlY3V0ZWRcclxuXHR9KVxyXG5cclxuLy9UaGUgYmlnZ2VzdCBiZW5lZml0IHdlIGdldCBpcyB0aGF0IGluIHRoZSBmaXJzdCBjYXNlIHdlIGNhbiBlYXNpbHkgZm9yZ2V0IHRoZSBudWxsIGNoZWNrOlxyXG5cdFxyXG5cdGFzc2VydC50aHJvd3MoZnVuY3Rpb24oKXtcclxuXHRcdGdldF9wcm9wZXJ0eShvYmopLnRvU3RyaW5nKCkgIC8vdGhpcyBibG93cyB1cFxyXG5cdH0pXHJcblxyXG4vL1doaWxlIGluIHRoZSBzZWNvbmQgY2FzZSB3ZSBjYW5ub3QgYWNjZXNzIHRoZSB1bmRlcmx5aW5nIHZhbHVlIGRpcmVjdGx5LCBhbmQgdGhlcmVmb3JlIGNhbm5vdCBleGVjdXRlIGFuIGFjdGlvbiBvbiBpdCwgaWYgaXQgaXMgbm90IHRoZXJlLlxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgYG1heWJlYCBpdCBmbGF0dGVucyB0aGUgdHdvIGBtYXliZXNgIGludG8gb25lLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vYG1hcGAgd29ya3MgZmluZSBmb3IgZWxpbWluYXRpbmcgZXJyb3JzLCBidXQgaXQgZG9lcyBub3Qgc29sdmUgb25lIG9mIHRoZSBtb3N0IGFubm95aW5nIHByb2JsZW1zIHdpdGggbnVsbC1jaGVja3MgLSBuZXN0aW5nOlxyXG5cclxuXHR2YXIgb2JqID0geyBmaXJzdDoge3NlY29uZDpcInZhbFwiIH0gfVxyXG5cdFxyXG5cdG1heWJlKG9iailcclxuXHRcdC5tYXAoIHJvb3QgPT4gbWF5YmUocm9vdC5maXJzdCkpXHJcblx0XHQubWFwKCBtYXliZUZpcnN0ID0+IG1heWJlRmlyc3QubWFwIChmaXJzdCA9PiBtYXliZSAobWF5YmVGaXJzdC5zZWNvbmQgKSApICkgXHJcblx0XHQubWFwKCBtYXliZU1heWJlVmFsdWUgPT4gbWF5YmVNYXliZVZhbHVlLm1hcCAobWF5YmVWYWx1ZSA9PiBtYXliZVZhbHVlLm1hcCggKHZhbHVlKT0+KCBhc3NlcnQuZXF1YWwoIHZhbCwgXCJ2YWxcIikgKSApICkgKVxyXG5cclxuLy9gcGhhdE1hcGAgZG9lcyB0aGUgZmxhdHRlbmluZyBmb3IgdXMsIGFuZCBhbGxvd3MgdXMgdG8gd3JpdGUgY29kZSBsaWtlIHRoaXNcclxuXHJcblx0bWF5YmUob2JqKVxyXG5cdFx0LmZsYXRNYXAocm9vdCA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5mbGF0TWFwKGZpcnN0ID0+IG1heWJlKGZpcnN0LnNlY29uZCkpXHJcblx0XHQuZmxhdE1hcCh2YWwgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwodmFsLCBcInZhbFwiKVxyXG5cdFx0fSlcclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuSGVscGVyc1xyXG4tLS0tXHJcblxyXG5gZ2V0UHJvcChwcm9wTmFtZSlgXHJcbi0tLS1cclxuQXNzdW1pbmcgdGhlIHZhbHVlIGluc2lkZSB0aGUgYG1heWJlYCBpcyBhbiBvYmplY3QsIHRoaXMgbWV0aG9kIHNhZmVseSByZXRyaWV2ZXMgb25lIG9mIHRoZSBvYmplY3QncyBwcm9wZXJ0aWVzLlxyXG4qL1xyXG5cclxuXHJcblxyXG4vKlxyXG5BZHZhbmNlZCBVc2FnZVxyXG4tLS0tXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiYWR2YW5jZWRcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcbi8vIGBtYXliZWAgY2FuIGJlIHVzZWQgd2l0aCB0aGUgZnVuY3Rpb24gbW9uYWQgdG8gZWZmZWN0aXZlbHkgcHJvZHVjZSAnc2FmZScgdmVyc2lvbnMgb2YgZnVuY3Rpb25zXHJcblxyXG5cdHZhciBnZXQgPSBmKChwcm9wLCBvYmopID0+IG9ialtwcm9wXSlcclxuXHR2YXIgbWF5YmVHZXQgPSBnZXQubWFwKG1heWJlKVxyXG5cclxuLy9UaGlzIGNvbWJpbmVkIHdpdGggdGhlIHVzZSBvZiBjdXJyeWluZyBtYWtlcyBmb3IgYSB2ZXJ5IGZsdWVudCBzdHlsZSBvZiBjb2Rpbmc6XHJcblxyXG5cdHZhciBnZXRGaXJzdFNlY29uZCA9IChyb290KSA9PiBtYXliZShyb290KS5waGF0TWFwKG1heWJlR2V0KCdmaXJzdCcpKS5waGF0TWFwKG1heWJlR2V0KCdzZWNvbmQnKSlcclxuXHRcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwidmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwidmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDoge3NlY29uZDpcIm90aGVyX3ZhbHVlXCIgfSB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIm90aGVyX3ZhbHVlXCIpKVxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IFwiXCIgfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ3aGF0ZXZlclwiKSApLy93b24ndCBiZSBleGVjdXRlZCBcclxufSkvLy0tXHJcblxyXG59Ly8tLVxyXG5RVW5pdC5tb2R1bGUoXCJNYXliZVwiKS8vLS1cclxudGVzdChtYXliZSkvLy0tXHJcblFVbml0Lm1vZHVsZShcIk1heWJlVFwiKS8vLS1cclxudGVzdCgodmFsKT0+bWF5YmVUKGlkZW50aXR5KHZhbCkpKS8vLS1cclxuXHJcbiAgICBcclxuLypcclxuQ29tYmluaW5nIHdpdGggT3RoZXIgTW9uYWRzXHJcbi0tLS1cclxuaW4gYWRkaXRpb24gdG8gY3JlYXRpbmcgYSBgbWF5YmVgIGZyb20gYSBwbGFpbiB2YWx1ZSwgeW91IGNhbiBhbHNvIGNyZWF0ZSBvbmUgZnJvbSBhbiBleGlzdGluZyBtb25hZCwgdXNpbmcgdGhlIGBtYXliZXRgIGNvbnN0cnVjdG9yOlxyXG5cclxudGhlIHJlc3VsdGluZyBtb25hZCB3aWxsIGdhaW4gYWxsIHRoZSBjaGFyYWN0ZXJpc3RpY3Mgb2YgYSBgbWF5YmVgIHdpdGhvdXQgbG9zaW5nIHRoZSBjaGFyYWN0ZXJpc3RpY3Mgb2YgdGhlIHVuZGVybHlpbmcgbW9uYWQuXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJiYXNpY1wiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuICAgIFxyXG4vL0NvbWJpbmluZyBhIG1heWJlIHdpdGggYSBsaXN0LCBmb3IgZXhhbXBsZSwgY3JlYXRlcyBhIGxpc3Qgd2hlcmUgZWFjaCBvZiB0aGUgdmFsdWVzIGFyZSBgbWF5YmVgc1xyXG4vL0luIHRoZSBmb2xsb3dpbmcgZXhhbXBsZSBgbWFwYCB3aWxsIGdldCBjYWxsZWQgb25seSBmb3IgdGhlIGZpcnN0IHZhbHVlOlxyXG5cclxuICAgIG1heWJlVChsaXN0KDEsIHVuZGVmaW5lZCkpLm1hcCgodmFsKT0+e1xyXG4gICAgICAgIGFzc2VydC5lcXVhbCh2YWwsIDEpICAgXHJcbiAgICB9KVxyXG5cclxufSkvLy0tXHJcblxyXG5RVW5pdC50ZXN0KFwibGlzdFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuLy9UaGlzIG1lYW5zIHlvdSBjYW4gdXNlIG1heWJlIHRvIHNhZmVseSB0cmFuc2Zvcm0gdGhlIGxpc3QgaXRlbXMuXHJcbi8vSWYgYSBsaXN0IHZhbHVlIGlzIHVuZGVmaW5lZCwgaXQgd2lsbCBqdXN0IHN0YXkgdW5kZWZpbmVkLlxyXG5cclxuICAgIG1heWJlVChsaXN0KHtmaXJzdDp7IHNlY29uZDpcInZhbHVlXCIgfSB9LCB7Zmlyc3Q6eyBzZWNvbmQ6XCJvdGhlciB2YWx1ZVwiIH0gfSwgeyBmaXJzdDpcIlwifSApKVxyXG4gICAgICAgIC5waGF0TWFwKCh2YWwpPT4gbWF5YmVUKHZhbC5maXJzdCkgKVxyXG4gICAgICAgIC5waGF0TWFwKCh2YWwpPT4gbWF5YmVUKHZhbC5zZWNvbmQpIClcclxuICAgICAgICAubGlmdChsaXN0ID0+IHtcclxuICAgICAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwobGlzdCwgW1widmFsdWVcIiwgXCJvdGhlciB2YWx1ZVwiLCB1bmRlZmluZWRdKVxyXG4gICAgICAgIH0pXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcbmBsaWZ0KGZ1bmspYFxyXG4tLS0tXHJcbkluIGFkZGl0aW9uIHRvIGFsbCBvdGhlciBtZXRob2RzLCBgbWF5YmVgIHZhbHVlcywgdGhhdCBhcmUgY3JlYXRlZCBmcm9tIG90aGVyIG1vbmFkcyB1c2luZyB0aGUgYG1heWJlVGAgY29uc3RydWN0b3JcclxuaGF2ZSB0aGUgYGxpZnRgIG1ldGhvZCB3aGljaCBlbmFibGVzIHlvdSB0byBleGVjdXRlIGEgZnVuY3Rpb24gdG8gdGhlIHVuZGVybHlpbmcgbW9uYWQ6XHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJsaWZ0XCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4gICAgY29uc3QgbWF5YmVMaXN0ID0gbWF5YmVUKGxpc3QoW1wiYVwiLFwiYlwiLFwiY1wiXSkpXHJcbiAgICBcclxuICAgIG1heWJlTGlzdC5saWZ0KChsaXN0KSA9PntcclxuICAgICAgICBhc3NlcnQuZGVlcEVxdWFsKGxpc3QsIFtcImFcIiwgXCJiXCIsIFwiY1wiXSlcclxuICAgIH0pXHJcblxyXG4vL1lvdSBjYW4gYWxzbyB1c2UgYGxpZnRgIHRvIGNhbGwgYSBtZXRob2QgdGhhdCBpcyBkZWZpbmVkIGluIHRoZSBtb25hZCwgYnkgc3BlY2lmeWluZyB0aGUgbWV0aG9kIG5hbWUgYXMgYSBzdHJpbmdcclxuXHJcbiAgICBtYXliZUxpc3RcclxuICAgICAgICAubGlmdChcImNvbmNhdFwiLCBbXCJkXCJdKVxyXG4gICAgICAgIC5saWZ0KFwicmV2ZXJzZVwiKVxyXG4gICAgICAgIC5saWZ0KChsaXN0KSA9PiB7XHJcbiAgICAgICAgICAgIGFzc2VydC5kZWVwRXF1YWwobGlzdCwgW1wiZFwiLCBcImNcIiwgXCJiXCIsIFwiYVwiXSlcclxuICAgICAgICB9KVxyXG5cclxufSkvLy0tXHJcblxyXG5cclxuXHJcblxyXG5cclxuLypcclxuVW5kZXIgdGhlIEhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogcHJvbWlzZSBcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBwcm9taXNlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBmdXR1cmVgIGlzIGEgY29udGFpbmVyIGZvciBhIHZhbHVlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLCBcclxudmlhIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiUHJvbWlzZVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBwcm9taXNlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHR2YXIgcHJvbWlzZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3Byb21pc2VcIilcclxuXHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVG8gY3JlYXRlIGEgYHByb21pc2VgIHBhc3MgYSBmdW5jdGlvbiB3aGljaCBhY2NlcHRzIGEgY2FsbGJhY2sgYW5kIGNhbGxzIHRoYXQgY2FsbGJhY2sgd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlOlxyXG5cclxuXHR2YXIgbXlfcHJvbWlzZSA9IHByb21pc2UoIChyZXNvbHZlKSA9PiAgXHJcblx0XHRzZXRUaW1lb3V0KCgpID0+IHsgcmVzb2x2ZSg1KSB9LDEwMDApICBcclxuXHQpXHJcblxyXG4vLyBJbiBtb3N0IGNhc2VzIHlvdSB3aWxsIGJlIGNyZWF0aW5nIHByb21pc2VzIHVzaW5nIGhlbHBlciBmdW5jdGlvbnMgbGlrZTpcclxuXHJcblx0Y29uc3QgZ2V0VXJsID0gKHVybCkgPT4gcHJvbWlzZSggKHJlc29sdmUpID0+IHtcclxuXHQgIGNvbnN0IHJxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcclxuICBcdCAgcnEub25sb2FkID0gKCkgPT4gcmVzb2x2ZShKU09OLnBhcnNlKHJxLnJlc3BvbnNlVGV4dCkpXHJcblx0ICBycS5vcGVuKFwiR0VUXCIsdXJsLHRydWUpO1xyXG5cdCAgcnEuc2VuZCgpO1xyXG5cdH0pXHJcbi8qXHJcbmBydW4oKWBcclxuLS0tLVxyXG5FeGVjdXRlcyB0aGUgcHJvbWlzZSBhbmQgZmV0Y2hlcyB0aGUgZGF0YS5cclxuXHJcbioqKlxyXG5Gb3IgZXhhbXBsZSB0byBtYWtlIGEgcHJvbWlzZSBhbmQgcnVuIGl0IGltbWVkaWF0ZWx5IGRvOlxyXG4qL1xyXG5cdGdldFVybChcInBlb3BsZS5qc29uXCIpLnJ1bigpXHJcblx0Ly9bXHJcblx0Ly8gIHsgXCJuYW1lXCI6XCJqb2huXCIsIFwib2NjdXBhdGlvblwiOlwicHJvZ3JhbW1lclwifSxcclxuIFx0Ly8gIHtcIm5hbWVcIjpcImplblwiLCBcIm9jY3VwYXRpb25cIjpcImFkbWluXCJ9XHJcblx0Ly9dXHJcblxyXG5cdGdldFVybChcIm9jY3VwYXRpb25zLmpzb25cIikucnVuKClcclxuXHQvL3tcclxuXHQvLyAgXCJwcm9ncmFtbWVyXCI6IFwid3JpdGVzIGNvZGVcIlxyXG5cdC8vICBcImFkbWluXCI6IFwibWFuYWdlcyBpbmZyYXN0cnVjdHVyZVwiXHJcblx0Ly99XHJcblxyXG4vKlxyXG4vL05vdGUgdGhhdCB3ZSB3aWxsIGJlIHVzaW5nIHRoZSBkYXRhIGZyb20gdGhlc2UgdHdvIGZpbGVzIGluIHRoZSBuZXh0IGV4YW1wbGVzLiBcclxuXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuUmV0dXJucyBhIG5ldyBwcm9taXNlLCB3aGljaCBhcHBsaWVzIGBmdW5rYCB0byB0aGUgZGF0YSB3aGVuIHlvdSBydW4gaXQuXHJcblxyXG4qKipcclxuVGhlIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGJvdGggZm9yIG1hbmlwdWxhdGluZyB0aGUgZGF0YSB5b3UgZmV0Y2ggYW5kIGZvciBydW5uaW5nIHNpZGUgZWZmZWN0cyAgXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdGNvbnN0IHN0b3AgPSBhc3NlcnQuYXN5bmMoKS8vLS1cclxuXHRnZXRVcmwoXCJwZW9wbGUuanNvblwiKVxyXG5cdCAgXHJcblx0ICAvL1VzaW5nIFwibWFwXCIgZm9yIG1hbmlwdWxhdGluZyBkYXRhXHJcblx0ICAubWFwKChwZW9wbGUpID0+IHBlb3BsZS5tYXAoKHBlcnNvbikgPT4gcGVyc29uLm5hbWUpKVxyXG5cclxuXHQgIC8vVXNpbmcgXCJtYXBcIiBmb3IgdHJpZ2dlcmluZyBzaWRlIGVmZmVjdHMgXHJcblx0ICAubWFwKG5hbWVzID0+IHtcclxuXHQgICAgYXNzZXJ0LmRlZXBFcXVhbChuYW1lcywgWydqb2huJywgJ2plbiddKVxyXG5cdCAgICBzdG9wKCkvLy0tXHJcblx0ICB9KS5ydW4oKVxyXG59KS8vLS1cclxuXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5BIG1vcmUgcG93ZXJmdWwgdmVyc2lvbiBvZiBgbWFwYCB3aGljaCBjYW4gYWxsb3dzIHlvdSB0byBjaGFpbiBzZXZlcmFsIHN0ZXBzIG9mIHRoZSBhc3ljaHJvbm91cyBjb21wdXRhdGlvbnMgdG9nZXRoZXIuXHJcbktub3duIGFzIGB0aGVuYCBmb3IgdHJhZGl0aW9uYWwgcHJvbWlzZSBsaWJyYXJpZXMuXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdGNvbnN0IGRvbmUgPSBhc3NlcnQuYXN5bmMoKS8vLS1cdFxyXG5cclxuLy9Gb3IgZXhhbXBsZSBoZXJlIGlzIGEgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIGEgcGVyc29uJ3Mgb2NjdXBhdGlvbiBmcm9tIHRoZSBgcGVvcGxlLmpzb25gIGZpbGVcclxuLy9hbmQgdGhlbiByZXRyaWV2ZXMgdGhlIG9jY3VwYXRpb24ncyBkZXNjcmlwdGlvbiBmcm9tIGBvY2N1cGF0aW9ucy5qc29uYC4gXHJcblxyXG5cdGNvbnN0IGdldE9jY3VwYXRpb25EZXNjcmlwdGlvbiA9IChuYW1lKSA9PiBnZXRVcmwoXCJwZW9wbGUuanNvblwiKVxyXG5cclxuXHQgIC8vUmV0cmlldmUgcGVyc29uIGRhdGFcclxuXHQgIC5waGF0TWFwKChwZW9wbGUpID0+IHBlb3BsZS5maWx0ZXIoIHBlcnNvbiA9PiBwZXJzb24ubmFtZSA9PT0gbmFtZSApWzBdKVxyXG5cclxuXHQgIC8vUmV0cmlldmUgaXRzIG9jY3VwYXRpb25cclxuXHQgIC5waGF0TWFwKCAocGVyc29uKSA9PiBnZXRVcmwoXCJvY2N1cGF0aW9ucy5qc29uXCIpXHJcblx0ICAgIC5tYXAob2NjdXBhdGlvbnMgPT4gb2NjdXBhdGlvbnNbcGVyc29uLm9jY3VwYXRpb25dKSApXHJcblxyXG4vL0hlcmUgaXMgaG93IHRoZSBmdW5jdGlvbiBpcyB1c2VkOlxyXG5cclxuXHRnZXRPY2N1cGF0aW9uRGVzY3JpcHRpb24oXCJqb2huXCIpLm1hcCgoZGVzYykgPT4geyBcclxuXHRcdGFzc2VydC5lcXVhbChkZXNjLCBcIndyaXRlcyBjb2RlXCIpIFxyXG5cdFx0ZG9uZSgpLy8tLVxyXG5cdH0pLnJ1bigpXHJcblx0XHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBzdGF0ZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHN0YXRlYCB0eXBlLCBpcyBhIGNvbnRhaW5lciB3aGljaCBlbmNhcHN1bGF0ZXMgYSBzdGF0ZWZ1bCBmdW5jdGlvbi4gSXQgYmFzaWNhbGx5IGFsbG93cyB5b3UgdG8gY29tcG9zZSBmdW5jdGlvbnMsXHJcbmxpa2UgeW91IGNhbiBkbyB3aXRoIHRoZSBgZmAgdHlwZSwgZXhjZXB0IHdpdGggaXQgYW55IGZ1bmN0aW9uIGNhbiBhY2Nlc3MgYW4gYWRkaXRpb25hbCBcInZhcmlhYmxlXCIgYmVzaWRlcyBpdHNcclxuaW5wdXQgYXJndW1lbnQocykgLSB0aGUgc3RhdGUuIFxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiU3RhdGVcIikvLy0tXHJcblxyXG4vL1RvIHVzZSB0aGUgYHN0YXRlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBzdGF0ZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0YXRlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vSW4gdGhlIGNvbnRleHQgb2YgdGhpcyB0eXBlIGEgc3RhdGUgaXMgcmVwcmVzZW50ZWQgYnkgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSBzdGF0ZSBcclxuLy9hbmQgcmV0dXJucyBhIGxpc3Qgd2hpY2ggY29udGFpbnMgYSB2YWx1ZSBhbmQgYSBuZXcgc3RhdGUuIFNvIGZvciBleGFtcGxlOlxyXG5cclxuXHRzdGF0ZSgodmFsKSA9PiBbdmFsKzEsIHZhbF0pXHJcblxyXG4vL0NyZWF0ZXMgYSBuZXcgc3RhdGVmdWwgY29tcHV0YXRpb24gd2hpY2ggaW5jcmVtZW50cyB0aGUgaW5wdXQgYXJndW1lbnQgYW5kIHRoZW4gc2F2ZXMgaXQgaW4gdGhlIHN0YXRlLlxyXG5cclxuXHJcbi8qXHJcbmBvZih2YWx1ZSlgXHJcbi0tLS1cclxuQWNjZXB0cyBhIHZhbHVlIGFuZCB3cmFwcyBpbiBhIHN0YXRlIGNvbnRhaW5lclxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJvZlwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdGFzc2VydC5leHBlY3QoMCkvLy0tXHJcblx0XHRjb25zdCBzdGF0ZTUgPSBzdGF0ZSgpLm9mKDUpXHJcblx0fSkvLy0tXHJcblxyXG4vL05vdGUgdGhhdCB0aGUgZm9sbG93aW5nIGNvZGUgZG9lcyBub3QgcHV0IGA1YCBpbiB0aGUgc3RhdGUuXHJcbi8vUmF0aGVyIGl0IGNyZWF0ZXMgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGA1YCBhbmQgZG9lcyBub3QgaW50ZXJhY3Qgd2l0aCB0aGUgc3RhdGUuIFxyXG5cclxuXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuRXhlY3V0ZXMgYGZ1bmtgIHdpdGggdGhlIGVuY2Fwc3VsYXRlZCB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgYHN0YXRlYCBvYmplY3QsIFxyXG53aXRob3V0IGFjY2Vzc2luZyB0aGUgc3RhdGVcclxuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vT25lIG9mIHRoZSBtYWluIGJlbmVmaXRzIG9mIHRoZSBgc3RhdGVgIHR5cGVzIGlzIHRoYXQgaXQgYWxsb3dzIHlvdSB0byBtaXggcHVyZSBmdW5jdGlvbnMgd2l0aCB1bnB1cmUgb25lcywgXHJcbi8vSW4gdGhlIHNhbWUgd2F5IHRoYXQgcHJvbWlzZXMgYWxsb3cgdXMgdG8gbWl4IGFzeWNocm9ub3VzIGZ1bmN0aW9ucyB3aXRoIHN5bmNocm9ub3VzIG9uZXMuXHJcbi8vTWFwIGFsbG93cyB1cyB0byBhcHBseSBhbnkgZnVuY3Rpb24gb24gb3VyIHZhbHVlIGFuZCB0byBjb25zdW1lIHRoZSByZXN1bHQgaW4gYW5vdGhlciBmdW5jdGlvbi5cclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZSg1KVxyXG5cdFx0Lm1hcCgodmFsKSA9PiB2YWwrMSlcclxuXHRcdC5tYXAoKHZhbCkgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwodmFsLCA2KVxyXG5cdFx0XHRyZXR1cm4gdmFsICogMlxyXG5cdFx0fSlcclxuXHRcdC5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCwgMTIpKVxyXG5cdFx0LnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgLCBleGNlcHQgdGhhdCBpZiBgZnVua2AgcmV0dXJucyBhIG5ldyBzdGF0ZSBvYmplY3QgaXQgbWVyZ2VzIHRoZSB0d28gc3RhdGVzIGludG8gb25lLlxyXG5UaHVzIGBmbGF0TWFwYCBzaW11bGF0ZXMgbWFuaXB1bGF0aW9uIG9mIG11dGFibGUgc3RhdGUuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL0ZvciBleGFtcGxlLCBoZXJlIGlzIGEgZnVuY3Rpb24gdGhhdCBcclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZShcInZhbHVlXCIpXHJcblx0XHQvL1dyaXRlIHRoZSB2YWx1ZSBpbiB0aGUgc3RhdGVcclxuXHRcdC5waGF0TWFwKCB2YWx1ZSA9PiBzdGF0ZSggXyA9PiBbXCJuZXcgXCIrdmFsdWUgLCBcImluaXRpYWwgXCIrdmFsdWVdKSApXHJcblxyXG5cdFx0Ly9tYW5pcHVsYXRlIHRoZSB2YWx1ZVxyXG5cdFx0LnBoYXRNYXAoIHZhbCA9PiB2YWwudG9VcHBlckNhc2UoKS5zcGxpdChcIlwiKS5qb2luKFwiLVwiKSApXHJcblx0XHRcclxuXHRcdC8vV2UgY2FuIGFjY2VzcyB0aGUgc3RhdGUgYXQgYW55IHRpbWUuXHJcblx0XHQucGhhdE1hcCggdmFsID0+IHN0YXRlKHN0ID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKCB2YWwsIFwiTi1FLVctIC1WLUEtTC1VLUVcIilcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKCBzdCwgXCJpbml0aWFsIHZhbHVlXCIpXHJcblx0XHR9KSkucnVuKClcclxufSkvLy0tXHJcblxyXG4vKlxyXG5cclxuYHNhdmUoKSAvIGxvYWQoKWBcclxuLS0tLVxyXG5TaG9ydGhhbmRzIGZvciB0aGUgbW9zdCBjb21tb24gc3RhdGUgb3BlcmF0aW9uczogXHJcbi0gYHNhdmVgIGNvcGllcyB0aGUgY3VycmVudGx5IGVuY2Fwc3VsYXRlZCB2YWx1ZSBpbnRvIHRoZSBzdGF0ZVxyXG4tIGBsb2FkYCBqdXN0IHJldHVybnMgdGhlIGN1cnJlbnQgc3RhdGVcclxuKioqXHJcbiovXHJcblxyXG5cclxuUVVuaXQudGVzdChcInNhdmUvbG9hZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZSg1KVxyXG5cdC5waGF0TWFwKCAodmFsKSA9PiB2YWwrMSApIC8vNlxyXG5cdC5zYXZlS2V5KFwic3QxXCIpXHJcblx0XHJcblx0LnBoYXRNYXAoICh2YWwpID0+IHZhbCoyICkvLzEyXHJcblx0LnNhdmVLZXkoXCJzdDJcIilcclxuXHRcclxuXHQubG9hZCgpXHJcblx0Lm1hcCggKHN0YXRlKSA9PiB7XHJcblx0XHRhc3NlcnQuZXF1YWwoc3RhdGUuc3QxLCA2KVxyXG5cdFx0YXNzZXJ0LmVxdWFsKHN0YXRlLnN0MiwgMTIpXHJcblx0fSkucnVuKClcclxufSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuXHJcbiIsIlxyXG4vKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IHN0cmVhbSBcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBzdHJlYW1gIHR5cGUsIGFsc28ga25vd24gYXMgYSBsYXp5IGxpc3QgaXMgYSBjb250YWluZXIgZm9yIGEgbGlzdCBvZiB2YWx1ZXMgd2hpY2ggY29tZSBhc3luY2hyb25vdXNseS5cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcInN0cmVhbVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBzdHJlYW1gIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdHZhciBzdHJlYW0gPSByZXF1aXJlKFwiLi4vbGlicmFyeS9zdHJlYW1cIilcclxuXHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVG8gY3JlYXRlIGEgYHN0cmVhbWAgcGFzcyBhIGZ1bmN0aW9uIHdoaWNoIGFjY2VwdHMgYSBjYWxsYmFjayBhbmQgY2FsbHMgdGhhdCBjYWxsYmFjayB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWU6XHJcblxyXG5cdGNvbnN0IGNsaWNrU3RyZWFtID0gc3RyZWFtKCAocHVzaCkgPT4geyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHB1c2gpfSlcclxuXHR3aW5kb3cuY2xpY2tTdHJlYW0gPSBjbGlja1N0cmVhbVxyXG5cclxuLy8gTGlrZSBwcm9taXNlcywgc3RyZWFtcyBhcmUgYWxzbyBjcmVhdGVkIHdpdGggYSBoZWxwZXJcclxuXHJcblx0Y29uc3QgY291bnRUbyA9IChyYW5nZSkgPT4gc3RyZWFtKCAocHVzaCkgPT4ge1xyXG5cdFx0Zm9yIChsZXQgaSA9IDE7IGk8PSByYW5nZTsgaSsrKXtcclxuXHRcdFx0cHVzaChpKVxyXG5cdFx0fVxyXG5cdH0pXHJcbi8qXHJcbmBydW4oKWBcclxuLS0tLVxyXG5FeGVjdXRlcyB0aGUgc3RyZWFtIGFuZCBmZXRjaGVzIHRoZSBkYXRhLlxyXG5cclxuKioqXHJcblxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcblJldHVybnMgYSBuZXcgc3RyZWFtLCB3aGljaCBhcHBsaWVzIGBmdW5rYCB0byB0aGUgZGF0YSB3aGVuIHlvdSBydW4gaXQuXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Y29uc3Qgc3RvcCA9IGFzc2VydC5hc3luYygpLy8tLVxyXG5cdHZhciBwdXNoVG9TdHJlYW0gPSB1bmRlZmluZWRcclxuXHRjb25zdCBteVN0cmVhbSA9IHN0cmVhbShwdXNoID0+eyBwdXNoVG9TdHJlYW0gPSBwdXNofSlcclxuXHRcdC5tYXAodmFsID0+IHZhbCoyKVxyXG5cdFx0Lm1hcCh2YWwgPT4gYXNzZXJ0LmVxdWFsKHZhbCwgMTApKVxyXG5cdFx0LnJ1bigpXHJcblx0XHJcblx0cHVzaFRvU3RyZWFtKDUpXHJcblx0c3RvcCgpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcbkEgbW9yZSBwb3dlcmZ1bCB2ZXJzaW9uIG9mIGBtYXBgIHdoaWNoIGNhbiBhbGxvd3MgeW91IHRvIGNoYWluIHNldmVyYWwgc3RlcHMgb2YgdGhlIGFzeWNocm9ub3VzIGNvbXB1dGF0aW9ucyB0b2dldGhlci5cclxuS25vd24gYXMgYHRoZW5gIGZvciB0cmFkaXRpb25hbCBzdHJlYW0gbGlicmFyaWVzLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG4vL1FVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdC8vY29uc3QgZG9uZSA9IGFzc2VydC5hc3luYygpLy8tLVx0XHJcbi8vfSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcbiJdfQ==
