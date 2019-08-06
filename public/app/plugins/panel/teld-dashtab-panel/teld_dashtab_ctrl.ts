///<reference path="../../../headers/common.d.ts" />

import { optionsEditorComponent } from './editor_component/options_editor';
import $ from 'jquery';
import _ from 'lodash';
import numeral from 'numeral';
import angular from 'angular';
import kbn from 'app/core/utils/kbn';
import * as dateMath from '../../../core/utils/datemath';
import moment from 'moment';
import appEvents from '../../../core/app_events';
import config from 'app/core/config';
import './directives/all';
import { MetricsPanelCtrl, loadPluginCssPath } from '../../sdk';

System.import('/public/app/plugins/panel/teld-dashtab-panel/css/css.built-in.css!css');
// loadPluginCssPath({ cssPath: '/public/app/plugins/panel/teld-dashtab-panel/css/swiper.${themeName}.built-in.css' });

export class TeldDashtabCtrl extends MetricsPanelCtrl {
  static templateUrl = `partials/module.html`;

  $window: any;
  $location: any;
  variableSrv: any;
  alertSrv: any;
  uiSegmentSrv: any;
  device: any;
  $http: any;

  // Set and populate defaults
  panelDefaults = {
    height: 10,
    butPermiFiled: 'name',
    isSaveTabIndex: false,
    dashboards: []
  };

  tabs: any[];

  /** @ngInject **/
  constructor($scope, $injector) {
    super($scope, $injector);
    this.$window = $injector.get("$window");
    this.$location = $injector.get("$location");
    this.$q = $injector.get('$q');
    this.datasourceSrv = $injector.get('datasourceSrv');
    this.timeSrv = $injector.get('timeSrv');
    this.templateSrv = $injector.get('templateSrv');
    this.variableSrv = $injector.get('variableSrv');
    this.alertSrv = $injector.get('alertSrv');
    this.uiSegmentSrv = $injector.get('uiSegmentSrv');
    this.$http = $injector.get('$http');

    this.device = (function () {
      var ua = window.navigator.userAgent;
      var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
      var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
      var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
      var iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
      return {
        ios: ipad || iphone || ipod,
        android: android
      };
    })();


    _.defaults(this.panel, this.panelDefaults);

    this.initLocalStorage();

    //this.events.on('render', this.onRender.bind(this));
    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('data-error', this.onDataError.bind(this));
    this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));

    this.events.on('refresh', () => {
      /*只进行一次数据请求，防止dashboard刷新面板再次请求数据*/
      this.events.removeAllListeners('refresh');
    });


    if (this.panel.injectDataList) {
      /*通过 dashtab_switch.js方式加载数据时，通过注入的dataList绑定*/
      console.log('onDataReceived with injectDataList', this.panel.injectDataList);
      this.events.removeAllListeners('refresh');
      this.onDataReceived(this.panel.injectDataList);
      delete this.panel.injectDataList;
    }

    this.visit();
  }

  initLocalStorage() {
    if (this.panel.isSaveTabIndex) {
      var current = _.find(this.panel.dashboards, item => {
        return _.toLower(item.dash) === _.toLower(this.dashboard.title);
      });
      if (current) {
        this.setLastDash(current);
      }
    } else {
      let localStorageKey = this.getLocalStorageKey();
      window.localStorage.removeItem(localStorageKey);
    }
  }

  onInitEditMode() {
    this.addEditorTab('Options', optionsEditorComponent);
    //this.editorTabIndex = 1;
  }

  onDataError() {
    this.render();
  }

  onDataReceived(dataList) {
    let dl = dataList;

    let datas = [];
    _.each(dl, data => {
      let columns = _.map(data.columns, 'text');
      let d = [];
      datas.push(d);
      _.each(data.rows, row => {
        let values = row;
        d.push(
          _.zipObject(columns, values)
        );
      });
    });


    let filter = _.map(_.flatten(datas), this.panel.butPermiFiled);

    let dashboards = this.panel.dashboards;
    let dashs = _.filter(dashboards, dash => {
      return _.isEmpty(dash.permissions) || _.includes(filter, dash.permissions);
    });

    dashs = _.map(dashs, slide => {
      return slide;
    });

    this.tabs = dashs;
  }

  onRender() {
    console.log('onRender');
    this.renderingCompleted();
    if (this.device.ios) {

    } else {

    }
  }

  getLocalStorageKey() {
    let ctrlPanel = this.panel;
    let search = this.$location.search();
    let lskey = search.lskey || ctrlPanel.localStorageKey;
    let dashLocalStorage = this.dashboard.dashLocalStorage;
    let localStorageKey = _.remove([dashLocalStorage, lskey, "dashtab"]).join("_");

    return localStorageKey;
  }

  visit(target?) {
    if (true !== this.panel.enableVisit) {
      return;
    }
    target = _.find(this.panel.dashboards, { dash: this.dashboard.meta.slug }) || target;
    if (_.get(target, "ignoreVisit", false)) {
      return;
    }
    var visitConf = this.panel.visitConf;
    var url = '/dashtabvisit',
      data = _.assign({}, visitConf, target),
      transFn = function (data) {
        return $.param(data);
      },
      config = {
        // headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        // transformRequest: transFn
      };
    this.$http.post(url, data, config).then(function successCallback(response) {
      // this callback will be called asynchronously
      // when the response is available
      console.log(response);
    }, function errorCallback(response) {
      // debugger;
      console.log(response);
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });
  }

  setLastDash(target) {
    if (this.panel.isSaveTabIndex) {
      let localStorageKey = this.getLocalStorageKey();
      let storage = window.localStorage.getItem(localStorageKey) || "{}";
      storage = JSON.parse(storage);
      storage['lastDash'] = _.omit(target, ['$$hashKey']);
      window.localStorage.setItem(localStorageKey, JSON.stringify(storage));
    }
  }

  isActive(target) {
    var returnValue = _.toLower(this.dashboard.meta.slug) === _.toLower(target.dash);
    // if (returnValue) {
    //   this.setLastDash(target);
    // }
    return returnValue;
  }

  getGoto(target) {
    this.setLastDash(target);
    if (target.dash === this.dashboard.meta.slug) {
      return false;
    }
    //处理表达式变量缓存
    delete window['teldExpression2ScopedVars'];
    if (window.location.pathname === "/dashboard/script/dashtab_switch.js" ||
      window.location.pathname === "/dashboard/script/dashtab_switch_link.js") {
      var search = this.$location.search();
      search.db = target.dash;
      if (this.panel.ignoreDate || target.ignoreDate) {
        delete search.from;
        delete search.to;
      }
      //search.tab = this.panel.localStorageKey;
      // this.$location.search(search);
      switch (window.location.pathname) {
        case "/dashboard/script/dashtab_switch.js":
          this.$location.path(`/dashboard/script/dashtab_switch_link.js`).search(search);
          break;
        case "/dashboard/script/dashtab_switch_link.js":
          this.$location.path(`/dashboard/script/dashtab_switch.js`).search(search);
          break;
      }
    } else {
      this.$location.path(`dashboard/db/${target.dash}`);
    }
    return false;
  }

  scrollLeft() {
    $(".buttons-tab").scrollLeft();
  }

  imports = {
    '_': _,
    'kbn': kbn,
    'valueFormats': (function (kbn) {
      let bindContext = {
        // kbn,
        // valueFormats: kbn.valueFormats,
        // kbnMap: _.mapKeys(_.flatten(_.map(kbn.getUnitFormats(), 'submenu')), (value) => { return value.text; }),
        valueFormats: _.transform(_.flatten(_.map(kbn.getUnitFormats(), 'submenu')), function (result, unitFormatConf, index) {
          result[unitFormatConf.text] = kbn.valueFormats[unitFormatConf.value];
        }, {})
      };

      return function (unitFormatName, size, decimals) {
        return this.valueFormats[unitFormatName](size, decimals);
      }.bind(bindContext);
    })(kbn)
  };

  issueQueries(datasource) {
    return super.issueQueries(datasource).then(data => {
      return data;
    });
  }

  newItem(array) {
    array.push({});
  }

  remove(array, variable) {
    var index = _.indexOf(array, variable);
    array.splice(index, 1);
  }

  move(array, index, newIndex) {
    _.move(array, index, newIndex);
  }
  triggerRefresh = false;

  query() {
    console.log('query');
    this.triggerRefresh = true;
    if (this.panel.subscribeRefresh) {

    } else {
      this.timeSrv.refreshDashboard();
    }
    return true;
  }

  onRefresh() {
    console.log('onRefresh');
    //this.onMetricsPanelRefresh();
    if (this.triggerRefresh === true) {
      this.triggerRefresh = false;
    } else {
      //this.toggleQuery(this.currentTarget);
    }
  }

  alert(s) {
    window.alert(s);
  }

}
