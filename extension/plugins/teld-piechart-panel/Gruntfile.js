module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');

  var grafPlugin = grunt.file.readJSON('./src/plugin.json');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    grafPlugin: grafPlugin,

    clean: ["dist"],

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*', '!**/*.js', '!**/*.scss'],
        dest: 'dist'
      },
      img_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['img/*'],
        dest: 'dist/src/'
      },
      pluginDef: {
        expand: true,
        src: [ 'plugin.json', 'README.md' ],
        dest: 'dist',
      },
      toGrafana: {
        cwd: 'dist',
        expand: true,
        src: ['**/*'],
        dest: '../../../data/plugins/<%= grafPlugin.id %>'
      }
    },

    watch: {
      rebuild_all: {
        files: ['src/**/*', 'plugin.json'],
        tasks: ['default', 'copy:toGrafana'],
        options: {spawn: false}
      },
    },

    babel: {
      options: {
        sourceMap: true,
        presets:  ["es2015"],
        plugins: ['transform-es2015-modules-systemjs', "transform-es2015-for-of"],
      },
      dist: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['*.js'],
          dest: 'dist',
          ext:'.js'
        }]
      },
    },

    compress: {
      release: {
        options: {
          archive: '../../../dist/<%= grunt.template.today("yyyy-mm-dd HHMM") %> <%= grafPlugin.id %>-<%= pkg.version %>.zip'
        },
        files: [
          {
            expand: true,
            cwd: 'dist',
            src: ['**/*'],
            dest: grafPlugin.id,
          }
        ]
      }
    }

  });

  grunt.registerTask('default', ['clean', 'copy:src_to_dist', 'copy:img_to_dist', 'copy:pluginDef', 'babel']);
  grunt.registerTask('build', ['default', 'copy:toGrafana']);
  grunt.registerTask('release', ['default', 'compress:release']);
};
