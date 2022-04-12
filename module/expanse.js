import { ExpanseActorSheet } from "./actor-sheet.js";
import { ExpanseItemSheet } from "./item-sheet.js";
import { ExpanseItem } from "./item.js";
import { ExpanseActor } from "./actor.js";
import { ExpanseNPCSheet } from "./npc-sheet.js";
import { ExpanseShipSheet } from "./ship-sheet.js";
import { registerDiceSoNice } from "./hooks/dice-so-nice.js";
import { TheExpanseEarthDark } from "./dice-so-nice/expanse-earth-dark-die.js";
import { TheExpanseEarthLight } from "./dice-so-nice/expanse-earth-light-die.js";
import { TheExpanseMarsDark } from "./dice-so-nice/expanse-mars-dark-die.js";
import { TheExpanseMarsLight } from "./dice-so-nice/expanse-mars-light-die.js";
import { TheExpanseBeltDark } from "./dice-so-nice/expanse-belt-dark-die.js";
import { TheExpanseBeltLight } from "./dice-so-nice/expanse-belt-light-die.js";
import { TheExpanseProtogenDark } from "./dice-so-nice/expanse-protogen-dark-die.js";
import { TheExpanseProtogenLight } from "./dice-so-nice/expanse-protogen-light-die.js";

Hooks.once("init", async function () {
  console.log(`Initializing A Template`);

  // Define custom Entity classes
  CONFIG.Actor.documentClass = ExpanseActor;
  CONFIG.Item.documentClass = ExpanseItem;
  CONFIG.Combat.initiative = {
    formula: "3d6 + @abilities.dexterity.rating",
    decimals: 2
  }
  CONFIG.Dice.terms["a"] = TheExpanseEarthDark;
  CONFIG.Dice.terms["l"] = TheExpanseEarthLight;
  CONFIG.Dice.terms["c"] = TheExpanseMarsDark;
  CONFIG.Dice.terms["d"] = TheExpanseMarsLight;
  CONFIG.Dice.terms["e"] = TheExpanseBeltDark;
  CONFIG.Dice.terms["r"] = TheExpanseBeltLight;
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

  Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case "&&":
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case "||":
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }

  });
});


Hooks.once("diceSoNiceReady", (dice3d) => {
  registerDiceSoNice(dice3d);
});



Hooks.once("init", () => {
  const debouncedReload = foundry.utils.debounce(() => {
    window.location.reload();
  }, 100);

  game.settings.register("expanse", "diceStyle", {
    name: "SETTINGS.DiceChoice",
    hint: "SETTINGS.DiceChoiceHint",
    scope: "client",
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
    title: "The Expanse RPG",
    content: `<div class="popup">
    <img src="systems/expanse/ui/The expanse RPG logo - black.png" width="350px" height="62px" style="margin-bottom: 10px;">
    <h2>Welcome to <i>The Expanse RPG!</i></h2>
    <p>Green Ronin Publishing is proud to present the official Foundry VTT system for <i>The Expanse RPG</i>! <br><br>
    <h2>How to use</h2>
    <b>Standard Rolling</b>On the character and NPC sheets, the following image indicates rollable buttons. On the NPC sheet, the attribute name is the rollable trigger. 
    <br><br><img src="systems/expanse/ui/earth-5.png" width="25px" height="25px"><br>
    <b>Modified Rolls</b>If you need to modify a roll, whether by adding a modifier or more dice (damage rolls only), hold SHIFT and click the rollable button.<br><br>
    <h2>Feedback</h2>
    In an effort to improve, we're always open to feedback. 
    <ul>
    <li>You can use the <a href="https://github.com/Foxfyre/expanse/issues">Issues tab</a> on GitHub to report bugs</li>
    <li>Join us on the <a href="https://discord.gg/MJQQd6H">GRAAD Discord</a></li>
    <li>Or send us an email at <a href="mailto:letsplay@greenronin.com">LetsPlay@GreenRonin.com</a></li>
    </ul>
    <p>Thank you on behalf of Green Ronin Publishing!
    <br><br>
    <p><i>The Expanse Roleplaying Game</i> is ©2019 Green Ronin Publishing, LLC. All rights reserved. First Printing. References to other copyrighted material
            in no way constitute a challenge to the respective copyright holders of that material. Green Ronin, <i>The Expanse Roleplaying Game</i>,
            and their associated logos are trademarks of Green Ronin Publishing, LLC. The Expanse is © 2011-2019 Daniel Abraham and Ty Franck.</br>
            <div class="popup-img"><img src="systems/expanse/ui//roninlogo02_color300.png" width="69" height="120" />    <img src="systems/expanse/ui/AGE_logo_Expanse.png" width="161" height="100" /></div>
    </p></div>`,
    buttons: {
      ok: {
        label: "Here comes the juice!",
      }
    }
  }).render(true)
})
