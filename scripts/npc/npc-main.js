import {
  FarbmeisterNPCSheet
} from "./npc-sheet.js";


Hooks.once("init", () => {

  console.log(
    "Farbmeister NPC Sheet | Initialisierung"
  );


  const DocumentSheetConfig =
    foundry.applications.apps.DocumentSheetConfig;


  DocumentSheetConfig.registerSheet(
    foundry.documents.Actor,

    /*
     * WICHTIG:
     * Hier muss die ID unseres tatsächlichen
     * Moduls stehen.
     */
    "farbmeister-sheet",

    FarbmeisterNPCSheet,

    {
      label:
        "Farbmeister NPC Sheet",

      /*
       * Nicht automatisch alle Actors übernehmen.
       */
      makeDefault:
        false,

      /*
       * Soll vom Benutzer in der
       * Sheet-Konfiguration auswählbar sein.
       */
      canConfigure:
        true
    }
  );


  console.log(
    "Farbmeister NPC Sheet | Erfolgreich registriert"
  );
});