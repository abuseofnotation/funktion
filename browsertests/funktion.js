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
		});
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
		});
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

var f = function f(_x, initial_arguments) {
	var funk = arguments[0] === undefined ? id : arguments[0];

	//We expect a function. If we are given another value, lift it to a function
	if (typeof funk !== 'function') {
		return f().of(funk)

		//If the function takes just one argument, just extend it with methods and return it.
		;
	} else if (funk.length < 2 || initial_arguments === false) {
		return extend(funk, f_methods)

		//Else, return a curry-capable version of the function (again, extended with the function methods)
		;
	} else {
		return extend(function () {
			for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
				args[_key4] = arguments[_key4];
			}

			var all_arguments = (initial_arguments || []).concat(args);
			return all_arguments.length >= funk.length ? funk.apply(undefined, _toConsumableArray(all_arguments)) : f(funk, all_arguments);
		}, f_methods);
	}
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

var helpers = require("./helpers");
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

	//'flat' takes a maybe that contains another maybe and flattens it.
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
title: Function Monad
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
title: maybe monad
layout: post
---

The `maybe` type, also known as `option` type is a container for a value that may or not be there. 

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

*/
QUnit.test("map", function (assert) {
	//--

	//If you have access to a value that may be undefined you have to do a null check before doing something with it:

	var obj = {}; //--
	var get_property = f(function (object) {
		return object.property;
	});

	var val = get_property(obj);

	if (val !== undefined) {
		val = val.toString();
	}
	assert.equal(val, undefined);

	//However we may easily forget the null check

	assert.throws(function () {
		get_property(obj).toString();
	});

	//if you use **maybe** you cannot access the underlying value directly, and therefore you cannot execute an action on it, if it is not there.

	var maybe_get_property = get_property.map(maybe);

	var function_called = false;
	maybe_get_property(obj).map(function (val) {
		assert.ok(false);
		val.toString();
	});
}); //--

/*
flatMap(funk)
----
Same as map, but allows for nes

*/

QUnit.test("flatMap", function (assert) {
	//--
	var get = f(function (prop, obj) {
		return obj[prop];
	});

	var obj = { first: { second: { third: "val" } } };

	maybe(obj).flatMap(function (obj) {
		return maybe(obj.first);
	}).flatMap(function (obj) {
		return maybe(obj.second);
	}).flatMap(function (obj) {
		return maybe(obj.third);
	}).flatMap(function (val) {
		assert.equal(val, "val");
	});

	var maybe_get = get.map(maybe);
});
//this blows up
//this is not executed

},{"../library/f":1,"../library/maybe":4}]},{},[5,6])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvZnVua3Rpb24uanMiLCJjOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9oZWxwZXJzLmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvbWF5YmUuanMiLCJjOi9naXQtcHJvamVjdHMvZnVua3Rpb24vdGVzdHMvZl90ZXN0cy5qcyIsImM6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9tYXliZV90ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7QUNBQyxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7Ozs7Ozs7QUFPbEMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOzs7Ozs7QUFNM0MsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLENBQUMsQ0FBRTtVQUFNLEdBQUc7R0FBQSxDQUFFO0VBQUE7Ozs7O0FBS3pCLElBQUcsRUFBRSxhQUFTLElBQUksRUFBQzs7O0FBQ2xCLFNBQU8sQ0FBQyxDQUFFO3FDQUFJLElBQUk7QUFBSixRQUFJOzs7VUFBSyxJQUFJLENBQUUsdUJBQVEsSUFBSSxDQUFDLENBQUU7R0FBQSxDQUFFLENBQUE7RUFDOUM7Ozs7Ozs7QUFPRCxLQUFJLEVBQUMsZ0JBQVU7OztBQUNkLFNBQU8sQ0FBQyxDQUFFO3NDQUFJLElBQUk7QUFBSixRQUFJOzs7VUFBSyx3QkFBUSxJQUFJLENBQUMsa0JBQUksSUFBSSxDQUFDO0dBQUEsQ0FBRSxDQUFBO0VBQy9DOzs7O0FBSUQsUUFBTyxFQUFDLG1CQUFVOzs7QUFDakIsU0FBTyxDQUFDLENBQUUs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SyxDQUFDLENBQUE7QUFDaEIsS0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFBO0VBQ2QsQ0FBQyxDQUFBO0NBQ0YsQ0FBQyxDQUFBOzs7Ozs7Ozs7QUFTRixLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFTLE1BQU0sRUFBQzs7QUFDckMsS0FBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLFVBQUMsSUFBSSxFQUFFLEdBQUc7U0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDO0VBQUEsQ0FBQyxDQUFBOztBQUVyQyxLQUFJLEdBQUcsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFDLE1BQU0sRUFBQyxFQUFDLEtBQUssRUFBQyxLQUFLLEVBQUMsRUFBRSxFQUFFLENBQUE7O0FBRTVDLE1BQUssQ0FBQyxHQUFHLENBQUMsQ0FDUixPQUFPLENBQUMsVUFBQyxHQUFHO1NBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7RUFBQSxDQUFDLENBQ2xDLE9BQU8sQ0FBQyxVQUFDLEdBQUc7U0FBSyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztFQUFBLENBQUMsQ0FDbkMsT0FBTyxDQUFDLFVBQUMsR0FBRztTQUFLLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0VBQUEsQ0FBQyxDQUNsQyxPQUFPLENBQUMsVUFBQyxHQUFHLEVBQUs7QUFDakIsUUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUE7RUFDeEIsQ0FBQyxDQUFBOztBQUVILEtBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7Q0FLOUIsQ0FBQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0dmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuLypcclxudW5kZXIgdGhlIGhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgdHlwZSBpcyBpbXBsZW1lbnRlZFxyXG4qL1xyXG5cdHZhciBmX21ldGhvZHMgPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoey8vLS1cclxuXHJcbi8vdGhlIGBvZmAgbWV0aG9kLCB0YWtlcyBhIHZhbHVlIGFuZCBjcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGl0LlxyXG4vL3RoaXMgaXMgdmVyeSB1c2VmdWwgaWYgeW91IGhhdmUgYSBhcGkgd2hpY2ggZXhwZWN0cyBhIGZ1bmN0aW9uLCBidXQgeW91IHdhbnQgdG8gZmVlZCBpdCB3aXRoIGEgdmFsdWUgKHNlZSB0aGUgYGZsYXRtYXBgIGV4YW1wbGUpLiBcclxuXHJcblx0XHQvL2Eub2YoYikgLT4gYiBhXHJcblx0XHRvZjogdmFsID0+IGYoICgpID0+IHZhbCApLFxyXG5cclxuLy9gbWFwYCBqdXN0IHdpcmVzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhbmQgdGhlIG5ldyBvbmUgdG9nZXRoZXI6XHJcblxyXG5cdFx0Ly8oYSAtPiBiKS5tYXAoYiAtPiBjKSA9IGEgLT4gY1xyXG5cdFx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gZnVuayggdGhpcyguLi5hcmdzKSApICkgXHJcblx0XHR9LFxyXG5cclxuLy9gZmxhdGAgY3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQ6IFxyXG4vLzEuIENhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB3aXRoIHRoZSBzdXBwbGllZCBhcmd1bWVudHNcclxuLy8yLiBDYWxscyB0aGUgcmVzdWx0aW5nIGZ1bmN0aW9uIChhbmQgaXQgaGFzIHRvIGJlIG9uZSkgd2l0aCB0aGUgc2FtZSBhcmd1bWVudHNcclxuXHJcblx0XHQvLyhiIC0+IChiIC0+IGMpKS5qb2luKCkgPSBhIC0+IGJcclxuXHRcdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiB0aGlzKC4uLmFyZ3MpKC4uLmFyZ3MpICkgXHJcblx0XHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0XHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciByZXN1bHQgPSB0aGlzKC4uLmFyZ3MpXHJcblx0XHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KSBcclxuXHRcdH1cclxuXHJcblx0fSlcclxuXHJcblx0dmFyIGlkID0gZnVuY3Rpb24oYSl7cmV0dXJuIGF9XHJcblxyXG5cclxuLy9UaGlzIGlzIHRoZSBmdW5jdGlvbiBjb25zdHJ1Y3Rvci4gSXQgdGFrZXMgYSBmdW5jdGlvbiBhbmQgYWRkcyBhbiBhdWdtZW50ZWQgZnVuY3Rpb24gb2JqZWN0LCB3aXRob3V0IGV4dGVuZGluZyB0aGUgcHJvdG90eXBlXHJcblxyXG5cdHZhciBmID0gKGZ1bmsgPSBpZCwgaW5pdGlhbF9hcmd1bWVudHMpID0+IHtcclxuXHRcdFxyXG5cdFx0Ly9XZSBleHBlY3QgYSBmdW5jdGlvbi4gSWYgd2UgYXJlIGdpdmVuIGFub3RoZXIgdmFsdWUsIGxpZnQgaXQgdG8gYSBmdW5jdGlvblxyXG5cdFx0aWYodHlwZW9mIGZ1bmsgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRyZXR1cm4gZigpLm9mKGZ1bmspXHJcblx0XHRcclxuXHRcdC8vSWYgdGhlIGZ1bmN0aW9uIHRha2VzIGp1c3Qgb25lIGFyZ3VtZW50LCBqdXN0IGV4dGVuZCBpdCB3aXRoIG1ldGhvZHMgYW5kIHJldHVybiBpdC5cclxuXHRcdH1lbHNlIGlmKGZ1bmsubGVuZ3RoIDwgMiB8fCBpbml0aWFsX2FyZ3VtZW50cyA9PT0gZmFsc2Upe1xyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kKGZ1bmssIGZfbWV0aG9kcylcclxuXHJcblx0XHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdFx0fWVsc2V7XHJcblx0XHRcdHJldHVybiBleHRlbmQoICguLi5hcmdzKSA9PiB7XHJcblx0XHRcdFx0dmFyIGFsbF9hcmd1bWVudHMgID0gKGluaXRpYWxfYXJndW1lbnRzfHxbXSkuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWZ1bmsubGVuZ3RoP2Z1bmsoLi4uYWxsX2FyZ3VtZW50cyk6ZihmdW5rLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0XHR9LCBmX21ldGhvZHMpXHJcblx0XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG4vL0hlcmUgaXMgdGhlIGZ1bmN0aW9uIHdpdGggd2hpY2ggdGhlIGZ1bmN0aW9uIG9iamVjdCBpcyBleHRlbmRlZFxyXG5cclxuXHRmdW5jdGlvbiBleHRlbmQob2JqLCBtZXRob2RzKXtcclxuXHRcdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG5cdH1cclxuXHJcblx0XHJcblx0Zi5vZiA9IHZhbCA9PiBmKCAoKSA9PiB2YWwgKSxcclxuXHJcbi8vVGhlIGxpYnJhcnkgYWxzbyBmZWF0dXJlcyBhIHN0YW5kYXJkIGNvbXBvc2UgZnVuY3Rpb24gd2hpY2ggYWxsb3dzIHlvdSB0byBtYXAgbm9ybWFsIGZ1bmN0aW9ucyB3aXRoIG9uZSBhbm90aGVyXHJcblxyXG5cdGYuY29tcG9zZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdFx0Ly9Db252ZXJ0IGZ1bmN0aW9ucyB0byBhbiBhcnJheSBhbmQgZmxpcCB0aGVtIChmb3IgcmlnaHQtdG8tbGVmdCBleGVjdXRpb24pXHJcblx0XHR2YXIgZnVuY3Rpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5yZXZlcnNlKClcclxuXHRcdC8vQ2hlY2sgaWYgaW5wdXQgaXMgT0s6XHJcblx0XHRmdW5jdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmdW5rKXtpZih0eXBlb2YgZnVuayAhPT0gXCJmdW5jdGlvblwiKXt0aHJvdyBuZXcgVHlwZUVycm9yKGZ1bmsrXCIgaXMgbm90IGEgZnVuY3Rpb25cIiApfX0pXHJcblx0XHQvL1JldHVybiB0aGUgZnVuY3Rpb24gd2hpY2ggY29tcG9zZXMgdGhlbVxyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHRcdC8vVGFrZSB0aGUgaW5pdGlhbCBpbnB1dFxyXG5cdFx0XHR2YXIgaW5wdXQgPSBhcmd1bWVudHNcclxuXHRcdFx0dmFyIGNvbnRleHRcclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9ucy5yZWR1Y2UoZnVuY3Rpb24ocmV0dXJuX3Jlc3VsdCwgZnVuaywgaSl7IFxyXG5cdFx0XHRcdC8vSWYgdGhpcyBpcyB0aGUgZmlyc3QgaXRlcmF0aW9uLCBhcHBseSB0aGUgYXJndW1lbnRzIHRoYXQgdGhlIHVzZXIgcHJvdmlkZWRcclxuXHRcdFx0XHQvL2Vsc2UgdXNlIHRoZSByZXR1cm4gcmVzdWx0IGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uXHJcblx0XHRcdFx0cmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsocmV0dXJuX3Jlc3VsdCkpXHJcblx0XHRcdFx0Ly9yZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuay5hcHBseShjb250ZXh0LCBbcmV0dXJuX3Jlc3VsdF0pKVxyXG5cdFx0XHR9LCB1bmRlZmluZWQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHJcblx0bW9kdWxlLmV4cG9ydHMgPSBmLy8tLVxyXG4iLCIvL3ZhciBtID0gcmVxdWlyZShcIi4vbVwiKVxyXG52YXIgZiA9IHJlcXVpcmUoXCIuL2ZcIilcclxudmFyIG1heWJlID0gcmVxdWlyZShcIi4vbWF5YmVcIilcclxuLy92YXIgc3RhdGUgPSByZXF1aXJlKFwiLi9zdGF0ZVwiKVxyXG4vL3ZhciBwcm9taXNlID0gcmVxdWlyZShcIi4vcHJvbWlzZVwiKVxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuLy9cdG06bSxcclxuXHRmOmYsXHJcblx0bWF5YmU6bWF5YmVcclxuLy9cdHByb21pc2U6cHJvbWlzZSxcclxuLy9cdHN0YXRlOnN0YXRlXHJcbn1cclxuXHJcbi8vd2luZG93LnByb21pc2UgPSBwcm9taXNlXHJcbndpbmRvdy5mID0gZlxyXG4vL3dpbmRvdy5tID0gbVxyXG53aW5kb3cubWF5YmUgPSBtYXliZVxyXG4vL3dpbmRvdy5zdGF0ZSA9IHN0YXRlIFxyXG4iLCJcclxuXHJcbmV4cG9ydHMuY3JlYXRlX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24gY3JlYXRlX3R5cGUobWV0aG9kcyl7XHJcblx0Ly9SZXBsYWNlIHRoZSAnb2YnIGZ1bmN0aW9uIHdpdGggYSBvbmUgdGhhdCByZXR1cm5zIGEgbmV3IG9iamVjdFxyXG5cdHZhciBvZiA9IG1ldGhvZHMub2ZcclxuXHRtZXRob2RzLm9mID0gZnVuY3Rpb24oYSxiLGMsZCl7cmV0dXJuIG9mLmFwcGx5KE9iamVjdC5jcmVhdGUobWV0aG9kcyksIGFyZ3VtZW50cyl9XHJcblx0XHJcblx0bWV0aG9kcyA9IGFkZF9taXNzaW5nX21ldGhvZHMobWV0aG9kcylcclxuXHRcclxuXHRyZXR1cm4gbWV0aG9kcy5vZjtcclxufVxyXG5cclxudmFyIGFkZF9taXNzaW5nX21ldGhvZHMgPSBleHBvcnRzLmFkZF9taXNzaW5nX21ldGhvZHMgPSBmdW5jdGlvbihvYmope1xyXG5cdC8vXCJjaGFpblwiIEFLQSBcImZsYXRNYXBcIiBpcyBlcXVpdmFsZW50IHRvIG1hcCAuIGpvaW4gXHJcblx0XHJcblx0aWYoIW9iai5mbGF0TWFwICYmIHR5cGVvZiBvYmoubWFwID09PVwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygb2JqLmZsYXQgPT09XCJmdW5jdGlvblwiKXtcclxuXHRcdG9iai5jaGFpbiA9IG9iai5mbGF0TWFwID0gZnVuY3Rpb24oZnVuayl7XHJcblx0XHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmspLmZsYXQoKX1cclxuXHR9XHJcblx0LypcclxuXHRcInRoZW5cIiBBS0EgXCJYWFhcIiBpcyB0aGUgcmVsYXhlZCB2ZXJzaW9uIG9mIFwiZmxhdE1hcFwiIHdoaWNoIGFjdHMgb24gdGhlIG9iamVjdCBvbmx5IGlmIHRoZSB0eXBlcyBtYXRjaFxyXG5cdFwiWFhYXCIgdGhlcmVmb3JlIGNhbiBiZSB1c2VkIGFzIGJvdGggXCJtYXBcIiBhbmQgXCJmbGF0TWFwXCIsIGV4Y2VwdCBpbiB0aGUgY2FzZXMgd2hlbiB5b3Ugc3BlY2lmaWNhbGx5IHdhbnQgdG8gY3JlYXRlIGEgbmVzdGVkIG9iamVjdC5cclxuXHRJbiB0aGVzZSBjYXNlcyB5b3UgY2FuIGRvIHNvIGJ5IHNpbXBseSB1c2luZyBcIm1hcFwiIGV4cHJpY2l0bHkuXHJcblx0Ki9cclxuXHJcblx0aWYoIW9iai50aGVuICYmIHR5cGVvZiBvYmoubWFwID09PVwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygb2JqLnRyeUZsYXQgPT09XCJmdW5jdGlvblwiKXtcclxuXHRcdG9iai50aGVuID0gb2JqLnBoYXRNYXAgPSBmdW5jdGlvbihmdW5rKXtcclxuXHRcdFx0aWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG5cdFx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpfVxyXG5cdH1cclxuXHRyZXR1cm4gb2JqXHJcbn1cclxuIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpXHJcbi8qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuVW5kZXIgdGhlIGhvb2QgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4tLS0tLS0tLS0tLS0tLSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbkxldCdzIHNlZSBob3cgdGhpcyB0eXBlIGlzIGltcGxlbWVudGVkICAgICBcclxuKi8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5cclxudmFyIG1heWJlX3Byb3RvID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL3RoZSBgb2ZgIG1ldGhvZCwgdGFrZXMgYSB2YWx1ZSBhbmQgd3JhcHMgaXQgaW4gYSBgbWF5YmVgLlxyXG4vL0luIHRoaXMgY2FzZSB3ZSBkbyB0aGlzIGJ5IGp1c3QgY2FsbGluZyB0aGUgY29uc3RydWN0b3IuXHJcblxyXG5cdC8vYSAtPiBtIGFcclxuXHRvZjpmdW5jdGlvbihpbnB1dCl7XHJcblx0XHRyZXR1cm4gbWF5YmUoaW5wdXQpXHJcblx0fSxcclxuXHJcbi8vYG1hcGAgdGFrZXMgdGhlIGZ1bmN0aW9uIGFuZCBhcHBsaWVzIGl0IHRvIHRoZSB2YWx1ZSBpbiB0aGUgbWF5YmUsIGlmIHRoZXJlIGlzIG9uZS5cclxuXHJcblx0Ly9tIGEgLT4gKCBhIC0+IGIgKSAtPiBtIGJcclxuXHRtYXA6ZnVuY3Rpb24oZnVuayl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nKXtcclxuXHRcdFx0cmV0dXJuIG1heWJlKGZ1bmsodGhpcy5fdmFsdWUpKVxyXG5cdFx0fWVsc2V7XHRcclxuXHRcdFx0cmV0dXJuIHRoaXMgXHJcblx0XHR9XHJcblx0fSxcclxuXHJcbi8vJ2ZsYXQnIHRha2VzIGEgbWF5YmUgdGhhdCBjb250YWlucyBhbm90aGVyIG1heWJlIGFuZCBmbGF0dGVucyBpdC5cclxuLy9JbiB0aGlzIGNhc2UgdGhpcyBtZWFucyBqdXN0IHJldHVybmluZyB0aGUgaW5uZXIgdmFsdWUuXHJcblxyXG5cdC8vbSAobSB4KSAtPiBtIHhcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRpZih0aGlzICE9PSBub3RoaW5nKXtcclxuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbHVlXHJcblx0XHR9ZWxzZXtcclxuXHRcdFx0cmV0dXJuIHRoaXNcclxuXHRcdH1cclxuXHR9LFxyXG5cclxuLy9maW5hbGx5IHdlIGhhdmUgYHRyeUZsYXRgIHdoaWNoIGRvZXMgdGhlIHNhbWUgdGhpbmcsIGJ1dCBjaGVja3MgdGhlIHR5cGVzIGZpcnN0LiBUaGUgc2hvcnRjdXQgdG8gYG1hcCgpLnRyeUZsYXQoKWAgaXMgY2FsbGVkIGBwaGF0TWFwYCBcclxuXHJcblx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0aWYodGhpcyAhPT0gbm90aGluZyAmJiB0aGlzLl92YWx1ZS5jb25zdHJ1Y3RvciA9PT0gbWF5YmUpe1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5fdmFsdWVcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gdGhpc1xyXG5cdFx0fVxyXG5cdH1cclxuXHRcclxufSkvLy0tXHJcblxyXG4vL0luIGNhc2UgeW91IGFyZSBpbnRlcmVzdGVkLCBoZXJlIGlzIGhvdyB0aGUgbWF5YmUgY29uc3RydWN0b3IgaXMgaW1wbGVtZW50ZWRcclxuXHJcbnZhciBtYXliZSA9IGZ1bmN0aW9uKHZhbHVlKXtcclxuXHRpZiAodmFsdWUgPT09IHVuZGVmaW5lZCl7XHJcblx0XHRyZXR1cm4gbm90aGluZ1xyXG5cdH1lbHNle1xyXG5cdFx0dmFyIG9iaiA9IE9iamVjdC5jcmVhdGUobWF5YmVfcHJvdG8pXHJcblx0XHRvYmouX3ZhbHVlID0gdmFsdWVcclxuXHRcdG9iai5jb25zdHJ1Y3RvciA9IG1heWJlXHJcblx0XHRPYmplY3QuZnJlZXplKG9iailcclxuXHRcdHJldHVybiBvYmpcclxuXHR9XHJcbn1cclxuXHJcbnZhciBub3RoaW5nID0gT2JqZWN0LmNyZWF0ZShtYXliZV9wcm90bykvLy0tXHJcbm5vdGhpbmcuY29uc3RydWN0b3IgPSBtYXliZS8vLS1cclxuT2JqZWN0LmZyZWV6ZShub3RoaW5nKS8vLS1cclxubWF5YmUubm90aGluZyA9IG5vdGhpbmcvLy0tXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1heWJlLy8tLVxyXG4iLCIvKlxyXG4tLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBGdW5jdGlvbiBNb25hZFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgZnVuY3Rpb24gbW9uYWQgYXVnbWVudHMgc3RhbmRhcmQgSmF2YVNjcmlwdCBmdW5jdGlvbnMgd2l0aCBjb21wb3NpdGlvbiBhbmQgY3VycnlpbmcuXHJcbjwhLS1tb3JlLS0+XHJcblxyXG4qL1xyXG5RVW5pdC5tb2R1bGUoXCJmdW5jdGlvbnNcIikvLy0tXHJcblxyXG5cclxuLy9UbyB1c2UgdGhlIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpXHJcblx0XHR2YXIgZnVua3Rpb24gPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mdW5rdGlvblwiKVxyXG5cclxuLy9XaGVyZSB0aGUgYC4uL2AgaXMgdGhlIGxvY2F0aW9uIG9mIHRoZSBtb2R1bGUuXHJcblxyXG4vL1RoZW4geW91IHdpbGwgYmUgYWJsZSB0byBjb25zdHJ1Y3QgZnVuY3Rpb25zIGxpbmUgdGhpc1xyXG5cdFxyXG5cdFx0dmFyIHBsdXNfMSA9IGYoIChudW0pID0+IG51bSsxIClcclxuXHJcblxyXG4vL0FmdGVyIHlvdSBkbyB0aGF0LCB5b3Ugd2lsbCBzdGlsbCBiZSBhYmxlIHRvIHVzZSBgcGx1c18xYCBsaWtlIGEgbm9ybWFsIGZ1bmN0aW9uLCBidXQgeW91IGNhbiBhbHNvIGRvIHRoZSBmb2xsb3dpbmc6XHJcblxyXG5cclxuLypcclxuQ3VycnlpbmdcclxuLS0tLVxyXG5XaGVuIHlvdSBjYWxsIGEgZnVuY3Rpb24gYGZgIHdpdGggbGVzcyBhcmd1bWVudHMgdGhhdCBpdCBhY2NlcHRzLCBpdCByZXR1cm5zIGEgcGFydGlhbGx5IGFwcGxpZWRcclxuKGJvdW5kKSB2ZXJzaW9uIG9mIGl0c2VsZiB0aGF0IG1heSBhdCBhbnkgdGltZSBiZSBjYWxsZWQgd2l0aCB0aGUgcmVzdCBvZiB0aGUgYXJndW1lbnRzLlxyXG4qL1xyXG5cclxuXHRRVW5pdC50ZXN0KFwiY3VycnlcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0XHR2YXIgYWRkXzMgPSBmKGZ1bmN0aW9uKGEsYixjKXtyZXR1cm4gYStiK2N9KVxyXG5cdFx0XHJcblx0XHR2YXIgYWRkXzIgPSBhZGRfMygwKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKHR5cGVvZiBhZGRfMiwgXCJmdW5jdGlvblwiLCBcImN1cnJpZWQgZnVuY3Rpb25zIHJldHVybiBvdGhlciBmdW5jdGlvbnMgd2hlbiB0aGUgYXJndW1lbnRzIGFyZSBub3QgZW5vdWdoXCIpXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRfMigxKSgxKSwgMiwgXCJ3aGVuIHRoZSBhcmd1bWVudHMgYXJlIGVub3VnaCBhIHJlc3VsdCBpcyByZXR1cm5lZC5cIilcclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbm1hcChmdW5rKVxyXG4tLS0tXHJcbmNyZWF0ZXMgYSBuZXcgZnVuY3Rpb24gdGhhdCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QsIHRoZW4gY2FsbHMgYGZ1bmtgIHdpdGggdGhlIHJlc3VsdCBvZiB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYXMgYW4gYXJndW1lbnQ6XHJcbiovXHJcblx0UVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdFxyXG4vL1lvdSBjYW4gY3JlYXRlIGEgRnVuY3Rpb24gTW9uYWQgYnkgcGFzc2luZyBhIG5vcm1hbCBKYXZhU2NyaXB0IGZ1bmN0aW9uIHRvIHRoZSBjb25zdHJ1Y3RvciAoeW91IGNhbiB3cml0ZSB0aGUgZnVuY3Rpb24gZGlyZWN0bHkgdGhlcmUpOlxyXG5cdFx0XHJcblx0XHR2YXIgcGx1c18xID0gZiggKG51bSkgPT4gbnVtKzEgKVxyXG5cclxuXHJcbi8vVGhlbiBtYWtpbmcgYW5vdGhlciBmdW54dGlvbiBpcyBlYXN5OlxyXG5cclxuXHRcdHZhciBwbHVzXzIgPSBwbHVzXzEubWFwKHBsdXNfMSkgXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKHBsdXNfMigwKSwgMiwgXCJOZXcgZnVuY3Rpb25zIGNhbiBiZSBjb21wb3NlZCBmcm9tIG90aGVyIGZ1bmN0aW9ucy5cIilcclxuXHRcdFxyXG5cdFx0dmFyIHBsdXNfNCA9IHBsdXNfMi5tYXAocGx1c18yKVxyXG5cclxuXHRcdGFzc2VydC5lcXVhbChwbHVzXzQoMSksIDUsIFwiY29tcG9zZWQgZnVuY3Rpb25zIGNhbiBiZSBjb21wb3NlZCBhZ2Fpbi5cIilcclxuXHJcblx0fSkvLy0tXHJcblxyXG4vKlxyXG5mbGF0TWFwKGZ1bmspXHJcbi0tLS1cclxuQSBtb3JlIHBvd2VyZnVsIHZlcnNpb24gb2YgYG1hcGAuIEFjY2VwdHMgYSBmdW5rdGlvbiB3aGljaCByZXR1cm5zIGFub3RoZXIgZnVuY3Rpb24uIFJldHVybnMgYSBmdW5jdGlvbiB3aGljaCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gZmlyc3QsXHJcbmFuZCB0aGVuIGl0XHJcbjEuIENhbGxzIGBmdW5rYCB3aXRoIHRoZSByZXN1bHQgb2YgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFzIGFuIGFyZ3VtZW50XHJcbjIuIENhbGxzIHRoZSBmdW5jdGlvbiByZXR1cm5lZCBieSBgZnVua2AsIHdpdGggdGhlIHNhbWUgYXJndW1lbnQgYW5kIHJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgc2Vjb25kIGNhbGwuXHJcbiovXHJcblx0UVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1lvdSBjYW4gdXNlIGBmbGF0TWFwYCB0byBtb2RlbCBzaW1wbGUgaWYtdGhlbiBzdGF0ZW1lbnRzLiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgdXNlcyBpdCBpbiBjb21iaW5hdGlvbiBvZiB0aGUgY3VycnlpbmcgZnVuY3Rpb25hbGl0eTpcclxuXHRcdFxyXG5cdFx0dmFyIGNvbmNhdCA9IGYoKHN0cjEsIHN0cjIpID0+IHN0cjEgKyBzdHIyKVxyXG5cdFx0dmFyIF9wYXJzZUludCA9IChudW0pID0+IHBhcnNlSW50KG51bSlcclxuXHRcdHZhciBtYWtlTWVzc2FnZSA9IGYoX3BhcnNlSW50KS5mbGF0TWFwKChudW0pID0+IHtjb25zb2xlLmxvZyhcIm51bSBcIitudW0pOyBcclxuXHRcdHJldHVybiBpc05hTihudW0pPyBmKFwiSW52YWxpZCBudW1iZXJcIikgOiBjb25jYXQoXCJUaGUgbnVtYmVyIGlzIFwiKX0gKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIxXCIpLCBcIlRoZSBudW1iZXIgaXMgMVwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMlwiKSwgXCJUaGUgbnVtYmVyIGlzIDJcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIk5vdCBhIG51bWJlclwiKSwgXCJJbnZhbGlkIG51bWJlclwiKVxyXG5cclxuLypcclxuXHJcbmBmbGF0TWFwYCBpcyBzaW1pbGFyIHRvIHRoZSBgPj49YCBmdW5jdGlvbiBpbiBIYXNrZWxsLCB3aGljaCBpcyB0aGUgYnVpbGRpbmcgYmxvY2sgb2YgdGhlIGluZmFtb3VzIGBkb2Agbm90YXRpb25cclxuSXQgY2FuIGJlIHVzZWQgdG8gd3JpdGUgcHJvZ3JhbXMgd2l0aG91dCB1c2luZyBhc3NpZ25tZW50Llx0XHJcblxyXG5Gb3IgZXhhbXBsZSBpZiB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaW4gSGFza2VsbDpcclxuXHJcblx0XHRhZGRTdHVmZiA9IGRvICBcclxuXHRcdFx0YSA8LSAoKjIpICBcclxuXHRcdFx0YiA8LSAoKzEwKSAgXHJcblx0XHRcdHJldHVybiAoYStiKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHJcbldoZW4gd2UgZGVzdWdhciBpdCwgdGhpcyBiZWNvbWVzOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gKCoyKSA+Pj0gXFxhIC0+XHJcblx0XHRcdFx0KCsxMCkgPj49IFxcYiAtPlxyXG5cdFx0XHRcdFx0cmV0dXJuIChhK2IpXHJcblxyXG5vciBpbiBKYXZhU2NyaXB0IHRlcm1zOlxyXG5cclxuKi9cclxuXHJcblx0XHR2YXIgYWRkU3R1ZmYgPSBmKCAobnVtKSA9PiBudW0gKiAyICkuZmxhdE1hcCggKGEpID0+XHJcblx0XHRcdFx0ICBmKCAobnVtKSA9PiBudW0gKyAxMCApLmZsYXRNYXAoIChiKSA9PlxyXG5cdFx0XHRcdFx0Zi5vZihhICsgYikgKSApXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cdH0pLy8tLVxyXG4iLCIvKlxyXG4tLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBtYXliZSBtb25hZFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcblxyXG5UaGUgYG1heWJlYCB0eXBlLCBhbHNvIGtub3duIGFzIGBvcHRpb25gIHR5cGUgaXMgYSBjb250YWluZXIgZm9yIGEgdmFsdWUgdGhhdCBtYXkgb3Igbm90IGJlIHRoZXJlLiBcclxuXHJcblRoZSBwdXJwb3NlIG9mIHRoaXMgbW9uYWQgaXMgdG8gZWxpbWluYXRlIHRoZSBuZWVkIGZvciB3cml0aW5nIGBudWxsYCBjaGVja3MuIGZ1cnRoZXJtb3JlIGl0IGFsc28gZWxpbWluYXRlcyB0aGUgcG9zc2liaWxpdHkgb2YgbWFraW5nIGVycm9ycyBieSBtaXNzaW5nIG51bGwtY2hlY2tzLlxyXG5cclxuPCEtLW1vcmUtLT5cclxuKi9cclxuUVVuaXQubW9kdWxlKFwiTWF5YmVcIikvLy0tXHJcblxyXG5cclxuXHJcbi8vVG8gdXNlIHRoZSBgbWF5YmVgIG1vbmFkIGNvbnN0cnVjdG9yLCB5b3UgY2FuIHJlcXVpcmUgaXQgdXNpbmcgbm9kZTpcclxuXHRcdFxyXG5cdFx0dmFyIG1heWJlID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvbWF5YmVcIilcclxuXHRcdHZhciBmID0gcmVxdWlyZShcIi4uL2xpYnJhcnkvZlwiKS8vLS1cclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gd3JhcCBhIHZhbHVlIGluIGBtYXliZWAgd2l0aDpcclxuXHRcdHZhciB2YWwgPSA0Ly8tLVxyXG5cdFx0dmFyIG1heWJlX3ZhbCA9IG1heWJlKHZhbClcclxuXHJcbi8vSWYgdGhlICd2YWwnIGlzIGVxdWFsIHRvICp1bmRlZmluZWQqIGl0IHRocmVhdHMgdGhlIGNvbnRhaW5lciBhcyBlbXB0eS5cclxuXHJcbi8qXHJcbm1hcChmdW5rKVxyXG4tLS0tXHJcbkV4ZWN1dGVzIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBgbWF5YmVgJ3MgdmFsdWUgYXMgYW4gYXJndW1lbnQsIGJ1dCBvbmx5IGlmIHRoZSB2YWx1ZSBpcyBkaWZmZXJlbnQgZnJvbSAqdW5kZWZpbmVkKi5cclxuXHJcbiovXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL0lmIHlvdSBoYXZlIGFjY2VzcyB0byBhIHZhbHVlIHRoYXQgbWF5IGJlIHVuZGVmaW5lZCB5b3UgaGF2ZSB0byBkbyBhIG51bGwgY2hlY2sgYmVmb3JlIGRvaW5nIHNvbWV0aGluZyB3aXRoIGl0OlxyXG5cclxuXHR2YXIgb2JqID0ge30vLy0tXHJcblx0dmFyIGdldF9wcm9wZXJ0eSA9IGYoKG9iamVjdCkgPT4gb2JqZWN0LnByb3BlcnR5KVxyXG5cdFxyXG5cdHZhciB2YWwgPSBnZXRfcHJvcGVydHkob2JqKVxyXG5cdFxyXG5cdGlmKHZhbCAhPT0gdW5kZWZpbmVkKXtcclxuXHRcdHZhbCA9IHZhbC50b1N0cmluZygpXHJcblx0fVxyXG5cdGFzc2VydC5lcXVhbCh2YWwsIHVuZGVmaW5lZCkgXHJcblxyXG4vL0hvd2V2ZXIgd2UgbWF5IGVhc2lseSBmb3JnZXQgdGhlIG51bGwgY2hlY2tcclxuXHRcclxuXHRhc3NlcnQudGhyb3dzKGZ1bmN0aW9uKCl7XHJcblx0XHRnZXRfcHJvcGVydHkob2JqKS50b1N0cmluZygpICAvL3RoaXMgYmxvd3MgdXBcclxuXHR9KVxyXG4gICAgXHJcbi8vaWYgeW91IHVzZSAqKm1heWJlKiogeW91IGNhbm5vdCBhY2Nlc3MgdGhlIHVuZGVybHlpbmcgdmFsdWUgZGlyZWN0bHksIGFuZCB0aGVyZWZvcmUgeW91IGNhbm5vdCBleGVjdXRlIGFuIGFjdGlvbiBvbiBpdCwgaWYgaXQgaXMgbm90IHRoZXJlLlxyXG5cclxuIFx0dmFyIG1heWJlX2dldF9wcm9wZXJ0eSA9IGdldF9wcm9wZXJ0eS5tYXAobWF5YmUpXHJcblxyXG5cdHZhciBmdW5jdGlvbl9jYWxsZWQgPSBmYWxzZVxyXG5cdG1heWJlX2dldF9wcm9wZXJ0eShvYmopLm1hcCgodmFsKSA9PiB7XHJcblx0XHRhc3NlcnQub2soZmFsc2UpXHJcblx0XHR2YWwudG9TdHJpbmcoKS8vdGhpcyBpcyBub3QgZXhlY3V0ZWRcclxuXHR9KVxyXG59KS8vLS1cclxuXHJcbi8qXHJcbmZsYXRNYXAoZnVuaylcclxuLS0tLVxyXG5TYW1lIGFzIG1hcCwgYnV0IGFsbG93cyBmb3IgbmVzXHJcblxyXG4qL1xyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblx0dmFyIGdldCA9IGYoKHByb3AsIG9iaikgPT4gb2JqW3Byb3BdKVxyXG5cclxuXHR2YXIgb2JqID0geyBmaXJzdDoge3NlY29uZDp7dGhpcmQ6XCJ2YWxcIn0gfSB9XHJcblx0XHJcblx0bWF5YmUob2JqKVxyXG5cdFx0LmZsYXRNYXAoKG9iaikgPT4gbWF5YmUob2JqLmZpcnN0KSlcclxuXHRcdC5mbGF0TWFwKChvYmopID0+IG1heWJlKG9iai5zZWNvbmQpKVxyXG5cdFx0LmZsYXRNYXAoKG9iaikgPT4gbWF5YmUob2JqLnRoaXJkKSlcclxuXHRcdC5mbGF0TWFwKCh2YWwpID0+IHtcclxuXHRcdFx0YXNzZXJ0LmVxdWFsKHZhbCwgXCJ2YWxcIilcclxuXHRcdH0pXHJcblx0XHJcblx0dmFyIG1heWJlX2dldCA9IGdldC5tYXAobWF5YmUpXHJcblxyXG5cclxuXHRcclxuXHJcbn0pXHJcblxyXG5cclxuXHJcbiJdfQ==
