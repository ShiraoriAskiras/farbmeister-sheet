import { FarbmeisterActorSheet } from "./sheet.js";
import { FarbmeisterItemSheet } from "./item-sheet.js";
import { FarbmeisterItemData } from "./item-data.js";


export const FARBMEISTER_ITEM_TYPE =
  "farbmeister-sheet.gegenstand";


Hooks.once("init", () => {

  console.log("Farbmeister Sheet | Initialisierung");


  /*
   * Datenmodell für unseren Item-Subtyp.
   */
  CONFIG.Item.dataModels[FARBMEISTER_ITEM_TYPE] =
    FarbmeisterItemData;


  const DocumentSheetConfig =
    foundry.applications.apps.DocumentSheetConfig;


  DocumentSheetConfig.registerSheet(
    foundry.documents.Actor,
    "farbmeister-sheet",
    FarbmeisterActorSheet,
    {
      label: "Farbmeister Character Sheet",
      makeDefault: false,
      canConfigure: true
    }
  );


  DocumentSheetConfig.registerSheet(
    foundry.documents.Item,
    "farbmeister-sheet",
    FarbmeisterItemSheet,
    {
      types: [FARBMEISTER_ITEM_TYPE],
      label: "Farbmeister Gegenstand",
      makeDefault: true
    }
  );


  console.log("Farbmeister Sheet | Sheets registriert");
});


Hooks.once("ready", () => {
  console.log("Farbmeister Sheet | Bereit");
});