module.exports = function curry(funk, initial_arguments){
	var context = this
	return function(){
		var all_arguments = (initial_arguments||[]).concat(Array.prototype.slice.call(arguments, 0))
		return all_arguments.length>=funk.length?funk.apply(this, all_arguments):curry(funk, all_arguments)
	}
}