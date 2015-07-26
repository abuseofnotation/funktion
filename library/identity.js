var identity = function(val){
    var id = Object.create(methods)
    id._value = val
    return Object.freeze(id)
}


var methods = {

    funktionType: "identity",

    constructor : identity,
    
    of : function of (val){
        return this.constructor(val)
    },

    map : function map (funk){
        return this.constructor(funk(this._value))
    },

    flat : function flat (){
        return this.constructor(this._value._value)
    },

    tryFlat : function tryFlat (){
        return this.constructor((this._value.funktionType === "identity") ? this._value._value : this._value )
    },

    phatMap : function phatMap(funk){
            if(funk===undefined){throw "function not defined"}
            return this.map(funk).tryFlat()
    },

    flatMap : function flatMap(funk) {
            if(funk===undefined){throw "function not defined"}
            return this.map(funk).flat()
    },
    print : function print (){
            console.log(this.toString())
            return this
    }
}

identity.prototype = methods//--
module.exports = identity//--
