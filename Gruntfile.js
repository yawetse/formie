/*
 * formie
 * http://github.com/yawetse/formie
 *
 * Copyright (c) 2014 Yaw Joseph Etse. All rights reserved.
 */

'use strict';
var path = require('path');

module.exports = function (grunt) {
	grunt.initConfig({
		simplemocha: {
			options: {
				globals: ['should', 'window'],
				timeout: 3000,
				ignoreLeaks: false,
				ui: 'bdd',
				reporter: 'spec'
			},
			all: {
				src: 'test/**/*.js'
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: [
				'Gruntfile.js',
				'index.js',
				'lib/**/*.js',
				'resources/**/*.js',
				'resources/**/*.ejs',
				'test/**/*.js',
			]
		},
		jsbeautifier: {
			files: ['<%= jshint.all %>', '!resources/template/formie.ejs'],
			options: {
				config: '.jsbeautify'
			}
		},
		jsdoc: {
			dist: {
				src: ['lib/*.js', 'test/*.js'],
				options: {
					destination: 'doc/html',
					configure: 'jsdoc.json'
				}
			}
		},
		browserify: {
			dist: {
				files: [{
					expand: true,
					cwd: 'resources',
					src: ['**/*_src.js'],
					dest: 'example',
					rename: function (dest, src) {
						var finallocation = path.join(dest, src);
						finallocation = finallocation.replace('_src', '_build');
						finallocation = finallocation.replace('resources', 'example');
						finallocation = path.resolve(finallocation);
						return finallocation;
					}
				}],
				options: {}
			}
		},
		uglify: {
			options: {
				sourceMap: true,
				compress: {
					drop_console: false
				}
			},
			all: {
				files: [{
					expand: true,
					cwd: 'example',
					src: ['**/*_build.js'],
					dest: 'example',
					rename: function (dest, src) {
						var finallocation = path.join(dest, src);
						finallocation = finallocation.replace('_build', '.min');
						finallocation = path.resolve(finallocation);
						return finallocation;
					}
				}]
			}
		},
		connect: {
			server: {
				options: {
					index: 'index.html',
					port: 8181,
					hostname: '*',
					base: 'example',
					debug: true,
					// open: true,
					keepalive: true,
					// middleware: [
					// 	function myMiddleware(req, res, next) {
					// 		res.end('Hello, world!');
					// 		next();
					// 	}
					// ],
				}
			}
		},
		copy: {
			main: {
				cwd: 'example',
				expand: true,
				src: '**/*.*',
				dest: '../../public/formie',
			},
		},
		less: {
			development: {
				options: {
					sourceMap: true,
					yuicompress: true,
					compress: true
				},
				files: {
					'example/stylesheets/formie.css': 'resources/stylesheets/formie.less',
					'example/stylesheets/example.css': 'resources/stylesheets/example.less'
				}
			}
		},
		template: {
			all: {
				files: [{
					expand: true,
					cwd: 'resources/template',
					src: ['pages/*.ejs', 'index.ejs', '!shared/**/*.ejs'],
					dest: 'example',
					ext: '.html'
				}],
				variables: {
					env: true
				}
			}
		},
		watch: {
			scripts: {
				// files: '**/*.js',
				files: [
					'Gruntfile.js',
					'index.js',
					'lib/**/*.js',
					'resources/**/*.js',
					'resources/**/*.less',
					'resources/**/*.ejs',
					'test/**/*.js',
				],
				tasks: ['lint', 'packagejs', 'less', 'html', 'test', 'connect' /*'copy', /*'doc',*/ ],
				options: {
					interrupt: true
				}
			}
		}
	});


	// Loading dependencies
	for (var key in grunt.file.readJSON('package.json').devDependencies) {
		if (key.indexOf('grunt') === 0 && key !== 'grunt') {
			grunt.loadNpmTasks(key);
		}
	}

	grunt.registerTask('default', ['jshint', 'simplemocha']);
	grunt.registerTask('lint', 'jshint', 'jsbeautifier');
	grunt.registerTask('packagejs', ['browserify', 'uglify']);
	grunt.registerTask('doc', 'jsdoc');
	grunt.registerTask('test', 'simplemocha');
	grunt.registerTask('html', 'newer:template');
};
