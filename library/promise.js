var create_object = require("./helpers")

//var resolver = function(resolve){setTimeout(function(){resolve(1)}, 1000)}

var promise= create_object.create_constructor({
	//a -> m a
	of:function(resolver){
		this._resolver = resolver
		return this
	},

	//m a -> ( a -> b ) -> m b
	map:function(funk){
		var original_promise_resolver = this._resolver
		return this.of(function(resolve_new_promise){
			original_promise_resolver(function(val){
				resolve_new_promise(funk(val))
			})
		})

	},

	//m (m x) -> m x
	join:function(){
		var original_promise_resolver = this._resolver

		return this.of(function(resolve_new_promise){
			original_promise_resolver(function(inner_promise){
				inner_promise._resolver(function(val){
					resolve_new_promise(val)	
				})
			})
		})
	},
	run:function(val){
		return this._resolver(function(a){return a})
	}
	
})


function apply(fn, arg){
	return fn(arg) }

module.exports = promise