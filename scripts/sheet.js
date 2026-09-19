import {
  FARBMISTER_COLORS,
  FARBMISTER_DEFAULTS
} from "./config.js";


const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;


/**
 * Farbmeister Character Sheet
 * Foundry VTT v13
 */
export class FarbmeisterActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  /**
   * Welcher Tab aktuell geöffnet ist.
   */
  _activeTab = "character";


  /* ========================================================= */
  /* DEFAULT OPTIONS                                           */
  /* ========================================================= */

  static DEFAULT_OPTIONS = {

    classes: [
      "farbmeister",
      "farbmeister-actor-sheet"
    ],

    tag: "form",

    position: {
      width: 1000,
      height: 760
    },

    window: {
      resizable: true
    }
  };


  /* ========================================================= */
  /* TEMPLATES                                                 */
  /* ========================================================= */

  static PARTS = {

    main: {
      template:
        "modules/farbmeister-sheet/templates/character-sheet.hbs"
    },

    inventory: {
      template:
        "modules/farbmeister-sheet/templates/inventory.hbs"
    }
  };


  /* ========================================================= */
  /* CONTEXT                                                   */
  /* ========================================================= */

  async _prepareContext(options) {

    const context =
      await super._prepareContext(options);


    /*
     * Gespeicherte Farbmeister-Daten
     */
    const savedData =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    /*
     * Gespeicherte Fähigkeiten
     */
    const savedAbilities =
      savedData.abilities ?? {};


    /*
     * Inventar
     */
    const inventory =
      Array.isArray(savedData.inventory)
        ? savedData.inventory.map(item => ({
            ...item
          }))
        : [];


    /*
     * Character-Daten + Standardwerte
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
        FARBMISTER_DEFAULTS.mana,

      abilities: {

        attack:
          savedAbilities.attack ??
          FARBMISTER_DEFAULTS.abilities.attack,

        defense:
          savedAbilities.defense ??
          FARBMISTER_DEFAULTS.abilities.defense,

        support:
          savedAbilities.support ??
          FARBMISTER_DEFAULTS.abilities.support
      }
    };


    /*
     * Aktuelle Farbe bestimmen.
     * Rot dient als Fallback.
     */
    const selectedColor =
      FARBMISTER_COLORS[character.color] ??
      FARBMISTER_COLORS.red;


    /*
     * Farben für Dropdown vorbereiten.
     */
    const colors =
      Object.entries(FARBMISTER_COLORS).map(
        ([key, color]) => ({

          key,

          label:
            color.label,

          icon:
            color.icon,

          selected:
            key === character.color
        })
      );


    /*
     * Farbtropfen vorbereiten.
     */
    const manaCircles =
      this._createCircles(
        7,
        character.mana
      );


    /*
     * Fähigkeiten für das Template vorbereiten.
     */
    const abilities =
      Object.entries(
        selectedColor.abilities
      ).map(
        ([key, ability]) => {

          const value =
            character.abilities[key] ?? 0;

          return {

            key,

            label:
              ability.label,

            name:
              ability.name,

            description:
              ability.description,

            value,

            circles:
              this._createCircles(
                5,
                value
              )
          };
        }
      );


    /*
     * Daten ans Template übergeben.
     */
    context.actor =
      this.actor;

    context.actorName =
      this.actor.name;

    context.character =
      character;

    context.colors =
      colors;

    context.selectedColor =
      selectedColor;

    context.manaCircles =
      manaCircles;

    context.abilities =
      abilities;

    context.inventory =
      inventory;


    return context;
  }


  /* ========================================================= */
  /* KREISE ERZEUGEN                                           */
  /* ========================================================= */

  _createCircles(max, current) {

    return Array.from(
      {
        length: max
      },

      (_, index) => ({

        value:
          index + 1,

        filled:
          index < current
      })
    );
  }


  /* ========================================================= */
  /* RENDER / EVENT LISTENER                                   */
  /* ========================================================= */

  async _onRender(context, options) {

    await super._onRender(
      context,
      options
    );


    const root =
      this.element;


    if (!root) return;


    /* --------------------------------------------------------- */
    /* AKTUELLEN TAB AKTIVIEREN                                 */
    /* --------------------------------------------------------- */

    this._activateTab(
      this._activeTab
    );


    /* --------------------------------------------------------- */
    /* TABS                                                     */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='switch-tab']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          event => {

            const tab =
              event.currentTarget.dataset.tab;

            this._activateTab(
              tab
            );
          }
        );
      });


    /* --------------------------------------------------------- */
    /* NAME                                                     */
    /* --------------------------------------------------------- */

    root
      .querySelector(
        "[data-action='change-name']"
      )
      ?.addEventListener(
        "change",
        async event => {

          const name =
            event.currentTarget.value.trim();


          if (!name) return;


          await this.actor.update({
            name
          });
        }
      );


    /* --------------------------------------------------------- */
    /* FARBE                                                    */
    /* --------------------------------------------------------- */

    root
      .querySelector(
        "[data-action='change-color']"
      )
      ?.addEventListener(
        "change",
        async event => {

          const color =
            event.currentTarget.value;


          await this._updateCharacterData({
            color
          });
        }
      );


    /* --------------------------------------------------------- */
    /* LEBEN                                                    */
    /* --------------------------------------------------------- */

    root
      .querySelector(
        "[data-action='change-hp']"
      )
      ?.addEventListener(
        "change",
        async event => {

          let hp =
            Number(
              event.currentTarget.value
            );


          if (Number.isNaN(hp)) {
            hp = 0;
          }


          hp =
            Math.max(
              0,
              Math.min(
                25,
                hp
              )
            );


          await this._updateCharacterData({
            hp
          });
        }
      );


    /* --------------------------------------------------------- */
    /* FARBTROPFEN                                              */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='set-mana']"
      )
      .forEach(circle => {

        /*
         * Linksklick:
         * Wert auf angeklickten Kreis setzen.
         */
        circle.addEventListener(
          "click",
          async event => {

            const mana =
              Number(
                event.currentTarget.dataset.value
              );


            await this._updateCharacterData({
              mana
            });
          }
        );


        /*
         * Rechtsklick:
         * Einen Wert unterhalb des angeklickten
         * Kreises setzen.
         *
         * Dadurch ist auch 0 möglich.
         */
        circle.addEventListener(
          "contextmenu",
          async event => {

            event.preventDefault();


            const clickedValue =
              Number(
                event.currentTarget.dataset.value
              );


            const mana =
              Math.max(
                0,
                clickedValue - 1
              );


            await this._updateCharacterData({
              mana
            });
          }
        );
      });


    /* --------------------------------------------------------- */
    /* FÄHIGKEITSKREISE                                         */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='set-ability']"
      )
      .forEach(circle => {

        /*
         * Linksklick
         */
        circle.addEventListener(
          "click",
          async event => {

            const ability =
              event.currentTarget.dataset.ability;


            const value =
              Number(
                event.currentTarget.dataset.value
              );


            await this._setAbility(
              ability,
              value
            );
          }
        );


        /*
         * Rechtsklick
         */
        circle.addEventListener(
          "contextmenu",
          async event => {

            event.preventDefault();


            const ability =
              event.currentTarget.dataset.ability;


            const clickedValue =
              Number(
                event.currentTarget.dataset.value
              );


            await this._setAbility(
              ability,
              Math.max(
                0,
                clickedValue - 1
              )
            );
          }
        );
      });


    /* --------------------------------------------------------- */
    /* FÄHIGKEIT WÜRFELN                                        */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='roll-ability']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async event => {

            const ability =
              event.currentTarget.dataset.ability;


            await this._rollAbility(
              ability
            );
          }
        );
      });


    /* ========================================================= */
    /* INVENTAR                                                 */
    /* ========================================================= */


    /* --------------------------------------------------------- */
    /* GEGENSTAND HINZUFÜGEN                                    */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='add-inventory-item']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async () => {

            await this._addInventoryItem();
          }
        );
      });


    /* --------------------------------------------------------- */
    /* NAME / MENGE / BESCHREIBUNG ÄNDERN                       */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='update-inventory-item']"
      )
      .forEach(input => {

        input.addEventListener(
          "change",
          async event => {

            const target =
              event.currentTarget;


            const itemId =
              target.dataset.itemId;


            const field =
              target.dataset.field;


            if (!itemId || !field) {
              return;
            }


            let value =
              target.value;


            /*
             * Menge muss eine Zahl >= 0 sein.
             */
            if (field === "quantity") {

              value =
                Math.max(
                  0,
                  Number(value) || 0
                );
            }


            await this._updateInventoryItem(
              itemId,
              {
                [field]: value
              }
            );
          }
        );
      });


    /* --------------------------------------------------------- */
    /* MENGE + / -                                              */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='change-item-quantity']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async event => {

            const itemId =
              event.currentTarget.dataset.itemId;


            const amount =
              Number(
                event.currentTarget.dataset.amount
              );


            await this._changeInventoryQuantity(
              itemId,
              amount
            );
          }
        );
      });


    /* --------------------------------------------------------- */
    /* ITEM LÖSCHEN                                             */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='delete-inventory-item']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async event => {

            const itemId =
              event.currentTarget.dataset.itemId;


            await this._deleteInventoryItem(
              itemId
            );
          }
        );
      });


    /* --------------------------------------------------------- */
    /* ITEM IN CHAT POSTEN                                      */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='post-inventory-item']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async event => {

            const itemId =
              event.currentTarget.dataset.itemId;


            await this._postInventoryItemToChat(
              itemId
            );
          }
        );
      });


    /* --------------------------------------------------------- */
    /* ITEM-BILD ÄNDERN                                         */
    /* --------------------------------------------------------- */

    root
      .querySelectorAll(
        "[data-action='pick-inventory-image']"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          async event => {

            const itemId =
              event.currentTarget.dataset.itemId;


            await this._pickInventoryImage(
              itemId
            );
          }
        );
      });
  }


  /* ========================================================= */
  /* TABS                                                      */
  /* ========================================================= */

  _activateTab(tab) {

    if (
      ![
        "character",
        "inventory"
      ].includes(tab)
    ) {

      tab =
        "character";
    }


    this._activeTab =
      tab;


    const root =
      this.element;


    if (!root) return;


    /*
     * Inhalte ein-/ausblenden.
     */
    root
      .querySelectorAll(
        "[data-tab-content]"
      )
      .forEach(element => {

        const active =
          element.dataset.tabContent === tab;


        element.classList.toggle(
          "active",
          active
        );
      });


    /*
     * Tab-Buttons markieren.
     */
    root
      .querySelectorAll(
        "[data-action='switch-tab']"
      )
      .forEach(button => {

        const active =
          button.dataset.tab === tab;


        button.classList.toggle(
          "active",
          active
        );
      });
  }


  /* ========================================================= */
  /* FÄHIGKEITEN                                               */
  /* ========================================================= */

  async _setAbility(
    ability,
    value
  ) {

    const allowedAbilities = [
      "attack",
      "defense",
      "support"
    ];


    if (
      !allowedAbilities.includes(
        ability
      )
    ) {

      return;
    }


    value =
      Math.max(
        0,
        Math.min(
          5,
          Number(value) || 0
        )
      );


    const current =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    const abilities = {

      attack:
        current.abilities?.attack ?? 0,

      defense:
        current.abilities?.defense ?? 0,

      support:
        current.abilities?.support ?? 0
    };


    abilities[ability] =
      value;


    await this._updateCharacterData({
      abilities
    });
  }


  /* ========================================================= */
  /* FÄHIGKEITSWURF                                            */
  /* ========================================================= */

  async _rollAbility(
    abilityKey
  ) {

    const character =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    const colorKey =
      character.color ??
      FARBMISTER_DEFAULTS.color;


    const color =
      FARBMISTER_COLORS[colorKey] ??
      FARBMISTER_COLORS.red;


    const ability =
      color.abilities?.[abilityKey];


    if (!ability) {
      return;
    }


    const bonus =
      Number(
        character.abilities?.[abilityKey] ??
        0
      );


    /*
     * Grundwürfel:
     * 1d8 + Fähigkeitsstärke
     */
    const roll =
      await new Roll(
        "1d8 + @bonus",
        {
          bonus
        }
      ).evaluate();


    await roll.toMessage({

      speaker:
        ChatMessage.getSpeaker({
          actor:
            this.actor
        }),

      flavor: `
        <div class="farbmeister-chat-roll">

          <strong>
            ${color.icon}
            ${ability.name}
          </strong>

          <br>

          ${ability.label}: +${bonus}

        </div>
      `
    });
  }


  /* ========================================================= */
  /* INVENTAR - AUSLESEN                                       */
  /* ========================================================= */

  _getInventory() {

    const character =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    const inventory =
      Array.isArray(character.inventory)
        ? character.inventory
        : [];


    /*
     * Kopien zurückgeben.
     * Dadurch verändern wir nicht aus Versehen
     * direkt die gespeicherten Actor-Daten.
     */
    return inventory.map(
      item => ({
        ...item
      })
    );
  }


  /* ========================================================= */
  /* INVENTAR - SPEICHERN                                      */
  /* ========================================================= */

  async _saveInventory(
    inventory
  ) {

    /*
     * Nach einer Inventaränderung
     * im Inventar-Tab bleiben.
     */
    this._activeTab =
      "inventory";


    await this._updateCharacterData({
      inventory
    });
  }


  /* ========================================================= */
  /* INVENTAR - ITEM HINZUFÜGEN                                */
  /* ========================================================= */

  async _addInventoryItem() {

    const inventory =
      this._getInventory();


    inventory.push({

      id:
        foundry.utils.randomID(),

      name:
        "Neuer Gegenstand",

      quantity:
        1,

      description:
        "",

      img:
        "icons/svg/item-bag.svg"
    });


    await this._saveInventory(
      inventory
    );
  }


  /* ========================================================= */
  /* INVENTAR - ITEM ÄNDERN                                    */
  /* ========================================================= */

  async _updateInventoryItem(
    itemId,
    changes
  ) {

    const inventory =
      this._getInventory();


    const item =
      inventory.find(
        item =>
          item.id === itemId
      );


    if (!item) {
      return;
    }


    Object.assign(
      item,
      changes
    );


    await this._saveInventory(
      inventory
    );
  }


  /* ========================================================= */
  /* INVENTAR - MENGE ÄNDERN                                   */
  /* ========================================================= */

  async _changeInventoryQuantity(
    itemId,
    amount
  ) {

    const inventory =
      this._getInventory();


    const item =
      inventory.find(
        item =>
          item.id === itemId
      );


    if (!item) {
      return;
    }


    item.quantity =
      Math.max(
        0,
        Number(
          item.quantity ?? 0
        ) +
        Number(
          amount ?? 0
        )
      );


    await this._saveInventory(
      inventory
    );
  }


  /* ========================================================= */
  /* INVENTAR - ITEM LÖSCHEN                                   */
  /* ========================================================= */

  async _deleteInventoryItem(
    itemId
  ) {

    const inventory =
      this
        ._getInventory()
        .filter(
          item =>
            item.id !== itemId
        );


    await this._saveInventory(
      inventory
    );
  }


  /* ========================================================= */
  /* INVENTAR - ITEM IN CHAT                                   */
  /* ========================================================= */

  async _postInventoryItemToChat(
    itemId
  ) {

    const inventory =
      this._getInventory();


    const item =
      inventory.find(
        item =>
          item.id === itemId
      );


    if (!item) {
      return;
    }


    /*
     * Sicherheit:
     * Vom Spieler eingegebene Texte werden
     * als Text behandelt und nicht als HTML.
     */
    const safeName =
      foundry.utils.escapeHTML(
        item.name ||
        "Gegenstand"
      );


    const safeDescription =
      foundry.utils
        .escapeHTML(
          item.description ||
          ""
        )
        .replace(
          /\n/g,
          "<br>"
        );


    const quantity =
      Math.max(
        0,
        Number(
          item.quantity ?? 0
        )
      );


    const image =
      foundry.utils.escapeHTML(
        item.img ||
        "icons/svg/item-bag.svg"
      );


    await ChatMessage.create({

      speaker:
        ChatMessage.getSpeaker({
          actor:
            this.actor
        }),

      content: `
        <div class="farbmeister-chat-item">

          <div style="
            display:flex;
            align-items:center;
            gap:10px;
          ">

            <img
              src="${image}"
              alt="${safeName}"
              style="
                width:44px;
                height:44px;
                object-fit:cover;
                border:0;
              "
            >

            <strong style="font-size:1.15em;">
              ${safeName}
            </strong>

          </div>

          ${
            safeDescription
              ? `
                <p>
                  ${safeDescription}
                </p>
              `
              : ""
          }

          <p>
            <strong>Menge:</strong>
            ${quantity}
          </p>

        </div>
      `
    });
  }


  /* ========================================================= */
  /* INVENTAR - BILD AUSWÄHLEN                                 */
  /* ========================================================= */

  async _pickInventoryImage(
    itemId
  ) {

    const inventory =
      this._getInventory();


    const item =
      inventory.find(
        item =>
          item.id === itemId
      );


    if (!item) {
      return;
    }


    const FilePicker =
      foundry.applications.apps.FilePicker;


    const picker =
      new FilePicker({

        type:
          "image",

        current:
          item.img ??
          "icons/svg/item-bag.svg",

        callback:
          async path => {

            await this._updateInventoryItem(
              itemId,
              {
                img: path
              }
            );
          }
      });


    await picker.render({
      force: true
    });
  }


  /* ========================================================= */
  /* CHARACTER DATEN SPEICHERN                                 */
  /* ========================================================= */

  async _updateCharacterData(
    changes
  ) {

    const current =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    /*
     * Immer den kompletten aktuellen Datensatz
     * wieder zusammensetzen.
     *
     * Dadurch verschwinden beim Ändern von HP,
     * Mana usw. weder Fähigkeiten noch Inventar.
     */
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

      abilities: {

        attack:
          current.abilities?.attack ??
          FARBMISTER_DEFAULTS.abilities.attack,

        defense:
          current.abilities?.defense ??
          FARBMISTER_DEFAULTS.abilities.defense,

        support:
          current.abilities?.support ??
          FARBMISTER_DEFAULTS.abilities.support
      },

      inventory:
        Array.isArray(
          current.inventory
        )
          ? current.inventory
          : [],

      /*
       * Neue Änderungen zuletzt.
       * Sie überschreiben damit gezielt
       * den jeweiligen alten Wert.
       */
      ...changes
    };


    await this.actor.setFlag(
      "farbmeister-sheet",
      "character",
      updated
    );


    /*
     * Sheet neu zeichnen.
     */
    this.render();
  }

}