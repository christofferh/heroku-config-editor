'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'index.js', 'commands/**/*.js'],
      options: {
        esnext: true,
        reporter: require('jshint-stylish'),
        globalstrict: true,
        globals: {
          process: true,
          exports: true,
          module: true,
          require: false,
          node: true,
          tempFile: true,
          formatConfig: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint']);

};