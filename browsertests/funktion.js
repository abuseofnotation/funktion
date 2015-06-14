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

},{"./helpers":2}],5:[function(require,module,exports){
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

},{"./f":1,"./helpers":2}],6:[function(require,module,exports){
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

},{"../library/f":1}],7:[function(require,module,exports){
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

},{"../library/f":1,"../library/list":3}],8:[function(require,module,exports){
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

},{"../library/f":1,"../library/maybe":4}],9:[function(require,module,exports){
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

},{"../library/f":1,"../library/state":5}]},{},[6,7,8,9])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvaGVscGVycy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L2xpc3QuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9tYXliZS5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi9saWJyYXJ5L3N0YXRlLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL3Rlc3RzL2ZfdGVzdHMuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvbGlzdF90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9tYXliZV90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9zdGF0ZV90ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQSxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7O0FBR2xDLElBQU0sRUFBRSxHQUFHLFNBQUwsRUFBRSxDQUFHLENBQUM7UUFBSSxDQUFDO0NBQUEsQ0FBQTs7QUFFaEIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOzs7Ozs7QUFNM0MsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLEdBQUcsS0FBSyxTQUFTLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBRTtVQUFNLEdBQUc7R0FBQSxDQUFFO0VBQUE7Ozs7O0FBS2xELElBQUcsRUFBRSxhQUFTLElBQUksRUFBQzs7O0FBQ2xCLE1BQUcsSUFBSSxLQUFLLFNBQVMsRUFBQztBQUFDLFNBQU0sSUFBSSxTQUFTLEVBQUEs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TyxFQUFFLFVBQVMsTUFBTSxFQUFDOztBQUNuQyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUUsVUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUM7V0FBSyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUM7R0FBQSxDQUFFLENBQUE7O0FBRWxDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNwQixRQUFNLENBQUMsS0FBSyxDQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7QUFDN0IsUUFBTSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBRSxDQUFBOztBQUU5QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDdkIsUUFBTSxDQUFDLEtBQUssQ0FBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFFLENBQUE7QUFDN0IsUUFBTSxDQUFDLEtBQUssQ0FBRSxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFFLENBQUE7Q0FHOUIsQ0FBQyxDQUFBOzs7Ozs7OztBQVFGLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsTUFBTSxFQUFDOztBQUNoQyxNQUFNLFFBQVEsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDMUIsUUFBTSxDQUFDLEtBQUssQ0FBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7QUFDOUIsUUFBTSxDQUFDLEtBQUssQ0FBRSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFFLENBQUE7O0FBRWhDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFBO0FBQ25CLFFBQU0sQ0FBQyxLQUFLLENBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBRSxDQUFBO0FBQ3hCLFFB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LFNBQU0sQ0FBQyxLQUFLLENBQUUsR0FBRyxFQUFFLG1CQUFtQixDQUFDLENBQUE7QUFDdkMsU0FBTSxDQUFDLEtBQUssQ0FBRSxFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUE7R0FDbEMsQ0FBQztFQUFBLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtDQUNWLENBQUMsQ0FBQTs7Ozs7Ozs7Ozs7O0FBYUYsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsVUFBUyxNQUFNLEVBQUM7OztBQUV2QyxLQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQ3JCLE9BQU8sQ0FBRSxVQUFDLEdBQUc7U0FBSyxHQUFHLEdBQUMsQ0FBQztFQUFBLENBQUU7RUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUVkLE9BQU8sQ0FBRSxVQUFDLEdBQUc7U0FBSyxHQUFHLEdBQUMsQ0FBQztFQUFBLENBQUU7RUFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUVkLElBQUksRUFBRSxDQUNOLEdBQUcsQ0FBRSxVQUFDLEtBQUssRUFBSztBQUNoQixRQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUE7QUFDMUIsUUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0VBQzNCLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtDQUNSLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG5cclxuY29uc3QgaWQgPSBhID0+IGEgLy8tLVxyXG5cclxuXHR2YXIgZl9tZXRob2RzID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBpdC5cclxuLy90aGlzIGlzIHZlcnkgdXNlZnVsIGlmIHlvdSBoYXZlIGEgQVBJIHdoaWNoIGV4cGVjdHMgYSBmdW5jdGlvbiwgYnV0IHlvdSB3YW50IHRvIGZlZWQgaXQgd2l0aCBhIHZhbHVlIChzZWUgdGhlIGBmbGF0bWFwYCBleGFtcGxlKS4gXHJcblxyXG5cdFx0Ly9hLm9mKGIpIC0+IGIgYVxyXG5cdFx0b2Y6IHZhbCA9PiB2YWwgPT09IHVuZGVmaW5lZCA/IGlkIDogZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpID0+IChiIC0+IGMpID0+IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdGlmKGZ1bmsgPT09IHVuZGVmaW5lZCl7dGhyb3cgbmV3IFR5cGVFcnJvcn1cclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vYGZsYXRgIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0OiBcclxuLy8xLiBDYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCB0aGUgc3VwcGxpZWQgYXJndW1lbnRzXHJcbi8vMi4gQ2FsbHMgdGhlIHJlc3VsdGluZyBmdW5jdGlvbiAoYW5kIGl0IGhhcyB0byBiZSBvbmUpIHdpdGggdGhlIHNhbWUgYXJndW1lbnRzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkgPT4gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSwgdGhpcy5fbGVuZ3RoICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbi8vVGhpcyBpcyB0aGUgZnVuY3Rpb24gY29uc3RydWN0b3IuIEl0IHRha2VzIGEgZnVuY3Rpb24gYW5kIGFkZHMgYW4gYXVnbWVudGVkIGZ1bmN0aW9uIG9iamVjdCwgd2l0aG91dCBleHRlbmRpbmcgdGhlIHByb3RvdHlwZVxyXG5cclxuXHR2YXIgZiA9IChmdW5rID0gaWQsIGxlbmd0aCA9IGZ1bmsubGVuZ3RoLCBpbml0aWFsX2FyZ3VtZW50cyA9IFtdKSA9PiB7XHJcblxyXG5cdFx0Ly9XZSBleHBlY3QgYSBmdW5jdGlvbi4gSWYgd2UgYXJlIGdpdmVuIGFub3RoZXIgdmFsdWUsIGxpZnQgaXQgdG8gYSBmdW5jdGlvblxyXG5cdFx0aWYodHlwZW9mIGZ1bmsgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRyZXR1cm4gZigpLm9mKGZ1bmspXHJcblx0XHRcclxuXHRcdC8vSWYgdGhlIGZ1bmN0aW9uIHRha2VzIGp1c3Qgb25lIGFyZ3VtZW50LCBqdXN0IGV4dGVuZCBpdCB3aXRoIG1ldGhvZHMgYW5kIHJldHVybiBpdC5cclxuXHRcdH1lbHNlIGlmICggbGVuZ3RoIDwgMiApe1xyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kKGZ1bmssIGZfbWV0aG9kcylcclxuXHJcblx0XHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBleHRlbmRlZF9mdW5rID0gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciBhbGxfYXJndW1lbnRzICA9IChpbml0aWFsX2FyZ3VtZW50cykuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgbGVuZ3RoLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0XHR9LCBmX21ldGhvZHMpXHJcblx0XHRcdFxyXG5cdFx0XHRleHRlbmRlZF9mdW5rLl9sZW5ndGggPSBsZW5ndGggLSBpbml0aWFsX2FyZ3VtZW50cy5sZW5ndGhcclxuXHRcdFx0ZXh0ZW5kZWRfZnVuay5fb3JpZ2luYWwgPSBmdW5rXHJcblxyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kZWRfZnVua1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbi8vSGVyZSBpcyB0aGUgZnVuY3Rpb24gd2l0aCB3aGljaCB0aGUgZnVuY3Rpb24gb2JqZWN0IGlzIGV4dGVuZGVkXHJcblxyXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdFx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcblx0fVxyXG5cclxuXHRcclxuXHRmLm9mID0gdmFsID0+IGYoICgpID0+IHZhbCApLFxyXG5cclxuLy9UaGUgbGlicmFyeSBhbHNvIGZlYXR1cmVzIGEgc3RhbmRhcmQgY29tcG9zZSBmdW5jdGlvbiB3aGljaCBhbGxvd3MgeW91IHRvIG1hcCBub3JtYWwgZnVuY3Rpb25zIHdpdGggb25lIGFub3RoZXJcclxuXHJcblx0Zi5jb21wb3NlID0gZnVuY3Rpb24oKXtcclxuXHJcblx0XHQvL0NvbnZlcnQgZnVuY3Rpb25zIHRvIGFuIGFycmF5IGFuZCBmbGlwIHRoZW0gKGZvciByaWdodC10by1sZWZ0IGV4ZWN1dGlvbilcclxuXHRcdHZhciBmdW5jdGlvbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLnJldmVyc2UoKVxyXG5cdFx0Ly9DaGVjayBpZiBpbnB1dCBpcyBPSzpcclxuXHRcdGZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmspe2lmKHR5cGVvZiBmdW5rICE9PSBcImZ1bmN0aW9uXCIpe3Rocm93IG5ldyBUeXBlRXJyb3IoZnVuaytcIiBpcyBub3QgYSBmdW5jdGlvblwiICl9fSlcclxuXHRcdC8vUmV0dXJuIHRoZSBmdW5jdGlvbiB3aGljaCBjb21wb3NlcyB0aGVtXHJcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcclxuXHRcdFx0Ly9UYWtlIHRoZSBpbml0aWFsIGlucHV0XHJcblx0XHRcdHZhciBpbnB1dCA9IGFyZ3VtZW50c1xyXG5cdFx0XHR2YXIgY29udGV4dFxyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb25zLnJlZHVjZShmdW5jdGlvbihyZXR1cm5fcmVzdWx0LCBmdW5rLCBpKXsgXHJcblx0XHRcdFx0Ly9JZiB0aGlzIGlzIHRoZSBmaXJzdCBpdGVyYXRpb24sIGFwcGx5IHRoZSBhcmd1bWVudHMgdGhhdCB0aGUgdXNlciBwcm92aWRlZFxyXG5cdFx0XHRcdC8vZWxzZSB1c2UgdGhlIHJldHVybiByZXN1bHQgZnJvbSB0aGUgcHJldmlvdXMgZnVuY3Rpb25cclxuXHRcdFx0XHRyZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuayhyZXR1cm5fcmVzdWx0KSlcclxuXHRcdFx0XHQvL3JldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rLmFwcGx5KGNvbnRleHQsIFtyZXR1cm5fcmVzdWx0XSkpXHJcblx0XHRcdH0sIHVuZGVmaW5lZClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cclxuXHRtb2R1bGUuZXhwb3J0cyA9IGYvLy0tXHJcbiIsIlxyXG5cclxuZXhwb3J0cy5jcmVhdGVfY29uc3RydWN0b3IgPSBmdW5jdGlvbiBjcmVhdGVfdHlwZShtZXRob2RzKXtcclxuXHQvL1JlcGxhY2UgdGhlICdvZicgZnVuY3Rpb24gd2l0aCBhIG9uZSB0aGF0IHJldHVybnMgYSBuZXcgb2JqZWN0XHJcblx0dmFyIG9mID0gbWV0aG9kcy5vZlxyXG5cdG1ldGhvZHMub2YgPSBmdW5jdGlvbihhLGIsYyxkKXtyZXR1cm4gb2YuYXBwbHkoT2JqZWN0LmNyZWF0ZShtZXRob2RzKSwgYXJndW1lbnRzKX1cclxuXHRcclxuXHRtZXRob2RzID0gYWRkX21pc3NpbmdfbWV0aG9kcyhtZXRob2RzKVxyXG5cdFxyXG5cdHJldHVybiBtZXRob2RzLm9mO1xyXG59XHJcblxyXG52YXIgYWRkX21pc3NpbmdfbWV0aG9kcyA9IGV4cG9ydHMuYWRkX21pc3NpbmdfbWV0aG9kcyA9IGZ1bmN0aW9uKG9iail7XHJcblx0Ly9cImNoYWluXCIgQUtBIFwiZmxhdE1hcFwiIGlzIGVxdWl2YWxlbnQgdG8gbWFwIC4gam9pbiBcclxuXHRcclxuXHRvYmouY2hhaW4gPSBvYmouZmxhdE1hcCA9IGZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0aWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG5cdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmspLmZsYXQoKVxyXG5cdH1cclxuXHJcblx0LypcclxuXHRcInRoZW5cIiBBS0EgXCJwaGF0TWFwXCIgaXMgdGhlIHJlbGF4ZWQgdmVyc2lvbiBvZiBcImZsYXRNYXBcIiB3aGljaCBhY3RzIG9uIHRoZSBvYmplY3Qgb25seSBpZiB0aGUgdHlwZXMgbWF0Y2hcclxuXHRcInBoYXRNYXBcIiB0aGVyZWZvcmUgY2FuIGJlIHVzZWQgYXMgYm90aCBcIm1hcFwiIGFuZCBcImZsYXRNYXBcIiwgZXhjZXB0IGluIHRoZSBjYXNlcyB3aGVuIHlvdSBzcGVjaWZpY2FsbHkgd2FudCB0byBjcmVhdGUgYSBuZXN0ZWQgb2JqZWN0LlxyXG5cdEluIHRoZXNlIGNhc2VzIHlvdSBjYW4gZG8gc28gYnkgc2ltcGx5IHVzaW5nIFwibWFwXCIgZXhwcmljaXRseS5cclxuXHQqL1xyXG5cclxuXHRvYmoudGhlbiA9IG9iai5waGF0TWFwID0gZnVuY3Rpb24oZnVuayl7XHJcblx0XHRpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcblx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpXHJcblx0fSxcclxuXHRcclxuXHRvYmoucHJpbnQgPSBmdW5jdGlvbigpe1xyXG5cdFx0Y29uc29sZS5sb2codGhpcy50b1N0cmluZygpKVxyXG5cdFx0cmV0dXJuIHRoaXNcclxuXHR9XHJcblxyXG5cdHJldHVybiBvYmpcclxufVxyXG4iLCJcclxuXHJcbnZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKS8vLS1cclxuXHJcbnZhciBsaXN0X21ldGhvZHMgPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCBwdXRzIGl0IGluIGEgbGlzdC5cclxuXHJcblx0XHQvL2Eub2YoYikgLT4gYiBhXHJcblx0XHRvZjogdmFsID0+IGxpc3QodmFsKSxcclxuXHJcbi8vYG1hcGAgYXBwbGllcyBhIGZ1bmN0aW9uIHRvIGVhY2ggZWxlbWVudCBvZiB0aGUgbGlzdCBcclxuXHRcdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKHRoaXMsIGZ1bmspKVxyXG5cdFx0fSxcclxuXHRcdFxyXG4vL2BmbGF0YCB0YWtlcyBhIGxpc3Qgb2YgbGlzdHMgYW5kIGZsYXR0ZW5zIHRoZW0gd2l0aCBvbmUgbGV2ZWwgXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkuam9pbigpID0gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBsaXN0KCB0aGlzLnJlZHVjZSgobGlzdCwgZWxlbWVudCkgPT4gWy4uLmxpc3QsIC4uLmVsZW1lbnRdLCBbXSkgKVxyXG5cdFx0fSxcclxuXHRcdFxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgXHJcbi8vYW5kIHdpdGggaXQsIHlvdXIgZnVuayBjYW4gcmV0dXJuIGJvdGggYSBsaXN0IG9mIG9iamVjdHMgYW5kIGEgc2luZ2xlIG9iamVjdFxyXG5cclxuXHRcdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGxpc3QoIHRoaXMucmVkdWNlKChsaXN0LCBlbGVtZW50KSA9PiBcclxuXHRcdFx0XHRlbGVtZW50LmNvbnN0cnVjdG9yID09PSBBcnJheT8gWy4uLmxpc3QsIC4uLmVsZW1lbnRdIDogWy4uLmxpc3QsIGVsZW1lbnRdICwgW10pXHJcblx0XHRcdClcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcbi8vVGhpcyBpcyB0aGUgbGlzdCBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgbm9ybWFsIGFycmF5IGFuZCBhdWdtZW50cyBpdCB3aXRoIHRoZSBhYm92ZSBtZXRob2RzXHJcblxyXG5cdHZhciBsaXN0ID0gKC4uLmFyZ3MpID0+IHtcclxuXHRcdC8vQWNjZXB0IGFuIGFycmF5XHJcblx0XHRpZihhcmdzLmxlbmd0aCA9PT0gMSAmJiBhcmdzWzBdLmNvbnN0cnVjdG9yID09PSBBcnJheSApe1xyXG5cdFx0XHRyZXR1cm4gIE9iamVjdC5mcmVlemUoZXh0ZW5kKGFyZ3NbMF0sIGxpc3RfbWV0aG9kcykpXHJcblx0XHQvL0FjY2VwdCBzZXZlcmFsIGFyZ3VtZW50c1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiBPYmplY3QuZnJlZXplKGV4dGVuZChhcmdzLCBsaXN0X21ldGhvZHMpKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbi8vSGVyZSBpcyB0aGUgZnVuY3Rpb24gd2l0aCB3aGljaCB0aGUgbGlzdCBvYmplY3QgaXMgZXh0ZW5kZWRcclxuXHJcblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0XHRyZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKGZ1bmN0aW9uKG9iaiwgbWV0aG9kX25hbWUpe29ialttZXRob2RfbmFtZV0gPSBtZXRob2RzW21ldGhvZF9uYW1lXTsgcmV0dXJuIG9ian0sIG9iailcclxuXHR9XHJcbm1vZHVsZS5leHBvcnRzID0gbGlzdC8vLS1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG52YXIgbWF5YmVfcHJvdG8gPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCB3cmFwcyBpdCBpbiBhIGBtYXliZWAuXHJcbi8vSW4gdGhpcyBjYXNlIHdlIGRvIHRoaXMgYnkganVzdCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3Rvci5cclxuXHJcblx0Ly9hIC0+IG0gYVxyXG5cdG9mOmZ1bmN0aW9uKGlucHV0KXtcclxuXHRcdHJldHVybiBtYXliZShpbnB1dClcclxuXHR9LFxyXG5cclxuLy9gbWFwYCB0YWtlcyB0aGUgZnVuY3Rpb24gYW5kIGFwcGxpZXMgaXQgdG8gdGhlIHZhbHVlIGluIHRoZSBtYXliZSwgaWYgdGhlcmUgaXMgb25lLlxyXG5cclxuXHQvL20gYSAtPiAoIGEgLT4gYiApIC0+IG0gYlxyXG5cdG1hcDpmdW5jdGlvbihmdW5rKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gbWF5YmUoZnVuayh0aGlzLl92YWx1ZSkpXHJcblx0XHR9ZWxzZXtcdFxyXG5cdFx0XHRyZXR1cm4gdGhpcyBcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9gZmxhdGAgdGFrZXMgYSBtYXliZSB0aGF0IGNvbnRhaW5zIGFub3RoZXIgbWF5YmUgYW5kIGZsYXR0ZW5zIGl0LlxyXG4vL0luIHRoaXMgY2FzZSB0aGlzIG1lYW5zIGp1c3QgcmV0dXJuaW5nIHRoZSBpbm5lciB2YWx1ZS5cclxuXHJcblx0Ly9tIChtIHgpIC0+IG0geFxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL2ZpbmFsbHkgd2UgaGF2ZSBgdHJ5RmxhdGAgd2hpY2ggZG9lcyB0aGUgc2FtZSB0aGluZywgYnV0IGNoZWNrcyB0aGUgdHlwZXMgZmlyc3QuIFRoZSBzaG9ydGN1dCB0byBgbWFwKCkudHJ5RmxhdCgpYCBpcyBjYWxsZWQgYHBoYXRNYXBgIFxyXG5cclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nICYmIHRoaXMuX3ZhbHVlLmNvbnN0cnVjdG9yID09PSBtYXliZSl7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fVxyXG5cdFxyXG59KS8vLS1cclxuXHJcbi8vSW4gY2FzZSB5b3UgYXJlIGludGVyZXN0ZWQsIGhlcmUgaXMgaG93IHRoZSBtYXliZSBjb25zdHJ1Y3RvciBpcyBpbXBsZW1lbnRlZFxyXG5cclxuXHJcblx0dmFyIG1heWJlID0gZnVuY3Rpb24odmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlID09PSB1bmRlZmluZWQpe1xyXG5cdFx0XHRyZXR1cm4gbm90aGluZ1xyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHZhciBvYmogPSBPYmplY3QuY3JlYXRlKG1heWJlX3Byb3RvKVxyXG5cdFx0XHRvYmouX3ZhbHVlID0gdmFsdWVcclxuXHRcdFx0b2JqLmNvbnN0cnVjdG9yID0gbWF5YmVcclxuXHRcdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRcdHJldHVybiBvYmpcclxuXHRcdH1cclxuXHR9XHJcblxyXG52YXIgbm90aGluZyA9IE9iamVjdC5jcmVhdGUobWF5YmVfcHJvdG8pLy8tLVxyXG5ub3RoaW5nLmNvbnN0cnVjdG9yID0gbWF5YmUvLy0tXHJcbk9iamVjdC5mcmVlemUobm90aGluZykvLy0tXHJcbm1heWJlLm5vdGhpbmcgPSBub3RoaW5nLy8tLVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtYXliZS8vLS1cclxuIiwiXHJcbmNvbnN0IGYgPSByZXF1aXJlKFwiLi9mXCIpLy8tLVxyXG5cclxuY29uc3QgaGVscGVycyA9IHJlcXVpcmUoXCIuL2hlbHBlcnNcIikvLy0tXHJcblxyXG5jb25zdCBzdGF0ZVByb3RvID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL2BvZmAganVzdCB1c2VzIHRoZSBjb25zdHJ1Y3RvciBhbmQgZG9lcyBub3QgdG91Y2ggdGhlIHN0YXRlLlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24oaW5wdXQpe1xyXG5cdFx0cmV0dXJuIHN0YXRlKChwcmV2U3RhdGUpID0+IFtpbnB1dCwgcHJldlN0YXRlXSlcclxuXHR9LFxyXG5cclxuLy9gbWFwYCBpcyBkb25lIGJ5IGFwcGx5aW5nIHRoZSBmdW5jdGlvbiB0byB0aGUgdmFsdWUgYW5kIGtlZXBpbmcgdGhlIHN0YXRlIHVuY2hhbmdlZC5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRyZXR1cm4gc3RhdGUoIHRoaXMuX3J1blN0YXRlLm1hcCgoW2lucHV0LCBwcmV2U3RhdGVdKSA9PiBbZnVuayhpbnB1dCksIHByZXZTdGF0ZV0pKVxyXG5cdH0sXHJcblx0XHJcbi8vYGZsYXRgIGRvZXMgdGhlIGZvbGxvd2luZzpcclxuLy8xLiBSdW5zIHRoZSBjb2RlIHRoYXQgd2UgbG9hZGVkIGluIHRoZSBtb25hZCBzbywgZmFyICh1c2luZyB0aGUgYHJ1bmAgZnVuY3Rpb24pLlxyXG4vLzIuIFNhdmVzIHRoZSBuZXcgc3RhdGUgb2JqZWN0IGFuZCB0aGUgdmFsdWUgd2hpY2ggaXMga2VwdCBieSB0aGUgZnVuY3Rpb25zIHNvIGZhci5cclxuLy8zLiBBZnRlciBkb2luZyB0aGF0LCBpdCBhcnJhbmdlcyB0aG9zZSB0d28gY29tcG9uZW50cyAodGhlIG9iamVjdCBhbmQgdGhlIHZhbHVlKSBpbnRvIGEgeWV0IGFub3RoZXJcclxuLy9zdGF0ZSBvYmplY3QsIHdoaWNoIHJ1bnMgdGhlIG11dGF0b3IgZnVuY3Rpb24gb2YgdGhlIGZpcnN0IG9iamVjdCwgd2l0aCB0aGUgc3RhdGUgdGhhdCB3ZSBoYXZlIHNvLCBmYXJcclxuXHJcblxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0Ly9FeHRyYWN0IHN0YXRlIG11dGF0b3IgYW5kIHZhbHVlIFxyXG5cdFx0Y29uc3QgW3N0YXRlT2JqLCBjdXJyZW50U3RhdGVdID0gdGhpcy5ydW4oKVxyXG5cdFx0Ly9Db21wb3NlIHRoZSBtdXRhdG9yIGFuZCB0aGUgdmFsdWVcclxuXHRcdHJldHVybiBzdGF0ZSgoKSA9PiBzdGF0ZU9iai5fcnVuU3RhdGUoY3VycmVudFN0YXRlKSApXHJcblx0fSxcclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9FeHRyYWN0IGN1cnJlbnQgc3RhdGUgXHJcblx0XHRjb25zdCBbc3RhdGVPYmosIGN1cnJlbnRTdGF0ZV0gPSB0aGlzLnJ1bigpXHJcblx0XHRcclxuXHRcdC8vQ2hlY2sgaWYgaXQgaXMgcmVhbGx5IGEgc3RhdGVcclxuXHRcdGlmKHN0YXRlT2JqLmNvbnN0cnVjdG9yID09PSBzdGF0ZSl7XHJcblx0XHRcdHJldHVybiBzdGF0ZSgoKSA9PiBzdGF0ZU9iai5fcnVuU3RhdGUoY3VycmVudFN0YXRlKSApXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHN0YXRlKCgpID0+IFtzdGF0ZU9iaiwgY3VycmVudFN0YXRlXSlcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9XZSBoYXZlIHRoZSBgcnVuYCBmdW5jdGlvbiB3aGljaCBjb21wdXRlcyB0aGUgc3RhdGU6XHJcblxyXG5cdHJ1bjpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuX3J1blN0YXRlKClcclxuXHR9LFxyXG4vL0FuZCB0aGUgYHNhdmVgIGFuZCBgbG9hZGAgZnVuY3Rpb25zIGFyZSBleGFjdGx5IHdoYXQgb25lIHdvdWxkIGV4cGVjdFxyXG5cclxuXHRsb2FkOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHN0YXRlKCAoc3RhdGUpID0+IFtzdGF0ZSwgc3RhdGVdICkgKVxyXG5cdH0sXHJcblx0c2F2ZTpmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuIHRoaXMuZmxhdE1hcCggKHZhbHVlKSA9PiBzdGF0ZSggKHN0YXRlKSA9PiBbdmFsdWUsIHZhbHVlXSApIClcclxuXHR9LFxyXG5cdGxvYWRLZXk6ZnVuY3Rpb24oa2V5KXtcclxuXHRcdHJldHVybiB0aGlzLmZsYXRNYXAoICh2YWx1ZSkgPT4gc3RhdGUoIChzdGF0ZSkgPT4gW3N0YXRlW2tleV0sIHN0YXRlXSApIClcclxuXHR9LFxyXG5cdHNhdmVLZXk6ZnVuY3Rpb24oa2V5KXtcclxuXHRcdGNvbnN0IHdyaXRlID0gKG9iaiwga2V5LCB2YWwpID0+IHtcclxuXHRcdFx0b2JqID0gdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiA/ICBvYmogOiB7fVxyXG5cdFx0XHRvYmpba2V5XSA9IHZhbFxyXG5cdFx0XHRyZXR1cm4gb2JqXHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdGhpcy5mbGF0TWFwKCAodmFsdWUpID0+IHN0YXRlKCAoc3RhdGUpID0+IFt2YWx1ZSwgd3JpdGUoc3RhdGUsIGtleSwgdmFsdWUpXSApIClcclxuXHR9LFxyXG5cdHRvU3RyaW5nOmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5ydW4oKSlcclxuXHR9XHJcblx0XHJcbn0pXHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgc3RhdGUgY29uc3RydWN0b3IgaXMgaW1wbGVtZW50ZWRcclxuXHJcblx0Y29uc3Qgc3RhdGUgPSBmdW5jdGlvbihydW4pe1xyXG5cdFx0aWYodHlwZW9mIHJ1biAhPT0gXCJmdW5jdGlvblwiKXsgcmV0dXJuIHN0YXRlUHJvdG8ub2YocnVuKSB9XHJcblx0XHRjb25zdCBvYmogPSBPYmplY3QuY3JlYXRlKHN0YXRlUHJvdG8pXHJcblx0XHRvYmouX3J1blN0YXRlID0gZihydW4sMSlcclxuXHRcdG9iai5jb25zdHJ1Y3RvciA9IHN0YXRlXHJcblx0XHRvYmoucHJvdG90eXBlID0gc3RhdGVQcm90b1xyXG5cdFx0T2JqZWN0LmZyZWV6ZShvYmopXHJcblx0XHRyZXR1cm4gb2JqXHJcblx0fVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzdGF0ZS8vLS1cclxuIiwiLyotLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBmdW5jdGlvblxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgZnVuY3Rpb24gbW9uYWQgYXVnbWVudHMgc3RhbmRhcmQgSmF2YVNjcmlwdCBmdW5jdGlvbnMgd2l0aCBmYWNpbGl0aWVzIGZvciBjb21wb3NpdGlvbiBhbmQgY3VycnlpbmcuXHJcbjwhLS1tb3JlLS0+XHJcblxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJmdW5jdGlvbnNcIikvLy0tXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpXHJcblxyXG4vL1doZXJlIHRoZSBgLi4vYCBpcyB0aGUgbG9jYXRpb24gb2YgdGhlIG1vZHVsZS5cclxuXHJcbi8vVGhlbiB5b3Ugd2lsbCBiZSBhYmxlIHRvIGNvbnN0cnVjdCBmdW5jdGlvbnMgbGluZSB0aGlzXHJcblx0XHJcblx0XHR2YXIgcGx1c18xID0gZiggKG51bSkgPT4gbnVtKzEgKVxyXG5cclxuXHJcbi8vQWZ0ZXIgeW91IGRvIHRoYXQsIHlvdSB3aWxsIHN0aWxsIGJlIGFibGUgdG8gdXNlIGBwbHVzXzFgIGxpa2UgYSBub3JtYWwgZnVuY3Rpb24sIGJ1dCB5b3UgY2FuIGFsc28gZG8gdGhlIGZvbGxvd2luZzpcclxuXHJcblxyXG4vKlxyXG5DdXJyeWluZ1xyXG4tLS0tXHJcbldoZW4geW91IGNhbGwgYSBmdW5jdGlvbiBgZmAgd2l0aCBsZXNzIGFyZ3VtZW50cyB0aGF0IGl0IGFjY2VwdHMsIGl0IHJldHVybnMgYSBwYXJ0aWFsbHkgYXBwbGllZFxyXG4oYm91bmQpIHZlcnNpb24gb2YgaXRzZWxmIHRoYXQgbWF5IGF0IGFueSB0aW1lIGJlIGNhbGxlZCB3aXRoIHRoZSByZXN0IG9mIHRoZSBhcmd1bWVudHMuXHJcbiovXHJcblxyXG5cdFFVbml0LnRlc3QoXCJjdXJyeVwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdGNvbnN0IGFkZDMgPSBmKCAoYSxiLGMpID0+IGErYitjIClcclxuXHRcdFxyXG5cdFx0Y29uc3QgYWRkMiA9IGFkZDMoMClcclxuXHRcdGFzc2VydC5lcXVhbCggYWRkMigxLCAxKSwgMiApXHJcblx0XHRhc3NlcnQuZXF1YWwoIGFkZDIoNSwgNSksIDEwIClcclxuXHJcblx0XHRjb25zdCBwbHVzMTAgPSBhZGQyKDEwKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzMTAoNSksIDE1IClcclxuXHRcdGFzc2VydC5lcXVhbCggcGx1czEwKDEwKSwgMjAgKVxyXG5cclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG5gb2YodmFsdWUpYFxyXG4tLS0tXHJcbklmIGNhbGxlZCB3aXRoIGEgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGl0IGNvbnN0cnVjdHMgYSBmdW5jdGlvbiB0aGF0IGFsd2F5cyByZXR1cm5zIHRoYXQgdmFsdWUuXHJcbklmIGNhbGxlZCB3aXRob3V0IGFyZ3VtZW50cyBpdCByZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCBhbHdheXMgcmV0dXJucyB0aGUgYXJndW1lbnRzIGdpdmVuIHRvIGl0LlxyXG4qL1xyXG5cdFFVbml0LnRlc3QoXCJvZlwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdGNvbnN0IHJldHVybnM5ID0gZigpLm9mKDkpXHJcblx0XHRhc3NlcnQuZXF1YWwoIHJldHVybnM5KDMpLCA5IClcclxuXHRcdGFzc2VydC5lcXVhbCggcmV0dXJuczkoXCJhXCIpLCA5IClcclxuXHJcblx0XHRjb25zdCBpZCA9IGYoKS5vZigpXHJcblx0XHRhc3NlcnQuZXF1YWwoIGlkKDMpLCAzIClcclxuXHRcdGFzc2VydC5lcXVhbCggaWQoXCJhXCIpLCBcImFcIiApXHJcblxyXG5cdH0pLy8tLVxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkNyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QsIHRoZW4gY2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnQ6XHJcbiovXHJcblx0UVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdFxyXG4vL1lvdSBjYW4gY3JlYXRlIGEgRnVuY3Rpb24gTW9uYWQgYnkgcGFzc2luZyBhIG5vcm1hbCBKYXZhU2NyaXB0IGZ1bmN0aW9uIHRvIHRoZSBjb25zdHJ1Y3RvciAoeW91IGNhbiB3cml0ZSB0aGUgZnVuY3Rpb24gZGlyZWN0bHkgdGhlcmUpOlxyXG5cdFx0XHJcblx0XHR2YXIgcGx1czEgPSBmKCBudW0gPT4gbnVtKzEgKVxyXG5cclxuXHJcbi8vVGhlbiBtYWtpbmcgYW5vdGhlciBmdW5jdGlvbiBpcyBlYXN5OlxyXG5cclxuXHRcdHZhciBwbHVzMiA9IHBsdXMxLm1hcChwbHVzMSkgXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKCBwbHVzMigwKSwgMiApXHJcblx0XHRcclxuXHRcdHZhciBwbHVzNCA9IHBsdXMyLm1hcChwbHVzMilcclxuXHJcblx0XHRhc3NlcnQuZXF1YWwoIHBsdXM0KDEpLCA1IClcclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG5cclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuU2FtZSBhcyBgbWFwYCBleGNlcHQgdGhhdCBpZiBgZnVua2AgcmV0dXJucyBhbm90aGVyIGZ1bmN0aW9uIGl0IHJldHVybnMgYSB0aGlyZCBmdW5jdGlvbiB3aGljaDpcclxuMS4gQ2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGZpcnN0LlxyXG4yLiBDYWxscyBgZnVua2Agd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudFxyXG4zLiBDYWxscyB0aGUgZnVuY3Rpb24gcmV0dXJuZWQgYnkgYGZ1bmtgIHdpdGggdGhlIHNhbWUgYXJndW1lbnQgYW5kIHJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgc2Vjb25kIGNhbGwuXHJcbiovXHJcblx0UVVuaXQudGVzdChcInBoYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1lvdSBjYW4gdXNlIGBwaGF0TWFwYCB0byBtb2RlbCBzaW1wbGUgaWYtdGhlbiBzdGF0ZW1lbnRzLiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgdXNlcyBpdCBpbiBjb21iaW5hdGlvbiBvZiB0aGUgY3VycnlpbmcgZnVuY3Rpb25hbGl0eTpcclxuXHRcdFxyXG5cdFx0dmFyIGNvbmNhdCA9IGYoIChzdHIxLCBzdHIyKSA9PiBzdHIxICsgc3RyMilcclxuXHJcblx0XHR2YXIgbWFrZU1lc3NhZ2UgPSBmKHBhcnNlSW50LCAxKVxyXG5cdFx0XHQuZmxhdE1hcCgobnVtKSA9PiBpc05hTihudW0pPyBmKFwiRXJyb3IuIE5vdCBhIG51bWJlclwiKSA6IGNvbmNhdChcIlRoZSBudW1iZXIgaXMgXCIpIClcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMVwiKSwgXCJUaGUgbnVtYmVyIGlzIDFcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIjJcIiksIFwiVGhlIG51bWJlciBpcyAyXCIpXHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCJZXCIpLCBcIkVycm9yLiBOb3QgYSBudW1iZXJcIilcclxuXHJcbi8qXHJcblxyXG5gcGhhdE1hcGAgaXMgc2ltaWxhciB0byB0aGUgYD4+PWAgZnVuY3Rpb24gaW4gSGFza2VsbCwgd2hpY2ggaXMgdGhlIGJ1aWxkaW5nIGJsb2NrIG9mIHRoZSBpbmZhbW91cyBgZG9gIG5vdGF0aW9uXHJcbkl0IGNhbiBiZSB1c2VkIHRvIHdyaXRlIHByb2dyYW1zIHdpdGhvdXQgdXNpbmcgYXNzaWdubWVudC5cdFxyXG5cclxuRm9yIGV4YW1wbGUgaWYgd2UgaGF2ZSB0aGUgZm9sbG93aW5nIGZ1bmN0aW9uIGluIEhhc2tlbGw6XHJcblxyXG5cdFx0YWRkU3R1ZmYgPSBkbyAgXHJcblx0XHRcdGEgPC0gKCoyKSAgXHJcblx0XHRcdGIgPC0gKCsxMCkgIFxyXG5cdFx0XHRyZXR1cm4gKGErYilcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGFkZFN0dWZmKDMpLCAxOSlcclxuXHJcblxyXG5XaGVuIHdlIGRlc3VnYXIgaXQsIHRoaXMgYmVjb21lczpcclxuXHJcblx0XHRhZGRTdHVmZiA9ICgqMikgPj49IFxcYSAtPlxyXG5cdFx0XHRcdCgrMTApID4+PSBcXGIgLT5cclxuXHRcdFx0XHRcdHJldHVybiAoYStiKVxyXG5cclxub3IgaW4gSmF2YVNjcmlwdCB0ZXJtczpcclxuXHJcbiovXHJcblxyXG5cdFx0dmFyIGFkZFN0dWZmID0gZiggbnVtID0+IG51bSAqIDIgKVxyXG5cdFx0XHQuZmxhdE1hcCggYSA9PiBmKCBudW0gPT4gbnVtICsgMTAgKVxyXG5cdFx0XHRcdC5mbGF0TWFwKCBiID0+IGYub2YoYSArIGIpICkgXHJcblx0XHRcdClcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGFkZFN0dWZmKDMpLCAxOSlcclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG51bmRlciB0aGUgaG9vZFxyXG4tLS0tLS0tLS0tLS0tLVxyXG5MZXQncyBzZWUgaG93IHRoZSB0eXBlIGlzIGltcGxlbWVudGVkXHJcbiovXHJcblxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IGxpc3QgXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgbGlzdGAgdHlwZSwgYXVnbWVudHMgdGhlIHN0YW5kYXJkIEphdmFTY3JpcHQgYXJyYXlzLCBtYWtpbmcgdGhlbSBpbW11dGFibGUgYW5kIGFkZGluZyBhZGRpdGlvbmFsIGZ1bmN0aW9uYWxpdHkgdG8gdGhlbVxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiTGlzdFwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBsaXN0YCBtb25hZCBjb25zdHJ1Y3RvciwgeW91IGNhbiByZXF1aXJlIGl0IHVzaW5nIG5vZGU6XHJcblx0XHRcclxuXHRcdHZhciBsaXN0ID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbGlzdFwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjcmVhdGUgYSBgbGlzdGAgZnJvbSBhcnJheSBsaWtlIHRoaXNcclxuXHRcdHZhciBteV9saXN0ID0gbGlzdChbMSwyLDNdKVxyXG4vL29yIGxpa2UgdGhpczpcclxuXHRcdHZhciBteV9saXN0ID0gbGlzdCgxLDIsMylcclxuXHJcbi8qXHJcbmBtYXAoZnVuaylgXHJcbi0tLS1cclxuU3RhbmRhcmQgYXJyYXkgbWV0aG9kLiBFeGVjdXRlcyBgZnVua2AgZm9yIGVhY2ggb2YgdGhlIHZhbHVlcyBpbiB0aGUgbGlzdCBhbmQgd3JhcHMgdGhlIHJlc3VsdCBpbiBhIG5ldyBsaXN0LlxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0dmFyIHBlb3BsZSA9IGxpc3QoIHtuYW1lOlwiam9oblwiLCBhZ2U6MjQsIG9jY3VwYXRpb246XCJmYXJtZXJcIn0sIHtuYW1lOlwiY2hhcmxpZVwiLCBhZ2U6MjIsIG9jY3VwYXRpb246XCJwbHVtYmVyXCJ9KVxyXG5cdHZhciBuYW1lcyA9IHBlb3BsZS5tYXAoKHBlcnNvbikgPT4gcGVyc29uLm5hbWUgKVxyXG5cdGFzc2VydC5kZWVwRXF1YWwobmFtZXMsIFtcImpvaG5cIiwgXCJjaGFybGllXCJdKVxyXG5cclxufSkvLy0tXHJcblxyXG4vKlxyXG5gcGhhdE1hcChmdW5rKWBcclxuLS0tLVxyXG5TYW1lIGFzIGBtYXBgLCBidXQgaWYgYGZ1bmtgIHJldHVybnMgYSBsaXN0IG9yIGFuIGFycmF5IGl0IGZsYXR0ZW5zIHRoZSByZXN1bHRzIGludG8gb25lIGFycmF5XHJcblxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJmbGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFxyXG5cdHZhciBvY2N1cGF0aW9ucyA9IGxpc3QoWyBcclxuXHRcdHtvY2N1cGF0aW9uOlwiZmFybWVyXCIsIHBlb3BsZTpbXCJqb2huXCIsIFwic2FtXCIsIFwiY2hhcmxpZVwiXSB9LFxyXG5cdFx0e29jY3VwYXRpb246XCJwbHVtYmVyXCIsIHBlb3BsZTpbXCJsaXNhXCIsIFwic2FuZHJhXCJdIH0sXHJcblx0XSlcclxuXHRcclxuXHR2YXIgcGVvcGxlID0gb2NjdXBhdGlvbnMucGhhdE1hcCgob2NjdXBhdGlvbikgPT4gb2NjdXBhdGlvbi5wZW9wbGUpXHJcblx0YXNzZXJ0LmRlZXBFcXVhbChwZW9wbGUsW1wiam9oblwiLCBcInNhbVwiLCBcImNoYXJsaWVcIiwgXCJsaXNhXCIsIFwic2FuZHJhXCJdKVxyXG5cclxufSkvLy0tXHJcbi8qXHJcbnVuZGVyIHRoZSBob29kXHJcbi0tLS0tLS0tLS0tLS0tXHJcbkxldCdzIHNlZSBob3cgdGhlIHR5cGUgaXMgaW1wbGVtZW50ZWRcclxuKi9cclxuXHJcblxyXG4iLCIvKi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IG1heWJlXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuXHJcblRoZSBgbWF5YmVgIHR5cGUsIGFsc28ga25vd24gYXMgYG9wdGlvbmAgdHlwZSBpcyBhIGNvbnRhaW5lciBmb3IgYSB2YWx1ZSB0aGF0IG1heSBub3QgYmUgdGhlcmUuIFxyXG5cclxuVGhlIHB1cnBvc2Ugb2YgdGhpcyBtb25hZCBpcyB0byBlbGltaW5hdGUgdGhlIG5lZWQgZm9yIHdyaXRpbmcgYG51bGxgIGNoZWNrcy4gZnVydGhlcm1vcmUgaXQgYWxzbyBlbGltaW5hdGVzIHRoZSBwb3NzaWJpbGl0eSBvZiBtYWtpbmcgZXJyb3JzIGJ5IG1pc3NpbmcgbnVsbC1jaGVja3MuXHJcblxyXG48IS0tbW9yZS0tPlxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJNYXliZVwiKS8vLS1cclxuXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIGBtYXliZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgbWF5YmUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9tYXliZVwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byB3cmFwIGEgdmFsdWUgaW4gYG1heWJlYCB3aXRoOlxyXG5cdFx0dmFyIHZhbCA9IDQvLy0tXHJcblx0XHR2YXIgbWF5YmVfdmFsID0gbWF5YmUodmFsKVxyXG5cclxuLy9JZiB0aGUgJ3ZhbCcgaXMgZXF1YWwgdG8gKnVuZGVmaW5lZCogaXQgdGhyZWF0cyB0aGUgY29udGFpbmVyIGFzIGVtcHR5LlxyXG5cclxuLypcclxuYG1hcChmdW5rKWBcclxuLS0tLVxyXG5FeGVjdXRlcyBgZnVua2Agd2l0aCB0aGUgYG1heWJlYCdzIHZhbHVlIGFzIGFuIGFyZ3VtZW50LCBidXQgb25seSBpZiB0aGUgdmFsdWUgaXMgZGlmZmVyZW50IGZyb20gKnVuZGVmaW5lZCosIGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IG1heWJlLlxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1RyYWRpdGlvbmFsbHksIGlmIHdlIGhhdmUgYSB2YWx1ZSB0aGF0IG1heSBiZSB1bmRlZmluZWQgd2UgZG8gYSBudWxsIGNoZWNrIGJlZm9yZSBkb2luZyBzb21ldGhpbmcgd2l0aCBpdDpcclxuXHJcblx0dmFyIG9iaiA9IHt9Ly8tLVxyXG5cdHZhciBnZXRfcHJvcGVydHkgPSBmKChvYmplY3QpID0+IG9iamVjdC5wcm9wZXJ0eSkvLy0tXHJcblx0XHJcblx0dmFyIHZhbCA9IGdldF9wcm9wZXJ0eShvYmopXHJcblx0XHJcblx0aWYodmFsICE9PSB1bmRlZmluZWQpe1xyXG5cdFx0dmFsID0gdmFsLnRvU3RyaW5nKClcclxuXHR9XHJcblx0YXNzZXJ0LmVxdWFsKHZhbCwgdW5kZWZpbmVkKSBcclxuXHJcbi8vV2l0aCBgbWFwYCB0aGlzIGNhbiBiZSB3cml0dGVuIGxpa2UgdGhpc1xyXG5cclxuIFx0dmFyIG1heWJlX2dldF9wcm9wZXJ0eSA9IGdldF9wcm9wZXJ0eS5tYXAobWF5YmUpXHJcblxyXG5cdG1heWJlX2dldF9wcm9wZXJ0eShvYmopLm1hcCgodmFsKSA9PiB7XHJcblx0XHRhc3NlcnQub2soZmFsc2UpLy8tLVxyXG5cdFx0dmFsLnRvU3RyaW5nKCkvL3RoaXMgaXMgbm90IGV4ZWN1dGVkXHJcblx0fSlcclxuXHJcbi8vVGhlIGJpZ2dlc3QgYmVuZWZpdCB3ZSBnZXQgaXMgdGhhdCBpbiB0aGUgZmlyc3QgY2FzZSB3ZSBjYW4gZWFzaWx5IGZvcmdldCB0aGUgbnVsbCBjaGVjazpcclxuXHRcclxuXHRhc3NlcnQudGhyb3dzKGZ1bmN0aW9uKCl7XHJcblx0XHRnZXRfcHJvcGVydHkob2JqKS50b1N0cmluZygpICAvL3RoaXMgYmxvd3MgdXBcclxuXHR9KVxyXG5cclxuLy9XaGlsZSBpbiB0aGUgc2Vjb25kIGNhc2Ugd2UgY2Fubm90IGFjY2VzcyB0aGUgdW5kZXJseWluZyB2YWx1ZSBkaXJlY3RseSwgYW5kIHRoZXJlZm9yZSBjYW5ub3QgZXhlY3V0ZSBhbiBhY3Rpb24gb24gaXQsIGlmIGl0IGlzIG5vdCB0aGVyZS5cclxuXHJcbn0pLy8tLVxyXG5cclxuLypcclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuXHJcblNhbWUgYXMgYG1hcGAsIGJ1dCBpZiBgZnVua2AgcmV0dXJucyBhIGBtYXliZWAgaXQgZmxhdHRlbnMgdGhlIHR3byBgbWF5YmVzYCBpbnRvIG9uZS5cclxuXHJcbioqKlxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL2BtYXBgIHdvcmtzIGZpbmUgZm9yIGVsaW1pbmF0aW5nIGVycm9ycywgYnV0IGl0IGRvZXMgbm90IHNvbHZlIG9uZSBvZiB0aGUgbW9zdCBhbm5veWluZyBwcm9ibGVtcyB3aXRoIG51bGwtY2hlY2tzIC0gbmVzdGluZzpcclxuXHJcblx0dmFyIG9iaiA9IHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWxcIiB9IH1cclxuXHRcclxuXHRtYXliZShvYmopXHJcblx0XHQubWFwKCByb290ID0+IG1heWJlKHJvb3QuZmlyc3QpKVxyXG5cdFx0Lm1hcCggbWF5YmVGaXJzdCA9PiBtYXliZUZpcnN0Lm1hcCAoZmlyc3QgPT4gbWF5YmUgKG1heWJlRmlyc3Quc2Vjb25kICkgKSApIFxyXG5cdFx0Lm1hcCggbWF5YmVNYXliZVZhbHVlID0+IG1heWJlTWF5YmVWYWx1ZS5tYXAgKG1heWJlVmFsdWUgPT4gbWF5YmVWYWx1ZS5tYXAoICh2YWx1ZSk9PiggYXNzZXJ0LmVxdWFsKCB2YWwsIFwidmFsXCIpICkgKSApIClcclxuXHJcbi8vYHBoYXRNYXBgIGRvZXMgdGhlIGZsYXR0ZW5pbmcgZm9yIHVzLCBhbmQgYWxsb3dzIHVzIHRvIHdyaXRlIGNvZGUgbGlrZSB0aGlzXHJcblxyXG5cdG1heWJlKG9iailcclxuXHRcdC5mbGF0TWFwKHJvb3QgPT4gbWF5YmUocm9vdC5maXJzdCkpXHJcblx0XHQuZmxhdE1hcChmaXJzdCA9PiBtYXliZShmaXJzdC5zZWNvbmQpKVxyXG5cdFx0LmZsYXRNYXAodmFsID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKHZhbCwgXCJ2YWxcIilcclxuXHRcdH0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbkFkdmFuY2VkIFVzYWdlXHJcbi0tLS1cclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJhZHZhbmNlZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuLy8gYG1heWJlYCBjYW4gYmUgdXNlZCB3aXRoIHRoZSBmdW5jdGlvbiBtb25hZCB0byBlZmZlY3RpdmVseSBwcm9kdWNlICdzYWZlJyB2ZXJzaW9ucyBvZiBmdW5jdGlvbnNcclxuXHJcblx0dmFyIGdldCA9IGYoKHByb3AsIG9iaikgPT4gb2JqW3Byb3BdKVxyXG5cdHZhciBtYXliZUdldCA9IGdldC5tYXAobWF5YmUpXHJcblxyXG4vL1RoaXMgY29tYmluZWQgd2l0aCB0aGUgdXNlIG9mIGN1cnJ5aW5nIG1ha2VzIGZvciBhIHZlcnkgZmx1ZW50IHN0eWxlIG9mIGNvZGluZzpcclxuXHJcblx0dmFyIGdldEZpcnN0U2Vjb25kID0gKHJvb3QpID0+IG1heWJlKHJvb3QpLnBoYXRNYXAobWF5YmVHZXQoJ2ZpcnN0JykpLnBoYXRNYXAobWF5YmVHZXQoJ3NlY29uZCcpKVxyXG5cdFxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ2YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwib3RoZXJfdmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwib3RoZXJfdmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDogXCJcIiB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIndoYXRldmVyXCIpICkvL3dvbid0IGJlIGV4ZWN1dGVkIFxyXG5cclxufSkvLy0tXHJcblxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcbiIsIi8qLS0tXHJcbmNhdGVnb3J5OiB0dXRvcmlhbFxyXG50aXRsZTogc3RhdGVcclxubGF5b3V0OiBwb3N0XHJcbi0tLVxyXG5cclxuVGhlIGBzdGF0ZWAgdHlwZSwgaXMgYSBjb250YWluZXIgd2hpY2ggZW5jYXBzdWxhdGVzIGEgc3RhdGVmdWwgZnVuY3Rpb24uIEl0IGJhc2ljYWxseSBhbGxvd3MgeW91IHRvIGNvbXBvc2UgZnVuY3Rpb25zLFxyXG5saWtlIHlvdSBjYW4gZG8gd2l0aCB0aGUgYGZgIHR5cGUsIGV4Y2VwdCB3aXRoIGl0IGFueSBmdW5jdGlvbiBjYW4gYWNjZXNzIGFuIGFkZGl0aW9uYWwgXCJ2YXJpYWJsZVwiIGJlc2lkZXMgaXRzXHJcbmlucHV0IGFyZ3VtZW50KHMpIC0gdGhlIHN0YXRlLiBcclxuXHJcbjwhLS1tb3JlLS0+XHJcbiovXHJcblFVbml0Lm1vZHVsZShcIlN0YXRlXCIpLy8tLVxyXG5cclxuLy9UbyB1c2UgdGhlIGBzdGF0ZWAgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgc3RhdGUgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9zdGF0ZVwiKVxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpLy8tLVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL0luIHRoZSBjb250ZXh0IG9mIHRoaXMgdHlwZSBhIHN0YXRlIGlzIHJlcHJlc2VudGVkIGJ5IGEgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIGEgc3RhdGUgXHJcbi8vYW5kIHJldHVybnMgYSBsaXN0IHdoaWNoIGNvbnRhaW5zIGEgdmFsdWUgYW5kIGEgbmV3IHN0YXRlLiBTbyBmb3IgZXhhbXBsZTpcclxuXHJcblx0c3RhdGUoKHZhbCkgPT4gW3ZhbCsxLCB2YWxdKVxyXG5cclxuLy9DcmVhdGVzIGEgbmV3IHN0YXRlZnVsIGNvbXB1dGF0aW9uIHdoaWNoIGluY3JlbWVudHMgdGhlIGlucHV0IGFyZ3VtZW50IGFuZCB0aGVuIHNhdmVzIGl0IGluIHRoZSBzdGF0ZS5cclxuXHJcblxyXG4vKlxyXG5gb2YodmFsdWUpYFxyXG4tLS0tXHJcbkFjY2VwdHMgYSB2YWx1ZSBhbmQgd3JhcHMgaW4gYSBzdGF0ZSBjb250YWluZXJcclxuKi9cclxuXHRRVW5pdC50ZXN0KFwib2ZcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHRhc3NlcnQuZXhwZWN0KDApLy8tLVxyXG5cdFx0Y29uc3Qgc3RhdGU1ID0gc3RhdGUoKS5vZig1KVxyXG5cdH0pLy8tLVxyXG5cclxuLy9Ob3RlIHRoYXQgdGhlIGZvbGxvd2luZyBjb2RlIGRvZXMgbm90IHB1dCBgNWAgaW4gdGhlIHN0YXRlLlxyXG4vL1JhdGhlciBpdCBjcmVhdGVzIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBgNWAgYW5kIGRvZXMgbm90IGludGVyYWN0IHdpdGggdGhlIHN0YXRlLiBcclxuXHJcblxyXG4vKlxyXG5gbWFwKGZ1bmspYFxyXG4tLS0tXHJcbkV4ZWN1dGVzIGBmdW5rYCB3aXRoIHRoZSBlbmNhcHN1bGF0ZWQgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGFuZCB3cmFwcyB0aGUgcmVzdWx0IGluIGEgbmV3IGBzdGF0ZWAgb2JqZWN0LCBcclxud2l0aG91dCBhY2Nlc3NpbmcgdGhlIHN0YXRlXHJcblxyXG5cclxuKioqXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL09uZSBvZiB0aGUgbWFpbiBiZW5lZml0cyBvZiB0aGUgYHN0YXRlYCB0eXBlcyBpcyB0aGF0IGl0IGFsbG93cyB5b3UgdG8gbWl4IHB1cmUgZnVuY3Rpb25zIHdpdGggdW5wdXJlIG9uZXMsIFxyXG4vL0luIHRoZSBzYW1lIHdheSB0aGF0IHByb21pc2VzIGFsbG93IHVzIHRvIG1peCBhc3ljaHJvbm91cyBmdW5jdGlvbnMgd2l0aCBzeW5jaHJvbm91cyBvbmVzLlxyXG4vL01hcCBhbGxvd3MgdXMgdG8gYXBwbHkgYW55IGZ1bmN0aW9uIG9uIG91ciB2YWx1ZSBhbmQgdG8gY29uc3VtZSB0aGUgcmVzdWx0IGluIGFub3RoZXIgZnVuY3Rpb24uXHJcblxyXG5cdHZhciBteVN0YXRlID0gc3RhdGUoNSlcclxuXHRcdC5tYXAoKHZhbCkgPT4gdmFsKzEpXHJcblx0XHQubWFwKCh2YWwpID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKHZhbCwgNilcclxuXHRcdFx0cmV0dXJuIHZhbCAqIDJcclxuXHRcdH0pXHJcblx0XHQubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsIDEyKSlcclxuXHRcdC5ydW4oKVxyXG59KS8vLS1cclxuXHJcblxyXG4vKlxyXG5cclxuYHBoYXRNYXAoZnVuaylgXHJcbi0tLS1cclxuU2FtZSBhcyBgbWFwYCwgZXhjZXB0IHRoYXQgaWYgYGZ1bmtgIHJldHVybnMgYSBuZXcgc3RhdGUgb2JqZWN0IGl0IG1lcmdlcyB0aGUgdHdvIHN0YXRlcyBpbnRvIG9uZS5cclxuVGh1cyBgZmxhdE1hcGAgc2ltdWxhdGVzIG1hbmlwdWxhdGlvbiBvZiBtdXRhYmxlIHN0YXRlLlxyXG4qKipcclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJwaGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9Gb3IgZXhhbXBsZSwgaGVyZSBpcyBhIGZ1bmN0aW9uIHRoYXQgXHJcblxyXG5cdHZhciBteVN0YXRlID0gc3RhdGUoXCJ2YWx1ZVwiKVxyXG5cdFx0Ly9Xcml0ZSB0aGUgdmFsdWUgaW4gdGhlIHN0YXRlXHJcblx0XHQucGhhdE1hcCggdmFsdWUgPT4gc3RhdGUoIF8gPT4gW1wibmV3IFwiK3ZhbHVlICwgXCJpbml0aWFsIFwiK3ZhbHVlXSkgKVxyXG5cclxuXHRcdC8vbWFuaXB1bGF0ZSB0aGUgdmFsdWVcclxuXHRcdC5waGF0TWFwKCB2YWwgPT4gdmFsLnRvVXBwZXJDYXNlKCkuc3BsaXQoXCJcIikuam9pbihcIi1cIikgKVxyXG5cdFx0XHJcblx0XHQvL1dlIGNhbiBhY2Nlc3MgdGhlIHN0YXRlIGF0IGFueSB0aW1lLlxyXG5cdFx0LnBoYXRNYXAoIHZhbCA9PiBzdGF0ZShzdCA9PiB7XHJcblx0XHRcdGFzc2VydC5lcXVhbCggdmFsLCBcIk4tRS1XLSAtVi1BLUwtVS1FXCIpXHJcblx0XHRcdGFzc2VydC5lcXVhbCggc3QsIFwiaW5pdGlhbCB2YWx1ZVwiKVxyXG5cdFx0fSkpLnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuLypcclxuXHJcbmBzYXZlKCkgLyBsb2FkKClgXHJcbi0tLS1cclxuU2hvcnRoYW5kcyBmb3IgdGhlIG1vc3QgY29tbW9uIHN0YXRlIG9wZXJhdGlvbnM6IFxyXG4tIGBzYXZlYCBjb3BpZXMgdGhlIGN1cnJlbnRseSBlbmNhcHN1bGF0ZWQgdmFsdWUgaW50byB0aGUgc3RhdGVcclxuLSBgbG9hZGAganVzdCByZXR1cm5zIHRoZSBjdXJyZW50IHN0YXRlXHJcbioqKlxyXG4qL1xyXG5cclxuXHJcblFVbml0LnRlc3QoXCJzYXZlL2xvYWRcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG5cdHZhciBteVN0YXRlID0gc3RhdGUoNSlcclxuXHQucGhhdE1hcCggKHZhbCkgPT4gdmFsKzEgKSAvLzZcclxuXHQuc2F2ZUtleShcInN0MVwiKVxyXG5cdFxyXG5cdC5waGF0TWFwKCAodmFsKSA9PiB2YWwqMiApLy8xMlxyXG5cdC5zYXZlS2V5KFwic3QyXCIpXHJcblx0XHJcblx0LmxvYWQoKVxyXG5cdC5tYXAoIChzdGF0ZSkgPT4ge1xyXG5cdFx0YXNzZXJ0LmVxdWFsKHN0YXRlLnN0MSwgNilcclxuXHRcdGFzc2VydC5lcXVhbChzdGF0ZS5zdDIsIDEyKVxyXG5cdH0pLnJ1bigpXHJcbn0pLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cclxuXHJcblxyXG4iXX0=
