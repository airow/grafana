module.exports = function(config) {
  'use strict';

  var task = {
    release: {
      options: {
        archive: '<%= destDir %>/<%= pkg.name %>-<%= pkg.version %>.<%= platform %>-<%= arch %>.tar.gz'
      },
      files : [
        {
          expand: true,
          cwd: '<%= tempDir %>',
          src: ['**/*'],
          dest: '<%= pkg.name %>-<%= pkg.version %>/',
        },
        {
          expand: true,
          src: ['LICENSE.md', 'README.md', 'NOTICE.md'],
          dest: '<%= pkg.name %>-<%= pkg.version %>/',
        }
      ]
    },

    /*只打包public文件夹*/
    public:{
      options: {
        archive: '<%= destDir %>/'+require('moment')().format("YYYY-MM-DD HHmm")+' public_release.zip'
      },
      files : [
        {
          expand: true,
          cwd: '<%= baseDir %>/public_release',
          src: ['**/*'],
          dest: '',
        }
      ]
    },
    public_dist:{
      options: {
        archive: '<%= destDir %>/'+require('moment')().format("YYYY-MM-DD HHmm")+' public_dist.zip'
      },
      files : [
        {
          expand: true,
          cwd: '<%= baseDir %>/public_release',
          src: ['**/*'],
          dest: '',
        }
      ]
    },
    public_dist4330:{
      options: {
        archive: '<%= destDir %>/'+require('moment')().format("YYYY-MM-DD HHmm")+' public_dist_4330.zip'
      },
      files : [
        {
          date: require('moment')().add(8, 'hours').toDate(),
          expand: true,
          cwd: '<%= baseDir %>/public_release',
          src: ['**/*'],
          dest: '',
        }
      ]
    },
    public_dist3420:{
      options: {
        archive: '<%= destDir %>/'+require('moment')().format("YYYY-MM-DD HHmm")+' public_dist_3420.zip'
      },
      files : [
        {
          date: require('moment')().add(8, 'hours').toDate(),
          expand: true,
          cwd: '<%= baseDir %>/public_release',
          src: ['**/*'],
          dest: '',
        }
      ]
    }
  };

  if (config.platform === 'windows') {
    task.release.options.archive = '<%= destDir %>/<%= pkg.name %>-<%= pkg.version %>.<%= platform %>-<%= arch %>.zip';
  }

  return task;
};
