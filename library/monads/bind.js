var f = require("../core/core")
module.exports = f.curry(function(funk, monad){
		if(typeof funk!=="function"){throw funk+" is not a function"}
		if(typeof monad.bind!=="function"){throw monad+" is not a monad"}
		return monad.bind(funk)
})