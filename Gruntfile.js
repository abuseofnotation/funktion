/*
Generic Grunt file.

Works with the following project structure.
/library  - Your source files. Can be configured via the 'sources' variable.
/tests  - Should contain a QUnit test suite. The tests are run against a web server (port configurable).
/target - Folder created by the build which contains:
 - <yourmodule>.js - Compiled source (file name taken from package.json).
 - <yourmodule>.map - Source map for your module.
 - <yourmodule>.min.js - Minified source.
 
 
  "devDependencies": {
    "blanket": "^1.1.6",
    "grunt": "^0.4.5",
    "grunt-browserify": "^3.3.0",
    "grunt-cli": "^0.1.13",
    "grunt-contrib-connect": "^0.9.0",
    "grunt-contrib-qunit": "^0.5.2",
    "grunt-contrib-uglify": "^0.6.0",
    "grunt-contrib-watch": "^0.6.1",
    "phantomjs": "^1.9.12",
    "qunitjs": "^1.15.0"
  }
 
*/


var sources = 'library/**/*.js'
var test_server_port = 8000

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'), // the package file to use
        //Runs Q-Unit tests
        qunit: {
            all: {
                options: {
                    urls: ['http://localhost:' + test_server_port + '/tests/index.html']
                }
            }
        },
        //Runs a task whenever some of the source files change
        watch: {
            files: ["examples/*",'tests/*.js', sources],
            tasks: ['default']
        },
        //Downloads dependencies
        connect: {
            server: {
                options: {
                    port: test_server_port,
                    hostname: '*'
                        //			keepalive:true
                }
            }
        },



        exorcise: {
            bundle: {
                options: {},
                files: {
                    "target/<%= pkg.name %>.map": ["target/<%= pkg.name %>.js"],
                }
            }
        },



        uglify: {
            target: {
                options: {
                    beautify: false,
                    mangle: true,
                    compress: {
                        //				drop_console: true
                    }
                },
                files: {
                    "target/<%= pkg.name %>.min.js": ["target/<%= pkg.name %>.js"]
                }

            }
        },


        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            dist: {
                files: {
                    "target/<%= pkg.name %>.js": [sources],
		    "target/examples.js": ["examples/*"]
                }
            }
        },

		
        jshint: {
            src: [sources]
        }


    });
    // load up your plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-notify');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-browserify');
    //grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-exorcise');
    grunt.registerTask('build', ['browserify', "exorcise", 'uglify']);
    grunt.registerTask('default', ['build', 'test']);
    grunt.registerTask('test', [/*'jshint',*/ 'connect', 'qunit']);
};
