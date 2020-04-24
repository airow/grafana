module.exports = function() {
  'use strict';

  return {
    html: [
      '<%= genDir %>/views/index.html',
      '<%= genDir %>/views/500.html',
    ],
    options: {
      assetsDirs: ['<%= genDir %>'],
      patterns: {
        css: [
          [/(\.css)/, 'Replacing reference to image.png']
        ]
      },
      blockReplacements: {
        js: function (block) {
          var src = block.dest;
          switch (src) {
            case '[[.AppSubUrl]]/public/app/boot.js':
              src += ("?v=" + new Date().valueOf());
              // src += ("?v=" + grunt.template.today("isoDateTime"));
              break;
          }
          return '<script src="' + src + '"><\/script>';//次处为js标签的定制
        }
      }
      // blockReplacements: {
      //   css: function (block) {
      //     console.log('aaaaaaaaaaaaa', block);
      //     return '<link rel="stylesheet" href="aaaa' + block.dest + '">';
      //   }
      // }
      // css: [
      //   [/(grafana\.light\.min\.css)/, 'Replacing reference to light css', function(asd) {
      //     console.log("Match", asd);
      //     return 'css/grafana.light.min.css';
      //   }]
      // ]
    }
  };
};
