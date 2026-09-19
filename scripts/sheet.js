import {
  FARBMISTER_COLORS,
  FARBMISTER_DEFAULTS
} from "./config.js";

import { FARBMEISTER_ITEM_TYPE } from "./main.js";

const { HandlebarsApplicationMixin, DialogV2 } =
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


    const savedData =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    const savedAbilities =
      savedData.abilities ?? {};


    /*
     * Vorhandenes Inventar normalisieren.
     *
     * Alte Testgegenstände aus der vorherigen
     * Inventarversion werden automatisch auf
     * die ersten freien Slots verteilt.
     */
    const inventory =
      this._normalizeInventory(
        savedData.inventory
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
      }
    };


    const selectedColor =
      FARBMISTER_COLORS[character.color] ??
      FARBMISTER_COLORS.red;


    const colors =
      Object.entries(
        FARBMISTER_COLORS
      ).map(
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
     * Inventar-Slots.
     *
     * Hosentasche = 2
     * Rucksack     = 3
     */
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
  /* KREISE                                                    */
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
  /* INVENTAR NORMALISIEREN                                    */
  /* ========================================================= */

  _normalizeInventory(rawInventory) {

    if (
      !Array.isArray(rawInventory)
    ) {
      return [];
    }


    const validSlots = [

      {
        container: "pocket",
        slot: 0
      },

      {
        container: "pocket",
        slot: 1
      },

      {
        container: "backpack",
        slot: 0
      },

      {
        container: "backpack",
        slot: 1
      },

      {
        container: "backpack",
        slot: 2
      }
    ];


    const used =
      new Set();


    const result =
      [];


    for (
      let index = 0;
      index < rawInventory.length;
      index++
    ) {

      const oldItem =
        rawInventory[index];


      /*
       * Es gibt insgesamt maximal fünf Slots.
       */
      if (
        result.length >= 5
      ) {
        break;
      }


      let container =
        oldItem.container;


      let slot =
        Number(
          oldItem.slot
        );


      let slotKey =
        `${container}:${slot}`;


      const validExistingPosition =
        validSlots.some(
          position =>
            position.container === container &&
            position.slot === slot
        ) &&
        !used.has(slotKey);


      /*
       * Alte Items ohne Position werden
       * automatisch in den nächsten freien
       * Slot gelegt.
       */
      if (
        !validExistingPosition
      ) {

        const freePosition =
          validSlots.find(
            position =>
              !used.has(
                `${position.container}:${position.slot}`
              )
          );


        if (!freePosition) {
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

        name:
          oldItem.name ??
          "Gegenstand",

        quantity:
          Math.max(
            1,
            Number(
              oldItem.quantity ?? 1
            )
          ),

        description:
          oldItem.description ??
          "",

        img:
          oldItem.img ??
          "icons/svg/item-bag.svg"
      });
    }


    return result;
  }


  /* ========================================================= */
  /* SLOT-DATEN                                                */
  /* ========================================================= */

  _createInventorySlots(
    container,
    count,
    inventory
  ) {

    return Array.from(
      {
        length: count
      },

      (_, slot) => {

        const item =
          inventory.find(
            entry =>
              entry.container === container &&
              entry.slot === slot
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


    const root =
      this.element;


    if (!root) {
      return;
    }


    this._activateTab(
      this._activeTab
    );


    /* ======================================================= */
    /* CLICK EVENTS                                            */
    /* ======================================================= */

    root.addEventListener(
      "click",
      async event => {

        const target =
          event.target.closest(
            "[data-action]"
          );


        if (
          !target ||
          !root.contains(target)
        ) {
          return;
        }


        const action =
          target.dataset.action;


        switch (action) {


          /* ------------------------------------------------- */
          /* TABS                                              */
          /* ------------------------------------------------- */

          case "switch-tab": {

            const tab =
              target.dataset.tab;

            this._activateTab(
              tab
            );

            break;
          }


          /* ------------------------------------------------- */
          /* MANA                                              */
          /* ------------------------------------------------- */

          case "set-mana": {

            const mana =
              Number(
                target.dataset.value
              );


            await this._updateCharacterData({
              mana
            });

            break;
          }


          /* ------------------------------------------------- */
          /* FÄHIGKEITSKREISE                                  */
          /* ------------------------------------------------- */

          case "set-ability": {

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

            break;
          }


          /* ------------------------------------------------- */
          /* WÜRFELN                                          */
          /* ------------------------------------------------- */

          case "roll-ability": {

            const ability =
              target.dataset.ability;


            await this._rollAbility(
              ability
            );

            break;
          }


          /* ------------------------------------------------- */
          /* LEERER INVENTARSLOT                               */
          /* ------------------------------------------------- */

          case "add-slot-item": {

            const container =
              target.dataset.container;


            const slot =
              Number(
                target.dataset.slot
              );


            await this._openInventoryItemDialog({
              container,
              slot
            });

            break;
          }


          /* ------------------------------------------------- */
          /* BELEGTEN SLOT BEARBEITEN                          */
          /* ------------------------------------------------- */

          case "edit-slot-item": {

            const itemId =
              target.dataset.itemId;


            await this._openInventoryItemDialog({
              itemId
            });

            break;
          }


          /* ------------------------------------------------- */
          /* ITEM IN CHAT                                      */
          /* ------------------------------------------------- */

          case "post-inventory-item": {

            event.stopPropagation();


            const itemId =
              target.dataset.itemId;


            await this._postInventoryItemToChat(
              itemId
            );

            break;
          }


          /* ------------------------------------------------- */
          /* ITEM LÖSCHEN                                      */
          /* ------------------------------------------------- */

          case "delete-inventory-item": {

            event.stopPropagation();


            const itemId =
              target.dataset.itemId;


            await this._confirmDeleteInventoryItem(
              itemId
            );

            break;
          }
        }
      }
    );


    /* ======================================================= */
    /* CHANGE EVENTS                                           */
    /* ======================================================= */

    root.addEventListener(
      "change",
      async event => {

        const target =
          event.target;


        const action =
          target.dataset.action;


        switch (action) {


          case "change-name": {

            const name =
              target.value.trim();


            if (!name) {
              return;
            }


            await this.actor.update({
              name
            });

            break;
          }


          case "change-color": {

            await this._updateCharacterData({
              color:
                target.value
            });

            break;
          }


          case "change-hp": {

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

            break;
          }
        }
      }
    );


    /* ======================================================= */
    /* RECHTSKLICK AUF KREISE                                  */
    /* ======================================================= */

    root.addEventListener(
      "contextmenu",
      async event => {

        const target =
          event.target.closest(
            "[data-action]"
          );


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
      }
    );

     /* ======================================================= */
    /* Drag & Drop                                 */
    /* ======================================================= */

    const panel =
    root.querySelector(".inventory-panel");


    panel?.addEventListener(
      "dragover",
      event => event.preventDefault()
    );


    panel?.addEventListener(
      "drop",
      async event => {

        event.preventDefault();


        const TextEditor =
          foundry.applications.ux.TextEditor.implementation;


        const data =
          TextEditor.getDragEventData(event);


        if (data?.type !== "Item") return;


        const item =
          await Item.implementation.fromDropData(data);


        if (!item) return;
        if (item.parent === this.actor) return;


        const slotElement =
          event.target.closest("[data-slot]");


        const payload = item.toObject();


        payload.type = FARBMEISTER_ITEM_TYPE;

        payload.system = {
          ...payload.system,
          container:
            slotElement?.dataset.container ?? null,
          slot:
            slotElement
              ? Number(slotElement.dataset.slot)
              : null
        };


        await this.actor.createEmbeddedDocuments(
          "Item",
          [payload]
        );
      }
    );
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
  /* INVENTAR AUSLESEN                                        */
  /* ========================================================= */

  _getInventory() {

  return this.actor.items
    .filter(
      item =>
        item.type === FARBMEISTER_ITEM_TYPE
    )
    .map(item => ({
      id: item.id,
      name: item.name,
      img: item.img,
      description: item.system.description ?? "",
      quantity: item.system.quantity ?? 1,
      container: item.system.container ?? null,
      slot: item.system.slot ?? null
    }));
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
  /* SLOT PRÜFEN                                               */
  /* ========================================================= */

  _isValidSlot(
    container,
    slot
  ) {

    slot =
      Number(slot);


    if (
      container === "pocket"
    ) {

      return (
        slot === 0 ||
        slot === 1
      );
    }


    if (
      container === "backpack"
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
  /* SLOT-NAME                                                 */
  /* ========================================================= */

  _getSlotLabel(
    container,
    slot
  ) {

    const number =
      Number(slot) + 1;


    if (
      container === "pocket"
    ) {

      return `Hosentasche – Slot ${number}`;
    }


    return `Rucksack – Slot ${number}`;
  }


  /* ========================================================= */
  /* ITEM-DIALOG                                               */
  /* ========================================================= */

async _openInventoryItemDialog({
  itemId = null,
  container = null,
  slot = null
} = {}) {

  /*
   * Bestehenden Gegenstand öffnen.
   */
  if (itemId) {

    const item =
      this.actor.items.get(itemId);

    item?.sheet.render(true);

    return;
  }


  /*
   * Neuen Gegenstand im Slot anlegen.
   */
  if (!this._isValidSlot(container, slot)) {

    ui.notifications.warn(
      "Ungültiger Inventarslot."
    );

    return;
  }


  const occupied =
    this._getInventory().some(
      item =>
        item.container === container &&
        item.slot === Number(slot)
    );


  if (occupied) {

    ui.notifications.warn(
      "Dieser Inventarslot ist bereits belegt."
    );

    return;
  }


  const [created] =
    await this.actor.createEmbeddedDocuments(
      "Item",
      [{
        name: "Neuer Gegenstand",
        type: FARBMEISTER_ITEM_TYPE,
        img: "icons/svg/item-bag.svg",
        system: {
          container,
          slot: Number(slot)
        }
      }]
    );


  created?.sheet.render(true);
}

  /* ========================================================= */
  /* ITEM LÖSCHEN                                              */
  /* ========================================================= */

  async _confirmDeleteInventoryItem(itemId) {

  const item =
    this.actor.items.get(itemId);

  await item?.deleteDialog();
}


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
  /* ITEM IN CHAT                                              */
  /* ========================================================= */

  async _postInventoryItemToChat(
    itemId
  ) {
    const item = this.actor.items.get(itemId);
    if (!item) return;
  }


  /* ========================================================= */
  /* CHARACTER-DATEN SPEICHERN                                 */
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
        this._normalizeInventory(
          current.inventory
        ),

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