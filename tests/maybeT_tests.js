var maybeT = require("../library/maybeT")
var list = require("../library/list")

QUnit.module("maybeT")

QUnit.test("map", function(assert){//--
    const maybeList = maybeT(list(1,2,3))
    assert.expect(1)
    assert.deepEqual(maybeT(list({a:"b"}, {a:"c"})).get("a")._value._value, ["b", "c"])
})
