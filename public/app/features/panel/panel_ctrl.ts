
///<reference path="../../headers/common.d.ts" />
import config from 'app/core/config';
import _ from 'lodash';
import moment from 'moment';
import angular from 'angular';
import $ from 'jquery';
import { profiler } from 'app/core/profiler';
import Remarkable from 'remarkable';

const TITLE_HEIGHT = 25;
const EMPTY_TITLE_HEIGHT = 9;
const PANEL_PADDING = 5;
const PANEL_BORDER = 2;

import { Emitter, contextSrv } from 'app/core/core';

export class PanelCtrl {
  panel: any;
  error: any;
  row: any;
  dashboard: any;
  editorTabIndex: number;
  pluginName: string;
  pluginId: string;
  editorTabs: any;
  $scope: any;
  $injector: any;
  $timeout: any;
  fullscreen: boolean;
  inspector: any;
  editModeInitiated: boolean;
  editorHelpIndex: number;
  editMode: any;
  height: any;
  containerHeight: any;
  events: Emitter;
  timing: any;
  calcHide: boolean;
  fullscreenView: boolean;
  gfilterFetch: number;

  //panelState: boolean;

  constructor($scope, $injector) {
    this.$injector = $injector;
    this.$scope = $scope;
    this.$timeout = $injector.get('$timeout');
    this.editorTabIndex = 0;
    this.events = new Emitter();
    this.timing = {};
    this.calcHide = true;
    this.panel.drillConf = this.panel.drillConf || {};
    var plugin = config.panels[this.panel.type];
    if (plugin) {
      this.pluginId = plugin.id;
      this.pluginName = plugin.name;
    }

    $scope.$on("refresh", () => this.refresh());
    $scope.$on("render", () => this.render());
    $scope.$on("$destroy", () => {
      this.events.emit('panel-teardown');
      this.events.removeAllListeners();
    });

    // we should do something interesting
    // with newly added panels
    if (this.panel.isNew) {
      delete this.panel.isNew;
    }
    this.panel.dyHide = false;
    this.panel.editorHide = false;
  }

  init() {
    this.calculatePanelHeight();
    this.publishAppEvent('panel-initialized', { scope: this.$scope });
    this.events.emit('panel-initialized');
  }

  renderingCompleted() {
    profiler.renderingCompleted(this.panel.id, this.timing);
  }

  refresh() {
    var hide = this.visibility();
    if (hide && contextSrv.isEditor === false) { return; }
    this.events.emit('refresh', null);
  }

  publishAppEvent(evtName, evt) {
    this.$scope.$root.appEvent(evtName, evt);
  }

  changeView(fullscreen, edit) {
    this.fullscreenView = fullscreen && edit === false;
    this.publishAppEvent('panel-change-view', {
      fullscreen: fullscreen, edit: edit, panelId: this.panel.id
    });
  }

  gfilterFetchHandler: any;
  viewPanel() {
    this.gfilterFetch = 0;
    var eventInfo = {
      fullscreen: true, edit: false, panelId: this.panel.id, allowViewModeFilter: this.panel.allowViewModeFilter
    };
    this.publishAppEvent('teld-fullscreen-row', eventInfo);
    this.changeView(true, false);
    if (this.panel.allowViewModeFilter) {
      this.publishAppEvent('teld-fullscreen', eventInfo);
      this.gfilterFetchHandler = this.$scope.$root.onAppEvent("gfilter-fetch", (e) => {
        this.gfilterFetch++;
        console.log('gfilter-fetch gfilterFetch=', this.gfilterFetch);
      }, this.$scope);
    }
  }

  editPanel() {
    this.changeView(true, true);
  }

  backSnapshot() {
    this.publishAppEvent('teld-exitFullscreen', {
      fullscreen: false, edit: false, panelId: this.panel.id,
      targetPanel: this.panel,
      backSnapshot: true
    });
    this.changeView(false, false);
    this.cleargfilterFetch();
  }

  backClose() {
    this.changeView(false, false);
    this.cleargfilterFetch();
  }

  cleargfilterFetch() {
    this.gfilterFetch = 0;
    if (this.gfilterFetchHandler) {
      this.gfilterFetchHandler();
      this.gfilterFetchHandler = null;
    }
  }

  exitFullscreen() {
    if (this.gfilterFetch > 0 && this.fullscreenView && this.panel.allowViewModeFilter) {
      switch (_.get(this.panel, 'viewModeFilterBackHandler', 'close')) {
        case 'snapshot':
          this.backSnapshot();
          break;
        case 'close':
          this.backClose();
          break;
        case 'ask':
        default:
          var modalScope = this.$scope.$new();
          modalScope.backSnapshot = function () {
            this.ctrl.backSnapshot();
          };
          modalScope.backClose = function () {
            this.ctrl.backClose();
          };
          this.publishAppEvent('show-modal', {
            src: 'public/app/partials/exit-fullscreen.html',
            modalClass: 'confirm-modal',
            scope: modalScope
          });
          break;
      }
    } else {
      this.changeView(false, false);
      this.cleargfilterFetch();
    }
  }

  panelClick() {
    this.dashboard.events.emit(`${this.panel.type}-click`, {
      panel: this.panel, panelId: this.panel.id
    });
  }

  echartsEventPublish() {
    if (this.panel.echartsPanel.enable) {
      this.panelClick();
    }
  }

  initEditMode() {
    this.editorTabs = [];
    this.addEditorTab('General', 'public/app/partials/panelgeneral.html');
    this.editModeInitiated = true;
    this.events.emit('init-edit-mode', null);
    this.addEditorTab('Drilldown', 'public/app/partials/drilldownconf.html');

    var urlTab = (this.$injector.get('$routeParams').tab || '').toLowerCase();
    if (urlTab) {
      this.editorTabs.forEach((tab, i) => {
        if (tab.title.toLowerCase() === urlTab) {
          this.editorTabIndex = i;
        }
      });
    }
  }

  changeTab(newIndex) {
    this.editorTabIndex = newIndex;
    var route = this.$injector.get('$route');
    route.current.params.tab = this.editorTabs[newIndex].title.toLowerCase();
    route.updateParams();
  }

  addEditorTab(title, directiveFn, index?) {
    var editorTab = { title, directiveFn };

    if (_.isString(directiveFn)) {
      editorTab.directiveFn = function () {
        return { templateUrl: directiveFn };
      };
    }
    if (index) {
      this.editorTabs.splice(index, 0, editorTab);
    } else {
      this.editorTabs.push(editorTab);
    }
  }

  hasQuerybarAndFilterPanel() {
    var tfilter = _.filter(this.row.panels, panel => {
      var returnValue = false;
      switch (panel.type) {
        case 'teld-filter-builtin-panel':
        case 'teld-querybar-panel':
          returnValue = true;
          break;
      }
      return returnValue;
    });

    return _.size(tfilter) > 0;
  }

  showTeldPanelClose() {
    return this.row.fullScreenShow !== true
      && false === this.hasQuerybarAndFilterPanel()
      && !this['loading']
      && this.dashboard.meta.fullscreen;
  }

  getMenu() {
    let menu = [];
    if (false === this.hasQuerybarAndFilterPanel()) {
      menu.push({ text: 'View', click: 'ctrl.viewPanel(); dismiss();' });
    }
    menu.push({ text: 'Edit', click: 'ctrl.editPanel(); dismiss();', role: 'Editor' });
    if (!this.fullscreen) { //  duplication is not supported in fullscreen mode
      menu.push({ text: 'Duplicate', click: 'ctrl.duplicate()', role: 'Editor' });
    }
    menu.push({ text: 'Share', click: 'ctrl.sharePanel(); dismiss();', role: 'Editor' });
    if (this.panel.drillConf && _.size(this.panel.drillConf.links) > 0) {
      menu.push({ text: '联查', click: 'ctrl.drilldown(); dismiss();' });
    }
    return menu;
  }

  action_panelstate = { isMin: false, text: '最小化', click: 'ctrl.changePanelState()' };

  changePanelState($event) {
    switch (this.panel.changePanelStateStrategy) {
      default:
      case "v2":
        this.changePanelState_v2($event);
        break;

      case "v1":
        this.changePanelState_v1($event);
        break;
    }
    this.publishAppEvent('panel-teld-changePanelState', {
      panel: this.panel, panelId: this.panel.id
    });
  }

  changePanelState_v1($event) {
    this.action_panelstate.isMin = !this.action_panelstate.isMin;
    this.action_panelstate.text = (this.action_panelstate.isMin ? "还原" : "最小化");

    let orgSpan = this.panel.orgSpan;
    let thisSpan = orgSpan || this.panel.span;
    let panelArray = [];
    this.row.panels.forEach(panel => {
      if (panel.orgSpan) {
        panel.span = panel.orgSpan;
        delete panel["orgSpan"];
      } else {
        panel.orgSpan = panel.span;
        panel.orgHeight = panel.height;

        if (panel !== this.panel) {
          panelArray.push(panel);
          //panel.span = 12;
        }
      }
    });

    let panelRow = [];
    let p = [];
    let ss = 0;
    panelArray.forEach(panel => {
      let count = panel.span + ss + thisSpan;
      p.push(panel);
      if (count >= 12) {
        panelRow.push(p);
        p = [];
        ss = 0;
      } else {
        ss += panel.span;
      }
    });

    panelRow.forEach(row => {
      if (row.length === 1) {
        row[0].span = 12;
      } else {
        row[row.length - 1].span += thisSpan;
      }
    });


    if (orgSpan) {
      this.panel.span = orgSpan;
      if (this.panel.orgHeight) {
        this.panel.height = this.panel.orgHeight;
      } else {
        delete this.panel['height'];
      }
    } else {
      this.panel.span = 1;
      this.panel.height = 1;
    }
    if ($event) {
      $event.stopPropagation();
    }
    //this.refresh();
    this.$scope.$root.$broadcast('refresh');
  }

  changePanelState_v2($event) {
    this.action_panelstate.isMin = !this.action_panelstate.isMin;
    this.action_panelstate.text = (this.action_panelstate.isMin ? "还原" : "最小化");

    let orgSpan = this.panel.orgSpan;
    let thisSpan = orgSpan || this.panel.span;
    let panelArray = [];

    let thisIndex = _.findIndex(this.row.panels, this.panel);

    let span12 = 0;
    let panelArray2 = [];
    for (let index = thisIndex; index < this.row.panels.length && span12 < 12; index++) {
      span12 += this.row.panels[index].span;
      panelArray2.push(this.row.panels[index]);
    }

    panelArray2.forEach(panel => {
      if (panel.orgSpan) {
        panel.span = panel.orgSpan;
        delete panel["orgSpan"];
      } else {
        panel.orgSpan = panel.span;
        panel.orgHeight = panel.height;

        if (panel !== this.panel) {
          panelArray.push(panel);
          //panel.span = 12;
        }
      }
    });

    let panelRow = [];
    let p = [];
    let ss = 0;
    panelArray.forEach(panel => {
      let count = panel.span + ss + thisSpan;
      p.push(panel);
      if (count >= 12) {
        panelRow.push(p);
        p = [];
        ss = 0;
      } else {
        ss += panel.span;
      }
    });

    panelRow.forEach(row => {
      if (row.length === 1) {
        row[0].span = 12;
      } else {
        row[row.length - 1].span += thisSpan;
      }
    });


    if (orgSpan) {
      this.panel.span = orgSpan;
      if (this.panel.orgHeight) {
        this.panel.height = this.panel.orgHeight;
      } else {
        delete this.panel['height'];
      }
    } else {
      this.panel.span = 1;
      this.panel.height = 1;
    }
    if ($event) {
      $event.stopPropagation();
    }
    //this.refresh();
    this.$scope.$root.$broadcast('refresh');
  }

  getExtendedMenu() {
    var actions = [{ text: 'Panel JSON', click: 'ctrl.editPanelJson(); dismiss();', role: 'Editor' }];
    this.events.emit('init-panel-actions', actions);
    return actions;
  }

  otherPanelInFullscreenMode() {
    return this.dashboard.meta.fullscreen && !this.fullscreen
      && this.row.fullScreenShow !== true && this.hasQuerybarAndFilterPanel() !== true;
  }

  calculatePanelHeight() {
    if (this.fullscreen) {
      var docHeight = $(window).height();
      var editHeight = Math.floor(docHeight * 0.4);
      var fullscreenHeight = Math.floor(docHeight * 0.8);
      this.containerHeight = this.editMode ? editHeight : fullscreenHeight;
    } else {
      this.containerHeight = this.panel.height || this.row.height;
      if (_.isString(this.containerHeight)) {
        this.containerHeight = parseInt(this.containerHeight.replace('px', ''), 10);
      }
    }

    this.height = this.containerHeight - (PANEL_BORDER + PANEL_PADDING + (this.panel.title ? TITLE_HEIGHT : EMPTY_TITLE_HEIGHT));
  }



  visibility() {
    var contextSrv = this.$injector.get('contextSrv');
    if (this.panel.hideexpress) {
      var templateSrv = this.$injector.get('templateSrv');
      var compiled = _.template('${' + this.panel.hideexpress + "}", {
        'variable': ['vars'],
        imports: {
          '_': _,
          'moment': moment,
          device: (function () {
            var ua = window.navigator.userAgent;
            var android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
            var ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
            var ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
            var iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
            return {
              ios: ipad || iphone || ipod,
              android: android
            };
          })()
        }
      });

      var contextData = _.transform(templateSrv.variables, (result, variable) => { result[variable.name] = variable.current.value; }, {});
      var panelHide = compiled(contextData) === 'true';

      if (contextSrv.isEditor) {
        this.panel.editorHide = panelHide;
      } else {
        this.panel.dyHide = panelHide;
      }
      this.row.hideRow = _.size(_.filter(this.row.panels, eachPanel => { return !eachPanel.dyHide; })) === 0;
      this.calcHide = panelHide;
      return panelHide;
    }
  }

  render(payload?) {
    this.visibility();
    // ignore if other panel is in fullscreen mode
    if (this.otherPanelInFullscreenMode()) {
      return;
    }
    this.calculatePanelHeight();
    this.timing.renderStart = new Date().getTime();
    this.events.emit('render', payload);
  }

  toggleEditorHelp(index) {
    if (this.editorHelpIndex === index) {
      this.editorHelpIndex = null;
      return;
    }
    this.editorHelpIndex = index;
  }

  duplicate() {
    this.dashboard.duplicatePanel(this.panel, this.row);
    this.$timeout(() => {
      this.$scope.$root.$broadcast('render');
    });
  }

  updateColumnSpan(span) {
    this.panel.span = Math.min(Math.max(Math.floor(this.panel.span + span), 1), 12);
    this.row.panelSpanChanged();

    this.$timeout(() => {
      this.render();
    });
  }

  removePanel() {
    this.row.removePanel(this.panel);
  }

  editPanelJson() {
    this.publishAppEvent('show-json-editor', {
      object: this.panel,
      updateHandler: this.replacePanel.bind(this)
    });
  }

  replacePanel(newPanel, oldPanel) {
    var row = this.row;
    var index = _.indexOf(this.row.panels, oldPanel);
    this.row.panels.splice(index, 1);

    // adding it back needs to be done in next digest
    this.$timeout(() => {
      newPanel.id = oldPanel.id;
      newPanel.span = oldPanel.span;
      this.row.panels.splice(index, 0, newPanel);
    });
  }

  sharePanel() {
    var shareScope = this.$scope.$new();
    shareScope.panel = this.panel;
    shareScope.dashboard = this.dashboard;

    this.publishAppEvent('show-modal', {
      src: 'public/app/features/dashboard/partials/shareModal.html',
      scope: shareScope
    });
  }

  drilldown() {

    if (_.size(this.panel.drillConf.links) === 1) {
      var linkSrv = this.$injector.get('linkSrv');
      var link = linkSrv.getPanelLinkAnchorInfo(_.first(this.panel.drillConf.links), this.panel.scopedVars);
      var goHref = $("<a>").attr('href', link.href).attr('target', link.target);
      goHref[0].click();
      goHref.remove();
      return;
    }

    var modalScope = this.$scope.$new();
    modalScope.panel = this.panel;

    modalScope.dismiss = function () {
      this.publishAppEvent('hide-modal');
      modalScope.$destroy();
    };

    this.publishAppEvent('show-modal', {
      src: 'public/app/features/dashboard/partials/drilldown.html',
      scope: modalScope,
      backdrop: 'static'
    });
  }

  getInfoMode() {
    if (this.error) {
      return 'error';
    }
    if (!!this.panel.description) {
      return 'info';
    }
    if (this.panel.links && this.panel.links.length) {
      return 'links';
    }
    return '';
  }

  getInfoContent(options) {
    var markdown = this.panel.description;

    if (options.mode === 'tooltip') {
      markdown = this.error || this.panel.description;
    }

    var linkSrv = this.$injector.get('linkSrv');
    var templateSrv = this.$injector.get('templateSrv');
    var interpolatedMarkdown = templateSrv.replace(markdown, this.panel.scopedVars);
    var html = '<div class="markdown-html">';

    html += new Remarkable().render(interpolatedMarkdown);

    if (this.panel.links && this.panel.links.length > 0) {
      html += '<ul>';
      for (let link of this.panel.links) {
        var info = linkSrv.getPanelLinkAnchorInfo(link, this.panel.scopedVars);
        html += '<li><a class="panel-menu-link" href="' + info.href + '" target="' + info.target + '">' + info.title + '</a></li>';
      }
      html += '</ul>';
    }

    return html + '</div>';
  }

  getHelpTooltipContent() {
    var markdown = _.get(this.panel, 'helpTooltip.description', this.panel.description);

    var templateSrv = this.$injector.get('templateSrv');
    var interpolatedMarkdown = templateSrv.replace(markdown, this.panel.scopedVars);
    var html = '<div class="markdown-tooltip">';

    html += new Remarkable().render(interpolatedMarkdown);

    return html + '</div>';
  }

  openInspector() {
    var modalScope = this.$scope.$new();
    modalScope.panel = this.panel;
    modalScope.dashboard = this.dashboard;
    modalScope.panelInfoHtml = this.getInfoContent({ mode: 'inspector' });

    modalScope.inspector = $.extend(true, {}, this.inspector);
    this.publishAppEvent('show-modal', {
      src: 'public/app/features/dashboard/partials/inspector.html',
      scope: modalScope
    });
  }
}
