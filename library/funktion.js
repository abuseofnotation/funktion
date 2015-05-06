var m = require("./m")
var f = require("./f")
var maybe = require("./maybe")
var state = require("./state")
module.exports = {
	m:m,
	f:f,
	maybe:maybe,
	state:state
}


window.f = f
window.m = m
window.maybe = maybe
window.state = state 
