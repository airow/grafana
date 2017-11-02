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
    "barWidth": 8,
    "itemStyle": {
      "normal": {
        "color": "#7EB26D"
      }
    }
  },
  "categoryAxis": {
    boundaryGap: false,
    "axisLine": {
      "show": true,
      "lineStyle": {
        "color": "#444343"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#444343"
      }
    },
    "axisLabel": {
      "show": true,
      "margin": 10,
      "rotate": 40,
      "textStyle": {
        "color": "#333",
        "fontFamily": "Microsoft YaHei Light",
        "fontSize": 16,
        // "align":"left"
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#444343"
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
      "show": true,
      "lineStyle": {
        "color": "#444343"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#444343"
      }
    },
    "axisLabel": {
      "show": true,
      "margin": 10,
      "textStyle": {
        "color": "#333",
        "fontFamily": "Microsoft YaHei Light",
        "fontSize": 16
      }
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": [
          "#444343"
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
        "color": "#444343"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#444343"
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
          "#444343"
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
        "color": "#444343"
      }
    },
    "axisTick": {
      "show": true,
      "lineStyle": {
        "color": "#444343"
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
          "#444343"
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
      "type": 'cross',
      "label": {
        "backgroundColor": '#6a7985'
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
    "bottom": "50",
    "containLabel": true
  }
};

export default option;
