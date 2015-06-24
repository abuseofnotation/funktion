var m = require("./m")
var f = require("./f")
var maybe = require("./maybe")
var state = require("./state")
var promise = require("./promise")
var list = require("./list")
module.exports = {
	m:m,
	f:f,
	maybe:maybe,
	promise:promise,
	state:state,
	list:list
}

window.promise = promise
window.f = f
window.m = m
window.maybe = maybe
window.state = state 
window.list = list 
