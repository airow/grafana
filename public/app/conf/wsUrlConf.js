define([], function () {
  'use strict';

  /**
   * 2017-09-15 10:55:54
   * socket服务端：
   * 生产环境服务地址(已发布)：139.217.24.173:8080
   * 测试环境服务地址(已发布)：139.219.10.100:8080
   *
   **********************************************************************
   * 用户信息API:
   * 测试环境服务地址(已发布)：http://com2.teld.cn/BigScreen/GetThemeUsers
   * 正式环境服务地址(未发布)：http://com.teld.cn/BigScreen/GetThemeUsers
   *
   ***********************************************************************
   *
   * 用户管理界面
   * 测试用户管理界面（生产DW库）：http://com2.teld.cn/SocketUser/Index?FullName=通讯用户管理
   * 生产用户管理界面（生产DW库）：http://com.teld.cn/SocketUser/Index?FullName=通讯用户管理
   *
   */
  function domain(host) {
    var d = window.location.hostname.split('.');
    d[0] = host;
    return d.join(".");
  }

  function genRemoteConfUrl(host, path) {
    var domainName = domain(host);
    if (domainName !== (host + ".teld.cn")) { return ""; }
    var protocol = window.location.protocol;
    var url = [protocol, "//", domainName, path];
    return url.join("");
  }

  function genWsServerUrl(host, path) {
    var domainName = domain(host);
    if (domainName !== (host + ".teld.cn")) { return ""; }
    var mapping = { "https:": "wss", "http:": "wss" };
    var protocol = window.location.protocol;
    protocol = mapping[protocol];
    var url = [protocol, "://", domainName, path];
    return url.join("");
  }

  var conf = {
    //账号模式，true为多屏单户，false单屏单户
    singleUser: true,
    /** 支持变量
     * ${login}:grafana用户login;
     * ${orgId}:grafana用户orgId;
     * */
    //wsServerUrl: 'ws://rp1.teld.cn/api/WebSocket?user=${login}',/** WebSocket host IIS */
    //wsServerUrl: 'ws://139.219.10.100:8080?user=${login}',
    wsServerUrl_v1: 'wss://' + domain('com2') + ':8080?user=${login}',
    remoteConfUrl_v1: "https://" + domain('mvcone') + ":5443/BigScreen/GetThemeUsers",

    wsServerUrl: genWsServerUrl('com2', ':8080?user=${login}'),
    remoteConfUrl: genRemoteConfUrl('mvcone', ":5443/BigScreenSet/GetUserTheme")
  };

  return conf;

});
