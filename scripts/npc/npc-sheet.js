const {
  HandlebarsApplicationMixin
} = foundry.applications.api;

const {
  ActorSheetV2
} = foundry.applications.sheets;


/**
 * Farbmeister NPC Sheet
 * Foundry VTT v13
 *
 * Vollständig getrennt vom normalen
 * Farbmeister Character Sheet.
 */
export class FarbmeisterNPCSheet
  extends HandlebarsApplicationMixin(ActorSheetV2) {


  /* ========================================================= */
  /* OPTIONEN                                                  */
  /* ========================================================= */

  static DEFAULT_OPTIONS = {

    classes: [
      "farbmeister-npc",
      "farbmeister-npc-sheet"
    ],

    tag:
      "form",

    position: {
      width: 850,
      height: 620
    },

    window: {
      resizable: true
    },


    /*
     * ApplicationV2 Actions.
     *
     * Dadurch sammeln wir beim Neurendern
     * keine mehrfachen Event Listener.
     */
    actions: {

      "set-ability":
        this._actionSetAbility,

      "roll-ability":
        this._actionRollAbility,

      "change-portrait":
        this._actionChangePortrait,

      "change-symbol":
        this._actionChangeSymbol
    },


    /*
     * Eingabefelder automatisch speichern,
     * sobald sie geändert/verlassen werden.
     */
    form: {

      closeOnSubmit:
        false,

      submitOnChange:
        true,

      handler:
        this._handleForm
    }
  };


  /* ========================================================= */
  /* TEMPLATE                                                  */
  /* ========================================================= */

  static PARTS = {

    main: {
      template:
        "modules/farbmeister-sheet/templates/npc/npc-sheet.hbs"
    }
  };


  /* ========================================================= */
  /* CONTEXT                                                   */
  /* ========================================================= */

  async _prepareContext(
    options
  ) {

    const context =
      await super._prepareContext(
        options
      );


    /*
     * Wichtig:
     *
     * NPC-Daten liegen unter:
     *
     * flags.farbmeister-sheet.npc
     *
     * und sind damit komplett von
     * flags.farbmeister-sheet.character
     * getrennt.
     */
    const saved =
      this.actor.getFlag(
        "farbmeister-sheet",
        "npc"
      ) ?? {};


    const savedAbilities =
      saved.abilities ?? {};


    const ability1 =
      savedAbilities.first ?? {};


    const ability2 =
      savedAbilities.second ?? {};


    const npc = {

      hp: {

        value:
          Number(
            saved.hp?.value ??
            10
          ),

        max:
          Number(
            saved.hp?.max ??
            10
          )
      },


      symbolImg:
        saved.symbolImg ??
        "icons/svg/mystery-man.svg",


      abilities: {

        first: {

          name:
            ability1.name ??
            "Fähigkeit 1",

          description:
            ability1.description ??
            "",

          value:
            Number(
              ability1.value ??
              0
            )
        },


        second: {

          name:
            ability2.name ??
            "Fähigkeit 2",

          description:
            ability2.description ??
            "",

          value:
            Number(
              ability2.value ??
              0
            )
        }
      }
    };


    /*
     * Fähigkeit 1 für das Template.
     */
    const firstAbility = {

      key:
        "first",

      ...npc.abilities.first,

      circles:
        this._createCircles(
          10,
          npc.abilities.first.value
        )
    };


    /*
     * Fähigkeit 2 für das Template.
     */
    const secondAbility = {

      key:
        "second",

      ...npc.abilities.second,

      circles:
        this._createCircles(
          10,
          npc.abilities.second.value
        )
    };


    context.actor =
      this.actor;

    context.actorName =
      this.actor.name;

    context.actorImg =
      this.actor.img;

    context.npc =
      npc;

    context.abilities = [
      firstAbility,
      secondAbility
    ];


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


    const root =
      this.element;


    if (!root) {
      return;
    }


    /*
     * Rechtsklick auf einen Kreis:
     *
     * setzt den Wert auf einen Punkt
     * unterhalb des angeklickten Kreises.
     *
     * Dadurch kann man auch wieder auf 0.
     */
    root.oncontextmenu =
      async event => {

        const target =
          event.target instanceof Element
            ? event.target.closest(
                "[data-action='set-ability']"
              )
            : null;


        if (!target) {
          return;
        }


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
      };
  }


  /* ========================================================= */
  /* FORMULAR SPEICHERN                                        */
  /* ========================================================= */

  static async _handleForm(
    event,
    form,
    formData
  ) {

    const target =
      event.target;


    if (!target?.name) {
      return;
    }


    /* ------------------------------------------------------- */
    /* NAME                                                    */
    /* ------------------------------------------------------- */

    if (
      target.name ===
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


    /* ------------------------------------------------------- */
    /* HP AKTUELL                                              */
    /* ------------------------------------------------------- */

    if (
      target.name ===
      "hpValue"
    ) {

      const current =
        this._getNPCData();


      let value =
        Number(
          target.value
        );


      if (
        Number.isNaN(value)
      ) {

        value = 0;
      }


      value =
        Math.max(
          0,
          value
        );


      await this._updateNPCData({

        hp: {
          ...current.hp,
          value
        }
      });


      return;
    }


    /* ------------------------------------------------------- */
    /* HP MAX                                                  */
    /* ------------------------------------------------------- */

    if (
      target.name ===
      "hpMax"
    ) {

      const current =
        this._getNPCData();


      let max =
        Number(
          target.value
        );


      if (
        Number.isNaN(max)
      ) {

        max = 1;
      }


      max =
        Math.max(
          1,
          max
        );


      await this._updateNPCData({

        hp: {
          ...current.hp,
          max
        }
      });


      return;
    }


    /* ------------------------------------------------------- */
    /* FÄHIGKEIT 1 NAME                                        */
    /* ------------------------------------------------------- */

    if (
      target.name ===
      "abilityFirstName"
    ) {

      await this._updateAbilityField(
        "first",
        "name",
        target.value
      );


      return;
    }


    /* ------------------------------------------------------- */
    /* FÄHIGKEIT 1 BESCHREIBUNG                                */
    /* ------------------------------------------------------- */

    if (
      target.name ===
      "abilityFirstDescription"
    ) {

      await this._updateAbilityField(
        "first",
        "description",
        target.value
      );


      return;
    }


    /* ------------------------------------------------------- */
    /* FÄHIGKEIT 2 NAME                                        */
    /* ------------------------------------------------------- */

    if (
      target.name ===
      "abilitySecondName"
    ) {

      await this._updateAbilityField(
        "second",
        "name",
        target.value
      );


      return;
    }


    /* ------------------------------------------------------- */
    /* FÄHIGKEIT 2 BESCHREIBUNG                                */
    /* ------------------------------------------------------- */

    if (
      target.name ===
      "abilitySecondDescription"
    ) {

      await this._updateAbilityField(
        "second",
        "description",
        target.value
      );
    }
  }


  /* ========================================================= */
  /* APPLICATION ACTIONS                                      */
  /* ========================================================= */

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


  static async _actionChangePortrait(
    event,
    target
  ) {

    await this._pickPortrait();
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
  /* NPC DATEN HOLEN                                           */
  /* ========================================================= */

  _getNPCData() {

    const saved =
      this.actor.getFlag(
        "farbmeister-sheet",
        "npc"
      ) ?? {};


    return {

      hp: {

        value:
          Number(
            saved.hp?.value ??
            10
          ),

        max:
          Number(
            saved.hp?.max ??
            10
          )
      },


      symbolImg:
        saved.symbolImg ??
        "icons/svg/mystery-man.svg",


      abilities: {

        first: {

          name:
            saved.abilities
              ?.first
              ?.name ??
            "Fähigkeit 1",

          description:
            saved.abilities
              ?.first
              ?.description ??
            "",

          value:
            Number(
              saved.abilities
                ?.first
                ?.value ??
              0
            )
        },


        second: {

          name:
            saved.abilities
              ?.second
              ?.name ??
            "Fähigkeit 2",

          description:
            saved.abilities
              ?.second
              ?.description ??
            "",

          value:
            Number(
              saved.abilities
                ?.second
                ?.value ??
              0
            )
        }
      }
    };
  }


  /* ========================================================= */
  /* NPC DATEN SPEICHERN                                       */
  /* ========================================================= */

  async _updateNPCData(
    changes
  ) {

    const current =
      this._getNPCData();


    const updated = {

      hp: {
        ...current.hp
      },

      symbolImg:
        current.symbolImg,

      abilities: {

        first: {
          ...current.abilities.first
        },

        second: {
          ...current.abilities.second
        }
      },

      ...changes
    };


    await this.actor.setFlag(
      "farbmeister-sheet",
      "npc",
      updated
    );


    this.render();
  }


  /* ========================================================= */
  /* FÄHIGKEITSFELD ÄNDERN                                     */
  /* ========================================================= */

  async _updateAbilityField(
    abilityKey,
    field,
    value
  ) {

    if (
      ![
        "first",
        "second"
      ].includes(
        abilityKey
      )
    ) {

      return;
    }


    const current =
      this._getNPCData();


    const abilities = {

      first: {
        ...current.abilities.first
      },

      second: {
        ...current.abilities.second
      }
    };


    abilities[
      abilityKey
    ][field] =
      value;


    await this._updateNPCData({
      abilities
    });
  }


  /* ========================================================= */
  /* FÄHIGKEITSSTÄRKE SETZEN                                   */
  /* ========================================================= */

  async _setAbility(
    abilityKey,
    value
  ) {

    if (
      ![
        "first",
        "second"
      ].includes(
        abilityKey
      )
    ) {

      return;
    }


    value =
      Math.max(
        0,
        Math.min(
          10,
          Number(value) || 0
        )
      );


    const current =
      this._getNPCData();


    const abilities = {

      first: {
        ...current.abilities.first
      },

      second: {
        ...current.abilities.second
      }
    };


    abilities[
      abilityKey
    ].value =
      value;


    await this._updateNPCData({
      abilities
    });
  }


  /* ========================================================= */
  /* FÄHIGKEIT WÜRFELN                                        */
  /* ========================================================= */

  async _rollAbility(
    abilityKey
  ) {

    if (
      ![
        "first",
        "second"
      ].includes(
        abilityKey
      )
    ) {

      return;
    }


    const npc =
      this._getNPCData();


    const ability =
      npc.abilities[
        abilityKey
      ];


    const bonus =
      Number(
        ability.value ??
        0
      );


    const safeName =
      foundry.utils.escapeHTML(
        ability.name ||
        "Fähigkeit"
      );

    const safeDescription =
     foundry.utils
      .escapeHTML(
      ability.description ||
      ""
    )
    .replace(
      /\n/g,
      "<br>"
    );


    /*
     * Auch NPCs würfeln:
     *
     * 1d8 + Stärke
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
  <div class="farbmeister-npc-chat-roll">

    <strong>
      ${safeName}
    </strong>

    ${
      safeDescription
        ? `
          <div class="farbmeister-npc-chat-description">
            ${safeDescription}
          </div>
        `
        : ""
    }

    <div class="farbmeister-npc-chat-bonus">
      Fähigkeit: +${bonus}
    </div>

  </div>
`
    });
  }


  /* ========================================================= */
  /* PORTRAIT ÄNDERN                                           */
  /* ========================================================= */

  async _pickPortrait() {

    const FilePicker =
      foundry.applications.apps.FilePicker;


    const picker =
      new FilePicker({

        type:
          "image",

        current:
          this.actor.img,

        callback:
          async path => {

            await this.actor.update({

              img:
                path
            });


            this.render();
          }
      });


    await picker.render({
      force: true
    });
  }

}