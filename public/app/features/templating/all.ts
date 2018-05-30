import './templateSrv';
import './editor_ctrl';

import {VariableSrv} from './variable_srv';
import {IntervalVariable} from './interval_variable';
import {QueryVariable} from './query_variable';
import {DatasourceVariable} from './datasource_variable';
import {CustomVariable} from './custom_variable';
import {ConstantVariable} from './constant_variable';
import {AdhocVariable} from './adhoc_variable';

import {TeldCustomVariable} from './teld_custom_variable';
import {TeldAdhocVariable} from './teld_adhoc_variable';
import {TeldExpressionVariable} from './teld_expression_variable';
import {TeldSqlDataPermissionsVariable} from './teld_ds_sql_datapermissions_variable';

export {
  VariableSrv,
  IntervalVariable,
  QueryVariable,
  DatasourceVariable,
  CustomVariable,
  ConstantVariable,
  AdhocVariable,

  TeldCustomVariable,
  TeldAdhocVariable,
  TeldExpressionVariable,
  TeldSqlDataPermissionsVariable,
}
