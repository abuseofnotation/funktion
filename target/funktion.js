(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
	maybe:require("./maybe")
}


window.f = module.exports
},{"./maybe":2}],2:[function(require,module,exports){
module.exports = maybe = function (val){
    return {
        map:function(funk){
            return f.maybe(val!==undefined?funk(val):undefined)
        },
        mjoin:function(){
            var value = undefined
            if(val!==undefined){
                val.map(function(unpackaged){
                    value = unpackaged
                })
            }
            return f.maybe(value)
        },

        chain:function(funk){
            return f.maybe(val).map(funk).mjoin()
        }
    }
}
},{}]},{},[1,2])


//# sourceMappingURL=funktion.map