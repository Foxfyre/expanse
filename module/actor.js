/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

export class ExpanseActor extends Actor {
  /** @override */

  prepareData() {
    super.prepareData();
  }

  _preCreate(data) {
    const path = "systems/expanse/ui/item-img/"
    if (data.type === "ship" && data.img === "icons/svg/mystery-man.svg") {
      data.update({ img: `${path}actor-ship.png` })
    }

    let createData = {};

    if (!data.token) {
      foundry.utils.mergeObject(createData,
        {
          "token.bar1": { "attribute": "attributes.fortune" },                       // Default Bar 1 to Fortune
          "token.displayName": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display name to be on owner hover
          "token.displayBars": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,    // Default display bars to be on owner hover
          "token.disposition": CONST.TOKEN_DISPOSITIONS.NEUTRAL,         // Default disposition to neutral
          "token.name": data.name                                       // Set token name to actor name
        }
      )
    } else if (data.token) {
      createData.token = data.token
    }

    if (data.type == "character") {
      createData.token.vision = true;
      createData.token.actorLink = true;
    }

    this.updateSource(createData);
  }

  prepareEmbeddedEntities() {
  }


  prepareData() {
    const actorData = this.system;

    if (this.type === "character") {
      actorData.attributes.armor.modified = 0;
      actorData.attributes.penalty.modified = 0;
      actorData.attributes.defense.bonus = 0;

      for (let item of this.items) {
        if (item.type === "armor" && item.system.equip === true) {
          actorData.attributes.armor.modified = Number(item.system.bonus);
          actorData.attributes.penalty.modified = Number(item.system.penalty);
        }
        //shields
        if (item.type === "shield" && item.system.equip === true) {
          actorData.attributes.defense.bonus = Number(item.system.bonus);
        }
      }

      actorData.attributes.speed.modified = 10 + Number(actorData.abilities.dexterity.rating) - Number(actorData.attributes.penalty.modified);
      actorData.attributes.defense.modified = 10 + Number(actorData.abilities.dexterity.rating) + Number(actorData.attributes.defense.bonus);
      actorData.attributes.toughness.modified = Number(actorData.abilities.constitution.rating);
      actorData.attributes.move.modified = Number(actorData.attributes.speed.modified);
      actorData.attributes.run.modified = Number(actorData.attributes.speed.modified * 2)

      if (actorData.attributes.level.modified >= 11) {
        actorData.attributes.level.bonus = true;
      }

      if (actorData.conditions.injured.active === true) {
        actorData.conditions.fatigued.active = !actorData.conditions.fatigued.active;
      }
      if (actorData.conditions.hindered.active === true) {
        actorData.attributes.move.modified = actorData.attributes.move.modified / 2;
        actorData.attributes.run.modified = 0;
      }
      if (actorData.conditions.exhausted.active === true || actorData.conditions.prone.active === true || actorData.conditions.fatigued.active === true) {
        actorData.attributes.run.modified = 0;
      }
      if (actorData.conditions.helpless.active === true || actorData.conditions.restrained.active === true) {
        actorData.attributes.run.modified = 0;
        actorData.attributes.move.modified = 0;
      }
      if (actorData.conditions.unconscious.active === true) {
        actorData.conditions.prone.active = true;
        actorData.attributes.move.modified = 0;
        actorData.attributes.run.modified = 0;
      }
    }
    super.prepareData();

  }
}
