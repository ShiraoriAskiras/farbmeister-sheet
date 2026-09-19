import {
  FarbmeisterNPCSheet
} from "./npc-sheet.js";


Hooks.once(
  "init",
  () => {

    console.log(
      "Farbmeister NPC Sheet | Initialisierung"
    );


    const DocumentSheetConfig =
      foundry.applications.apps.DocumentSheetConfig;


    DocumentSheetConfig.registerSheet(
      foundry.documents.Actor,
      "farbmeister-npc-sheet",
      FarbmeisterNPCSheet,
      {
        label:
          "Farbmeister NPC Sheet",

        makeDefault:
          false,

        canConfigure:
          true
      }
    );


    console.log(
      "Farbmeister NPC Sheet | Registriert"
    );
  }
);