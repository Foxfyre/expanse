import { ExpanseActorSheet } from "./actor-sheet.js";
import { ExpanseItemSheet } from "./item-sheet.js";
import { ExpanseItem } from "./item.js";
import { ExpanseActor } from "./actor.js";
import { ExpanseNPCSheet } from "./npc-sheet.js";
import { ExpanseShipSheet } from "./ship-sheet.js";
import { registerDiceSoNice } from "./hooks/dice-so-nice.js";
import { TheExpanseEarthDark } from "./dice-so-nice//expanse-earth-dark-die.js";
import { TheExpanseEarthLight } from "./dice-so-nice//expanse-earth-light-die.js";
import { TheExpanseMarsDark } from "./dice-so-nice//expanse-mars-dark-die.js";
import { TheExpanseMarsLight } from "./dice-so-nice//expanse-mars-light-die.js";
import { TheExpanseBeltDark } from "./dice-so-nice/expanse-belt-dark-die.js";
import { TheExpanseBeltLight } from "./dice-so-nice//expanse-belt-light-die.js";
import { TheExpanseProtogenDark } from "./dice-so-nice//expanse-protogen-dark-die.js";
import { TheExpanseProtogenLight } from "./dice-so-nice//expanse-protogen-light-die.js";

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

  Handlebars.registerHelper('concat', function () {
    let arg = Array.prototype.slice.call(arguments, 0);
    arg.pop();
    return arg.join('');
  })

  Handlebars.registerHelper('ifCond', function (v1, v2, options) {
    if (v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
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

Hooks.on("ready", async () => {
  new Dialog({
    title: "How to use - Notes",
    content: `<p>Thank you for using The Expanse Foundry VTT System during this early release phase! <br><br>
    How to use: On the Player Character Sheets, there are dice icons which look like a 5. This indicate where you can roll with one click. 
    You will find them on the following sections: Abilities, Weapon Entries, Income. When you click these buttons, you will get a straight unmodified roll. 
    If you want to modify your roll, hold down shift when you click the die symbol. 
    <br><br>
    The current goal of the system is to have a functional sheet which balances game-play and sheet automation. We do not want to have the system handle every
    aspect of game play that you come across. We want to give you as much of the table experience in the VTT as possible. 
    <br><br>
    Thank you from the Green Ronin VTT Team!
    </p>`,
    buttons: {
      ok: {
        label: "Ok",
      }
    }
  }).render(true)
})
