var f = require("../core/core")
var bind = require("./bind.js")

module.exports = function(){
	var args = Array.prototype.map.call(arguments, function(funk){ return bind(funk)})
	return f.compose.apply(this, args) 

}