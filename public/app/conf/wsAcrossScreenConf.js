define([
  'angular',
  'jquery',
  './wsUrlConf',
],
  function (angular, $, wsUrlConf) {
    'use strict';
    var module = angular.module('grafana.services');
    module.service('wsAcrossScreenConfSrv', function (alertSrv) {

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
        goto: goto,
        centermap: {},
        lt: {
          gotoprovince: {
            /** 运营面板_U（全国） */
            dashboard: 'dashboard://db/lefttop-gotoprovince'
          },
          gotocity: {
            /** 运营面板_U（城市）*/
            dashboard: 'dashboard://db/lefttop-gotocity'
          },
          gotostat: {
            /** 运营面板_U（电站） */
            dashboard: 'dashboard://db/lefttop-gotostat'
          }
        },
        rt: {
          gotoprovince: {
            /** 运营面板_U（全国） */
            dashboard: 'dashboard://db/righttop-gotoprovince'
          },
          gotocity: {
            /** 运营面板_U（城市）*/
            dashboard: 'dashboard://db/righttop-gotocity'
          },
          gotostat: {
            /** 运营面板_U（电站） */
            dashboard: 'dashboard://db/righttop-gotostat'
          }
        },
        screen: {
          gotoprovince: {
            /** 运营面板_U（全国） */
            dashboard: 'dashboard://db/yun-ying-mian-ban-_u-quan-guo'
          },
          gotocity: {
            /** 运营面板_U（城市）*/
            dashboard: 'dashboard://db/yun-ying-mian-ban-_u-cheng-shi'
          },
          gotostat: {
            /** 运营面板_U（电站） */
            dashboard: 'dashboard://db/yun-ying-mian-ban-_u-dian-zhan'
          }
        },
        // /** 运营面板 */
        // lefttop: {
        //   gotoprovince: {
        //     /** 运营面板_U（全国） */
        //     dashboard: 'dashboard://db/yun-ying-mian-ban-_u-quan-guo'
        //   },
        //   gotocity: {
        //     /** 运营面板_U（城市）*/
        //     dashboard: 'dashboard://db/yun-ying-mian-ban-_u-cheng-shi'
        //   },
        //   gotostat: {
        //     /** 运营面板_U（电站） */
        //     dashboard: 'dashboard://db/yun-ying-mian-ban-_u-dian-zhan'
        //   }
        // },
        // leftbottom: {
        //   gotoprovince: {
        //     /** 运营面板_D（全国） */
        //     dashboard: 'dashboard://db/yun-ying-mian-ban-_d-quan-guo'
        //   },
        //   gotocity: {
        //     /** 运营面板_D（城市） */
        //     dashboard: 'dashboard://db/yun-ying-mian-ban-_d-cheng-shi'
        //   },
        //   gotostat: {
        //     /** 运营面板_D（电站） */
        //     dashboard: 'dashboard://db/yun-ying-mian-ban-_d-dian-zhan'
        //   }
        // },

        // /** 运维面板 */
        // righttop: {
        //   gotoprovince: {
        //     /** 运维面板_U（全国） */
        //     dashboard: 'dashboard://db/yun-wei-mian-ban-_u-quan-guo'
        //   },
        //   gotocity: {
        //     /** 运维面板_U（城市） */
        //     dashboard: 'dashboard://db/yun-wei-mian-ban-_u-cheng-shi'
        //   },
        //   gotostat: {
        //     /** 运维面板_U（电站） */
        //     dashboard: 'dashboard://db/yun-wei-mian-ban-_u-dian-zhan'
        //   }
        // },
        // rightbottom: {
        //   gotoprovince: {
        //     /** 运维面板_D（全国） */
        //     dashboard: 'dashboard://db/yun-wei-mian-ban-_d-quan-guo'
        //   },
        //   gotocity: {
        //     /** 运维面板_D（城市） */
        //     dashboard: 'dashboard://db/yun-wei-mian-ban-_d-cheng-shi'
        //   },
        //   gotostat: {
        //     /** 运维面板_U（电站） */
        //     dashboard: 'dashboard://db/yun-wei-mian-ban-_d-dian-zhan'
        //   }
        // }
      };

      var conf = {
        /** 支持变量
         * ${name}:grafana用户name;
         * ${login}:grafana用户login;
         * ${orgId}:grafana用户orgId;
         * */
        wsServerUrl: wsUrlConf.wsServerUrl,
        remoteConfUrl: wsUrlConf.remoteConfUrl,
        SCREEN_CONF: SCREEN_CONF,
        singleUser: false,
        loadConf: function (contextUser) {
          var returnValue = this.SCREEN_CONF;
          if (this.remoteConfUrl) {
            console.group('loadConf');
            $.ajax({
              type: "get",
              async: false,
              url: this.remoteConfUrl,
              data: { userCode: contextUser.login },
              //contentType: "application/json; charset=utf-8",
              dataType: "json",
              cache: false,
            }).done(function (result) {
              console.log("loadConf done");
              returnValue = result;
            }).fail(function (err) {

              if (err.statusText === "OK") {
                var evalFunName = "eval";
                returnValue = window[evalFunName]("(" + err.responseText + ")");
                console.log("loadConf fail, but eval");
              } else {
                //alert('载入配置信息异常');
                alertSrv.set("载入配置信息异常", err, "warning", 4000);
                console.error("loadConf err", err);
              }
            }).always(function () {
              console.log("loadConf complete");
            });
            console.groupEnd();
          }
          return returnValue;
        }
      };

      return conf;
    });
  });
