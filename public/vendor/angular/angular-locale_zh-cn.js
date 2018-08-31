'use strict';

System.register([], function (_export, _context) {
  "use strict";

  return {
    setters: [],
    execute: function () {
      angular.module("ngLocale", [], ["$provide", function ($provide) {
        var PLURAL_CATEGORY = { ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other" };
        $provide.value("$locale", {
          "DATETIME_FORMATS": {
            "AMPMS": ["\u4E0A\u5348", "\u4E0B\u5348"],
            "DAY": ["\u661F\u671F\u65E5", "\u661F\u671F\u4E00", "\u661F\u671F\u4E8C", "\u661F\u671F\u4E09", "\u661F\u671F\u56DB", "\u661F\u671F\u4E94", "\u661F\u671F\u516D"],
            "ERANAMES": ["\u516C\u5143\u524D", "\u516C\u5143"],
            "ERAS": ["\u516C\u5143\u524D", "\u516C\u5143"],
            "FIRSTDAYOFWEEK": 6,
            "MONTH": ["\u4E00\u6708", "\u4E8C\u6708", "\u4E09\u6708", "\u56DB\u6708", "\u4E94\u6708", "\u516D\u6708", "\u4E03\u6708", "\u516B\u6708", "\u4E5D\u6708", "\u5341\u6708", "\u5341\u4E00\u6708", "\u5341\u4E8C\u6708"],
            "SHORTDAY": ["\u5468\u65E5", "\u5468\u4E00", "\u5468\u4E8C", "\u5468\u4E09", "\u5468\u56DB", "\u5468\u4E94", "\u5468\u516D"],
            "SHORTMONTH": ["1\u6708", "2\u6708", "3\u6708", "4\u6708", "5\u6708", "6\u6708", "7\u6708", "8\u6708", "9\u6708", "10\u6708", "11\u6708", "12\u6708"],
            "STANDALONEMONTH": ["\u4E00\u6708", "\u4E8C\u6708", "\u4E09\u6708", "\u56DB\u6708", "\u4E94\u6708", "\u516D\u6708", "\u4E03\u6708", "\u516B\u6708", "\u4E5D\u6708", "\u5341\u6708", "\u5341\u4E00\u6708", "\u5341\u4E8C\u6708"],
            "WEEKENDRANGE": [5, 6],
            "fullDate": "y\u5E74M\u6708d\u65E5EEEE",
            "longDate": "y\u5E74M\u6708d\u65E5",
            "medium": "y\u5E74M\u6708d\u65E5 ah:mm:ss",
            "mediumDate": "y\u5E74M\u6708d\u65E5",
            "mediumTime": "ah:mm:ss",
            "short": "y/M/d ah:mm",
            "shortDate": "y/M/d",
            "shortTime": "ah:mm"
          },
          "NUMBER_FORMATS": {
            "CURRENCY_SYM": "\xA5",
            "DECIMAL_SEP": ".",
            "GROUP_SEP": ",",
            "PATTERNS": [{
              "gSize": 3,
              "lgSize": 3,
              "maxFrac": 3,
              "minFrac": 0,
              "minInt": 1,
              "negPre": "-",
              "negSuf": "",
              "posPre": "",
              "posSuf": ""
            }, {
              "gSize": 3,
              "lgSize": 3,
              "maxFrac": 2,
              "minFrac": 2,
              "minInt": 1,
              "negPre": "-\xA4",
              "negSuf": "",
              "posPre": "\xA4",
              "posSuf": ""
            }]
          },
          "id": "zh-cn",
          "localeID": "zh_CN",
          "pluralCat": function pluralCat(n, opt_precision) {
            return PLURAL_CATEGORY.OTHER;
          }
        });
      }]);
    }
  };
});
//# sourceMappingURL=angular-locale_zh-cn.js.map
