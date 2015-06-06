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

	//(a -> b).map(b -> c) = a -> c
	map: function map(funk) {
		var _this = this;

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

	//(b -> (b -> c)).join() = a -> b
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

var f = function f(_x, _x2, initial_arguments) {
	var funk = arguments[0] === undefined ? id : arguments[0];
	var length = arguments[1] === undefined ? funk.length : arguments[1];
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

				var all_arguments = (initial_arguments || []).concat(args);
				return all_arguments.length >= length ? funk.apply(undefined, _toConsumableArray(all_arguments)) : f(funk, length, all_arguments);
			}, f_methods);

			extended_funk._length = length;

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

},{"./f":1,"./maybe":4}],3:[function(require,module,exports){
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

	if (!obj.flatMap && typeof obj.map === "function" && typeof obj.flat === "function") {
		obj.chain = obj.flatMap = function (funk) {
			if (funk === undefined) {
				throw "function not defined";
			}
			return this.map(funk).flat();
		};
	}
	/*
 "then" AKA "XXX" is the relaxed version of "flatMap" which acts on the object only if the types match
 "XXX" therefore can be used as both "map" and "flatMap", except in the cases when you specifically want to create a nested object.
 In these cases you can do so by simply using "map" expricitly.
 */

	if (!obj.then && typeof obj.map === "function" && typeof obj.tryFlat === "function") {
		obj.then = obj.phatMap = function (funk) {
			if (funk === undefined) {
				throw "function not defined";
			}
			return this.map(funk).tryFlat();
		};
	}
	return obj;
};

},{}],4:[function(require,module,exports){
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

},{"./helpers":3}],5:[function(require,module,exports){
/*
---
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
		var _parseInt = function _parseInt(num) {
				return parseInt(num);
		};
		var makeMessage = f(_parseInt).flatMap(function (num) {
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

},{"../library/f":1,"../library/funktion":2}],6:[function(require,module,exports){
/*
---
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
Executes the function with the `maybe`'s value as an argument, but only if the value is different from *undefined*.

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

},{"../library/f":1,"../library/maybe":4}]},{},[5,6])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvZnVua3Rpb24uanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9oZWxwZXJzLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvbWF5YmUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvZl90ZXN0cy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9tYXliZV90ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQyxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7Ozs7Ozs7QUFPbEMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOzs7Ozs7QUFNM0MsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLENBQUMsQ0FBRTtVQUFNLEdBQUc7R0FBQSxDQUFFO0VBQUE7Ozs7O0FBS3pCLElBQUcsRUFBRSxhQUFTLElBQUksRUFBQzs7O0FBQ2xCLFNBQU8sQ0FBQyxDQUFFO3FDQUFJLElBQUk7QUFBSixRQUFJOzs7VUFBSyxJQUFJLENBQUUsdUJBQVEsSUFBSSxDQUFDLENBQUU7R0FBQSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQTtFQUM1RDs7Ozs7OztBQU9ELEtBQUksRUFBQyxnQkFBVTs7O0FBQ2QsU0FBTyxDQUFDLENBQUU7c0NBQUksSUFBSTtBQUFKLFFBQUk7OztVQUFLLHdCQUFRLElBQUksQ0FBQyxrQkFBSSxJQUFJLENBQUM7R0FBQSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsQ0FBQTtFQUM3RDs7OztBQUlE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ZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0dmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cdHZhciBmX21ldGhvZHMgPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCBjcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGl0LlxyXG4vL3RoaXMgaXMgdmVyeSB1c2VmdWwgaWYgeW91IGhhdmUgYSBhcGkgd2hpY2ggZXhwZWN0cyBhIGZ1bmN0aW9uLCBidXQgeW91IHdhbnQgdG8gZmVlZCBpdCB3aXRoIGEgdmFsdWUgKHNlZSB0aGUgYGZsYXRtYXBgIGV4YW1wbGUpLiBcclxuXHJcblx0XHQvL2Eub2YoYikgLT4gYiBhXHJcblx0XHRvZjogdmFsID0+IGYoICgpID0+IHZhbCApLFxyXG5cclxuLy9gbWFwYCBqdXN0IHdpcmVzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhbmQgdGhlIG5ldyBvbmUgdG9nZXRoZXI6XHJcblxyXG5cdFx0Ly8oYSAtPiBiKS5tYXAoYiAtPiBjKSA9IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gZnVuayggdGhpcyguLi5hcmdzKSApLCB0aGlzLl9sZW5ndGggKSBcclxuXHRcdH0sXHJcblxyXG4vL2BmbGF0YCBjcmVhdGVzIGEgZnVuY3Rpb24gdGhhdDogXHJcbi8vMS4gQ2FsbHMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIHdpdGggdGhlIHN1cHBsaWVkIGFyZ3VtZW50c1xyXG4vLzIuIENhbGxzIHRoZSByZXN1bHRpbmcgZnVuY3Rpb24gKGFuZCBpdCBoYXMgdG8gYmUgb25lKSB3aXRoIHRoZSBzYW1lIGFyZ3VtZW50c1xyXG5cclxuXHRcdC8vKGIgLT4gKGIgLT4gYykpLmpvaW4oKSA9IGEgLT4gYlxyXG5cdFx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHRoaXMoLi4uYXJncykoLi4uYXJncyksIHRoaXMuX2xlbmd0aCApIFxyXG5cdFx0fSxcclxuXHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGAgXHJcblxyXG5cdFx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gdGhpcyguLi5hcmdzKVxyXG5cdFx0XHRcdGlmKHR5cGVvZiByZXN1bHQgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdFxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdCguLi5hcmdzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSkgXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG5cdHZhciBpZCA9IGZ1bmN0aW9uKGEpe3JldHVybiBhfVxyXG5cclxuXHJcbi8vVGhpcyBpcyB0aGUgZnVuY3Rpb24gY29uc3RydWN0b3IuIEl0IHRha2VzIGEgZnVuY3Rpb24gYW5kIGFkZHMgYW4gYXVnbWVudGVkIGZ1bmN0aW9uIG9iamVjdCwgd2l0aG91dCBleHRlbmRpbmcgdGhlIHByb3RvdHlwZVxyXG5cclxuXHR2YXIgZiA9IChmdW5rID0gaWQsIGxlbmd0aCA9IGZ1bmsubGVuZ3RoLCBpbml0aWFsX2FyZ3VtZW50cykgPT4ge1xyXG5cclxuXHRcdC8vV2UgZXhwZWN0IGEgZnVuY3Rpb24uIElmIHdlIGFyZSBnaXZlbiBhbm90aGVyIHZhbHVlLCBsaWZ0IGl0IHRvIGEgZnVuY3Rpb25cclxuXHRcdGlmKHR5cGVvZiBmdW5rICE9PSAnZnVuY3Rpb24nKXtcclxuXHRcdFx0cmV0dXJuIGYoKS5vZihmdW5rKVxyXG5cdFx0XHJcblx0XHQvL0lmIHRoZSBmdW5jdGlvbiB0YWtlcyBqdXN0IG9uZSBhcmd1bWVudCwganVzdCBleHRlbmQgaXQgd2l0aCBtZXRob2RzIGFuZCByZXR1cm4gaXQuXHJcblx0XHR9ZWxzZSBpZiAoIGxlbmd0aCA8IDIgKXtcclxuXHRcdFx0cmV0dXJuIGV4dGVuZChmdW5rLCBmX21ldGhvZHMpXHJcblxyXG5cdFx0Ly9FbHNlLCByZXR1cm4gYSBjdXJyeS1jYXBhYmxlIHZlcnNpb24gb2YgdGhlIGZ1bmN0aW9uIChhZ2FpbiwgZXh0ZW5kZWQgd2l0aCB0aGUgZnVuY3Rpb24gbWV0aG9kcylcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR2YXIgZXh0ZW5kZWRfZnVuayA9IGV4dGVuZCggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0XHR2YXIgYWxsX2FyZ3VtZW50cyAgPSAoaW5pdGlhbF9hcmd1bWVudHN8fFtdKS5jb25jYXQoYXJncylcdFxyXG5cdFx0XHRcdHJldHVybiBhbGxfYXJndW1lbnRzLmxlbmd0aD49bGVuZ3RoP2Z1bmsoLi4uYWxsX2FyZ3VtZW50cyk6ZihmdW5rLCBsZW5ndGgsIGFsbF9hcmd1bWVudHMpXHJcblx0XHRcdH0sIGZfbWV0aG9kcylcclxuXHRcdFx0XHJcblx0XHRcdGV4dGVuZGVkX2Z1bmsuX2xlbmd0aCA9IGxlbmd0aFxyXG5cclxuXHRcdFx0cmV0dXJuIGV4dGVuZGVkX2Z1bmtcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGZ1bmN0aW9uIG9iamVjdCBpcyBleHRlbmRlZFxyXG5cclxuXHRmdW5jdGlvbiBleHRlbmQob2JqLCBtZXRob2RzKXtcclxuXHRcdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG5cdH1cclxuXHJcblx0XHJcblx0Zi5vZiA9IHZhbCA9PiBmKCAoKSA9PiB2YWwgKSxcclxuXHJcbi8vVGhlIGxpYnJhcnkgYWxzbyBmZWF0dXJlcyBhIHN0YW5kYXJkIGNvbXBvc2UgZnVuY3Rpb24gd2hpY2ggYWxsb3dzIHlvdSB0byBtYXAgbm9ybWFsIGZ1bmN0aW9ucyB3aXRoIG9uZSBhbm90aGVyXHJcblxyXG5cdGYuY29tcG9zZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9Db252ZXJ0IGZ1bmN0aW9ucyB0byBhbiBhcnJheSBhbmQgZmxpcCB0aGVtIChmb3IgcmlnaHQtdG8tbGVmdCBleGVjdXRpb24pXHJcblx0XHR2YXIgZnVuY3Rpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5yZXZlcnNlKClcclxuXHRcdC8vQ2hlY2sgaWYgaW5wdXQgaXMgT0s6XHJcblx0XHRmdW5jdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmdW5rKXtpZih0eXBlb2YgZnVuayAhPT0gXCJmdW5jdGlvblwiKXt0aHJvdyBuZXcgVHlwZUVycm9yKGZ1bmsrXCIgaXMgbm90IGEgZnVuY3Rpb25cIiApfX0pXHJcblx0XHQvL1JldHVybiB0aGUgZnVuY3Rpb24gd2hpY2ggY29tcG9zZXMgdGhlbVxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vVGFrZSB0aGUgaW5pdGlhbCBpbnB1dFxyXG5cdFx0XHR2YXIgaW5wdXQgPSBhcmd1bWVudHNcclxuXHRcdFx0dmFyIGNvbnRleHRcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9ucy5yZWR1Y2UoZnVuY3Rpb24ocmV0dXJuX3Jlc3VsdCwgZnVuaywgaSl7IFxyXG5cdFx0XHRcdC8vSWYgdGhpcyBpcyB0aGUgZmlyc3QgaXRlcmF0aW9uLCBhcHBseSB0aGUgYXJndW1lbnRzIHRoYXQgdGhlIHVzZXIgcHJvdmlkZWRcclxuXHRcdFx0XHQvL2Vsc2UgdXNlIHRoZSByZXR1cm4gcmVzdWx0IGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uXHJcblx0XHRcdFx0cmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsocmV0dXJuX3Jlc3VsdCkpXHJcblx0XHRcdFx0Ly9yZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuay5hcHBseShjb250ZXh0LCBbcmV0dXJuX3Jlc3VsdF0pKVxyXG5cdFx0XHR9LCB1bmRlZmluZWQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblx0bW9kdWxlLmV4cG9ydHMgPSBmLy8tLVxyXG4iLCIvL3ZhciBtID0gcmVxdWlyZShcIi4vbVwiKVxyXG52YXIgZiA9IHJlcXVpcmUoXCIuL2ZcIilcclxudmFyIG1heWJlID0gcmVxdWlyZShcIi4vbWF5YmVcIilcclxuLy92YXIgc3RhdGUgPSByZXF1aXJlKFwiLi9zdGF0ZVwiKVxyXG4vL3ZhciBwcm9taXNlID0gcmVxdWlyZShcIi4vcHJvbWlzZVwiKVxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuLy9cdG06bSxcclxuXHRmOmYsXHJcblx0bWF5YmU6bWF5YmVcclxuLy9cdHByb21pc2U6cHJvbWlzZSxcclxuLy9cdHN0YXRlOnN0YXRlXHJcbn1cclxuXHJcbi8vd2luZG93LnByb21pc2UgPSBwcm9taXNlXHJcbndpbmRvdy5mID0gZlxyXG4vL3dpbmRvdy5tID0gbVxyXG53aW5kb3cubWF5YmUgPSBtYXliZVxyXG4vL3dpbmRvdy5zdGF0ZSA9IHN0YXRlIFxyXG4iLCJcclxuXHJcbmV4cG9ydHMuY3JlYXRlX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24gY3JlYXRlX3R5cGUobWV0aG9kcyl7XHJcblx0Ly9SZXBsYWNlIHRoZSAnb2YnIGZ1bmN0aW9uIHdpdGggYSBvbmUgdGhhdCByZXR1cm5zIGEgbmV3IG9iamVjdFxyXG5cdHZhciBvZiA9IG1ldGhvZHMub2ZcclxuXHRtZXRob2RzLm9mID0gZnVuY3Rpb24oYSxiLGMsZCl7cmV0dXJuIG9mLmFwcGx5KE9iamVjdC5jcmVhdGUobWV0aG9kcyksIGFyZ3VtZW50cyl9XHJcblx0XHJcblx0bWV0aG9kcyA9IGFkZF9taXNzaW5nX21ldGhvZHMobWV0aG9kcylcclxuXHRcclxuXHRyZXR1cm4gbWV0aG9kcy5vZjtcclxufVxyXG5cclxudmFyIGFkZF9taXNzaW5nX21ldGhvZHMgPSBleHBvcnRzLmFkZF9taXNzaW5nX21ldGhvZHMgPSBmdW5jdGlvbihvYmope1xyXG5cdC8vXCJjaGFpblwiIEFLQSBcImZsYXRNYXBcIiBpcyBlcXVpdmFsZW50IHRvIG1hcCAuIGpvaW4gXHJcblx0XHJcblx0aWYoIW9iai5mbGF0TWFwICYmIHR5cGVvZiBvYmoubWFwID09PVwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygb2JqLmZsYXQgPT09XCJmdW5jdGlvblwiKXtcclxuXHRcdG9iai5jaGFpbiA9IG9iai5mbGF0TWFwID0gZnVuY3Rpb24oZnVuayl7XHJcblx0XHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmspLmZsYXQoKX1cclxuXHR9XHJcblx0LypcclxuXHRcInRoZW5cIiBBS0EgXCJYWFhcIiBpcyB0aGUgcmVsYXhlZCB2ZXJzaW9uIG9mIFwiZmxhdE1hcFwiIHdoaWNoIGFjdHMgb24gdGhlIG9iamVjdCBvbmx5IGlmIHRoZSB0eXBlcyBtYXRjaFxyXG5cdFwiWFhYXCIgdGhlcmVmb3JlIGNhbiBiZSB1c2VkIGFzIGJvdGggXCJtYXBcIiBhbmQgXCJmbGF0TWFwXCIsIGV4Y2VwdCBpbiB0aGUgY2FzZXMgd2hlbiB5b3Ugc3BlY2lmaWNhbGx5IHdhbnQgdG8gY3JlYXRlIGEgbmVzdGVkIG9iamVjdC5cclxuXHRJbiB0aGVzZSBjYXNlcyB5b3UgY2FuIGRvIHNvIGJ5IHNpbXBseSB1c2luZyBcIm1hcFwiIGV4cHJpY2l0bHkuXHJcblx0Ki9cclxuXHJcblx0aWYoIW9iai50aGVuICYmIHR5cGVvZiBvYmoubWFwID09PVwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygb2JqLnRyeUZsYXQgPT09XCJmdW5jdGlvblwiKXtcclxuXHRcdG9iai50aGVuID0gb2JqLnBoYXRNYXAgPSBmdW5jdGlvbihmdW5rKXtcclxuXHRcdFx0aWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG5cdFx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpfVxyXG5cdH1cclxuXHRyZXR1cm4gb2JqXHJcbn1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG4vKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcblVuZGVyIHRoZSBob29kICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuLS0tLS0tLS0tLS0tLS0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5MZXQncyBzZWUgaG93IHRoaXMgdHlwZSBpcyBpbXBsZW1lbnRlZCAgICAgXHJcbiovICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuXHJcbnZhciBtYXliZV9wcm90byA9IGhlbHBlcnMuYWRkX21pc3NpbmdfbWV0aG9kcyh7Ly8tLVxyXG5cclxuLy90aGUgYG9mYCBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIHdyYXBzIGl0IGluIGEgYG1heWJlYC5cclxuLy9JbiB0aGlzIGNhc2Ugd2UgZG8gdGhpcyBieSBqdXN0IGNhbGxpbmcgdGhlIGNvbnN0cnVjdG9yLlxyXG5cclxuXHQvL2EgLT4gbSBhXHJcblx0b2Y6ZnVuY3Rpb24oaW5wdXQpe1xyXG5cdFx0cmV0dXJuIG1heWJlKGlucHV0KVxyXG5cdH0sXHJcblxyXG4vL2BtYXBgIHRha2VzIHRoZSBmdW5jdGlvbiBhbmQgYXBwbGllcyBpdCB0byB0aGUgdmFsdWUgaW4gdGhlIG1heWJlLCBpZiB0aGVyZSBpcyBvbmUuXHJcblxyXG5cdC8vbSBhIC0+ICggYSAtPiBiICkgLT4gbSBiXHJcblx0bWFwOmZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0aWYodGhpcyAhPT0gbm90aGluZyl7XHJcblx0XHRcdHJldHVybiBtYXliZShmdW5rKHRoaXMuX3ZhbHVlKSlcclxuXHRcdH1lbHNle1x0XHJcblx0XHRcdHJldHVybiB0aGlzIFxyXG5cdFx0fVxyXG5cdH0sXHJcblxyXG4vL2BmbGF0YCB0YWtlcyBhIG1heWJlIHRoYXQgY29udGFpbnMgYW5vdGhlciBtYXliZSBhbmQgZmxhdHRlbnMgaXQuXHJcbi8vSW4gdGhpcyBjYXNlIHRoaXMgbWVhbnMganVzdCByZXR1cm5pbmcgdGhlIGlubmVyIHZhbHVlLlxyXG5cclxuXHQvL20gKG0geCkgLT4gbSB4XHJcblx0ZmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0aWYodGhpcyAhPT0gbm90aGluZyl7XHJcblx0XHRcdHJldHVybiB0aGlzLl92YWx1ZVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiB0aGlzXHJcblx0XHR9XHJcblx0fSxcclxuXHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGAgXHJcblxyXG5cdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdGlmKHRoaXMgIT09IG5vdGhpbmcgJiYgdGhpcy5fdmFsdWUuY29uc3RydWN0b3IgPT09IG1heWJlKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHR9XHJcblx0XHJcbn0pLy8tLVxyXG5cclxuLy9JbiBjYXNlIHlvdSBhcmUgaW50ZXJlc3RlZCwgaGVyZSBpcyBob3cgdGhlIG1heWJlIGNvbnN0cnVjdG9yIGlzIGltcGxlbWVudGVkXHJcblxyXG5cclxuXHR2YXIgbWF5YmUgPSBmdW5jdGlvbih2YWx1ZSl7XHJcblx0XHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCl7XHJcblx0XHRcdHJldHVybiBub3RoaW5nXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0dmFyIG9iaiA9IE9iamVjdC5jcmVhdGUobWF5YmVfcHJvdG8pXHJcblx0XHRcdG9iai5fdmFsdWUgPSB2YWx1ZVxyXG5cdFx0XHRvYmouY29uc3RydWN0b3IgPSBtYXliZVxyXG5cdFx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdFx0cmV0dXJuIG9ialxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbnZhciBub3RoaW5nID0gT2JqZWN0LmNyZWF0ZShtYXliZV9wcm90bykvLy0tXHJcbm5vdGhpbmcuY29uc3RydWN0b3IgPSBtYXliZS8vLS1cclxuT2JqZWN0LmZyZWV6ZShub3RoaW5nKS8vLS1cclxubWF5YmUubm90aGluZyA9IG5vdGhpbmcvLy0tXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1heWJlLy8tLVxyXG4iLCIvKlxyXG4tLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBmdW5jdGlvblxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgZnVuY3Rpb24gbW9uYWQgYXVnbWVudHMgc3RhbmRhcmQgSmF2YVNjcmlwdCBmdW5jdGlvbnMgd2l0aCBjb21wb3NpdGlvbiBhbmQgY3VycnlpbmcuXHJcbjwhLS1tb3JlLS0+XHJcblxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJmdW5jdGlvbnNcIikvLy0tXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpXHJcblx0XHR2YXIgZnVua3Rpb24gPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mdW5rdGlvblwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjb25zdHJ1Y3QgZnVuY3Rpb25zIGxpbmUgdGhpc1xyXG5cdFxyXG5cdFx0dmFyIHBsdXNfMSA9IGYoIChudW0pID0+IG51bSsxIClcclxuXHJcblxyXG4vL0FmdGVyIHlvdSBkbyB0aGF0LCB5b3Ugd2lsbCBzdGlsbCBiZSBhYmxlIHRvIHVzZSBgcGx1c18xYCBsaWtlIGEgbm9ybWFsIGZ1bmN0aW9uLCBidXQgeW91IGNhbiBhbHNvIGRvIHRoZSBmb2xsb3dpbmc6XHJcblxyXG5cclxuLypcclxuQ3VycnlpbmdcclxuLS0tLVxyXG5XaGVuIHlvdSBjYWxsIGEgZnVuY3Rpb24gYGZgIHdpdGggbGVzcyBhcmd1bWVudHMgdGhhdCBpdCBhY2NlcHRzLCBpdCByZXR1cm5zIGEgcGFydGlhbGx5IGFwcGxpZWRcclxuKGJvdW5kKSB2ZXJzaW9uIG9mIGl0c2VsZiB0aGF0IG1heSBhdCBhbnkgdGltZSBiZSBjYWxsZWQgd2l0aCB0aGUgcmVzdCBvZiB0aGUgYXJndW1lbnRzLlxyXG4qL1xyXG5cclxuXHRRVW5pdC50ZXN0KFwiY3VycnlcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHR2YXIgYWRkXzMgPSBmKGZ1bmN0aW9uKGEsYixjKXtyZXR1cm4gYStiK2N9KVxyXG5cdFx0XHJcblx0XHR2YXIgYWRkXzIgPSBhZGRfMygwKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKHR5cGVvZiBhZGRfMiwgXCJmdW5jdGlvblwiLCBcImN1cnJpZWQgZnVuY3Rpb25zIHJldHVybiBvdGhlciBmdW5jdGlvbnMgd2hlbiB0aGUgYXJndW1lbnRzIGFyZSBub3QgZW5vdWdoXCIpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRfMigxKSgxKSwgMiwgXCJ3aGVuIHRoZSBhcmd1bWVudHMgYXJlIGVub3VnaCBhIHJlc3VsdCBpcyByZXR1cm5lZC5cIilcclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbm1hcChmdW5rKVxyXG4tLS0tXHJcbmNyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QsIHRoZW4gY2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnQ6XHJcbiovXHJcblx0UVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdFxyXG4vL1lvdSBjYW4gY3JlYXRlIGEgRnVuY3Rpb24gTW9uYWQgYnkgcGFzc2luZyBhIG5vcm1hbCBKYXZhU2NyaXB0IGZ1bmN0aW9uIHRvIHRoZSBjb25zdHJ1Y3RvciAoeW91IGNhbiB3cml0ZSB0aGUgZnVuY3Rpb24gZGlyZWN0bHkgdGhlcmUpOlxyXG5cdFx0XHJcblx0XHR2YXIgcGx1c18xID0gZiggKG51bSkgPT4gbnVtKzEgKVxyXG5cclxuXHJcbi8vVGhlbiBtYWtpbmcgYW5vdGhlciBmdW54dGlvbiBpcyBlYXN5OlxyXG5cclxuXHRcdHZhciBwbHVzXzIgPSBwbHVzXzEubWFwKHBsdXNfMSkgXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKHBsdXNfMigwKSwgMiwgXCJOZXcgZnVuY3Rpb25zIGNhbiBiZSBjb21wb3NlZCBmcm9tIG90aGVyIGZ1bmN0aW9ucy5cIilcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXNfNCA9IHBsdXNfMi5tYXAocGx1c18yKVxyXG5cclxuXHRcdGFzc2VydC5lcXVhbChwbHVzXzQoMSksIDUsIFwiY29tcG9zZWQgZnVuY3Rpb25zIGNhbiBiZSBjb21wb3NlZCBhZ2Fpbi5cIilcclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG5mbGF0TWFwKGZ1bmspXHJcbi0tLS1cclxuQSBtb3JlIHBvd2VyZnVsIHZlcnNpb24gb2YgYG1hcGAuIEFjY2VwdHMgYSBmdW5rdGlvbiB3aGljaCByZXR1cm5zIGFub3RoZXIgZnVuY3Rpb24uIFJldHVybnMgYSBmdW5jdGlvbiB3aGljaCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QsXHJcbmFuZCB0aGVuIGl0XHJcbjEuIENhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50XHJcbjIuIENhbGxzIHRoZSBmdW5jdGlvbiByZXR1cm5lZCBieSBgZnVua2AsIHdpdGggdGhlIHNhbWUgYXJndW1lbnQgYW5kIHJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgc2Vjb25kIGNhbGwuXHJcbiovXHJcblx0UVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1lvdSBjYW4gdXNlIGBmbGF0TWFwYCB0byBtb2RlbCBzaW1wbGUgaWYtdGhlbiBzdGF0ZW1lbnRzLiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgdXNlcyBpdCBpbiBjb21iaW5hdGlvbiBvZiB0aGUgY3VycnlpbmcgZnVuY3Rpb25hbGl0eTpcclxuXHRcdFxyXG5cdFx0dmFyIGNvbmNhdCA9IGYoKHN0cjEsIHN0cjIpID0+IHN0cjEgKyBzdHIyKVxyXG5cdFx0dmFyIF9wYXJzZUludCA9IChudW0pID0+IHBhcnNlSW50KG51bSlcclxuXHRcdHZhciBtYWtlTWVzc2FnZSA9IGYoX3BhcnNlSW50KS5mbGF0TWFwKChudW0pID0+IHtjb25zb2xlLmxvZyhcIm51bSBcIitudW0pOyBcclxuXHRcdHJldHVybiBpc05hTihudW0pPyBmKFwiSW52YWxpZCBudW1iZXJcIikgOiBjb25jYXQoXCJUaGUgbnVtYmVyIGlzIFwiKX0gKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIxXCIpLCBcIlRoZSBudW1iZXIgaXMgMVwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMlwiKSwgXCJUaGUgbnVtYmVyIGlzIDJcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIk5vdCBhIG51bWJlclwiKSwgXCJJbnZhbGlkIG51bWJlclwiKVxyXG5cclxuLypcclxuXHJcbmBmbGF0TWFwYCBpcyBzaW1pbGFyIHRvIHRoZSBgPj49YCBmdW5jdGlvbiBpbiBIYXNrZWxsLCB3aGljaCBpcyB0aGUgYnVpbGRpbmcgYmxvY2sgb2YgdGhlIGluZmFtb3VzIGBkb2Agbm90YXRpb25cclxuSXQgY2FuIGJlIHVzZWQgdG8gd3JpdGUgcHJvZ3JhbXMgd2l0aG91dCB1c2luZyBhc3NpZ25tZW50Llx0XHJcblxyXG5Gb3IgZXhhbXBsZSBpZiB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaW4gSGFza2VsbDpcclxuXHJcblx0XHRhZGRTdHVmZiA9IGRvICBcclxuXHRcdFx0YSA8LSAoKjIpICBcclxuXHRcdFx0YiA8LSAoKzEwKSAgXHJcblx0XHRcdHJldHVybiAoYStiKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHJcbldoZW4gd2UgZGVzdWdhciBpdCwgdGhpcyBiZWNvbWVzOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gKCoyKSA+Pj0gXFxhIC0+XHJcblx0XHRcdFx0KCsxMCkgPj49IFxcYiAtPlxyXG5cdFx0XHRcdFx0cmV0dXJuIChhK2IpXHJcblxyXG5vciBpbiBKYXZhU2NyaXB0IHRlcm1zOlxyXG5cclxuKi9cclxuXHJcblx0XHR2YXIgYWRkU3R1ZmYgPSBmKCAobnVtKSA9PiBudW0gKiAyICkuZmxhdE1hcCggKGEpID0+XHJcblx0XHRcdFx0ICBmKCAobnVtKSA9PiBudW0gKyAxMCApLmZsYXRNYXAoIChiKSA9PlxyXG5cdFx0XHRcdFx0Zi5vZihhICsgYikgKSApXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cdH0pLy8tLVxyXG4iLCIvKlxyXG4tLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBtYXliZVxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYG1heWJlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBvcHRpb25gIHR5cGUgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgdGhhdCBtYXkgbm90IGJlIHRoZXJlLiBcclxuXHJcblRoZSBwdXJwb3NlIG9mIHRoaXMgbW9uYWQgaXMgdG8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB3cml0aW5nIGBudWxsYCBjaGVja3MuIGZ1cnRoZXJtb3JlIGl0IGFsc28gZWxpbWluYXRlcyB0aGUgcG9zc2liaWxpdHkgb2YgbWFraW5nIGVycm9ycyBieSBtaXNzaW5nIG51bGwtY2hlY2tzLlxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiTWF5YmVcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgbWF5YmVgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIG1heWJlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbWF5YmVcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gd3JhcCBhIHZhbHVlIGluIGBtYXliZWAgd2l0aDpcclxuXHRcdHZhciB2YWwgPSA0Ly8tLVxyXG5cdFx0dmFyIG1heWJlX3ZhbCA9IG1heWJlKHZhbClcclxuXHJcbi8vSWYgdGhlICd2YWwnIGlzIGVxdWFsIHRvICp1bmRlZmluZWQqIGl0IHRocmVhdHMgdGhlIGNvbnRhaW5lciBhcyBlbXB0eS5cclxuXHJcbi8qXHJcbm1hcChmdW5rKVxyXG4tLS0tXHJcbkV4ZWN1dGVzIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBgbWF5YmVgJ3MgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGJ1dCBvbmx5IGlmIHRoZSB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSAqdW5kZWZpbmVkKi5cclxuXHJcbioqKlxyXG4qL1xyXG5RVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cclxuLy9UcmFkaXRpb25hbGx5LCBpZiB3ZSBoYXZlIGEgdmFsdWUgdGhhdCBtYXkgYmUgdW5kZWZpbmVkIHdlIGRvIGEgbnVsbCBjaGVjayBiZWZvcmUgZG9pbmcgc29tZXRoaW5nIHdpdGggaXQ6XHJcblxyXG5cdHZhciBvYmogPSB7fS8vLS1cclxuXHR2YXIgZ2V0X3Byb3BlcnR5ID0gZigob2JqZWN0KSA9PiBvYmplY3QucHJvcGVydHkpLy8tLVxyXG5cdFxyXG5cdHZhciB2YWwgPSBnZXRfcHJvcGVydHkob2JqKVxyXG5cdFxyXG5cdGlmKHZhbCAhPT0gdW5kZWZpbmVkKXtcclxuXHRcdHZhbCA9IHZhbC50b1N0cmluZygpXHJcblx0fVxyXG5cdGFzc2VydC5lcXVhbCh2YWwsIHVuZGVmaW5lZCkgXHJcblxyXG4vL1dpdGggYG1hcGAgdGhpcyBjYW4gYmUgd3JpdHRlbiBsaWtlIHRoaXNcclxuXHJcbiBcdHZhciBtYXliZV9nZXRfcHJvcGVydHkgPSBnZXRfcHJvcGVydHkubWFwKG1heWJlKVxyXG5cclxuXHRtYXliZV9nZXRfcHJvcGVydHkob2JqKS5tYXAoKHZhbCkgPT4ge1xyXG5cdFx0YXNzZXJ0Lm9rKGZhbHNlKS8vLS1cclxuXHRcdHZhbC50b1N0cmluZygpLy90aGlzIGlzIG5vdCBleGVjdXRlZFxyXG5cdH0pXHJcblxyXG4vL1RoZSBiaWdnZXN0IGJlbmVmaXQgd2UgZ2V0IGlzIHRoYXQgaW4gdGhlIGZpcnN0IGNhc2Ugd2UgY2FuIGVhc2lseSBmb3JnZXQgdGhlIG51bGwgY2hlY2s6XHJcblx0XHJcblx0YXNzZXJ0LnRocm93cyhmdW5jdGlvbigpe1xyXG5cdFx0Z2V0X3Byb3BlcnR5KG9iaikudG9TdHJpbmcoKSAgLy90aGlzIGJsb3dzIHVwXHJcblx0fSlcclxuXHJcbi8vV2hpbGUgaW4gdGhlIHNlY29uZCBjYXNlIHdlIGNhbm5vdCBhY2Nlc3MgdGhlIHVuZGVybHlpbmcgdmFsdWUgZGlyZWN0bHksIGFuZCB0aGVyZWZvcmUgY2Fubm90IGV4ZWN1dGUgYW4gYWN0aW9uIG9uIGl0LCBpZiBpdCBpcyBub3QgdGhlcmUuXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbnBoYXRNYXAoZnVuaylcclxuLS0tLVxyXG5cclxuU2FtZSBhcyBgbWFwYCwgYnV0IGlmIGBmdW5rYCByZXR1cm5zIGEgYG1heWJlYCBpdCBmbGF0dGVucyB0aGUgdHdvIGBtYXliZXNgIGludG8gb25lLlxyXG5cclxuKioqXHJcbiovXHJcblxyXG5RVW5pdC50ZXN0KFwiZmxhdE1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHJcbi8vYG1hcGAgd29ya3MgZmluZSBmb3IgZWxpbWluYXRpbmcgZXJyb3JzLCBidXQgZG9lcyBub3Qgc29sdmUgb25lIG9mIHRoZSBtb3N0IGFubm95aW5nIHRoaW5ncyB0aGVyZSBhcmUgd2l0aCBudWxsLWNoZWNrcyAtIG5lc3Rpbmc6XHJcblxyXG5cdHZhciBvYmogPSB7IGZpcnN0OiB7c2Vjb25kOlwidmFsXCIgfSB9XHJcblx0XHJcblx0bWF5YmUob2JqKVxyXG5cdFx0Lm1hcCggKHJvb3QpID0+IG1heWJlKHJvb3QuZmlyc3QpKVxyXG5cdFx0Lm1hcCggKG1heWJlRmlyc3QpID0+IG1heWJlRmlyc3QubWFwIChmaXJzdCA9PiBtYXliZSAoIG1heWJlRmlyc3Quc2Vjb25kICkgKSApIFxyXG5cdFx0Lm1hcCggKG1heWJlTWF5YmVWYWx1ZSkgPT4gbWF5YmVNYXliZVZhbHVlLm1hcCAoICggbWF5YmVWYWx1ZSkgPT4gbWF5YmVWYWx1ZS5tYXAoICh2YWx1ZSk9PiggYXNzZXJ0LmVxdWFsKCB2YWwsIFwidmFsXCIpICkgKSApIClcclxuXHJcbi8vYHBoYXRNYXBgIGRvZXMgdGhlIGZsYXR0ZW5pbmcgZm9yIHVzLCBhbmQgYWxsb3dzIHVzIHRvIHdyaXRlIGNvZGUgbGlrZSB0aGlzXHJcblxyXG5cdG1heWJlKG9iailcclxuXHRcdC5mbGF0TWFwKChyb290KSA9PiBtYXliZShyb290LmZpcnN0KSlcclxuXHRcdC5mbGF0TWFwKChmaXJzdCkgPT4gbWF5YmUoZmlyc3Quc2Vjb25kKSlcclxuXHRcdC5mbGF0TWFwKCh2YWwpID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKHZhbCwgXCJ2YWxcIilcclxuXHRcdH0pXHJcblxyXG59KS8vLS1cclxuXHJcbi8qXHJcbkFkdmFuY2VkIFVzYWdlXHJcbi0tLS1cclxuKi9cclxuXHJcblFVbml0LnRlc3QoXCJhZHZhbmNlZFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuLy8gYG1heWJlYCBjYW4gYmUgdXNlZCB3aXRoIHRoZSBmdW5jdGlvbiBtb25hZCB0byBlZmZlY3RpdmVseSBwcm9kdWNlICdzYWZlJyB2ZXJzaW9ucyBvZiBmdW5jdGlvbnNcclxuXHJcblx0dmFyIGdldCA9IGYoKHByb3AsIG9iaikgPT4gb2JqW3Byb3BdKVxyXG5cdHZhciBtYXliZUdldCA9IGdldC5tYXAobWF5YmUpXHJcblxyXG4vL1RoaXMgY29tYmluZWQgd2l0aCB0aGUgdXNlIG9mIGN1cnJ5aW5nIG1ha2VzIGZvciBhIHZlcnkgZmx1ZW50IHN0eWxlIG9mIGNvZGluZzpcclxuXHJcblx0dmFyIGdldEZpcnN0U2Vjb25kID0gKHJvb3QpID0+IG1heWJlKHJvb3QpLnBoYXRNYXAobWF5YmVHZXQoJ2ZpcnN0JykpLnBoYXRNYXAobWF5YmVHZXQoJ3NlY29uZCcpKVxyXG5cdFxyXG5cdGdldEZpcnN0U2Vjb25kKHsgZmlyc3Q6IHtzZWNvbmQ6XCJ2YWx1ZVwiIH0gfSkubWFwKCh2YWwpID0+IGFzc2VydC5lcXVhbCh2YWwsXCJ2YWx1ZVwiKSlcclxuXHRnZXRGaXJzdFNlY29uZCh7IGZpcnN0OiB7c2Vjb25kOlwib3RoZXJfdmFsdWVcIiB9IH0pLm1hcCgodmFsKSA9PiBhc3NlcnQuZXF1YWwodmFsLFwib3RoZXJfdmFsdWVcIikpXHJcblx0Z2V0Rmlyc3RTZWNvbmQoeyBmaXJzdDogXCJcIiB9KS5tYXAoKHZhbCkgPT4gYXNzZXJ0LmVxdWFsKHZhbCxcIndoYXRldmVyXCIpICkvL3dvbid0IGJlIGV4ZWN1dGVkIFxyXG5cclxufSkvLy0tXHJcblxyXG5cclxuXHJcbiJdfQ==
