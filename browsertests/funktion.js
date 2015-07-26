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
	});
}; //--
QUnit.module("Maybe"); //--
test(maybe); //-- run the tests using a maybe
QUnit.module("MaybeT"); //-- run the tests using a monad transformer
test(function (val) {
	return maybeT(identity(val));
}); //--

/*
Combining with Other Monads
----
In addition to creating a `maybe` from a plain value, you can also create one from an existing monad, using the `maybeT` constructor:

The resulting monad will gain all the characteristics of a `maybe` without losing the characteristics of the underlying monad.

***
*/

QUnit.module("maybeT Combinations"); //--

QUnit.test("list", function (assert) {
	//--

	//Combining a maybe with a list, for example, creates a list where each of the values are `maybe`s

	var maybeList = maybeT(list({ first: { second: "value" } }, { first: { second: "other value" } }, { first: "" }));

	//This means you can use maybe to safely transform the list items:

	maybeList.phatMap(function (val) {
		return maybeT(val.first);
	}).phatMap(function (val) {
		return maybeT(val.second);
	})

	//This allows you to use a function that returns a maybe

	//You can use the maybe

	.getProp("a");
	assert.deepEqual(bc._innerMonad, ["b", "c"]);
	var abc = bc.lift("reverse").lift("concat", ["a"]);
	assert.deepEqual(abc._innerMonad, ["c", "b", "a"]);
}); //this is not executed
//this blows up
//While in the second case we cannot access the underlying value directly, and therefore cannot execute an action on it, if it is not there.

//won't be executed

//--

//--
/*
QUnit.test("state", function(assert){//--
    maybeT(state(1))
    .map()
})

*/

/*
under the hood
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2YuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2hlbHBlcnMuanMiLCJkOi9wci9mdW5rdGlvbi9saWJyYXJ5L2lkZW50aXR5LmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9saXN0LmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9tYXliZS5qcyIsImQ6L3ByL2Z1bmt0aW9uL2xpYnJhcnkvbWF5YmVULmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9wcm9taXNlLmpzIiwiZDovcHIvZnVua3Rpb24vbGlicmFyeS9zdGF0ZS5qcyIsImQ6L3ByL2Z1bmt0aW9uL2xpYnJhcnkvc3RyZWFtLmpzIiwiZDovcHIvZnVua3Rpb24vdGVzdHMvZl90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL2xpc3RfdGVzdHMuanMiLCJkOi9wci9mdW5rdGlvbi90ZXN0cy9tYXliZVRfdGVzdHMuanMiLCJkOi9wci9mdW5rdGlvbi90ZXN0cy9tYXliZV90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL3Byb21pc2VfdGVzdHMuanMiLCJkOi9wci9mdW5rdGlvbi90ZXN0cy9zdGF0ZV90ZXN0cy5qcyIsImQ6L3ByL2Z1bmt0aW9uL3Rlc3RzL3N0cmVhbV90ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQSxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBR2xDLElBQU0sRUFBRSxHQUFHLFNBQUwsRUFBRSxDQUFHLENBQUM7UUFBSSxDQUFDO0NBQUEsQ0FBQTs7QUFFaEIsSUFBSSxPQUFPLEdBQUc7Ozs7OztBQU1iLEdBQUUsRUFBRSxZQUFBLEdBQUc7U0FBSSxHQUFHLEtBQUss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RyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQTtBQUNuQixRQUFNLENBQUMsS0FBSyxDQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUUsQ0FBQTtBQUN4QixRQUFNLENBQUMsS0FBSyxDQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUUsQ0FBQTtDQUU1QixDQUFDLENBQUE7Ozs7OztBQU1GLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVMsTUFBTSxFQUFDOzs7OztBQUlqQyxNQUFJLEtBQUssR0FBRyxDQUFDLENBQUUsVUFBQSxHQUFHO1dBQUksR0FBRyxHQUFDLENBQUM7R0FBQSxDQUFFLENBQUE7Ozs7QUFLN0IsTUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTs7QUFFNUIsUUFBTSxDQUFDLEtBQUssQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7O0FBRTNCLE1BQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7O0FBRTVCLFFBQU0sQ0FBQyxLQUFLLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBO0NBRTNCLENBQUMsQ0FBQTs7Ozs7Ozs7Ozs7QUFXRixLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFTLE1BQU0sRUFBQzs7Ozs7QUFJckMsTUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFFLFVBQUMsSUFBSSxFQUFFLElBQUk7V0FBSyxJQUFJLEdBQUcsSUFBSTtHQUFBLENBQUMsQ0FBQTs7QUFFNUMsTUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FDOUIsT0FBTyxDQUFDLFVBQUMsR0FBRztXQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRSxDQUFDLENBQUMscUJBQXFCLENBQUMsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUM7R0FBQSxDQUFFLENBQUE7O0FBRXBGLFFBQU0sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUE7QUFDakQsUUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQTtBQUNqRCxRQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEyQnJELE1BQUksUUFBUSxHQUFHLENBQUMsQ0FBRSxVQUFBLEdBQUc7V0FBSSxHQUFHLEdBQUcsQ0FBQztHQUFBLENBQUUsQ0FDaEMsT0FBTyxDQUFFLFVBQUEsQ0FBQztXQUFJLENBQUMsQ0FBRSxVQUFBLEdBQUc7YUFBSSxHQUFHLEdBQUcsRUFBRTtLQUFBLENBQUUsQ0FDakMsT0FBTyxDQUFFLFVBQUEsQ0FBQzthQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUFBLENBQUU7R0FBQSxDQUM1QixDQUFBOztBQUVGLFFBQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0NBRTdCLENBQUMsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDcElILEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7Ozs7QUFNbEIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUE7QUFDckMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFBOzs7OztBQUsvQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7O0FBRTNCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBOzs7Ozs7Ozs7QUFTM0IsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBUyxNQUFNLEVBQUM7O0FBQ2pDLEtBQUksTUFBTSxHQUFHLElBQUksQ0FBRSxFQUFDLElBQUksRUFBQyxNQUFNLEVBQUUsR0FBRyxFQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUMsUUFBUSxFQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUMsU0FBUyxFQUFFLEdBQUcsRUFBQyxFQUFFLEVBQUUsVUFBVSxFQUFDLFNBQVMsRUFBQyxDQUFDLENBQUE7QUFDOUcsS0FBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFDLE1BQU07U0FBSyxNQUFNLENBQUMsSUFBSTtFQUFBLENBQUUsQ0FBQTtBQUNoRCxPQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFBO0NBRTVDLENBQUMsQ0FBQTs7Ozs7Ozs7OztBQVVGLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVMsTUFBTSxFQUFDOzs7QUFFckMsS0FBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQ3RCLEVBQUMsVUFBVSxFQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQ3pELEVBQUMsVUFBVSxFQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUUsQ0FDbEQsQ0FBQyxDQUFBOztBQUVGLEtBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBQyxVQUFVO1NBQUssVUFBVSxDQUFDLE1BQU07RUFBQSxDQUFDLENBQUE7QUFDbkUsT0FBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUMsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQTtDQUVyRSxDQUFDLENBQUE7Ozs7Ozs7Ozs7QUMxREYsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUE7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LENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG5cclxuY29uc3QgaWQgPSBhID0+IGEgLy8tLVxyXG5cclxuXHR2YXIgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBpdC5cclxuLy90aGlzIGlzIHZlcnkgdXNlZnVsIGlmIHlvdSBoYXZlIGEgQVBJIHdoaWNoIGV4cGVjdHMgYSBmdW5jdGlvbiwgYnV0IHlvdSB3YW50IHRvIGZlZWQgaXQgd2l0aCBhIHZhbHVlIChzZWUgdGhlIGBmbGF0bWFwYCBleGFtcGxlKS4gXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiB2YWwgPT09IHVuZGVmaW5lZCA/IGlkIDogZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpID0+IChiIC0+IGMpID0+IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkgPT4gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fS8vLS1cclxuXHJcbi8vQWRkIGFsaWFzZXMgdG8gbWFwIC4gZmxhdCBhcyBmbGF0TWFwIGFuZCBtYXAgLiB0cnlGbGF0IGFzIHBoYXRNYXBcclxuICAgICAgICBtZXRob2RzLmZsYXRNYXAgPSBoZWxwZXJzLmZsYXRNYXBcclxuICAgICAgICBtZXRob2RzLnBoYXRNYXAgPSBoZWxwZXJzLnBoYXRNYXBcclxuXHJcbi8vQWRkIGEgcHJpbnQgZnVuY3Rpb24sIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgICAgICBtZXRob2RzLnByaW50ID0gaGVscGVycy5wcmludFxyXG5cclxuLy9UaGlzIGlzIHRoZSBmdW5jdGlvbiBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgYSBmdW5jdGlvbiBhbmQgYWRkcyBhbiBhdWdtZW50ZWQgZnVuY3Rpb24gb2JqZWN0LCB3aXRob3V0IGV4dGVuZGluZyB0aGUgcHJvdG90eXBlXHJcblxyXG5cdHZhciBmID0gKGZ1bmsgPSBpZCwgbGVuZ3RoID0gZnVuay5sZW5ndGgsIGluaXRpYWxfYXJndW1lbnRzID0gW10pID0+IHtcclxuXHJcblx0XHQvL1dlIGV4cGVjdCBhIGZ1bmN0aW9uLiBJZiB3ZSBhcmUgZ2l2ZW4gYW5vdGhlciB2YWx1ZSwgbGlmdCBpdCB0byBhIGZ1bmN0aW9uXHJcblx0XHRpZih0eXBlb2YgZnVuayAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdHJldHVybiBmKCkub2YoZnVuaylcclxuXHRcdFxyXG5cdFx0Ly9JZiB0aGUgZnVuY3Rpb24gdGFrZXMganVzdCBvbmUgYXJndW1lbnQsIGp1c3QgZXh0ZW5kIGl0IHdpdGggbWV0aG9kcyBhbmQgcmV0dXJuIGl0LlxyXG5cdFx0fWVsc2UgaWYgKCBsZW5ndGggPCAyICl7XHJcblx0XHRcdHJldHVybiBleHRlbmQoZnVuaywgbWV0aG9kcylcclxuXHJcblx0XHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBleHRlbmRlZF9mdW5rID0gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciBhbGxfYXJndW1lbnRzICA9IChpbml0aWFsX2FyZ3VtZW50cykuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgbGVuZ3RoLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0XHR9LCBtZXRob2RzKVxyXG5cdFx0XHRcclxuXHRcdFx0ZXh0ZW5kZWRfZnVuay5fbGVuZ3RoID0gbGVuZ3RoIC0gaW5pdGlhbF9hcmd1bWVudHMubGVuZ3RoXHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX29yaWdpbmFsID0gZnVua1xyXG5cclxuXHRcdFx0cmV0dXJuIGV4dGVuZGVkX2Z1bmtcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGZ1bmN0aW9uIG9iamVjdCBpcyBleHRlbmRlZFxyXG5cclxuXHRmdW5jdGlvbiBleHRlbmQob2JqLCBtZXRob2RzKXtcclxuXHRcdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG5cdH1cclxuXHJcblx0XHJcblx0Zi5vZiA9IHZhbCA9PiBmKCAoKSA9PiB2YWwgKSxcclxuXHJcbi8vVGhlIGxpYnJhcnkgYWxzbyBmZWF0dXJlcyBhIHN0YW5kYXJkIGNvbXBvc2UgZnVuY3Rpb24gd2hpY2ggYWxsb3dzIHlvdSB0byBtYXAgbm9ybWFsIGZ1bmN0aW9ucyB3aXRoIG9uZSBhbm90aGVyXHJcblxyXG5cdGYuY29tcG9zZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9Db252ZXJ0IGZ1bmN0aW9ucyB0byBhbiBhcnJheSBhbmQgZmxpcCB0aGVtIChmb3IgcmlnaHQtdG8tbGVmdCBleGVjdXRpb24pXHJcblx0XHR2YXIgZnVuY3Rpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5yZXZlcnNlKClcclxuXHRcdC8vQ2hlY2sgaWYgaW5wdXQgaXMgT0s6XHJcblx0XHRmdW5jdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmdW5rKXtpZih0eXBlb2YgZnVuayAhPT0gXCJmdW5jdGlvblwiKXt0aHJvdyBuZXcgVHlwZUVycm9yKGZ1bmsrXCIgaXMgbm90IGEgZnVuY3Rpb25cIiApfX0pXHJcblx0XHQvL1JldHVybiB0aGUgZnVuY3Rpb24gd2hpY2ggY29tcG9zZXMgdGhlbVxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vVGFrZSB0aGUgaW5pdGlhbCBpbnB1dFxyXG5cdFx0XHR2YXIgaW5wdXQgPSBhcmd1bWVudHNcclxuXHRcdFx0dmFyIGNvbnRleHRcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9ucy5yZWR1Y2UoZnVuY3Rpb24ocmV0dXJuX3Jlc3VsdCwgZnVuaywgaSl7IFxyXG5cdFx0XHRcdC8vSWYgdGhpcyBpcyB0aGUgZmlyc3QgaXRlcmF0aW9uLCBhcHBseSB0aGUgYXJndW1lbnRzIHRoYXQgdGhlIHVzZXIgcHJvdmlkZWRcclxuXHRcdFx0XHQvL2Vsc2UgdXNlIHRoZSByZXR1cm4gcmVzdWx0IGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uXHJcblx0XHRcdFx0cmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsocmV0dXJuX3Jlc3VsdCkpXHJcblx0XHRcdFx0Ly9yZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuay5hcHBseShjb250ZXh0LCBbcmV0dXJuX3Jlc3VsdF0pKVxyXG5cdFx0XHR9LCB1bmRlZmluZWQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblx0bW9kdWxlLmV4cG9ydHMgPSBmLy8tLVxyXG4iLCJleHBvcnRzLnBoYXRNYXAgPSBmdW5jdGlvbiBwaGF0TWFwKGZ1bmspe1xyXG4gICAgICAgIGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpXHJcbn1cclxuXHJcbmV4cG9ydHMuZmxhdE1hcCA9IGZ1bmN0aW9uIGZsYXRNYXAoZnVuaykge1xyXG4gICAgICAgIGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpXHJcbn1cclxuZXhwb3J0cy5wcmludCA9IGZ1bmN0aW9uIHByaW50ICgpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMudG9TdHJpbmcoKSlcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG59XHJcblxyXG4iLCJ2YXIgaWRlbnRpdHkgPSBmdW5jdGlvbih2YWwpe1xyXG4gICAgdmFyIGlkID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG4gICAgaWQuX3ZhbHVlID0gdmFsXHJcbiAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZShpZClcclxufVxyXG5cclxuXHJcbnZhciBtZXRob2RzID0ge1xyXG5cclxuICAgIGZ1bmt0aW9uVHlwZTogXCJpZGVudGl0eVwiLFxyXG5cclxuICAgIGNvbnN0cnVjdG9yIDogaWRlbnRpdHksXHJcbiAgICBcclxuICAgIG9mIDogZnVuY3Rpb24gb2YgKHZhbCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IodmFsKVxyXG4gICAgfSxcclxuXHJcbiAgICBtYXAgOiBmdW5jdGlvbiBtYXAgKGZ1bmspe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKGZ1bmsodGhpcy5fdmFsdWUpKVxyXG4gICAgfSxcclxuXHJcbiAgICBmbGF0IDogZnVuY3Rpb24gZmxhdCAoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvcih0aGlzLl92YWx1ZS5fdmFsdWUpXHJcbiAgICB9LFxyXG5cclxuICAgIHRyeUZsYXQgOiBmdW5jdGlvbiB0cnlGbGF0ICgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKCh0aGlzLl92YWx1ZS5mdW5rdGlvblR5cGUgPT09IFwiaWRlbnRpdHlcIikgPyB0aGlzLl92YWx1ZS5fdmFsdWUgOiB0aGlzLl92YWx1ZSApXHJcbiAgICB9LFxyXG5cclxuICAgIHBoYXRNYXAgOiBmdW5jdGlvbiBwaGF0TWFwKGZ1bmspe1xyXG4gICAgICAgICAgICBpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcChmdW5rKS50cnlGbGF0KClcclxuICAgIH0sXHJcblxyXG4gICAgZmxhdE1hcCA6IGZ1bmN0aW9uIGZsYXRNYXAoZnVuaykge1xyXG4gICAgICAgICAgICBpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcChmdW5rKS5mbGF0KClcclxuICAgIH0sXHJcbiAgICBwcmludCA6IGZ1bmN0aW9uIHByaW50ICgpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnRvU3RyaW5nKCkpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbn1cclxuXHJcbmlkZW50aXR5LnByb3RvdHlwZSA9IG1ldGhvZHMvLy0tXHJcbm1vZHVsZS5leHBvcnRzID0gaWRlbnRpdHkvLy0tXHJcbiIsIlxyXG5cclxudmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxudmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy90aGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIHB1dHMgaXQgaW4gYSBsaXN0LlxyXG5cclxuXHRcdC8vYS5vZihiKSAtPiBiIGFcclxuXHRcdG9mOiB2YWwgPT4gbGlzdCh2YWwpLFxyXG5cclxuLy9gbWFwYCBhcHBsaWVzIGEgZnVuY3Rpb24gdG8gZWFjaCBlbGVtZW50IG9mIHRoZSBsaXN0LCBhcyB0aGUgb25lIGZyb20gdGhlIEFycmF5IHByb3RvdHlwZVxyXG5cdFx0XHJcbi8vYGZsYXRgIHRha2VzIGEgbGlzdCBvZiBsaXN0cyBhbmQgZmxhdHRlbnMgdGhlbSB3aXRoIG9uZSBsZXZlbCBcclxuXHJcblx0XHQvLyhiIC0+IChiIC0+IGMpKS5qb2luKCkgPSBhIC0+IGJcclxuXHRcdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoIHRoaXMucmVkdWNlKChsaXN0LCBlbGVtZW50KSA9PiBbLi4ubGlzdCwgLi4uZWxlbWVudF0sIFtdKSApXHJcblx0XHR9LFxyXG5cdFx0XHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGBcclxuLy9hbmQgd2l0aCBpdCwgeW91ciBmdW5rIGNhbiByZXR1cm4gYm90aCBhIGxpc3Qgb2Ygb2JqZWN0cyBhbmQgYSBzaW5nbGUgb2JqZWN0XHJcblxyXG5cdFx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gbGlzdCggdGhpcy5yZWR1Y2UoKGxpc3QsIGVsZW1lbnQpID0+IFxyXG5cdFx0XHRcdGVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBlbGVtZW50LmNvbnN0cnVjdG9yID09PSBBcnJheT8gWy4uLmxpc3QsIC4uLmVsZW1lbnRdIDogWy4uLmxpc3QsIGVsZW1lbnRdICwgW10pXHJcblx0XHRcdClcclxuXHRcdH0sXHJcblx0XHRmdW5rdGlvblR5cGU6XCJsaXN0XCIvLy0tXHJcblxyXG5cdH0vLy0tXHJcblxyXG4vL0FkZCBhbGlhc2VzIHRvIG1hcCAuIGZsYXQgYXMgZmxhdE1hcCBhbmQgbWFwIC4gdHJ5RmxhdCBhcyBwaGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5mbGF0TWFwID0gaGVscGVycy5mbGF0TWFwXHJcbiAgICAgICAgbWV0aG9kcy5waGF0TWFwID0gaGVscGVycy5waGF0TWFwXHJcblxyXG4vL0FkZCBhIHByaW50IGZ1bmN0aW9uLCB1c2VkIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgICAgbWV0aG9kcy5wcmludCA9IGhlbHBlcnMucHJpbnRcclxuXHJcblxyXG4vL0FkZCBzdXBwb3J0IGZvciBhcnJheSBleHRyYXMsIHNvIHRoYXQgdGhleSByZXR1cm4gYSBsaXN0IGluc3RlYWQgb2Ygbm9ybWFsIEFycmF5XHJcblxyXG52YXIgYXJyYXlNZXRob2RzID0ge31cclxuXHJcbi8vU29tZSBmdW5jdGlvbnMgYXJlIGRpcmVjdGx5IGxpZnRlZCBmcm9tIHRoZSBBcnJheSBwcm90b3R5cGVcclxuXHJcbnZhciBpbW11dGFibGVGdW5jdGlvbnMgPSBbJ21hcCcsICdjb25jYXQnXVxyXG5cclxuaW1tdXRhYmxlRnVuY3Rpb25zLmZvckVhY2goKGZ1bmspID0+IHsgXHJcblx0YXJyYXlNZXRob2RzW2Z1bmtdID0gZnVuY3Rpb24oLi4uYXJncyl7XHJcblx0XHRcdHJldHVybiBsaXN0KEFycmF5LnByb3RvdHlwZVtmdW5rXS5hcHBseSh0aGlzLCBhcmdzKSlcclxuXHR9XHJcbn0pXHJcblxyXG4vL1RoZSB0eXBlIGFsc28gd3JhcHMgc29tZSBBcnJheSBmdW5jdGlvbnMgaW4gYSB3YXkgdGhhdCBtYWtlcyB0aGVtIGltbXV0YWJsZVxyXG5cclxudmFyIG11dGFibGVGdW5jdGlvbnMgPSBbJ3NwbGljZScsICdyZXZlcnNlJywgJ3NvcnQnXVxyXG5cclxubXV0YWJsZUZ1bmN0aW9ucy5mb3JFYWNoKChmdW5rKSA9PiB7IFxyXG5cdGFycmF5TWV0aG9kc1tmdW5rXSA9IGZ1bmN0aW9uKC4uLmFyZ3Mpe1xyXG5cdFx0XHR2YXIgbmV3QXJyYXkgPSB0aGlzLnNsaWNlKDApXHJcblx0XHRcdEFycmF5LnByb3RvdHlwZVtmdW5rXS5hcHBseShuZXdBcnJheSwgYXJncylcclxuXHRcdFx0cmV0dXJuIG5ld0FycmF5XHJcblx0fVxyXG59KVxyXG5cclxuZXh0ZW5kKG1ldGhvZHMsIGFycmF5TWV0aG9kcylcclxuXHJcbm1ldGhvZHMuZXh0cmFzID0gW11cclxuXHJcbi8vVGhpcyBpcyB0aGUgbGlzdCBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgbm9ybWFsIGFycmF5IGFuZCBhdWdtZW50cyBpdCB3aXRoIHRoZSBhYm92ZSBtZXRob2RzXHJcblx0XHJcblx0dmFyIGxpc3QgPSAoLi4uYXJncykgPT4ge1xyXG5cdFx0aWYoYXJncy5sZW5ndGggPT09IDEgJiYgYXJnc1swXS5mdW5rdGlvblR5cGUgPT09IFwibGlzdFwiKXtcclxuXHRcdFx0cmV0dXJuIGFyZ3NbMF1cclxuXHRcdC8vQWNjZXB0IGFuIGFycmF5XHJcblx0XHR9ZWxzZSBpZihhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdLmNvbnN0cnVjdG9yID09PSBBcnJheSApe1xyXG5cdFx0XHRyZXR1cm4gIE9iamVjdC5mcmVlemUoZXh0ZW5kKGFyZ3NbMF0sIG1ldGhvZHMpKVxyXG5cdFx0Ly9BY2NlcHQgc2V2ZXJhbCBhcmd1bWVudHNcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShleHRlbmQoYXJncywgbWV0aG9kcykpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9IZXJlIGlzIHRoZSBmdW5jdGlvbiB3aXRoIHdoaWNoIHRoZSBsaXN0IG9iamVjdCBpcyBleHRlbmRlZFxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3QvLy0tXHJcbiIsIiAgICAgICAgdmFyIGlkID0gcmVxdWlyZShcIi4vaWRlbnRpdHlcIikvLy0tXHJcbiAgICAgICAgdmFyIG1ldGhvZHMgPSBPYmplY3QuY3JlYXRlKGlkLnByb3RvdHlwZSkvLy0tXHJcblxyXG5cdHZhciBtYXliZSA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcbiAgICAgICAgICAgICAgICBvYmouX3ZhbHVlID0gdmFsdWVcclxuICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKG9iailcclxuXHR9XHJcblxyXG4vL2BtYXBgIHRha2VzIHRoZSBmdW5jdGlvbiBhbmQgYXBwbGllcyBpdCB0byB0aGUgdmFsdWUgaW4gdGhlIG1heWJlLCBpZiB0aGVyZSBpcyBvbmUuXHJcbiAgICAgICAgbWV0aG9kcy5wcm90b3R5cGUgPSBtZXRob2RzLy8tLVxyXG4gICAgICAgIG1ldGhvZHMuY29uc3RydWN0b3IgPSBtYXliZS8vLS1cclxuXHJcblx0bWV0aG9kcy5mdW5rdGlvblR5cGUgPSBcIm1heWJlXCIvLy0tXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWV0aG9kcy5tYXAgPSBmdW5jdGlvbiBtYXAgKGZ1bmspe1xyXG5cdFx0aWYodGhpcy5fdmFsdWUgIT09IHVuZGVmaW5lZCl7XHJcblx0XHRcdHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKGZ1bmsodGhpcy5fdmFsdWUpKVxyXG5cdFx0fWVsc2V7XHRcclxuXHRcdFx0cmV0dXJuIHRoaXMgXHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdG1ldGhvZHMuZmxhdCA9IGZ1bmN0aW9uIGZsYXQgKCl7XHJcblx0XHRpZih0aGlzLl92YWx1ZSAhPT0gdW5kZWZpbmVkKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHRtZXRob2RzLnRyeUZsYXQgPSBmdW5jdGlvbiB0cnlGbGF0ICgpe1xyXG5cdFx0aWYodGhpcy5fdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLl92YWx1ZS5mdW5rdGlvblR5cGUgPT09IFwibWF5YmVcIil7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG5cclxuLy9GaW5hbGx5LCBtYXliZSBkZWZpbmVzIG9uZSBoZWxwZXIgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIHRoZSBwcm9wZXJ0eSBvZiBhbiBvYmplY3QsIHdyYXBwZWQgaW4gYSBtYXliZTpcclxuXHJcbiAgICAgICAgbWV0aG9kcy5nZXRQcm9wID0gZnVuY3Rpb24gZ2V0UHJvcCAocHJvcCl7XHJcblx0XHRyZXR1cm4gdGhpcy5waGF0TWFwKCAodmFsKSA9PiB0aGlzLm9mKHZhbFtwcm9wXSkgKVxyXG5cdH1cclxuXHJcblxyXG5cdFxyXG5cclxuICAgIG1heWJlLnByb3RvdHlwZSA9IG1ldGhvZHMvLy0tXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1heWJlLy8tLVxyXG4iLCIgICAgICAgIHZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuICAgICAgICB2YXIgbWF5YmUgPSByZXF1aXJlKFwiLi9tYXliZVwiKS8vLS1cclxuICAgICAgICB2YXIgbWV0aG9kcyA9IE9iamVjdC5jcmVhdGUobWF5YmUucHJvdG90eXBlKVxyXG5cclxuXHJcblx0dmFyIG1heWJlVCA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcbiAgICAgICAgICAgICAgICBvYmouX2lubmVyTW9uYWQgPSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5mcmVlemUob2JqKVxyXG5cdH1cclxuICAgICAgICBcclxuXHRtZXRob2RzLmZ1bmt0aW9uVHlwZSA9IFwibWF5YmVUXCIvLy0tXHJcbiAgICAgICAgbWV0aG9kcy5jb25zdHJ1Y3RvciA9IG1heWJlVFxyXG5cclxuXHQvL20gbWF5YmUgYSAtPiAoIGEgLT4gbWF5YmUgYiApIC0+IG0gbWF5YmUgYlxyXG5cdG1ldGhvZHMubWFwID0gZnVuY3Rpb24gbWFwIChmdW5rKXtcclxuICAgICAgICAgICAgcmV0dXJuIG1heWJlVCggdGhpcy5faW5uZXJNb25hZC5tYXAoKHZhbCkgPT4gXHJcbiAgICAgICAgICAgICAgIHZhbCA9PT0gdW5kZWZpbmVkID8gdmFsIDogZnVuayh2YWwpXHJcbiAgICAgICAgICAgICkgKVxyXG5cdH1cclxuXHJcbi8vYGZsYXRgIHRha2VzIGEgbWF5YmUgdGhhdCBjb250YWlucyBhbm90aGVyIG1heWJlIGFuZCBmbGF0dGVucyBpdC5cclxuLy9JbiB0aGlzIGNhc2UgdGhpcyBtZWFucyBqdXN0IHJldHVybmluZyB0aGUgaW5uZXIgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRtZXRob2RzLmZsYXQgPSBmdW5jdGlvbiBmbGF0ICgpe1xyXG4gICAgICAgICAgICByZXR1cm4gbWF5YmVUKHRoaXMuX2lubmVyTW9uYWQubWFwKCAoaW5uZXJNYXliZVQpID0+XHJcbiAgICAgICAgICAgICAgIGlubmVyTWF5YmVUID09PSB1bmRlZmluZWQgPyB0aGlzLl9pbm5lck1vbmFkLm9mKHVuZGVmaW5lZCkgOiBpbm5lck1heWJlVC5faW5uZXJNb25hZCBcclxuICAgICAgICAgICAgKS5mbGF0KCkpXHJcblx0fVxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0bWV0aG9kcy50cnlGbGF0PWZ1bmN0aW9uIHRyeUZsYXQgKCl7XHJcbiAgICAgICAgICAgIHJldHVybiBtYXliZVQodGhpcy5faW5uZXJNb25hZC5tYXAoIChpbm5lck1heWJlVCkgPT57XHJcblx0XHRpZihpbm5lck1heWJlVCA9PT0gdW5kZWZpbmVkKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX2lubmVyTW9uYWQub2YodW5kZWZpbmVkKVxyXG5cdFx0fWVsc2UgaWYoaW5uZXJNYXliZVQuZnVua3Rpb25UeXBlID09PSBcIm1heWJlVFwiKXtcclxuXHRcdFx0cmV0dXJuIGlubmVyTWF5YmVULl9pbm5lck1vbmFkXHJcblx0XHR9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lubmVyTWF5YmVUXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pLnRyeUZsYXQoKSlcclxuXHR9XHJcblxyXG4gICAgICAgIG1ldGhvZHMubGlmdCA9IGZ1bmN0aW9uKGZ1bmssIC4uLmFyZ3Mpe1xyXG4gICAgICAgICAgICBpZih0eXBlb2YgZnVuayA9PT0gJ2Z1bmN0aW9uJyl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF5YmVUKGZ1bmsodGhpcy5faW5uZXJNb25hZCkpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmICh0eXBlb2YgZnVuayA9PT0gJ3N0cmluZycpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1heWJlVCh0aGlzLl9pbm5lck1vbmFkW2Z1bmtdKC4uLmFyZ3MpKVxyXG4gICAgICAgICAgICB9ICAgICAgICBcclxuICAgICAgICB9XHRcclxuXHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBtYXliZVQvLy0tXHJcbiIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxudmFyIG1ldGhvZHMgPSB7Ly8tLVxyXG5cclxuLy9UaGUgYG9mYCBtZXRob2QgdGFrZXMgYSB2YWx1ZSBhbmQgd3JhcHMgaXQgaW4gYSBwcm9taXNlLCBieSBpbW1lZGlhdGVseSBjYWxsaW5nIHRoZSByZXNvbHZlciBmdW5jdGlvbiB3aXRoIGl0LlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24odmFsKXtcclxuXHRcdHJldHVybiBwcm9taXNlKCAocmVzb2x2ZSkgPT4gcmVzb2x2ZSh2YWwpIClcclxuXHR9LFxyXG5cclxuLy9UaGUgYG1hcGAgbWV0aG9kIGNyZWF0ZXMgYSBuZXcgcHJvbWlzZSwgc3VjaCB0aGF0IHdoZW4gdGhlIG9sZCBwcm9taXNlIGlzIHJlc29sdmVkLCBpdCB0YWtlcyBpdHMgcmVzdWx0LCBcclxuLy9hcHBsaWVzIGBmdW5rYCB0byBpdCBhbmQgdGhlbiByZXNvbHZlcyBpdHNlbGYgd2l0aCB0aGUgdmFsdWUuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiB0aGlzLl9yZXNvbHZlciggKHZhbCkgPT4gcmVzb2x2ZSggZnVuayh2YWwpICkgKSApXHJcblxyXG5cdH0sXHJcblxyXG4vL0luIHRoaXMgY2FzZSB0aGUgaW1wbGVtZW50YXRpb24gb2YgYGZsYXRgIGlzIHF1aXRlIHNpbXBsZS5cclxuXHJcbi8vRWZmZWN0aXZlbHkgYWxsIHdlIGhhdmUgdG8gZG8gaXMgcmV0dXJuIHRoZSBzYW1lIHZhbHVlIHdpdGggd2hpY2ggdGhlIGlubmVyIHByb21pc2UgaXMgcmVzb2x2ZWQgd2l0aC5cclxuLy9UbyBkbyB0aGlzLCB3ZSB1bndyYXAgb3VyIHByb21pc2Ugb25jZSB0byBnZXQgdGhlIGlubmVyIHByb21pc2UgdmFsdWUsIGFuZCB0aGVuIHVud3JhcCB0aGUgaW5uZXJcclxuLy9wcm9taXNlIGl0c2VsZiB0byBnZXQgaXRzIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiBcclxuXHRcdFx0dGhpcy5fcmVzb2x2ZXIoXHQoaW5uZXJfcHJvbWlzZSkgPT4gXHJcblx0XHRcdFx0aW5uZXJfcHJvbWlzZS5fcmVzb2x2ZXIoKHZhbCkgPT4gcmVzb2x2ZSh2YWwpKVxyXG5cdFx0XHQpIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgdHJ5RmxhdGAgZnVuY3Rpb24gaXMgYWxtb3N0IHRoZSBzYW1lOlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHByb21pc2UoIChyZXNvbHZlKSA9PiBcclxuXHRcdFx0dGhpcy5fcmVzb2x2ZXIoXHQoaW5uZXJfcHJvbWlzZSkgPT4geyBcclxuXHRcdFx0XHRpZihpbm5lcl9wcm9taXNlLmNvbnN0cnVjdG9yID09PSBwcm9taXNlKXtcclxuXHRcdFx0XHRcdGlubmVyX3Byb21pc2UuX3Jlc29sdmVyKCh2YWwpID0+IHJlc29sdmUodmFsKSlcclxuXHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdHJlc29sdmUoaW5uZXJfcHJvbWlzZSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pIFxyXG5cdFx0KVxyXG5cdH0sXHJcblxyXG4vL1RoZSBgcnVuYCBmdW5jdGlvbiBqdXN0IGZlZWRzIHRoZSByZXNvbHZlciB3aXRoIGEgcGxhY2Vob2xkZXIgIGZ1bmN0aW9uIHNvIG91ciBjb21wdXRhdGlvbiBjYW5cclxuLy9zdGFydCBleGVjdXRpbmcuXHJcblxyXG5cdHJ1bjpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuX3Jlc29sdmVyKGZ1bmN0aW9uKGEpe3JldHVybiBhfSlcclxuXHR9XHJcblx0XHJcbiAgICB9Ly8tLVxyXG5cclxuLy9BZGQgYWxpYXNlcyB0byBtYXAgLiBmbGF0IGFzIGZsYXRNYXAgYW5kIG1hcCAuIHRyeUZsYXQgYXMgcGhhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMuZmxhdE1hcCA9IGhlbHBlcnMuZmxhdE1hcFxyXG4gICAgICAgIG1ldGhvZHMucGhhdE1hcCA9IGhlbHBlcnMucGhhdE1hcFxyXG5cclxuLy9BZGQgYSBwcmludCBmdW5jdGlvbiwgdXNlZCBmb3IgZGVidWdnaW5nLlxyXG4gICAgICAgIG1ldGhvZHMucHJpbnQgPSBoZWxwZXJzLnByaW50XHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgcHJvbWlzZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHRjb25zdCBwcm9taXNlID0gZnVuY3Rpb24ocmVzb2x2ZSl7XHJcblx0XHRpZih0eXBlb2YgcmVzb2x2ZSAhPT0gXCJmdW5jdGlvblwiKXsgcmV0dXJuIG1ldGhvZHMub2YocmVzb2x2ZSkgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG5cclxuXHRcdG9iai5fcmVzb2x2ZXIgPSByZXNvbHZlXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBwcm9taXNlXHJcblx0XHRvYmoucHJvdG90eXBlID0gbWV0aG9kc1xyXG5cdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRyZXR1cm4gb2JqXHJcblx0fVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwcm9taXNlLy8tLVxyXG4iLCJcclxuICAgICAgICBjb25zdCBmID0gcmVxdWlyZShcIi4vZlwiKS8vLS1cclxuICAgICAgICB2YXIgaWQgPSByZXF1aXJlKFwiLi9pZGVudGl0eVwiKS8vLS1cclxuICAgICAgICB2YXIgbWV0aG9kcyA9IE9iamVjdC5jcmVhdGUoaWQucHJvdG90eXBlKS8vLS1cclxuXHJcblx0Y29uc3Qgc3RhdGUgPSBtZXRob2RzLmNvbnN0cnVjdG9yID0gZnVuY3Rpb24ocnVuKXtcclxuXHRcdGlmKHR5cGVvZiBydW4gIT09IFwiZnVuY3Rpb25cIil7IHJldHVybiBtZXRob2RzLm9mKHJ1bikgfVxyXG5cdFx0Y29uc3Qgb2JqID0gT2JqZWN0LmNyZWF0ZShtZXRob2RzKVxyXG5cdFx0b2JqLl9ydW5TdGF0ZSA9IGYocnVuLDEpXHJcblx0XHRyZXR1cm4gT2JqZWN0LmZyZWV6ZShvYmopXHJcblx0fVxyXG5cclxuLy9gb2ZgIGp1c3QgdXNlcyB0aGUgY29uc3RydWN0b3IgYW5kIGRvZXMgbm90IHRvdWNoIHRoZSBzdGF0ZS5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG1ldGhvZHMub2YgPSBmdW5jdGlvbiBvZiAoaW5wdXQpe1xyXG5cdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoKHByZXZTdGF0ZSkgPT4gW2lucHV0LCBwcmV2U3RhdGVdKVxyXG5cdH1cclxuXHJcbi8vYG1hcGAgaXMgZG9uZSBieSBhcHBseWluZyB0aGUgZnVuY3Rpb24gdG8gdGhlIHZhbHVlIGFuZCBrZWVwaW5nIHRoZSBzdGF0ZSB1bmNoYW5nZWQuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWV0aG9kcy5tYXAgPSBmdW5jdGlvbiBtYXAgKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoIHRoaXMuX3J1blN0YXRlLm1hcCgoW2lucHV0LCBwcmV2U3RhdGVdKSA9PiBbZnVuayhpbnB1dCksIHByZXZTdGF0ZV0pKVxyXG5cdH1cclxuXHRcclxuLy9gZmxhdGAgZG9lcyB0aGUgZm9sbG93aW5nOlxyXG4vLzEuIFJ1bnMgdGhlIGNvZGUgdGhhdCB3ZSBsb2FkZWQgaW4gdGhlIG1vbmFkIHNvLCBmYXIgKHVzaW5nIHRoZSBgcnVuYCBmdW5jdGlvbikuXHJcbi8vMi4gU2F2ZXMgdGhlIG5ldyBzdGF0ZSBvYmplY3QgYW5kIHRoZSB2YWx1ZSB3aGljaCBpcyBrZXB0IGJ5IHRoZSBmdW5jdGlvbnMgc28gZmFyLlxyXG4vLzMuIEFmdGVyIGRvaW5nIHRoYXQsIGl0IGFycmFuZ2VzIHRob3NlIHR3byBjb21wb25lbnRzICh0aGUgb2JqZWN0IGFuZCB0aGUgdmFsdWUpIGludG8gYSB5ZXQgYW5vdGhlclxyXG4vL3N0YXRlIG9iamVjdCwgd2hpY2ggcnVucyB0aGUgbXV0YXRvciBmdW5jdGlvbiBvZiB0aGUgZmlyc3Qgb2JqZWN0LCB3aXRoIHRoZSBzdGF0ZSB0aGF0IHdlIGhhdmUgc28sIGZhclxyXG5cclxuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRtZXRob2RzLmZsYXQgPSBmdW5jdGlvbiBmbGF0ICgpe1xyXG5cdFx0Ly9FeHRyYWN0IHN0YXRlIG11dGF0b3IgYW5kIHZhbHVlIFxyXG5cdFx0Y29uc3QgW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdID0gdGhpcy5ydW4oKVxyXG5cdFx0Ly9Db21wb3NlIHRoZSBtdXRhdG9yIGFuZCB0aGUgdmFsdWVcclxuXHRcdHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKCgpID0+IHN0YXRlT2JqLl9ydW5TdGF0ZShjdXJyZW50U3RhdGUpIClcclxuXHR9XHJcblx0bWV0aG9kcy50cnlGbGF0ID0gZnVuY3Rpb24gdHJ5RmxhdCAoKXtcclxuXHJcblx0XHQvL0V4dHJhY3QgY3VycmVudCBzdGF0ZSBcclxuXHRcdGNvbnN0IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSA9IHRoaXMucnVuKClcclxuXHRcdFxyXG5cdFx0Ly9DaGVjayBpZiBpdCBpcyByZWFsbHkgYSBzdGF0ZVxyXG5cdFx0aWYoc3RhdGVPYmouY29uc3RydWN0b3IgPT09IHN0YXRlKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IoKCkgPT4gc3RhdGVPYmouX3J1blN0YXRlKGN1cnJlbnRTdGF0ZSkgKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzLmNvbnN0cnVjdG9yKCgpID0+IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL1dlIGhhdmUgdGhlIGBydW5gIGZ1bmN0aW9uIHdoaWNoIGNvbXB1dGVzIHRoZSBzdGF0ZTpcclxuXHJcblx0bWV0aG9kcy5ydW4gPSBmdW5jdGlvbiBydW4gKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcnVuU3RhdGUoKVxyXG5cdH1cclxuLy9BbmQgdGhlIGBzYXZlYCBhbmQgYGxvYWRgIGZ1bmN0aW9ucyBhcmUgZXhhY3RseSB3aGF0IG9uZSB3b3VsZCBleHBlY3RcclxuXHJcblx0bWV0aG9kcy5sb2FkID0gZnVuY3Rpb24gbG9hZCAoKXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gdGhpcy5jb25zdHJ1Y3RvciggKHN0YXRlKSA9PiBbc3RhdGUsIHN0YXRlXSApIClcclxuXHR9XHJcblx0bWV0aG9kcy5zYXZlID0gZnVuY3Rpb24gc2F2ZSAoKXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gdGhpcy5jb25zdHJ1Y3RvciggKHN0YXRlKSA9PiBbdmFsdWUsIHZhbHVlXSApIClcclxuXHR9XHJcblx0bWV0aG9kcy5sb2FkS2V5ID0gZnVuY3Rpb24gbG9hZEtleSAoa2V5KXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gdGhpcy5jb25zdHJ1Y3RvciggKHN0YXRlKSA9PiBbc3RhdGVba2V5XSwgc3RhdGVdICkgKVxyXG5cdH1cclxuXHRtZXRob2RzLnNhdmVLZXkgPSBmdW5jdGlvbiBzYXZlS2V5IChrZXkpe1xyXG5cdFx0Y29uc3Qgd3JpdGUgPSAob2JqLCBrZXksIHZhbCkgPT4ge1xyXG5cdFx0XHRvYmogPSB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiID8gIG9iaiA6IHt9XHJcblx0XHRcdG9ialtrZXldID0gdmFsXHJcblx0XHRcdHJldHVybiBvYmpcclxuXHRcdH1cclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gdGhpcy5jb25zdHJ1Y3RvciggKHN0YXRlKSA9PiBbdmFsdWUsIHdyaXRlKHN0YXRlLCBrZXksIHZhbHVlKV0gKSApXHJcblx0fVxyXG5cdFxyXG4gICAgICAgIHN0YXRlLnByb3RvdHlwZSA9IG1ldGhvZHMvLy0tXHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzdGF0ZS8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgbWV0aG9kcyA9IHsvLy0tXHJcblxyXG4vL1RoZSBgb2ZgIG1ldGhvZCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIHN0cmVhbSwgYnkgaW1tZWRpYXRlbHkgY2FsbGluZyB0aGUgcHVzaGVyIGZ1bmN0aW9uIHdpdGggaXQuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbih2YWwpe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IHB1c2godmFsKSApXHJcblx0fSxcclxuXHJcbi8vVGhlIGBtYXBgIG1ldGhvZCBjcmVhdGVzIGEgbmV3IHN0cmVhbSwgc3VjaCB0aGF0IGV2ZXJ5IHRpbWUgdGhlIG9sZCBzdHJlYW0gcmVjZWl2ZXMgYSB2YWx1ZSwgaXRcclxuLy9hcHBsaWVzIGBmdW5rYCB0byBpdCBhbmQgdGhlbiBwdXNoZXMgaXQgdG8gdGhlIG5ldyBzdHJlYW0uXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IHRoaXMuX3B1c2hlciggKHZhbCkgPT4gcHVzaCggZnVuayh2YWwpICkgKSApXHJcblxyXG5cdH0sXHJcblxyXG5cclxuLy9JbiB0aGlzIGNhc2UgdGhlIGltcGxlbWVudGF0aW9uIG9mIGBmbGF0YCBpcyBxdWl0ZSBzaW1wbGUuXHJcblxyXG4vL0VmZmVjdGl2ZWx5IGFsbCB3ZSBoYXZlIHRvIGRvIGlzIHJldHVybiB0aGUgc2FtZSB2YWx1ZSB3aXRoIHdoaWNoIHRoZSBpbm5lciBzdHJlYW0gaXMgcHVzaGQgd2l0aC5cclxuLy9UbyBkbyB0aGlzLCB3ZSB1bndyYXAgb3VyIHN0cmVhbSBvbmNlIHRvIGdldCB0aGUgaW5uZXIgc3RyZWFtIHZhbHVlLCBhbmQgdGhlbiB1bndyYXAgdGhlIGlubmVyXHJcbi8vc3RyZWFtIGl0c2VsZiB0byBnZXQgaXRzIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHN0cmVhbSggKHB1c2gpID0+IFxyXG5cdFx0XHR0aGlzLl9wdXNoZXIoXHQoaW5uZXJfc3RyZWFtKSA9PiBcclxuXHRcdFx0XHRpbm5lcl9zdHJlYW0uX3B1c2hlcigodmFsKSA9PiBwdXNoKHZhbCkpXHJcblx0XHRcdCkgXHJcblx0XHQpXHJcblx0fSxcclxuXHJcbi8vVGhlIGB0cnlGbGF0YCBmdW5jdGlvbiBpcyBhbG1vc3QgdGhlIHNhbWU6XHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gXHJcblx0XHRcdHRoaXMuX3B1c2hlcihcdChpbm5lcl9zdHJlYW0pID0+IHsgXHJcblx0XHRcdFx0aWYoaW5uZXJfc3RyZWFtLmNvbnN0cnVjdG9yID09PSBzdHJlYW0pe1xyXG5cdFx0XHRcdFx0aW5uZXJfc3RyZWFtLl9wdXNoZXIoKHZhbCkgPT4gcHVzaCh2YWwpKVxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cHVzaChpbm5lcl9zdHJlYW0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdClcclxuXHR9LFxyXG5cclxuLy9UaGUgYHJ1bmAgZnVuY3Rpb24ganVzdCBmZWVkcyB0aGUgcHVzaGVyIHdpdGggYSBwbGFjZWhvbGRlciAgZnVuY3Rpb24gc28gb3VyIGNvbXB1dGF0aW9uIGNhblxyXG4vL3N0YXJ0IGV4ZWN1dGluZy5cclxuXHJcblx0cnVuOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5fcHVzaGVyKGZ1bmN0aW9uKGEpe3JldHVybiBhfSlcclxuXHR9LFxyXG5cdFxyXG4vL0FmdGVyIHRoZXNlIGFyZSBkb25lLCBhbGwgd2UgbmVlZCB0byBkbyBpcyBpbXBsZW1lbnQgdGhlIHRyYWRpdGlvbmFsIEpTIGFycmF5IGZ1bmN0aW9uc1xyXG5cclxuLy9gRm9yRWFjaGAgaXMgYWxtb3N0IHRoZSBzYW1lIGFzIGBtYXBgLCBleGNlcHQgd2UgZG9uJ3QgcHVzaCBgZnVuayh2YWwpYCAtIHRoZSByZXN1bHQgb2YgdGhlIHRyYW5zZm9ybWF0aW9uXHJcbi8vdG8gdGhlIG5ldyBzdHJlYW0sIGJ1dCB3ZSBwdXNoIGB2YWxgIGluc3RlYWQuXHJcblxyXG5cdGZvckVhY2g6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gdGhpcy5fcHVzaGVyKCAodmFsKSA9PiB7IFxyXG5cdFx0XHRwdXNoKHZhbCkgXHJcblx0XHRcdGZ1bmsodmFsKVxyXG5cdFx0fSApIClcclxuXHR9LFxyXG5cclxuLy9XaXRoIGZpbHRlciB0aGUgcmVzdWx0IG9mIGBmdW5rKHZhbClgIHNob3dzIHVzIHdoZXRoZXIgd2UgbmVlZCB0byBwdXNoIHRoZSB2YWx1ZVxyXG5cclxuXHRmaWx0ZXI6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RyZWFtKCAocHVzaCkgPT4gdGhpcy5fcHVzaGVyKCAodmFsKSA9PiB7IFxyXG5cdFx0XHRpZihmdW5rKHZhbCkpe3B1c2godmFsKX1cclxuXHRcdH0gKSApXHJcblx0fSxcclxuXHJcblx0cmVkdWNlOmZ1bmN0aW9uKGZ1bmssIGZyb20pe1xyXG5cdFx0bGV0IGFjY3VtdWxhdG9yID0gZnJvbVxyXG5cdFx0dGhpcy5fcHVzaGVyKHZhbCA9PiB7XHJcblx0XHRcdGFjY3VtdWxhdG9yID0gZnVuayhhY2N1bXVsYXRvciwgdmFsKSBcclxuXHRcdH0pXHJcblx0fSxcclxufS8vLS1cclxuXHJcbi8vQWRkIGFsaWFzZXMgdG8gbWFwIC4gZmxhdCBhcyBmbGF0TWFwIGFuZCBtYXAgLiB0cnlGbGF0IGFzIHBoYXRNYXBcclxuICAgICAgICBtZXRob2RzLmZsYXRNYXAgPSBoZWxwZXJzLmZsYXRNYXBcclxuICAgICAgICBtZXRob2RzLnBoYXRNYXAgPSBoZWxwZXJzLnBoYXRNYXBcclxuXHJcbi8vQWRkIGEgcHJpbnQgZnVuY3Rpb24sIHVzZWQgZm9yIGRlYnVnZ2luZy5cclxuICAgICAgICBtZXRob2RzLnByaW50ID0gaGVscGVycy5wcmludFxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIHN0cmVhbSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHRjb25zdCBzdHJlYW0gPSBmdW5jdGlvbihwdXNoKXtcclxuXHRcdGlmKHR5cGVvZiBwdXNoICE9PSBcImZ1bmN0aW9uXCIpeyByZXR1cm4gbWV0aG9kcy5vZihwdXNoKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKG1ldGhvZHMpXHJcblxyXG5cdFx0b2JqLl9wdXNoZXIgPSBwdXNoXHJcblx0XHRvYmouY29uc3RydWN0b3IgPSBzdHJlYW1cclxuXHRcdG9iai5wcm90b3R5cGUgPSBtZXRob2RzXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHN0cmVhbVxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IGZ1bmN0aW9uXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBmdW5jdGlvbiBtb25hZCBhdWdtZW50cyBzdGFuZGFyZCBKYXZhU2NyaXB0IGZ1bmN0aW9ucyB3aXRoIGZhY2lsaXRpZXMgZm9yIGNvbXBvc2l0aW9uIGFuZCBjdXJyeWluZy5cclxuPCEtLW1vcmUtLT5cclxuXHJcbiovXHJcblFVbml0Lm1vZHVsZShcImZ1bmN0aW9uc1wiKS8vLS1cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIilcclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY29uc3RydWN0IGZ1bmN0aW9ucyBsaW5lIHRoaXNcclxuXHRcclxuXHRcdHZhciBwbHVzXzEgPSBmKCAobnVtKSA9PiBudW0rMSApXHJcblxyXG5cclxuLy9BZnRlciB5b3UgZG8gdGhhdCwgeW91IHdpbGwgc3RpbGwgYmUgYWJsZSB0byB1c2UgYHBsdXNfMWAgbGlrZSBhIG5vcm1hbCBmdW5jdGlvbiwgYnV0IHlvdSBjYW4gYWxzbyBkbyB0aGUgZm9sbG93aW5nOlxyXG5cclxuXHJcbi8qXHJcbkN1cnJ5aW5nXHJcbi0tLS1cclxuV2hlbiB5b3UgY2FsbCBhIGZ1bmN0aW9uIGBmYCB3aXRoIGxlc3MgYXJndW1lbnRzIHRoYXQgaXQgYWNjZXB0cywgaXQgcmV0dXJucyBhIHBhcnRpYWxseSBhcHBsaWVkXHJcbihib3VuZCkgdmVyc2lvbiBvZiBpdHNlbGYgdGhhdCBtYXkgYXQgYW55IHRpbWUgYmUgY2FsbGVkIHdpdGggdGhlIHJlc3Qgb2YgdGhlIGFyZ3VtZW50cy5cclxuKi9cclxuXHJcblx0UVVuaXQudGVzdChcImN1cnJ5XCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0Y29uc3QgYWRkMyA9IGYoIChhLGIsYykgPT4gYStiK2MgKVxyXG5cdFx0XHJcblx0XHRjb25zdCBhZGQyID0gYWRkMygwKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBhZGQyKDEsIDEpLCAyIClcclxuXHRcdGFzc2VydC5lcXVhbCggYWRkMig1LCA1KSwgMTAgKVxyXG5cclxuXHRcdGNvbnN0IHBsdXMxMCA9IGFkZDIoMTApXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMxMCg1KSwgMTUgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzMTAoMTApLCAyMCApXHJcblxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbmBvZih2YWx1ZSlgXHJcbi0tLS1cclxuSWYgY2FsbGVkIHdpdGggYSB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgaXQgY29uc3RydWN0cyBhIGZ1bmN0aW9uIHRoYXQgYWx3YXlzIHJldHVybnMgdGhhdCB2YWx1ZS5cclxuSWYgY2FsbGVkIHdpdGhvdXQgYXJndW1lbnRzIGl0IHJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGFsd2F5cyByZXR1cm5zIHRoZSBhcmd1bWVudHMgZ2l2ZW4gdG8gaXQuXHJcbiovXHJcblx0UVVuaXQudGVzdChcIm9mXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0Y29uc3QgcmV0dXJuczkgPSBmKCkub2YoOSlcclxuXHRcdGFzc2VydC5lcXVhbCggcmV0dXJuczkoMyksIDkgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCByZXR1cm5zOShcImFcIiksIDkgKVxyXG5cclxuXHRcdGNvbnN0IGlkID0gZigpLm9mKClcclxuXHRcdGFzc2VydC5lcXVhbCggaWQoMyksIDMgKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBpZChcImFcIiksIFwiYVwiIClcclxuXHJcblx0fSkvLy0tXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdCwgdGhlbiBjYWxscyBgZnVua2Agd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudDpcclxuKi9cclxuXHRRVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0XHJcbi8vWW91IGNhbiBjcmVhdGUgYSBGdW5jdGlvbiBNb25hZCBieSBwYXNzaW5nIGEgbm9ybWFsIEphdmFTY3JpcHQgZnVuY3Rpb24gdG8gdGhlIGNvbnN0cnVjdG9yICh5b3UgY2FuIHdyaXRlIHRoZSBmdW5jdGlvbiBkaXJlY3RseSB0aGVyZSk6XHJcblx0XHRcclxuXHRcdHZhciBwbHVzMSA9IGYoIG51bSA9PiBudW0rMSApXHJcblxyXG5cclxuLy9UaGVuIG1ha2luZyBhbm90aGVyIGZ1bmN0aW9uIGlzIGVhc3k6XHJcblxyXG5cdFx0dmFyIHBsdXMyID0gcGx1czEubWFwKHBsdXMxKSBcclxuXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXMyKDApLCAyIClcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXM0ID0gcGx1czIubWFwKHBsdXMyKVxyXG5cclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czQoMSksIDUgKVxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgIGV4Y2VwdCB0aGF0IGlmIGBmdW5rYCByZXR1cm5zIGFub3RoZXIgZnVuY3Rpb24gaXQgcmV0dXJucyBhIHRoaXJkIGZ1bmN0aW9uIHdoaWNoOlxyXG4xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QuXHJcbjIuIENhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50XHJcbjMuIENhbGxzIHRoZSBmdW5jdGlvbiByZXR1cm5lZCBieSBgZnVua2Agd2l0aCB0aGUgc2FtZSBhcmd1bWVudCBhbmQgcmV0dXJucyB0aGUgcmVzdWx0IG9mIHRoZSBzZWNvbmQgY2FsbC5cclxuKi9cclxuXHRRVW5pdC50ZXN0KFwicGhhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vWW91IGNhbiB1c2UgYHBoYXRNYXBgIHRvIG1vZGVsIHNpbXBsZSBpZi10aGVuIHN0YXRlbWVudHMuIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSB1c2VzIGl0IGluIGNvbWJpbmF0aW9uIG9mIHRoZSBjdXJyeWluZyBmdW5jdGlvbmFsaXR5OlxyXG5cdFx0XHJcblx0XHR2YXIgY29uY2F0ID0gZiggKHN0cjEsIHN0cjIpID0+IHN0cjEgKyBzdHIyKVxyXG5cclxuXHRcdHZhciBtYWtlTWVzc2FnZSA9IGYocGFyc2VJbnQsIDEpXHJcblx0XHRcdC5mbGF0TWFwKChudW0pID0+IGlzTmFOKG51bSk/IGYoXCJFcnJvci4gTm90IGEgbnVtYmVyXCIpIDogY29uY2F0KFwiVGhlIG51bWJlciBpcyBcIikgKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIxXCIpLCBcIlRoZSBudW1iZXIgaXMgMVwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMlwiKSwgXCJUaGUgbnVtYmVyIGlzIDJcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIllcIiksIFwiRXJyb3IuIE5vdCBhIG51bWJlclwiKVxyXG5cclxuLypcclxuXHJcbmBwaGF0TWFwYCBpcyBzaW1pbGFyIHRvIHRoZSBgPj49YCBmdW5jdGlvbiBpbiBIYXNrZWxsLCB3aGljaCBpcyB0aGUgYnVpbGRpbmcgYmxvY2sgb2YgdGhlIGluZmFtb3VzIGBkb2Agbm90YXRpb25cclxuSXQgY2FuIGJlIHVzZWQgdG8gd3JpdGUgcHJvZ3JhbXMgd2l0aG91dCB1c2luZyBhc3NpZ25tZW50Llx0XHJcblxyXG5Gb3IgZXhhbXBsZSBpZiB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaW4gSGFza2VsbDpcclxuXHJcblx0XHRhZGRTdHVmZiA9IGRvICBcclxuXHRcdFx0YSA8LSAoKjIpICBcclxuXHRcdFx0YiA8LSAoKzEwKSAgXHJcblx0XHRcdHJldHVybiAoYStiKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHJcbldoZW4gd2UgZGVzdWdhciBpdCwgdGhpcyBiZWNvbWVzOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gKCoyKSA+Pj0gXFxhIC0+XHJcblx0XHRcdFx0KCsxMCkgPj49IFxcYiAtPlxyXG5cdFx0XHRcdFx0cmV0dXJuIChhK2IpXHJcblxyXG5vciBpbiBKYXZhU2NyaXB0IHRlcm1zOlxyXG5cclxuKi9cclxuXHJcblx0XHR2YXIgYWRkU3R1ZmYgPSBmKCBudW0gPT4gbnVtICogMiApXHJcblx0XHRcdC5mbGF0TWFwKCBhID0+IGYoIG51bSA9PiBudW0gKyAxMCApXHJcblx0XHRcdFx0LmZsYXRNYXAoIGIgPT4gZi5vZihhICsgYikgKSBcclxuXHRcdFx0KVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogbGlzdCBcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBsaXN0YCB0eXBlLCBhdWdtZW50cyB0aGUgc3RhbmRhcmQgSmF2YVNjcmlwdCBhcnJheXMsIG1ha2luZyB0aGVtIGltbXV0YWJsZSBhbmQgYWRkaW5nIGFkZGl0aW9uYWwgZnVuY3Rpb25hbGl0eSB0byB0aGVtXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJMaXN0XCIpLy8tLVxyXG5cclxuXHJcblxyXG4vL1RvIHVzZSB0aGUgYGxpc3RgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIGxpc3QgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9saXN0XCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIGNyZWF0ZSBhIGBsaXN0YCBmcm9tIGFycmF5IGxpa2UgdGhpc1xyXG5cdFx0dmFyIG15X2xpc3QgPSBsaXN0KFsxLDIsM10pXHJcbi8vb3IgbGlrZSB0aGlzOlxyXG5cdFx0dmFyIG15X2xpc3QgPSBsaXN0KDEsMiwzKVxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5TdGFuZGFyZCBhcnJheSBtZXRob2QuIEV4ZWN1dGVzIGBmdW5rYCBmb3IgZWFjaCBvZiB0aGUgdmFsdWVzIGluIHRoZSBsaXN0IGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IGxpc3QuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHR2YXIgcGVvcGxlID0gbGlzdCgge25hbWU6XCJqb2huXCIsIGFnZToyNCwgb2NjdXBhdGlvbjpcImZhcm1lclwifSwge25hbWU6XCJjaGFybGllXCIsIGFnZToyMiwgb2NjdXBhdGlvbjpcInBsdW1iZXJcIn0pXHJcblx0dmFyIG5hbWVzID0gcGVvcGxlLm1hcCgocGVyc29uKSA9PiBwZXJzb24ubmFtZSApXHJcblx0YXNzZXJ0LmRlZXBFcXVhbChuYW1lcywgW1wiam9oblwiLCBcImNoYXJsaWVcIl0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblNhbWUgYXMgYG1hcGAsIGJ1dCBpZiBgZnVua2AgcmV0dXJucyBhIGxpc3Qgb3IgYW4gYXJyYXkgaXQgZmxhdHRlbnMgdGhlIHJlc3VsdHMgaW50byBvbmUgYXJyYXlcclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHJcblx0dmFyIG9jY3VwYXRpb25zID0gbGlzdChbIFxyXG5cdFx0e29jY3VwYXRpb246XCJmYXJtZXJcIiwgcGVvcGxlOltcImpvaG5cIiwgXCJzYW1cIiwgXCJjaGFybGllXCJdIH0sXHJcblx0XHR7b2NjdXBhdGlvbjpcInBsdW1iZXJcIiwgcGVvcGxlOltcImxpc2FcIiwgXCJzYW5kcmFcIl0gfSxcclxuXHRdKVxyXG5cdFxyXG5cdHZhciBwZW9wbGUgPSBvY2N1cGF0aW9ucy5waGF0TWFwKChvY2N1cGF0aW9uKSA9PiBvY2N1cGF0aW9uLnBlb3BsZSlcclxuXHRhc3NlcnQuZGVlcEVxdWFsKHBlb3BsZSxbXCJqb2huXCIsIFwic2FtXCIsIFwiY2hhcmxpZVwiLCBcImxpc2FcIiwgXCJzYW5kcmFcIl0pXHJcblxyXG59KS8vLS1cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcbiIsInZhciBtYXliZVQgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVRcIilcclxudmFyIGxpc3QgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9saXN0XCIpXHJcbnZhciBzdGF0ZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0YXRlXCIpXHJcblxyXG5RVW5pdC5tb2R1bGUoXCJtYXliZVRcIilcclxuXHJcblFVbml0LnRlc3QoXCJsaXN0XCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4gICAgdmFyIGJjID0gbWF5YmVUKGxpc3Qoe2E6XCJiXCJ9LCB7YTpcImNcIn0pKS5nZXRQcm9wKFwiYVwiKVxyXG4gICAgYXNzZXJ0LmRlZXBFcXVhbChiYy5faW5uZXJNb25hZCwgW1wiYlwiLCBcImNcIl0pXHJcbiAgICB2YXIgYWJjID0gYmMubGlmdChcInJldmVyc2VcIikubGlmdChcImNvbmNhdFwiLCBbXCJhXCJdKVxyXG4gICAgYXNzZXJ0LmRlZXBFcXVhbChhYmMuX2lubmVyTW9uYWQsIFtcImNcIiwgXCJiXCIsIFwiYVwiXSlcclxufSlcclxuLypcclxuUVVuaXQudGVzdChcInN0YXRlXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG4gICAgbWF5YmVUKHN0YXRlKDEpKVxyXG4gICAgLm1hcCgpXHJcbn0pXHJcblxyXG4qL1xyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IG1heWJlXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgbWF5YmVgIHR5cGUsIGFsc28ga25vd24gYXMgYG9wdGlvbmAgdHlwZSBpcyBhIGNvbnRhaW5lciBmb3IgYSB2YWx1ZSB0aGF0IG1heSBub3QgYmUgdGhlcmUuIFxyXG5cclxuVGhlIHB1cnBvc2Ugb2YgdGhpcyBtb25hZCBpcyB0byBlbGltaW5hdGUgdGhlIG5lZWQgZm9yIHdyaXRpbmcgYG51bGxgIGNoZWNrcy4gXHJcbkZ1cnRoZXJtb3JlIGl0IGFsc28gZWxpbWluYXRlcyB0aGUgcG9zc2liaWxpdHkgb2YgbWFraW5nIGVycm9ycyBieSBtaXNzaW5nIG51bGwtY2hlY2tzLlxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuXHJcbnZhciBpZGVudGl0eSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2lkZW50aXR5XCIpLy8tLVxyXG52YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcbnZhciBsaXN0ID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbGlzdFwiKS8vLS1cclxudmFyIHN0YXRlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvc3RhdGVcIikvLy0tXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBtYXliZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcbiAgICB2YXIgbWF5YmUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byB3cmFwIGEgdmFsdWUgaW4gYG1heWJlYCB3aXRoOlxyXG4gICAgdmFyIHZhbCA9IDQvLy0tXHJcbiAgICB2YXIgbWF5YmVfdmFsID0gbWF5YmUodmFsKVxyXG5cclxuLy9JZiB0aGUgJ3ZhbCcgaXMgZXF1YWwgdG8gKnVuZGVmaW5lZCogaXQgdGhyZWF0cyB0aGUgY29udGFpbmVyIGFzIGVtcHR5LlxyXG5cclxuXHJcbi8vWW91IGNhbiBhbHNvIGNvbWJpbmUgYSBgbWF5YmVgIHdpdGggYW4gZXhpc3RpbmcgbW9uYWQsIHVzaW5nIHRoZSBgbWF5YmVUYCBjb25zdHJ1Y3RvcjpcclxuXHJcbiAgICB2YXIgbWF5YmVUID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbWF5YmVUXCIpXHJcbiAgICBjb25zdCBtYXliZUxpc3QgPSBtYXliZVQobGlzdCgxLDIsMykpXHJcblxyXG5cclxudmFyIHRlc3QgPSAobWF5YmUpPT57Ly8tLVxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIGBmdW5rYCB3aXRoIHRoZSBgbWF5YmVgJ3MgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGJ1dCBvbmx5IGlmIHRoZSB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSAqdW5kZWZpbmVkKiwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgbWF5YmUuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vVHJhZGl0aW9uYWxseSwgaWYgd2UgaGF2ZSBhIHZhbHVlIHRoYXQgbWF5IGJlIHVuZGVmaW5lZCB3ZSBkbyBhIG51bGwgY2hlY2sgYmVmb3JlIGRvaW5nIHNvbWV0aGluZyB3aXRoIGl0OlxyXG5cclxuXHR2YXIgb2JqID0ge30vLy0tXHJcblx0dmFyIGdldF9wcm9wZXJ0eSA9IGYoKG9iamVjdCkgPT4gb2JqZWN0LnByb3BlcnR5KS8vLS1cclxuXHRcclxuXHR2YXIgdmFsID0gZ2V0X3Byb3BlcnR5KG9iailcclxuXHRcclxuXHRpZih2YWwgIT09IHVuZGVmaW5lZCl7XHJcblx0XHR2YWwgPSB2YWwudG9TdHJpbmcoKVxyXG5cdH1cclxuXHRhc3NlcnQuZXF1YWwodmFsLCB1bmRlZmluZWQpIFxyXG5cclxuLy9XaXRoIGBtYXBgIHRoaXMgY2FuIGJlIHdyaXR0ZW4gbGlrZSB0aGlzXHJcblxyXG4gXHR2YXIgbWF5YmVfZ2V0X3Byb3BlcnR5ID0gZ2V0X3Byb3BlcnR5Lm1hcChtYXliZSlcclxuXHRtYXliZV9nZXRfcHJvcGVydHkob2JqKS5tYXAoKHZhbCkgPT4ge1xyXG5cdFx0YXNzZXJ0Lm9rKGZhbHNlKS8vLS1cclxuXHRcdHZhbC50b1N0cmluZygpLy90aGlzIGlzIG5vdCBleGVjdXRlZFxyXG5cdH0pXHJcblxyXG4vL1RoZSBiaWdnZXN0IGJlbmVmaXQgd2UgZ2V0IGlzIHRoYXQgaW4gdGhlIGZpcnN0IGNhc2Ugd2UgY2FuIGVhc2lseSBmb3JnZXQgdGhlIG51bGwgY2hlY2s6XHJcblx0XHJcblx0YXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe1xyXG5cdFx0Z2V0X3Byb3BlcnR5KG9iaikudG9TdHJpbmcoKSAgLy90aGlzIGJsb3dzIHVwXHJcblx0fSlcclxuXHJcbi8vV2hpbGUgaW4gdGhlIHNlY29uZCBjYXNlIHdlIGNhbm5vdCBhY2Nlc3MgdGhlIHVuZGVybHlpbmcgdmFsdWUgZGlyZWN0bHksIGFuZCB0aGVyZWZvcmUgY2Fubm90IGV4ZWN1dGUgYW4gYWN0aW9uIG9uIGl0LCBpZiBpdCBpcyBub3QgdGhlcmUuXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcblxyXG5TYW1lIGFzIGBtYXBgLCBidXQgaWYgYGZ1bmtgIHJldHVybnMgYSBgbWF5YmVgIGl0IGZsYXR0ZW5zIHRoZSB0d28gYG1heWJlc2AgaW50byBvbmUuXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJmbGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9gbWFwYCB3b3JrcyBmaW5lIGZvciBlbGltaW5hdGluZyBlcnJvcnMsIGJ1dCBpdCBkb2VzIG5vdCBzb2x2ZSBvbmUgb2YgdGhlIG1vc3QgYW5ub3lpbmcgcHJvYmxlbXMgd2l0aCBudWxsLWNoZWNrcyAtIG5lc3Rpbmc6XHJcblxyXG5cdHZhciBvYmogPSB7IGZpcnN0OiB7c2Vjb25kOlwidmFsXCIgfSB9XHJcblx0XHJcblx0bWF5YmUob2JqKVxyXG5cdFx0Lm1hcCggcm9vdCA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5tYXAoIG1heWJlRmlyc3QgPT4gbWF5YmVGaXJzdC5tYXAgKGZpcnN0ID0+IG1heWJlIChtYXliZUZpcnN0LnNlY29uZCApICkgKSBcclxuXHRcdC5tYXAoIG1heWJlTWF5YmVWYWx1ZSA9PiBtYXliZU1heWJlVmFsdWUubWFwIChtYXliZVZhbHVlID0+IG1heWJlVmFsdWUubWFwKCAodmFsdWUpPT4oIGFzc2VydC5lcXVhbCggdmFsLCBcInZhbFwiKSApICkgKSApXHJcblxyXG4vL2BwaGF0TWFwYCBkb2VzIHRoZSBmbGF0dGVuaW5nIGZvciB1cywgYW5kIGFsbG93cyB1cyB0byB3cml0ZSBjb2RlIGxpa2UgdGhpc1xyXG5cclxuXHRtYXliZShvYmopXHJcblx0XHQuZmxhdE1hcChyb290ID0+IG1heWJlKHJvb3QuZmlyc3QpKVxyXG5cdFx0LmZsYXRNYXAoZmlyc3QgPT4gbWF5YmUoZmlyc3Quc2Vjb25kKSlcclxuXHRcdC5mbGF0TWFwKHZhbCA9PiB7XHJcblx0XHRcdGFzc2VydC5lcXVhbCh2YWwsIFwidmFsXCIpXHJcblx0XHR9KVxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5BZHZhbmNlZCBVc2FnZVxyXG4tLS0tXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiYWR2YW5jZWRcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcbi8vIGBtYXliZWAgY2FuIGJlIHVzZWQgd2l0aCB0aGUgZnVuY3Rpb24gbW9uYWQgdG8gZWZmZWN0aXZlbHkgcHJvZHVjZSAnc2FmZScgdmVyc2lvbnMgb2YgZnVuY3Rpb25zXHJcblxyXG5cdHZhciBnZXQgPSBmKChwcm9wLCBvYmopID0+IG9ialtwcm9wXSlcclxuXHR2YXIgbWF5YmVHZXQgPSBnZXQubWFwKG1heWJlKVxyXG5cclxuLy9UaGlzIGNvbWJpbmVkIHdpdGggdGhlIHVzZSBvZiBjdXJyeWluZyBtYWtlcyBmb3IgYSB2ZXJ5IGZsdWVudCBzdHlsZSBvZiBjb2Rpbmc6XHJcblxyXG5cdHZhciBnZXRGaXJzdFNlY29uZCA9IChyb290KSA9PiBtYXliZShyb290KS5waGF0TWFwKG1heWJlR2V0KCdmaXJzdCcpKS5waGF0TWFwKG1heWJlR2V0KCdzZWNvbmQnKSlcclxuXHRcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwidmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwidmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDoge3NlY29uZDpcIm90aGVyX3ZhbHVlXCIgfSB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIm90aGVyX3ZhbHVlXCIpKVxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IFwiXCIgfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ3aGF0ZXZlclwiKSApLy93b24ndCBiZSBleGVjdXRlZCBcclxuXHJcbn0pLy8tLVxyXG5cclxufS8vLS1cclxuUVVuaXQubW9kdWxlKFwiTWF5YmVcIikvLy0tXHJcbnRlc3QobWF5YmUpLy8tLSBydW4gdGhlIHRlc3RzIHVzaW5nIGEgbWF5YmVcclxuUVVuaXQubW9kdWxlKFwiTWF5YmVUXCIpLy8tLSBydW4gdGhlIHRlc3RzIHVzaW5nIGEgbW9uYWQgdHJhbnNmb3JtZXJcclxudGVzdCgodmFsKT0+bWF5YmVUKGlkZW50aXR5KHZhbCkpKS8vLS1cclxuXHJcbiAgICBcclxuLypcclxuQ29tYmluaW5nIHdpdGggT3RoZXIgTW9uYWRzXHJcbi0tLS1cclxuSW4gYWRkaXRpb24gdG8gY3JlYXRpbmcgYSBgbWF5YmVgIGZyb20gYSBwbGFpbiB2YWx1ZSwgeW91IGNhbiBhbHNvIGNyZWF0ZSBvbmUgZnJvbSBhbiBleGlzdGluZyBtb25hZCwgdXNpbmcgdGhlIGBtYXliZVRgIGNvbnN0cnVjdG9yOlxyXG5cclxuVGhlIHJlc3VsdGluZyBtb25hZCB3aWxsIGdhaW4gYWxsIHRoZSBjaGFyYWN0ZXJpc3RpY3Mgb2YgYSBgbWF5YmVgIHdpdGhvdXQgbG9zaW5nIHRoZSBjaGFyYWN0ZXJpc3RpY3Mgb2YgdGhlIHVuZGVybHlpbmcgbW9uYWQuXHJcblxyXG4qKipcclxuKi9cclxuICAgIFxyXG5RVW5pdC5tb2R1bGUoXCJtYXliZVQgQ29tYmluYXRpb25zXCIpLy8tLVxyXG5cclxuXHJcblFVbml0LnRlc3QoXCJsaXN0XCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9Db21iaW5pbmcgYSBtYXliZSB3aXRoIGEgbGlzdCwgZm9yIGV4YW1wbGUsIGNyZWF0ZXMgYSBsaXN0IHdoZXJlIGVhY2ggb2YgdGhlIHZhbHVlcyBhcmUgYG1heWJlYHNcclxuXHJcbiAgICB2YXIgbWF5YmVMaXN0ID0gbWF5YmVUKGxpc3Qoe2ZpcnN0Onsgc2Vjb25kOlwidmFsdWVcIiB9IH0sIHtmaXJzdDp7IHNlY29uZDpcIm90aGVyIHZhbHVlXCIgfSB9LCB7IGZpcnN0OlwiXCJ9ICkpXHJcblxyXG4vL1RoaXMgbWVhbnMgeW91IGNhbiB1c2UgbWF5YmUgdG8gc2FmZWx5IHRyYW5zZm9ybSB0aGUgbGlzdCBpdGVtczpcclxuXHJcbiAgICBtYXliZUxpc3QucGhhdE1hcCgodmFsKT0+IG1heWJlVCh2YWwuZmlyc3QpICkucGhhdE1hcCgodmFsKT0+IG1heWJlVCh2YWwuc2Vjb25kKSApXHJcblxyXG4vL1RoaXMgYWxsb3dzIHlvdSB0byB1c2UgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBtYXliZSBcclxuXHJcblxyXG5cclxuLy9Zb3UgY2FuIHVzZSB0aGUgbWF5YmVcclxuXHJcbiAgICAuZ2V0UHJvcChcImFcIilcclxuICAgIGFzc2VydC5kZWVwRXF1YWwoYmMuX2lubmVyTW9uYWQsIFtcImJcIiwgXCJjXCJdKVxyXG4gICAgdmFyIGFiYyA9IGJjLmxpZnQoXCJyZXZlcnNlXCIpLmxpZnQoXCJjb25jYXRcIiwgW1wiYVwiXSlcclxuICAgIGFzc2VydC5kZWVwRXF1YWwoYWJjLl9pbm5lck1vbmFkLCBbXCJjXCIsIFwiYlwiLCBcImFcIl0pXHJcbn0pLy8tLVxyXG4vKlxyXG5RVW5pdC50ZXN0KFwic3RhdGVcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcbiAgICBtYXliZVQoc3RhdGUoMSkpXHJcbiAgICAubWFwKClcclxufSlcclxuXHJcbiovXHJcblxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogcHJvbWlzZSBcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBwcm9taXNlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBmdXR1cmVgIGlzIGEgY29udGFpbmVyIGZvciBhIHZhbHVlIHdoaWNoIHdpbGwgYmUgcmVzb2x2ZWQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLCBcclxudmlhIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiUHJvbWlzZVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBwcm9taXNlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHR2YXIgcHJvbWlzZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3Byb21pc2VcIilcclxuXHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVG8gY3JlYXRlIGEgYHByb21pc2VgIHBhc3MgYSBmdW5jdGlvbiB3aGljaCBhY2NlcHRzIGEgY2FsbGJhY2sgYW5kIGNhbGxzIHRoYXQgY2FsbGJhY2sgd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlOlxyXG5cclxuXHR2YXIgbXlfcHJvbWlzZSA9IHByb21pc2UoIChyZXNvbHZlKSA9PiAgXHJcblx0XHRzZXRUaW1lb3V0KCgpID0+IHsgcmVzb2x2ZSg1KSB9LDEwMDApICBcclxuXHQpXHJcblxyXG4vLyBJbiBtb3N0IGNhc2VzIHlvdSB3aWxsIGJlIGNyZWF0aW5nIHByb21pc2VzIHVzaW5nIGhlbHBlciBmdW5jdGlvbnMgbGlrZTpcclxuXHJcblx0Y29uc3QgZ2V0VXJsID0gKHVybCkgPT4gcHJvbWlzZSggKHJlc29sdmUpID0+IHtcclxuXHQgIGNvbnN0IHJxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcclxuICBcdCAgcnEub25sb2FkID0gKCkgPT4gcmVzb2x2ZShKU09OLnBhcnNlKHJxLnJlc3BvbnNlVGV4dCkpXHJcblx0ICBycS5vcGVuKFwiR0VUXCIsdXJsLHRydWUpO1xyXG5cdCAgcnEuc2VuZCgpO1xyXG5cdH0pXHJcbi8qXHJcbmBydW4oKWBcclxuLS0tLVxyXG5FeGVjdXRlcyB0aGUgcHJvbWlzZSBhbmQgZmV0Y2hlcyB0aGUgZGF0YS5cclxuXHJcbioqKlxyXG5Gb3IgZXhhbXBsZSB0byBtYWtlIGEgcHJvbWlzZSBhbmQgcnVuIGl0IGltbWVkaWF0ZWx5IGRvOlxyXG4qL1xyXG5cdGdldFVybChcInBlb3BsZS5qc29uXCIpLnJ1bigpXHJcblx0Ly9bXHJcblx0Ly8gIHsgXCJuYW1lXCI6XCJqb2huXCIsIFwib2NjdXBhdGlvblwiOlwicHJvZ3JhbW1lclwifSxcclxuIFx0Ly8gIHtcIm5hbWVcIjpcImplblwiLCBcIm9jY3VwYXRpb25cIjpcImFkbWluXCJ9XHJcblx0Ly9dXHJcblxyXG5cdGdldFVybChcIm9jY3VwYXRpb25zLmpzb25cIikucnVuKClcclxuXHQvL3tcclxuXHQvLyAgXCJwcm9ncmFtbWVyXCI6IFwid3JpdGVzIGNvZGVcIlxyXG5cdC8vICBcImFkbWluXCI6IFwibWFuYWdlcyBpbmZyYXN0cnVjdHVyZVwiXHJcblx0Ly99XHJcblxyXG4vKlxyXG4vL05vdGUgdGhhdCB3ZSB3aWxsIGJlIHVzaW5nIHRoZSBkYXRhIGZyb20gdGhlc2UgdHdvIGZpbGVzIGluIHRoZSBuZXh0IGV4YW1wbGVzLiBcclxuXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuUmV0dXJucyBhIG5ldyBwcm9taXNlLCB3aGljaCBhcHBsaWVzIGBmdW5rYCB0byB0aGUgZGF0YSB3aGVuIHlvdSBydW4gaXQuXHJcblxyXG4qKipcclxuVGhlIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGJvdGggZm9yIG1hbmlwdWxhdGluZyB0aGUgZGF0YSB5b3UgZmV0Y2ggYW5kIGZvciBydW5uaW5nIHNpZGUgZWZmZWN0cyAgXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdGNvbnN0IHN0b3AgPSBhc3NlcnQuYXN5bmMoKS8vLS1cclxuXHRnZXRVcmwoXCJwZW9wbGUuanNvblwiKVxyXG5cdCAgXHJcblx0ICAvL1VzaW5nIFwibWFwXCIgZm9yIG1hbmlwdWxhdGluZyBkYXRhXHJcblx0ICAubWFwKChwZW9wbGUpID0+IHBlb3BsZS5tYXAoKHBlcnNvbikgPT4gcGVyc29uLm5hbWUpKVxyXG5cclxuXHQgIC8vVXNpbmcgXCJtYXBcIiBmb3IgdHJpZ2dlcmluZyBzaWRlIGVmZmVjdHMgXHJcblx0ICAubWFwKG5hbWVzID0+IHtcclxuXHQgICAgYXNzZXJ0LmRlZXBFcXVhbChuYW1lcywgWydqb2huJywgJ2plbiddKVxyXG5cdCAgICBzdG9wKCkvLy0tXHJcblx0ICB9KS5ydW4oKVxyXG59KS8vLS1cclxuXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5BIG1vcmUgcG93ZXJmdWwgdmVyc2lvbiBvZiBgbWFwYCB3aGljaCBjYW4gYWxsb3dzIHlvdSB0byBjaGFpbiBzZXZlcmFsIHN0ZXBzIG9mIHRoZSBhc3ljaHJvbm91cyBjb21wdXRhdGlvbnMgdG9nZXRoZXIuXHJcbktub3duIGFzIGB0aGVuYCBmb3IgdHJhZGl0aW9uYWwgcHJvbWlzZSBsaWJyYXJpZXMuXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdGNvbnN0IGRvbmUgPSBhc3NlcnQuYXN5bmMoKS8vLS1cdFxyXG5cclxuLy9Gb3IgZXhhbXBsZSBoZXJlIGlzIGEgZnVuY3Rpb24gd2hpY2ggcmV0cmlldmVzIGEgcGVyc29uJ3Mgb2NjdXBhdGlvbiBmcm9tIHRoZSBgcGVvcGxlLmpzb25gIGZpbGVcclxuLy9hbmQgdGhlbiByZXRyaWV2ZXMgdGhlIG9jY3VwYXRpb24ncyBkZXNjcmlwdGlvbiBmcm9tIGBvY2N1cGF0aW9ucy5qc29uYC4gXHJcblxyXG5cdGNvbnN0IGdldE9jY3VwYXRpb25EZXNjcmlwdGlvbiA9IChuYW1lKSA9PiBnZXRVcmwoXCJwZW9wbGUuanNvblwiKVxyXG5cclxuXHQgIC8vUmV0cmlldmUgcGVyc29uIGRhdGFcclxuXHQgIC5waGF0TWFwKChwZW9wbGUpID0+IHBlb3BsZS5maWx0ZXIoIHBlcnNvbiA9PiBwZXJzb24ubmFtZSA9PT0gbmFtZSApWzBdKVxyXG5cclxuXHQgIC8vUmV0cmlldmUgaXRzIG9jY3VwYXRpb25cclxuXHQgIC5waGF0TWFwKCAocGVyc29uKSA9PiBnZXRVcmwoXCJvY2N1cGF0aW9ucy5qc29uXCIpXHJcblx0ICAgIC5tYXAob2NjdXBhdGlvbnMgPT4gb2NjdXBhdGlvbnNbcGVyc29uLm9jY3VwYXRpb25dKSApXHJcblxyXG4vL0hlcmUgaXMgaG93IHRoZSBmdW5jdGlvbiBpcyB1c2VkOlxyXG5cclxuXHRnZXRPY2N1cGF0aW9uRGVzY3JpcHRpb24oXCJqb2huXCIpLm1hcCgoZGVzYykgPT4geyBcclxuXHRcdGFzc2VydC5lcXVhbChkZXNjLCBcIndyaXRlcyBjb2RlXCIpIFxyXG5cdFx0ZG9uZSgpLy8tLVxyXG5cdH0pLnJ1bigpXHJcblx0XHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBzdGF0ZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYHN0YXRlYCB0eXBlLCBpcyBhIGNvbnRhaW5lciB3aGljaCBlbmNhcHN1bGF0ZXMgYSBzdGF0ZWZ1bCBmdW5jdGlvbi4gSXQgYmFzaWNhbGx5IGFsbG93cyB5b3UgdG8gY29tcG9zZSBmdW5jdGlvbnMsXHJcbmxpa2UgeW91IGNhbiBkbyB3aXRoIHRoZSBgZmAgdHlwZSwgZXhjZXB0IHdpdGggaXQgYW55IGZ1bmN0aW9uIGNhbiBhY2Nlc3MgYW4gYWRkaXRpb25hbCBcInZhcmlhYmxlXCIgYmVzaWRlcyBpdHNcclxuaW5wdXQgYXJndW1lbnQocykgLSB0aGUgc3RhdGUuIFxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiU3RhdGVcIikvLy0tXHJcblxyXG4vL1RvIHVzZSB0aGUgYHN0YXRlYCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBzdGF0ZSA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L3N0YXRlXCIpXHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vSW4gdGhlIGNvbnRleHQgb2YgdGhpcyB0eXBlIGEgc3RhdGUgaXMgcmVwcmVzZW50ZWQgYnkgYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSBzdGF0ZSBcclxuLy9hbmQgcmV0dXJucyBhIGxpc3Qgd2hpY2ggY29udGFpbnMgYSB2YWx1ZSBhbmQgYSBuZXcgc3RhdGUuIFNvIGZvciBleGFtcGxlOlxyXG5cclxuXHRzdGF0ZSgodmFsKSA9PiBbdmFsKzEsIHZhbF0pXHJcblxyXG4vL0NyZWF0ZXMgYSBuZXcgc3RhdGVmdWwgY29tcHV0YXRpb24gd2hpY2ggaW5jcmVtZW50cyB0aGUgaW5wdXQgYXJndW1lbnQgYW5kIHRoZW4gc2F2ZXMgaXQgaW4gdGhlIHN0YXRlLlxyXG5cclxuXHJcbi8qXHJcbmBvZih2YWx1ZSlgXHJcbi0tLS1cclxuQWNjZXB0cyBhIHZhbHVlIGFuZCB3cmFwcyBpbiBhIHN0YXRlIGNvbnRhaW5lclxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJvZlwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdGFzc2VydC5leHBlY3QoMCkvLy0tXHJcblx0XHRjb25zdCBzdGF0ZTUgPSBzdGF0ZSgpLm9mKDUpXHJcblx0fSkvLy0tXHJcblxyXG4vL05vdGUgdGhhdCB0aGUgZm9sbG93aW5nIGNvZGUgZG9lcyBub3QgcHV0IGA1YCBpbiB0aGUgc3RhdGUuXHJcbi8vUmF0aGVyIGl0IGNyZWF0ZXMgYSBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGA1YCBhbmQgZG9lcyBub3QgaW50ZXJhY3Qgd2l0aCB0aGUgc3RhdGUuIFxyXG5cclxuXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuRXhlY3V0ZXMgYGZ1bmtgIHdpdGggdGhlIGVuY2Fwc3VsYXRlZCB2YWx1ZSBhcyBhbiBhcmd1bWVudCwgYW5kIHdyYXBzIHRoZSByZXN1bHQgaW4gYSBuZXcgYHN0YXRlYCBvYmplY3QsIFxyXG53aXRob3V0IGFjY2Vzc2luZyB0aGUgc3RhdGVcclxuXHJcblxyXG4qKipcclxuKi9cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vT25lIG9mIHRoZSBtYWluIGJlbmVmaXRzIG9mIHRoZSBgc3RhdGVgIHR5cGVzIGlzIHRoYXQgaXQgYWxsb3dzIHlvdSB0byBtaXggcHVyZSBmdW5jdGlvbnMgd2l0aCB1bnB1cmUgb25lcywgXHJcbi8vSW4gdGhlIHNhbWUgd2F5IHRoYXQgcHJvbWlzZXMgYWxsb3cgdXMgdG8gbWl4IGFzeWNocm9ub3VzIGZ1bmN0aW9ucyB3aXRoIHN5bmNocm9ub3VzIG9uZXMuXHJcbi8vTWFwIGFsbG93cyB1cyB0byBhcHBseSBhbnkgZnVuY3Rpb24gb24gb3VyIHZhbHVlIGFuZCB0byBjb25zdW1lIHRoZSByZXN1bHQgaW4gYW5vdGhlciBmdW5jdGlvbi5cclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZSg1KVxyXG5cdFx0Lm1hcCgodmFsKSA9PiB2YWwrMSlcclxuXHRcdC5tYXAoKHZhbCkgPT4ge1xyXG5cdFx0XHRhc3NlcnQuZXF1YWwodmFsLCA2KVxyXG5cdFx0XHRyZXR1cm4gdmFsICogMlxyXG5cdFx0fSlcclxuXHRcdC5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCwgMTIpKVxyXG5cdFx0LnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgLCBleGNlcHQgdGhhdCBpZiBgZnVua2AgcmV0dXJucyBhIG5ldyBzdGF0ZSBvYmplY3QgaXQgbWVyZ2VzIHRoZSB0d28gc3RhdGVzIGludG8gb25lLlxyXG5UaHVzIGBmbGF0TWFwYCBzaW11bGF0ZXMgbWFuaXB1bGF0aW9uIG9mIG11dGFibGUgc3RhdGUuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL0ZvciBleGFtcGxlLCBoZXJlIGlzIGEgZnVuY3Rpb24gdGhhdCBcclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZShcInZhbHVlXCIpXHJcblx0XHQvL1dyaXRlIHRoZSB2YWx1ZSBpbiB0aGUgc3RhdGVcclxuXHRcdC5waGF0TWFwKCB2YWx1ZSA9PiBzdGF0ZSggXyA9PiBbXCJuZXcgXCIrdmFsdWUgLCBcImluaXRpYWwgXCIrdmFsdWVdKSApXHJcblxyXG5cdFx0Ly9tYW5pcHVsYXRlIHRoZSB2YWx1ZVxyXG5cdFx0LnBoYXRNYXAoIHZhbCA9PiB2YWwudG9VcHBlckNhc2UoKS5zcGxpdChcIlwiKS5qb2luKFwiLVwiKSApXHJcblx0XHRcclxuXHRcdC8vV2UgY2FuIGFjY2VzcyB0aGUgc3RhdGUgYXQgYW55IHRpbWUuXHJcblx0XHQucGhhdE1hcCggdmFsID0+IHN0YXRlKHN0ID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKCB2YWwsIFwiTi1FLVctIC1WLUEtTC1VLUVcIilcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKCBzdCwgXCJpbml0aWFsIHZhbHVlXCIpXHJcblx0XHR9KSkucnVuKClcclxufSkvLy0tXHJcblxyXG4vKlxyXG5cclxuYHNhdmUoKSAvIGxvYWQoKWBcclxuLS0tLVxyXG5TaG9ydGhhbmRzIGZvciB0aGUgbW9zdCBjb21tb24gc3RhdGUgb3BlcmF0aW9uczogXHJcbi0gYHNhdmVgIGNvcGllcyB0aGUgY3VycmVudGx5IGVuY2Fwc3VsYXRlZCB2YWx1ZSBpbnRvIHRoZSBzdGF0ZVxyXG4tIGBsb2FkYCBqdXN0IHJldHVybnMgdGhlIGN1cnJlbnQgc3RhdGVcclxuKioqXHJcbiovXHJcblxyXG5cclxuUVVuaXQudGVzdChcInNhdmUvbG9hZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcblx0dmFyIG15U3RhdGUgPSBzdGF0ZSg1KVxyXG5cdC5waGF0TWFwKCAodmFsKSA9PiB2YWwrMSApIC8vNlxyXG5cdC5zYXZlS2V5KFwic3QxXCIpXHJcblx0XHJcblx0LnBoYXRNYXAoICh2YWwpID0+IHZhbCoyICkvLzEyXHJcblx0LnNhdmVLZXkoXCJzdDJcIilcclxuXHRcclxuXHQubG9hZCgpXHJcblx0Lm1hcCggKHN0YXRlKSA9PiB7XHJcblx0XHRhc3NlcnQuZXF1YWwoc3RhdGUuc3QxLCA2KVxyXG5cdFx0YXNzZXJ0LmVxdWFsKHN0YXRlLnN0MiwgMTIpXHJcblx0fSkucnVuKClcclxufSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG5cclxuXHJcbiIsIlxyXG4vKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IHN0cmVhbSBcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBzdHJlYW1gIHR5cGUsIGFsc28ga25vd24gYXMgYSBsYXp5IGxpc3QgaXMgYSBjb250YWluZXIgZm9yIGEgbGlzdCBvZiB2YWx1ZXMgd2hpY2ggY29tZSBhc3luY2hyb25vdXNseS5cclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcInN0cmVhbVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBzdHJlYW1gIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdHZhciBzdHJlYW0gPSByZXF1aXJlKFwiLi4vbGlicmFyeS9zdHJlYW1cIilcclxuXHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIikvLy0tXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVG8gY3JlYXRlIGEgYHN0cmVhbWAgcGFzcyBhIGZ1bmN0aW9uIHdoaWNoIGFjY2VwdHMgYSBjYWxsYmFjayBhbmQgY2FsbHMgdGhhdCBjYWxsYmFjayB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWU6XHJcblxyXG5cdGNvbnN0IGNsaWNrU3RyZWFtID0gc3RyZWFtKCAocHVzaCkgPT4geyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHB1c2gpfSlcclxuXHR3aW5kb3cuY2xpY2tTdHJlYW0gPSBjbGlja1N0cmVhbVxyXG5cclxuLy8gTGlrZSBwcm9taXNlcywgc3RyZWFtcyBhcmUgYWxzbyBjcmVhdGVkIHdpdGggYSBoZWxwZXJcclxuXHJcblx0Y29uc3QgY291bnRUbyA9IChyYW5nZSkgPT4gc3RyZWFtKCAocHVzaCkgPT4ge1xyXG5cdFx0Zm9yIChsZXQgaSA9IDE7IGk8PSByYW5nZTsgaSsrKXtcclxuXHRcdFx0cHVzaChpKVxyXG5cdFx0fVxyXG5cdH0pXHJcbi8qXHJcbmBydW4oKWBcclxuLS0tLVxyXG5FeGVjdXRlcyB0aGUgc3RyZWFtIGFuZCBmZXRjaGVzIHRoZSBkYXRhLlxyXG5cclxuKioqXHJcblxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcblJldHVybnMgYSBuZXcgc3RyZWFtLCB3aGljaCBhcHBsaWVzIGBmdW5rYCB0byB0aGUgZGF0YSB3aGVuIHlvdSBydW4gaXQuXHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0Y29uc3Qgc3RvcCA9IGFzc2VydC5hc3luYygpLy8tLVxyXG5cdHZhciBwdXNoVG9TdHJlYW0gPSB1bmRlZmluZWRcclxuXHRjb25zdCBteVN0cmVhbSA9IHN0cmVhbShwdXNoID0+eyBwdXNoVG9TdHJlYW0gPSBwdXNofSlcclxuXHRcdC5tYXAodmFsID0+IHZhbCoyKVxyXG5cdFx0Lm1hcCh2YWwgPT4gYXNzZXJ0LmVxdWFsKHZhbCwgMTApKVxyXG5cdFx0LnJ1bigpXHJcblx0XHJcblx0cHVzaFRvU3RyZWFtKDUpXHJcblx0c3RvcCgpXHJcbn0pLy8tLVxyXG5cclxuXHJcbi8qXHJcbmBwaGF0TWFwKGZ1bmspYFxyXG4tLS0tXHJcbkEgbW9yZSBwb3dlcmZ1bCB2ZXJzaW9uIG9mIGBtYXBgIHdoaWNoIGNhbiBhbGxvd3MgeW91IHRvIGNoYWluIHNldmVyYWwgc3RlcHMgb2YgdGhlIGFzeWNocm9ub3VzIGNvbXB1dGF0aW9ucyB0b2dldGhlci5cclxuS25vd24gYXMgYHRoZW5gIGZvciB0cmFkaXRpb25hbCBzdHJlYW0gbGlicmFyaWVzLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG4vL1FVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdC8vY29uc3QgZG9uZSA9IGFzc2VydC5hc3luYygpLy8tLVx0XHJcbi8vfSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcbiJdfQ==
