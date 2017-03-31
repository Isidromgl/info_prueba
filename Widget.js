define([
  'dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', "esri/map",
  "esri/geometry/Point", "esri/arcgis/utils", "esri/dijit/Print",
  "esri/tasks/PrintTemplate", "esri/config", "dojo/parser", "dojo/dom-style",
  'dojo/_base/array', "dojo/dom", 'jimu/BaseWidget','jimu/dijit/Message',
  'esri/domUtils', 'esri/dijit/Popup', 'dojo/on', 'dojo/topic', 'dojo/query',
  'dojo/_base/html', 'dojo/dom-class', 'dojo/dom-construct', 'dojo/_base/lang',
  'jimu/WidgetManager','jimu/PanelManager', 'jimu/MapManager',
  'dojo/i18n!esri/nls/jsapi','jimu/FeatureActionManager', 'jimu/dijit/PopupMenu',
   'jimu/utils', 'dijit/layout/ContentPane'
],
  function (
    declare, _WidgetsInTemplateMixin, Map, Point,arcgisUtils, Print,
    PrintTemplate, esriConfig, parser, domStyle,array, dom,
    BaseWidget, Message, domUtils, Popup, on, topic, query, html, domClass,
    domConstruct, lang, WidgetManager, PanelManager, MapManager, esriBundle,
    FeatureActionManager, PopupMenu, jimuUtils,  ContentPane
  ) {
    return declare([BaseWidget, _WidgetsInTemplateMixin], {

      baseClass: 'widget-popuppanel',
      name: 'Pdf_pr',
      label: 'Pdf_pr',
      popup: null,
      //zt: null,
      //clearSel: null,
      popupMenu: null,
      featureActionManager: null,
      inPanel: null,

      postCreate: function () {
        this.inherited(arguments);
        this.popupMenu = PopupMenu.getInstance();
        this.featureActionManager = FeatureActionManager.getInstance();
        domUtils.hide(this.actionsPaneDiv);
        this.own(on(this.domNode, 'mousedown', lang.hitch(this, function (event) {
          event.stopPropagation();
          if (event.altKey) {
            var msgStr = this.nls.widgetverstr + ': ' + this.manifest.version;
            msgStr += '\n' + this.nls.wabversionmsg + ': ' + this.manifest.wabVersion;
            msgStr += '\n' + this.manifest.description;
            new Message({
              titleLabel: this.nls.widgetversion,
              message: msgStr
            });
          }
        })));

        this.popup = this.map.infoWindow;
        console.log(this.map.infoWindow);
        topic.subscribe("widgetsActionsRegistered", lang.hitch(this, this._onWidgetsActionsRegistered));
        this._createPopupMenuButton();
        this._createPrintButton();
        this.setEvtHandlers();
        this.onWindowResize();
        console.log(arguments.length);

      },

      _onWidgetsActionsRegistered: function(){
        if(this.selectedFeature){
          this._initPopupMenu();
        }

      },

      onWindowResize: function(){
        var mapMan = MapManager.getInstance();
        if(mapMan.isMobileInfoWindow){
          this.map.setInfoWindow(mapMan._mapInfoWindow);
          this.popup = this.map.infoWindow;
          this.setEvtHandlers();
          mapMan.isMobileInfoWindow = false;
        }
      },

      _initPopupMenu: function(){
        this.featureActionManager.getSupportedActions(this.selectedFeature).then(lang.hitch(this, function(actions){
          var excludeActions = ['ZoomTo', 'ShowPopup', 'Flash', 'PanTo', 'AddMarker','ExportToCSV'];
          var popupActions = actions.filter(lang.hitch(this, function(action){
            return excludeActions.indexOf(action.name) < 0 ;
          }));

          if(popupActions.length === 0){
            html.addClass(this.popupMenuButton, 'disabled');

          }else{
            html.removeClass(this.popupMenuButton, 'disabled');
          }
          var menuActions = popupActions.map(lang.hitch(this, function(action){
            action.data = jimuUtils.toFeatureSet(this.selectedFeature);

            return action;
          }));
          this.popupMenu.setActions(menuActions);
          //console.log(menuActions);
        }));

      },

      _createPopupMenuButton: function(){
        this.popupMenuButton = html.create('span', {
          'class': 'popup-menu-button'
        }, query(".actionList", this.domNode)[0]);

        on(this.popupMenuButton, 'click', lang.hitch(this, this._onPopupMenuButtonClick));
      },
      _createPrintButton: function(){
        this.printButton = html.create('span', {
          'class': 'esriPrint'
        }, query(".actionPrint", this.domNode)[0]);

        on(this.printButton, 'click', lang.hitch(this, this.createPrintDijit));
      },

      _onPopupMenuButtonClick: function(evt){
        var position = html.position(evt.target);
        this.popupMenu.show(position);
      },

      setEvtHandlers: function(){
        this.own(on(this.popup, "selection-change", lang.hitch(this, function (evt) {
          this.selectedFeature = evt.target.getSelectedFeature();
          if(this.selectedFeature){
            this._initPopupMenu();
          }
          var selec = this.popup.getSelectedFeature();
          this.displayPopupContent(this.popup.getSelectedFeature());
          //console.log(selec);
        })));

        this.own(on(this.popup, "clear-features", lang.hitch(this, function () {
          if(this.instructions){
            domUtils.show(this.instructions);
            this.instructions.innerHTML = this.nls.selectfeatures;
          }
          if(this.popupContent){
            this.popupContent.set("content", "");
          }
          domUtils.hide(this.pager);
        })));

        this.own(on(this.popup, "set-features", lang.hitch(this, function(){
          if(!this.popup.features){
            domUtils.hide(this.pager);
            domUtils.show(this.instructions);
            domUtils.hide(this.actionsPaneDiv);
            return;
          }
          if(this.popup.features.length === 0){
            domUtils.show(this.instructions);
            domUtils.hide(this.actionsPaneDiv);
            //domUtils.hide(this.print_button);
          }else{
            domUtils.hide(this.instructions);
            domUtils.show(this.actionsPaneDiv);
          //  domUtils.show(this.print_button);
          }
          this.displayPopupContent(this.popup.getSelectedFeature());
          this.featureCount.innerHTML = "(1 of " + this.popup.features.length + ")";

          if(this.popup.features.length > 1){
            domUtils.show(this.pager);
            domClass.add(this.previous, "hidden");
            domClass.remove(this.next, "hidden");


          }else if (this.popup.features.length === 1){
            domUtils.show(this.pager);
            domClass.add(this.previous, "hidden");
            domClass.add(this.next, "hidden");

          }else{
            domUtils.hide(this.pager);
            //domUtils.hide(this.print_button);
          }
        })));

        this.own(on(this.previous, "click", lang.hitch(this, function(){this.selectPrevious();})));
        this.own(on(this.next, "click", lang.hitch(this, function(){this.selectNext();})));

        this.own(on(this.btnClear, "click", lang.hitch(this, this.clearResults)));
        this.own(on(window, 'resize', lang.hitch(this, this.onWindowResize)));

      },


      clearResults: function() {
        if(this.config.closeOnClear){
          this.closeWidget();
        }
        if(this.instructions){
          domUtils.show(this.instructions);
          this.instructions.innerHTML = this.nls.selectfeatures;
        }
        if(this.popupContent){
          this.popupContent.set("content", "");
        }
        domUtils.hide(this.pager);
        domUtils.hide(this.actionsPaneDiv);
        domUtils.hide(this.print_button);
        this.popup.clearFeatures();
      },

      startup: function () {
        this.inherited(arguments);
        this.inPanel = this.getPanel();
        this.displayPopupContent(this.popup.getSelectedFeature());
        if(this.config.closeAtStart){
          if(!this.popup.getSelectedFeature()){
            setTimeout(lang.hitch(this, function(){
              this.closeWidget();
            }), 300);
          }
        };


      },

      closeWidget: function() {
        if(this.inPanel){
          //console.info(this.inPanel);
          if(this.appConfig.theme.name === 'JewelryBoxTheme'){
            PanelManager.getInstance().minimizePanel(this.inPanel);
          }else if(this.appConfig.theme.name === 'TabTheme') {
            var sbc = WidgetManager.getInstance().getWidgetsByName("SidebarController")[0];
            sbc._resizeToMin();
          }else{
            PanelManager.getInstance().closePanel(this.inPanel);
          }
        }else{
          WidgetManager.getInstance().closeWidget(this);
        }
      },

      onOpen: function () {
        var mapMan = MapManager.getInstance();
        /*-if(mapMan.isMobileInfoWindow){
          this.map.setInfoWindow(mapMan._mapInfoWindow);
          mapMan.isMobileInfoWindow = false;
        }*/
        this.map.infoWindow.set("popupWindow", false);
        console.log(mapMan);
        console.log(map);

      this.map.on("click", lang.hitch(this,function(evt){
        var point= evt.mapPoint;
        this.map.centerAndZoom(point,18);
        //console.log(this.popup.features.length);
      }))
      },


      onDestroy: function () {
        var mapMan = MapManager.getInstance();
        mapMan.resetInfoWindow(false);
        if(!mapMan.isMobileInfoWindow){
          this.map.infoWindow.set("popupWindow", true);
        }
      },

      displayPopupContent: function (feature) {
        if (feature) {
          if(this.inPanel){
            if(this.appConfig.theme.name === 'JewelryBoxTheme'){
              PanelManager.getInstance().maximizePanel(this.inPanel);
            }else if(this.appConfig.theme.name === 'TabTheme') {
              var sbc = WidgetManager.getInstance().getWidgetsByName("SidebarController")[0];
              sbc._resizeToMax();
            }else{
              PanelManager.getInstance().normalizePanel(this.inPanel);
            }
          }else{
            WidgetManager.getInstance().triggerWidgetOpen(this.id);
          }
          var content = feature.getContent();
          if(this.popupContent){
            this.popupContent.set("content", content);
            console.log(content);
          }
          domUtils.show(this.actionsPaneDiv);
          //domUtils.show(this.printButton);
        }else{
          domUtils.hide(this.pager);
          domUtils.show(this.instructions);
          domUtils.hide(this.actionsPaneDiv);
          //domUtils.hide(this.printButton);
        }
      },

      selectPrevious: function () {
        this.popup.selectPrevious();
        this.featureCount.innerHTML = "(" + (this.popup.selectedIndex + 1) + " of " + this.popup.features.length + ")";
        if((this.popup.selectedIndex + 1) < this.popup.features.length){
          domClass.remove(this.next, "hidden");
        }
        if(this.popup.selectedIndex === 0){
          domClass.add(this.previous, "hidden");
        }
      },

      selectNext: function () {
        domClass.remove(this.previous, "hidden");
        this.popup.selectNext();
        this.featureCount.innerHTML = "(" + (this.popup.selectedIndex + 1) + " of " + this.popup.features.length + ")";
        if((this.popup.selectedIndex + 1) === this.popup.features.length){
          domClass.add(this.next, "hidden");
        }
      },

      //print
      createPrintDijit: function(){
        domClass.remove(this.printButton,"hidden");

        // create an array of objects that will be used to create print templates
        var layouts = [{
          name: "Letter ANSI A Landscape",
          label: "Landscape (PDF)",
          format: "pdf",
          options: {
            legendLayers: [], // empty array means no legend
            scalebarUnit: "Miles",
            titleText: "Landscape PDF"
          }
        }];
        console.log(layouts);

        // create the print templates
       var templates = array.map(this.layouts, function(lo) {
          var t = new PrintTemplate();
          t.layout = lo.name;
          t.label = lo.label;
          t.format = lo.format;
          t.layoutOptions = lo.options;
          return t;

              console.log(t);
        });


        var print = new Print({
          map: this.mapMan,
          templates: this.templates,
          url:"https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
        },dom.byId("print_button"));
        print.startup();
        }




    });
  });
