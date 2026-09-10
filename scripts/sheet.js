import {
  FARBMISTER_COLORS,
  FARBMISTER_DEFAULTS
} from "./config.js";


const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;


export class FarbmeisterActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: [
      "farbmeister",
      "farbmeister-actor-sheet"
    ],

    tag: "form",

    position: {
      width: 900,
      height: 650
    },

    window: {
      resizable: true
    }
  };


  static PARTS = {
    main: {
      template: "modules/farbmeister-sheet/templates/character-sheet.hbs"
    }
  };


  async _prepareContext(options) {

    const context = await super._prepareContext(options);

    /*
     * Unsere gespeicherten Farbmeister-Daten.
     */
    const savedData =
      this.actor.getFlag("farbmeister-sheet", "character") ?? {};


    /*
     * Standardwerte verwenden, wenn der Actor
     * noch keine Farbmeister-Daten besitzt.
     */
    const character = {
      color:
        savedData.color ??
        FARBMISTER_DEFAULTS.color,

      hp:
        savedData.hp ??
        FARBMISTER_DEFAULTS.hp,

      mana:
        savedData.mana ??
        FARBMISTER_DEFAULTS.mana
    };


    /*
     * Falls aus irgendeinem Grund eine ungültige Farbe
     * gespeichert wurde, Rot als Fallback verwenden.
     */
    const selectedColor =
      FARBMISTER_COLORS[character.color] ??
      FARBMISTER_COLORS.red;


    /*
     * Farbauswahl für das Dropdown vorbereiten.
     */
    const colors = Object.entries(FARBMISTER_COLORS).map(
      ([key, color]) => ({
        key,
        label: color.label,
        icon: color.icon,
        selected: key === character.color
      })
    );


    /*
     * Die sieben Mana-Kreise vorbereiten.
     */
    const manaCircles = Array.from(
      { length: 7 },
      (_, index) => ({
        value: index + 1,
        filled: index < character.mana
      })
    );


    context.actor = this.actor;
    context.actorName = this.actor.name;

    context.character = character;
    context.colors = colors;
    context.selectedColor = selectedColor;
    context.manaCircles = manaCircles;

    return context;
  }


  _onRender(context, options) {

    super._onRender(context, options);

    const root = this.element;

    if (!root) return;


    /*
     * NAME
     */
    const nameInput = root.querySelector(
      "[data-action='change-name']"
    );

    nameInput?.addEventListener("change", async event => {

      const name = event.currentTarget.value.trim();

      if (!name) return;

      await this.actor.update({
        name
      });
    });


    /*
     * FARBE
     */
    const colorSelect = root.querySelector(
      "[data-action='change-color']"
    );

    colorSelect?.addEventListener("change", async event => {

      const color = event.currentTarget.value;

      await this._updateCharacterData({
        color
      });
    });


    /*
     * LEBEN
     */
    const hpInput = root.querySelector(
      "[data-action='change-hp']"
    );

    hpInput?.addEventListener("change", async event => {

      let hp = Number(event.currentTarget.value);

      hp = Math.clamp(hp, 0, 25);

      await this._updateCharacterData({
        hp
      });
    });


    /*
     * FARBTROPFEN
     */
    root
      .querySelectorAll("[data-action='set-mana']")
      .forEach(circle => {

        circle.addEventListener("click", async event => {

          const mana =
            Number(event.currentTarget.dataset.value);

          await this._updateCharacterData({
            mana
          });
        });

      });


    /*
     * Rechtsklick auf Farbtropfen:
     * Wert auf einen weniger setzen.
     *
     * Dadurch können wir auch wieder auf 0 kommen.
     */
    root
      .querySelectorAll("[data-action='set-mana']")
      .forEach(circle => {

        circle.addEventListener("contextmenu", async event => {

          event.preventDefault();

          const clickedValue =
            Number(event.currentTarget.dataset.value);

          const mana = Math.max(
            0,
            clickedValue - 1
          );

          await this._updateCharacterData({
            mana
          });
        });

      });

  }


  /**
   * Farbmeister-Daten des Actors aktualisieren.
   */
  async _updateCharacterData(changes) {

    const current =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    const updated = {
      color:
        current.color ??
        FARBMISTER_DEFAULTS.color,

      hp:
        current.hp ??
        FARBMISTER_DEFAULTS.hp,

      mana:
        current.mana ??
        FARBMISTER_DEFAULTS.mana,

      ...changes
    };


    await this.actor.setFlag(
      "farbmeister-sheet",
      "character",
      updated
    );


    this.render();
  }

}