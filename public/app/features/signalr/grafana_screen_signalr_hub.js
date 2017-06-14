define([
  'angular',
  'lodash',
  'jquery'
],
  function (angular, _, $) {
    'use strict';
    var module = angular.module('grafana.services');
    module.factory('grafanaScreenSignalrHub', function ($rootScope, Hub) {
      var hub = new Hub('grafanaScreenHub', {
        //autoConnect: false,
        //client side methods
        listeners: {
          broadcastMessage: function (name, message) {
            console.log(name, message);
          }
        },

        //server side methods
        methods: ['send'],

        //query params sent on initial connection
        queryParams: {
          'token': 'exampletoken'
        },

        //handle connection error
        errorHandler: function (error) {
          console.error(error);
        },

        //specify a non default root
        rootPath: 'http://localhost:55626/signalr',

        stateChanged: function (state) {
          switch (state.newState) {
            case $.signalR.connectionState.connecting:
              console.log(state);
              break;
            case $.signalR.connectionState.connected:
              console.log(state);
              hub.send('grafnan', new Date().valueOf());
              break;
            case $.signalR.connectionState.reconnecting:
              console.log(state);
              break;
            case $.signalR.connectionState.disconnected:
              console.log(state);
              break;
          }
        }
      });

      $rootScope.$on('signalr_screen', function (event, data) {
        console.log('ParentCtrl', data);       //父级能得到值
        hub.send('grafana@signalr_screen@'+hub.connection.id, new Date().valueOf());
      });

      return {
        send: function (a, b) {
          if (hub.connection.state === 1) {
            hub.send(a, b);
          }
        }
      };
    });
  });
