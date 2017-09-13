module.exports = function(config) {
  'use strict';

  return {
    release: ['<%= destDir %>', '<%= tempDir %>', '<%= genDir %>'],
    gen: ['<%= genDir %>'],
    temp: ['<%= tempDir %>'],
    css: ['<%= genDir %>/css'],
    teldrelease: ['<%= baseDir %>/public_release'],
    teldconf: ['<%= baseDir %>/public_release/app/conf'],
  };
};
