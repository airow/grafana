module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');

  var grafPlugin = grunt.file.readJSON('./src/plugin.json');
  // var grafPluginDestPath = '../../../data/plugins/' + grafPlugin.id;

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
      pluginDef: {
        expand: true,
        src: ['README.md'],
        dest: 'dist'
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
        files: ['src/**/*'],
        tasks: ['default', 'copy:toGrafana'],
        options: { spawn: false }
      }
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015']
      },
      dist: {
        options: {
          plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of']
        },
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist',
          ext: '.js'
        }]
      },
      distTestNoSystemJs: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist/test',
          ext: '.js'
        }]
      },
      distTestsSpecsNoSystemJs: {
        files: [{
          expand: true,
          cwd: 'spec',
          src: ['**/*.js'],
          dest: 'dist/test/spec',
          ext: '.js'
        }]
      }
    },

    compress: {
      release: {
        options: {
          archive: '../../../dist/<%= grunt.template.today("yyyy-mm-dd hhMM") %> <%= grafPlugin.id %>-<%= pkg.version %>.zip'
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
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['dist/test/spec/test-main.js', 'dist/test/spec/*_spec.js']
      }
    }
  });

  //grunt.registerTask('default', ['clean', 'copy:src_to_dist', 'copy:pluginDef', 'babel', 'mochaTest']);
  grunt.registerTask('default', ['clean', 'copy:src_to_dist', 'copy:pluginDef', 'babel']);
  grunt.registerTask('build', ['default', 'copy:toGrafana']);
  grunt.registerTask('release', ['default', 'compress:release']);
};
