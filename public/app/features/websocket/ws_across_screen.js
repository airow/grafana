define([
  'angular',
  'lodash',
  'app/conf/wsAcrossScreenConf'
],
  function (angular, _, wsAcrossScreenConf) {
    'use strict';
    var module = angular.module('grafana.services');
    module.factory('wsAcrossScreen', function ($interval, $websocket, contextSrv, alertSrv, dashboardSrv, teldHelperSrv) {

      var wsConnectUser = _.defaults({}, contextSrv.user);
      var username = wsConnectUser.name;

      //var goto = wsAcrossScreenConf.goto;

      //var SCREEN_CONF = wsAcrossScreenConf.SCREEN_CONF;
      var SCREEN_CONF = wsAcrossScreenConf.loadConf(wsConnectUser);

      //var currentScreen = SCREEN_CONF[_.toLower(username)] || goto;
      var currentScreen = SCREEN_CONF[_.toLower(username)];
      console.log(currentScreen);

      var changeDashboard = function (wsMessage) {
        var message = wsMessage.message;

        var type = message.type;
        var params = message.params;

        if (currentScreen) {
          var nextScene = currentScreen[type];

          _.defaultsDeep(params, nextScene);

          if (params.dashboard) {
            teldHelperSrv.gotoDashboard(params.dashboard, params);
          }
        }
      };

      var messageRouter = {
        SCREEN_CONF: SCREEN_CONF,
        currentScreen: currentScreen,
        "gotoprovince": changeDashboard,
        "gotocity": changeDashboard,
        "gotostat": changeDashboard,
        "gotodashboard": function (wsMessage) {
          var message = wsMessage.message;
          var params = message.params;

          if (params.dashboard) {
            // teldHelperSrv.gotoDashboard('db/01_quan-guo-yun-ying-fen-xi'); //Error
            // teldHelperSrv.gotoDashboard('dashboard://db/01_quan-guo-yun-ying-fen-xi'); //OK
            // teldHelperSrv.gotoDashboard('20_充电趋势分析（按区域）33333');  //OK

            teldHelperSrv.gotoDashboard(params.dashboard, params); //OK
          }
        }
      };

      function connectWs(contextUser) {
        var compiled = _.template(wsAcrossScreenConf.wsServerUrl);
        var wsServerUrl = compiled(contextUser);

        var ws = $websocket(wsServerUrl);

        ws.onMessage(function (event) {
          console.log(event);
          var res;
          try {
            res = JSON.parse(event.data);
          } catch (e) {
            res = { 'sender': 'anonymous', 'message': event.data };
          }

          var wsMessage = {
            sender: res.sender,
            message: res.message,
            timeStamp: event.timeStamp
          };

          var type = _.get(wsMessage, "message.type");
          messageRouter[type](wsMessage);
        });

        ws.onError(function (event) {
          console.log('connection Error', event);
          alertSrv.set("websocket error", event, "error", 4000);
        });

        ws.onClose(function (event) {
          console.log('connection closed', event);
          alertSrv.set("websocket closed", event, "warning", 4000);
          //断开重连
          this.ws = connectWs(wsConnectUser);
        });

        ws.onOpen(function (event) {
          console.log('connection open');
          //_this.$rootScope.appEvent('alert-success', ['Dashboard Imported', dash.title]);
          alertSrv.set("websocket open", event, "success", 4000);
        });

        return ws;
      }

      // $interval(function () {
      //   if (ws) {
      //     console.log(ws.readyState);
      //     if (ws.readyState !== 1) {
      //       connectWs(wsConnectUser);
      //     }
      //   } else {
      //     connectWs(wsConnectUser);
      //   }
      // }.bind(this), 1000);

      this.ws = connectWs(wsConnectUser);

      return {
        ws: this.ws,
        conf: function (dash) {
          if (currentScreen) {
            dash = dash || dashboardSrv.getCurrent();
            if (dash) {
              dash.hideDashNavbar = true;
              dash.hideControls = true;
            }
          }
        },
        singleUserConnect: function (db) {
          if (wsAcrossScreenConf.singleUser !== true) {
            return;
          }
          var reConnectName;
          _.each(SCREEN_CONF, function (uValue, wsConnectName) {
            _.each(uValue, function (cValue) {
              var dashboard = db.replace('/dashboard/', '');
              if (_.endsWith(cValue.dashboard, dashboard)) {
                reConnectName = wsConnectName;
                return;
              }
            });
            if (reConnectName) {
              return;
            }
          });

          if (reConnectName !== username) {
            currentScreen = SCREEN_CONF[_.toLower(reConnectName)];
            wsConnectUser.name = reConnectName;
            username = reConnectName;
            if (this.ws) {
              this.ws.close(true);
            } else {
              this.ws = connectWs({ name: reConnectName });
            }
          }
        },
        status: function () {
          return this.ws.readyState;
        },
        send: function (message) {
          if (angular.isString(message)) {
            this.ws.send(message);
          }
          else if (angular.isObject(message)) {
            this.ws.send(JSON.stringify(message));
          }
        },
        sendTo: function (to, message) {

          if (angular.isObject(message)) {
            message = JSON.stringify(message);
          }

          var sendMessage = to + "|'" + message + "'";
          this.ws.send(sendMessage);
        }
      };
    });
  });

/**
 *
  // wsAcrossScreen.send({ sender: 'user9', message: { p1: 1, p2: "string" } });
  // wsAcrossScreen.sendTo('map', { sender: 'user9', message: { p1: 1, p2: "map" } });
  // wsAcrossScreen.sendTo('user0', { sender: 'user9', message: { p1: 1, p2: "user0" } });
  // wsAcrossScreen.sendTo('map', 'hello map');
  // wsAcrossScreen.sendTo('user0', 'hello user0');
  */
