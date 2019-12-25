///<reference path="../headers/common.d.ts" />

import angular from 'angular';
import 'me-pageloading';
import 'ui-select';
import 'ADM-dateTimePicker';
// import 'datatables';
import 'datatables.net';
import 'datatables.net.responsive';
import 'datatables.net.select';
import 'datatables.net.scroller';
import 'datatables.net.fixedHeader';
import 'datatables.net.fixedColumns';
// import 'angular-datatables';
export default angular.module('grafana.core', ['ngRoute', 'me-pageloading', 'ui.select', 'ADM-dateTimePicker']);
