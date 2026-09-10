import { FarbmeisterActorSheet } from "./sheet.js";

Hooks.once("init", () => {

  console.log("Farbmeister Sheet | Initialisierung");

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

  console.log("Farbmeister Sheet | Actor Sheet registriert");
});

Hooks.once("ready", () => {
  console.log("Farbmeister Sheet | Bereit");
});