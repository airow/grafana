module.exports = function(config) {
  return {
    // copy source to temp, we will minify in place for the dist build
    everything_but_less_to_temp: {
      cwd: '<%= srcDir %>',
      expand: true,
      src: ['**/*', '!**/*.less'],
      dest: '<%= tempDir %>'
    },

    public_to_gen: {
      cwd: '<%= srcDir %>',
      expand: true,
      src: ['**/*', '!**/*.less'],
      dest: '<%= genDir %>'
    },

    public_gen_to_releas: {
      cwd: '<%= genDir %>',
      expand: true,
      src: ['**/*', '!**/*.less'],
      dest: '<%= baseDir %>/public_release'
    },

    node_modules: {
      cwd: './node_modules',
      expand: true,
      src: [
        'eventemitter3/*.js',
        'systemjs/dist/*.js',
        'es6-promise/**/*',
        'es6-shim/*.js',
        'reflect-metadata/*.js',
        'reflect-metadata/*.ts',
        'reflect-metadata/*.d.ts',
        'rxjs/**/*',
        'tether/**/*',
        'tether-drop/**/*',
        'tether-drop/**/*',
        'remarkable/dist/*',
        'remarkable/dist/*',
        'virtual-scroll/**/*',
        'mousetrap/**/*',
        'echarts/**/*',
        'brace/**/*',
        'w3c-blob/**/*',
        'buffer/**/*',
        'base64-js/**/*',
        'ieee754/**/*',
        'isarray/**/*',
      ],
      dest: '<%= srcDir %>/vendor/npm'
    },

    dist4330:{
      cwd: '<%= genDir %>',
      expand: true,
      src: ['app/conf/wsUrlConf.4330.js'],
      dest: '<%= genDir %>/app/conf',
      rename: function(dest) {
        console.log(dest + '/wsUrlConf.js');
        return dest + '/wsUrlConf.js';
      }
    },
    dist3420:{
      fileName:3420,
      cwd: '<%= genDir %>',
      expand: true,
      src: ['app/conf/wsUrlConf.3420.js'],
      dest: '<%= genDir %>/app/conf',
      rename: function(dest) {
        console.log(dest + '/wsUrlConf.js');
        return dest + '/wsUrlConf.js';
      }
    }

  };
};
