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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJlOi9naXQtcHJvamVjdHMvZnVua3Rpb24vbGlicmFyeS9mLmpzIiwiZTovZ2l0LXByb2plY3RzL2Z1bmt0aW9uL2xpYnJhcnkvaGVscGVycy5qcyIsImU6L2dpdC1wcm9qZWN0cy9mdW5rdGlvbi90ZXN0cy9mX3Rlc3RzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBLElBQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTs7QUFHbEMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDOzs7QUFHM0MsR0FBRSxFQUFFLFlBQUEsR0FBRztTQUFJLENBQUMsQ0FBRTtVQUFNLEdBQUc7R0FBQSxDQUFFO0VBQUE7OztBQUl6QixJQUFHLEVBQUUsYUFBUyxJQUFJLEVBQUM7OztBQUNsQixTQUFPLENBQUMsQ0FBRTtxQ0FBSSxJQUFJO0FBQUosUUFBSTs7O1VBQUssSUFBSSxDQUFFLHVCQUFRLElBQUksQ0FBQyxDQUFFO0dBQUEsQ0FBRSxDQUFBO0VBQzlDOzs7QUFJRCxLQUFJLEVBQUMsZ0JBQVU7OztBQUNkLFNBQU8sQ0FBQyxDQUFFO3NDQUFJLElBQUk7QUFBSixRQUFJOzs7VUFBSyx3QkFBUSxJQUFJLENBQUMsa0JBQUksSUFBSSxDQUFDO0dBQUEsQ0FBRSxDQUFBO0VBQy9DOztBQUVELFFBQU8sRUFBQyxtQkFBVTs7O0FBQ2pCLFNBQU8sQ0FBQyxDQUFFLFlBQWE7c0NBQVQsSUFBSTtBQUFKLFFBQUk7OztBQUNqQixPQUFJLE1BQU0sR0FBRyx3QkFBUSxJQUFJLENBQUMsQ0FBQTtBQUMxQixPQUFHLE9BQU8sTUFBTSxLQUFLLFVBQVUsRUFBQztBQUMvQixXQUFPLE1BQU0sQ0FBQTtJQUNiLE1BQUk7QUFDSixXQUFPLE1BQU0sa0JB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Q0FBQyxDQUFDLENBQUMsQ0FBQTtDQUVMLENBQUMsQ0FBQTs7QUFFSCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFTLE1BQU0sRUFBQztBQUNuQyxLQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsVUFBUyxDQUFDLEVBQUMsQ0FBQyxFQUFDLENBQUMsRUFBQztBQUFDLFNBQU8sQ0FBQyxHQUFDLENBQUMsR0FBQyxDQUFDLENBQUE7RUFBQyxDQUFDLENBQUE7QUFDNUMsS0FBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQ3BCLE9BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLEVBQUUsVUFBVSxFQUFFLDRFQUE0RSxDQUFDLENBQUE7QUFDcEgsT0FBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLHFEQUFxRCxDQUFDLENBQUE7Q0FFbkYsQ0FBQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBoZWxwZXJzID0gcmVxdWlyZShcIi4vaGVscGVyc1wiKVxyXG5cclxuXHJcbnZhciBmX21ldGhvZHMgPSBoZWxwZXJzLmFkZF9taXNzaW5nX21ldGhvZHMoe1xyXG5cclxuXHQvLyBhLm9mKGIpIC0+IGIgYVxyXG5cdG9mOiB2YWwgPT4gZiggKCkgPT4gdmFsICksXHJcblxyXG5cclxuXHQvLyAoYSAtPiBiKS5tYXAoYiAtPiBjKSA9IGEgLT4gY1xyXG5cdG1hcDogZnVuY3Rpb24oZnVuayl7IFxyXG5cdFx0cmV0dXJuIGYoICguLi5hcmdzKSA9PiBmdW5rKCB0aGlzKC4uLmFyZ3MpICkgKSBcclxuXHR9LFxyXG5cdFxyXG5cdFxyXG5cdC8vIChiIC0+IChiIC0+IGMpKS5qb2luKCkgPSBhIC0+IGJcclxuXHRmbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHRoaXMoLi4uYXJncykoLi4uYXJncykgKSBcclxuXHR9LFxyXG5cclxuXHR0cnlGbGF0OmZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gZiggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0dmFyIHJlc3VsdCA9IHRoaXMoLi4uYXJncylcclxuXHRcdFx0aWYodHlwZW9mIHJlc3VsdCAhPT0gJ2Z1bmN0aW9uJyl7XHJcblx0XHRcdFx0cmV0dXJuIHJlc3VsdFxyXG5cdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRyZXR1cm4gcmVzdWx0KC4uLmFyZ3MpXHJcblx0XHRcdH1cclxuXHRcdH0pIFxyXG5cdH1cclxuXHJcbn0pXHJcblxyXG52YXIgaWQgPSBmdW5jdGlvbihhKXtyZXR1cm4gYX1cclxuXHJcblxyXG4vL0Z1bmN0aW9uIGNvbnN0cnVjdG9yLiBUYWtlcyBhIGZ1bmN0aW9uIGFuZCBhZGRzIHNvbWUgYWRkaXRpb25hbCBmZWF0dXJlcyB0byBpdCwgd2l0aG91dCBleHRlbmRpbmcgdGhlIHByb3RvdHlwZVxyXG52YXIgZiA9IChmdW5rID0gaWQsIGluaXRpYWxfYXJndW1lbnRzKSA9PiB7XHJcblx0XHJcblx0Ly9XZSBleHBlY3QgYSBmdW5jdGlvbi4gSWYgd2UgYXJlIGdpdmVuIGFub3RoZXIgdmFsdWUsIGxpZnQgaXQgdG8gYSBmdW5jdGlvblxyXG5cdGlmKHR5cGVvZiBmdW5rICE9PSAnZnVuY3Rpb24nKXtcclxuXHRcdHJldHVybiBmKCkub2YoZnVuaylcclxuXHRcclxuXHQvL0lmIHRoZSBmdW5jdGlvbiB0YWtlcyBqdXN0IG9uZSBhcmd1bWVudCwganVzdCBleHRlbmQgaXQgd2l0aCBtZXRob2RzIGFuZCByZXR1cm4gaXQuXHJcblx0fWVsc2UgaWYoZnVuay5sZW5ndGggPCAyKXtcclxuXHRcdHJldHVybiBleHRlbmQoZnVuaywgZl9tZXRob2RzKVxyXG5cclxuXHQvL0Vsc2UsIHJldHVybiBhIGN1cnJ5LWNhcGFibGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gKGFnYWluLCBleHRlbmRlZCB3aXRoIHRoZSBmdW5jdGlvbiBtZXRob2RzKVxyXG5cdH1lbHNle1xyXG5cdFx0cmV0dXJuIGV4dGVuZCggKC4uLmFyZ3MpID0+IHtcclxuXHRcdFx0dmFyIGFsbF9hcmd1bWVudHMgID0gKGluaXRpYWxfYXJndW1lbnRzfHxbXSkuY29uY2F0KGFyZ3MpXHRcclxuXHRcdFx0cmV0dXJuIGFsbF9hcmd1bWVudHMubGVuZ3RoPj1mdW5rLmxlbmd0aD9mdW5rKC4uLmFsbF9hcmd1bWVudHMpOmYoZnVuaywgYWxsX2FyZ3VtZW50cylcclxuXHRcdH0sIGZfbWV0aG9kcylcclxuXHRcclxuXHR9XHJcbn1cclxuXHJcblxyXG5mLm9mID0gZnVuY3Rpb24odmFsKXtyZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gdmFsfX0sXHJcblxyXG5mLmN1cnJ5ID0gZnVuY3Rpb24gY3VycnkoZnVuaywgaW5pdGlhbF9hcmd1bWVudHMpe1xyXG5cclxuXHQvL2RvIG5vdCBkbyBhbnl0aGluZyBpZiB0aGUgZnVuY3Rpb24gdGFrZXMgb25lIGFyZ3VtZW50XHJcblx0aWYoZnVuay5sZW5ndGggPT09IDEpe3JldHVybiBmdW5rfVxyXG5cclxuXHQvL3NhdmUgY29udGV4dFxyXG5cdHZhciBjb250ZXh0ID0gdGhpc1xyXG5cclxuXHQvL2NvbnN0cnVjdCBjdXJyaWVkIGZ1bmN0aW9uXHJcblx0cmV0dXJuIGZ1bmN0aW9uKCl7ICBcclxuXHRcdHZhciBhbGxfYXJndW1lbnRzID0gKGluaXRpYWxfYXJndW1lbnRzfHxbXSkuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpXHJcblx0XHRyZXR1cm4gYWxsX2FyZ3VtZW50cy5sZW5ndGg+PWZ1bmsubGVuZ3RoP2Z1bmsuYXBwbHkoY29udGV4dCwgYWxsX2FyZ3VtZW50cyk6Y3VycnkoZnVuaywgYWxsX2FyZ3VtZW50cylcclxuXHR9XHJcbn1cclxuXHJcblxyXG5mLmNvbXBvc2UgPSBmdW5jdGlvbigpe1xyXG5cclxuXHQvL0NvbnZlcnQgZnVuY3Rpb25zIHRvIGFuIGFycmF5IGFuZCBmbGlwIHRoZW0gKGZvciByaWdodC10by1sZWZ0IGV4ZWN1dGlvbilcclxuXHR2YXIgZnVuY3Rpb25zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5yZXZlcnNlKClcclxuXHQvL0NoZWNrIGlmIGlucHV0IGlzIE9LOlxyXG5cdGZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGZ1bmspe2lmKHR5cGVvZiBmdW5rICE9PSBcImZ1bmN0aW9uXCIpe3Rocm93IG5ldyBUeXBlRXJyb3IoZnVuaytcIiBpcyBub3QgYSBmdW5jdGlvblwiICl9fSlcclxuXHQvL1JldHVybiB0aGUgZnVuY3Rpb24gd2hpY2ggY29tcG9zZXMgdGhlbVxyXG5cdHJldHVybiBmdW5jdGlvbigpe1xyXG5cdFx0Ly9UYWtlIHRoZSBpbml0aWFsIGlucHV0XHJcblx0XHR2YXIgaW5wdXQgPSBhcmd1bWVudHNcclxuXHRcdHZhciBjb250ZXh0XHJcblx0XHRyZXR1cm4gZnVuY3Rpb25zLnJlZHVjZShmdW5jdGlvbihyZXR1cm5fcmVzdWx0LCBmdW5rLCBpKXsgXHJcblx0XHRcdC8vSWYgdGhpcyBpcyB0aGUgZmlyc3QgaXRlcmF0aW9uLCBhcHBseSB0aGUgYXJndW1lbnRzIHRoYXQgdGhlIHVzZXIgcHJvdmlkZWRcclxuXHRcdFx0Ly9lbHNlIHVzZSB0aGUgcmV0dXJuIHJlc3VsdCBmcm9tIHRoZSBwcmV2aW91cyBmdW5jdGlvblxyXG5cdFx0XHRyZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuayhyZXR1cm5fcmVzdWx0KSlcclxuXHRcdFx0Ly9yZXR1cm4gKGkgPT09MD9mdW5rLmFwcGx5KGNvbnRleHQsIGlucHV0KTogZnVuay5hcHBseShjb250ZXh0LCBbcmV0dXJuX3Jlc3VsdF0pKVxyXG5cdFx0fSwgdW5kZWZpbmVkKVxyXG5cdH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGV4dGVuZChvYmosIG1ldGhvZHMpe1xyXG5cdHJldHVybiBPYmplY3Qua2V5cyhtZXRob2RzKS5yZWR1Y2UoZnVuY3Rpb24ob2JqLCBtZXRob2RfbmFtZSl7b2JqW21ldGhvZF9uYW1lXSA9IG1ldGhvZHNbbWV0aG9kX25hbWVdOyByZXR1cm4gb2JqfSwgb2JqKVxyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gZlxyXG4iLCJcclxuXHJcbmV4cG9ydHMuY3JlYXRlX2NvbnN0cnVjdG9yID0gZnVuY3Rpb24gY3JlYXRlX3R5cGUobWV0aG9kcyl7XHJcblx0Ly9SZXBsYWNlIHRoZSAnb2YnIGZ1bmN0aW9uIHdpdGggYSBvbmUgdGhhdCByZXR1cm5zIGEgbmV3IG9iamVjdFxyXG5cdHZhciBvZiA9IG1ldGhvZHMub2ZcclxuXHRtZXRob2RzLm9mID0gZnVuY3Rpb24oYSxiLGMsZCl7cmV0dXJuIG9mLmFwcGx5KE9iamVjdC5jcmVhdGUobWV0aG9kcyksIGFyZ3VtZW50cyl9XHJcblx0XHJcblx0bWV0aG9kcyA9IGFkZF9taXNzaW5nX21ldGhvZHMobWV0aG9kcylcclxuXHRcclxuXHRyZXR1cm4gbWV0aG9kcy5vZjtcclxufVxyXG5cclxudmFyIGFkZF9taXNzaW5nX21ldGhvZHMgPSBleHBvcnRzLmFkZF9taXNzaW5nX21ldGhvZHMgPSBmdW5jdGlvbihvYmope1xyXG5cdC8vXCJjaGFpblwiIEFLQSBcImZsYXRNYXBcIiBpcyBlcXVpdmFsZW50IHRvIG1hcCAuIGpvaW4gXHJcblx0XHJcblx0aWYoIW9iai5mbGF0TWFwICYmIHR5cGVvZiBvYmoubWFwID09PVwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygb2JqLmZsYXQgPT09XCJmdW5jdGlvblwiKXtcclxuXHRcdG9iai5jaGFpbiA9IG9iai5mbGF0TWFwID0gZnVuY3Rpb24oZnVuayl7XHJcblx0XHRcdGlmKGZ1bms9PT11bmRlZmluZWQpe3Rocm93IFwiZnVuY3Rpb24gbm90IGRlZmluZWRcIn1cclxuXHRcdFx0cmV0dXJuIHRoaXMubWFwKGZ1bmspLmZsYXQoKX1cclxuXHR9XHJcblx0LypcclxuXHRcInRoZW5cIiBBS0EgXCJYWFhcIiBpcyB0aGUgcmVsYXhlZCB2ZXJzaW9uIG9mIFwiZmxhdE1hcFwiIHdoaWNoIGFjdHMgb24gdGhlIG9iamVjdCBvbmx5IGlmIHRoZSB0eXBlcyBtYXRjaFxyXG5cdFwiWFhYXCIgdGhlcmVmb3JlIGNhbiBiZSB1c2VkIGFzIGJvdGggXCJtYXBcIiBhbmQgXCJmbGF0TWFwXCIsIGV4Y2VwdCBpbiB0aGUgY2FzZXMgd2hlbiB5b3Ugc3BlY2lmaWNhbGx5IHdhbnQgdG8gY3JlYXRlIGEgbmVzdGVkIG9iamVjdC5cclxuXHRJbiB0aGVzZSBjYXNlcyB5b3UgY2FuIGRvIHNvIGJ5IHNpbXBseSB1c2luZyBcIm1hcFwiIGV4cHJpY2l0bHkuXHJcblx0Ki9cclxuXHJcblx0aWYoIW9iai50aGVuICYmIHR5cGVvZiBvYmoubWFwID09PVwiZnVuY3Rpb25cIiAmJiB0eXBlb2Ygb2JqLnRyeUZsYXQgPT09XCJmdW5jdGlvblwiKXtcclxuXHRcdG9iai50aGVuID0gb2JqLnBoYXRNYXAgPSBmdW5jdGlvbihmdW5rKXtcclxuXHRcdFx0aWYoZnVuaz09PXVuZGVmaW5lZCl7dGhyb3cgXCJmdW5jdGlvbiBub3QgZGVmaW5lZFwifVxyXG5cdFx0XHRyZXR1cm4gdGhpcy5tYXAoZnVuaykudHJ5RmxhdCgpfVxyXG5cdH1cclxuXHRyZXR1cm4gb2JqXHJcbn1cclxuIiwidmFyIGYgPSByZXF1aXJlKFwiLi4vbGlicmFyeS9mXCIpXHJcblxyXG5RVW5pdC5tb2R1bGUoXCJmdW5jdGlvbnNcIilcclxuXHJcblFVbml0LnRlc3QoXCJtYXBcIiwgZnVuY3Rpb24oYXNzZXJ0KXtcclxuXHRcclxuXHR2YXIgcGx1c18xID0gZiggKG51bSkgPT4gbnVtKzEgKVxyXG5cclxuXHR2YXIgdGltZXNfMiA9IGYoIChudW0pID0+IG51bSoyIClcclxuXHJcblx0dmFyIHBsdXNfMiA9IHBsdXNfMS5tYXAocGx1c18xKSBcclxuXHJcblx0dmFyIHBsdXNfNCA9IHBsdXNfMi5tYXAocGx1c18yKVxyXG5cdFxyXG5cdGFzc2VydC5lcXVhbChwbHVzXzIoMCksIDIsIFwiZnVuY3Rpb25zIGNhbiBiZSBjb21wb3NlZCBmcm9tIG90aGVyIGZ1bmN0aW9ucy5cIilcclxuXHRhc3NlcnQuZXF1YWwocGx1c180KDEpLCA1LCBcImNvbXBvc2VkIGZ1bmN0aW9ucyBjYW4gYmUgY29tcG9zZWQgYWdhaW4uXCIpXHJcblxyXG59KVxyXG5cclxuXHJcblFVbml0LnRlc3QoXCJmbGF0TWFwXCIsIGZ1bmN0aW9uKGFzc2VydCl7XHJcblxyXG5cdC8qXHJcblxyXG5cdC8vVGhlIGZ1bmN0aW9uIG11c3QgZG8gdGhlIGZvbGxvd2luZyAoaW4gSGFza2VsbCB0ZXJtcylcclxuXHJcblx0YWRkU3R1ZmYgPSBkbyAgXHJcblx0XHRhIDwtICgqMikgIFxyXG5cdFx0YiA8LSAoKzEwKSAgXHJcblx0XHRyZXR1cm4gKGErYilcclxuXHRhZGRTdHVmZiAzIC8vMTlcclxuXHJcblx0Ly9XaGVuIHdlIGRlc3VnYXIgaXQsIHRoaXMgYmVjb21lczpcclxuXHJcblx0YWRkU3R1ZmYgPSAoKjIpID4+PSBcXGEgLT5cclxuXHRcdFx0KCsxMCkgPj49IFxcYiAtPlxyXG5cdFx0XHRcdHJldHVybiAoYStiKVxyXG5cclxuXHRvci4uLlxyXG5cclxuXHQqL1xyXG5cclxuXHR2YXIgYWRkU3R1ZmYgPSBmKCAobnVtKSA9PiBudW0gKiAyICkuZmxhdE1hcCggKGEpID0+XHJcblx0XHQgICAgICAgICAgZiggKG51bSkgPT4gbnVtICsgMTAgKS5mbGF0TWFwKCAoYikgPT5cclxuXHRcdCAgICAgICAgXHRmLm9mKGEgKyBiKSApIClcclxuXHRcclxuXHRhc3NlcnQuZXF1YWwoYWRkU3R1ZmYoMyksIDE5KVxyXG5cclxufSlcclxuXHJcbiBRVW5pdC50ZXN0KFwidGhlblwiLCBmdW5jdGlvbihhc3NlcnQpe1xyXG4gXHRhc3NlcnQuZXhwZWN0KDApXHJcblxyXG4gXHRmKCkudGhlbihmdW5jdGlvbihpbnB1dCl7XHJcbiBcdFx0Y29uc29sZS5sb2coaW5wdXQpXHJcbiBcdFx0cmV0dXJuIDVcclxuIFx0fSlcclxuXHJcbiBcdC50aGVuKGZ1bmN0aW9uKGlucHV0KXtcclxuIFx0XHRjb25zb2xlLmxvZyhpbnB1dClcclxuIFx0XHRyZXR1cm4gZnVuY3Rpb24oaW5wdXQpe1xyXG4gXHRcdFx0Y29uc29sZS5sb2coaW5wdXQpXHJcbiBcdFx0XHRyZXR1cm4gaW5wdXQgKzFcclxuIFx0XHR9XHRcdFxyXG4gXHR9KSg0KVxyXG5cclxuIH0pXHJcblxyXG5RVW5pdC50ZXN0KFwiY3VycnlcIiwgZnVuY3Rpb24oYXNzZXJ0KXtcclxuXHR2YXIgYWRkXzMgPSBmKGZ1bmN0aW9uKGEsYixjKXtyZXR1cm4gYStiK2N9KVxyXG5cdHZhciBhZGRfMiA9IGFkZF8zKDApXHJcblx0YXNzZXJ0LmVxdWFsKHR5cGVvZiBhZGRfMiwgXCJmdW5jdGlvblwiLCBcImN1cnJpZWQgZnVuY3Rpb25zIHJldHVybiBvdGhlciBmdW5jdGlvbnMgd2hlbiB0aGUgYXJndW1lbnRzIGFyZSBub3QgZW5vdWdoXCIpXHJcblx0YXNzZXJ0LmVxdWFsKGFkZF8yKDEpKDEpLCAyLCBcIndoZW4gdGhlIGFyZ3VtZW50cyBhcmUgZW5vdWdoIGEgcmVzdWx0IGlzIHJldHVybmVkLlwiKVxyXG5cdFxyXG59KVxyXG4iXX0=
