import { ExpanseActorSheet } from "./actor-sheet.js";
import { ExpanseItemSheet } from "./item-sheet.js";
import { ExpanseItem } from "./item.js";
import { ExpanseActor } from "./actor.js";
import { ExpanseNPCSheet } from "./npc-sheet.js";
import { ExpanseShipSheet } from "./ship-sheet.js";
import { registerDiceSoNice } from "./hooks/dice-so-nice.js";
import { TheExpanseEarthDark } from "./expanse-earth-dark-die.js";
import { TheExpanseEarthLight } from "./expanse-earth-light-die.js";
import { TheExpanseMarsDark } from "./expanse-mars-dark-die.js";
import { TheExpanseMarsLight } from "./expanse-mars-light-die.js";
import { TheExpanseBeltDark } from "./expanse-belt-dark-die.js";
import { TheExpanseBeltLight } from "./expanse-belt-light-die.js";
import { TheExpanseProtogenDark } from "./expanse-protogen-dark-die.js";
import { TheExpanseProtogenLight } from "./expanse-protogen-light-die.js";

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
  CONFIG.Dice.terms["c"] = TheExpanseMarsDark;
  CONFIG.Dice.terms["d"] = TheExpanseMarsLight;
  CONFIG.Dice.terms["e"] = TheExpanseBeltDark;
  CONFIG.Dice.terms["f"] = TheExpanseBeltLight;
  CONFIG.Dice.terms["g"] = TheExpanseProtogenDark;
  CONFIG.Dice.terms["h"] = TheExpanseProtogenLight;

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

  Handlebars.registerHelper('concat', function() {
    let arg = Array.prototype.slice.call(arguments, 0);
    arg.pop();
    return arg.join('');
  })
});


Hooks.once("diceSoNiceReady", (dice3d) => {
  registerDiceSoNice(dice3d);
});



Hooks.once("init", () => {
  const debouncedReload = foundry.utils.debounce(() => {
    window.location.reload();
}, 100);

  game.settings.register("the_expanse", "diceStyle", {
    name: "SETTINGS.DiceChoice",
    hint: "SETTINGS.DiceChoiceHint",
    scope: "world",
    config: true,
    default: 0,
    type: String,
    choices: {
      "0": "SETTINGS.EarthDark",
      "1": "SETTINGS.EarthLight",
      "2": "SETTINGS.MarsDark",
      "3": "SETTINGS.MarsLight",
      "4": "SETTINGS.BeltDark",
      "5": "SETTINGS.BeltLight",
      "6": "SETTINGS.ProtoDark",
      "7": "SETTINGS.ProtoLight"
    },
    onChange: debouncedReload
  });
})