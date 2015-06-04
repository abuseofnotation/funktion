(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var helpers = require('./helpers'); //--

/*
Under the Hood
--------------
Let's see how the methods are implemented
*/
var f_methods = helpers.add_missing_methods({ //--

	//The of method, takes a value and creates a function that returns it.
	//This is very useful if you have a API which expects a function, but you want to feed it with a value (see the `flatMap` example).

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

	//`flat` does the same thing, but two times

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

},{}],3:[function(require,module,exports){
/*
---
category: tutorial
title: Function Monad
layout: post
---
*/

//The function monad augments standard JavaScript functions with composition and currying.
//<!--more-->

//To use the monad constructor, you can require it using node:

"use strict";

var f = require("../library/f");

//Where the `../` is the location of the module.

//Then you will be able to construct functions line this

var plus_1 = f(function (num) {
		return num + 1;
});

QUnit.module("functions"); //--

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
Creates a new function that calls the original function first, then calls `funk` with the result of the original function as an argument:
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
# Calls `funk` with the result of the original function as an argument
# Calls the function returned by `funk`, with the same argument and returns the result of the second call.
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

},{"../library/f":1}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiYzovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvaGVscGVycy5qcyIsImM6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9mX3Rlc3RzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FDLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7Ozs7OztBQU9sQyxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUM7Ozs7OztBQU0zQyxHQUFFLEVBQUUsWUFBQSxHQUFHO1NBQUksQ0FBQyxDQUFFO1VBQU0sR0FBRztHQUFBLENBQUU7RUFBQTs7Ozs7QUFLekIsSUFBRyxFQUFFLGFBQVMsSUFBSSxFQUFDOzs7QUFDbEIsU0FBTyxDQUFDLENBQUU7cUNBQUksSUFBSTtBQUFKLFFBQUk7OztVQUFLLElBQUksQ0FBRSx1QkFBUSxJQUFJLENBQUMsQ0FBRTtHQUFBLENBQUUsQ0FBQTtFQUM5Qzs7Ozs7QUFLRCxLQUFJLEVBQUMsZ0JBQVU7OztBQUNkLFNBQU8sQ0FBQyxDQUFFO3NDQUFJLElBQUk7QUFBSixRQUFJOzs7VUFBSyx3QkFBUSxJQUFJLENBQUMsa0JBQUksSUFBSSxDQUFDO0dBQUEsQ0FBRSxDQUFBO0VBQy9DOzs7O0FBSUQsUUFBTyxFQUFDLG1CQUFVOzs7QUFDakIsU0FBTyxDQUFDLENBQUUsWUFBYTtzQ0FBVCxJQUFJO0FBQUosUUFBSTs7O0FBQ2pCLE9BQUksTUFBTSxHQUFHLHdCQUFRLElBQUksQ0FBQyxDQUFBO0FBQzFCLE9BQUcsT0FBTyxNQUFNLEtBQUssVUFBVSxFQUFDO0FBQy9CLFdBQU8sTUFBTSxDQUFBO0lBQ2IsTUFBSTtBQUNK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RzthQUFLLEdBQUcsR0FBRyxFQUFFO0tBQUEsQ0FBRSxDQUFDLE9BQU8sQ0FBRSxVQUFDLENBQUM7YUFDbkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQUEsQ0FBRTtHQUFBLENBQUUsQ0FBQTs7QUFFbEIsUUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUE7Q0FFN0IsQ0FBQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0dmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpLy8tLVxyXG5cclxuLypcclxuVW5kZXIgdGhlIEhvb2RcclxuLS0tLS0tLS0tLS0tLS1cclxuTGV0J3Mgc2VlIGhvdyB0aGUgbWV0aG9kcyBhcmUgaW1wbGVtZW50ZWRcclxuKi9cclxuXHR2YXIgZl9tZXRob2RzID0gaGVscGVycy5hZGRfbWlzc2luZ19tZXRob2RzKHsvLy0tXHJcblxyXG4vL1RoZSBvZiBtZXRob2QsIHRha2VzIGEgdmFsdWUgYW5kIGNyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgaXQuXHJcbi8vVGhpcyBpcyB2ZXJ5IHVzZWZ1bCBpZiB5b3UgaGF2ZSBhIEFQSSB3aGljaCBleHBlY3RzIGEgZnVuY3Rpb24sIGJ1dCB5b3Ugd2FudCB0byBmZWVkIGl0IHdpdGggYSB2YWx1ZSAoc2VlIHRoZSBgZmxhdE1hcGAgZXhhbXBsZSkuIFxyXG5cclxuXHRcdC8vYS5vZihiKSAtPiBiIGFcclxuXHRcdG9mOiB2YWwgPT4gZiggKCkgPT4gdmFsICksXHJcblxyXG4vL2BtYXBgIGp1c3Qgd2lyZXMgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uIGFuZCB0aGUgbmV3IG9uZSB0b2dldGhlcjpcclxuXHJcblx0XHQvLyhhIC0+IGIpLm1hcChiIC0+IGMpID0gYSAtPiBjXHJcblx0XHRtYXA6IGZ1bmN0aW9uKGZ1bmspeyBcclxuXHRcdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICkgKSBcclxuXHRcdH0sXHJcblxyXG4vL2BmbGF0YCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgdHdvIHRpbWVzXHJcblxyXG5cdFx0Ly8oYiAtPiAoYiAtPiBjKSkuam9pbigpID0gYSAtPiBiXHJcblx0XHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSApIFxyXG5cdFx0fSxcclxuXHJcbi8vZmluYWxseSB3ZSBoYXZlIGB0cnlGbGF0YCB3aGljaCBkb2VzIHRoZSBzYW1lIHRoaW5nLCBidXQgY2hlY2tzIHRoZSB0eXBlcyBmaXJzdC4gVGhlIHNob3J0Y3V0IHRvIGBtYXAoKS50cnlGbGF0KClgIGlzIGNhbGxlZCBgcGhhdE1hcGAgXHJcblxyXG5cdFx0dHJ5RmxhdDpmdW5jdGlvbigpe1xyXG5cdFx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0XHR2YXIgcmVzdWx0ID0gdGhpcyguLi5hcmdzKVxyXG5cdFx0XHRcdGlmKHR5cGVvZiByZXN1bHQgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdFxyXG5cdFx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdFx0cmV0dXJuIHJlc3VsdCguLi5hcmdzKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSkgXHJcblx0XHR9XHJcblxyXG5cdH0pXHJcblxyXG5cdHZhciBpZCA9IGZ1bmN0aW9uKGEpe3JldHVybiBhfVxyXG5cclxuXHJcbi8vVGhpcyBpcyB0aGUgZnVuY3Rpb24gY29uc3RydWN0b3IuIEl0IHRha2VzIGEgZnVuY3Rpb24gYW5kIGFkZHMgYW4gYXVnbWVudGVkIGZ1bmN0aW9uIG9iamVjdCwgd2l0aG91dCBleHRlbmRpbmcgdGhlIHByb3RvdHlwZVxyXG5cclxuXHR2YXIgZiA9IChmdW5rID0gaWQsIGluaXRpYWxfYXJndW1lbnRzKSA9PiB7XHJcblx0XHRcclxuXHRcdC8vV2UgZXhwZWN0IGEgZnVuY3Rpb24uIElmIHdlIGFyZSBnaXZlbiBhbm90aGVyIHZhbHVlLCBsaWZ0IGl0IHRvIGEgZnVuY3Rpb25cclxuXHRcdGlmKHR5cGVvZiBmdW5rICE9PSAnZnVuY3Rpb24nKXtcclxuXHRcdFx0cmV0dXJuIGYoKS5vZihmdW5rKVxyXG5cdFx0XHJcblx0XHQvL0lmIHRoZSBmdW5jdGlvbiB0YWtlcyBqdXN0IG9uZSBhcmd1bWVudCwganVzdCBleHRlbmQgaXQgd2l0aCBtZXRob2RzIGFuZCByZXR1cm4gaXQuXHJcblx0XHR9ZWxzZSBpZihmdW5rLmxlbmd0aCA8IDIgfHwgaW5pdGlhbF9hcmd1bWVudHMgPT09IGZhbHNlKXtcclxuXHRcdFx0cmV0dXJuIGV4dGVuZChmdW5rLCBmX21ldGhvZHMpXHJcblxyXG5cdFx0Ly9FbHNlLCByZXR1cm4gYSBjdXJyeS1jYXBhYmxlIHZlcnNpb24gb2YgdGhlIGZ1bmN0aW9uIChhZ2FpbiwgZXh0ZW5kZWQgd2l0aCB0aGUgZnVuY3Rpb24gbWV0aG9kcylcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRyZXR1cm4gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHRcdHZhciBhbGxfYXJndW1lbnRzICA9IChpbml0aWFsX2FyZ3VtZW50c3x8W10pLmNvbmNhdChhcmdzKVx0XHJcblx0XHRcdFx0cmV0dXJuIGFsbF9hcmd1bWVudHMubGVuZ3RoPj1mdW5rLmxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgYWxsX2FyZ3VtZW50cylcclxuXHRcdFx0fSwgZl9tZXRob2RzKVxyXG5cdFx0XHJcblx0XHR9XHJcblx0fVxyXG5cclxuLy9IZXJlIGlzIHRoZSBmdW5jdGlvbiB3aXRoIHdoaWNoIHRoZSBmdW5jdGlvbiBvYmplY3QgaXMgZXh0ZW5kZWRcclxuXHJcblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0XHRyZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKGZ1bmN0aW9uKG9iaiwgbWV0aG9kX25hbWUpe29ialttZXRob2RfbmFtZV0gPSBtZXRob2RzW21ldGhvZF9uYW1lXTsgcmV0dXJuIG9ian0sIG9iailcclxuXHR9XHJcblxyXG5cdFxyXG5cdGYub2YgPSB2YWwgPT4gZiggKCkgPT4gdmFsICksXHJcblxyXG4vL1RoZSBsaWJyYXJ5IGFsc28gZmVhdHVyZXMgYSBzdGFuZGFyZCBjb21wb3NlIGZ1bmN0aW9uIHdoaWNoIGFsbG93cyB5b3UgdG8gbWFwIG5vcm1hbCBmdW5jdGlvbnMgd2l0aCBvbmUgYW5vdGhlclxyXG5cclxuXHRmLmNvbXBvc2UgPSBmdW5jdGlvbigpe1xyXG5cclxuXHRcdC8vQ29udmVydCBmdW5jdGlvbnMgdG8gYW4gYXJyYXkgYW5kIGZsaXAgdGhlbSAoZm9yIHJpZ2h0LXRvLWxlZnQgZXhlY3V0aW9uKVxyXG5cdFx0dmFyIGZ1bmN0aW9ucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykucmV2ZXJzZSgpXHJcblx0XHQvL0NoZWNrIGlmIGlucHV0IGlzIE9LOlxyXG5cdFx0ZnVuY3Rpb25zLmZvckVhY2goZnVuY3Rpb24oZnVuayl7aWYodHlwZW9mIGZ1bmsgIT09IFwiZnVuY3Rpb25cIil7dGhyb3cgbmV3IFR5cGVFcnJvcihmdW5rK1wiIGlzIG5vdCBhIGZ1bmN0aW9uXCIgKX19KVxyXG5cdFx0Ly9SZXR1cm4gdGhlIGZ1bmN0aW9uIHdoaWNoIGNvbXBvc2VzIHRoZW1cclxuXHRcdHJldHVybiBmdW5jdGlvbigpe1xyXG5cdFx0XHQvL1Rha2UgdGhlIGluaXRpYWwgaW5wdXRcclxuXHRcdFx0dmFyIGlucHV0ID0gYXJndW1lbnRzXHJcblx0XHRcdHZhciBjb250ZXh0XHJcblx0XHRcdHJldHVybiBmdW5jdGlvbnMucmVkdWNlKGZ1bmN0aW9uKHJldHVybl9yZXN1bHQsIGZ1bmssIGkpeyBcclxuXHRcdFx0XHQvL0lmIHRoaXMgaXMgdGhlIGZpcnN0IGl0ZXJhdGlvbiwgYXBwbHkgdGhlIGFyZ3VtZW50cyB0aGF0IHRoZSB1c2VyIHByb3ZpZGVkXHJcblx0XHRcdFx0Ly9lbHNlIHVzZSB0aGUgcmV0dXJuIHJlc3VsdCBmcm9tIHRoZSBwcmV2aW91cyBmdW5jdGlvblxyXG5cdFx0XHRcdHJldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rKHJldHVybl9yZXN1bHQpKVxyXG5cdFx0XHRcdC8vcmV0dXJuIChpID09PTA/ZnVuay5hcHBseShjb250ZXh0LCBpbnB1dCk6IGZ1bmsuYXBwbHkoY29udGV4dCwgW3JldHVybl9yZXN1bHRdKSlcclxuXHRcdFx0fSwgdW5kZWZpbmVkKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblxyXG5cdG1vZHVsZS5leHBvcnRzID0gZi8vLS1cclxuIiwiXHJcblxyXG5leHBvcnRzLmNyZWF0ZV9jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uIGNyZWF0ZV90eXBlKG1ldGhvZHMpe1xyXG5cdC8vUmVwbGFjZSB0aGUgJ29mJyBmdW5jdGlvbiB3aXRoIGEgb25lIHRoYXQgcmV0dXJucyBhIG5ldyBvYmplY3RcclxuXHR2YXIgb2YgPSBtZXRob2RzLm9mXHJcblx0bWV0aG9kcy5vZiA9IGZ1bmN0aW9uKGEsYixjLGQpe3JldHVybiBvZi5hcHBseShPYmplY3QuY3JlYXRlKG1ldGhvZHMpLCBhcmd1bWVudHMpfVxyXG5cdFxyXG5cdG1ldGhvZHMgPSBhZGRfbWlzc2luZ19tZXRob2RzKG1ldGhvZHMpXHJcblx0XHJcblx0cmV0dXJuIG1ldGhvZHMub2Y7XHJcbn1cclxuXHJcbnZhciBhZGRfbWlzc2luZ19tZXRob2RzID0gZXhwb3J0cy5hZGRfbWlzc2luZ19tZXRob2RzID0gZnVuY3Rpb24ob2JqKXtcclxuXHQvL1wiY2hhaW5cIiBBS0EgXCJmbGF0TWFwXCIgaXMgZXF1aXZhbGVudCB0byBtYXAgLiBqb2luIFxyXG5cdFxyXG5cdGlmKCFvYmouZmxhdE1hcCAmJiB0eXBlb2Ygb2JqLm1hcCA9PT1cImZ1bmN0aW9uXCIgJiYgdHlwZW9mIG9iai5mbGF0ID09PVwiZnVuY3Rpb25cIil7XHJcblx0XHRvYmouY2hhaW4gPSBvYmouZmxhdE1hcCA9IGZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0XHRpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcblx0XHRcdHJldHVybiB0aGlzLm1hcChmdW5rKS5mbGF0KCl9XHJcblx0fVxyXG5cdC8qXHJcblx0XCJ0aGVuXCIgQUtBIFwiWFhYXCIgaXMgdGhlIHJlbGF4ZWQgdmVyc2lvbiBvZiBcImZsYXRNYXBcIiB3aGljaCBhY3RzIG9uIHRoZSBvYmplY3Qgb25seSBpZiB0aGUgdHlwZXMgbWF0Y2hcclxuXHRcIlhYWFwiIHRoZXJlZm9yZSBjYW4gYmUgdXNlZCBhcyBib3RoIFwibWFwXCIgYW5kIFwiZmxhdE1hcFwiLCBleGNlcHQgaW4gdGhlIGNhc2VzIHdoZW4geW91IHNwZWNpZmljYWxseSB3YW50IHRvIGNyZWF0ZSBhIG5lc3RlZCBvYmplY3QuXHJcblx0SW4gdGhlc2UgY2FzZXMgeW91IGNhbiBkbyBzbyBieSBzaW1wbHkgdXNpbmcgXCJtYXBcIiBleHByaWNpdGx5LlxyXG5cdCovXHJcblxyXG5cdGlmKCFvYmoudGhlbiAmJiB0eXBlb2Ygb2JqLm1hcCA9PT1cImZ1bmN0aW9uXCIgJiYgdHlwZW9mIG9iai50cnlGbGF0ID09PVwiZnVuY3Rpb25cIil7XHJcblx0XHRvYmoudGhlbiA9IG9iai5waGF0TWFwID0gZnVuY3Rpb24oZnVuayl7XHJcblx0XHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmspLnRyeUZsYXQoKX1cclxuXHR9XHJcblx0cmV0dXJuIG9ialxyXG59XHJcbiIsIi8qXHJcbi0tLVxyXG5jYXRlZ29yeTogdHV0b3JpYWxcclxudGl0bGU6IEZ1bmN0aW9uIE1vbmFkXHJcbmxheW91dDogcG9zdFxyXG4tLS1cclxuKi9cclxuXHJcbi8vVGhlIGZ1bmN0aW9uIG1vbmFkIGF1Z21lbnRzIHN0YW5kYXJkIEphdmFTY3JpcHQgZnVuY3Rpb25zIHdpdGggY29tcG9zaXRpb24gYW5kIGN1cnJ5aW5nLlxyXG4vLzwhLS1tb3JlLS0+XHJcblxyXG4vL1RvIHVzZSB0aGUgbW9uYWQgY29uc3RydWN0b3IsIHlvdSBjYW4gcmVxdWlyZSBpdCB1c2luZyBub2RlOlxyXG5cdFx0XHJcblx0XHR2YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIilcclxuXHJcbi8vV2hlcmUgdGhlIGAuLi9gIGlzIHRoZSBsb2NhdGlvbiBvZiB0aGUgbW9kdWxlLlxyXG5cclxuLy9UaGVuIHlvdSB3aWxsIGJlIGFibGUgdG8gY29uc3RydWN0IGZ1bmN0aW9ucyBsaW5lIHRoaXNcclxuXHRcclxuXHRcdHZhciBwbHVzXzEgPSBmKCAobnVtKSA9PiBudW0rMSApXHJcblxyXG5cdFFVbml0Lm1vZHVsZShcImZ1bmN0aW9uc1wiKS8vLS1cclxuXHJcbi8vQWZ0ZXIgeW91IGRvIHRoYXQsIHlvdSB3aWxsIHN0aWxsIGJlIGFibGUgdG8gdXNlIGBwbHVzXzFgIGxpa2UgYSBub3JtYWwgZnVuY3Rpb24sIGJ1dCB5b3UgY2FuIGFsc28gZG8gdGhlIGZvbGxvd2luZzpcclxuXHJcblxyXG4vKlxyXG5DdXJyeWluZ1xyXG4tLS0tXHJcbldoZW4geW91IGNhbGwgYSBmdW5jdGlvbiBgZmAgd2l0aCBsZXNzIGFyZ3VtZW50cyB0aGF0IGl0IGFjY2VwdHMsIGl0IHJldHVybnMgYSBwYXJ0aWFsbHkgYXBwbGllZFxyXG4oYm91bmQpIHZlcnNpb24gb2YgaXRzZWxmIHRoYXQgbWF5IGF0IGFueSB0aW1lIGJlIGNhbGxlZCB3aXRoIHRoZSByZXN0IG9mIHRoZSBhcmd1bWVudHMuXHJcbiovXHJcblxyXG5cdFFVbml0LnRlc3QoXCJjdXJyeVwiLCBmdW5jdGlvbihhc3NlcnQpey8vLS1cclxuXHRcdHZhciBhZGRfMyA9IGYoZnVuY3Rpb24oYSxiLGMpe3JldHVybiBhK2IrY30pXHJcblx0XHRcclxuXHRcdHZhciBhZGRfMiA9IGFkZF8zKDApXHJcblx0XHRhc3NlcnQuZXF1YWwodHlwZW9mIGFkZF8yLCBcImZ1bmN0aW9uXCIsIFwiY3VycmllZCBmdW5jdGlvbnMgcmV0dXJuIG90aGVyIGZ1bmN0aW9ucyB3aGVuIHRoZSBhcmd1bWVudHMgYXJlIG5vdCBlbm91Z2hcIilcclxuXHRcdFxyXG5cdFx0YXNzZXJ0LmVxdWFsKGFkZF8yKDEpKDEpLCAyLCBcIndoZW4gdGhlIGFyZ3VtZW50cyBhcmUgZW5vdWdoIGEgcmVzdWx0IGlzIHJldHVybmVkLlwiKVxyXG5cdH0pLy8tLVxyXG5cclxuLypcclxubWFwKGZ1bmspXHJcbi0tLS1cclxuQ3JlYXRlcyBhIG5ldyBmdW5jdGlvbiB0aGF0IGNhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdCwgdGhlbiBjYWxscyBgZnVua2Agd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudDpcclxuKi9cclxuXHRRVW5pdC50ZXN0KFwibWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7Ly8tLVxyXG5cdFx0XHJcbi8vWW91IGNhbiBjcmVhdGUgYSBGdW5jdGlvbiBNb25hZCBieSBwYXNzaW5nIGEgbm9ybWFsIEphdmFTY3JpcHQgZnVuY3Rpb24gdG8gdGhlIGNvbnN0cnVjdG9yICh5b3UgY2FuIHdyaXRlIHRoZSBmdW5jdGlvbiBkaXJlY3RseSB0aGVyZSk6XHJcblx0XHRcclxuXHRcdHZhciBwbHVzXzEgPSBmKCAobnVtKSA9PiBudW0rMSApXHJcblxyXG5cclxuLy9UaGVuIG1ha2luZyBhbm90aGVyIGZ1bnh0aW9uIGlzIGVhc3k6XHJcblxyXG5cdFx0dmFyIHBsdXNfMiA9IHBsdXNfMS5tYXAocGx1c18xKSBcclxuXHJcblx0XHRhc3NlcnQuZXF1YWwocGx1c18yKDApLCAyLCBcIk5ldyBmdW5jdGlvbnMgY2FuIGJlIGNvbXBvc2VkIGZyb20gb3RoZXIgZnVuY3Rpb25zLlwiKVxyXG5cdFx0XHJcblx0XHR2YXIgcGx1c180ID0gcGx1c18yLm1hcChwbHVzXzIpXHJcblxyXG5cdFx0YXNzZXJ0LmVxdWFsKHBsdXNfNCgxKSwgNSwgXCJjb21wb3NlZCBmdW5jdGlvbnMgY2FuIGJlIGNvbXBvc2VkIGFnYWluLlwiKVxyXG5cclxuXHR9KS8vLS1cclxuXHJcbi8qXHJcbmZsYXRNYXAoZnVuaylcclxuLS0tLVxyXG5BIG1vcmUgcG93ZXJmdWwgdmVyc2lvbiBvZiBgbWFwYC4gQWNjZXB0cyBhIGZ1bmt0aW9uIHdoaWNoIHJldHVybnMgYW5vdGhlciBmdW5jdGlvbi4gUmV0dXJucyBhIGZ1bmN0aW9uIHdoaWNoIGNhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBmaXJzdCxcclxuYW5kIHRoZW4gaXRcclxuIyBDYWxscyBgZnVua2Agd2l0aCB0aGUgcmVzdWx0IG9mIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiBhcyBhbiBhcmd1bWVudFxyXG4jIENhbGxzIHRoZSBmdW5jdGlvbiByZXR1cm5lZCBieSBgZnVua2AsIHdpdGggdGhlIHNhbWUgYXJndW1lbnQgYW5kIHJldHVybnMgdGhlIHJlc3VsdCBvZiB0aGUgc2Vjb25kIGNhbGwuXHJcbiovXHJcblx0UVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXsvLy0tXHJcblxyXG4vL1lvdSBjYW4gdXNlIGBmbGF0TWFwYCB0byBtb2RlbCBzaW1wbGUgaWYtdGhlbiBzdGF0ZW1lbnRzLiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgdXNlcyBpdCBpbiBjb21iaW5hdGlvbiBvZiB0aGUgY3VycnlpbmcgZnVuY3Rpb25hbGl0eTpcclxuXHRcdFxyXG5cdFx0dmFyIGNvbmNhdCA9IGYoKHN0cjEsIHN0cjIpID0+IHN0cjEgKyBzdHIyKVxyXG5cdFx0dmFyIF9wYXJzZUludCA9IChudW0pID0+IHBhcnNlSW50KG51bSlcclxuXHRcdHZhciBtYWtlTWVzc2FnZSA9IGYoX3BhcnNlSW50KS5mbGF0TWFwKChudW0pID0+IHtjb25zb2xlLmxvZyhcIm51bSBcIitudW0pOyBcclxuXHRcdHJldHVybiBpc05hTihudW0pPyBmKFwiSW52YWxpZCBudW1iZXJcIikgOiBjb25jYXQoXCJUaGUgbnVtYmVyIGlzIFwiKX0gKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwobWFrZU1lc3NhZ2UoXCIxXCIpLCBcIlRoZSBudW1iZXIgaXMgMVwiKVxyXG5cdFx0YXNzZXJ0LmVxdWFsKG1ha2VNZXNzYWdlKFwiMlwiKSwgXCJUaGUgbnVtYmVyIGlzIDJcIilcclxuXHRcdGFzc2VydC5lcXVhbChtYWtlTWVzc2FnZShcIk5vdCBhIG51bWJlclwiKSwgXCJJbnZhbGlkIG51bWJlclwiKVxyXG5cclxuLypcclxuXHJcbmBmbGF0TWFwYCBpcyBzaW1pbGFyIHRvIHRoZSBgPj49YCBmdW5jdGlvbiBpbiBIYXNrZWxsLCB3aGljaCBpcyB0aGUgYnVpbGRpbmcgYmxvY2sgb2YgdGhlIGluZmFtb3VzIGBkb2Agbm90YXRpb25cclxuSXQgY2FuIGJlIHVzZWQgdG8gd3JpdGUgcHJvZ3JhbXMgd2l0aG91dCB1c2luZyBhc3NpZ25tZW50Llx0XHJcblxyXG5Gb3IgZXhhbXBsZSBpZiB3ZSBoYXZlIHRoZSBmb2xsb3dpbmcgZnVuY3Rpb24gaW4gSGFza2VsbDpcclxuXHJcblx0XHRhZGRTdHVmZiA9IGRvICBcclxuXHRcdFx0YSA8LSAoKjIpICBcclxuXHRcdFx0YiA8LSAoKzEwKSAgXHJcblx0XHRcdHJldHVybiAoYStiKVxyXG5cdFx0XHJcblx0XHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxuXHJcbldoZW4gd2UgZGVzdWdhciBpdCwgdGhpcyBiZWNvbWVzOlxyXG5cclxuXHRcdGFkZFN0dWZmID0gKCoyKSA+Pj0gXFxhIC0+XHJcblx0XHRcdFx0KCsxMCkgPj49IFxcYiAtPlxyXG5cdFx0XHRcdFx0cmV0dXJuIChhK2IpXHJcblxyXG5vciBpbiBKYXZhU2NyaXB0IHRlcm1zOlxyXG5cclxuKi9cclxuXHJcblx0XHR2YXIgYWRkU3R1ZmYgPSBmKCAobnVtKSA9PiBudW0gKiAyICkuZmxhdE1hcCggKGEpID0+XHJcblx0XHRcdFx0ICBmKCAobnVtKSA9PiBudW0gKyAxMCApLmZsYXRNYXAoIChiKSA9PlxyXG5cdFx0XHRcdFx0Zi5vZihhICsgYikgKSApXHJcblx0XHRcclxuXHRcdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG5cdH0pLy8tLVxyXG4iXX0=
