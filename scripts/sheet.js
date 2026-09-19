import {
  FARBMEISTER_COLORS,
  FARBMISTER_DEFAULTS
} from "./config.js";

import { FARBMEISTER_ITEM_TYPE } from "./main.js";

const { HandlebarsApplicationMixin } =
  foundry.applications.api;

const { ActorSheetV2 } =
  foundry.applications.sheets;


/**
 * Farbmeister Character Sheet
 * Foundry VTT v13
 */
export class FarbmeisterActorSheet
  extends HandlebarsApplicationMixin(ActorSheetV2) {

  _activeTab = "character";


  /* ========================================================= */
  /* OPTIONS                                                   */
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
    },

    actions: {

      "switch-tab":
        this._actionSwitchTab,

      "set-mana":
        this._actionSetMana,

      "set-ability":
        this._actionSetAbility,

      "roll-ability":
        this._actionRollAbility,

      "open-inventory-item":
        this._actionOpenInventoryItem,

      "quantity-minus":
        this._actionQuantityMinus,

      "quantity-plus":
        this._actionQuantityPlus,

      "post-inventory-item":
        this._actionPostInventoryItem,

      "remove-inventory-item":
        this._actionRemoveInventoryItem
    },

    form: {
      closeOnSubmit: false,
      submitOnChange: true,
      handler: this._handleForm
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
    },

    notes: {
      template:
        "modules/farbmeister-sheet/templates/notes.hbs"
    }
  };


  /* ========================================================= */
  /* CONTEXT                                                   */
  /* ========================================================= */

  async _prepareContext(options) {

    const context =
      await super._prepareContext(options);


    const savedData =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    const savedAbilities =
      savedData.abilities ?? {};


    const inventory =
      this._normalizeInventory(
        savedData.inventory
      );


    /*
     * Originale Foundry-Items auflösen.
     */
    await Promise.all(

      inventory.map(
        async entry => {

          entry.sourceAvailable =
            false;


          if (!entry.itemUuid) {
            return;
          }


          try {

            const item =
              await fromUuid(
                entry.itemUuid
              );


            if (
              item &&
              item.documentName === "Item"
            ) {

              entry.name =
                item.name ??
                entry.name;

              entry.img =
                item.img ??
                entry.img;

              entry.sourceAvailable =
                true;
            }

          }
          catch (error) {

            console.warn(
              "Farbmeister Sheet | Item konnte nicht geladen werden:",
              entry.itemUuid,
              error
            );
          }
        }
      )
    );


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
      },

      /*
       * NEU:
       * Zwei voneinander getrennte Notizfelder.
       */
      inventoryNotes:
        savedData.inventoryNotes ??
        "",

      notes:
        savedData.notes ??
        ""
    };


    const selectedColor =
      FARBMEISTER_COLORS[
        character.color
      ] ??
      FARBMEISTER_COLORS.red;


    const colors =
      Object.entries(
        FARBMEISTER_COLORS
      ).map(
        ([key, color]) => ({

          key,

          label:
            color.label,

          icon:
            color.icon,
          
          emoji:
            color.emoji,

          selected:
            key === character.color
        })
      );


    const manaCircles =
      this._createCircles(
        7,
        character.mana
      );


    const abilities =
      Object.entries(
        selectedColor.abilities
      ).map(
        ([key, ability]) => {

          const value =
            character.abilities[key] ??
            0;


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


    const pocketSlots =
      this._createInventorySlots(
        "pocket",
        2,
        inventory
      );


    const backpackSlots =
      this._createInventorySlots(
        "backpack",
        3,
        inventory
      );


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

    context.pocketSlots =
      pocketSlots;

    context.backpackSlots =
      backpackSlots;

    context.pocketCount =
      inventory.filter(
        item =>
          item.container === "pocket"
      ).length;

    context.backpackCount =
      inventory.filter(
        item =>
          item.container === "backpack"
      ).length;


    return context;
  }


  /* ========================================================= */
  /* RENDER                                                    */
  /* ========================================================= */

  async _onRender(
    context,
    options
  ) {

    await super._onRender(
      context,
      options
    );


    this._activateTab(
      this._activeTab
    );


    const root =
      this.element;


    if (!root) {
      return;
    }


    /*
     * Rechtsklick auf Mana/Fähigkeitskreise.
     */
    root.oncontextmenu =
      async event => {

        const target =
          event.target instanceof Element
            ? event.target.closest(
                "[data-action]"
              )
            : null;


        if (!target) {
          return;
        }


        const action =
          target.dataset.action;


        if (
          action === "set-mana"
        ) {

          event.preventDefault();


          const value =
            Number(
              target.dataset.value
            );


          await this._updateCharacterData({

            mana:
              Math.max(
                0,
                value - 1
              )
          });


          return;
        }


        if (
          action === "set-ability"
        ) {

          event.preventDefault();


          const ability =
            target.dataset.ability;


          const value =
            Number(
              target.dataset.value
            );


          await this._setAbility(
            ability,
            Math.max(
              0,
              value - 1
            )
          );
        }
      };
  }


  /* ========================================================= */
  /* FORMULAR                                                  */
  /* ========================================================= */

  static async _handleForm(
    event,
    form,
    formData
  ) {

    const target =
      event.target;


    /*
     * ACTOR NAME
     */
    if (
      target?.name ===
      "actorName"
    ) {

      const name =
        String(
          target.value ?? ""
        ).trim();


      if (name) {

        await this.actor.update({
          name
        });
      }


      return;
    }


    /*
     * FARBE
     */
    if (
      target?.name ===
      "color"
    ) {

      await this._updateCharacterData({

        color:
          target.value
      });


      return;
    }


    /*
     * LEBEN
     */
    if (
      target?.name ===
      "hp"
    ) {

      let hp =
        Number(
          target.value
        );


      if (
        Number.isNaN(hp)
      ) {

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


      return;
    }


    /*
     * INVENTARNOTIZEN
     */
    if (
      target?.name ===
      "inventoryNotes"
    ) {

      await this._updateCharacterData({

        inventoryNotes:
          target.value
      });


      return;
    }


    /*
     * ALLGEMEINE NOTIZEN
     */
    if (
      target?.name ===
      "notes"
    ) {

      await this._updateCharacterData({

        notes:
          target.value
      });


      return;
    }
  }


  /* ========================================================= */
  /* APPLICATION ACTIONS                                      */
  /* ========================================================= */

  static _actionSwitchTab(
    event,
    target
  ) {

    this._activateTab(
      target.dataset.tab
    );
  }


  static async _actionSetMana(
    event,
    target
  ) {

    const mana =
      Number(
        target.dataset.value
      );


    await this._updateCharacterData({
      mana
    });
  }


  static async _actionSetAbility(
    event,
    target
  ) {

    const ability =
      target.dataset.ability;


    const value =
      Number(
        target.dataset.value
      );


    await this._setAbility(
      ability,
      value
    );
  }


  static async _actionRollAbility(
    event,
    target
  ) {

    await this._rollAbility(
      target.dataset.ability
    );
  }


  static async _actionOpenInventoryItem(
    event,
    target
  ) {

    await this._openInventoryItem(
      target.dataset.itemId
    );
  }


  static async _actionQuantityMinus(
    event,
    target
  ) {

    event.stopPropagation();


    await this._changeInventoryQuantity(
      target.dataset.itemId,
      -1
    );
  }


  static async _actionQuantityPlus(
    event,
    target
  ) {

    event.stopPropagation();


    await this._changeInventoryQuantity(
      target.dataset.itemId,
      1
    );
  }


  static async _actionPostInventoryItem(
    event,
    target
  ) {

    event.stopPropagation();


    await this._postInventoryItemToChat(
      target.dataset.itemId
    );
  }


  static async _actionRemoveInventoryItem(
    event,
    target
  ) {

    event.stopPropagation();


    await this._removeInventoryItem(
      target.dataset.itemId
    );
  }


  /* ========================================================= */
  /* TABS                                                      */
  /* ========================================================= */

  _activateTab(tab) {

    if (
      ![
        "character",
        "inventory",
        "notes"
      ].includes(tab)
    ) {

      tab =
        "character";
    }


    this._activeTab =
      tab;


    const root =
      this.element;


    if (!root) {
      return;
    }


    root
      .querySelectorAll(
        "[data-tab-content]"
      )
      .forEach(
        element => {

          element.classList.toggle(
            "active",
            element.dataset.tabContent === tab
          );
        }
      );


    root
      .querySelectorAll(
        "[data-action='switch-tab']"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "active",
            button.dataset.tab === tab
          );
        }
      );
  }


  /* ========================================================= */
  /* KREISE                                                    */
  /* ========================================================= */

  _createCircles(
    max,
    current
  ) {

    return Array.from(

      {
        length:
          max
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
  /* FÄHIGKEIT SETZEN                                         */
  /* ========================================================= */

  async _setAbility(
    ability,
    value
  ) {

    if (
      ![
        "attack",
        "defense",
        "support"
      ].includes(ability)
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
        current.abilities
          ?.attack ?? 0,

      defense:
        current.abilities
          ?.defense ?? 0,

      support:
        current.abilities
          ?.support ?? 0
    };


    abilities[ability] =
      value;


    await this._updateCharacterData({
      abilities
    });
  }


  /* ========================================================= */
  /* FÄHIGKEIT WÜRFELN                                        */
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
      FARBMEISTER_COLORS[
        colorKey
      ] ??
      FARBMEISTER_COLORS.red;


    const ability =
      color.abilities?.[
        abilityKey
      ];


    if (!ability) {
      return;
    }


    const bonus =
      Number(
        character.abilities
          ?.[abilityKey] ??
        0
      );


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
  /* INVENTAR NORMALISIEREN                                    */
  /* ========================================================= */

  _normalizeInventory(
    rawInventory
  ) {

    if (
      !Array.isArray(
        rawInventory
      )
    ) {

      return [];
    }


    const validSlots = [

      {
        container:
          "pocket",

        slot:
          0
      },

      {
        container:
          "pocket",

        slot:
          1
      },

      {
        container:
          "backpack",

        slot:
          0
      },

      {
        container:
          "backpack",

        slot:
          1
      },

      {
        container:
          "backpack",

        slot:
          2
      }
    ];


    const used =
      new Set();


    const result =
      [];


    for (
      let index = 0;
      index <
      rawInventory.length;
      index++
    ) {

      if (
        result.length >= 5
      ) {

        break;
      }


      const oldItem =
        rawInventory[index] ??
        {};


      let container =
        oldItem.container;


      let slot =
        Number(
          oldItem.slot
        );


      let slotKey =
        `${container}:${slot}`;


      const positionIsValid =
        validSlots.some(
          position =>
            position.container ===
              container &&
            position.slot ===
              slot
        ) &&
        !used.has(
          slotKey
        );


      if (
        !positionIsValid
      ) {

        const freePosition =
          validSlots.find(
            position =>
              !used.has(
                `${position.container}:${position.slot}`
              )
          );


        if (
          !freePosition
        ) {

          break;
        }


        container =
          freePosition.container;

        slot =
          freePosition.slot;

        slotKey =
          `${container}:${slot}`;
      }


      used.add(
        slotKey
      );


      result.push({

        id:
          oldItem.id ??
          `legacy-${index}`,

        container,

        slot,

        itemUuid:
          typeof oldItem.itemUuid ===
          "string"
            ? oldItem.itemUuid
            : null,

        name:
          oldItem.name ??
          "Gegenstand",

        img:
          oldItem.img ??
          "icons/svg/item-bag.svg",

        quantity:
          Math.max(
            1,
            Number(
              oldItem.quantity ??
              1
            ) || 1
          ),

        sourceAvailable:
          false
      });
    }


    return result;
  }


  /* ========================================================= */
  /* INVENTAR-SLOTS                                           */
  /* ========================================================= */

  _createInventorySlots(
    container,
    count,
    inventory
  ) {

    return Array.from(

      {
        length:
          count
      },

      (_, slot) => {

        const item =
          inventory.find(
            entry =>
              entry.container ===
                container &&
              entry.slot ===
                slot
          );


        return {

          container,

          slot,

          slotNumber:
            slot + 1,

          occupied:
            Boolean(item),

          item:
            item ?? null
        };
      }
    );
  }


  /* ========================================================= */
  /* INVENTAR AUSLESEN                                        */
  /* ========================================================= */

  _getInventory() {

    const character =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    return this
      ._normalizeInventory(
        character.inventory
      )
      .map(
        item => ({
          ...item
        })
      );
  }


  /* ========================================================= */
  /* INVENTAR SPEICHERN                                       */
  /* ========================================================= */

  async _saveInventory(
    inventory
  ) {

    this._activeTab =
      "inventory";


    await this._updateCharacterData({

      inventory:
        this._normalizeInventory(
          inventory
        )
    });
  }


  /* ========================================================= */
  /* DRAG & DROP                                               */
  /* ========================================================= */

  async _onDropItem(
    event,
    item
  ) {

    const target =
      event.target instanceof Element
        ? event.target.closest(
            "[data-inventory-slot]"
          )
        : null;


    if (!target) {

      ui.notifications.info(
        "Ziehe das Item direkt auf einen Inventarslot."
      );

      return null;
    }


    const container =
      target.dataset.container;


    const slot =
      Number(
        target.dataset.slot
      );


    if (
      !this._isValidInventorySlot(
        container,
        slot
      )
    ) {

      ui.notifications.warn(
        "Dieser Inventarslot ist ungültig."
      );

      return null;
    }


    if (
      !item ||
      item.documentName !== "Item"
    ) {

      ui.notifications.warn(
        "Hier können nur Foundry-Items abgelegt werden."
      );

      return null;
    }


    const itemUuid =
      item.uuid;


    if (!itemUuid) {

      ui.notifications.warn(
        "Dieses Item besitzt keine gültige UUID."
      );

      return null;
    }


    const inventory =
      this._getInventory();


    const existingItem =
      inventory.find(
        entry =>
          entry.container ===
            container &&
          entry.slot ===
            slot
      );


    /*
     * Dasselbe Item auf denselben Slot:
     * Menge +1
     */
    if (
      existingItem &&
      existingItem.itemUuid ===
        itemUuid
    ) {

      existingItem.quantity =
        Math.max(
          1,
          Number(
            existingItem.quantity ??
            1
          )
        ) + 1;


      await this._saveInventory(
        inventory
      );


      return item;
    }


    if (
      existingItem
    ) {

      ui.notifications.warn(
        "Dieser Inventarslot ist bereits belegt."
      );

      return null;
    }


    inventory.push({

      id:
        foundry.utils.randomID(),

      container,

      slot,

      itemUuid,

      name:
        item.name ??
        "Gegenstand",

      img:
        item.img ??
        "icons/svg/item-bag.svg",

      quantity:
        1
    });


    await this._saveInventory(
      inventory
    );


    return item;
  }


  /* ========================================================= */
  /* SLOT PRÜFEN                                               */
  /* ========================================================= */

  _isValidInventorySlot(
    container,
    slot
  ) {

    if (
      container ===
      "pocket"
    ) {

      return (
        slot === 0 ||
        slot === 1
      );
    }


    if (
      container ===
      "backpack"
    ) {

      return (
        slot === 0 ||
        slot === 1 ||
        slot === 2
      );
    }


    return false;
  }


  /* ========================================================= */
  /* INVENTAREINTRAG FINDEN                                   */
  /* ========================================================= */

  _findInventoryEntry(
    itemId
  ) {

    return this
      ._getInventory()
      .find(
        item =>
          item.id === itemId
      ) ??
      null;
  }


  /* ========================================================= */
  /* ITEM AUFLÖSEN                                             */
  /* ========================================================= */

  async _resolveInventoryItem(
    entry
  ) {

    if (
      !entry?.itemUuid
    ) {

      return null;
    }


    try {

      const document =
        await fromUuid(
          entry.itemUuid
        );


      if (
        document?.documentName ===
        "Item"
      ) {

        return document;
      }

    }
    catch (error) {

      console.warn(
        "Farbmeister Sheet | Item-UUID konnte nicht aufgelöst werden:",
        entry.itemUuid,
        error
      );
    }


    return null;
  }


  /* ========================================================= */
  /* ITEM ÖFFNEN                                               */
  /* ========================================================= */

  async _openInventoryItem(
    itemId
  ) {

    const entry =
      this._findInventoryEntry(
        itemId
      );


    if (!entry) {
      return;
    }


    const item =
      await this._resolveInventoryItem(
        entry
      );


    if (!item) {

      ui.notifications.warn(
        "Das ursprüngliche Foundry-Item existiert nicht mehr."
      );

      return;
    }


    item.sheet.render({
      force: true
    });
  }


  /* ========================================================= */
  /* MENGE ÄNDERN                                              */
  /* ========================================================= */

  async _changeInventoryQuantity(
    itemId,
    amount
  ) {

    const inventory =
      this._getInventory();


    const entry =
      inventory.find(
        item =>
          item.id === itemId
      );


    if (!entry) {
      return;
    }


    entry.quantity =
      Math.max(
        1,
        Number(
          entry.quantity ??
          1
        ) +
        Number(
          amount ??
          0
        )
      );


    await this._saveInventory(
      inventory
    );
  }


  /* ========================================================= */
  /* ITEM ENTFERNEN                                           */
  /* ========================================================= */

  async _removeInventoryItem(
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
  /* ITEM IN CHAT                                             */
  /* ========================================================= */

  async _postInventoryItemToChat(
    itemId
  ) {

    const entry =
      this._findInventoryEntry(
        itemId
      );


    if (!entry) {
      return;
    }


    const sourceItem =
      await this._resolveInventoryItem(
        entry
      );


    const name =
      sourceItem?.name ??
      entry.name ??
      "Gegenstand";


    const image =
      sourceItem?.img ??
      entry.img ??
      "icons/svg/item-bag.svg";


    const safeName =
      foundry.utils.escapeHTML(
        name
      );


    const safeImage =
      foundry.utils.escapeHTML(
        image
      );


    const quantity =
      Math.max(
        1,
        Number(
          entry.quantity ??
          1
        )
      );


    await ChatMessage.create({

      speaker:
        ChatMessage.getSpeaker({
          actor:
            this.actor
        }),

      content: `
        <div class="farbmeister-chat-item">

          <div
            style="
              display:flex;
              align-items:center;
              gap:10px;
            "
          >

            <img
              src="${safeImage}"
              alt="${safeName}"
              style="
                width:48px;
                height:48px;
                object-fit:cover;
                border:0;
              "
            >

            <div>

              <strong>
                ${safeName}
              </strong>

              <div>
                Menge: ${quantity}
              </div>

            </div>

          </div>

        </div>
      `
    });
  }


  /* ========================================================= */
  /* CHARACTER-DATEN SPEICHERN                                */
  /* ========================================================= */

  async _updateCharacterData(
    changes
  ) {

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

      abilities: {

        attack:
          current.abilities
            ?.attack ??
          FARBMISTER_DEFAULTS
            .abilities
            .attack,

        defense:
          current.abilities
            ?.defense ??
          FARBMISTER_DEFAULTS
            .abilities
            .defense,

        support:
          current.abilities
            ?.support ??
          FARBMISTER_DEFAULTS
            .abilities
            .support
      },

      inventory:
        this._normalizeInventory(
          current.inventory
        ),

      inventoryNotes:
        current.inventoryNotes ??
        "",

      notes:
        current.notes ??
        "",

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