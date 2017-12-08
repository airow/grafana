package mssql

import (
	"container/list"
	"context"
	"database/sql"
	"fmt"
	"regexp"
	"strconv"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/go-xorm/core"
	"github.com/grafana/grafana/pkg/components/null"
	"github.com/grafana/grafana/pkg/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/tsdb"
)

type MsSqlQueryEndpoint struct {
	sqlEngine tsdb.SqlEngine
	log       log.Logger
}

func init() {
	tsdb.RegisterTsdbQueryEndpoint("mssql", NewMsSqlQueryEndpoint)
}

type namesRegexp struct {
	*regexp.Regexp
}

func (r *namesRegexp) FindStringSubmatchMap(s string) map[string]string {
	captures := make(map[string]string)

	match := r.FindStringSubmatch(s)
	if match == nil {
		return captures
	}

	for i, name := range r.SubexpNames() {
		//
		if i == 0 {
			continue
		}
		captures[name] = match[i]

	}
	return captures
}

func NewMsSqlQueryEndpoint(datasource *models.DataSource) (tsdb.TsdbQueryEndpoint, error) {
	endpoint := &MsSqlQueryEndpoint{
		log: log.New("tsdb.mssql"),
	}

	endpoint.sqlEngine = &tsdb.DefaultSqlEngine{
		MacroEngine: NewMsSqlMacroEngine(),
	}

	url := datasource.Url

	var hostExp = namesRegexp{regexp.MustCompile(`(?P<host>\S[^:,]+)[:,]?(?P<port>\d+)?`)}
	var namesSubmatchMap = hostExp.FindStringSubmatchMap(url)

	if namesSubmatchMap["host"] != "" {
		url = namesSubmatchMap["host"]
	}

	port, error := strconv.Atoi(namesSubmatchMap["port"])
	if error != nil {
		port = 1433
	}

	cnnstr := fmt.Sprintf("server=%s;port=%d;database=%s;user id=%s;password=%s;connection timeout=1200; dial timeout=1200",
		url,
		port,
		datasource.Database,
		datasource.User,
		datasource.Password,
	)

	//cnnstr = "sqlserver://sqladmin:123456a@dev-sh-ptdb.chinacloudapp.cn?database=TeldETL&connection+timeout=30"
	//cnnstr = "sqlserver://sqladmin:123456a@dev-sh-ptdb.chinacloudapp.cn?database=TeldETL&connection+timeout=30"

	//cnnstr = "odbc:driver={SQL Server};Server=dev-sh-ptdb.chinacloudapp.cn;Database=TeldETL;uid=sqladmin;pwd=123456a?;"
	//cnnstr = "odbc:server=dev-sh-ptdb.chinacloudapp.cn;user id=sqladmin;password=123456a?;database=TeldETL;connection timeout=30"
	endpoint.log.Debug("getEngine", "connection", cnnstr)
	fmt.Println(cnnstr)

	if err := endpoint.sqlEngine.InitEngine("mssql", datasource, cnnstr); err != nil {
		return nil, err
	}

	return endpoint, nil
}

// Query is the main function for the MsSqlExecutor
func (e *MsSqlQueryEndpoint) Query(ctx context.Context, dsInfo *models.DataSource, tsdbQuery *tsdb.TsdbQuery) (*tsdb.Response, error) {
	return e.sqlEngine.Query(ctx, dsInfo, tsdbQuery, e.transformToTimeSeries, e.transformToTable)
}

func (e MsSqlQueryEndpoint) transformToTable(query *tsdb.Query, rows *core.Rows, result *tsdb.QueryResult) error {
	columnNames, err := rows.Columns()
	columnCount := len(columnNames)

	if err != nil {
		return err
	}

	table := &tsdb.Table{
		Columns: make([]tsdb.TableColumn, columnCount),
		Rows:    make([]tsdb.RowValues, 0),
	}

	for i, name := range columnNames {
		table.Columns[i].Text = name
	}

	columnTypes, err := rows.ColumnTypes()
	if err != nil {
		return err
	}

	rowLimit := 1000000
	rowCount := 0

	for ; rows.Next(); rowCount++ {
		if rowCount > rowLimit {
			return fmt.Errorf("MsSql query row limit exceeded, limit %d", rowLimit)
		}

		values, err := e.getTypedRowData(columnTypes, rows)
		if err != nil {
			return err
		}

		table.Rows = append(table.Rows, values)
	}

	result.Tables = append(result.Tables, table)
	result.Meta.Set("rowCount", rowCount)
	return nil
}

func (e MsSqlQueryEndpoint) getTypedRowData(types []*sql.ColumnType, rows *core.Rows) (tsdb.RowValues, error) {
	values := make([]interface{}, len(types))
	for i := range types {
		//ref: http://go-database-sql.org/varcols.html
		//values[i] = new(sql.RawBytes)
		values[i] = new(string)
	}
	// for i, stype := range types {
	// 	e.log.Debug("type", "type", stype)
	// 	values[i] = new(string)
	// 	// switch stype.DatabaseTypeName() {
	// 	// case mssql.FieldTypeNameTiny:
	// 	// 	values[i] = new(int8)
	// 	// case mssql.FieldTypeNameInt24:
	// 	// 	values[i] = new(int32)
	// 	// case mssql.FieldTypeNameShort:
	// 	// 	values[i] = new(int16)
	// 	// case mssql.FieldTypeNameVarString:
	// 	// 	values[i] = new(string)
	// 	// case mssql.FieldTypeNameVarChar:
	// 	// 	values[i] = new(string)
	// 	// case mssql.FieldTypeNameLong:
	// 	// 	values[i] = new(int)
	// 	// case mssql.FieldTypeNameLongLong:
	// 	// 	values[i] = new(int64)
	// 	// case mssql.FieldTypeNameDouble:
	// 	// 	values[i] = new(float64)
	// 	// case mssql.FieldTypeNameDecimal:
	// 	// 	values[i] = new(float32)
	// 	// case mssql.FieldTypeNameNewDecimal:
	// 	// 	values[i] = new(float64)
	// 	// case mssql.FieldTypeNameFloat:
	// 	// 	values[i] = new(float64)
	// 	// case mssql.FieldTypeNameTimestamp:
	// 	// 	values[i] = new(time.Time)
	// 	// case mssql.FieldTypeNameDateTime:
	// 	// 	values[i] = new(time.Time)
	// 	// case mssql.FieldTypeNameTime:
	// 	// 	values[i] = new(string)
	// 	// case mssql.FieldTypeNameYear:
	// 	// 	values[i] = new(int16)
	// 	// case mssql.FieldTypeNameNULL:
	// 	// 	values[i] = nil
	// 	// case mssql.FieldTypeNameBit:
	// 	// 	values[i] = new([]byte)
	// 	// case mssql.FieldTypeNameBLOB:
	// 	// 	values[i] = new(string)
	// 	// case mssql.FieldTypeNameTinyBLOB:
	// 	// 	values[i] = new(string)
	// 	// case mssql.FieldTypeNameMediumBLOB:
	// 	// 	values[i] = new(string)
	// 	// case mssql.FieldTypeNameLongBLOB:
	// 	// 	values[i] = new(string)
	// 	// case mssql.FieldTypeNameString:
	// 	// 	values[i] = new(string)
	// 	// case mssql.FieldTypeNameDate:
	// 	// 	values[i] = new(string)
	// 	// default:
	// 	// 	return nil, fmt.Errorf("Database type %s not supported", stype.DatabaseTypeName())
	// 	// }
	// }

	if err := rows.Scan(values...); err != nil {
		return nil, err
	}

	return values, nil
}

func (e MsSqlQueryEndpoint) transformToTimeSeries(query *tsdb.Query, rows *core.Rows, result *tsdb.QueryResult) error {
	pointsBySeries := make(map[string]*tsdb.TimeSeries)
	seriesByQueryOrder := list.New()
	columnNames, err := rows.Columns()

	if err != nil {
		return err
	}

	rowData := NewStringStringScan(columnNames)
	rowLimit := 1000000
	rowCount := 0

	for ; rows.Next(); rowCount++ {
		if rowCount > rowLimit {
			return fmt.Errorf("MsSql query row limit exceeded, limit %d", rowLimit)
		}

		err := rowData.Update(rows.Rows)
		if err != nil {
			e.log.Error("MsSql response parsing", "error", err)
			return fmt.Errorf("MsSql response parsing error %v", err)
		}

		if rowData.metric == "" {
			rowData.metric = "Unknown"
		}

		if !rowData.time.Valid {
			return fmt.Errorf("Found row with no time value")
		}

		if series, exist := pointsBySeries[rowData.metric]; exist {
			series.Points = append(series.Points, tsdb.TimePoint{rowData.value, rowData.time})
		} else {
			series := &tsdb.TimeSeries{Name: rowData.metric}
			series.Points = append(series.Points, tsdb.TimePoint{rowData.value, rowData.time})
			pointsBySeries[rowData.metric] = series
			seriesByQueryOrder.PushBack(rowData.metric)
		}
	}

	for elem := seriesByQueryOrder.Front(); elem != nil; elem = elem.Next() {
		key := elem.Value.(string)
		result.Series = append(result.Series, pointsBySeries[key])
	}

	result.Meta.Set("rowCount", rowCount)
	return nil
}

type stringStringScan struct {
	rowPtrs     []interface{}
	rowValues   []string
	columnNames []string
	columnCount int

	time   null.Float
	value  null.Float
	metric string
}

func NewStringStringScan(columnNames []string) *stringStringScan {
	s := &stringStringScan{
		columnCount: len(columnNames),
		columnNames: columnNames,
		rowPtrs:     make([]interface{}, len(columnNames)),
		rowValues:   make([]string, len(columnNames)),
	}

	for i := 0; i < s.columnCount; i++ {
		s.rowPtrs[i] = new(sql.RawBytes)
	}

	return s
}

func (s *stringStringScan) Update(rows *sql.Rows) error {
	if err := rows.Scan(s.rowPtrs...); err != nil {
		return err
	}

	s.time = null.FloatFromPtr(nil)
	s.value = null.FloatFromPtr(nil)

	for i := 0; i < s.columnCount; i++ {
		if rb, ok := s.rowPtrs[i].(*sql.RawBytes); ok {
			s.rowValues[i] = string(*rb)

			switch s.columnNames[i] {
			case "time_sec":
				if sec, err := strconv.ParseInt(s.rowValues[i], 10, 64); err == nil {
					s.time = null.FloatFrom(float64(sec * 1000))
				}
			case "value":
				if value, err := strconv.ParseFloat(s.rowValues[i], 64); err == nil {
					s.value = null.FloatFrom(value)
				}
			case "metric":
				s.metric = s.rowValues[i]
			}

			*rb = nil // reset pointer to discard current value to avoid a bug
		} else {
			return fmt.Errorf("Cannot convert index %d column %s to type *sql.RawBytes", i, s.columnNames[i])
		}
	}
	return nil
}
