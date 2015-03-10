var constructor = require("./constructor")
module.exports = {
	maybe:constructor(require("./maybe")),
	either:constructor(require("./either")),
	bind:(require("./bind"))
}
window.m = module.exports