define([
  'angular',
  'lodash',
  'jquery'
],
  function (angular, _, $) {
    'use strict';

    var module = angular.module('grafana.services');

    module.factory('dashSignalRSvr', function (Hub) {
      console.log('dashSignalRSvr');
      //declaring the hub connection
      var hub = new Hub('stockTicker', {

        //client side methods
        listeners: {
          updateStockPrice: function (stock) {
            console.log(stock);
          },

          marketOpened: function () {
            console.log('marketOpened');
          },

          marketClosed: function () {
            console.log('marketClosed');
          },

          marketReset: function () {
            console.log('marketReset');
          }
        },

        //server side methods
        methods: ['getAllStocks', 'getMarketState', 'openMarket', 'closeMarket', 'reset'],

        //query params sent on initial connection
        queryParams: {
          'token': 'exampletoken'
        },

        //handle connection error
        errorHandler : function (error) {
          console.error(error);
        },

        //specify a non default root
        rootPath: 'http://localhost:14840/signalr',

        stateChanged: function (state) {
          switch (state.newState) {
            case $.signalR.connectionState.connecting:
              console.log(state);
              break;
            case $.signalR.connectionState.connected:
              console.log(state);
              hub.openMarket();
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

      var edit = function () {
        //hub.lock(employee.Id); //Calling a server method
        hub.openMarket();
      };
      var done = function () {
        //hub.unlock(employee.Id); //Calling a server method
        hub.closeMarket();
      };

      return {
        editEmployee: edit,
        doneWithEmployee: done
      };
    });
  });
