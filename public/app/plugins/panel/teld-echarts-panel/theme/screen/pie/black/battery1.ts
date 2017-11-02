///<reference path="../../../../../../../headers/echarts.d.ts" />
///<reference path="../../../../../../../headers/echarts.graphic.d.ts" />
import echarts from 'echarts';

var option = {
  "color": [
    '#F23D35', '#6CB489', '#293790', '#089B46', '#26A7E4', '#A577B1', '#952793', '#E3BE22', '#6FA5D6',
    //原始
    '#55a5a4', '#8d4968', '#acd9d2', '#af75ac', '#133e7f', '#7a9299', '#11a0be',
    '#474ea7', '#7a9e61', '#6897bd', '#156c87', '#a58b66', '#c9bd7c', '#3ca58e',
    '#1a7fd4', '#3a5966'],
  "backgroundColor": "#1F1D1D",
  "textStyle": {},
  "title": {
    "text": "终端数行业投建比",
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
  "pie": {
    "radius": '67',
    "center": ['50%', '50%'],
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
      "color": "#fff"
    }
  },
  "tooltip": {
    "trigger": 'item',
    "formatter": "{b} : {c} ({d}%)"
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

export default option;
