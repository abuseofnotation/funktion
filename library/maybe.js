module.exports = maybe = function (val){
    return {
        map:function(funk){
            return f.maybe(val!==undefined?funk(val):undefined)
        },
        mjoin:function(){
            var value = undefined
            if(val!==undefined){
                val.map(function(unpackaged){
                    value = unpackaged
                })
            }
            return f.maybe(value)
        },

        chain:function(funk){
            return f.maybe(val).map(funk).mjoin()
        }
    }
}