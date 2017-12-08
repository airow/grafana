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
  "backgroundColor": "#FBFBFB",
  "textStyle": {},
  "title": {
    "show": false,
    "textStyle": {
      "color": "#333",
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
  "categoryAxis": {
    boundaryGap: false,
    "axisLine": {
      "show": false,
      "lineStyle": {
        "color": "#555"
      }
    },
    "axisTick": {
      "show": false,
      "lineStyle": {
        "color": "#555"
      }
    },
    "axisLabel": {
      "show": true,
      "margin": 10,
      "textStyle": {
        "color": "#555",
        "fontFamily": "Microsoft YaHei Regular",
        "fontSize": 12,
        // "align":"left"
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#f4f4f4"
        ],
        "width": 2,
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
      "show": false,
      "lineStyle": {
        "color": "#555"
      }
    },
    "axisTick": {
      "show": false,
      "lineStyle": {
        "color": "#555"
      }
    },
    "axisLabel": {
      "show": true,
      "margin": 20,
      "textStyle": {
        "color": "#555",
        "fontFamily": "Microsoft YaHei Regular",
        "fontSize": 12
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#f4f4f4"
        ],
        "width": 2,
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
    trigger: 'item',
    "textStyle": {
      "color": "#555"
    },
    axisPointer: {
      type: 'line',
      lineStyle: {
        color: "#BA3232",
        width: 1,
      }
    },
    backgroundColor: '#ECECEC'
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
    "bottom": "18",
    "containLabel": true
  }
};

export default chargTrend_24h;
