///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import config from 'app/core/config';
import ResponseParser from './response_parser';
import embed_teldapp from 'app/core/embed_teldapp';

export class TeldServiceGatewayDatasource {
  id: any;
  name: any;
  responseParser: ResponseParser;

  /** @ngInject **/
  constructor(instanceSettings, private backendSrv, private $q, private templateSrv, private contextSrv) {
    this.name = instanceSettings.name;
    this.id = instanceSettings.id;
    this.responseParser = new ResponseParser(this.$q);
  }

  interpolateVariable(value) {
    if (typeof value === 'string') {
      let regExp = new RegExp("<orderby='(.+?)'/>");
      let matches = regExp.exec(value);
      if (matches) {
        return matches[1];
      }
      return value;
    } else {
      value;
    }

    // if (typeof value === 'number') {
    //   return value;
    // }

    // var quotedValues = _.map(value, function(val) {
    //   if (typeof value === 'number') {
    //     return value;
    //   }

    //   return '\'' + val + '\'';
    // });
    // return  quotedValues.join(',');
  }

  imports = {
    '_': _,
    'moment': moment,
    'contextSrv': this.contextSrv,
    'config': config,
    'urlHelper': {
      sghost: function (host) {
        host = host || 'sgi';
        let { protocol, hostname, port } = window.location;
        let domain = hostname.split('.');
        if (_.size(domain) >= 2) {
          domain = [domain.pop(), domain.pop()].reverse();
        }
        return `${protocol}//${host}.${domain.join(".")}`;
      }
    }
  };

  getQueries_bak(options) {
    let { protocol, hostname, port } = window.location;
    let domain = hostname.split('.');
    if (_.size(domain) >= 2) {
      let TLDs = domain.pop();
      let host = domain.pop();
      domain = [host, TLDs];
    }
    let templateSettings = { imports: this.imports, variable: 'bindData' };
    let bindData = {
      time: options.range,
      user: config.bootData.user,
      url: { protocol, hostname, port, domain: domain.join(".") }
    };
    let toUnix = options.range.to.valueOf();
    let fromUnix = options.range.from.valueOf();
    let scopedVars = _.defaults({
      to: { text: toUnix, value: toUnix },
      from: { text: fromUnix, value: fromUnix }
    }, options.scopedVars);


    // alert(_.has(window, 'teld.askForDeviceInfo'));
    // let askForDeviceInfo = _.get(window, 'teld.askForDeviceInfo', function () { return "no"; });
    //let deviceInfo = window['teld']['askForDeviceInfo']();

    // let deviceInfo = "";
    // if (_.has(window, 'teld.askForDeviceInfo')) {
    //   deviceInfo = window['teld']['askForDeviceInfo']();
    // }
    // alert(deviceInfo);
    // alert("askForDeviceInfo()");


    let deviceInfo = embed_teldapp.askForDeviceInfo();

    var queries = _.filter(options.targets, item => {
      return item.hide !== true;
    }).map(item => {

      let parameters = _.cloneDeep(item.parameters);

      parameters = _.transform(parameters, (r, param) => {
        param.originalVal = param.value;
        if (param.type === 'object') {
          param.value = _.transform(param.value, (result, eachitem) => {
            var originalVal = eachitem.v;
            var v = eachitem.v || '';
            v = this.templateSrv.replace(v, scopedVars, this.interpolateVariable);
            let compiled = _.template(v, templateSettings);
            v = compiled(bindData);
            if (originalVal === v && _.includes(v, '$')) { return; }
            result[eachitem.k] = v;
          }, {});
          if (_.size(param.value) === 0) {
            return;
          }
        } else {
          param.value = this.templateSrv.replace(param.value, scopedVars, this.interpolateVariable);
          let compiled = _.template(param.value, templateSettings);
          param.value = compiled(bindData);
          if (param.originalVal === param.value && _.includes(param.value, '$')) {
            return;
          }
        }
        r.push(param);
      }, []);

      let url = this.templateSrv.replace(item.url, scopedVars, this.interpolateVariable);
      url = _.template(url, templateSettings)(bindData);
      return {
        refId: item.refId,
        intervalMs: options.intervalMs,
        maxDataPoints: options.maxDataPoints,
        datasourceId: this.id,
        url: url,
        deviceInfo: deviceInfo,
        parameters: parameters,
        filterWrap: item.filterWrap,
        filterKey: item.filterKey,
        format: item.format,
        time_sec: item.time_sec,
        time_sec_format: item.time_sec_format,
      };
    });

    return queries;
  }

  getQueries(options, deviceInfo) {
    let { protocol, hostname, port } = window.location;
    let domain = hostname.split('.');
    if (_.size(domain) >= 2) {
      let TLDs = domain.pop();
      let host = domain.pop();
      domain = [host, TLDs];
    }
    let templateSettings = { imports: this.imports, variable: 'bindData' };
    let bindData = {
      time: options.range,
      user: config.bootData.user,
      url: { protocol, hostname, port, domain: domain.join(".") }
    };
    let toUnix = options.range.to.valueOf();
    let fromUnix = options.range.from.valueOf();
    let scopedVars = _.defaults({
      to: { text: toUnix, value: toUnix },
      from: { text: fromUnix, value: fromUnix }
    }, options.scopedVars);

    var queries = _.filter(options.targets, item => {
      return item.hide !== true;
    }).map(item => {

      let parameters = _.cloneDeep(item.parameters);

      parameters = _.transform(parameters, (r, param) => {
        param.originalVal = param.value;
        if (param.type === 'object') {
          param.value = _.transform(param.value, (result, eachitem) => {
            var originalVal = eachitem.v;
            var v = eachitem.v || '';
            v = this.templateSrv.replace(v, scopedVars, this.interpolateVariable);
            let compiled = _.template(v, templateSettings);
            v = compiled(bindData);
            if (originalVal === v && _.includes(v, '$')) { return; }
            result[eachitem.k] = v;
          }, {});
          if (_.size(param.value) === 0) {
            return;
          }
        } else {
          param.value = this.templateSrv.replace(param.value, scopedVars, this.interpolateVariable);
          let compiled = _.template(param.value, templateSettings);
          param.value = compiled(bindData);
          if (param.originalVal === param.value && _.includes(param.value, '$')) {
            return;
          }
        }
        r.push(param);
      }, []);

      let url = this.templateSrv.replace(item.url, scopedVars, this.interpolateVariable);
      url = _.template(url, templateSettings)(bindData);
      return {
        refId: item.refId,
        intervalMs: options.intervalMs,
        maxDataPoints: options.maxDataPoints,
        datasourceId: this.id,
        url: url,
        deviceInfo: deviceInfo,
        parameters: parameters,
        filterWrap: item.filterWrap,
        filterKey: item.filterKey,
        format: item.format,
        time_sec: item.time_sec,
        time_sec_format: item.time_sec_format,
      };
    });

    return queries;
  }

  query_bak(options) {

    var queries = this.getQueries_bak(options);

    if (queries.length === 0) {
      return this.$q.when({data: []});
    }

    return this.backendSrv.datasourceRequest({
      url: '/callteldsg/_sg',
      method: 'POST',
      data: {
        from: options.range.from.valueOf().toString(),
        to: options.range.to.valueOf().toString(),
        queries: queries,
      }
    }).then(this.responseParser.setQueries(queries).processQueryResult.bind(this.responseParser));
  }

  iosDev(resolve, reject) {
    var i = 0;
    var o = setInterval(function () {
      i++;
      var v = embed_teldapp.readCookie('DeviceInfoForIframe');
      if (v !== "" || i > 10) {
        clearInterval(o);
        //embed_teldapp._createCookie('DeviceInfoForIframe', '');
        //alert('iosDev' + v);
        v = window['decodeURIComponent'](v);
        //alert(window.sessionStorage.getItem('DeviceInfoForIframe'));
        resolve(v);
      }
    }, 1500);
  }

  query(options) {
    //debugger;
    //alert(embed_teldapp.inIOS);
    if (embed_teldapp.inIOS) {
      embed_teldapp.askForDeviceInfoIOS(embed_teldapp);
      var promise = new Promise(this.iosDev).then(deviceInfo => {
        //alert('deviceInfo=' + deviceInfo);
        return this.getQuery(options, deviceInfo);
      });
      return promise;
    }
    return this.getQuery(options, '');
  }

  getQuery(options, deviceInfo) {
    var queries = this.getQueries(options, deviceInfo);

    if (queries.length === 0) {
      return this.$q.when({ data: [] });
    }

    return this.backendSrv.datasourceRequest({
      url: '/callteldsg/_sg',
      method: 'POST',
      data: {
        from: options.range.from.valueOf().toString(),
        to: options.range.to.valueOf().toString(),
        queries: queries,
      }
    }).then(this.responseParser.setQueries(queries).processQueryResult.bind(this.responseParser));
  }

  metricFindQuery(query, optionalOptions) {
    let refId = 'tempvar';
    if (optionalOptions && optionalOptions.variable && optionalOptions.variable.name) {
      refId = optionalOptions.variable.name;
    }

    const interpolatedQuery = {
      refId: refId,
      datasourceId: this.id,
      rawSql: this.templateSrv.replace(query, {}, this.interpolateVariable),
      format: 'table',
    };

    return this.backendSrv.datasourceRequest({
      url: '/api/tsdb/query',
      method: 'POST',
      data: {
        queries: [interpolatedQuery],
      }
    })
    .then(data => this.responseParser.parseMetricFindQueryResult(refId, data));
  }

  testDatasource() {
    return new Promise(resolve => {
      resolve({ status: "success", message: "Data source is working", title: "Success" });
    });
  }
}

