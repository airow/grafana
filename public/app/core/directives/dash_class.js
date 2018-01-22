define([
  'lodash',
  'jquery',
  '../core_module',
],
  function (_, $, coreModule) {
    'use strict';

    coreModule.default.directive('dashClass', function ($location) {
      return {
        link: function ($scope, elem) {

          $scope.onAppEvent('panel-fullscreen-enter', function () {
            elem.toggleClass('panel-in-fullscreen', true);
          });

          $scope.onAppEvent('panel-fullscreen-exit', function () {
            elem.toggleClass('panel-in-fullscreen', false);
          });

          var lastHideControlsVal;
          $scope.$watch('dashboard.hideControls', function () {
            if (!$scope.dashboard) {
              return;
            }

            var hideControls = $scope.dashboard.hideControls;
            if (lastHideControlsVal !== hideControls) {
              elem.toggleClass('hide-controls', hideControls);
              lastHideControlsVal = hideControls;
            }
          });

          var lasthideDashNavbarVal;
          $scope.$watch('dashboard.hideDashNavbar', function () {
            if (!$scope.dashboard) {
              return;
            }

            var hideDashNavbar = $scope.dashboard.hideDashNavbar;
            if (lasthideDashNavbarVal !== hideDashNavbar) {

              // var routerObj = $location.search();
              var urlName = $location.search().isShowTime;
              var dashboardObj = $scope.dashboard;
              dashboardObj.isSubShowTime = false;
              if (dashboardObj.hideDashNavbar === true) {
                dashboardObj.isSubShowTime = urlName === "Y";
              }

              elem.toggleClass('hide-dashnavbar', hideDashNavbar);
              var navbarHeight = 52;
              var lastGrafanaPanel = elem.find("grafana-panel:last");
              if (hideDashNavbar) {
                lastGrafanaPanel.find(".panel-container").height(lastGrafanaPanel.find(".panel-container").height() + navbarHeight);
              } else {
                lastGrafanaPanel.find(".panel-container").height(lastGrafanaPanel.find(".panel-container").height() - navbarHeight);
              }
              lasthideDashNavbarVal = hideDashNavbar;
            }
          });

          $scope.$watch('playlistSrv', function (newValue) {
            elem.toggleClass('playlist-active', _.isObject(newValue));
          });
        }
      };
    });

  });
