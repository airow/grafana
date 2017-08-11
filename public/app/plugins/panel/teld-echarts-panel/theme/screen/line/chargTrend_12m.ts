///<reference path="../../../../../../headers/echarts.d.ts" />
///<reference path="../../../../../../headers/echarts.graphic.d.ts" />
import echarts from 'echarts';

var chargTrend_12m = {
  "color": [
    "#d87c7c",
    "#919e8b",
    "#d7ab82",
    "#6e7074",
    "#61a0a8",
    "#efa18d",
    "#787464",
    "#cc7e63",
    "#724e58",
    "#4b565b"
  ],
  "backgroundColor": new echarts.graphic.LinearGradient(1,3, 0,0, [{
    offset: 0, color:'#374889',// '#204063'//'#190d02' // 0% 处的颜色
  },{
    offset: 0.8, color: "#132A4B",//'#190d02'//'#204063' // 100% 处的颜色
  }, {
    offset: 1, color: "#032433",//'#190d02'//'#204063' // 100% 处的颜色
  }], false),
  "textStyle": {},
  "title": {
    "textStyle": {
      "color": "#639fb9",
      "fontFamily": "Microsoft YaHei Regular",
      "fontSize": 32
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
          "color": "#5fb0b0",
          "fontFamily": "Microsoft YaHei Light",
          "fontSize": 12
        },
        "position": "top"
      }
    },
    "itemStyle": {
      "normal": {
        "color": "rgba(255,144,128,1)",
        "borderColor": "#6cfffe",
        "borderWidth": "3"
      }
    },
    "lineStyle": {
      "normal": {
        "width": "2",
        "color": ["#6cfffe"],
        // "color":["#7867f5","#2082c2","#80d9fa","#2082c2","#2f9fcb"],
        // "shadowColor":"#66fdfc",
        // "shadowOffsetY":5
      }
    },
    "symbolSize": "8",
    "symbol": "emptyCircle",
    "smooth": false,
    "areaStyle": {
      "normal": {
        // "color":["#8b7cfd","#2082c2","#55cefc","#2aa3bb","#4d8ab7","#5eb4ed"],RadialGradient
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
          offset: 0,
          color: '#276a6b'
        }, {
          offset: 0.8,
          color: '#1b255e'
        }], false),
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 10,
        "opacity": 0.9
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
      "rotate": 40,
      "textStyle": {
        "color": "#89b6dc",
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
      "margin": 10,
      "textStyle": {
        "color": "#89b6dc",
        "fontFamily": "Microsoft YaHei Light",
        "fontSize": 16
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
  "tooltip": {
    "trigger": 'axis',
    "axisPointer": {
      "type": 'cross',
      "label": {
        "backgroundColor": '#6a7985'
      }
    }
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
    "bottom": "50",
    "containLabel": true
  }

};

export default chargTrend_12m;
