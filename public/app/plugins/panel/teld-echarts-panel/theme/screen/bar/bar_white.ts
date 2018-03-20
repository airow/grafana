///<reference path="../../../../../../headers/echarts.d.ts" />
///<reference path="../../../../../../headers/echarts.graphic.d.ts" />
import echarts from 'echarts';

var option = {
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
  "bar": {
    "barWidth": 6,
    "itemStyle": {
      "normal": {
        "color": "#7EB26D",
        "opacity": 0.7,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 10
      }
    }
  },
  "categoryAxis": {
    boundaryGap: true,
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
      },
      "alignWithLabel": true
    },
    "axisLabel": {
      "show": true,
      "margin": 10,
      "rotate": 40,
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
        "width": 2
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
      "margin": 10,
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
        "width": 2
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
        "color": "#555"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#555"
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
          "#f4f4f4"
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
        "color": "#555"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#555"
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
          "#f4f4f4"
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
  "tooltip": {
    "trigger": 'axis',
    "axisPointer": {
      "type": 'shadow',
      lineStyle: {
        color: "#BA3232",
        width: 1,
      }
    },
    textStyle: {
      color: "#555"
    },
    backgroundColor: '#ECECEC'
  },
  "visualMap": {
    "color": [
      "#bf444c",
      "#d88273",
      "#f6efa6"
    ]
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

export default option;
