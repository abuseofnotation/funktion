var monads = require("./monads/monads")
var core = require("./core/core")
var objects = require("./objects/objects")
module.exports = {
	m:monads,
	f:core,
	o:objects
}


window.f = core
window.m = monads
window.o = objects