///<reference path="../../../../../../headers/echarts.d.ts" />
///<reference path="../../../../../../headers/echarts.graphic.d.ts" />

import echarts from 'echarts';

var chargTrend_24h = {
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
    "itemStyle": {
      "normal": {
        "borderWidth": "1"
      }
    },
    "lineStyle": {
      "normal": {
        "width": "2"
        // "color":["#2f9fcb"]
      }
    },
    "symbolSize": "0",
    "symbol": "circle",
    "smooth": true,
    "smoothMonotone": "x",
    "areaStyle": {
      "normal": {
        // "color":["#8b7cfd","#2082c2","#55cefc","#2aa3bb","#4d8ab7","#5eb4ed"],RadialGradient
        "opacity": 0.4
      }
    }
  },
  "radar": {
    "itemStyle": {
      "normal": {
        "borderWidth": "1"
      }
    },
    "lineStyle": {
      "normal": {
        "width": "11"
      }
    },
    "symbolSize": "0",
    "symbol": "circle",
    "smooth": false
  },
  "bar": {
    "barWidth": 8,
    "itemStyle": {
      "normal": {
      },
      "emphasis": {
      }
    }
  },
  "pie": {
    "itemStyle": {
      "normal": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      },
      "emphasis": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      }
    },
    "labelLine": {
      "normal": {
        "show": false,
        "length": 3
      }

    },
    "label": {
      "normal": {
        "formatter": "{b}\n{d}%",
        "textStyle": {
          "color": "#fff",
          "fontFamily": "Microsoft YaHei Light",
          "fontSize": 12
        }
      },
      "emphasis": {
        "shadowBlur": 10,
        "shadowOffsetX": 0,
        "shadowColor": 'rgba(0, 0, 0, 0.5)'
      }
    }
  },
  "scatter": {
    "itemStyle": {
      "normal": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      },
      "emphasis": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      }
    }
  },
  "boxplot": {
    "itemStyle": {
      "normal": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      },
      "emphasis": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      }
    }
  },
  "parallel": {
    "itemStyle": {
      "normal": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      },
      "emphasis": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      }
    }
  },
  "sankey": {
    "itemStyle": {
      "normal": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      },
      "emphasis": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      }
    }
  },
  "funnel": {
    "itemStyle": {
      "normal": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      },
      "emphasis": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      }
    }
  },
  "gauge": {
    "itemStyle": {
      "normal": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      },
      "emphasis": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      }
    }
  },
  "candlestick": {
    "itemStyle": {
      "normal": {
        "color": "#c23531",
        "color0": "#314656",
        "borderColor": "#c23531",
        "borderColor0": "#314656",
        "borderWidth": 1
      }
    }
  },
  "graph": {
    "itemStyle": {
      "normal": {
        "borderWidth": 0,
        "borderColor": "#ccc"
      }
    },
    "lineStyle": {
      "normal": {
        "width": 1,
        "color": "#aaaaaa"
      }
    },
    "symbolSize": "0",
    "symbol": "circle",
    "smooth": false,
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
    "label": {
      "normal": {
        "textStyle": {
          "color": "#fff"
        }
      }
    }
  },
  "map": {
    "itemStyle": {
      "normal": {
        "areaColor": "#eeeeee",
        "borderColor": "#444444",
        "borderWidth": 0.5
      },
      "emphasis": {
        "areaColor": "rgba(255,215,0,0.8)",
        "borderColor": "#444444",
        "borderWidth": 1
      }
    },
    "label": {
      "normal": {
        "textStyle": {
          "color": "#fff"
        }
      },
      "emphasis": {
        "textStyle": {
          "color": "rgb(100,0,0)"
        }
      }
    }
  },
  "geo": {
    "itemStyle": {
      "normal": {
        "areaColor": "#eeeeee",
        "borderColor": "#444444",
        "borderWidth": 0.5
      },
      "emphasis": {
        "areaColor": "rgba(255,215,0,0.8)",
        "borderColor": "#444444",
        "borderWidth": 1
      }
    },
    "label": {
      "normal": {
        "textStyle": {
          "color": "#000000"
        }
      },
      "emphasis": {
        "textStyle": {
          "color": "rgb(100,0,0)"
        }
      }
    }
  },
  "categoryAxis": {
    boundaryGap: false,
    "axisLine": {
      "show": false,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisTick": {
      "show": false,
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
        "fontSize": 16,
        // "align":"left"
      }
    },
    "splitLine": {
      "show": false,
      "lineStyle": {
        "color": [
          "#335478"
        ],
        "width": 1,
        "opacity": 0.4
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
      "show": false,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisTick": {
      "show": false,
      "lineStyle": {
        "color": "#333"
      }
    },
    "axisLabel": {
      "show": true,
      "margin": 20,
      "textStyle": {
        "color": "#fff",
        "fontFamily": "Microsoft YaHei Light",
        "fontSize": 16
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#335478"
        ],
        "width": 1,
        "opacity": 0.4
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
        "color": "#fff"
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
        "color": "#fff"
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
    "top": "82",
    "left": "14",
    "right": "14",
    "bottom": "18",
    "containLabel": true
  }
};

export default chargTrend_24h;
