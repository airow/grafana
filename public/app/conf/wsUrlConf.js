define([], function () {
  'use strict';

  var conf = {
    /** 支持变量
     * ${login}:grafana用户login;
     * ${orgId}:grafana用户orgId;
     * */
    //wsServerUrl: 'ws://rp1.teld.cn/api/WebSocket?user=${login}',
    wsServerUrl: 'ws://139.217.24.173:8080?user=${login}',
    //remoteConfUrl: "http://signalr.wyqcd.com/SCREEN_CONF.json",
    //remoteConfUrl: "http://com2.teld.cn/BigScreen/GetThemeUsers",
  };

  return conf;

});
