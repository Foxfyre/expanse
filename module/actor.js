/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

export class ExpanseActor extends Actor {
  /** @override */

  prepareData() {
    super.prepareData();
  }

  _preCreate() {
    const data = this.data;
    const path = "systems/the_expanse/ui/item-img/"
    if (data.type === "ship") {
      data.update({ img: `${path}actor-ship.png` })
    }
  }

  prepareEmbeddedEntities() {
    const actorData = this.data;

    // if armour is equipped, set modified value to bonus. else set to original value
    for (let items of actorData.items) {
      if (items.data.type === "armor" && items.data.data.equip === true) {
        //console.log("Armor is equipped")
        actorData.data.attributes.armor.modified = Number(items.data.data.bonus);
        actorData.data.attributes.penalty.modified = Number(items.data.data.penalty);
      } else if (items.data.type === "armor" && items.data.data.equip === false) {
        actorData.data.attributes.armor.modified = actorData.data.attributes.armor.value;
        actorData.data.attributes.penalty.modified = actorData.data.attributes.penalty.value;
      }
    }

    //shields
    for (let items of actorData.items) {
      if (items.data.type === "shield" && items.data.data.equip === true) {
        actorData.data.attributes.defense.bonus = Number(items.data.data.bonus);
      }
    }
  }


  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;
    if (actorData.type === "character") {
      data.attributes.speed.modified = 10 + Number(data.abilities.dexterity.rating);
      data.attributes.defense.modified = 10 + Number(data.abilities.dexterity.rating) + Number(data.attributes.defense.bonus);
      data.attributes.toughness.modified = Number(data.abilities.constitution.rating);
      data.attributes.move.modified = Number(data.attributes.speed.modified);
      data.attributes.run.modified = Number(data.attributes.speed.modified * 2)

      if (data.attributes.level.modified >= 11) {
        console.log("level 11 or greater detected");
        data.attributes.level.bonus = true;
      }

      if (data.conditions.injured.active === true) {
        data.conditions.fatigued.active = !data.conditions.fatigued.active;
      }
      if (data.conditions.hindered.active === true) {
        data.attributes.move.modified = data.attributes.move.modified / 2;
        data.attributes.run.modified = 0;
      }
      if (data.conditions.exhausted.active === true || data.conditions.prone.active === true || data.conditions.fatigued.active === true) {
        data.attributes.run.modified = 0;
      }
      if (data.conditions.helpless.active === true || data.conditions.restrained.active === true) {
        data.attributes.run.modified = 0;
        data.attributes.move.modified = 0;
      }
      if (data.conditions.unconscious.active === true) {
        data.conditions.prone.active = true;
        data.attributes.move.modified = 0;
        data.attributes.run.modified = 0;
      }
    }
    super.prepareDerivedData();

  }
}