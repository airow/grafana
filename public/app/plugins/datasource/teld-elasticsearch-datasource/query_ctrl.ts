///<reference path="../../../headers/common.d.ts" />

import './bucket_agg';
import './metric_agg';
import './directives/script_fields';

import angular from 'angular';
import _ from 'lodash';
import queryDef from './query_def';
import {QueryCtrl} from 'app/plugins/sdk';

export class ElasticQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  esVersion: any;
  rawQueryOld: string;
  permissionOptions: any;
  getPermissionOptionsPromise: any;
  newPlusButton: any;
  doc2timeseriesSizeOptions: any;

  formats: any[];
  dateFormats: any[];
  mappingConf: any[];

  paramToString(param) {
    let returnValue = `${param.key}=${angular.toJson(param.value)}`;
    return returnValue;
  }

  /** @ngInject **/
  constructor($scope, $injector, private $rootScope, private $timeout, private uiSegmentSrv, private $http) {
    super($scope, $injector);

    this.formats = [
      { text: 'Time series', value: 'time_series' },
      //{text: 'Time series Objs', value: 'time_series_objs'},
      { text: 'Table', value: 'table' },
      { text: 'Series', value: 'series' },
      //{text: 'Objects', value: 'object'},
    ];
    this.dateFormats = [
      { text: 'Unix ms timestamp', value: 'x' },
      { text: 'Unix timestamp', value: 'X' },
      { text: 'YYYYMMDD', value: 'YYYYMMDD' },
      { text: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
      { text: 'MM/DD/YY h:mm:ss a', value: 'MM/DD/YY h:mm:ss a' },
      { text: 'MMMM D, YYYY LT', value: 'MMMM D, YYYY LT' },
    ];

    this.mappingConf = [
      { text: '字符串', value: 'string' },
      { text: '数组', value: 'stringArray' },
      { text: '对象数组', value: 'objArray' }
    ];

    this.esVersion = this.datasource.esVersion;
    this.target.dataPermission = this.target.dataPermission || [];
    this.target.attachFilter = this.target.attachFilter || [];
    if (false === _.has(this.target, 'doc2timeseries.size')) {
      _.set(this.target, 'doc2timeseries.size', '10000');
    }
    this.queryUpdated();

    // if (this.target.enableAttachFilter) {

    //   this.target.attachFilter = [
    //     {
    //       bool: [
    //         {
    //           boolType: "should",
    //           boolArray: [
    //             {
    //               type: "query_string",
    //               query: "电站类型.keyword:/安徽省/"
    //             },
    //             {
    //               "field": "电站ID.keyword",
    //               "type": "terms",
    //               "filterWrap": true,
    //               "url": "https://sgi.teld.cn/api/invoke?SID=BIDA-GetSalesOrgnizationHelp",
    //               "filterKey": "filter",
    //               "format": "table",
    //               "parameters": [{
    //                 "key": "Page",
    //                 "type": "value",
    //                 "value": "1"
    //               }, {
    //                 "defValue": "10",
    //                 "enableDefValue": true,
    //                 "key": "Rows",
    //                 "type": "value",
    //                 "value": "10"
    //               }, {
    //                 "key": "FilterKey",
    //                 "type": "object",
    //                 "value": {
    //                   "DataType": "grafanaPower",
    //                   "SortField": "0"
    //                 }
    //               }
    //               ]
    //             }
    //           ]
    //         },
    //         {
    //           boolType: "must",
    //           boolArray: [
    //             {
    //               type: "query_string",
    //               query: "电站类型.keyword:/安徽省/"
    //             },
    //             {
    //               "field": "电站ID.keyword",
    //               "type": "terms",
    //               "filterWrap": true,
    //               "url": "https://sgi.teld.cn/api/invoke?SID=BIDA-GetSalesOrgnizationHelp",
    //               "filterKey": "filter",
    //               "format": "table",
    //               "parameters": [{
    //                 "key": "Page",
    //                 "type": "value",
    //                 "value": "1"
    //               }, {
    //                 "defValue": "10",
    //                 "enableDefValue": true,
    //                 "key": "Rows",
    //                 "type": "value",
    //                 "value": "10"
    //               }
    //               ]
    //             }
    //           ]
    //         }
    //       ]
    //     }
    //   ];
    // }

    this.newPlusButton = uiSegmentSrv.newPlusButton();
    this.doc2timeseriesSizeOptions = queryDef.doc2timeseriesSizeOptions;

    this.getPermissionOptionsPromise = (query, callback) => {
      return this.$http({
        method: 'GET',
        url: '/dataplist'
      }).then(function successCallback(response) {
        if (response.status === 200) {
          callback(response.data);
        } else {
          callback([]);
        }
      }, function errorCallback(response) {
        callback([]);
      }).catch((err) => {
        callback([]);
      });
    };
  }

  getFields(type) {
    var jsonStr = angular.toJson({find: 'fields', type: type});
    return this.datasource.metricFindQuery(jsonStr)
    .then(this.uiSegmentSrv.transformToSegments(false))
    .catch(this.handleQueryError.bind(this));
  }

  // getPermissionOptionsPromise(queryStr, callback) {
  //   debugger;
  //   //var h = this.$injector.get('$http');

  //   //return this.$injector.get('$http').get()
  //   //return ["mockCode", "Code5002340003", "mockName"];
  // }

  queryUpdated() {
    var newJson = angular.toJson(this.datasource.queryBuilder.build(this.target), true);
    if (newJson !== this.rawQueryOld) {
      this.rawQueryOld = newJson;
      this.refresh();
    }

    this.$rootScope.appEvent('elastic-query-updated');
  }

  removeItem(itemArray, item) {
    var index = _.indexOf(itemArray, itemArray);
    itemArray.splice(index, 1);
  }

  moveItem(itemArray, index, newIndex) {
    _.move(itemArray, index, newIndex);
  }

  getCollapsedText() {
    var metricAggs = this.target.metrics;
    var bucketAggs = this.target.bucketAggs;
    var metricAggTypes = queryDef.getMetricAggTypes(this.esVersion);
    var bucketAggTypes = queryDef.bucketAggTypes;
    var text = '';

    if (this.target.query) {
      text += 'Query: ' + this.target.query + ', ';
    }

    text += 'Metrics: ';

    _.each(metricAggs, (metric, index) => {
      var aggDef = _.find(metricAggTypes, {value: metric.type});
      text += aggDef.text + '(';
      if (aggDef.requiresField) {
        text += metric.field;
      }
      text += '), ';
    });

    _.each(bucketAggs, (bucketAgg, index) => {
      if (index === 0) {
        text += ' Group by: ';
      }

      var aggDef = _.find(bucketAggTypes, {value: bucketAgg.type});
      text += aggDef.text + '(';
      if (aggDef.requiresField) {
        text += bucketAgg.field;
      }
      text += '), ';
    });

    if (this.target.alias) {
      text += 'Alias: ' + this.target.alias;
    }

    return text;
  }

  handleQueryError(err) {
    this.error = err.message || 'Failed to issue metric query';
    return [];
  }


  isRawDocument() {
    return false === _.isUndefined(_.find(this.target.metrics, { type: 'raw_document' }));
  }

  addScriptField() {
    var scriptFields = (this.target.scriptFieldsConf = this.target.scriptFieldsConf || []);
    var addIndex = scriptFields.length;

    var id = _.reduce(this.target.scriptFieldsConf, function (max, val) {
      return parseInt(val.id) > max ? parseInt(val.id) : max;
    }, 0);

    scriptFields.splice(addIndex, 0, {
      name: "script" + (id + 1).toString(),
      sort: false,
      script: {
        script: {
          "source": "",
        },
        type: "number",
        order: "asc"
      },
      id: (id + 1).toString()
    });
  }

  addField() {

    var sourceFields = (this.target.sourceFieldsConf = this.target.sourceFieldsConf || []);
    sourceFields.push(this.newPlusButton.value);

    var plusButton = this.uiSegmentSrv.newPlusButton();
    this.newPlusButton.html = plusButton.html;
    this.newPlusButton.value = plusButton.value;
  }

  removeField(field) {
    this.target.sourceFieldsConf = _.without(this.target.sourceFieldsConf, field);
  }
}
