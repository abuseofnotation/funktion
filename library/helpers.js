exports.phatMap = function phatMap(funk){
        if(funk===undefined){throw "function not defined"}
        return this.map(funk).tryFlat()
}

exports.flatMap = function flatMap(funk) {
        if(funk===undefined){throw "function not defined"}
        return this.map(funk).flat()
}
exports.print = function print (){
        console.log(this.toString())
        return this
}

