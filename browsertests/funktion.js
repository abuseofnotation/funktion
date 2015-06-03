(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var helpers = require('./helpers');

var f_methods = helpers.add_missing_methods({

	// a.of(b) -> b a
	of: function of(val) {
		return f(function () {
			return val;
		});
	},

	// (a -> b).map(b -> c) = a -> c
	map: function map(funk) {
		var _this = this;

		return f(function () {
			for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
				args[_key] = arguments[_key];
			}

			return funk(_this.apply(undefined, args));
		});
	},

	// (b -> (b -> c)).join() = a -> b
	flat: function flat() {
		var _this2 = this;

		return f(function () {
			for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
				args[_key2] = arguments[_key2];
			}

			return _this2.apply(undefined, args).apply(undefined, args);
		});
	},

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

//Function constructor. Takes a function and adds some additional features to it, without extending the prototype
var f = function f(_x, initial_arguments) {
	var funk = arguments[0] === undefined ? id : arguments[0];

	//We expect a function. If we are given another value, lift it to a function
	if (typeof funk !== 'function') {
		return f().of(funk)

		//If the function takes just one argument, just extend it with methods and return it.
		;
	} else if (funk.length < 2) {
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

f.of = function (val) {
	return function () {
		return val;
	};
}, f.curry = function curry(funk, initial_arguments) {

	//do not do anything if the function takes one argument
	if (funk.length === 1) {
		return funk;
	}

	//save context
	var context = this;

	//construct curried function
	return function () {
		var all_arguments = (initial_arguments || []).concat(Array.prototype.slice.call(arguments, 0));
		return all_arguments.length >= funk.length ? funk.apply(context, all_arguments) : curry(funk, all_arguments);
	};
};

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

function extend(obj, methods) {
	return Object.keys(methods).reduce(function (obj, method_name) {
		obj[method_name] = methods[method_name];return obj;
	}, obj);
}
module.exports = f;

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

"use strict";

var f = require("../library/f");

QUnit.module("functions");

QUnit.test("map", function (assert) {

	var plus_1 = f(function (num) {
		return num + 1;
	});

	var times_2 = f(function (num) {
		return num * 2;
	});

	var plus_2 = plus_1.map(plus_1);

	var plus_4 = plus_2.map(plus_2);

	assert.equal(plus_2(0), 2, "functions can be composed from other functions.");
	assert.equal(plus_4(1), 5, "composed functions can be composed again.");
});

QUnit.test("flatMap", function (assert) {

	/*
 
 //The function must do the following (in Haskell terms)
 
 addStuff = do  
 	a <- (*2)  
 	b <- (+10)  
 	return (a+b)
 addStuff 3 //19
 
 //When we desugar it, this becomes:
 
 addStuff = (*2) >>= \a ->
 		(+10) >>= \b ->
 			return (a+b)
 
 or...
 
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
});

QUnit.test("then", function (assert) {
	assert.expect(0);

	f().then(function (input) {
		console.log(input);
		return 5;
	}).then(function (input) {
		console.log(input);
		return function (input) {
			console.log(input);
			return input + 1;
		};
	})(4);
});

QUnit.test("curry", function (assert) {
	var add_3 = f(function (a, b, c) {
		return a + b + c;
	});
	var add_2 = add_3(0);
	assert.equal(typeof add_2, "function", "curried functions return other functions when the arguments are not enough");
	assert.equal(add_2(1)(1), 2, "when the arguments are enough a result is returned.");
});

},{"../library/f":1}]},{},[3])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvaGVscGVycy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9mX3Rlc3RzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7QUFHbEMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOzs7QUFHM0MsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLENBQUMsQ0FBRTtVQUFNLEdBQUc7R0FBQSxDQUFFO0VBQUE7OztBQUl6QixJQUFHLEVBQUUsYUFBUyxJQUFJLEVBQUM7OztBQUNsQixTQUFPLENBQUMsQ0FBRTtxQ0FBSSxJQUFJO0FBQUosUUFBSTs7O1VBQUssSUFBSSxDQUFFLHVCQUFRLElBQUksQ0FBQyxDQUFFO0dBQUEsQ0FBRSxDQUFBO0VBQzlDOzs7QUFJRCxLQUFJLEVBQUMsZ0JBQVU7OztBQUNkLFNBQU8sQ0FBQyxDQUFFO3NDQUFJLElBQUk7QUFBSixRQUFJOzs7VUFBSyx3QkFBUSxJQUFJLENBQUMsa0JBQUksSUFBSSxDQUFDO0dBQUEsQ0FBRSxDQUFBO0VBQy9DOztBQUVELFFBQU8sRUFBQyxtQkFBVTs7O0FBQ2pCLFNBQU8sQ0FBQyxDQUFFLFlBQWE7c0NBQVQsSUFBSTtBQUFKLFFBQUk7OztBQUNqQixPQUFJLE1BQU0sR0FBRyx3QkFBUSxJQUFJLENBQUMsQ0FBQTtBQUMxQixPQUFHLE9BQU8sTUFBTSxLQUFLLFVBQVUsRUFBQztBQUMvQixXQUFPLE1BQU0sQ0FBQTtJQUNiLE1BQUk7QUFDSixXQUFPLE1BQU0sa0JB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Q0QsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO0NBRUwsQ0FBQyxDQUFBOztBQUVILEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVMsTUFBTSxFQUFDO0FBQ25DLEtBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxVQUFTLENBQUMsRUFBQyxDQUFDLEVBQUMsQ0FBQyxFQUFDO0FBQUMsU0FBTyxDQUFDLEdBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQTtFQUFDLENBQUMsQ0FBQTtBQUM1QyxLQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDcEIsT0FBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssRUFBRSxVQUFVLEVBQUUsNEVBQTRFLENBQUMsQ0FBQTtBQUNwSCxPQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUscURBQXFELENBQUMsQ0FBQTtDQUVuRixDQUFDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGhlbHBlcnMgPSByZXF1aXJlKFwiLi9oZWxwZXJzXCIpXHJcblxyXG5cclxudmFyIGZfbWV0aG9kcyA9IGhlbHBlcnMuYWRkX21pc3NpbmdfbWV0aG9kcyh7XHJcblxyXG5cdC8vIGEub2YoYikgLT4gYiBhXHJcblx0b2Y6IHZhbCA9PiBmKCAoKSA9PiB2YWwgKSxcclxuXHJcblxyXG5cdC8vIChhIC0+IGIpLm1hcChiIC0+IGMpID0gYSAtPiBjXHJcblx0bWFwOiBmdW5jdGlvbihmdW5rKXsgXHJcblx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IGZ1bmsoIHRoaXMoLi4uYXJncykgKSApIFxyXG5cdH0sXHJcblx0XHJcblx0XHJcblx0Ly8gKGIgLT4gKGIgLT4gYykpLmpvaW4oKSA9IGEgLT4gYlxyXG5cdGZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4gdGhpcyguLi5hcmdzKSguLi5hcmdzKSApIFxyXG5cdH0sXHJcblxyXG5cdHRyeUZsYXQ6ZnVuY3Rpb24oKXtcclxuXHRcdHJldHVybiBmKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0gdGhpcyguLi5hcmdzKVxyXG5cdFx0XHRpZih0eXBlb2YgcmVzdWx0ICE9PSAnZnVuY3Rpb24nKXtcclxuXHRcdFx0XHRyZXR1cm4gcmVzdWx0XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdHJldHVybiByZXN1bHQoLi4uYXJncylcclxuXHRcdFx0fVxyXG5cdFx0fSkgXHJcblx0fVxyXG5cclxufSlcclxuXHJcbnZhciBpZCA9IGZ1bmN0aW9uKGEpe3JldHVybiBhfVxyXG5cclxuXHJcbi8vRnVuY3Rpb24gY29uc3RydWN0b3IuIFRha2VzIGEgZnVuY3Rpb24gYW5kIGFkZHMgc29tZSBhZGRpdGlvbmFsIGZlYXR1cmVzIHRvIGl0LCB3aXRob3V0IGV4dGVuZGluZyB0aGUgcHJvdG90eXBlXHJcbnZhciBmID0gKGZ1bmsgPSBpZCwgaW5pdGlhbF9hcmd1bWVudHMpID0+IHtcclxuXHRcclxuXHQvL1dlIGV4cGVjdCBhIGZ1bmN0aW9uLiBJZiB3ZSBhcmUgZ2l2ZW4gYW5vdGhlciB2YWx1ZSwgbGlmdCBpdCB0byBhIGZ1bmN0aW9uXHJcblx0aWYodHlwZW9mIGZ1bmsgIT09ICdmdW5jdGlvbicpe1xyXG5cdFx0cmV0dXJuIGYoKS5vZihmdW5rKVxyXG5cdFxyXG5cdC8vSWYgdGhlIGZ1bmN0aW9uIHRha2VzIGp1c3Qgb25lIGFyZ3VtZW50LCBqdXN0IGV4dGVuZCBpdCB3aXRoIG1ldGhvZHMgYW5kIHJldHVybiBpdC5cclxuXHR9ZWxzZSBpZihmdW5rLmxlbmd0aCA8IDIpe1xyXG5cdFx0cmV0dXJuIGV4dGVuZChmdW5rLCBmX21ldGhvZHMpXHJcblxyXG5cdC8vRWxzZSwgcmV0dXJuIGEgY3VycnktY2FwYWJsZSB2ZXJzaW9uIG9mIHRoZSBmdW5jdGlvbiAoYWdhaW4sIGV4dGVuZGVkIHdpdGggdGhlIGZ1bmN0aW9uIG1ldGhvZHMpXHJcblx0fWVsc2V7XHJcblx0XHRyZXR1cm4gZXh0ZW5kKCAoLi4uYXJncykgPT4ge1xyXG5cdFx0XHR2YXIgYWxsX2FyZ3VtZW50cyAgPSAoaW5pdGlhbF9hcmd1bWVudHN8fFtdKS5jb25jYXQoYXJncylcdFxyXG5cdFx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWZ1bmsubGVuZ3RoP2Z1bmsoLi4uYWxsX2FyZ3VtZW50cyk6ZihmdW5rLCBhbGxfYXJndW1lbnRzKVxyXG5cdFx0fSwgZl9tZXRob2RzKVxyXG5cdFxyXG5cdH1cclxufVxyXG5cclxuXHJcbmYub2YgPSBmdW5jdGlvbih2YWwpe3JldHVybiBmdW5jdGlvbigpe3JldHVybiB2YWx9fSxcclxuXHJcbmYuY3VycnkgPSBmdW5jdGlvbiBjdXJyeShmdW5rLCBpbml0aWFsX2FyZ3VtZW50cyl7XHJcblxyXG5cdC8vZG8gbm90IGRvIGFueXRoaW5nIGlmIHRoZSBmdW5jdGlvbiB0YWtlcyBvbmUgYXJndW1lbnRcclxuXHRpZihmdW5rLmxlbmd0aCA9PT0gMSl7cmV0dXJuIGZ1bmt9XHJcblxyXG5cdC8vc2F2ZSBjb250ZXh0XHJcblx0dmFyIGNvbnRleHQgPSB0aGlzXHJcblxyXG5cdC8vY29uc3RydWN0IGN1cnJpZWQgZnVuY3Rpb25cclxuXHRyZXR1cm4gZnVuY3Rpb24oKXsgIFxyXG5cdFx0dmFyIGFsbF9hcmd1bWVudHMgPSAoaW5pdGlhbF9hcmd1bWVudHN8fFtdKS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSlcclxuXHRcdHJldHVybiBhbGxfYXJndW1lbnRzLmxlbmd0aD49ZnVuay5sZW5ndGg/ZnVuay5hcHBseShjb250ZXh0LCBhbGxfYXJndW1lbnRzKTpjdXJyeShmdW5rLCBhbGxfYXJndW1lbnRzKVxyXG5cdH1cclxufVxyXG5cclxuXHJcbmYuY29tcG9zZSA9IGZ1bmN0aW9uKCl7XHJcblxyXG5cdC8vQ29udmVydCBmdW5jdGlvbnMgdG8gYW4gYXJyYXkgYW5kIGZsaXAgdGhlbSAoZm9yIHJpZ2h0LXRvLWxlZnQgZXhlY3V0aW9uKVxyXG5cdHZhciBmdW5jdGlvbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLnJldmVyc2UoKVxyXG5cdC8vQ2hlY2sgaWYgaW5wdXQgaXMgT0s6XHJcblx0ZnVuY3Rpb25zLmZvckVhY2goZnVuY3Rpb24oZnVuayl7aWYodHlwZW9mIGZ1bmsgIT09IFwiZnVuY3Rpb25cIil7dGhyb3cgbmV3IFR5cGVFcnJvcihmdW5rK1wiIGlzIG5vdCBhIGZ1bmN0aW9uXCIgKX19KVxyXG5cdC8vUmV0dXJuIHRoZSBmdW5jdGlvbiB3aGljaCBjb21wb3NlcyB0aGVtXHJcblx0cmV0dXJuIGZ1bmN0aW9uKCl7XHJcblx0XHQvL1Rha2UgdGhlIGluaXRpYWwgaW5wdXRcclxuXHRcdHZhciBpbnB1dCA9IGFyZ3VtZW50c1xyXG5cdFx0dmFyIGNvbnRleHRcclxuXHRcdHJldHVybiBmdW5jdGlvbnMucmVkdWNlKGZ1bmN0aW9uKHJldHVybl9yZXN1bHQsIGZ1bmssIGkpeyBcclxuXHRcdFx0Ly9JZiB0aGlzIGlzIHRoZSBmaXJzdCBpdGVyYXRpb24sIGFwcGx5IHRoZSBhcmd1bWVudHMgdGhhdCB0aGUgdXNlciBwcm92aWRlZFxyXG5cdFx0XHQvL2Vsc2UgdXNlIHRoZSByZXR1cm4gcmVzdWx0IGZyb20gdGhlIHByZXZpb3VzIGZ1bmN0aW9uXHJcblx0XHRcdHJldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rKHJldHVybl9yZXN1bHQpKVxyXG5cdFx0XHQvL3JldHVybiAoaSA9PT0wP2Z1bmsuYXBwbHkoY29udGV4dCwgaW5wdXQpOiBmdW5rLmFwcGx5KGNvbnRleHQsIFtyZXR1cm5fcmVzdWx0XSkpXHJcblx0XHR9LCB1bmRlZmluZWQpXHJcblx0fVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gZXh0ZW5kKG9iaiwgbWV0aG9kcyl7XHJcblx0cmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZShmdW5jdGlvbihvYmosIG1ldGhvZF9uYW1lKXtvYmpbbWV0aG9kX25hbWVdID0gbWV0aG9kc1ttZXRob2RfbmFtZV07IHJldHVybiBvYmp9LCBvYmopXHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBmXHJcbiIsIlxyXG5cclxuZXhwb3J0cy5jcmVhdGVfY29uc3RydWN0b3IgPSBmdW5jdGlvbiBjcmVhdGVfdHlwZShtZXRob2RzKXtcclxuXHQvL1JlcGxhY2UgdGhlICdvZicgZnVuY3Rpb24gd2l0aCBhIG9uZSB0aGF0IHJldHVybnMgYSBuZXcgb2JqZWN0XHJcblx0dmFyIG9mID0gbWV0aG9kcy5vZlxyXG5cdG1ldGhvZHMub2YgPSBmdW5jdGlvbihhLGIsYyxkKXtyZXR1cm4gb2YuYXBwbHkoT2JqZWN0LmNyZWF0ZShtZXRob2RzKSwgYXJndW1lbnRzKX1cclxuXHRcclxuXHRtZXRob2RzID0gYWRkX21pc3NpbmdfbWV0aG9kcyhtZXRob2RzKVxyXG5cdFxyXG5cdHJldHVybiBtZXRob2RzLm9mO1xyXG59XHJcblxyXG52YXIgYWRkX21pc3NpbmdfbWV0aG9kcyA9IGV4cG9ydHMuYWRkX21pc3NpbmdfbWV0aG9kcyA9IGZ1bmN0aW9uKG9iail7XHJcblx0Ly9cImNoYWluXCIgQUtBIFwiZmxhdE1hcFwiIGlzIGVxdWl2YWxlbnQgdG8gbWFwIC4gam9pbiBcclxuXHRcclxuXHRpZighb2JqLmZsYXRNYXAgJiYgdHlwZW9mIG9iai5tYXAgPT09XCJmdW5jdGlvblwiICYmIHR5cGVvZiBvYmouZmxhdCA9PT1cImZ1bmN0aW9uXCIpe1xyXG5cdFx0b2JqLmNoYWluID0gb2JqLmZsYXRNYXAgPSBmdW5jdGlvbihmdW5rKXtcclxuXHRcdFx0aWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG5cdFx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykuZmxhdCgpfVxyXG5cdH1cclxuXHQvKlxyXG5cdFwidGhlblwiIEFLQSBcIlhYWFwiIGlzIHRoZSByZWxheGVkIHZlcnNpb24gb2YgXCJmbGF0TWFwXCIgd2hpY2ggYWN0cyBvbiB0aGUgb2JqZWN0IG9ubHkgaWYgdGhlIHR5cGVzIG1hdGNoXHJcblx0XCJYWFhcIiB0aGVyZWZvcmUgY2FuIGJlIHVzZWQgYXMgYm90aCBcIm1hcFwiIGFuZCBcImZsYXRNYXBcIiwgZXhjZXB0IGluIHRoZSBjYXNlcyB3aGVuIHlvdSBzcGVjaWZpY2FsbHkgd2FudCB0byBjcmVhdGUgYSBuZXN0ZWQgb2JqZWN0LlxyXG5cdEluIHRoZXNlIGNhc2VzIHlvdSBjYW4gZG8gc28gYnkgc2ltcGx5IHVzaW5nIFwibWFwXCIgZXhwcmljaXRseS5cclxuXHQqL1xyXG5cclxuXHRpZighb2JqLnRoZW4gJiYgdHlwZW9mIG9iai5tYXAgPT09XCJmdW5jdGlvblwiICYmIHR5cGVvZiBvYmoudHJ5RmxhdCA9PT1cImZ1bmN0aW9uXCIpe1xyXG5cdFx0b2JqLnRoZW4gPSBvYmoucGhhdE1hcCA9IGZ1bmN0aW9uKGZ1bmspe1xyXG5cdFx0XHRpZihmdW5rPT09dW5kZWZpbmVkKXt0aHJvdyBcImZ1bmN0aW9uIG5vdCBkZWZpbmVkXCJ9XHJcblx0XHRcdHJldHVybiB0aGlzLm1hcChmdW5rKS50cnlGbGF0KCl9XHJcblx0fVxyXG5cdHJldHVybiBvYmpcclxufVxyXG4iLCIvKlxyXG4tLS1cclxuY2F0ZWdvcnk6IHR1dG9yaWFsXHJcbnRpdGxlOiBGdW5jdGlvbiBNb25hZFxyXG5sYXlvdXQ6IHBvc3RcclxuLS0tXHJcbiovXHJcblxyXG52YXIgZiA9IHJlcXVpcmUoXCIuLi9saWJyYXJ5L2ZcIilcclxuXHJcblFVbml0Lm1vZHVsZShcImZ1bmN0aW9uc1wiKVxyXG5cclxuUVVuaXQudGVzdChcIm1hcFwiLCBmdW5jdGlvbihhc3NlcnQpe1xyXG5cdFxyXG5cdHZhciBwbHVzXzEgPSBmKCAobnVtKSA9PiBudW0rMSApXHJcblxyXG5cdHZhciB0aW1lc18yID0gZiggKG51bSkgPT4gbnVtKjIgKVxyXG5cclxuXHR2YXIgcGx1c18yID0gcGx1c18xLm1hcChwbHVzXzEpIFxyXG5cclxuXHR2YXIgcGx1c180ID0gcGx1c18yLm1hcChwbHVzXzIpXHJcblx0XHJcblx0YXNzZXJ0LmVxdWFsKHBsdXNfMigwKSwgMiwgXCJmdW5jdGlvbnMgY2FuIGJlIGNvbXBvc2VkIGZyb20gb3RoZXIgZnVuY3Rpb25zLlwiKVxyXG5cdGFzc2VydC5lcXVhbChwbHVzXzQoMSksIDUsIFwiY29tcG9zZWQgZnVuY3Rpb25zIGNhbiBiZSBjb21wb3NlZCBhZ2Fpbi5cIilcclxuXHJcbn0pXHJcblxyXG5cclxuUVVuaXQudGVzdChcImZsYXRNYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXtcclxuXHJcblx0LypcclxuXHJcblx0Ly9UaGUgZnVuY3Rpb24gbXVzdCBkbyB0aGUgZm9sbG93aW5nIChpbiBIYXNrZWxsIHRlcm1zKVxyXG5cclxuXHRhZGRTdHVmZiA9IGRvICBcclxuXHRcdGEgPC0gKCoyKSAgXHJcblx0XHRiIDwtICgrMTApICBcclxuXHRcdHJldHVybiAoYStiKVxyXG5cdGFkZFN0dWZmIDMgLy8xOVxyXG5cclxuXHQvL1doZW4gd2UgZGVzdWdhciBpdCwgdGhpcyBiZWNvbWVzOlxyXG5cclxuXHRhZGRTdHVmZiA9ICgqMikgPj49IFxcYSAtPlxyXG5cdFx0XHQoKzEwKSA+Pj0gXFxiIC0+XHJcblx0XHRcdFx0cmV0dXJuIChhK2IpXHJcblxyXG5cdG9yLi4uXHJcblxyXG5cdCovXHJcblxyXG5cdHZhciBhZGRTdHVmZiA9IGYoIChudW0pID0+IG51bSAqIDIgKS5mbGF0TWFwKCAoYSkgPT5cclxuXHRcdCAgICAgICAgICBmKCAobnVtKSA9PiBudW0gKyAxMCApLmZsYXRNYXAoIChiKSA9PlxyXG5cdFx0ICAgICAgICBcdGYub2YoYSArIGIpICkgKVxyXG5cdFxyXG5cdGFzc2VydC5lcXVhbChhZGRTdHVmZigzKSwgMTkpXHJcblxyXG59KVxyXG5cclxuIFFVbml0LnRlc3QoXCJ0aGVuXCIsIGZ1bmN0aW9uKGFzc2VydCl7XHJcbiBcdGFzc2VydC5leHBlY3QoMClcclxuXHJcbiBcdGYoKS50aGVuKGZ1bmN0aW9uKGlucHV0KXtcclxuIFx0XHRjb25zb2xlLmxvZyhpbnB1dClcclxuIFx0XHRyZXR1cm4gNVxyXG4gXHR9KVxyXG5cclxuIFx0LnRoZW4oZnVuY3Rpb24oaW5wdXQpe1xyXG4gXHRcdGNvbnNvbGUubG9nKGlucHV0KVxyXG4gXHRcdHJldHVybiBmdW5jdGlvbihpbnB1dCl7XHJcbiBcdFx0XHRjb25zb2xlLmxvZyhpbnB1dClcclxuIFx0XHRcdHJldHVybiBpbnB1dCArMVxyXG4gXHRcdH1cdFx0XHJcbiBcdH0pKDQpXHJcblxyXG4gfSlcclxuXHJcblFVbml0LnRlc3QoXCJjdXJyeVwiLCBmdW5jdGlvbihhc3NlcnQpe1xyXG5cdHZhciBhZGRfMyA9IGYoZnVuY3Rpb24oYSxiLGMpe3JldHVybiBhK2IrY30pXHJcblx0dmFyIGFkZF8yID0gYWRkXzMoMClcclxuXHRhc3NlcnQuZXF1YWwodHlwZW9mIGFkZF8yLCBcImZ1bmN0aW9uXCIsIFwiY3VycmllZCBmdW5jdGlvbnMgcmV0dXJuIG90aGVyIGZ1bmN0aW9ucyB3aGVuIHRoZSBhcmd1bWVudHMgYXJlIG5vdCBlbm91Z2hcIilcclxuXHRhc3NlcnQuZXF1YWwoYWRkXzIoMSkoMSksIDIsIFwid2hlbiB0aGUgYXJndW1lbnRzIGFyZSBlbm91Z2ggYSByZXN1bHQgaXMgcmV0dXJuZWQuXCIpXHJcblx0XHJcbn0pXHJcbiJdfQ==
