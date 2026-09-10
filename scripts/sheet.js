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
      width: 1000,
      height: 760
    },

    window: {
      resizable: true
    }
  };


  static PARTS = {
    main: {
      template:
        "modules/farbmeister-sheet/templates/character-sheet.hbs"
    }
  };


  async _prepareContext(options) {

    const context = await super._prepareContext(options);

    const savedData =
      this.actor.getFlag(
        "farbmeister-sheet",
        "character"
      ) ?? {};


    const savedAbilities =
      savedData.abilities ?? {};


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
      Object.entries(FARBMISTER_COLORS).map(
        ([key, color]) => ({
          key,
          label: color.label,
          icon: color.icon,
          selected: key === character.color
        })
      );


    const manaCircles =
      this._createCircles(
        7,
        character.mana
      );


    /*
     * Die drei Fähigkeiten für das Template vorbereiten.
     */
    const abilities =
      Object.entries(
        selectedColor.abilities
      ).map(([key, ability]) => {

        const value =
          character.abilities[key] ?? 0;

        return {
          key,
          label: ability.label,
          name: ability.name,
          description: ability.description,
          value,
          circles:
            this._createCircles(
              5,
              value
            )
        };
      });


    context.actor = this.actor;
    context.actorName = this.actor.name;

    context.character = character;

    context.colors = colors;
    context.selectedColor = selectedColor;

    context.manaCircles = manaCircles;
    context.abilities = abilities;

    return context;
  }


  _createCircles(max, current) {

    return Array.from(
      { length: max },
      (_, index) => ({
        value: index + 1,
        filled: index < current
      })
    );
  }


  _onRender(context, options) {

    super._onRender(context, options);

    const root = this.element;

    if (!root) return;


    /*
     * NAME
     */
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


    /*
     * FARBE
     */
    root
      .querySelector(
        "[data-action='change-color']"
      )
      ?.addEventListener(
        "change",
        async event => {

          await this._updateCharacterData({
            color:
              event.currentTarget.value
          });
        }
      );


    /*
     * LEBEN
     */
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

          hp =
            Math.max(
              0,
              Math.min(25, hp)
            );

          await this._updateCharacterData({
            hp
          });
        }
      );


    /*
     * FARBTROPFEN
     */
    root
      .querySelectorAll(
        "[data-action='set-mana']"
      )
      .forEach(circle => {

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


    /*
     * FÄHIGKEITSKREISE
     */
    root
      .querySelectorAll(
        "[data-action='set-ability']"
      )
      .forEach(circle => {

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


    /*
     * FÄHIGKEIT WÜRFELN
     */
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

  }


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
        Math.min(5, value)
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


    abilities[ability] = value;


    await this._updateCharacterData({
      abilities
    });
  }


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
      color.abilities[abilityKey];


    if (!ability) return;


    const bonus =
      character.abilities?.[abilityKey]
      ?? 0;


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
          actor: this.actor
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
          0,

        defense:
          current.abilities?.defense ??
          0,

        support:
          current.abilities?.support ??
          0
      },

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