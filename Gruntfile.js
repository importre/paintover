module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        compress: {
            dist: {
                options: {
                    archive: 'package/<%= pkg.name %>_<%= pkg.version %>.zip'
                },
                files: [{
                    expand:true,
                    cwd: 'dist/src/',
                    src: ['**'],
                    dest: ''
                }]
            }
        },

        crx: {
            dist: {
                src: 'dist/src/',
                dest: 'package/<%= pkg.name %>_<%=pkg.version %>.crx',
                privateKey: 'cert/key.pem'
            }
        },

        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: ['dist/*', 'package/*.zip']
                }]
            },
            crx: {
                files: [{
                    dot:true,
                    src: ['dist/*', 'package/*.crx']
                }]
            }
        },

        copy: {
            dist: {
                files: [
                    {
                    cwd: '.',
                    dot: false,
                    dest: 'dist/',
                    src: [
                        'src/manifest.json',
                        'src/scripts/*',
                        'src/styles/*',
                        'src/assets/*',
                        'src/views/*',
                        "src/fonts/glyphicons-halflings-regular.eot",
                        "src/fonts/glyphicons-halflings-regular.svg",
                        "src/fonts/glyphicons-halflings-regular.ttf",
                        "src/fonts/glyphicons-halflings-regular.woff",
                        'src/vendor/todc-bootstrap/dist/css/bootstrap.min.css',
                        'src/vendor/todc-bootstrap/dist/css/todc-bootstrap.min.css',
                        'src/vendor/jquery/jquery.min.js',
                        'src/vendor/angular/angular.min.js',
                        'src/vendor/angular-route/angular-route.min.js',
                        'src/vendor/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.js',
                        'src/vendor/angular-bootstrap-colorpicker/css/colorpicker.css'
                    ]
                }
                ]
            }
        }
    });

    grunt.registerTask('default', [
        'build'
    ]);

    grunt.registerTask('build', [
        'build:dist',
        'build:crx'
    ]);

    grunt.registerTask('build:dist', [
        'clean:dist',
        'copy:dist',
        'compress:dist'
    ]);

    grunt.registerTask('build:crx', [
        'clean:crx',
        'copy:dist',
        'crx:dist'
    ]);
}
