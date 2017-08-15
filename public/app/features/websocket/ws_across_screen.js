define([
  'angular'
],
  function (angular) {
    'use strict';
    var module = angular.module('grafana.services');
    module.factory('wsAcrossScreen', function ($websocket) {
      var ws = $websocket('ws://rp1.teld.cn/api/WebSocket?user=user9');
      var collection = [];

      ws.onMessage(function (event) {
        console.log('message: ', event);
        var res;
        try {
          res = JSON.parse(event.data);
        } catch (e) {
          res = { 'username': 'anonymous', 'message': event.data };
        }

        collection.push({
          username: res.username,
          content: res.message,
          timeStamp: event.timeStamp
        });
      });

      ws.onError(function (event) {
        console.log('connection Error', event);
      });

      ws.onClose(function (event) {
        console.log('connection closed', event);
      });

      ws.onOpen(function () {
        console.log('connection open');
        ws.send('Hello World');
        ws.send('again');
        ws.send('and again');
      });
      // setTimeout(function() {
      //   ws.close();
      // }, 500)

      return {
        collection: collection,
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
        }
      };
    });
  });
