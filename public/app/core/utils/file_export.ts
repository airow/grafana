///<reference path="../../headers/common.d.ts" />

import _ from 'lodash';

declare var window: any;

export function exportSeriesListToCsv(seriesList) {
    var text = '\uFEFFSeries,Time,Value\n';
    _.each(seriesList, function(series) {
        _.each(series.datapoints, function(dp) {
            text += series.alias + ',' + new Date(dp[1]).toISOString() + ',' + dp[0] + '\n';
        });
    });
    saveSaveBlob(text, 'grafana_data_export.csv');
};

export function exportSeriesListToCsvColumns(seriesList) {
    var text = '\uFEFFTime,';
    // add header
    _.each(seriesList, function(series) {
        text += series.alias + ',';
    });
    text = text.substring(0,text.length-1);
    text += '\n';

    // process data
    var dataArr = [[]];
    var sIndex = 1;
    _.each(seriesList, function(series) {
        var cIndex = 0;
        dataArr.push([]);
        _.each(series.datapoints, function(dp) {
            dataArr[0][cIndex] = new Date(dp[1]).toISOString();
            dataArr[sIndex][cIndex] = dp[0];
            cIndex++;
        });
        sIndex++;
    });

    // make text
    for (var i = 0; i < dataArr[0].length; i++) {
        text += dataArr[0][i] + ',';
        for (var j = 1; j < dataArr.length; j++) {
            text += dataArr[j][i] + ',';
        }
        text = text.substring(0,text.length-1);
        text += '\n';
    }
    saveSaveBlob(text, 'grafana_data_export.csv');
};

export function exportTableDataToCsv(table) {
    return exportTableDataToCsvzh_CN(table);
    // var text = '\uFEFF\nsep=;\n';
    // // add header
    // _.each(table.columns, function(column) {
    //     text += column.text + ';';
    // });
    // text += '\n';
    // // process data
    // _.each(table.rows, function(row) {
    //     _.each(row, function(value) {
    //         text += value + ';';
    //     });
    //     text += '\n';
    // });
    // saveSaveBlob(text, 'grafana_data_export.csv');
};

export function exportTableDataToExcelXML(table) {

  var header = _.map(table.columns, column => { return `<Cell><Data ss:Type="String">${column.text}</Data></Cell>`; });

  var rows = _.transform(table.rows, (result, row, key) => {
    result.push('<Row>');
    _.each(row, value => {
      result.push(`<Cell><Data ss:Type="String">${value}</Data></Cell>`);
    });
    result.push('</Row>');
  }, []);

  var text = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Sheet1">
  <Table>
   <Row>
    ${header.join("\r\n")}
   </Row>
   ${rows.join("\r\n")}
  </Table>
 </Worksheet>
</Workbook>`;
  var blob = new Blob([text], { type: "application/vnd.ms-excel;charset=utf-8" });
  window.saveAs(blob, 'grafana_data_export.xml');
};

function exportTableDataToCsvzh_CN(table) {
  var text = '\uFEFF';
  // add header
  _.each(table.columns, function(column) {
      text += column.text + ',';
  });
  text += '\n';
  // process data
  _.each(table.rows, function(row) {
      _.each(row, function(value) {
          text += value + ',';
      });
      text += '\n';
  });
  saveSaveBlob(text, 'grafana_data_export.csv');
};

export function saveSaveBlob(payload, fname) {
    var blob = new Blob([payload], { type: "text/csv;charset=utf-8" });
    window.saveAs(blob, fname);
};
