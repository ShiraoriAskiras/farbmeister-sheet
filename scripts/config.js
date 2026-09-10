export const FARBMISTER_COLORS = {
  red: {
    label: "Rot",
    magic: "Feuer Magie",
    icon: "🔥",
    accent: "#c91717",

    abilities: {
      attack: {
        label: "Angriff",
        name: "Feuerball",
        description:
          "Der Farbmeister kann einen mächtigen Feuerball erschaffen und auf seine Feinde schleudern."
      },

      defense: {
        label: "Verteidigung",
        name: "Feuerschild",
        description:
          "Der Farbmeister kann einen Schutzschild aus Feuer erschaffen, um sich vor Angriffen zu schützen."
      },

      support: {
        label: "Unterstützung",
        name: "Feueraura",
        description:
          "Der Farbmeister kann eine Aura aus Feuer um sich herum erschaffen, die Verbündete stärkt."
      }
    }
  },


  orange: {
    label: "Orange",
    magic: "Stein Magie",
    icon: "🪨",
    accent: "#ef8617",

    abilities: {
      attack: {
        label: "Angriff",
        name: "Erdbeben",
        description:
          "Der Farbmeister kann den Boden erzittern lassen und so seine Feinde zum Stolpern bringen."
      },

      defense: {
        label: "Verteidigung",
        name: "Steinhaut",
        description:
          "Der Farbmeister kann seine Haut in Stein verwandeln, um sich vor Angriffen zu schützen."
      },

      support: {
        label: "Unterstützung",
        name: "Steinschild",
        description:
          "Der Farbmeister kann einen Schutzschild aus Stein erschaffen, um Verbündete zu schützen."
      }
    }
  },


  yellow: {
    label: "Gelb",
    magic: "Sonnen Magie",
    icon: "☀️",
    accent: "#e6d400",

    abilities: {
      attack: {
        label: "Angriff",
        name: "Sonnenstrahl",
        description:
          "Der Farbmeister kann einen intensiven Strahl aus Sonnenlicht auf seine Feinde lenken."
      },

      defense: {
        label: "Verteidigung",
        name: "Sonnenschild",
        description:
          "Der Farbmeister kann einen Schutzschild aus hellem Licht erschaffen, um sich zu schützen."
      },

      support: {
        label: "Unterstützung",
        name: "Heilendes Licht",
        description:
          "Der Farbmeister kann helles Licht nutzen, um Verbündete zu heilen und ihre Energiereserven wieder aufzufüllen."
      }
    }
  },


  green: {
    label: "Grün",
    magic: "Wald Magie",
    icon: "🌳",
    accent: "#32a852",

    abilities: {
      attack: {
        label: "Angriff",
        name: "Pflanzenranken",
        description:
          "Der Farbmeister kann Ranken aus dem Boden wachsen lassen, um seine Feinde anzugreifen."
      },

      defense: {
        label: "Verteidigung",
        name: "Naturschutz",
        description:
          "Der Farbmeister kann die Natur um sich herum beschwören, um sich vor Angriffen zu schützen."
      },

      support: {
        label: "Unterstützung",
        name: "Lebenskraft",
        description:
          "Der Farbmeister kann die Lebenskraft der Natur nutzen, um Verbündete zu stärken und ihre Energiereserven wieder aufzufüllen."
      }
    }
  },


  lightblue: {
    label: "Hellblau",
    magic: "Wind Magie",
    icon: "💨",
    accent: "#91d8ed",

    abilities: {
      attack: {
        label: "Angriff",
        name: "Luftstoß",
        description:
          "Der Farbmeister kann starke Winde erzeugen und sie auf seine Feinde lenken."
      },

      defense: {
        label: "Verteidigung",
        name: "Luftbarriere",
        description:
          "Der Farbmeister kann eine unsichtbare Barriere aus Luft erschaffen, um sich vor Angriffen zu schützen."
      },

      support: {
        label: "Unterstützung",
        name: "Luftwirbel",
        description:
          "Der Farbmeister kann Wirbelstürme erzeugen, um Gegner zu verwirren und Verbündete zu unterstützen."
      }
    }
  },


  darkblue: {
    label: "Dunkelblau",
    magic: "Wasser Magie",
    icon: "💧",
    accent: "#0862b9",

    abilities: {
      attack: {
        label: "Angriff",
        name: "Wasserspeere",
        description:
          "Der Farbmeister kann scharfe Speere aus Wasser erschaffen und auf seine Feinde schleudern."
      },

      defense: {
        label: "Verteidigung",
        name: "Wasserschild",
        description:
          "Der Farbmeister kann einen Schutzschild aus Wasser erschaffen, um sich vor Angriffen zu schützen."
      },

      support: {
        label: "Unterstützung",
        name: "Heilendes Wasser",
        description:
          "Der Farbmeister kann heilendes Wasser nutzen, um Verbündete zu heilen und ihre Wunden zu lindern."
      }
    }
  },


  purple: {
    label: "Lila",
    magic: "Mond Magie",
    icon: "🌙",
    accent: "#8952a1",

    abilities: {
      attack: {
        label: "Angriff",
        name: "Sternenschauer",
        description:
          "Der Farbmeister kann einen Regen aus Sternschnuppen auf seine Feinde niederprasseln lassen."
      },

      defense: {
        label: "Verteidigung",
        name: "Mondschleier",
        description:
          "Der Farbmeister kann einen Schleier aus Mondlicht erschaffen, um sich vor Angriffen zu schützen."
      },

      support: {
        label: "Unterstützung",
        name: "Sternensegen",
        description:
          "Der Farbmeister kann Segen der Sterne nutzen, um Verbündete zu stärken und ihre Kräfte zu erhöhen."
      }
    }
  }
};


export const FARBMISTER_DEFAULTS = {
  color: "red",
  hp: 25,
  mana: 7,

  abilities: {
    attack: 0,
    defense: 0,
    support: 0
  }
};