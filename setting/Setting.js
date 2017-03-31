define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'jimu/dijit/CheckBox'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting,
    Message) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'widget-popuppanel-setting',

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        if (!config.closeOnClear) {
          this.closeonclear.setValue(true);
        } else {
          this.closeonclear.setValue(false);
        }
        if (!config.closeAtStart) {
          this.closeonstart.setValue(true);
        } else {
          this.closeonstart.setValue(false);
        }
      },

      getConfig: function() {
        this.config.closeAtStart = this.closeonstart.checked;
        this.config.closeOnClear = this.closeonclear.checked;
        return this.config;
      }

    });
  });
