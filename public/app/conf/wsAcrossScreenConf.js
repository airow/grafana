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
        gotonational: {
          dashboard: 'dashboard://db/gotonational'
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
          gotonational: {
            /** 运营面板_U（全国） */
            dashboard: 'dashboard://db/lefttop-gotonational'
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
          gotonational: {
            /** 运营面板_U（全国） */
            dashboard: 'dashboard://db/righttop-gotonational'
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
          gotonational: {
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
        /** 运营面板 */
        lefttop: {
          gotonational: {
            /** 运营面板_U（全国） */
            dashboard: 'dashboard://db/yun-ying-mian-ban-_u-quan-guo'
          },
          gotoprovince: {
            /** 运营面板_U（省份）*/
            dashboard: 'dashboard://db/yun-ying-mian-ban-_u-sheng-fen'
          },
          gotocity: {
            /** 运营面板_U（城市）*/
            dashboard: 'dashboard://db/yun-ying-mian-ban-_u-cheng-shi'
          },
          gotostat: {
            /** 运营面板_U（电站） */
            dashboard: 'dashboard://db/yun-ying-mian-ban-_u-dian-zhan'
          },
          gotoplatformzhtheme: {
            /** 云平台运维监控_1_基础设施 */
            dashboard: 'dashboard://db/yun-ping-tai-yun-wei-jian-kong-_1_ji-chu-she-shi'
          }
        },
        leftbottom: {
          gotonational: {
            /** 运营面板_D（全国） */
            dashboard: 'dashboard://db/yun-ying-mian-ban-_d-quan-guo'
          },
          gotoprovince: {
            /** 运营面板_D（省份） */
            dashboard: 'dashboard://db/yun-ying-mian-ban-_d-sheng-fen'
          },
          gotocity: {
            /** 运营面板_D（城市） */
            dashboard: 'dashboard://db/yun-ying-mian-ban-_d-cheng-shi'
          },
          gotostat: {
            /** 运营面板_D（电站） */
            dashboard: 'dashboard://db/yun-ying-mian-ban-_d-dian-zhan'
          },
          gotoplatformzhtheme: {
            /** 云平台运维监控_2_技术平台 */
            dashboard: 'dashboard://db/yun-ping-tai-yun-wei-jian-kong-_2_ji-zhu-ping-tai'
          }
        },

        /** 运维面板 */
        righttop: {
          gotonational: {
            /** 运维面板_U（全国） */
            dashboard: 'dashboard://db/yun-wei-mian-ban-_u-quan-guo'
          },
          gotoprovince: {
            /** 运维面板_U（省份） */
            dashboard: 'dashboard://db/yun-wei-mian-ban-_u-sheng-fen'
          },
          gotocity: {
            /** 运维面板_U（城市） */
            dashboard: 'dashboard://db/yun-wei-mian-ban-_u-cheng-shi'
          },
          gotostat: {
            /** 运维面板_U（电站） */
            dashboard: 'dashboard://db/yun-wei-mian-ban-_u-dian-zhan'
          },
          gotoplatformzhtheme: {
            /** 云平台运维监控_4_研发过程管理 */
            dashboard: 'dashboard://db/yun-ping-tai-yun-wei-jian-kong-_4_yan-fa-guo-cheng-guan-li'
          }
        },
        rightbottom: {
          gotonational: {
            /** 运维面板_D（全国） */
            dashboard: 'dashboard://db/yun-wei-mian-ban-_d-quan-guo'
          },
          gotoprovince: {
            /** 运维面板_D（省份） */
            dashboard: 'dashboard://db/yun-wei-mian-ban-_d-sheng-fen'
          },
          gotocity: {
            /** 运维面板_D（城市） */
            dashboard: 'dashboard://db/yun-wei-mian-ban-_d-cheng-shi'
          },
          gotostat: {
            /** 运维面板_U（电站） */
            dashboard: 'dashboard://db/yun-wei-mian-ban-_d-dian-zhan'
          },
          gotoplatformzhtheme: {
            /** 云平台运维监控_5_运维态势 */
            dashboard: 'dashboard://db/yun-ping-tai-yun-wei-jian-kong-_5_yun-wei-tai-shi'
          }
        }
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
        singleUser: wsUrlConf.singleUser,
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
              returnValue.isloaded = true;
            }).fail(function (err) {

              if (err.statusText === "OK") {
                var evalFunName = "eval";
                returnValue = window[evalFunName]("(" + err.responseText + ")");
                returnValue.isloaded = true;
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
