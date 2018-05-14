package mssql

import (
	"fmt"
	"regexp"

	"github.com/grafana/grafana/pkg/tsdb"
)

//const rsString = `(?:"([^"]*)")`;
const rsIdentifier = `([_a-zA-Z0-9]+)`
const sExpr = `\$` + rsIdentifier + `\(([^\)]*)\)`

type MsSqlMacroEngine struct {
	TimeRange *tsdb.TimeRange
}

func NewMsSqlMacroEngine() tsdb.SqlMacroEngine {
	return &MsSqlMacroEngine{}
}

func (m *MsSqlMacroEngine) Interpolate(timeRange *tsdb.TimeRange, sql string) (string, error) {
	m.TimeRange = timeRange
	rExp, _ := regexp.Compile(sExpr)
	var macroError error

	sql = replaceAllStringSubmatchFunc(rExp, sql, func(groups []string) string {
		res, err := m.evaluateMacro(groups[1], groups[2:])
		if err != nil && macroError == nil {
			macroError = err
			return "macro_error()"
		}
		return res
	})

	if macroError != nil {
		return "", macroError
	}

	return sql, nil
}

func replaceAllStringSubmatchFunc(re *regexp.Regexp, str string, repl func([]string) string) string {
	result := ""
	lastIndex := 0

	for _, v := range re.FindAllSubmatchIndex([]byte(str), -1) {
		groups := []string{}
		for i := 0; i < len(v); i += 2 {
			groups = append(groups, str[v[i]:v[i+1]])
		}

		result += str[lastIndex:v[0]] + repl(groups)
		lastIndex = v[1]
	}

	return result + str[lastIndex:]
}

func (m *MsSqlMacroEngine) evaluateMacro(name string, args []string) (string, error) {
	switch name {
  case "__unix":
		if len(args) == 0 {
			return "", fmt.Errorf("missing time column argument for macro %v", name)
		}
		return fmt.Sprintf("DATEDIFF(SS, '1970-01-01', CAST(%s AS DATETIME))", args[0]), nil
	case "__time":
		if len(args) == 0 {
			return "", fmt.Errorf("missing time column argument for macro %v", name)
		}
		return fmt.Sprintf("DATEDIFF(SS, '1970-01-01 00:00:00', CAST(%s AS DATETIME)) as time_sec", args[0]), nil
	case "__timeutc8":
		if len(args) == 0 {
			return "", fmt.Errorf("missing time column argument for macro %v", name)
		}
		return fmt.Sprintf("DATEDIFF(SS, '1970-01-01 08:00:00', CAST(%s AS DATETIME)) as time_sec", args[0]), nil
	case "__timeFilter":
		if len(args) == 0 {
			return "", fmt.Errorf("missing time column argument for macro %v", name)
		}
		return fmt.Sprintf("%s >= DATEADD(HOUR, 8, DATEADD(SECOND, %d, '1970-01-01')) AND %s <= DATEADD(HOUR, 8, DATEADD(SECOND, %d, '1970-01-01'))", args[0], uint64(m.TimeRange.GetFromAsMsEpoch()/1000), args[0], uint64(m.TimeRange.GetToAsMsEpoch()/1000)), nil
	case "__timeFrom":
		return fmt.Sprintf("DATEADD(HOUR, 8, DATEADD(SECOND, %d, '1970-01-01'))", uint64(m.TimeRange.GetFromAsMsEpoch()/1000)), nil
	case "__timeTo":
		return fmt.Sprintf("DATEADD(HOUR, 8, DATEADD(SECOND, %d, '1970-01-01'))", uint64(m.TimeRange.GetToAsMsEpoch()/1000)), nil
	case "__unixEpochFilter":
		if len(args) == 0 {
			return "", fmt.Errorf("missing time column argument for macro %v", name)
		}
		return fmt.Sprintf("%s >= %d AND %s <= %d", args[0], uint64(m.TimeRange.GetFromAsMsEpoch()/1000), args[0], uint64(m.TimeRange.GetToAsMsEpoch()/1000)), nil
	case "__unixEpochFrom":
		return fmt.Sprintf("%d", uint64(m.TimeRange.GetFromAsMsEpoch()/1000)), nil
	case "__unixEpochTo":
		return fmt.Sprintf("%d", uint64(m.TimeRange.GetToAsMsEpoch()/1000)), nil
	default:
		return "", fmt.Errorf("Unknown macro %v", name)
	}
}
