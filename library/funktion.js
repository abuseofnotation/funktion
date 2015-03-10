var monads = require("./monads/monads")
module.exports = {
	compose:require("./compose"),
	curry:require("./curry"),
	map:require("./map"),
	log:function(a){console.log(a);return a}
}


window.f = module.exports
window.m = monads