import _ from 'lodash';
import moment from 'moment';
import kbn from 'app/core/utils/kbn';

export default class SeriesDrilldownParsing {
  templateSrv: any;
  timeSrv: any;
  vars: any;

  constructor(templateSrv, timeSrv) {
    this.templateSrv = templateSrv;
    this.timeSrv = timeSrv;
  }

  templateSettings = {
    imports: {
      helper: {
        '_': _,
        'kbn': kbn,
        'm': moment,
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
      }
    }
  };

  refreshDashVars() {
    let range = this.timeSrv.timeRange();
    var dashVars = [
      { name: 'dashTimeFrom', text: range.from, value: range.from },
      { name: 'dashTimeTo', text: range.to, value: range.to }
    ];
    _.transform(this.templateSrv.variables, (r, v, k) => {
      r.push({ name: v.name, text: v.current.text, value: v.current.value });
    }, dashVars);

    this.vars = _.transform(dashVars, (r, v, k) => {
      //r[v.name] = v.text === v.value ? v.value : _.omit(v, ['name']);
      r[v.name] = _.omit(v, ['name']);
    }, {});
    return dashVars;
  }

  parsing(links: any[], clickData) {
    this.refreshDashVars();
    var returnValue = _.transform(links, (r, link, k) => {
      var l = this.transform(link, clickData);
      r.push(l);
    }, []);
    return returnValue;
  }

  parsingLink(link, clickData) {
    this.refreshDashVars();
    let bindLink = this.transform(link, clickData);
    return bindLink;
  }

  transform(link, clickData) {
    var bindData = _.defaultsDeep({ vars: this.vars }, clickData);
    var bindLink = {
      title: link.name,
      target: link.target || "_blank",
      href: _.template(link.url, this.templateSettings)(bindData)
    };
    return bindLink;
  }
}
