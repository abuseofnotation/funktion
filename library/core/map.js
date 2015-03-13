var curry = require("./curry")
module.exports = curry(function(funk, monad){
		if(typeof funk!=="function"){throw funk+" is not a function"}
		if(typeof monad.map!=="function"){throw monad+" is not a monad"}
		return monad.map(funk)
}) 