///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';

import * as rangeUtil from 'app/core/utils/rangeutil';

export class QuerybarTimePickerCtrl {

  static tooltipFormat = 'MMM D, YYYY HH:mm:ss';
  static defaults = {
    time_options: ['5m', '15m', '1h', '6h', '12h', '24h', '2d', '7d', '30d'],
    refresh_intervals: ['5s', '10s', '30s', '1m', '5m', '15m', '30m', '1h', '2h', '1d'],
  };

  dashboard: any;
  panel: any;
  absolute: any;
  timeRaw: any;
  tooltip: string;
  rangeString: string;
  timeOptions: any;
  refresh: any;
  isOpen: boolean;
  isUtc: boolean;
  firstDayOfWeek: number;
  syncTimeRange: any;

  /** @ngInject */
  constructor(private $scope, private $rootScope, private timeSrv, private $location) {
    $scope.ctrl = this;

    this.syncTimeRange = this.$scope.syncTimeRange;
    this.dashboard = this.$scope.dashboard;

    // $rootScope.onAppEvent('shift-time-forward', () => this.move(1), $scope);
    // $rootScope.onAppEvent('shift-time-backward', () => this.move(-1), $scope);
    $rootScope.onAppEvent('refresh', () => this.init(), $scope);
    // $rootScope.onAppEvent('dash-editor-hidden', () => this.isOpen = false, $scope);

    // this.init();
    this.openDropdown();
  }

  init() {
    this.panel = this.dashboard.timepicker;

    _.defaults(this.panel, QuerybarTimePickerCtrl.defaults);

    this.firstDayOfWeek = moment.localeData().firstDayOfWeek();

    var time = angular.copy(this.timeSrv.timeRange());
    var timeRaw = angular.copy(time.raw);

    if (!this.dashboard.isTimezoneUtc()) {
      time.from.local();
      time.to.local();
      if (moment.isMoment(timeRaw.from)) {
        timeRaw.from.local();
      }
      if (moment.isMoment(timeRaw.to)) {
        timeRaw.to.local();
      }
    } else {
      this.isUtc = true;
    }

    this.rangeString = rangeUtil.describeTimeRange(timeRaw);
    this.absolute = { fromJs: time.from.toDate(), toJs: time.to.toDate() };
    this.tooltip = this.dashboard.formatDate(time.from) + ' <br>to<br>';
    this.tooltip += this.dashboard.formatDate(time.to);

    // do not update time raw when dropdown is open
    // as auto refresh will reset the from/to input fields
    if (!this.isOpen) {
      this.timeRaw = timeRaw;
    }
  }
  optionActive: any;
  openDropdown() {
    this.init();
    this.isOpen = true;
    this.timeOptions = rangeUtil.getRelativeTimesList(this.panel, this.rangeString);
    this.refresh = {
      value: this.dashboard.refresh,
      options: _.map(this.panel.refresh_intervals, (interval: any) => {
        return { text: interval, value: interval };
      })
    };

    this.refresh.options.unshift({ text: 'off' });

    // this.$rootScope.appEvent('show-dash-editor', {
    //   src: 'public/app/features/dashboard/timepicker/querybardropdown.html',
    //   scope: this.$scope,
    //   cssClass: 'gf-timepicker-dropdown',
    // });
  }

  applyCustom() {
    if (this.refresh.value !== this.dashboard.refresh) {
      this.timeSrv.setAutoRefresh(this.refresh.value);
    }

    //this.timeSrv.setTime(this.timeRaw);
    this.syncTimeRange(this.timeRaw);
    // this.$rootScope.appEvent('hide-dash-editor');
    this.dismiss();
  }

  absoluteFromChanged() {
    this.timeRaw.from = this.getAbsoluteMomentForTimezone(this.absolute.fromJs);
    this.$scope.openFromPicker = !this.$scope.openFromPicker;
  }

  absoluteToChanged() {
    this.timeRaw.to = this.getAbsoluteMomentForTimezone(this.absolute.toJs);
    this.$scope.openToPicker = !this.$scope.openToPicker;
  }

  getAbsoluteMomentForTimezone(jsDate) {
    return this.dashboard.isTimezoneUtc() ? moment(jsDate).utc() : moment(jsDate);
  }

  setRelativeFilter(timespan) {
    var range = { from: timespan.from, to: timespan.to };
    this.optionActive = timespan;

    if (this.panel.nowDelay && range.to === 'now') {
      range.to = 'now-' + this.panel.nowDelay;
    }

    // this.timeSrv.setTime(range);
    this.timeRaw = range;
    // this.openDropdown();
    // this.$rootScope.appEvent('hide-dash-editor');
  }

  hideQuick() {
    return false;
    // return _.has(this.$location.search(), 'hideQuick');
  }

  dismiss() {
    // this.publishAppEvent('hide-modal');
    this.$scope.$root.appEvent('hide-modal');
  }

}

export function querybarTimePickerDirective() {
  return {
    restrict: 'E',
    templateUrl: 'public/app/features/dashboard/timepicker/querybardropdown.html',
    controller: QuerybarTimePickerCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    // scope: {
    //   dashboard: "="
    // }
  };
}
angular.module('grafana.directives').directive('querybarTimePicker', querybarTimePickerDirective);
