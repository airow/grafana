define([
  'lodash',
  'jquery'
],
  function (_, $) {
    "use strict";
    //alert(_);
    //alert($("#ddd"));
    $("#ddd").text("deviceInfo");

    function readCookie(a) {
      for (var b, c = a + "=", d = document.cookie.split(";"), e = 0; e < d.length; e++) {
        for (b = d[e]; " " == b.charAt(0);)
          b = b.substring(1, b.length);
        if (0 == b.indexOf(c))
          return b.substring(c.length, b.length)
      }
      return null;
    }

    function _createCookie(n, t, i) {

      function getDomain(domain) {
        var ares = domain.split(':')[0].split('.');
        ares.shift();
        ares.unshift('');
        return ares.join('.');
      }

      var r, u;
      i ? (r = new Date, r.setTime(r.getTime() + i * 1000), u = "; expires=" + r.toGMTString()) : u = "";
      var tempList = document.domain.split(".");
      var domain;
      var len = tempList.length;

      if (len === 1) {
        document.cookie = n + "=" + t + u + "; path=/";
      } else {
        domain = getDomain(document.domain);
        document.cookie = n + "=" + t + u + "; path=/;domain=" + domain;
      }
    }

    function iosAskForDeviceInfo() {
      alert('iosAskForDeviceInfo');
      var a = document.createElement("iframe");
      a.id = "IOSDeviceInfoFrame";
      a.src = '//jsoc///{"action":"askForDeviceInfo"}';
      a.width = 100;
      a.height = 100;
      document.body.appendChild(a);
    }

    function iosTokenTimeout() {
      alert('iosTokenTimeout');
      var a = document.createElement("iframe");
      a.id = "IOSNotifyFrame";
      a.src = '//jsoc///{"action":"askForToken"}';
      a.width = 100;
      a.height = 100;
      document.body.appendChild(a);
    }

    function androidTokenTimeout() {
      window.teld.updateRefreshToken();
    }

    function androidAskForDeviceInfo() {
      return window.teld.askForDeviceInfo();
    }

    function askForDeviceInfo() {
      var deviceInfo = "";
      if (window.navigator.userAgent.indexOf("TeldIosWebView") !== -1) {
        iosAskForDeviceInfo();
        alert("askForDeviceInfo" + window.deviceInfo);
        deviceInfo = window.deviceInfo;
        window.deviceInfo = "";
      }
      if (window.navigator.userAgent.indexOf("TeldAndroidWebView") !== -1) {
        deviceInfo = androidAskForDeviceInfo();
      }
      //alert(`AskForDeviceInfo=${deviceInfo}`);
      //document.getElementById('ddd').innerText = deviceInfo;

      // while (deviceInfo.indexOf('+') !== -1) {
      //   alert('生成了+');
      //   deviceInfo = askForDeviceInfo();
      // }
      // if (deviceInfo.indexOf('+') !== -1) {
      //   alert('生成了+');
      // }
      $("#ddd").html(deviceInfo.replace(/,/g, "<br>"));

      return deviceInfo;
    }

    function askForDeviceInfoIOS(self) {
      if (self.ddd) { return; }
      iosAskForDeviceInfo();
      self.ddd = true;
    }

    function TokenTimeout() {
      if (window.navigator.userAgent.indexOf("TeldIosWebView") !== -1) {
        iosTokenTimeout();
      }
      if (window.navigator.userAgent.indexOf("TeldAndroidWebView") !== -1) {
        androidTokenTimeout();
      }
    }

    window.sendToken = function (a, b) {
      alert('sendToken');
      window._createCookie("telda", a, 1e3);
      window._createCookie("teldb", b, 1e3);
      var iosifr = document.getElementById("IOSNotifyFrame");
      if (iosifr) { iosifr.remove(); }
    };

    window.sendDeviceInfo = function (deviceInfo) {
      //alert('sendDeviceInfo');
      window.deviceInfo = deviceInfo;
      //alert(window.deviceInfo);
      var iosifr = document.getElementById("IOSDeviceInfoFrame");
      if (iosifr) { iosifr.remove(); }
    };
    window.readCookie = readCookie;
    window._createCookie = _createCookie;
    window.iosAskForDeviceInfo = iosAskForDeviceInfo;
    window.iosTokenTimeout = iosTokenTimeout;

    return {
      isInApp: function () {
        return window.navigator.userAgent.indexOf("TeldIosWebView") !== -1
          || window.navigator.userAgent.indexOf("TeldAndroidWebView") !== -1;
      },
      askForDeviceInfo: askForDeviceInfo, tokenTimeout: TokenTimeout,
      askForDeviceInfoIOS: askForDeviceInfoIOS,
      readCookie: readCookie,
      _createCookie: _createCookie,
      inIOS: window.navigator.userAgent.indexOf("TeldIosWebView") !== -1
    };
  });
