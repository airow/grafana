define([
  'angular',
  'lodash',
  'app/conf/wsAcrossScreenConf'
],
  function (angular, _) {
    'use strict';
    var module = angular.module('grafana.services');
    module.factory('wsAcrossScreen', function ($interval, $websocket, contextSrv, alertSrv, dashboardSrv,
      teldHelperSrv, wsAcrossScreenConfSrv, $location) {

      var wsAcrossScreenConf = wsAcrossScreenConfSrv;

      var wsConnectUser = _.defaults({}, contextSrv.user);

      var search = $location.search();
      if (search.teld_user) {
        wsConnectUser.grafanaLogin = wsConnectUser.login;
        wsConnectUser.teld_user = search.teld_user;
        wsConnectUser.login = search.teld_user;
        wsConnectUser.isTeldUser = true;
      }
      console.log(wsConnectUser);

      var username = wsConnectUser.login;

      //var goto = wsAcrossScreenConf.goto;

      //var SCREEN_CONF = wsAcrossScreenConf.SCREEN_CONF;

      var SCREEN_CONF = {};
      if (contextSrv.user.orgRole === "Viewer") {
        SCREEN_CONF = wsAcrossScreenConf.loadConf(wsConnectUser);
      }
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
        "gotonational": changeDashboard,/* 全国 */
        "gotoprovince": changeDashboard,/* 省份 */
        "gotocity": changeDashboard,/* 城市 */
        "gotostat": changeDashboard,/* 电站 */
        "gotoplatformzhtheme": changeDashboard,/* 平台主题 */
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

        //if (contextSrv.user.orgRole !== "Viewer" || contextSrv.user.isProxySingedIn === true) {
        if (contextSrv.user.orgRole !== "Viewer" && SCREEN_CONF.isloaded !== true) {
          return;
        }

        if (!contextUser.login) {
          return;
        }

        var compiled = _.template(wsAcrossScreenConf.wsServerUrl);
        var wsServerUrl = compiled(contextUser);

        console.log(wsServerUrl);

        if (_.isEmpty(wsServerUrl)) {
          return;
        }

        ws = $websocket(wsServerUrl);

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
          var mr = messageRouter[type];
          if (mr) {
            mr(wsMessage);
          } else {
            mr = changeDashboard;
            mr(wsMessage);
          }
          //messageRouter[type](wsMessage);
        });

        ws.onError(function (event) {
          console.log('connection Error', event);
          if (switchWSUser === false) {
            alertSrv.set("websocket connection", event.type, "error", 4000);
          }
        });

        ws.onClose(function (event) {
          console.log('connection closed @ ' + switchWSUser, event);
          if (switchWSUser === false) {
            alertSrv.set("websocket connection", event.type, "warning", 4000);
          }
          //断开重连
          ws = connectWs(wsConnectUser);
        });

        ws.onOpen(function (event) {
          switchWSUser = false;
          console.log('connection open');
          //_this.$rootScope.appEvent('alert-success', ['Dashboard Imported', dash.title]);
          alertSrv.set("websocket connection", event.type, "success", 4000);
        });

        return ws;
      }

      var switchWSUser;
      var ws;
      if (contextSrv.user.orgRole === "Viewer") {
        ws = connectWs(wsConnectUser);
      }

      return {
        //ws: this.ws,
        Conf: wsAcrossScreenConf,
        username: username,
        SCREEN_CONF: SCREEN_CONF,
        currentScreen:currentScreen,
        conf: function (dash) {
          var ss = this.SCREEN_CONF.isloaded && _.size(this.SCREEN_CONF) > 2;
          if (ss || contextSrv.user.isProxySingedIn === true) {
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
                return false;
              }
            });
            if (reConnectName) {
              return false;
            }
          });

          if (reConnectName !== username) {
            currentScreen = SCREEN_CONF[_.toLower(reConnectName)];
            wsConnectUser.login = reConnectName;
            username = reConnectName;
            this.username = username;

            switchWSUser = true;
            if (ws) {
              ws.close(true);
            } else {
              ws = connectWs(wsConnectUser);
            }
          }
        },
        status: function () {
          return ws.readyState;
        },
        send: function (message) {
          if (ws) {
            if (angular.isString(message)) {
              ws.send(message);
            }
            else if (angular.isObject(message)) {
              ws.send(JSON.stringify(message));
            }
          } else {
            //*武汉客户要求去掉给提示*/alertSrv.set("ws simulation", "send", "success", 2000);
            console.log('ws simulation', 'success', 'send');
          }
        },
        sendTo: function (to, message) {

          if (angular.isObject(message)) {
            message = JSON.stringify(message);
          }

          var sendMessage = to + "|" + message;
          if (ws) {
            ws.send(sendMessage);
          } else {
            //*武汉客户要求去掉给提示*/alertSrv.set("ws simulation", "sendTo", "success", 2000);
            console.log('ws simulation', 'success', 'sendTo');
          }
        },
        sendToAll: function (message, cb) {
          if (ws) { console.log('sendToAll'); }
          else {
            ws = { send: function (m) { console.log('simulation sendToAll', m); } };
            //*武汉客户要求去掉给提示*/alertSrv.set("ws simulation", "sendToAll", "success", 2000);
            console.log('ws simulation', 'success', 'sendToAll');
          }
          console.group('wsAcrossScreen.sendToAll');
          console.log(username, 'send', message);
          var messageStr;
          if (angular.isObject(message)) {
            messageStr = JSON.stringify(message);
          }

          var userList = _.transform(SCREEN_CONF,
            function (result, value, key) {
              if (false === _.isEmpty(value)) {
                result.push(key);
              }
            }, []);

          userList = _.pull(userList, username);

          var sendContext = { ws: this };

          _.each(userList, function (to) {
            sendContext[to] = message;
            console.log('\t', 'to', to);
            var sendMessage = to + "|" + messageStr;
            ws.send(sendMessage);
          });

          if (cb) {
            console.log('invoking callback');
            cb(sendContext);
            console.log('callback complete');
          }

          console.log('Send complete');
          console.groupEnd();
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
