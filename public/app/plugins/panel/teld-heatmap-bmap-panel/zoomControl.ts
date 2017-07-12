///<reference path="../../../headers/common.d.ts" />
///<reference path="../../../headers/echarts.d.ts" />
///<reference path="../../../headers/baidumap-web-sdk/index.d.ts" />

import _ from 'lodash';
import angular from 'angular';
import moment from 'moment';


class ZoomControl extends BMap.Control {

  defaultAnchor: number;
  defaultOffset: BMap.Size;

  constructor(private variableSrv, private dashboardSrv) {
    super();
    this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;
    this.defaultOffset = new BMap.Size(10, 10);
  }


  // 自定义控件必须实现 initialize 方法，并且将控件的 DOM 元素返回
  // 在本方法中创建个 div 元素作为控件的容器，并将其添加到地图容器中

  initialize(map) {
    // 创建一个 DOM 元素
    var div = document.createElement("div");
    // 添加文字说明
    div.appendChild(document.createTextNode("放大2级"));
    // 设置样式
    div.style.cursor = "pointer";
    div.style.border = "1px solid gray";
    div.style.backgroundColor = "white";
    // 绑定事件，点击一次放大两级
    div.onclick = this.click.bind(this);
    // 添加 DOM 元素到地图中
    map.getContainer().appendChild(div);
    // 将 DOM 元素返回
    return div;
  }

  click(e) {
    let variableType = 'custom';
    let teldCustomModel = { type: variableType, name: 'fff' };
    let indexOf = _.findIndex(this.variableSrv.variables, teldCustomModel);
    let variable;
    let current = { text: e.srcElement.innerText, value: e.srcElement.innerText };

    if (indexOf === -1) {
      variable = this.variableSrv.addVariable({ type: variableType, canSaved: false });
      variable.hide = 2;
      variable.name = variable.label = teldCustomModel.name;
    } else {
      variable = this.variableSrv.variables[indexOf];
    }
    variable.current === current;

    this.variableSrv.setOptionAsCurrent(variable, current);
    this.variableSrv.templateSrv.updateTemplateData();
    this.dashboardSrv.getCurrent().updateSubmenuVisibility();
  }
}

export default ZoomControl;
