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
                    cwd: 'dist/',
                    src: ['**'],
                    dest: ''
                }]
            }
        },

        crx: {
            dist: {
                src: 'dist/',
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
                files: [{
                    cwd: '.',
                    dot: false,
                    dest: 'dist/',
                    src: [
                        'manifest.json',
                        'background.js',
                        'content.css',
                        'contentscript.js',
                        'options.html',
                        'icon.png',
                        'template/*',
                        'css/option.css',
                        'vendor/todc-bootstrap/dist/css/bootstrap.min.css',
                        'vendor/todc-bootstrap/dist/css/todc-bootstrap.min.css',
                        'vendor/jquery/jquery.min.js',
                        'vendor/angular/angular.min.js',
                        'vendor/angular-route/angular-route.min.js',
                        'src/paintover-option.js'
                    ]
                }]
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
