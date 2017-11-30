///<reference path="../../../../../../headers/echarts.d.ts" />
///<reference path="../../../../../../headers/echarts.graphic.d.ts" />
import echarts from 'echarts';

export default {
  "color": [
    "#7EB26D",
    "#EAB839",
    "#6ED0E0",
    "#EF843C",
    "#E24D42",
    "#1F78C1",
    "#BA43A9",
    "#705DA0",
    "#508642",
    "#CCA300"
  ],
  "backgroundColor": "#1F1D1D",
  "textStyle": {},
  "title": {
    "show": false,
    "textStyle": {
      "color": "#fff",
      "fontFamily": "Microsoft YaHei Regular",
      "fontSize": 18
    },
    "left": 'center',
    "top": "18",
    "subtextStyle": {
      "color": "#aaaaaa"
    }
  },
  "line": {
    "label": {
      "normal": {
        "show": true,
        "textStyle": {
          "color": "#fff",
          "fontFamily": "Microsoft YaHei Light",
          "fontSize": 12
        },
        "position": "top"
      }
    },
    "lineStyle": {
      "normal": {
        "width": "2"
        // "color":["#7867f5","#2082c2","#80d9fa","#2082c2","#2f9fcb"],
        // "shadowColor":"#66fdfc",
        // "shadowOffsetY":5
      }
    },
    "symbolSize": "4",
    "symbol": "circle",
    "smooth": false,
    "areaStyle": {
      "normal": {
        // "color":["#8b7cfd","#2082c2","#55cefc","#2aa3bb","#4d8ab7","#5eb4ed"],RadialGradient
        "opacity": 0.4
      }
    }
  },
  "categoryAxis": {
    boundaryGap: false,
    "axisLine": {
      "show": true,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisLabel": {
      "show": true,
      "margin": 10,
      "rotate": 40,
      "textStyle": {
        "color": "#fff",
        "fontFamily": "Microsoft YaHei Light",
        "fontSize": 12,
        // "align":"left"
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#434343"
        ],
        "width": 1,
        "opacity": 1
      }
    },
    "splitArea": {
      "show": false,
      "areaStyle": {
        "color": [
          "rgba(250,250,250,0.3)",
          "rgba(200,200,200,0.3)"
        ]
      }
    }
  },
  "valueAxis": {
    "axisLine": {
      "show": true,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisLabel": {
      "show": true,
      "margin": 10,
      "textStyle": {
        "color": "#fff",
        "fontFamily": "Microsoft YaHei Light",
        "fontSize": 12
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#434343"
        ],
        "width": 1,
        "opacity": 1
      }
    },
    "splitArea": {
      "show": false,
      "areaStyle": {
        "color": [
          "rgba(250,250,250,0.3)",
          "rgba(200,200,200,0.3)"
        ]
      }
    }
  },
  "logAxis": {
    "axisLine": {
      "show": true,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisLabel": {
      "show": true,
      "textStyle": {
        "color": "#333"
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#ccc"
        ]
      }
    },
    "splitArea": {
      "show": false,
      "areaStyle": {
        "color": [
          "rgba(250,250,250,0.3)",
          "rgba(200,200,200,0.3)"
        ]
      }
    }
  },
  "timeAxis": {
    "axisLine": {
      "show": true,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisLabel": {
      "show": true,
      "textStyle": {
        "color": "#333"
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#ccc"
        ]
      }
    },
    "splitArea": {
      "show": false,
      "areaStyle": {
        "color": [
          "rgba(250,250,250,0.3)",
          "rgba(200,200,200,0.3)"
        ]
      }
    }
  },
  "toolbox": {
    "iconStyle": {
      "normal": {
        "borderColor": "#999999"
      },
      "emphasis": {
        "borderColor": "#666666"
      }
    }
  },
  "legend": {
    "textStyle": {
      "color": "#333333"
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'line',
      lineStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
          offset: 0, color: 'rgba(4,238,241,0.8)'// 0% 处的颜色
        }, {
          offset: 1, color: 'rgba(25,92,160,0.2)' // 100% 处的颜色
        }], false),
        width: 3,
      }
    },
    formatter: ["<div style='left:-50px;top:-80px;border:0px solid #000;",
      "position:relative;width:74px;height:24px;line-height:24px;",
      "background:#086c89;;border-radius:4px;text-align:center;'>",
      "	<div style='position:absolute;color:#086c89;width: 0px;height:0px;height:0px;",
      "	line-height: 0px;border-width: 10px 15px 0;",
      "	border-style: solid dashed dashed dashed;border-left-color: transparent;",
      "	border-right-color: transparent;bottom: -10px;right: 50%;margin-right:-15px'>",
      "	</div>",
      "	{c}",
      "</div>"].join(""),
    backgroundColor: 'transparent'
  },
  "timeline": {
    "lineStyle": {
      "color": "#293c55",
      "width": 1
    },
    "itemStyle": {
      "normal": {
        "color": "#293c55",
        "borderWidth": 1
      },
      "emphasis": {
        "color": "#a9334c"
      }
    },
    "controlStyle": {
      "normal": {
        "color": "#293c55",
        "borderColor": "#293c55",
        "borderWidth": 0.5
      },
      "emphasis": {
        "color": "#293c55",
        "borderColor": "#293c55",
        "borderWidth": 0.5
      }
    },
    "checkpointStyle": {
      "color": "#e43c59",
      "borderColor": "rgba(194,53,49,0.5)"
    },
    "label": {
      "normal": {
        "textStyle": {
          "color": "#293c55"
        }
      },
      "emphasis": {
        "textStyle": {
          "color": "#293c55"
        }
      }
    }
  },
  "visualMap": {
    "color": [
      "#bf444c",
      "#d88273",
      "#f6efa6"
    ]
  },
  "dataZoom": {
    "backgroundColor": "rgba(47,69,84,0)",
    "dataBackgroundColor": "rgba(47,69,84,0.3)",
    "fillerColor": "rgba(167,183,204,0.4)",
    "handleColor": "#a7b7cc",
    "handleSize": "100%",
    "textStyle": {
      "color": "#333333"
    }
  },
  "markPoint": {
    "label": {
      "normal": {
        "textStyle": {
          "color": "#eeeeee"
        }
      },
      "emphasis": {
        "textStyle": {
          "color": "#eeeeee"
        }
      }
    }
  },
  "grid": {
    "top": "25",
    "left": "14",
    "right": "14",
    "bottom": "50",
    "containLabel": true
  }

};
