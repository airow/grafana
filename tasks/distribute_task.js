module.exports = function(grunt) {
  "use strict";

  // build, then zip and upload to s3
  grunt.registerTask('release', ['build', 'build-post-process','compress:release']);

  grunt.registerTask('teld:dist_start', ['jshint:source',
    'jshint:tests',
    'jscs',
    'exec:tslint',
    'clean:release',
    'copy:node_modules',
    'copy:public_to_gen']);

  grunt.registerTask('teld:dist_post', ['exec:tscompile',
    'karma:test',
    'phantomjs',
    'css',
    'htmlmin:build',
    'ngtemplates',
    'cssmin:build',
    'ngAnnotate:build',
    'systemjs:build',
    'concat:js',
    'filerev',
    'remapFilerev',
    'usemin',
    'uglify:genDir',
    'clean:tmpteldconf',
    'build-post-process', 'compress:release']);

  grunt.registerTask('teld:dist_finally', [
      'clean:teldrelease',
      'copy:public_gen_to_releas',
      'clean:teldconf',
      'compress:public_dist',
    ]);


  grunt.registerTask('teld:dist4330', [
    'teld:dist_start',
    'copy:dist4330',
    'teld:dist_post',
    'dist_finally'
  ]);
  grunt.registerTask('teld:dist3420', [
    'teld:dist_start',
    'copy:dist3420',
    'teld:dist_post',
    'dist_finally'
  ]);
};
