///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';

import config from 'app/core/config';
import { coreModule, appEvents } from 'app/core/core';

import './options';
import './add_panel';

export class DashRowCtrl {
  dashboard: any;
  row: any;
  dropView: number;
  draggable: true;
  activeIndex: number;

  /** @ngInject */
  constructor(private $scope, private $rootScope, private $timeout, contextSrv) {
    this.row.title = this.row.title || 'Row title';
    this.draggable = contextSrv.isEditor;
    this.activeIndex = 0;
    if (this.row.isNew) {
      this.dropView = 1;
    }
  }

  size(panels) {
    return _.size(panels);
  }

  onDrop(panelId, dropTarget) {
    var dragObject;

    // if string it's a panel type
    if (_.isString(panelId)) {
      // setup new panel
      dragObject = {
        row: this.row,
        panel: {
          title: config.new_panel_title,
          type: panelId,
          id: this.dashboard.getNextPanelId(),
          isNew: true,
        },
      };
    } else {
      dragObject = this.dashboard.getPanelInfoById(panelId);
    }

    if (dropTarget) {
      dropTarget = this.dashboard.getPanelInfoById(dropTarget.id);
      // if draging new panel onto existing panel split it
      if (dragObject.panel.isNew) {
        dragObject.panel.span = dropTarget.panel.span = dropTarget.panel.span / 2;
        // insert after
        dropTarget.row.panels.splice(dropTarget.index + 1, 0, dragObject.panel);
      } else if (this.row === dragObject.row) {
        // just move element
        this.row.movePanel(dragObject.index, dropTarget.index);
      } else {
        // split drop target space
        dragObject.panel.span = dropTarget.panel.span = dropTarget.panel.span / 2;
        // insert after
        dropTarget.row.panels.splice(dropTarget.index + 1, 0, dragObject.panel);
        // remove from source row
        dragObject.row.removePanel(dragObject.panel, false);
      }
    } else {
      dragObject.panel.span = 12 - this.row.span;
      this.row.panels.push(dragObject.panel);

      // if not new remove from source row
      if (!dragObject.panel.isNew) {
        dragObject.row.removePanel(dragObject.panel, false);
      }
    }

    this.dropView = 0;
    this.row.panelSpanChanged();
    this.$timeout(() => {
      this.$rootScope.$broadcast('render');
    });
  }

  setHeight(height) {
    this.row.height = height;
    this.$scope.$broadcast('render');
  }

  moveRow(direction) {
    var rowsList = this.dashboard.rows;
    var rowIndex = _.indexOf(rowsList, this.row);
    var newIndex = rowIndex + direction;

    if (newIndex >= 0 && newIndex <= (rowsList.length - 1)) {
      _.move(rowsList, rowIndex, newIndex);
    }
  }

  toggleCollapse() {
    this.closeDropView();
    this.row.collapse = !this.row.collapse;
  }

  onMenuAddPanel() {
    this.dropView = 1;
  }

  onMenuRowOptions() {
    this.dropView = 2;
  }

  closeDropView() {
    this.dropView = 0;
  }

  onMenuDeleteRow() {
    this.dashboard.removeRow(this.row);
  }
}

coreModule.directive('dashRow', function ($rootScope) {
  return {
    restrict: 'E',
    templateUrl: 'public/app/features/dashboard/row/row.html',
    controller: DashRowCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {
      dashboard: "=",
      row: "=",
    },
    link: function (scope, element) {
      //row展开时，处罚内部panel的refresh
      scope.$watch('ctrl.row.collapse', function (newValue, oldValue, scope) {
        if (false === newValue) {
          scope.$broadcast('refresh');
        }
      });
      scope.$watchGroup(['ctrl.row.collapse', 'ctrl.row.height'], function () {
        element.toggleClass('dash-row--collapse', scope.ctrl.row.collapse);
        if (scope.ctrl.row.notWatchHeight) {
          element.find('.panels-wrapper').css({ minHeight: element.find(".teld-querybar-panel").height() });
          return;
        }
        element.find('.panels-wrapper').css({ minHeight: scope.ctrl.row.collapse ? '5px' : scope.ctrl.row.height });
      });

      var tfilter = _.filter(scope.ctrl.row.panels, panel => {
        var returnValue = false;
        switch (panel.type) {
          case 'teld-filter-builtin-panel':
          case 'teld-querybar-panel':
            returnValue = true;
            break;
        }
        return returnValue;
      });
      var hasFilter = _.size(tfilter) > 0;
      $rootScope.onAppEvent('teld-fullscreen-row', function (evt, info) {
        scope.ctrl.dyfullScreenShow = info.allowViewModeFilter && hasFilter;
      }, scope);

      $rootScope.onAppEvent('panel-fullscreen-enter', function (evt, info) {
        if (scope.ctrl.row.fullScreenShow || scope.ctrl.dyfullScreenShow) { return; }
        var hasPanel = _.find(scope.ctrl.row.panels, { id: info.panelId });
        if (!hasPanel) {
          element.hide();
        }
      }, scope);

      $rootScope.onAppEvent('panel-fullscreen-exit', function () {
        if (scope.ctrl.row.hideRow !== true) { element.show(); }
      }, scope);
    }
  };
});

coreModule.directive('panelWidth', function ($rootScope) {
  return function (scope, element) {
    var fullscreen = false;

    function updateWidth() {
      if (!fullscreen) {
        element[0].style.width = ((scope.panel.span / 1.2) * 10) + '%';
      }
    }

    $rootScope.onAppEvent('panel-fullscreen-enter', function (evt, info) {
      fullscreen = true;

      if (scope.panel.id !== info.panelId) {
        if (scope.ctrl.row.fullScreenShow || scope.ctrl.dyfullScreenShow) { return; }
        element.hide();
      } else {
        element[0].style.width = '100%';
      }
    }, scope);

    $rootScope.onAppEvent('panel-fullscreen-exit', function (evt, info) {
      fullscreen = false;

      if (scope.panel.id !== info.panelId) {
        element.show();
      }

      updateWidth();
    }, scope);

    scope.$watch('panel.span', updateWidth);

    if (fullscreen) {
      element.hide();
    }
  };
});


coreModule.directive('panelDropZone', function ($timeout) {
  return function (scope, element) {
    var row = scope.ctrl.row;
    var dashboard = scope.ctrl.dashboard;
    var indrag = false;
    var textEl = element.find('.panel-drop-zone-text');

    function showPanel(span, text) {
      element.find('.panel-container').css('height', row.height);
      element[0].style.width = ((span / 1.2) * 10) + '%';
      textEl.text(text);
      element.show();
    }

    function hidePanel() {
      element.hide();
    }

    function updateState() {
      if (row.panels.length === 0 && indrag === false) {
        return showPanel(12, 'Empty Space');
      }

      var dropZoneSpan = 12 - row.span;
      if (dropZoneSpan > 0) {
        if (indrag) {
          return showPanel(dropZoneSpan, 'Drop Here');
        } else {
          return showPanel(dropZoneSpan, 'Empty Space');
        }
      }

      if (indrag === true) {
        var dropZoneSpan = 12 - row.span;
        if (dropZoneSpan > 1) {
          return showPanel(dropZoneSpan, 'Drop Here');
        }
      }

      hidePanel();
    }

    row.events.on('span-changed', updateState, scope);

    scope.$on("ANGULAR_DRAG_START", function () {
      indrag = true;
      updateState();
    });

    scope.$on("ANGULAR_DRAG_END", function () {
      indrag = false;
      updateState();
    });

    updateState();
  };
});

