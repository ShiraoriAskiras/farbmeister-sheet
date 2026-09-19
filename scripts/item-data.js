const fields = foundry.data.fields;


export class FarbmeisterItemData extends foundry.abstract.TypeDataModel {

  static defineSchema() {

    return {

      description: new fields.HTMLField({
        required: true,
        blank: true,
        initial: ""
      }),

      quantity: new fields.NumberField({
        required: true,
        integer: true,
        min: 0,
        initial: 1
      }),

      /*
       * Wo der Gegenstand liegt.
       * null = noch keinem Slot zugewiesen.
       */
      container: new fields.StringField({
        required: true,
        nullable: true,
        initial: null,
        choices: {
          pocket: "Hosentasche",
          backpack: "Rucksack"
        }
      }),

      slot: new fields.NumberField({
        required: true,
        nullable: true,
        integer: true,
        min: 0,
        initial: null
      })
    };
  }
}