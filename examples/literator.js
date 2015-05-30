//A tool for literate programming
var f = require("../library/f.js")

var begins_with = f(function(pattern, str){
	return str.slice(0, pattern.length) === pattern
})

var prefix_with = f(function(prefix, str){
	return prefix + str
})


var remove_n_chars = f(function(chars, str){
	return str.slice(chars)
})


//module.exports = f.compose(m.map(process_line), split_lines) 


split = f(function(str){
	return str.split("\n")
})





var literator = f(function(str){
	//Split the document line by line
	return str.split("\n")
	//Process each line
	.map(process_line)
})



var process_line = f(function(line){
	//Add some common preprocessing
	return line
}).chain(function(line){
	return begins_with("    ", line)?remove_n_chars(4):prefix_with("//")
})


module.exports = function(grunt){
	grunt.log.writeln("grrr")
	grunt.registerMultiTask("literator", function(){

			grunt.log.writeln(JSON.stringify(this))

			this.files.forEach(function(file) {
			file.src.filter(function(filepath) {
				// Remove nonexistent files (it's up to you to filter or warn here).
				return grunt.file.exists(filepath)
			})
			
			grunt.log.writeln(file)
			grunt.log.writeln(JSON.stringify(file, undefined, 4))

			//grunt.file.read(filepath);
			//grunt.file.write(file.dest, contents);
			//grunt.log.writeln('File "' + file.dest + '" created.');
		});
	
	})



}

