define([
  'angular',
  'lodash'
],
  function (angular, _) {
    'use strict';
    var module = angular.module('grafana.services');
    module.factory('wsAcrossScreen', function ($websocket, contextSrv, alertSrv, teldHelperSrv) {

      var username = contextSrv.user.name;

      var ws = $websocket('ws://rp1.teld.cn/api/WebSocket?user=' + username);

      var goto = {
        gotoprovince: {
          dashboard: 'dashboard://db/gotoprovince'
        },
        gotocity: {
          dashboard: 'dashboard://db/gotocity'
        },
        gotostat: {
          dashboard: 'dashboard://db/gotostat'
        }
      };

      var SCREEN_CONF = {
        lefttop: goto,
        leftbottom: goto,
        righttop: goto,
        rightbottom: goto
      };

      var currentScreen = SCREEN_CONF[_.toLower(username)] || goto;
      console.log(contextSrv.user);

      var changeDashboard = function (wsMessage) {
        var message = wsMessage.message;

        var type = message.type;
        var params = message.params;

        var nextScene = currentScreen[type];

        _.defaultsDeep(params, nextScene);

        if (params.dashboard) {
          teldHelperSrv.gotoDashboard(params.dashboard, params);
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

      ws.onMessage(function (event) {
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
      });

      ws.onOpen(function (event) {
        console.log('connection open');
        //_this.$rootScope.appEvent('alert-success', ['Dashboard Imported', dash.title]);
        alertSrv.set("websocket open", event, "success", 4000);
      });

      return {
        status: function () {
          return ws.readyState;
        },
        send: function (message) {
          if (angular.isString(message)) {
            ws.send(message);
          }
          else if (angular.isObject(message)) {
            ws.send(JSON.stringify(message));
          }
        },
        sendTo: function (to, message) {

          if (angular.isObject(message)) {
            message = JSON.stringify(message);
          }

          var sendMessage = to + "|'" + message + "'";
          ws.send(sendMessage);
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
