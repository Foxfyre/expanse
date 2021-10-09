/**
 * A template for building game systems for Foundry VTT
 * Author: GateKept
 * Software License: CC-BY
 */

import { ExpanseActorSheet } from "./actor-sheet.js";
import { ExpanseItemSheet } from "./item-sheet.js";
import { ExpanseItem } from "./item.js";
import { ExpanseActor } from "./actor.js";
import { ExpanseNPCSheet } from "./npc-sheet.js";
import { ExpanseShipSheet } from "./ship-sheet.js";
import { registerDiceSoNice } from "./hooks/dice-so-nice.js";
import { TheExpanseEarthDark } from "./expanse-earth-dark-die.js";
import { TheExpanseEarthLight } from "./expanse-earth-light-die.js";

Hooks.once("init", async function () {
  console.log(`Initializing A Template`);

  // Define custom Entity classes
  CONFIG.Actor.documentClass = ExpanseActor;
  CONFIG.Item.documentClass = ExpanseItem;
  CONFIG.Combat.initiative = {
    formula: "3d6",
    decimals: 2
  }
  CONFIG.Dice.terms["a"] = TheExpanseEarthDark;
  CONFIG.Dice.terms["l"] = TheExpanseEarthLight;
  
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("expanse", ExpanseActorSheet, {
    types: ["character"],
    makeDefault: true
  });
  Actors.registerSheet("expanse", ExpanseNPCSheet, {
    types: ["npc"],
    makeDefault: true
  });
  Actors.registerSheet("expanse", ExpanseShipSheet, {
    types: ["ship"],
    makeDefault: true
  })
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("expanse", ExpanseItemSheet, {
    makeDefault: true
  });
});


Hooks.once("diceSoNiceReady", (dice3d) => {
  registerDiceSoNice(dice3d);
});


