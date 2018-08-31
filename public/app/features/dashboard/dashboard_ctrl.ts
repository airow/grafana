///<reference path="../../headers/common.d.ts" />

import config from 'app/core/config';
import $ from 'jquery';
import angular from 'angular';
import moment from 'moment';
import _ from 'lodash';
import watermark from 'watermark';

import coreModule from 'app/core/core_module';

export class DashboardCtrl {

  /** @ngInject */
  constructor(
    private $scope,
    private $rootScope,
    keybindingSrv,
    timeSrv,
    variableSrv,
    alertingSrv,
    dashboardSrv,
    unsavedChangesSrv,
    dynamicDashboardSrv,
    dashboardViewStateSrv,
    contextSrv,
    alertSrv,
    $timeout,
    // dashSignalRSvr
    //grafanaScreenSignalrHub,
    $location,
    wsAcrossScreen,
    ) {
    $scope.wsAcrossScreen = wsAcrossScreen;
      //dashSignalRSvr.editEmployee();
      //grafanaScreenSignalrHub.send('grafana@dashboard_ctrl',new Date().valueOf());

    // grafanaScreenSignalrHub.promise.done(function () {
    //   console.log('Invocation of NewContosoChatMessage succeeded');
    //   grafanaScreenSignalrHub.send('grafana@dashboard_ctrl@'+grafanaScreenSignalrHub.connection.id, new Date().valueOf());
    // }).fail(function (error) {
    //   console.log('Invocation of NewContosoChatMessage failed. Error: ' + error);
    // });

      $scope.editor = { index: 0 };

      /* move public\app\plugins\panel\teld-iframe-panel\module.ts
      //接收PostMessage发送过来的消息，通过Angular-Post-Message组件
      let messageIncomingHandler = $scope.$root.$on('$messageIncoming', messageIncoming.bind(this));
      function messageIncoming(event, data){
        console.group("grafana");
        console.log(angular.fromJson(event));
        console.log(angular.fromJson(data));
        console.groupEnd();
      }
      $scope.$on('$destroy',function() {
        messageIncomingHandler();
        messageIncomingHandler = null;
      });
      */

      var resizeEventTimeout;

      $scope.setupDashboard = function(data) {
        try {
          $scope.setupDashboardInternal(data);
        } catch (err) {
          $scope.onInitFailed(err, 'Dashboard init failed', true);
        }
      };

      $scope.setupDashboardInternal = function(data) {
        var dashboard = dashboardSrv.create(data.dashboard, data.meta);
        dashboardSrv.setCurrent(dashboard);

        // init services
        timeSrv.init(dashboard);
        alertingSrv.init(dashboard, data.alerts);

        // template values service needs to initialize completely before
        // the rest of the dashboard can load
        variableSrv.init(dashboard)
        // template values failes are non fatal
        .catch($scope.onInitFailed.bind(this, 'Templating init failed', false))
        // continue
        .finally(function() {
          dynamicDashboardSrv.init(dashboard);
          dynamicDashboardSrv.process();

          if (contextSrv.user.name !== "screen") {
            unsavedChangesSrv.init(dashboard, $scope);
          }

          wsAcrossScreen.conf(dashboard);

          $scope.dashboard = dashboard;
          $scope.dashboardMeta = dashboard.meta;
          $scope.dashboardViewState = dashboardViewStateSrv.create($scope);

          $rootScope.g_DashboardViewState = $scope.dashboardViewState.state;

          keybindingSrv.setupDashboardBindings($scope, dashboard);

          $scope.dashboard.updateSubmenuVisibility();
          $scope.setWindowTitleAndTheme();

          $scope.appEvent("dashboard-initialized", $scope.dashboard);

          let search = $location.search();
          let variableType = 'custom';
          for (var key in search) {
            if (/^_\$.*/.test(key)) {
              let varName = key.replace("_$", "");
              var variable = variableSrv.templateSrv.getVariable(`$${varName}`, variableType);
              let current = { text: search[key], value: search[key] };
              if (variable) {
                variableSrv.setOptionFromUrl(variable, search[key]);
              } else {
                variable = variableSrv.addVariable({ type: variableType, canSaved: false });
                variable.hide = 2;
                variable.name = variable.label = varName;
              }
              variable.current === current;

              //variableSrv.updateOptions(variable);
              variableSrv.setOptionAsCurrent(variable, current);
              variableSrv.templateSrv.updateTemplateData();
              dashboardSrv.getCurrent().updateSubmenuVisibility();
            }
          }
        })
        .catch($scope.onInitFailed.bind(this, 'Dashboard init failed', true));
      };

      $scope.onInitFailed = function(msg, fatal, err) {
        console.log(msg, err);

        if (err.data && err.data.message) {
          err.message = err.data.message;
        } else if (!err.message) {
          err = {message: err.toString()};
        }

        $scope.appEvent("alert-error", [msg, err.message]);

        // protect against  recursive fallbacks
        if (fatal && !$scope.loadedFallbackDashboard) {
          $scope.loadedFallbackDashboard = true;
          $scope.setupDashboard({dashboard: {title: 'Dashboard Init failed'}});
        }
      };

      $scope.templateVariableUpdated = function() {
        dynamicDashboardSrv.process();
      };

      $scope.setWindowTitleAndTheme = function() {
        window.document.title = config.window_title_prefix + $scope.dashboard.title;
      };

      $scope.broadcastRefresh = function() {
        $rootScope.$broadcast('refresh');
      };

      $scope.addRowDefault = function() {
        $scope.dashboard.addEmptyRow();
      };

      $scope.showJsonEditor = function(evt, options) {
        var editScope = $rootScope.$new();
        editScope.object = options.object;
        editScope.updateHandler = options.updateHandler;
        $scope.appEvent('show-dash-editor', { src: 'public/app/partials/edit_json.html', scope: editScope });
      };

      $scope.registerWindowResizeEvent = function() {
        angular.element(window).bind('resize', function() {
          $timeout.cancel(resizeEventTimeout);
          resizeEventTimeout = $timeout(function() { $scope.$broadcast('render'); }, 200);
        });

        $scope.$on('$destroy', function() {
          angular.element(window).unbind('resize');
          $scope.dashboard.destroy();
          //watermark.clear();
        });
      };

      $scope.timezoneChanged = function() {
        $rootScope.$broadcast("refresh");
      };
    }

    init(dashboard) {
      this.$scope.onAppEvent('show-json-editor', this.$scope.showJsonEditor);
      this.$scope.onAppEvent('template-variable-value-updated', this.$scope.templateVariableUpdated);
      this.$scope.setupDashboard(dashboard);
      this.$scope.registerWindowResizeEvent();

      this.readerWatermark(dashboard);
    }

    readerWatermark(dashboard) {

      function reader(watermark_txt, grafanaBootData) {
        var compiled = _.template(watermark_txt, { imports: { 'moment': moment, '_': _ } });
        var bindData = _.defaultsDeep({ 'now': moment() }, grafanaBootData);
        watermark_txt = compiled(bindData);
        // watermark.init({
        //   watermark_txt: watermark_txt
        // });
        var watermarkOpts = {
          watermark_txt: watermark_txt,
          watermark_alpha: 0.2
        };
        // setTimeout(() => {
        //   watermark.clear();
        //   watermark.init(watermarkOpts);
        // }, 5000);
        setTimeout(() => {
          watermark.clear();
          watermark.init(watermarkOpts);
        }, 15000);
      }

      var dashwatermark = dashboard.dashboard.watermark;
      if (dashwatermark && dashwatermark.show) {
        var watermark_txt = dashwatermark.text || moment().format('LLLL');
        var grafanaBootData = window["grafanaBootData"];

        if (_.isNil(grafanaBootData['teld']) && watermark_txt.search(/\$\{teld\.\w*\}?/) > -1) {
          $.ajax({ url: '/TeldUserInfo' })
            .done((currentUser) => {
              grafanaBootData.teld = currentUser;
            })
            .always(() => {
              reader(watermark_txt, grafanaBootData);
            });
        } else {
          reader(watermark_txt, grafanaBootData);
        }
      } else { watermark.clear(); }
    }
}

coreModule.controller('DashboardCtrl', DashboardCtrl);
