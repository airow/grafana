///<reference path="../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import $ from 'jquery';

import coreModule from '../core_module';

function iframeFill($animate) {

  return {
    priority: 600,
    restrict: 'A',
    scope: {
      panel: '='
    },
    link: function (scope, elem, attrs, ctrl, transclude) {
      function fill() {
        var panelContainer = elem.closest('.panel-container');
        panelContainer.height($(window).height() - panelContainer.offset().top - 15);
        elem.show();
      }

      if (scope.panel.isFill) {
        elem.hide();
        elem.on('load', fill);
        $(window).resize(fill);
        //$(window).on('resize', fill);
        scope.$on('$destroy', function () {
          elem.unbind('load', fill);
          //$(window).unbind('resize', fill);
          //$(window).off("resize");
        });

        scope.$root.onAppEvent('querybar-queryswitch', function (e, data) {
          console.log(elem);
          //fill();
          setTimeout(fill, 100);
          console.log('scope.$root.onAppEvent("querybar-queryswitch"');
        });
      }


      /* 框架不支持大小变化调整iframe大小
      function resize() {
        setTimeout(() => {
          fill();
        }, 1000);
      }
      $(window).on('resize', resize);
      scope.$on('$destroy', function () {
        elem.unbind('load', fill);
        $(window).unbind('load', resize);
      });
      */
    }
  };
}

coreModule.directive('iframeFill', iframeFill);
