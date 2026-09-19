const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;


export class FarbmeisterItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {

    classes: [
      "farbmeister",
      "farbmeister-item-sheet"
    ],

    tag: "form",

    position: {
      width: 620,
      height: 480
    },

    window: {
      resizable: true
    },

    /*
     * Änderungen werden sofort ins Dokument
     * geschrieben. Kein eigener Listener nötig.
     */
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  };


  static PARTS = {
    main: {
      template:
        "modules/farbmeister-sheet/templates/item-sheet.hbs"
    }
  };


  async _prepareContext(options) {

    const context =
      await super._prepareContext(options);

    context.item = this.document;
    context.system = this.document.system;
    context.editable = this.isEditable;

    return context;
  }
}