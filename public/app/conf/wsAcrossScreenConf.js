define([], function() {
  'use strict';

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
    /** 运营面板 */
    lefttop: {
      gotoprovince: {
        /** 运营面板_U（全国） */
        dashboard: 'dashboard://db/yun-ying-mian-ban-_u-quan-guo'
      },
      gotocity: {
        /** 运营面板_U（城市）*/
        dashboard: 'dashboard://db/gotocity'
      },
      gotostat: {
        /** 运营面板_U（电站） */
        dashboard: 'dashboard://db/gotostat'
      }
    },
    leftbottom: {
      gotoprovince: {
        /** 运营面板_D（全国） */
        dashboard: 'dashboard://db/yun-ying-mian-ban-_d-quan-guo'
      },
      gotocity: {
        /** 运营面板_D（城市） */
        dashboard: 'dashboard://db/gotocity' /** 运维面板_U（全国）*/
      },
      gotostat: {
        /** 运营面板_D（电站） */
        dashboard: 'dashboard://db/gotostat' /** 运营面板_D（全国） */
      }
    },

    /** 运维面板 */
    righttop: {
      gotoprovince: {
        /** 运维面板_U（全国） */
        dashboard: 'dashboard://db/yun-wei-mian-ban-_u-quan-guo'
      },
      gotocity: {
        dashboard: 'dashboard://db/gotocity'
      },
      gotostat: {
        dashboard: 'dashboard://db/gotostat'
      }
    },
    rightbottom: goto
  };

  var conf = {
    /** 支持变量
     * ${name}:grafana用户name;
     * ${login}:grafana用户login;
     * ${orgId}:grafana用户orgId;
     * */
    wsServerUrl: 'ws://rp1.teld.cn/api/WebSocket?user=${name}',
    SCREEN_CONF: SCREEN_CONF
  };

  return conf;

});
