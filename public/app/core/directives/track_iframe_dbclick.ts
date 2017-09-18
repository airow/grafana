///<reference path="../../headers/common.d.ts" />

import angular from 'angular';
import _ from 'lodash';
import $ from 'jquery';

import coreModule from '../core_module';

function trackIframeDbclick($animate) {

  return {
    priority: 600,
    restrict: 'A',
    link: function(scope, elem, attrs, ctrl, transclude) {

      var blur = $("<button style='position:absolute; left:10px; top:10px; z-index:-1;" +
        "width:0px;height: 0px; background-color: transparent;border: 0px;'></button>");
      elem.after(blur);
      var IframeOnClick = {
        blur: blur,
        resolution: 50,
        iframes: [],
        interval: null,
        clicktimestamp: new Date().valueOf(),
        Iframe: function () {
          this.element = arguments[0];
          //this.cb = arguments[1];
          this.dbclick = arguments[1];
          this.hasTracked = false;
        },
        track: function (element, cb) {
          this.iframes.push(new this.Iframe(element, cb));
          if (!this.interval) {
            var _this = this;
            this.interval = setInterval(function () { _this.checkClick(); }, this.resolution);
          }
        },
        destory: function (element) {
          for (var i in this.iframes) {
            if (element === this.iframes[i].element) {
              this.iframes.pop(this.iframes[i]);
            }
          }
        },
        checkClick: function () {
          if (document.activeElement) {
            var activeElement = document.activeElement;
            for (var i in this.iframes) {
              if (activeElement === this.iframes[i].element) { // user is in this Iframe
                if (this.iframes[i].hasTracked === false) {
                  if (this.iframes[i].cb) {
                    this.iframes[i].cb.apply(window, []);
                  } else {
                    var timestamp = new Date().valueOf();
                    console.log(timestamp - this.clicktimestamp);
                    if (timestamp - this.clicktimestamp < 600) {
                      this.iframes[i].dbclick.apply(window, []);
                    }
                    this.clicktimestamp = timestamp;
                  }
                  this.iframes[i].hasTracked = true;
                }
              } else {
                this.iframes[i].hasTracked = false;
              }
            }
            console.log(document.activeElement);
            //this.blur.focus();
          }
        }
      };

      IframeOnClick.track(elem[0], () => {
        scope.ctrl.dblclick();
      });

      //IframeOnClick.track(elem[0], scope.dbclick1);

      scope.$on('$destroy', function () {
        console.log("destroy");
        IframeOnClick.destory(elem[0]);
      });
    }
  };
}

coreModule.directive('trackIframeDbclick', trackIframeDbclick);
