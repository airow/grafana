define([], function () {
  'use strict';

  var conf = {
    /** 支持变量
     * ${name}:grafana用户name;
     * ${login}:grafana用户login;
     * ${orgId}:grafana用户orgId;
     * */
    //wsServerUrl: 'ws://rp1.teld.cn/api/WebSocket?user=${name}',
    wsServerUrl: 'ws://139.217.24.173:8080?user=${name}',
    //remoteConfUrl: "http://signalr.wyqcd.com/SCREEN_CONF.json",
  };

  return conf;

});
