///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import moment from 'moment';
import config from 'app/core/config';
import ResponseParser from './response_parser';
import embed_teldapp from 'app/core/embed_teldapp';
import graftrace from 'app/core/utils/graftrace';

export class TeldServiceGatewayDatasource {
  id: any;
  name: any;
  // responseParser: ResponseParser;

  /** @ngInject **/
  constructor(instanceSettings, private backendSrv, private $q, protected templateSrv, private contextSrv, private alertSrv) {
    this.name = instanceSettings.name;
    this.id = instanceSettings.id;
    // this.responseParser = new ResponseParser(this.$q);
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
      sghost_bak: function (host) {
        host = host || 'sgi';
        let { protocol, hostname, port } = window.location;
        let domain = hostname.split('.');
        if (_.size(domain) >= 2) {
          domain = [domain.pop(), domain.pop()].reverse();
        }
        return `${protocol}//${host}.${domain.join(".")}`;
      },
      sghost: function (host) {
        host = host || 'sgi';
        let { protocol, hostname, port } = window.location;
        let domain = document.domain || hostname;
        var ares = domain.split(':')[0].split('.');
        if (_.size(ares) > 2) {
          ares.shift();
        }
        ares.unshift("");
        domain = ares.join('.');
        // if (!/^\.teld\.(cn|net)+$/i.test(domain)) { domain += ':7777'; }//准生产加端口号
        if (!/^\.(teld\.(cn|net)+|hfcdgs.com)$/i.test(domain)) { domain += ':7777'; }//准生产加端口号
        return `${protocol}//${host}${domain}`;
      }
    }
  };


  setScopedExpression(scopedExpressionVars, options) {
    var filterFun = function (item) {
      return item.type === 'teldExpression' && "es" === (item.filter || "es");
    };
    var teldExpressionVars = this.templateSrv.teldExpressionInDataSource2ScopedVarsFormCache(options, 'TSG',
      options.scopedVars, 'lucene', filterFun);
    _.defaults(scopedExpressionVars, teldExpressionVars);
    return scopedExpressionVars;
  };


  getQueries(options, deviceInfo) {
    console.log(this.name);
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
        // var filterFun = function (item) {
        //   return item.type === 'teldExpression' && "es" === (item.filter || "es");
        // };
        // var scopedExpressionVars = this.templateSrv.teldExpressionInDataSource2ScopedVarsFormCache(options, 'TSG',
        //   options.scopedVars, 'lucene', filterFun);
        // debugger;
        var scopedExpressionVars = {};
        this.setScopedExpression(scopedExpressionVars, options);

        if (param.type === 'object') {
          param.value = _.transform(param.value, (result, eachitem) => {
            var originalVal = eachitem.v;
            var v = eachitem.v || '';
            v = this.templateSrv.replaceScopedVars(v, Object.assign({}, options.scopedVars, scopedExpressionVars));
            v = this.templateSrv.replace(v, scopedVars, this.interpolateVariable);
            let compiled = _.template(v, templateSettings);
            v = compiled(bindData);
            if (originalVal === v && _.includes(v, '$')) {
              if (true !== eachitem.enableDefValue) {
                return;
              }
              v = eachitem.defValue || "";
            }
            result[eachitem.k] = v;
          }, {});
          if (_.size(param.value) === 0) {
            return;
          }
        } else if (param.type === 'list') {
          var columns = _.map(param.columns, 'name');
          var numberCols = _.map(_.filter(param.columns, { type: 'number' }), 'name');
          param.value = _.transform(param.value, (result, eachitem) => {
            var val = _.pick(eachitem, columns);
            _.each(val, (v, key) => {
              var isNumber = _.includes(numberCols, key);
              v = "" + v;
              var originalVal = v;
              v = this.templateSrv.replaceScopedVars(v, Object.assign({}, options.scopedVars, scopedExpressionVars));
              v = this.templateSrv.replace(v, scopedVars, this.interpolateVariable);
              let compiled = _.template(v, templateSettings);
              v = compiled(bindData);
              if (originalVal === v && _.includes(v, '$')) {
                if (true !== eachitem.enableDefValue) {
                  return;
                }
                v = eachitem.defValue || "";
              }
              if (isNumber) {
                v = _.toNumber(v);
              }
              val[key] = v;
              console.log(val);
            });
            result.push(val);
          }, []);
          if (_.size(param.value) === 0) {
            return;
          }
        } else {
          param.value = this.templateSrv.replaceScopedVars(param.value, Object.assign({}, options.scopedVars, scopedExpressionVars));
          param.value = this.templateSrv.replace(param.value, scopedVars, this.interpolateVariable);
          let compiled = _.template(param.value, templateSettings);
          param.value = compiled(bindData);
          if (param.originalVal === param.value && _.includes(param.value, '$')) {
            if (true !== param.enableDefValue) {
              return;
            }
            param.value = param.defValue || "";
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
        // _graftrace_: options._graftrace_,
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

  iosDev(resolve, reject) {
    var i = 0;
    var intervalHandle = setInterval(function () {
      i++;
      var deviceInfo = embed_teldapp.readCookie('DeviceInfoForIframe');
      if (deviceInfo !== "" || i > 10) {
        clearInterval(intervalHandle);
        deviceInfo = window['decodeURIComponent'](deviceInfo);
        resolve(deviceInfo);
      }
    }, 0);
  }


  iosDevTimeout(resolve, reject) {
    var i = 0;
    console.log('iosDevTimeout');
    function getDeviceInfoFromCookie() {
      var deviceInfo = embed_teldapp.readCookie('DeviceInfoForIframe');
      if (deviceInfo !== "" || i > 10) {
        deviceInfo = window['decodeURIComponent'](deviceInfo);
        window['document']['getElementById']['innerHTML'] = deviceInfo.replace(/,/g, "<br>");
        resolve(deviceInfo);
      } else {
        setTimeout(getDeviceInfoFromCookie, 1000);
      }
    }

    setTimeout(getDeviceInfoFromCookie, 0);
  }

  query(options) {
    //debugger;
    //alert(embed_teldapp.inIOS);
    var deviceInfo = "";
    if (embed_teldapp.isInApp()) {
      if (embed_teldapp.inIOS) {
        embed_teldapp.askForDeviceInfoIOS(embed_teldapp);
        var promise = new Promise(this.iosDevTimeout).then(deviceInfo => {
          //alert('deviceInfo=' + deviceInfo);
          embed_teldapp.ddd = false;
          return this.getQuery(options, deviceInfo);
        });
        return promise;
      } else {
        deviceInfo = embed_teldapp.askForDeviceInfo();
      }
    } else {
      var telda = embed_teldapp.readCookie('telda'), teldb = embed_teldapp.readCookie('teldb');
      if ((!telda || !teldb) && window.location.hostname !== 'localhost') {
        // this.alertSrv.set("会话超时", "会话超时", "warning", 4000);
        // debugger;
        if (window === top) {
          this.alertSrv.set("会话超时", "会话超时", "warning", 4000);
        } else {
          window.top.postMessage("gotoLogin", "*");
        }

        return this.$q.when({ data: [] });
      }
    }
    return this.getQuery(options, deviceInfo);
  }

  getQuery(options, deviceInfo) {
    var queries = this.getQueries(options, deviceInfo);

    if (queries.length === 0) {
      return this.$q.when({ data: [] });
    }
    var responseParser = new ResponseParser(this.$q);
    responseParser.setQueries(queries);
    var reqOptions = {
      url: '/callteldsg/_sg',
      method: 'POST',
      data: {
        from: options.range.from.valueOf().toString(),
        to: options.range.to.valueOf().toString(),
        queries: queries,
      }
    };
    if (options._graftrace_) {
      if ("teld-servicegateway-essql-datasource" === _.get(this, 'meta.id')) {
        var esSQL = _.find(_.flatten(_.map(queries, 'parameters')), { key: "ESSql" });
        var context = null;
        if (esSQL.value) {
          context = esSQL.value;
        }
        graftrace.setGraftraceHeaders(this, reqOptions, context, options._graftrace_);
      }
      delete options._graftrace_;
    }
    return this.backendSrv.datasourceRequest(reqOptions).then(responseParser.processQueryResult.bind(responseParser));
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
    var responseParser = new ResponseParser(this.$q);
    return this.backendSrv.datasourceRequest({
      url: '/api/tsdb/query',
      method: 'POST',
      data: {
        queries: [interpolatedQuery],
      }
    })
      .then(data => responseParser.parseMetricFindQueryResult(refId, data));
  }

  testDatasource() {
    return new Promise(resolve => {
      resolve({ status: "success", message: "Data source is working", title: "Success" });
    });
  }
}

