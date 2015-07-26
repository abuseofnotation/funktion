var maybeT = require("../library/maybeT")
var list = require("../library/list")
var state = require("../library/state")

QUnit.module("maybeT")

QUnit.test("list", function(assert){//--
    var bc = maybeT(list({a:"b"}, {a:"c"})).getProp("a")
    assert.deepEqual(bc._innerMonad, ["b", "c"])
    var abc = bc.lift("reverse").lift("concat", ["a"])
    assert.deepEqual(abc._innerMonad, ["c", "b", "a"])
})
/*
QUnit.test("state", function(assert){//--
    maybeT(state(1))
    .map()
})

*/
